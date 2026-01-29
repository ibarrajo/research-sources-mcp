import { z } from 'zod';
import {
  searchWikiTree,
  getWikiTreePerson,
  type WikiTreeSearchParams,
} from '../sources/wikitree.js';
import { cacheExternalMatch } from '../cache/db.js';

export const SearchWikiTreeSchema = z.object({
  first_name: z.string().optional().describe('First/given name'),
  last_name: z.string().optional().describe('Last/surname'),
  birth_date: z.string().optional().describe('Birth year (YYYY)'),
  death_date: z.string().optional().describe('Death year (YYYY)'),
  birth_location: z.string().optional().describe('Birth location'),
  death_location: z.string().optional().describe('Death location'),
  limit: z.number().min(1).max(100).default(20).describe('Max results'),
});

export async function handleSearchWikiTree(
  args: z.infer<typeof SearchWikiTreeSchema>
): Promise<string> {
  const params: WikiTreeSearchParams = {
    firstName: args.first_name,
    lastName: args.last_name,
    birthDate: args.birth_date,
    deathDate: args.death_date,
    birthLocation: args.birth_location,
    deathLocation: args.death_location,
    limit: args.limit,
  };

  const results = await searchWikiTree(params);

  // Cache results
  for (const person of results) {
    cacheExternalMatch(
      null,
      'wikitree',
      person.id,
      person.url,
      person.name,
      `${person.firstName} ${person.lastName}, b. ${person.birthDate}, d. ${person.deathDate}`,
      0.7, // Higher score for WikiTree matches
      JSON.stringify(person)
    );
  }

  return JSON.stringify(
    {
      count: results.length,
      results: results.map((p) => ({
        id: p.id,
        name: p.name,
        first_name: p.firstName,
        last_name: p.lastName,
        birth_date: p.birthDate,
        death_date: p.deathDate,
        birth_location: p.birthLocation,
        death_location: p.deathLocation,
        url: p.url,
        privacy: p.privacy,
      })),
    },
    null,
    2
  );
}

export const GetWikiTreePersonSchema = z.object({
  wikitree_id: z.string().describe('WikiTree person ID (e.g., "Smith-12345")'),
});

export async function handleGetWikiTreePerson(
  args: z.infer<typeof GetWikiTreePersonSchema>
): Promise<string> {
  const person = await getWikiTreePerson(args.wikitree_id);

  if (!person) {
    return JSON.stringify({ error: 'Person not found' });
  }

  return JSON.stringify(
    {
      id: person.id,
      name: person.name,
      first_name: person.firstName,
      last_name: person.lastName,
      birth_date: person.birthDate,
      death_date: person.deathDate,
      birth_location: person.birthLocation,
      death_location: person.deathLocation,
      url: person.url,
      privacy: person.privacy,
    },
    null,
    2
  );
}
