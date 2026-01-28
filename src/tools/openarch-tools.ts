import { z } from 'zod';
import { searchOpenArchives, type OpenArchivesSearchParams } from '../sources/open-archives.js';
import { cacheExternalMatch } from '../cache/db.js';

export const SearchOpenArchivesSchema = z.object({
  name: z.string().optional().describe('Person name to search'),
  birth_year: z.string().optional().describe('Birth year (YYYY)'),
  death_year: z.string().optional().describe('Death year (YYYY)'),
  place: z.string().optional().describe('Place name'),
  source_type: z.enum(['civil', 'church', 'notary', 'all']).default('all').describe('Type of records to search'),
  country_code: z.enum(['NL', 'BE', 'FR']).optional().describe('Country code (NL=Netherlands, BE=Belgium, FR=France)'),
  limit: z.number().min(1).max(100).default(20).describe('Max results'),
});

export async function handleSearchOpenArchives(args: z.infer<typeof SearchOpenArchivesSchema>): Promise<string> {
  const params: OpenArchivesSearchParams = {
    name: args.name,
    birthYear: args.birth_year,
    deathYear: args.death_year,
    place: args.place,
    sourceType: args.source_type,
    countryCode: args.country_code,
    limit: args.limit,
  };

  const results = await searchOpenArchives(params);

  // Cache results
  for (const record of results) {
    cacheExternalMatch(
      null,
      'openarch',
      record.id,
      record.archiveUrl,
      record.title,
      `${record.date} - ${record.place} - ${record.personNames.join(', ')}`,
      0.6,
      JSON.stringify(record)
    );
  }

  return JSON.stringify({
    count: results.length,
    results: results.map(r => ({
      id: r.id,
      title: r.title,
      date: r.date,
      place: r.place,
      source_type: r.sourceType,
      person_names: r.personNames,
      url: r.archiveUrl,
      image_url: r.imageUrl,
    })),
  }, null, 2);
}
