/**
 * WikiTree Integration Tests
 */

import { searchWikiTree, getWikiTreePerson } from '../sources/wikitree';

// Mock fetch globally
global.fetch = jest.fn();

describe('WikiTree', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('searchWikiTree', () => {
    it('should search WikiTree with name parameters', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: 0,
          matches: [
            {
              user_id: 12345,
              Name: 'Smith-123',
              FirstName: 'John',
              LastNameAtBirth: 'Smith',
              BirthDate: '1850-01-15',
              DeathDate: '1920-05-20',
              BirthLocation: 'New York, USA',
              DeathLocation: 'California, USA',
              Privacy: 20,
            },
            {
              user_id: 67890,
              Name: 'Smith-456',
              FirstName: 'Jane',
              LastNameAtBirth: 'Smith',
              BirthDate: '1855-03-10',
              DeathDate: '1925-08-15',
              BirthLocation: 'Massachusetts, USA',
              DeathLocation: 'Florida, USA',
              Privacy: 30,
            },
          ],
        }),
      });

      const results = await searchWikiTree({
        firstName: 'John',
        lastName: 'Smith',
      });

      expect(results).toHaveLength(2);
      expect(results[0].id).toBe('12345');
      expect(results[0].name).toBe('Smith-123');
      expect(results[0].firstName).toBe('John');
      expect(results[0].lastName).toBe('Smith');
      expect(results[0].url).toBe('https://www.wikitree.com/wiki/Smith-123');
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should search with birth and death dates', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 0, matches: [] }),
      });

      await searchWikiTree({
        firstName: 'Maria',
        lastName: 'Garcia',
        birthDate: '1845',
        deathDate: '1920',
      });

      const fetchOptions = (global.fetch as jest.Mock).mock.calls[0][1];
      const body = JSON.parse(fetchOptions.body);

      expect(body.action).toBe('searchPerson');
      expect(body.FirstName).toBe('Maria');
      expect(body.LastName).toBe('Garcia');
      expect(body.BirthDate).toBe('1845');
      expect(body.DeathDate).toBe('1920');
    });

    it('should search with location parameters', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 0, matches: [] }),
      });

      await searchWikiTree({
        firstName: 'John',
        lastName: 'Doe',
        birthLocation: 'London, England',
        deathLocation: 'Paris, France',
      });

      const fetchOptions = (global.fetch as jest.Mock).mock.calls[0][1];
      const body = JSON.parse(fetchOptions.body);

      expect(body.BirthLocation).toBe('London, England');
      expect(body.DeathLocation).toBe('Paris, France');
    });

    it('should use custom limit', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 0, matches: [] }),
      });

      await searchWikiTree({
        lastName: 'Smith',
        limit: 50,
      });

      const fetchOptions = (global.fetch as jest.Mock).mock.calls[0][1];
      const body = JSON.parse(fetchOptions.body);

      expect(body.Limit).toBe(50);
    });

    it('should handle API errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      await expect(searchWikiTree({ lastName: 'Smith' })).rejects.toThrow(
        'WikiTree API error: 500'
      );
    });

    it('should handle non-zero status response', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 1, matches: [] }),
      });

      const results = await searchWikiTree({ lastName: 'Smith' });

      expect(results).toHaveLength(0);
    });

    it('should handle missing matches field', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 0 }),
      });

      const results = await searchWikiTree({ lastName: 'Smith' });

      expect(results).toHaveLength(0);
    });

    it('should handle partial person data', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: 0,
          matches: [
            {
              user_id: 12345,
              Name: 'Incomplete-1',
              // Missing other fields
            },
          ],
        }),
      });

      const results = await searchWikiTree({ lastName: 'Incomplete' });

      expect(results).toHaveLength(1);
      expect(results[0].firstName).toBe('');
      expect(results[0].lastName).toBe('');
      expect(results[0].birthDate).toBe('');
    });

    it('should use correct API endpoint and headers', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 0, matches: [] }),
      });

      await searchWikiTree({ lastName: 'Smith' });

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.wikitree.com/api.php',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'User-Agent': 'FamilyTreeResearch/1.0',
          }),
        })
      );
    });
  });

  describe('getWikiTreePerson', () => {
    it('should get person details by WikiTree ID', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: 0,
          person: {
            Id: 12345,
            Name: 'Smith-123',
            FirstName: 'John',
            LastNameAtBirth: 'Smith',
            BirthDate: '1850-01-15',
            DeathDate: '1920-05-20',
            BirthLocation: 'New York, USA',
            DeathLocation: 'California, USA',
            Privacy: 20,
          },
        }),
      });

      const person = await getWikiTreePerson('Smith-123');

      expect(person).not.toBeNull();
      expect(person?.id).toBe('12345');
      expect(person?.name).toBe('Smith-123');
      expect(person?.firstName).toBe('John');
      expect(person?.lastName).toBe('Smith');
      expect(person?.birthDate).toBe('1850-01-15');
      expect(person?.url).toBe('https://www.wikitree.com/wiki/Smith-123');
    });

    it('should return null for non-existent person', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 1 }),
      });

      const person = await getWikiTreePerson('NonExistent-999');

      expect(person).toBeNull();
    });

    it('should return null when person field missing', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 0 }),
      });

      const person = await getWikiTreePerson('Missing-1');

      expect(person).toBeNull();
    });

    it('should handle partial person data', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: 0,
          person: {
            Id: 99999,
            // Missing other fields
          },
        }),
      });

      const person = await getWikiTreePerson('Partial-1');

      expect(person).not.toBeNull();
      expect(person?.id).toBe('99999');
      expect(person?.firstName).toBe('');
      expect(person?.lastName).toBe('');
    });

    it('should handle API errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 503,
      });

      await expect(getWikiTreePerson('Test-1')).rejects.toThrow('WikiTree API error: 503');
    });

    it('should send correct request format', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 0, person: { Id: 1 } }),
      });

      await getWikiTreePerson('Smith-123');

      const fetchOptions = (global.fetch as jest.Mock).mock.calls[0][1];
      const body = JSON.parse(fetchOptions.body);

      expect(body.action).toBe('getPerson');
      expect(body.key).toBe('Smith-123');
      expect(body.fields).toContain('FirstName');
      expect(body.fields).toContain('LastNameAtBirth');
    });
  });
});
