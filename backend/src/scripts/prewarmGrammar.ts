import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
import { connectDatabase } from '../config/database';
import { GrammarPoint } from '../models/GrammarPoint';
import { generateGrammarExplanation } from '../modules/grammar/grammar.service';
import { logger } from '../lib/logger';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const prewarm = async () => {
  await connectDatabase();
  console.log('\n🔥 Pre-warming grammar explanations...\n');

  const skeletons = await GrammarPoint.find({ source: 'curated_skeleton' });
  console.log(`Found ${skeletons.length} grammar skeletons to generate\n`);

  let success = 0;
  let failed = 0;

  for (const point of skeletons) {
    try {
      await generateGrammarExplanation(point);
      success++;
      console.log(`  ✅ [${success}/${skeletons.length}] ${point.title}`);
      await sleep(2000); // Rate limit: ~30 req/min on free tier
    } catch (err) {
      failed++;
      console.error(`  ❌ Failed: ${point.title}`, err);
    }
  }

  console.log(`\n🎉 Pre-warm complete! ${success} generated, ${failed} failed.\n`);
  await mongoose.disconnect();
  process.exit(0);
};

prewarm().catch(err => {
  logger.error('Pre-warm failed:', err);
  process.exit(1);
});
