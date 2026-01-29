/**
 * Open Archives Integration Tests
 */

import { searchOpenArchives } from '../sources/open-archives';

// Mock fetch globally
global.fetch = jest.fn();

describe('Open Archives', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('searchOpenArchives', () => {
    it('should search Open Archives with name', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          response: {
            docs: [
              {
                id: 'arch123',
                title: ['Birth Record - Jan Smit'],
                date: '1850-05-15',
                place: ['Amsterdam'],
                type: 'civil',
                personNames: ['Jan Smit', 'Maria Smit'],
                url: 'https://openarch.nl/record/123',
                imageUrl: 'https://openarch.nl/image/123.jpg',
              },
              {
                id: 'arch456',
                title: ['Marriage Record - Jan Smit & Anna de Vries'],
                date: '1875-06-20',
                place: ['Rotterdam'],
                type: 'church',
                personNames: ['Jan Smit', 'Anna de Vries'],
                url: 'https://openarch.nl/record/456',
              },
            ],
          },
        }),
      });

      const results = await searchOpenArchives({ name: 'Jan Smit' });

      expect(results).toHaveLength(2);
      expect(results[0].id).toBe('arch123');
      expect(results[0].title).toBe('Birth Record - Jan Smit');
      expect(results[0].date).toBe('1850-05-15');
      expect(results[0].place).toBe('Amsterdam');
      expect(results[0].sourceType).toBe('civil');
      expect(results[0].personNames).toEqual(['Jan Smit', 'Maria Smit']);
      expect(results[0].archiveUrl).toBe('https://openarch.nl/record/123');
      expect(results[0].imageUrl).toBe('https://openarch.nl/image/123.jpg');
    });

    it('should search with birth and death years', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ response: { docs: [] } }),
      });

      await searchOpenArchives({
        name: 'Maria de Jong',
        birthYear: '1820',
        deathYear: '1890',
      });

      const callUrl = (global.fetch as jest.Mock).mock.calls[0][0];
      expect(callUrl).toContain('yearFrom=1820');
      expect(callUrl).toContain('yearTo=1890');
    });

    it('should search with place filter', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ response: { docs: [] } }),
      });

      await searchOpenArchives({
        name: 'Test Name',
        place: 'Amsterdam',
      });

      const callUrl = (global.fetch as jest.Mock).mock.calls[0][0];
      expect(callUrl).toContain('place=Amsterdam');
    });

    it('should search with source type filter', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ response: { docs: [] } }),
      });

      await searchOpenArchives({
        name: 'Test',
        sourceType: 'church',
      });

      const callUrl = (global.fetch as jest.Mock).mock.calls[0][0];
      expect(callUrl).toContain('type=church');
    });

    it('should not include type parameter when sourceType is "all"', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ response: { docs: [] } }),
      });

      await searchOpenArchives({
        name: 'Test',
        sourceType: 'all',
      });

      const callUrl = (global.fetch as jest.Mock).mock.calls[0][0];
      expect(callUrl).not.toContain('type=');
    });

    it('should search with country code', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ response: { docs: [] } }),
      });

      await searchOpenArchives({
        name: 'Test',
        countryCode: 'NL',
      });

      const callUrl = (global.fetch as jest.Mock).mock.calls[0][0];
      expect(callUrl).toContain('country=NL');
    });

    it('should use custom limit', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ response: { docs: [] } }),
      });

      await searchOpenArchives({
        name: 'Test',
        limit: 50,
      });

      const callUrl = (global.fetch as jest.Mock).mock.calls[0][0];
      expect(callUrl).toContain('rows=50');
    });

    it('should default to 20 results limit', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ response: { docs: [] } }),
      });

      await searchOpenArchives({ name: 'Test' });

      const callUrl = (global.fetch as jest.Mock).mock.calls[0][0];
      expect(callUrl).toContain('rows=20');
    });

    it('should include format parameter', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ response: { docs: [] } }),
      });

      await searchOpenArchives({ name: 'Test' });

      const callUrl = (global.fetch as jest.Mock).mock.calls[0][0];
      expect(callUrl).toContain('format=json');
    });

    it('should handle API errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      await expect(searchOpenArchives({ name: 'Test' })).rejects.toThrow(
        'Open Archives API error: 500'
      );
    });

    it('should handle empty results', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      const results = await searchOpenArchives({ name: 'Nonexistent' });

      expect(results).toHaveLength(0);
    });

    it('should handle missing response.docs', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ response: {} }),
      });

      const results = await searchOpenArchives({ name: 'Test' });

      expect(results).toHaveLength(0);
    });

    it('should handle partial document data', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          response: {
            docs: [
              {
                id: 'partial1',
                // Missing most fields
              },
            ],
          },
        }),
      });

      const results = await searchOpenArchives({ name: 'Test' });

      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('partial1');
      expect(results[0].title).toBe('Unknown');
      expect(results[0].date).toBe('');
      expect(results[0].place).toBe('');
      expect(results[0].sourceType).toBe('unknown');
      expect(results[0].personNames).toEqual([]);
    });

    it('should handle title as array and take first element', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          response: {
            docs: [
              {
                id: 'test1',
                title: ['First Title', 'Second Title'],
                date: '1900-01-01',
                place: ['Amsterdam', 'Netherlands'],
                type: 'civil',
                personNames: [],
                url: 'https://test.com',
              },
            ],
          },
        }),
      });

      const results = await searchOpenArchives({ name: 'Test' });

      expect(results[0].title).toBe('First Title');
      expect(results[0].place).toBe('Amsterdam');
    });

    it('should handle document without imageUrl', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          response: {
            docs: [
              {
                id: 'test1',
                title: ['Test'],
                date: '1900-01-01',
                place: ['Test Place'],
                type: 'civil',
                personNames: [],
                url: 'https://test.com',
                // No imageUrl field
              },
            ],
          },
        }),
      });

      const results = await searchOpenArchives({ name: 'Test' });

      expect(results[0].imageUrl).toBeUndefined();
    });

    it('should use correct base URL and User-Agent', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ response: { docs: [] } }),
      });

      await searchOpenArchives({ name: 'Test' });

      const callUrl = (global.fetch as jest.Mock).mock.calls[0][0];
      expect(callUrl).toContain('https://api.openarch.nl/2.0/search');

      const fetchOptions = (global.fetch as jest.Mock).mock.calls[0][1];
      expect(fetchOptions.headers['User-Agent']).toBe('FamilyTreeResearch/1.0');
    });
  });
});
