/**
 * WikiTree API - Collaborative genealogy tree
 * API: https://github.com/wikitree/wikitree-api
 * No API key required, but rate-limited
 */

const BASE_URL = 'https://api.wikitree.com/api.php';

export interface WikiTreeSearchParams {
  firstName?: string;
  lastName?: string;
  birthDate?: string; // YYYY
  deathDate?: string; // YYYY
  birthLocation?: string;
  deathLocation?: string;
  limit?: number;
}

export interface WikiTreePerson {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  deathDate: string;
  birthLocation: string;
  deathLocation: string;
  privacy: number;
  url: string;
}

export async function searchWikiTree(params: WikiTreeSearchParams): Promise<WikiTreePerson[]> {
  // Build the search fields
  const fields: Record<string, string> = {};

  if (params.firstName) fields['FirstName'] = params.firstName;
  if (params.lastName) fields['LastName'] = params.lastName;
  if (params.birthDate) fields['BirthDate'] = params.birthDate;
  if (params.deathDate) fields['DeathDate'] = params.deathDate;
  if (params.birthLocation) fields['BirthLocation'] = params.birthLocation;
  if (params.deathLocation) fields['DeathLocation'] = params.deathLocation;

  const body = JSON.stringify({
    action: 'searchPerson',
    fields: Object.keys(fields).join(','),
    ...fields,
    Limit: params.limit ?? 20,
  });

  const response = await fetch(BASE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'FamilyTreeResearch/1.0',
    },
    body,
  });

  if (!response.ok) {
    throw new Error(`WikiTree API error: ${response.status}`);
  }

  const data = (await response.json()) as {
    status?: number;
    matches?: Array<{
      user_id?: number;
      Name?: string;
      FirstName?: string;
      LastNameAtBirth?: string;
      BirthDate?: string;
      DeathDate?: string;
      BirthLocation?: string;
      DeathLocation?: string;
      Privacy?: number;
    }>;
  };

  if (data.status !== 0 || !data.matches) {
    return [];
  }

  return data.matches.map((match) => ({
    id: String(match.user_id ?? ''),
    name: match.Name ?? 'Unknown',
    firstName: match.FirstName ?? '',
    lastName: match.LastNameAtBirth ?? '',
    birthDate: match.BirthDate ?? '',
    deathDate: match.DeathDate ?? '',
    birthLocation: match.BirthLocation ?? '',
    deathLocation: match.DeathLocation ?? '',
    privacy: match.Privacy ?? 0,
    url: `https://www.wikitree.com/wiki/${match.Name}`,
  }));
}

export async function getWikiTreePerson(wikiTreeId: string): Promise<WikiTreePerson | null> {
  const body = JSON.stringify({
    action: 'getPerson',
    key: wikiTreeId,
    fields:
      'Id,Name,FirstName,LastNameAtBirth,BirthDate,DeathDate,BirthLocation,DeathLocation,Privacy',
  });

  const response = await fetch(BASE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'FamilyTreeResearch/1.0',
    },
    body,
  });

  if (!response.ok) {
    throw new Error(`WikiTree API error: ${response.status}`);
  }

  const data = (await response.json()) as {
    status?: number;
    person?: {
      Id?: number;
      Name?: string;
      FirstName?: string;
      LastNameAtBirth?: string;
      BirthDate?: string;
      DeathDate?: string;
      BirthLocation?: string;
      DeathLocation?: string;
      Privacy?: number;
    };
  };

  if (data.status !== 0 || !data.person) {
    return null;
  }

  const p = data.person;
  return {
    id: String(p.Id ?? ''),
    name: p.Name ?? 'Unknown',
    firstName: p.FirstName ?? '',
    lastName: p.LastNameAtBirth ?? '',
    birthDate: p.BirthDate ?? '',
    deathDate: p.DeathDate ?? '',
    birthLocation: p.BirthLocation ?? '',
    deathLocation: p.DeathLocation ?? '',
    privacy: p.Privacy ?? 0,
    url: `https://www.wikitree.com/wiki/${p.Name}`,
  };
}
