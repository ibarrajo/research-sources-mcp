import { z } from 'zod';
import {
  searchNewspapers,
  getNewspaperPage,
  type NewspaperSearchParams,
  type NewspaperPageParams,
} from '../sources/chronicling-america.js';
import { cacheExternalMatch } from '../cache/db.js';

export const SearchNewspapersSchema = z.object({
  query: z.string().describe('Search query (person name, event, etc.)'),
  state: z.string().optional().describe('US state code (e.g., "California", "Texas")'),
  start_date: z.string().optional().describe('Start date (YYYY-MM-DD)'),
  end_date: z.string().optional().describe('End date (YYYY-MM-DD)'),
  page: z.number().min(1).default(1).describe('Result page number'),
});

export async function handleSearchNewspapers(
  args: z.infer<typeof SearchNewspapersSchema>
): Promise<string> {
  const params: NewspaperSearchParams = {
    query: args.query,
    state: args.state,
    startDate: args.start_date,
    endDate: args.end_date,
    page: args.page,
  };

  const results = await searchNewspapers(params);

  // Cache results
  for (const item of results.items) {
    cacheExternalMatch(
      null, // No specific person ID for open-ended searches
      'chronicling_america',
      item.id,
      item.url,
      item.title,
      item.snippet,
      0.5, // Arbitrary score for newspaper mentions
      JSON.stringify(item)
    );
  }

  return JSON.stringify(
    {
      total: results.totalItems,
      count: results.items.length,
      page: args.page,
      items: results.items.map((item) => ({
        id: item.id,
        title: item.title,
        date: item.date,
        page: item.page,
        url: item.url,
        snippet: item.snippet,
      })),
    },
    null,
    2
  );
}

export const GetNewspaperPageSchema = z.object({
  lccn: z.string().describe('Library of Congress Control Number (LCCN)'),
  date: z.string().describe('Date of publication (YYYY-MM-DD)'),
  page: z.number().min(1).describe('Page number'),
  edition: z.number().min(1).optional().describe('Edition number (default 1)'),
});

export async function handleGetNewspaperPage(
  args: z.infer<typeof GetNewspaperPageSchema>
): Promise<string> {
  const params: NewspaperPageParams = {
    lccn: args.lccn,
    date: args.date,
    page: args.page,
    edition: args.edition,
  };

  const result = await getNewspaperPage(params);

  return JSON.stringify(
    {
      url: result.url,
      image_url: result.imageUrl,
      ocr_text: result.ocrText.substring(0, 5000), // Limit OCR text length
      ocr_length: result.ocrText.length,
    },
    null,
    2
  );
}
