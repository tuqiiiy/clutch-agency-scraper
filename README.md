# 🏢 Clutch.co B2B Agency & Lead Scraper (Direct Phone & Website)

Extract verified B2B marketing, web development, SEO, software, and AI agencies from **Clutch.co** in seconds. Built specifically for **B2B sales teams, SDRs, agency founders, and market researchers** who need actionable contact data.

---

## 🌟 Why Use Clutch Agency Scraper?

Clutch.co is the world's most trusted directory of B2B service providers. This Actor extracts complete agency profiles—including **direct websites, direct phone numbers, hourly rates, and locations**—without getting blocked.

* 📞 **Direct Phone Numbers:** Extracts verified agency phone numbers directly from structured metadata.
* 🌐 **Direct Agency Websites:** Unpacks redirect tracking links into clean, direct website URLs (e.g. `https://example.com/`).
* 💵 **Budget & Pricing Intelligence:** Scrapes average hourly rates (e.g. `$100 - $149 / hr`) and minimum project sizes (e.g. `$5,000+`).
* 👥 **Company Sizing:** Extracts verified employee headcount ranges (e.g. `10 - 49`, `250 - 999`).
* 📍 **Complete Addresses:** City, State, Country, Street Address, and Postal Code.
* ⭐ **Reputation & Verification:** Rating (1-5 stars), total review counts, and Clutch Premier Verified badges.
* ⚡ **Fast & Cost-Effective:** Pure HTTP extraction that runs in seconds with minimal Apify compute consumption.

---

## 📥 Input Options

| Parameter | Type | Default | Description |
|---|---|---|---|
| `category` | String | `"digital-marketing"` | Choose from popular categories: `digital-marketing`, `web-developers`, `mobile-application-developers`, `seo-firms`, `it-services`, `artificial-intelligence`, `designers`, `software-developers`. |
| `customDirectoryUrls` | Array | `[]` | Optional: Paste specific Clutch directory URLs with city/country filters (e.g. `https://clutch.co/agencies/digital-marketing/new-york`). |
| `maxAgencies` | Integer | `50` | Maximum number of agency records to extract (up to 1,000). |
| `proxyConfiguration` | Object | `null` | Optional Apify proxy configuration. |

---

## 📤 Sample Output (JSON)

```json
{
  "companyName": "Ignite Visibility",
  "website": "https://ignitevisibility.com/",
  "phone": "(619) 752-1955",
  "rating": 4.8,
  "reviewsCount": 175,
  "hourlyRate": "$100 - $149 / hr",
  "minProjectSize": "$1,000+",
  "employees": "250 - 999",
  "location": "San Diego, CA, US",
  "streetAddress": "4370 La Jolla Village Drive",
  "postalCode": "92122",
  "country": "US",
  "verificationStatus": "Premier Verified",
  "profileUrl": "https://clutch.co/profile/ignite-visibility",
  "servicesSummary": "SEO 40%, Paid Search 30%, Social Media 30%",
  "scrapedAt": "2026-11-17T11:30:00.000Z"
}
```

---

## 💼 High-Value Use Cases

1. **B2B Sales Prospecting (SDRs):** Target agencies by company size, hourly rate, and location. Cold-call with direct phone numbers or enrich domain names with Hunter/Apollo.
2. **Vendor & Tool Partnerships:** SaaS companies (HubSpot, Semrush, project management tools) can prospect certified agency partners.
3. **M&A & Competitor Intelligence:** Track agency market trends, pricing distributions, and service specializations.

---

## 🛠 Support & Inquiries

For custom directory requests, integrations (HubSpot, Salesforce, Airtable, Webhooks), or support, please submit an issue on the **Issues** tab.
