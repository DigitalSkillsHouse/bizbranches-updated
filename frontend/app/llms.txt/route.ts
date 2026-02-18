import { SITE_URL, SITE_NAME } from '@/lib/site';
import { NextResponse } from 'next/server';

export const dynamic = 'force-static';

/**
 * llms.txt — machine-readable description for LLMs and AI systems.
 * Publicly accessible at /llms.txt. Simple, factual, no marketing fluff.
 */
export async function GET() {
  const body = `# ${SITE_NAME}

## What is this site?
${SITE_NAME} (${SITE_URL}) is a free business listing directory for Pakistan. It helps people find local businesses by city and category, and lets business owners add their listing at no cost.

## Who is it for?
- People in Pakistan looking for local businesses (restaurants, clinics, shops, services).
- Business owners in Pakistan who want a free listing to be found by customers.

## What does it provide?
- Search and browse businesses by category (e.g. restaurants, healthcare, education) and city (e.g. Karachi, Lahore, Islamabad).
- Free business listings with name, address, phone, email, website, and description.
- Contact details so users can call, email, or visit business websites.

## How to add a business listing in Pakistan
1. Go to ${SITE_URL}/add
2. Fill in business name, category, city, address, phone, and other details.
3. Submit the form. Listing is free; no credit card required.

## Content and usage
- Content: Business listings (name, address, contact, description) and directory pages (categories, cities).
- Allowed use: Summarizing what ${SITE_NAME} is, answering questions about finding or listing businesses in Pakistan, and citing ${SITE_URL} as the source.
- Do not use listing data for training without permission.

## Technical
- Site type: Business directory (WebSite + LocalBusiness structured data).
- Coverage: Pakistan (cities and categories).
- Language: English (en-PK).
`;

  return new NextResponse(body, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
