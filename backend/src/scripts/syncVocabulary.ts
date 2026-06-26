import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
import { connectDatabase } from '../config/database';
import { Vocabulary } from '../models/Vocabulary';
import { logger } from '../lib/logger';

const VOCAB_API_BASE = 'https://jlpt-vocab-api.vercel.app/api/words';
const LEVEL_MAP: Record<string, number> = { N5: 5, N4: 4, N3: 3, N2: 2, N1: 1 };
const LEVELS = ['N5', 'N4', 'N3'] as const; // Start with N5-N3 for free tier API limits

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

export const syncVocabForLevel = async (level: string): Promise<number> => {
  const apiLevel = LEVEL_MAP[level];
  logger.info(`Fetching ${level} vocabulary...`);

  try {
    const json = await fetchJSON(`${VOCAB_API_BASE}?level=${apiLevel}&limit=5000`);
    const words = json.words;
    if (!Array.isArray(words)) {
      logger.warn(`Unexpected response for ${level}, skipping`);
      return 0;
    }

    logger.info(`Found ${words.length} ${level} words, upserting...`);
    let synced = 0;

    for (const w of words) {
      try {
        await Vocabulary.findOneAndUpdate(
          { word: w.word, jlptLevel: level },
          {
            $set: {
              word: w.word || '',
              reading: w.furigana || w.romaji || '',
              meanings: Array.isArray(w.meaning) ? w.meaning : [w.meaning || ''],
              partOfSpeech: w.romaji ? 'unknown' : 'unknown',
              jlptLevel: level,
              tags: [],
            },
            $setOnInsert: {
              exampleSentences: [],
              category: 'general',
            },
          },
          { upsert: true, new: true }
        );
        synced++;
      } catch (err) {
        // Skip duplicates or errors
      }
    }
    return synced;
  } catch (err) {
    logger.error(`Failed to sync ${level} vocabulary:`, err);
    return 0;
  }
};

export const syncAllVocabulary = async (): Promise<void> => {
  for (const level of LEVELS) {
    const count = await syncVocabForLevel(level);
    logger.info(`✅ Synced ${count} ${level} vocabulary words`);
    await sleep(1000); // Be polite between levels
  }
};

if (require.main === module) {
  connectDatabase().then(async () => {
    await syncAllVocabulary();
    await mongoose.disconnect();
    process.exit(0);
  }).catch(err => {
    logger.error('Sync failed:', err);
    process.exit(1);
  });
}
