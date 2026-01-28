/**
 * Find A Grave Utility Tests
 */

import { constructFindAGraveUrl, extractMemorialIdFromFsRecord } from '../sources/findagrave';

describe('Find A Grave Utilities', () => {
  describe('constructFindAGraveUrl', () => {
    it('should construct correct Find A Grave URL', () => {
      const url = constructFindAGraveUrl('123456');
      expect(url).toBe('https://www.findagrave.com/memorial/123456');
    });

    it('should handle numeric memorial IDs', () => {
      const url = constructFindAGraveUrl('987654321');
      expect(url).toBe('https://www.findagrave.com/memorial/987654321');
    });

    it('should handle empty memorial ID', () => {
      const url = constructFindAGraveUrl('');
      expect(url).toBe('https://www.findagrave.com/memorial/');
    });
  });

  describe('extractMemorialIdFromFsRecord', () => {
    it('should return the record ID as-is', () => {
      // This is a placeholder function currently
      const id = extractMemorialIdFromFsRecord('ark:/61903/1:1:ABCD-1234');
      expect(id).toBe('ark:/61903/1:1:ABCD-1234');
    });

    it('should handle various record ID formats', () => {
      const ids = [
        '12345',
        'memorial_67890',
        'ark:/61903/1:1:TEST-ID',
      ];

      ids.forEach(inputId => {
        const result = extractMemorialIdFromFsRecord(inputId);
        expect(result).toBe(inputId);
      });
    });

    it('should handle empty record ID', () => {
      const id = extractMemorialIdFromFsRecord('');
      expect(id).toBe('');
    });
  });
});
