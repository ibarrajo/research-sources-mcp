/**
 * Chronicling America Integration Tests
 */

import { searchNewspapers, getNewspaperPage } from '../sources/chronicling-america';

// Mock fetch globally
global.fetch = jest.fn();

describe('Chronicling America', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('searchNewspapers', () => {
    it('should search newspapers with basic query', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          totalItems: 2,
          items: [
            {
              id: 'item1',
              title: 'The Evening Star',
              date: '1900-01-01',
              sequence: 1,
              edition: 1,
              lccn: 'sn83045462',
              ocr_eng: 'Sample OCR text for testing purposes',
            },
            {
              id: 'item2',
              title: 'Washington Times',
              date: '1900-01-02',
              sequence: 2,
              edition: 1,
              lccn: 'sn84026749',
              ocr_eng: 'Another sample OCR text',
            },
          ],
        }),
      });

      const results = await searchNewspapers({ query: 'genealogy' });

      expect(results.totalItems).toBe(2);
      expect(results.items).toHaveLength(2);
      expect(results.items[0].title).toBe('The Evening Star');
      expect(results.items[0].lccn).toBe('sn83045462');
      expect(results.items[0].url).toContain('/lccn/sn83045462/');
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should search newspapers with state filter', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ totalItems: 0, items: [] }),
      });

      await searchNewspapers({ query: 'Smith', state: 'California' });

      const callUrl = (global.fetch as jest.Mock).mock.calls[0][0];
      expect(callUrl).toContain('state=California');
    });

    it('should search newspapers with date range', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ totalItems: 0, items: [] }),
      });

      await searchNewspapers({
        query: 'test',
        startDate: '1900-01-01',
        endDate: '1900-12-31',
      });

      const callUrl = (global.fetch as jest.Mock).mock.calls[0][0];
      expect(callUrl).toContain('dateFilterType=range');
      expect(callUrl).toContain('date1=19000101');
      expect(callUrl).toContain('date2=19001231');
    });

    it('should handle API errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      await expect(searchNewspapers({ query: 'test' })).rejects.toThrow(
        'Chronicling America API error: 500'
      );
    });

    it('should handle empty results', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      const results = await searchNewspapers({ query: 'nonexistent' });

      expect(results.totalItems).toBe(0);
      expect(results.items).toHaveLength(0);
    });

    it('should truncate long OCR snippets', async () => {
      const longOcr = 'x'.repeat(500);

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          totalItems: 1,
          items: [
            {
              id: 'item1',
              title: 'Test',
              date: '1900-01-01',
              sequence: 1,
              edition: 1,
              lccn: 'test123',
              ocr_eng: longOcr,
            },
          ],
        }),
      });

      const results = await searchNewspapers({ query: 'test' });

      expect(results.items[0].snippet.length).toBe(300);
    });

    it('should use User-Agent header', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ totalItems: 0, items: [] }),
      });

      await searchNewspapers({ query: 'test' });

      const fetchOptions = (global.fetch as jest.Mock).mock.calls[0][1];
      expect(fetchOptions.headers['User-Agent']).toBe('FamilyTreeResearch/1.0');
    });
  });

  describe('getNewspaperPage', () => {
    it('should get newspaper page with OCR text', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          jp2: 'https://chroniclingamerica.loc.gov/path/to/image.jp2',
          ocr_eng: 'Full page OCR text content here',
        }),
      });

      const result = await getNewspaperPage({
        lccn: 'sn83045462',
        date: '1900-01-15',
        page: 1,
      });

      expect(result.url).toContain('/lccn/sn83045462/19000115/ed-1/seq-1/');
      expect(result.imageUrl).toContain('.jp2');
      expect(result.ocrText).toBe('Full page OCR text content here');
    });

    it('should format date correctly', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ jp2: '', ocr_eng: '' }),
      });

      await getNewspaperPage({
        lccn: 'test',
        date: '1900-01-15',
        page: 1,
      });

      const callUrl = (global.fetch as jest.Mock).mock.calls[0][0];
      expect(callUrl).toContain('/19000115/');
    });

    it('should handle custom edition', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ jp2: '', ocr_eng: '' }),
      });

      await getNewspaperPage({
        lccn: 'test',
        date: '1900-01-15',
        edition: 2,
        page: 3,
      });

      const callUrl = (global.fetch as jest.Mock).mock.calls[0][0];
      expect(callUrl).toContain('/ed-2/seq-3');
    });

    it('should handle API errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      await expect(
        getNewspaperPage({
          lccn: 'invalid',
          date: '1900-01-01',
          page: 1,
        })
      ).rejects.toThrow('Chronicling America page error: 404');
    });

    it('should handle missing OCR data', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      const result = await getNewspaperPage({
        lccn: 'test',
        date: '1900-01-01',
        page: 1,
      });

      expect(result.ocrText).toBe('');
      expect(result.imageUrl).toBe('');
    });
  });
});
