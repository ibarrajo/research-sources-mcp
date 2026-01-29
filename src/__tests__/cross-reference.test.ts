/**
 * Cross-Reference Tool Integration Tests
 */

// Mock all modules BEFORE imports
jest.mock('../sources/chronicling-america');
jest.mock('../sources/wikitree');
jest.mock('../sources/open-archives');
jest.mock('../cache/db', () => ({
  getDb: jest.fn(),
  closeDb: jest.fn(),
  cacheExternalMatch: jest.fn(),
  getExternalMatches: jest.fn(() => []),
}));

import { handleCrossReferencePerson } from '../tools/cross-reference-tools';
import * as chroniclingAmerica from '../sources/chronicling-america';
import * as wikitree from '../sources/wikitree';
import * as openArchives from '../sources/open-archives';
import * as cacheDb from '../cache/db';

describe('Cross-Reference Person', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('handleCrossReferencePerson', () => {
    it('should search all sources when "all" specified', async () => {
      (chroniclingAmerica.searchNewspapers as jest.Mock).mockResolvedValue({
        totalItems: 1,
        items: [
          {
            id: 'news1',
            title: 'Test Newspaper',
            date: '1900-01-01',
            url: 'https://test.com/news1',
            snippet: 'Test snippet',
          },
        ],
      });

      (wikitree.searchWikiTree as jest.Mock).mockResolvedValue([
        {
          id: 'wt1',
          name: 'Test-123',
          firstName: 'John',
          lastName: 'Smith',
          url: 'https://wikitree.com/Test-123',
        },
      ]);

      (openArchives.searchOpenArchives as jest.Mock).mockResolvedValue([
        {
          id: 'oa1',
          title: 'Test Archive',
          url: 'https://openarch.nl/oa1',
        },
      ]);

      (cacheDb.cacheExternalMatch as jest.Mock).mockReturnValue(undefined);

      const result = await handleCrossReferencePerson({
        given_name: 'John',
        surname: 'Smith',
        birth_year: '1850',
        birth_place: 'Amsterdam, Netherlands',
        sources_to_search: ['all'],
      });

      const parsed = JSON.parse(result);

      expect(parsed.sources_searched).toContain('newspapers');
      expect(parsed.sources_searched).toContain('wikitree');
      expect(parsed.sources_searched).toContain('openarch');
      expect(parsed.total_results).toBe(3);
      expect(chroniclingAmerica.searchNewspapers).toHaveBeenCalled();
      expect(wikitree.searchWikiTree).toHaveBeenCalled();
      expect(openArchives.searchOpenArchives).toHaveBeenCalled();
    });

    it('should search only newspapers when specified', async () => {
      (chroniclingAmerica.searchNewspapers as jest.Mock).mockResolvedValue({
        totalItems: 0,
        items: [],
      });
      (cacheDb.cacheExternalMatch as jest.Mock).mockReturnValue(undefined);

      const result = await handleCrossReferencePerson({
        given_name: 'Maria',
        surname: 'Garcia',
        sources_to_search: ['newspapers'],
      });

      const parsed = JSON.parse(result);

      expect(parsed.sources_searched).toContain('newspapers');
      expect(parsed.sources_searched).not.toContain('wikitree');
      expect(parsed.sources_searched).not.toContain('openarch');
      expect(chroniclingAmerica.searchNewspapers).toHaveBeenCalled();
      expect(wikitree.searchWikiTree).not.toHaveBeenCalled();
      expect(openArchives.searchOpenArchives).not.toHaveBeenCalled();
    });

    it('should search only WikiTree when specified', async () => {
      (wikitree.searchWikiTree as jest.Mock).mockResolvedValue([]);
      (cacheDb.cacheExternalMatch as jest.Mock).mockReturnValue(undefined);

      await handleCrossReferencePerson({
        given_name: 'Test',
        surname: 'Person',
        sources_to_search: ['wikitree'],
      });

      expect(wikitree.searchWikiTree).toHaveBeenCalled();
      expect(chroniclingAmerica.searchNewspapers).not.toHaveBeenCalled();
      expect(openArchives.searchOpenArchives).not.toHaveBeenCalled();
    });

    it('should search OpenArch only for European locations', async () => {
      (openArchives.searchOpenArchives as jest.Mock).mockResolvedValue([]);
      (cacheDb.cacheExternalMatch as jest.Mock).mockReturnValue(undefined);

      await handleCrossReferencePerson({
        given_name: 'Jan',
        surname: 'Smit',
        birth_place: 'Amsterdam, Netherlands',
        sources_to_search: ['all'],
      });

      expect(openArchives.searchOpenArchives).toHaveBeenCalled();
    });

    it('should not search OpenArch for non-European locations', async () => {
      (chroniclingAmerica.searchNewspapers as jest.Mock).mockResolvedValue({
        totalItems: 0,
        items: [],
      });
      (wikitree.searchWikiTree as jest.Mock).mockResolvedValue([]);
      (cacheDb.cacheExternalMatch as jest.Mock).mockReturnValue(undefined);

      await handleCrossReferencePerson({
        given_name: 'John',
        surname: 'Smith',
        birth_place: 'New York, USA',
        sources_to_search: ['all'],
      });

      expect(openArchives.searchOpenArchives).not.toHaveBeenCalled();
    });

    it('should extract state from birth_place for newspaper search', async () => {
      (chroniclingAmerica.searchNewspapers as jest.Mock).mockResolvedValue({
        totalItems: 0,
        items: [],
      });
      (cacheDb.cacheExternalMatch as jest.Mock).mockReturnValue(undefined);

      await handleCrossReferencePerson({
        given_name: 'John',
        surname: 'Doe',
        birth_place: 'Los Angeles, California',
        sources_to_search: ['newspapers'],
      });

      expect(chroniclingAmerica.searchNewspapers).toHaveBeenCalledWith(
        expect.objectContaining({
          state: 'California',
        })
      );
    });

    it('should format dates for newspaper search', async () => {
      (chroniclingAmerica.searchNewspapers as jest.Mock).mockResolvedValue({
        totalItems: 0,
        items: [],
      });
      (cacheDb.cacheExternalMatch as jest.Mock).mockReturnValue(undefined);

      await handleCrossReferencePerson({
        given_name: 'Test',
        surname: 'Person',
        birth_year: '1850',
        death_year: '1920',
        sources_to_search: ['newspapers'],
      });

      expect(chroniclingAmerica.searchNewspapers).toHaveBeenCalledWith(
        expect.objectContaining({
          startDate: '1850-01-01',
          endDate: '1920-12-31',
        })
      );
    });

    it('should pass correct parameters to WikiTree', async () => {
      (wikitree.searchWikiTree as jest.Mock).mockResolvedValue([]);
      (cacheDb.cacheExternalMatch as jest.Mock).mockReturnValue(undefined);

      await handleCrossReferencePerson({
        given_name: 'Maria',
        surname: 'Lopez',
        birth_year: '1845',
        birth_place: 'Jalisco, Mexico',
        death_year: '1920',
        death_place: 'California, USA',
        sources_to_search: ['wikitree'],
      });

      expect(wikitree.searchWikiTree).toHaveBeenCalledWith({
        firstName: 'Maria',
        lastName: 'Lopez',
        birthDate: '1845',
        deathDate: '1920',
        birthLocation: 'Jalisco, Mexico',
        deathLocation: 'California, USA',
      });
    });

    it('should cache results from all sources', async () => {
      (chroniclingAmerica.searchNewspapers as jest.Mock).mockResolvedValue({
        totalItems: 1,
        items: [{ id: 'news1', title: 'Test', url: 'http://test.com', snippet: 'Test' }],
      });

      (wikitree.searchWikiTree as jest.Mock).mockResolvedValue([
        {
          id: 'wt1',
          name: 'Test-1',
          firstName: 'Test',
          lastName: 'Person',
          birthDate: '1900',
          deathDate: '1950',
          url: 'http://test.com',
        },
      ]);

      (cacheDb.cacheExternalMatch as jest.Mock).mockReturnValue(undefined);

      await handleCrossReferencePerson({
        given_name: 'Test',
        surname: 'Person',
        person_id: 'I123',
        sources_to_search: ['newspapers', 'wikitree'],
      });

      // Should cache newspaper results
      expect(cacheDb.cacheExternalMatch).toHaveBeenCalledWith(
        'I123',
        'chronicling_america',
        'news1',
        'http://test.com',
        'Test',
        'Test',
        0.5,
        expect.any(String)
      );

      // Should cache WikiTree results
      expect(cacheDb.cacheExternalMatch).toHaveBeenCalledWith(
        'I123',
        'wikitree',
        'wt1',
        'http://test.com',
        'Test-1',
        expect.stringContaining('Test Person'),
        0.7,
        expect.any(String)
      );
    });

    it('should handle source errors gracefully', async () => {
      (chroniclingAmerica.searchNewspapers as jest.Mock).mockRejectedValue(new Error('API Error'));
      (wikitree.searchWikiTree as jest.Mock).mockResolvedValue([]);
      (cacheDb.cacheExternalMatch as jest.Mock).mockReturnValue(undefined);

      const result = await handleCrossReferencePerson({
        given_name: 'Test',
        surname: 'Person',
        sources_to_search: ['all'],
      });

      const parsed = JSON.parse(result);

      expect(parsed.results.newspapers).toBeDefined();
      expect(parsed.results.newspapers[0].error).toBe('API Error');
      expect(parsed.results.wikitree).toBeDefined();
    });

    it('should return formatted JSON output', async () => {
      (chroniclingAmerica.searchNewspapers as jest.Mock).mockResolvedValue({
        totalItems: 0,
        items: [],
      });
      (wikitree.searchWikiTree as jest.Mock).mockResolvedValue([]);
      (cacheDb.cacheExternalMatch as jest.Mock).mockReturnValue(undefined);

      const result = await handleCrossReferencePerson({
        given_name: 'John',
        surname: 'Doe',
        birth_year: '1850',
        death_year: '1920',
        sources_to_search: ['all'],
      });

      const parsed = JSON.parse(result);

      expect(parsed.person).toEqual({
        given_name: 'John',
        surname: 'Doe',
        birth_year: '1850',
        death_year: '1920',
      });
      expect(parsed.sources_searched).toBeDefined();
      expect(parsed.results).toBeDefined();
      expect(parsed.total_results).toBeDefined();
    });

    it('should recognize European location keywords', async () => {
      const europeanLocations = [
        'Amsterdam, Netherlands',
        'Brussels, Belgium',
        'Paris, France',
        'Rotterdam, NL',
      ];

      for (const location of europeanLocations) {
        (openArchives.searchOpenArchives as jest.Mock).mockResolvedValue([]);
        (cacheDb.cacheExternalMatch as jest.Mock).mockReturnValue(undefined);

        await handleCrossReferencePerson({
          given_name: 'Test',
          surname: 'Person',
          birth_place: location,
          sources_to_search: ['openarch'],
        });

        expect(openArchives.searchOpenArchives).toHaveBeenCalled();
        jest.clearAllMocks();
      }
    });

    it('should handle multiple search sources', async () => {
      (chroniclingAmerica.searchNewspapers as jest.Mock).mockResolvedValue({
        totalItems: 0,
        items: [],
      });
      (wikitree.searchWikiTree as jest.Mock).mockResolvedValue([]);
      (cacheDb.cacheExternalMatch as jest.Mock).mockReturnValue(undefined);

      await handleCrossReferencePerson({
        given_name: 'Test',
        surname: 'Person',
        sources_to_search: ['newspapers', 'wikitree'],
      });

      expect(chroniclingAmerica.searchNewspapers).toHaveBeenCalled();
      expect(wikitree.searchWikiTree).toHaveBeenCalled();
      expect(openArchives.searchOpenArchives).not.toHaveBeenCalled();
    });
  });
});
