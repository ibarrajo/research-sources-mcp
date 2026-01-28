import { z } from 'zod';
import { searchNewspapers } from '../sources/chronicling-america.js';
import { searchWikiTree } from '../sources/wikitree.js';
import { searchOpenArchives } from '../sources/open-archives.js';
import { cacheExternalMatch } from '../cache/db.js';

export const CrossReferencePersonSchema = z.object({
  given_name: z.string().describe('Given/first name'),
  surname: z.string().describe('Surname/last name'),
  birth_year: z.string().optional().describe('Birth year (YYYY)'),
  birth_place: z.string().optional().describe('Birth place'),
  death_year: z.string().optional().describe('Death year (YYYY)'),
  death_place: z.string().optional().describe('Death place'),
  sources_to_search: z.array(z.enum(['newspapers', 'wikitree', 'openarch', 'all'])).default(['all']).describe('Which sources to search'),
  person_id: z.string().optional().describe('FamilySearch person ID to associate results with'),
});

export async function handleCrossReferencePerson(args: z.infer<typeof CrossReferencePersonSchema>): Promise<string> {
  const fullName = `${args.given_name} ${args.surname}`;
  const searchAll = args.sources_to_search.includes('all');

  const results: {
    newspapers?: unknown[];
    wikitree?: unknown[];
    openarch?: unknown[];
  } = {};

  // Search all sources in parallel
  const promises: Promise<void>[] = [];

  // Chronicling America (newspapers)
  if (searchAll || args.sources_to_search.includes('newspapers')) {
    promises.push(
      searchNewspapers({
        query: fullName,
        state: args.birth_place ? extractState(args.birth_place) : undefined,
        startDate: args.birth_year ? `${args.birth_year}-01-01` : undefined,
        endDate: args.death_year ? `${args.death_year}-12-31` : undefined,
      }).then(data => {
        results.newspapers = data.items;
        // Cache results
        for (const item of data.items) {
          cacheExternalMatch(
            args.person_id ?? null,
            'chronicling_america',
            item.id,
            item.url,
            item.title,
            item.snippet,
            0.5,
            JSON.stringify(item)
          );
        }
      }).catch((err: unknown) => {
        const message = err instanceof Error ? err.message : 'Unknown error';
        results.newspapers = [{ error: message }];
      })
    );
  }

  // WikiTree
  if (searchAll || args.sources_to_search.includes('wikitree')) {
    promises.push(
      searchWikiTree({
        firstName: args.given_name,
        lastName: args.surname,
        birthDate: args.birth_year,
        deathDate: args.death_year,
        birthLocation: args.birth_place,
        deathLocation: args.death_place,
      }).then(data => {
        results.wikitree = data;
        // Cache results
        for (const person of data) {
          cacheExternalMatch(
            args.person_id ?? null,
            'wikitree',
            person.id,
            person.url,
            person.name,
            `${person.firstName} ${person.lastName}, b. ${person.birthDate}, d. ${person.deathDate}`,
            0.7,
            JSON.stringify(person)
          );
        }
      }).catch((err: unknown) => {
        const message = err instanceof Error ? err.message : 'Unknown error';
        results.wikitree = [{ error: message }];
      })
    );
  }

  // Open Archives (if European locations detected)
  if ((searchAll || args.sources_to_search.includes('openarch')) && isEuropeanLocation(args.birth_place, args.death_place)) {
    promises.push(
      searchOpenArchives({
        name: fullName,
        birthYear: args.birth_year,
        deathYear: args.death_year,
        place: args.birth_place ?? args.death_place,
      }).then(data => {
        results.openarch = data;
        // Cache results
        for (const record of data) {
          cacheExternalMatch(
            args.person_id ?? null,
            'openarch',
            record.id,
            record.archiveUrl,
            record.title,
            `${record.date} - ${record.place}`,
            0.6,
            JSON.stringify(record)
          );
        }
      }).catch((err: unknown) => {
        const message = err instanceof Error ? err.message : 'Unknown error';
        results.openarch = [{ error: message }];
      })
    );
  }

  // Wait for all searches to complete
  await Promise.all(promises);

  return JSON.stringify({
    person: {
      given_name: args.given_name,
      surname: args.surname,
      birth_year: args.birth_year,
      death_year: args.death_year,
    },
    sources_searched: Object.keys(results),
    results,
    total_results: (results.newspapers?.length ?? 0) + (results.wikitree?.length ?? 0) + (results.openarch?.length ?? 0),
  }, null, 2);
}

function extractState(place: string): string | undefined {
  const states = [
    'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut',
    'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa',
    'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan',
    'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire',
    'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio',
    'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
    'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia',
    'Wisconsin', 'Wyoming'
  ];

  for (const state of states) {
    if (place.includes(state)) {
      return state;
    }
  }
  return undefined;
}

function isEuropeanLocation(birthPlace?: string, deathPlace?: string): boolean {
  const europeanKeywords = ['Netherlands', 'Belgium', 'France', 'Amsterdam', 'Rotterdam', 'Brussels', 'Paris', 'NL', 'BE', 'FR'];
  const places = [birthPlace ?? '', deathPlace ?? ''].join(' ').toLowerCase();
  return europeanKeywords.some(keyword => places.includes(keyword.toLowerCase()));
}
