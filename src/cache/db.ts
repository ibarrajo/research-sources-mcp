import Database from 'better-sqlite3';
import { join, dirname } from 'path';
import { readFileSync, existsSync, mkdirSync } from 'fs';

const DB_PATH = join(dirname(new URL(import.meta.url).pathname), '../../data/sources-cache.sqlite');
const SCHEMA_PATH = join(dirname(new URL(import.meta.url).pathname), '../../../shared/schema.sql');

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    const dataDir = dirname(DB_PATH);
    mkdirSync(dataDir, { recursive: true });

    const isNew = !existsSync(DB_PATH);
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');

    if (isNew && existsSync(SCHEMA_PATH)) {
      const schema = readFileSync(SCHEMA_PATH, 'utf-8');
      db.exec(schema);
    }
  }
  return db;
}

export function closeDb(): void {
  if (db) {
    db.close();
    db = null;
  }
}

export function cacheExternalMatch(
  personId: string | null,
  sourceName: string,
  externalId: string,
  url: string,
  title: string,
  snippet: string,
  matchScore: number,
  rawJson: string
): void {
  const db = getDb();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT OR REPLACE INTO external_matches (
      person_id, source_name, external_id, url, title, snippet, match_score, raw_json, searched_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(personId, sourceName, externalId, url, title, snippet, matchScore, rawJson, now);
}

export function getExternalMatches(personId: string, sourceName?: string): Array<{
  id: number;
  source_name: string;
  external_id: string;
  url: string;
  title: string;
  snippet: string;
  match_score: number;
}> {
  const db = getDb();

  if (sourceName) {
    return db.prepare(`
      SELECT * FROM external_matches
      WHERE person_id = ? AND source_name = ?
      ORDER BY match_score DESC
    `).all(personId, sourceName) as Array<{
      id: number;
      source_name: string;
      external_id: string;
      url: string;
      title: string;
      snippet: string;
      match_score: number;
    }>;
  } else {
    return db.prepare(`
      SELECT * FROM external_matches
      WHERE person_id = ?
      ORDER BY match_score DESC, source_name
    `).all(personId) as Array<{
      id: number;
      source_name: string;
      external_id: string;
      url: string;
      title: string;
      snippet: string;
      match_score: number;
    }>;
  }
}
