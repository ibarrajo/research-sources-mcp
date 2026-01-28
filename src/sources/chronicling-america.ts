/**
 * Chronicling America (Library of Congress) - Historic American newspapers (1789-1963)
 * API: https://chroniclingamerica.loc.gov/about/api/
 * No API key required
 */

const BASE_URL = 'https://chroniclingamerica.loc.gov';

export interface NewspaperSearchParams {
  query: string;
  state?: string;
  startDate?: string; // YYYY-MM-DD
  endDate?: string;   // YYYY-MM-DD
  page?: number;
}

export interface NewspaperSearchResult {
  totalItems: number;
  items: Array<{
    id: string;
    title: string;
    date: string;
    page: number;
    edition: number;
    lccn: string;
    url: string;
    snippet: string;
  }>;
}

export async function searchNewspapers(params: NewspaperSearchParams): Promise<NewspaperSearchResult> {
  const searchParams = new URLSearchParams({
    proxtext: params.query,
    format: 'json',
    page: String(params.page ?? 1),
  });

  if (params.state) {
    searchParams.set('state', params.state);
  }
  if (params.startDate) {
    searchParams.set('dateFilterType', 'range');
    searchParams.set('date1', params.startDate.replace(/-/g, ''));
  }
  if (params.endDate) {
    searchParams.set('date2', params.endDate.replace(/-/g, ''));
  }

  const url = `${BASE_URL}/search/pages/results/?${searchParams.toString()}`;

  const response = await fetch(url, {
    headers: { 'User-Agent': 'FamilyTreeResearch/1.0' },
  });

  if (!response.ok) {
    throw new Error(`Chronicling America API error: ${response.status}`);
  }

  const data = await response.json() as {
    totalItems?: number;
    items?: Array<{
      id?: string;
      title?: string;
      date?: string;
      sequence?: number;
      edition?: number;
      lccn?: string;
      ocr_eng?: string;
    }>;
  };

  const items = (data.items ?? []).map(item => {
    const lccn = item.lccn ?? '';
    const date = item.date ?? '';
    const sequence = item.sequence ?? 1;

    return {
      id: item.id ?? '',
      title: item.title ?? 'Unknown',
      date,
      page: sequence,
      edition: item.edition ?? 1,
      lccn,
      url: `${BASE_URL}/lccn/${lccn}/${date}/ed-1/seq-${sequence}/`,
      snippet: (item.ocr_eng ?? '').substring(0, 300),
    };
  });

  return {
    totalItems: data.totalItems ?? 0,
    items,
  };
}

export interface NewspaperPageParams {
  lccn: string;
  date: string; // YYYY-MM-DD
  edition?: number;
  page: number;
}

export async function getNewspaperPage(params: NewspaperPageParams): Promise<{
  url: string;
  imageUrl: string;
  ocrText: string;
}> {
  const edition = params.edition ?? 1;
  const dateFormatted = params.date.replace(/-/g, '');

  const url = `${BASE_URL}/lccn/${params.lccn}/${dateFormatted}/ed-${edition}/seq-${params.page}.json`;

  const response = await fetch(url, {
    headers: { 'User-Agent': 'FamilyTreeResearch/1.0' },
  });

  if (!response.ok) {
    throw new Error(`Chronicling America page error: ${response.status}`);
  }

  const data = await response.json() as {
    jp2?: string;
    ocr_eng?: string;
  };

  return {
    url: `${BASE_URL}/lccn/${params.lccn}/${dateFormatted}/ed-${edition}/seq-${params.page}/`,
    imageUrl: data.jp2 ?? '',
    ocrText: data.ocr_eng ?? '',
  };
}
