/**
 * Open Archives (OpenArchieven.nl) - Dutch, Belgian, and French historical records
 * API: https://www.openarchieven.nl/api/
 * Free access, no API key required
 */

const BASE_URL = 'https://api.openarch.nl/2.0';

export interface OpenArchivesSearchParams {
  name?: string;
  birthYear?: string;
  deathYear?: string;
  place?: string;
  sourceType?: 'civil' | 'church' | 'notary' | 'all';
  countryCode?: 'NL' | 'BE' | 'FR';
  limit?: number;
}

export interface OpenArchivesResult {
  id: string;
  title: string;
  date: string;
  place: string;
  sourceType: string;
  personNames: string[];
  archiveUrl: string;
  imageUrl?: string;
}

export async function searchOpenArchives(
  params: OpenArchivesSearchParams
): Promise<OpenArchivesResult[]> {
  const searchParams = new URLSearchParams();

  if (params.name) {
    searchParams.set('search', params.name);
  }
  if (params.place) {
    searchParams.set('place', params.place);
  }
  if (params.birthYear) {
    searchParams.set('yearFrom', params.birthYear);
  }
  if (params.deathYear) {
    searchParams.set('yearTo', params.deathYear);
  }
  if (params.sourceType && params.sourceType !== 'all') {
    searchParams.set('type', params.sourceType);
  }
  if (params.countryCode) {
    searchParams.set('country', params.countryCode);
  }

  searchParams.set('rows', String(params.limit ?? 20));
  searchParams.set('format', 'json');

  const url = `${BASE_URL}/search?${searchParams.toString()}`;

  const response = await fetch(url, {
    headers: { 'User-Agent': 'FamilyTreeResearch/1.0' },
  });

  if (!response.ok) {
    throw new Error(`Open Archives API error: ${response.status}`);
  }

  const data = (await response.json()) as {
    response?: {
      docs?: Array<{
        id?: string;
        title?: string[];
        date?: string;
        place?: string[];
        type?: string;
        personNames?: string[];
        url?: string;
        imageUrl?: string;
      }>;
    };
  };

  const docs = data.response?.docs ?? [];

  return docs.map((doc) => ({
    id: doc.id ?? '',
    title: (doc.title ?? [])[0] ?? 'Unknown',
    date: doc.date ?? '',
    place: (doc.place ?? [])[0] ?? '',
    sourceType: doc.type ?? 'unknown',
    personNames: doc.personNames ?? [],
    archiveUrl: doc.url ?? '',
    imageUrl: doc.imageUrl,
  }));
}
