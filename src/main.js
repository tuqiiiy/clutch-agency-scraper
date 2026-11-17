import { Actor, log } from 'apify';
import { gotScraping } from 'got-scraping';
import * as cheerio from 'cheerio';

await Actor.init();

const input = (await Actor.getInput()) || {};
const {
    category = 'digital-marketing',
    customDirectoryUrls = [],
    maxAgencies = 50,
    proxyConfiguration,
} = input;

const proxyConfig = proxyConfiguration ? await Actor.createProxyConfiguration(proxyConfiguration) : undefined;

const CATEGORY_URLS = {
    'digital-marketing': 'https://clutch.co/agencies/digital-marketing',
    'web-developers': 'https://clutch.co/web-developers',
    'mobile-application-developers': 'https://clutch.co/app-developers',
    'seo-firms': 'https://clutch.co/seo-firms',
    'it-services': 'https://clutch.co/it-services',
    'artificial-intelligence': 'https://clutch.co/developers/artificial-intelligence',
    'designers': 'https://clutch.co/agencies/design',
    'software-developers': 'https://clutch.co/developers',
};

/**
 * Fetch HTML page with got-scraping (browser TLS fingerprinting)
 */
async function fetchHtml(url) {
    const proxyUrl = proxyConfig ? await proxyConfig.newUrl() : undefined;
    try {
        const response = await gotScraping({
            url,
            proxyUrl,
            headers: {
                'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                'accept-language': 'en-US,en;q=0.9',
                'cache-control': 'no-cache',
                'pragma': 'no-cache',
                'sec-ch-ua': '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
                'sec-ch-ua-mobile': '?0',
                'sec-ch-ua-platform': '"Windows"',
                'sec-fetch-dest': 'document',
                'sec-fetch-mode': 'navigate',
                'sec-fetch-site': 'none',
                'sec-fetch-user': '?1',
                'upgrade-insecure-requests': '1',
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            },
            timeout: { request: 25000 },
            retry: { limit: 2 },
        });
        return response.body;
    } catch (error) {
        log.warning(`Failed to fetch ${url}: ${error.message}`);
        return null;
    }
}

/**
 * Extract clean website from Clutch redirect tracking link
 */
function extractTargetWebsite(rawHref) {
    if (!rawHref) return null;
    if (rawHref.startsWith('http') && !rawHref.includes('clutch.co')) {
        return rawHref;
    }
    try {
        const parsed = new URL(rawHref, 'https://clutch.co');
        const target = parsed.searchParams.get('u');
        if (target) {
            return decodeURIComponent(target);
        }
    } catch {
        // Fallback
    }
    return null;
}

/**
 * Parse agency card element
 */
function parseAgencyRow($, el) {
    const card = $(el);

    // Company Name
    const nameMeta = card.find('meta[itemprop="name"]').attr('content');
    const nameLink = card.find('h3.provider__title a, a.company-name, h3 a').first().text().trim();
    const companyName = nameMeta || nameLink;
    if (!companyName) return null;

    // Profile URL
    const relProfile = card.find('h3.provider__title a, a.directory_profile').attr('href');
    const profileUrl = relProfile
        ? (relProfile.startsWith('http') ? relProfile : `https://clutch.co${relProfile.startsWith('/') ? '' : '/'}${relProfile}`)
        : null;

    // Phone Number
    const phone = card.find('meta[itemprop="telephone"]').attr('content') || null;

    // Direct Website Link
    let rawWebsiteHref = card.find('a[data-link_text="Visit Website"], a.website-link__common, a[href*="redirect?"]').attr('href');
    if (!rawWebsiteHref) {
        card.find('a').each((_, a) => {
            const h = $(a).attr('href') || '';
            if (h.includes('/redirect?') && h.includes('u=')) {
                rawWebsiteHref = h;
            }
        });
    }
    const website = extractTargetWebsite(rawWebsiteHref);

    // Rating & Reviews
    const ratingText = card.find('.sg-rating__number, meta[itemprop="ratingValue"]').first().text().trim() ||
        card.find('meta[itemprop="ratingValue"]').attr('content') || null;
    const rating = ratingText ? parseFloat(ratingText) || null : null;

    const reviewsCountMeta = card.find('meta[itemprop="reviewCount"]').attr('content');
    const reviewsText = card.find('.sg-rating__reviews, .reviews-count').text().trim().replace(/[^\d]/g, '');
    const reviewsCount = reviewsCountMeta ? parseInt(reviewsCountMeta, 10) : (reviewsText ? parseInt(reviewsText, 10) : 0);

    // Hourly Rate
    const hourlyRateMeta = card.find('meta[itemprop="priceRange"]').attr('content');
    const hourlyRateText = card.find('.hourly-rate').text().trim().replace(/\s+/g, ' ');
    const hourlyRate = hourlyRateMeta || (hourlyRateText ? hourlyRateText.replace('Avg. hourly rate', '').trim() : null);

    // Min Project Size
    const minProjectText = card.find('.min-project-size').text().trim().replace(/\s+/g, ' ');
    const minProjectSize = minProjectText ? minProjectText.replace('Min. project size', '').trim() : null;

    // Employees
    const employeesText = card.find('.employees-count').text().trim().replace(/\s+/g, ' ');
    const employees = employeesText ? employeesText.replace('Employees', '').trim() : null;

    // Address & Location
    const locality = card.find('meta[itemprop="addressLocality"]').attr('content');
    const region = card.find('meta[itemprop="addressRegion"]').attr('content');
    const country = card.find('meta[itemprop="addressCountry"]').attr('content');
    const streetAddress = card.find('meta[itemprop="streetAddress"]').attr('content') || null;
    const postalCode = card.find('meta[itemprop="postalCode"]').attr('content') || null;

    let location = [locality, region, country].filter(Boolean).join(', ');
    if (!location) {
        location = card.find('.location, .locality').text().trim().replace(/\s+/g, ' ') || null;
    }

    // Verification Status
    const verifiedText = card.find('.provider__verified-mark').text().trim();
    const verificationStatus = verifiedText ? (verifiedText.includes('Premier') ? 'Premier Verified' : 'Verified') : 'Unverified';

    // Services summary
    const services = [];
    card.find('.provider__services-list li, .chart-title').each((_, s) => {
        const txt = $(s).text().trim().replace(/\s+/g, ' ');
        if (txt) services.push(txt);
    });

    return {
        companyName,
        website,
        phone,
        rating,
        reviewsCount,
        hourlyRate,
        minProjectSize,
        employees,
        location,
        streetAddress,
        postalCode,
        country: country || null,
        verificationStatus,
        profileUrl,
        servicesSummary: services.length > 0 ? services.join(', ') : null,
        scrapedAt: new Date().toISOString(),
    };
}

// -------------------------------------------------------------
// MAIN WORKFLOW EXECUTION
// -------------------------------------------------------------

log.info('--- Starting Clutch.co B2B Agency & Lead Scraper ---');
log.info(`Target Max Agencies: ${maxAgencies}`);

const targetUrls = [];

if (Array.isArray(customDirectoryUrls) && customDirectoryUrls.length > 0) {
    for (const u of customDirectoryUrls) {
        if (u && typeof u === 'string') targetUrls.push(u.trim());
    }
    log.info(`Using ${targetUrls.length} custom directory URLs.`);
} else {
    const selectedUrl = CATEGORY_URLS[category] || CATEGORY_URLS['digital-marketing'];
    targetUrls.push(selectedUrl);
    log.info(`Scraping category: "${category}" (${selectedUrl})`);
}

let totalScraped = 0;
const seenCompanies = new Set();

for (const baseUrl of targetUrls) {
    if (totalScraped >= maxAgencies) break;

    let page = 0;
    let hasMore = true;

    while (hasMore && totalScraped < maxAgencies) {
        const pageUrl = page === 0 ? baseUrl : `${baseUrl}?page=${page}`;
        log.info(`\nFetching page ${page + 1}: ${pageUrl}`);

        const html = await fetchHtml(pageUrl);
        if (!html) {
            log.warning(`Could not fetch HTML for ${pageUrl}. Moving on.`);
            break;
        }

        const $ = cheerio.load(html);
        const rows = $('.directory-list__item, .provider-row, li.provider');
        log.info(`Found ${rows.length} agency cards on page ${page + 1}.`);

        if (rows.length === 0) {
            log.info('No more agency cards found on this page.');
            break;
        }

        let pageExtracted = 0;
        for (let i = 0; i < rows.length; i++) {
            if (totalScraped >= maxAgencies) break;

            const record = parseAgencyRow($, rows[i]);
            if (!record || !record.companyName) continue;

            const uniqueKey = record.profileUrl || record.companyName.toLowerCase();
            if (seenCompanies.has(uniqueKey)) continue;
            seenCompanies.add(uniqueKey);

            await Actor.pushData(record);
            totalScraped++;
            pageExtracted++;

            log.info(`[${totalScraped}] "${record.companyName}" | Phone: ${record.phone || 'N/A'} | Website: ${record.website || 'N/A'} | Rate: ${record.hourlyRate || 'N/A'} | ${record.location || ''}`);
        }

        log.info(`Extracted ${pageExtracted} new agencies from page ${page + 1}. Total so far: ${totalScraped}/${maxAgencies}`);

        // Check if there is a next page
        const hasNextPage = $('a.page-link[rel="next"], li.next a, a[title="Next page"]').length > 0 || rows.length >= 20;
        if (!hasNextPage) {
            log.info('Reached the last page for this directory.');
            break;
        }

        page++;
        // Polite delay
        await new Promise((r) => setTimeout(r, 700));
    }
}

log.info(`\n🎉 Scraping completed successfully! Total B2B agencies extracted: ${totalScraped}`);
await Actor.exit();
