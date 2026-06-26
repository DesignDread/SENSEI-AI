import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
import { connectDatabase } from '../config/database';
import { syncAllKanji } from './syncKanji';
import { syncAllVocabulary } from './syncVocabulary';
import { Kanji } from '../models/Kanji';
import { Vocabulary } from '../models/Vocabulary';
import { logger } from '../lib/logger';

const syncContent = async () => {
  await connectDatabase();
  console.log('\n📦 Starting content sync...\n');

  // Check if content already exists
  const kanjiCount = await Kanji.countDocuments();
  const vocabCount = await Vocabulary.countDocuments();

  if (kanjiCount > 100 && vocabCount > 100) {
    console.log(`📊 Content already synced (${kanjiCount} kanji, ${vocabCount} vocab). Skipping.`);
    console.log('   Run with --force to re-sync.');
    if (!process.argv.includes('--force')) {
      await mongoose.disconnect();
      return;
    }
  }

  // Sync Kanji from KanjiAPI.dev
  console.log('\n── Syncing Kanji ──────────────────────────');
  await syncAllKanji();

  // Sync Vocabulary from JLPT Vocab API
  console.log('\n── Syncing Vocabulary ─────────────────────');
  await syncAllVocabulary();

  const finalKanji = await Kanji.countDocuments();
  const finalVocab = await Vocabulary.countDocuments();
  console.log(`\n🎉 Content sync complete! ${finalKanji} kanji, ${finalVocab} vocab words.\n`);

  await mongoose.disconnect();
};

if (require.main === module) {
  syncContent().then(() => process.exit(0)).catch(err => {
    logger.error('Content sync failed:', err);
    process.exit(1);
  });
}

export { syncContent };
