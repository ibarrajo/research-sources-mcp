/**
 * Manual mock for cache/db module
 * Jest will use this instead of the real implementation
 */

export const getDb = jest.fn();
export const closeDb = jest.fn();
export const cacheExternalMatch = jest.fn();
export const getExternalMatches = jest.fn(() => []);
