/**
 * MCP Tool Handlers Integration Tests
 */

// Mock modules before imports
jest.mock('../sources/chronicling-america');
jest.mock('../sources/wikitree');
jest.mock('../sources/open-archives');
jest.mock('../cache/db', () => ({
  getDb: jest.fn(),
  closeDb: jest.fn(),
  cacheExternalMatch: jest.fn(),
  getExternalMatches: jest.fn(() => []),
}));

import { handleSearchNewspapers, handleGetNewspaperPage } from '../tools/newspaper-tools';
import { handleSearchWikiTree, handleGetWikiTreePerson } from '../tools/wikitree-tools';
import { handleSearchOpenArchives } from '../tools/openarch-tools';
import * as chroniclingAmerica from '../sources/chronicling-america';
import * as wikitree from '../sources/wikitree';
import * as openArchives from '../sources/open-archives';
import * as cacheDb from '../cache/db';

describe('MCP Tool Handlers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('handleSearchNewspapers', () => {
    it('should search newspapers and return formatted JSON', async () => {
      (chroniclingAmerica.searchNewspapers as jest.Mock).mockResolvedValue({
        totalItems: 10,
        items: [
          {
            id: 'item1',
            title: 'Test Newspaper',
            date: '1900-01-01',
            page: 1,
            url: 'http://test.com/1',
            snippet: 'Test snippet',
          },
        ],
      });

      const result = await handleSearchNewspapers({
        query: 'genealogy',
        state: 'California',
        page: 1,
      });

      const parsed = JSON.parse(result);
      expect(parsed.total).toBe(10);
      expect(parsed.count).toBe(1);
      expect(parsed.page).toBe(1);
      expect(parsed.items).toHaveLength(1);
      expect(parsed.items[0].title).toBe('Test Newspaper');
    });

    it('should cache search results', async () => {
      (chroniclingAmerica.searchNewspapers as jest.Mock).mockResolvedValue({
        totalItems: 1,
        items: [
          {
            id: 'item1',
            title: 'Test',
            date: '1900-01-01',
            page: 1,
            url: 'http://test.com',
            snippet: 'Snippet',
          },
        ],
      });

      await handleSearchNewspapers({ query: 'test', page: 1 });

      expect(cacheDb.cacheExternalMatch).toHaveBeenCalledWith(
        null,
        'chronicling_america',
        'item1',
        'http://test.com',
        'Test',
        'Snippet',
        0.5,
        expect.any(String)
      );
    });
  });

  describe('handleGetNewspaperPage', () => {
    it('should get newspaper page and return formatted JSON', async () => {
      (chroniclingAmerica.getNewspaperPage as jest.Mock).mockResolvedValue({
        url: 'http://test.com/page',
        imageUrl: 'http://test.com/image.jp2',
        ocrText: 'Full OCR text content here',
      });

      const result = await handleGetNewspaperPage({
        lccn: 'test123',
        date: '1900-01-01',
        page: 1,
      });

      const parsed = JSON.parse(result);
      expect(parsed.url).toBe('http://test.com/page');
      expect(parsed.image_url).toBe('http://test.com/image.jp2');
      expect(parsed.ocr_text).toBe('Full OCR text content here');
      expect(parsed.ocr_length).toBe(26);
    });

    it('should limit OCR text to 5000 characters', async () => {
      const longOcr = 'x'.repeat(10000);

      (chroniclingAmerica.getNewspaperPage as jest.Mock).mockResolvedValue({
        url: 'http://test.com',
        imageUrl: 'http://test.com/image.jp2',
        ocrText: longOcr,
      });

      const result = await handleGetNewspaperPage({
        lccn: 'test',
        date: '1900-01-01',
        page: 1,
      });

      const parsed = JSON.parse(result);
      expect(parsed.ocr_text.length).toBe(5000);
      expect(parsed.ocr_length).toBe(10000);
    });
  });

  describe('handleSearchWikiTree', () => {
    it('should search WikiTree and return formatted JSON', async () => {
      (wikitree.searchWikiTree as jest.Mock).mockResolvedValue([
        {
          id: '12345',
          name: 'Smith-123',
          firstName: 'John',
          lastName: 'Smith',
          birthDate: '1850-01-15',
          deathDate: '1920-05-20',
          url: 'https://wikitree.com/Smith-123',
        },
      ]);

      const result = await handleSearchWikiTree({
        first_name: 'John',
        last_name: 'Smith',
        limit: 20,
      });

      const parsed = JSON.parse(result);
      expect(parsed.count).toBe(1);
      expect(parsed.results).toHaveLength(1);
      expect(parsed.results[0].id).toBe('12345');
      expect(parsed.results[0].name).toBe('Smith-123');
      expect(parsed.results[0].first_name).toBe('John');
      expect(parsed.results[0].last_name).toBe('Smith');
    });

    it('should cache WikiTree results', async () => {
      (wikitree.searchWikiTree as jest.Mock).mockResolvedValue([
        {
          id: '12345',
          name: 'Smith-123',
          firstName: 'John',
          lastName: 'Smith',
          birthDate: '1850',
          deathDate: '1920',
          url: 'https://test.com',
        },
      ]);

      await handleSearchWikiTree({ first_name: 'John', last_name: 'Smith', limit: 20 });

      expect(cacheDb.cacheExternalMatch).toHaveBeenCalledWith(
        null,
        'wikitree',
        '12345',
        'https://test.com',
        'Smith-123',
        expect.stringContaining('John Smith'),
        0.7,
        expect.any(String)
      );
    });
  });

  describe('handleGetWikiTreePerson', () => {
    it('should get WikiTree person and return formatted JSON', async () => {
      (wikitree.getWikiTreePerson as jest.Mock).mockResolvedValue({
        id: '12345',
        name: 'Smith-123',
        firstName: 'John',
        lastName: 'Smith',
        birthDate: '1850-01-15',
        deathDate: '1920-05-20',
        birthLocation: 'New York',
        deathLocation: 'California',
        url: 'https://wikitree.com/Smith-123',
      });

      const result = await handleGetWikiTreePerson({ wikitree_id: 'Smith-123' });

      const parsed = JSON.parse(result);
      expect(parsed.id).toBe('12345');
      expect(parsed.name).toBe('Smith-123');
      expect(parsed.first_name).toBe('John');
      expect(parsed.last_name).toBe('Smith');
      expect(parsed.birth_date).toBe('1850-01-15');
      expect(parsed.url).toBe('https://wikitree.com/Smith-123');
    });

    it('should return error message when person not found', async () => {
      (wikitree.getWikiTreePerson as jest.Mock).mockResolvedValue(null);

      const result = await handleGetWikiTreePerson({ wikitree_id: 'NotFound-999' });

      const parsed = JSON.parse(result);
      expect(parsed.error).toBe('Person not found');
    });
  });

  describe('handleSearchOpenArchives', () => {
    it('should search Open Archives and return formatted JSON', async () => {
      (openArchives.searchOpenArchives as jest.Mock).mockResolvedValue([
        {
          id: 'arch1',
          title: 'Birth Record',
          date: '1850-05-15',
          place: 'Amsterdam',
          sourceType: 'civil',
          personNames: ['Jan Smit'],
          archiveUrl: 'https://openarch.nl/1',
          imageUrl: 'https://openarch.nl/image1.jpg',
        },
      ]);

      const result = await handleSearchOpenArchives({
        name: 'Jan Smit',
        country_code: 'NL',
        source_type: 'all',
        limit: 20,
      });

      const parsed = JSON.parse(result);
      expect(parsed.count).toBe(1);
      expect(parsed.results).toHaveLength(1);
      expect(parsed.results[0].title).toBe('Birth Record');
      expect(parsed.results[0].place).toBe('Amsterdam');
    });

    it('should cache Open Archives results', async () => {
      (openArchives.searchOpenArchives as jest.Mock).mockResolvedValue([
        {
          id: 'arch1',
          title: 'Test Record',
          date: '1850-01-01',
          place: 'Amsterdam',
          sourceType: 'civil',
          personNames: ['Test Person'],
          archiveUrl: 'https://test.com',
        },
      ]);

      await handleSearchOpenArchives({ name: 'Test Person', source_type: 'all', limit: 20 });

      expect(cacheDb.cacheExternalMatch).toHaveBeenCalledWith(
        null,
        'openarch',
        'arch1',
        'https://test.com',
        'Test Record',
        expect.stringContaining('Amsterdam'),
        0.6,
        expect.any(String)
      );
    });
  });
});
