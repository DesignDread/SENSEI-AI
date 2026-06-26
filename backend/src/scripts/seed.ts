/**
 * SenseiAI Database Seeder
 * Run: npm run seed
 * Seeds kana (static), grammar skeletons (curated), and sample test questions.
 * Kanji and vocabulary are synced from external APIs via `npm run sync`.
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import { connectDatabase } from '../config/database';
import { Kana } from '../models/Kana';
import { GrammarPoint } from '../models/GrammarPoint';
import { Question } from '../models/Question';
import { TestTemplate } from '../models/TestTemplate';

// ─── Hiragana ───────────────────────────────────────────────────────
const hiragana = [
  { character: 'あ', romaji: 'a', mnemonicText: 'Looks like an "a" written in cursive' },
  { character: 'い', romaji: 'i', mnemonicText: 'Two strokes like two "e"s facing each other' },
  { character: 'う', romaji: 'u', mnemonicText: 'Looks like a "u" with a hat' },
  { character: 'え', romaji: 'e', mnemonicText: 'Looks like a worker carrying a load' },
  { character: 'お', romaji: 'o', mnemonicText: 'Looks like "o" with a cross' },
  { character: 'か', romaji: 'ka', mnemonicText: 'Looks like a "ka" sword' },
  { character: 'き', romaji: 'ki', mnemonicText: 'Looks like a key' },
  { character: 'く', romaji: 'ku', mnemonicText: 'Looks like a cuckoo bird beak' },
  { character: 'け', romaji: 'ke', mnemonicText: 'Looks like a keg' },
  { character: 'こ', romaji: 'ko', mnemonicText: 'Looks like two lines of a corner' },
  { character: 'さ', romaji: 'sa', mnemonicText: 'Looks like a person saying sa' },
  { character: 'し', romaji: 'shi', mnemonicText: 'Looks like a fishhook she' },
  { character: 'す', romaji: 'su', mnemonicText: 'Looks like a swirl (su-whirl)' },
  { character: 'せ', romaji: 'se', mnemonicText: 'Looks like a person saying se' },
  { character: 'そ', romaji: 'so', mnemonicText: 'Looks like a sewing thread so' },
  { character: 'た', romaji: 'ta', mnemonicText: 'Looks like a ta-da moment' },
  { character: 'ち', romaji: 'chi', mnemonicText: 'Looks like a cheerleader chi' },
  { character: 'つ', romaji: 'tsu', mnemonicText: 'Looks like a wave tsu' },
  { character: 'て', romaji: 'te', mnemonicText: 'Looks like the letter T' },
  { character: 'と', romaji: 'to', mnemonicText: 'Looks like a toe' },
  { character: 'な', romaji: 'na', mnemonicText: 'Looks like kNot' },
  { character: 'に', romaji: 'ni', mnemonicText: 'Looks like knee' },
  { character: 'ぬ', romaji: 'nu', mnemonicText: 'Looks like noodle' },
  { character: 'ね', romaji: 'ne', mnemonicText: 'Looks like a net' },
  { character: 'の', romaji: 'no', mnemonicText: 'Looks like a no sign swirl' },
  { character: 'は', romaji: 'ha', mnemonicText: 'Looks like ha laughing' },
  { character: 'ひ', romaji: 'hi', mnemonicText: 'Looks like a heel' },
  { character: 'ふ', romaji: 'fu', mnemonicText: 'Looks like Mount Fuji' },
  { character: 'へ', romaji: 'he', mnemonicText: 'Looks like a mountain' },
  { character: 'ほ', romaji: 'ho', mnemonicText: 'Looks like ho ho ho Santa' },
  { character: 'ま', romaji: 'ma', mnemonicText: 'Looks like a mama crossing' },
  { character: 'み', romaji: 'mi', mnemonicText: 'Looks like me waving' },
  { character: 'む', romaji: 'mu', mnemonicText: 'Looks like a moo cow' },
  { character: 'め', romaji: 'me', mnemonicText: 'Looks like an eye (me = eye in Japanese)' },
  { character: 'も', romaji: 'mo', mnemonicText: 'Looks like more fish on a hook' },
  { character: 'や', romaji: 'ya', mnemonicText: 'Looks like a yacht' },
  { character: 'ゆ', romaji: 'yu', mnemonicText: 'Looks like a U-turn' },
  { character: 'よ', romaji: 'yo', mnemonicText: 'Looks like yo-yo' },
  { character: 'ら', romaji: 'ra', mnemonicText: 'Looks like ra sun rays' },
  { character: 'り', romaji: 'ri', mnemonicText: 'Looks like reeds' },
  { character: 'る', romaji: 'ru', mnemonicText: 'Looks like a loop' },
  { character: 'れ', romaji: 're', mnemonicText: 'Looks like a ray of light' },
  { character: 'ろ', romaji: 'ro', mnemonicText: 'Looks like a road' },
  { character: 'わ', romaji: 'wa', mnemonicText: 'Looks like a waffle' },
  { character: 'を', romaji: 'wo', mnemonicText: 'Looks like a whoa sign' },
  { character: 'ん', romaji: 'n', mnemonicText: 'Looks like an n' },
];

const katakana = [
  { character: 'ア', romaji: 'a' }, { character: 'イ', romaji: 'i' }, { character: 'ウ', romaji: 'u' },
  { character: 'エ', romaji: 'e' }, { character: 'オ', romaji: 'o' }, { character: 'カ', romaji: 'ka' },
  { character: 'キ', romaji: 'ki' }, { character: 'ク', romaji: 'ku' }, { character: 'ケ', romaji: 'ke' },
  { character: 'コ', romaji: 'ko' }, { character: 'サ', romaji: 'sa' }, { character: 'シ', romaji: 'shi' },
  { character: 'ス', romaji: 'su' }, { character: 'セ', romaji: 'se' }, { character: 'ソ', romaji: 'so' },
  { character: 'タ', romaji: 'ta' }, { character: 'チ', romaji: 'chi' }, { character: 'ツ', romaji: 'tsu' },
  { character: 'テ', romaji: 'te' }, { character: 'ト', romaji: 'to' }, { character: 'ナ', romaji: 'na' },
  { character: 'ニ', romaji: 'ni' }, { character: 'ヌ', romaji: 'nu' }, { character: 'ネ', romaji: 'ne' },
  { character: 'ノ', romaji: 'no' }, { character: 'ハ', romaji: 'ha' }, { character: 'ヒ', romaji: 'hi' },
  { character: 'フ', romaji: 'fu' }, { character: 'ヘ', romaji: 'he' }, { character: 'ホ', romaji: 'ho' },
  { character: 'マ', romaji: 'ma' }, { character: 'ミ', romaji: 'mi' }, { character: 'ム', romaji: 'mu' },
  { character: 'メ', romaji: 'me' }, { character: 'モ', romaji: 'mo' }, { character: 'ヤ', romaji: 'ya' },
  { character: 'ユ', romaji: 'yu' }, { character: 'ヨ', romaji: 'yo' }, { character: 'ラ', romaji: 'ra' },
  { character: 'リ', romaji: 'ri' }, { character: 'ル', romaji: 'ru' }, { character: 'レ', romaji: 're' },
  { character: 'ロ', romaji: 'ro' }, { character: 'ワ', romaji: 'wa' }, { character: 'ヲ', romaji: 'wo' },
  { character: 'ン', romaji: 'n' },
];

// ─── Grammar Skeletons (curated facts, not prose) ─────────────────────
const n5GrammarSkeletons = [
  { title: '〜は〜です', jlptLevel: 'N5', category: 'sentence_pattern', structurePattern: '[Noun]は[Noun/Adj]です' },
  { title: '〜が', jlptLevel: 'N5', category: 'particle', structurePattern: '[Noun]が[Verb/Adj]' },
  { title: '〜を', jlptLevel: 'N5', category: 'particle', structurePattern: '[Noun]を[Verb]' },
  { title: '〜に', jlptLevel: 'N5', category: 'particle', structurePattern: '[Place/Time]に[Verb]' },
  { title: '〜で', jlptLevel: 'N5', category: 'particle', structurePattern: '[Place]で[Verb] / [Means]で[Verb]' },
  { title: '〜と', jlptLevel: 'N5', category: 'particle', structurePattern: '[Noun]と[Noun] / [Person]と[Verb]' },
  { title: '〜も', jlptLevel: 'N5', category: 'particle', structurePattern: '[Noun]も' },
  { title: '〜の', jlptLevel: 'N5', category: 'particle', structurePattern: '[Noun]の[Noun]' },
  { title: '〜から〜まで', jlptLevel: 'N5', category: 'particle', structurePattern: '[Start]から[End]まで' },
  { title: '〜へ', jlptLevel: 'N5', category: 'particle', structurePattern: '[Direction]へ[Verb]' },
  { title: '〜ている', jlptLevel: 'N5', category: 'verb_form', structurePattern: '[Verb て-form]いる' },
  { title: '〜ない', jlptLevel: 'N5', category: 'verb_form', structurePattern: '[Verb ない-form]' },
  { title: '〜たい', jlptLevel: 'N5', category: 'verb_form', structurePattern: '[Verb stem]たい' },
  { title: '〜てください', jlptLevel: 'N5', category: 'verb_form', structurePattern: '[Verb て-form]ください' },
  { title: '〜ましょう', jlptLevel: 'N5', category: 'verb_form', structurePattern: '[Verb stem]ましょう' },
  { title: '〜た (past)', jlptLevel: 'N5', category: 'verb_form', structurePattern: '[Verb た-form]' },
];

const n4GrammarSkeletons = [
  { title: '〜ば', jlptLevel: 'N4', category: 'verb_form', structurePattern: '[Verb ば-form]' },
  { title: '〜たら', jlptLevel: 'N4', category: 'verb_form', structurePattern: '[Verb た-form]ら' },
  { title: '〜なら', jlptLevel: 'N4', category: 'sentence_pattern', structurePattern: '[Noun/Sentence]なら' },
  { title: '〜ても', jlptLevel: 'N4', category: 'verb_form', structurePattern: '[Verb て-form]も' },
  { title: '〜そうだ (appearance)', jlptLevel: 'N4', category: 'sentence_pattern', structurePattern: '[Verb stem / Adj stem]そうだ' },
  { title: '〜そうだ (hearsay)', jlptLevel: 'N4', category: 'sentence_pattern', structurePattern: '[Sentence plain form]そうだ' },
  { title: '〜ようにする', jlptLevel: 'N4', category: 'sentence_pattern', structurePattern: '[Verb dictionary form]ようにする' },
  { title: '〜ようになる', jlptLevel: 'N4', category: 'sentence_pattern', structurePattern: '[Verb dictionary form]ようになる' },
  { title: '受身形 (passive)', jlptLevel: 'N4', category: 'verb_form', structurePattern: '[Verb passive form] (られる)' },
  { title: '使役形 (causative)', jlptLevel: 'N4', category: 'verb_form', structurePattern: '[Verb causative form] (させる)' },
];

const n3GrammarSkeletons = [
  { title: '〜てしまう', jlptLevel: 'N3', category: 'verb_form', structurePattern: '[Verb て-form]しまう' },
  { title: '〜まま', jlptLevel: 'N3', category: 'sentence_pattern', structurePattern: '[Noun の/Verb た-form/Adj]まま' },
  { title: '〜ばかり', jlptLevel: 'N3', category: 'particle', structurePattern: '[Noun/Verb て-form]ばかり' },
  { title: '〜はずだ', jlptLevel: 'N3', category: 'sentence_pattern', structurePattern: '[Verb plain form/Noun の/Adj]はずだ' },
  { title: '〜ように', jlptLevel: 'N3', category: 'sentence_pattern', structurePattern: '[Verb dictionary form/ない-form]ように' },
  { title: '〜について', jlptLevel: 'N3', category: 'particle', structurePattern: '[Noun]について' },
  { title: '〜に対して', jlptLevel: 'N3', category: 'particle', structurePattern: '[Noun]に対して' },
  { title: '〜たびに', jlptLevel: 'N3', category: 'sentence_pattern', structurePattern: '[Verb dictionary form/Noun の]たびに' },
];

const n2GrammarSkeletons = [
  { title: '〜に違いない', jlptLevel: 'N2', category: 'sentence_pattern', structurePattern: '[Plain form]に違いない' },
  { title: '〜つつある', jlptLevel: 'N2', category: 'verb_form', structurePattern: '[Verb stem]つつある' },
  { title: '〜がちだ', jlptLevel: 'N2', category: 'sentence_pattern', structurePattern: '[Noun/Verb stem]がちだ' },
  { title: '〜ざるを得ない', jlptLevel: 'N2', category: 'verb_form', structurePattern: '[Verb ない-form]ざるを得ない' },
  { title: '〜をもとに', jlptLevel: 'N2', category: 'particle', structurePattern: '[Noun]をもとに' },
  { title: '〜一方だ', jlptLevel: 'N2', category: 'sentence_pattern', structurePattern: '[Verb dictionary form]一方だ' },
  { title: '〜かけだ', jlptLevel: 'N2', category: 'verb_form', structurePattern: '[Verb stem]かけだ' },
  { title: '〜抜きで', jlptLevel: 'N2', category: 'particle', structurePattern: '[Noun]抜きで' },
];

const n1GrammarSkeletons = [
  { title: '〜や否や', jlptLevel: 'N1', category: 'sentence_pattern', structurePattern: '[Verb dictionary form]や否や' },
  { title: '〜ごとく', jlptLevel: 'N1', category: 'sentence_pattern', structurePattern: '[Verb plain form/Noun の]ごとく' },
  { title: '〜んがため', jlptLevel: 'N1', category: 'verb_form', structurePattern: '[Verb ない-form (without ない)]んがため' },
  { title: '〜そばから', jlptLevel: 'N1', category: 'sentence_pattern', structurePattern: '[Verb dictionary form/た-form]そばから' },
  { title: '〜ばこそ', jlptLevel: 'N1', category: 'verb_form', structurePattern: '[Verb ば-form/Noun であれ]ばこそ' },
  { title: '〜ずにはすまない', jlptLevel: 'N1', category: 'verb_form', structurePattern: '[Verb ない-form]ずにはすまない' },
  { title: '〜ゆえに', jlptLevel: 'N1', category: 'sentence_pattern', structurePattern: '[Plain form]ゆえに' },
  { title: '〜からある', jlptLevel: 'N1', category: 'particle', structurePattern: '[Quantity/Measurement]からある' },
];

// ─── Sample Questions for Mock Tests ──────────────────────────────────
const sampleQuestions = [
  // N5 Questions
  { type: 'multiple_choice', jlptLevel: 'N5', sectionType: 'vocab', tags: ['vocab'], prompt: '「食べる」の意味は何ですか？\nWhat is the meaning of 「食べる」?', options: ['to drink', 'to eat', 'to sleep', 'to walk'], correctAnswer: 'to eat', explanation: '食べる (たべる) means "to eat".' },
  { type: 'multiple_choice', jlptLevel: 'N5', sectionType: 'vocab', tags: ['kanji'], prompt: '「大きい」の反対語は？\nWhat is the opposite of 「大きい」?', options: ['小さい', '長い', '高い', '速い'], correctAnswer: '小さい', explanation: '大きい means big. Its opposite is 小さい (small).' },
  { type: 'multiple_choice', jlptLevel: 'N5', sectionType: 'vocab', tags: ['kana'], prompt: '「学校」の読み方は？', options: ['がっこう', 'がくこう', 'がっこ', 'がくこ'], correctAnswer: 'がっこう', explanation: '学校 = がっこう (school).' },
  { type: 'multiple_choice', jlptLevel: 'N5', sectionType: 'grammar', tags: ['grammar'], prompt: '私＿学生です。Choose the correct particle:', options: ['を', 'に', 'は', 'が'], correctAnswer: 'は', explanation: 'は is the topic marker particle.' },
  { type: 'multiple_choice', jlptLevel: 'N5', sectionType: 'grammar', tags: ['grammar'], prompt: 'ご飯＿食べます。Choose the correct particle:', options: ['は', 'に', 'が', 'を'], correctAnswer: 'を', explanation: 'を marks the direct object of an action.' },

  // N4 Questions
  { type: 'multiple_choice', jlptLevel: 'N4', sectionType: 'vocab', tags: ['kanji'], prompt: '「図書館」の読み方は？', options: ['としょかん', 'とじょかん', 'どしょかん', 'どじょかん'], correctAnswer: 'としょかん', explanation: '図書館 = としょかん (library).' },
  { type: 'multiple_choice', jlptLevel: 'N4', sectionType: 'vocab', tags: ['vocab'], prompt: 'What does 「複雑な」 mean?', options: ['simple', 'complex', 'easy', 'strange'], correctAnswer: 'complex', explanation: '複雑な (ふくざつな) means complex/complicated.' },
  { type: 'multiple_choice', jlptLevel: 'N4', sectionType: 'vocab', tags: ['kana'], prompt: '「いしゃ」の漢字は？', options: ['医者', '歯医者', '学者', '記者'], correctAnswer: '医者', explanation: 'いしゃ = 医者 (doctor).' },
  { type: 'multiple_choice', jlptLevel: 'N4', sectionType: 'grammar', tags: ['grammar'], prompt: '明日雨が降ったら、試合は＿。', options: ['中止になる', '中止にしない', '中止になるそうだ', '中止にしよう'], correctAnswer: '中止になる', explanation: 'If it rains, the match will be cancelled. 降ったら -> 中止になる.' },
  
  // N3 Questions
  { type: 'multiple_choice', jlptLevel: 'N3', sectionType: 'vocab', tags: ['kanji'], prompt: '「経験」の読み方は？', options: ['けいけん', 'けっけん', 'けいげん', 'けっげん'], correctAnswer: 'けいけん', explanation: '経験 = けいけん (experience).' },
  { type: 'multiple_choice', jlptLevel: 'N3', sectionType: 'vocab', tags: ['vocab'], prompt: 'What is the meaning of 「努力」?', options: ['luck', 'effort', 'skill', 'talent'], correctAnswer: 'effort', explanation: '努力 (どりょく) means effort.' },
  { type: 'multiple_choice', jlptLevel: 'N3', sectionType: 'vocab', tags: ['kana'], prompt: '「じゅんび」の漢字は？', options: ['準備', '順番', '順調', '基準'], correctAnswer: '準備', explanation: 'じゅんび = 準備 (preparation).' },
  { type: 'multiple_choice', jlptLevel: 'N3', sectionType: 'grammar', tags: ['grammar'], prompt: '電車に傘を忘れて＿。', options: ['しまった', 'みた', 'おいた', 'ある'], correctAnswer: 'しまった', explanation: '〜てしまう expresses regret. 忘れてしまった (I accidentally forgot).' },

  // N2 Questions
  { type: 'multiple_choice', jlptLevel: 'N2', sectionType: 'vocab', tags: ['kanji'], prompt: '「環境」の読み方は？', options: ['かんきょう', 'かんきょ', 'かんごう', 'かんご'], correctAnswer: 'かんきょう', explanation: '環境 = かんきょう (environment).' },
  { type: 'multiple_choice', jlptLevel: 'N2', sectionType: 'vocab', tags: ['vocab'], prompt: 'What does 「影響」 mean?', options: ['result', 'cause', 'influence', 'shadow'], correctAnswer: 'influence', explanation: '影響 (えいきょう) means influence/effect.' },
  { type: 'multiple_choice', jlptLevel: 'N2', sectionType: 'vocab', tags: ['kana'], prompt: '「ほうこく」の漢字は？', options: ['報告', '広告', '宣告', '忠告'], correctAnswer: '報告', explanation: 'ほうこく = 報告 (report).' },
  { type: 'multiple_choice', jlptLevel: 'N2', sectionType: 'grammar', tags: ['grammar'], prompt: 'あのレストランは美味しい＿、いつも混んでいる。', options: ['に違いない', 'に決まっている', 'からといって', 'だけあって'], correctAnswer: 'だけあって', explanation: '〜だけあって means "as expected from...".' },

  // N1 Questions
  { type: 'multiple_choice', jlptLevel: 'N1', sectionType: 'vocab', tags: ['kanji'], prompt: '「矛盾」の読み方は？', options: ['むじゅん', 'むちゅん', 'むしゅん', 'むつん'], correctAnswer: 'むじゅん', explanation: '矛盾 = むじゅん (contradiction).' },
  { type: 'multiple_choice', jlptLevel: 'N1', sectionType: 'vocab', tags: ['vocab'], prompt: 'What does 「迅速な」 mean?', options: ['slow', 'careful', 'swift/prompt', 'reckless'], correctAnswer: 'swift/prompt', explanation: '迅速な (じんそくな) means swift, prompt, or quick.' },
  { type: 'multiple_choice', jlptLevel: 'N1', sectionType: 'vocab', tags: ['kana'], prompt: '「きばん」の漢字は？', options: ['基盤', '基板', '機番', '輝板'], correctAnswer: '基盤', explanation: 'きばん = 基盤 (foundation/base).' },
  { type: 'multiple_choice', jlptLevel: 'N1', sectionType: 'grammar', tags: ['grammar'], prompt: '彼は言い訳をする＿、すぐに出て行った。', options: ['や否や', 'が早いか', 'そばから', 'なり'], correctAnswer: 'や否や', explanation: '〜や否や means "as soon as". He left as soon as he made an excuse.' },
];

const seedDatabase = async () => {
  await connectDatabase();
  console.log('\n🌱 Starting database seed...\n');

  // Clear seed data
  await Promise.all([
    Kana.deleteMany({}),
    GrammarPoint.deleteMany({}),
    Question.deleteMany({}),
    TestTemplate.deleteMany({}),
  ]);
  console.log('🗑️  Cleared existing seed data');

  // Seed Kana
  await Kana.insertMany(hiragana.map(k => ({ ...k, script: 'hiragana' })));
  console.log(`✅ Seeded ${hiragana.length} hiragana`);
  await Kana.insertMany(katakana.map(k => ({ ...k, script: 'katakana' })));
  console.log(`✅ Seeded ${katakana.length} katakana`);

  // Seed Grammar Skeletons
  const allGrammar = [
    ...n5GrammarSkeletons, 
    ...n4GrammarSkeletons,
    ...n3GrammarSkeletons,
    ...n2GrammarSkeletons,
    ...n1GrammarSkeletons
  ].map(g => ({ ...g, source: 'curated_skeleton' }));
  
  await GrammarPoint.insertMany(allGrammar);
  console.log(`✅ Seeded ${allGrammar.length} grammar skeletons (N5-N1)`);

  // Seed Sample Questions
  const insertedQuestions = await Question.insertMany(sampleQuestions);
  console.log(`✅ Seeded ${insertedQuestions.length} sample questions`);

  // Seed Sample Tests
  const levels = ['N5', 'N4', 'N3', 'N2', 'N1'];
  for (const level of levels) {
    const levelQuestions = insertedQuestions.filter(q => q.jlptLevel === level);
    if (levelQuestions.length === 0) continue;

    await TestTemplate.create({
      title: `JLPT ${level} Practice Test 1`,
      jlptLevel: level,
      description: `A practice test covering ${level} vocabulary, kanji, kana, and grammar.`,
      sections: [
        { type: 'vocab', durationMinutes: 10, questions: levelQuestions.filter(q => q.sectionType === 'vocab').map(q => q._id) },
        { type: 'grammar', durationMinutes: 10, questions: levelQuestions.filter(q => q.sectionType === 'grammar').map(q => q._id) },
      ],
      totalDurationMinutes: 20,
    });
  }
  
  console.log('✅ Seeded mock tests for N5-N1');

  console.log('\n🎉 Seed complete!\n');
  await mongoose.disconnect();
  process.exit(0);
};

seedDatabase().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
