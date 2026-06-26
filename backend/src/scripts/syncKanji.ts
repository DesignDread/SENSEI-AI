import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
import { connectDatabase } from '../config/database';
import { Kanji } from '../models/Kanji';
import { logger } from '../lib/logger';

const KANJI_API_BASE = 'https://kanjiapi.dev/v1';
const LEVELS = ['N5', 'N4', 'N3', 'N2', 'N1'] as const;
const DELAY_MS = 200;

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const fetchJSON = async (url: string, retries = 3): Promise<any> => {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
      return await res.json();
    } catch (err) {
      if (i === retries - 1) throw err;
      logger.warn(`Retry ${i + 1}/${retries} for ${url}`);
      await sleep(1000 * (i + 1));
    }
  }
};

export const syncKanjiForLevel = async (level: string): Promise<number> => {
  const jlptNumber = level.replace('N', '');
  logger.info(`Fetching ${level} kanji list...`);
  const characters: string[] = await fetchJSON(`${KANJI_API_BASE}/kanji/jlpt-${jlptNumber}`);
  logger.info(`Found ${characters.length} ${level} kanji, fetching details...`);

  let synced = 0;
  for (let i = 0; i < characters.length; i++) {
    const char = characters[i];
    try {
      const data = await fetchJSON(`${KANJI_API_BASE}/kanji/${encodeURIComponent(char)}`);
      await Kanji.findOneAndUpdate(
        { character: char },
        {
          $set: {
            character: char,
            jlptLevel: level,
            strokeCount: data.stroke_count || 0,
            meanings: data.meanings || [],
            onyomi: data.on_readings || [],
            kunyomi: data.kun_readings || [],
            frequencyRank: i + 1,
          },
          $setOnInsert: {
            radicals: [],
            exampleWords: [],
          },
        },
        { upsert: true, new: true }
      );
      synced++;
      if (i % 50 === 0 && i > 0) logger.info(`  ${level}: ${i}/${characters.length} synced`);
      await sleep(DELAY_MS);
    } catch (err) {
      logger.error(`Failed to sync kanji ${char}:`, err);
    }
  }

  return synced;
};

export const syncAllKanji = async (): Promise<void> => {
  for (const level of LEVELS) {
    const count = await syncKanjiForLevel(level);
    logger.info(`✅ Synced ${count} ${level} kanji`);
  }
};

// Run standalone
if (require.main === module) {
  connectDatabase().then(async () => {
    await syncAllKanji();
    await mongoose.disconnect();
    process.exit(0);
  }).catch(err => {
    logger.error('Sync failed:', err);
    process.exit(1);
  });
}
