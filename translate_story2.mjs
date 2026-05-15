/**
 * Batch-translate 284 story strings from Chinese to English
 * using the built-in LLM API.
 */
import { readFileSync, writeFileSync } from 'fs';
import { config } from 'dotenv';
config();

const API_URL = (process.env.BUILT_IN_FORGE_API_URL || 'https://forge.manus.ai').replace(/\/$/, '');
const API_KEY = process.env.BUILT_IN_FORGE_API_KEY;
const ENDPOINT = `${API_URL}/v1/chat/completions`;

if (!API_KEY) {
  console.error('Missing BUILT_IN_FORGE_API_KEY');
  process.exit(1);
}

const strings = JSON.parse(readFileSync('/home/ubuntu/story_strings2.json', 'utf-8'));
console.log(`Translating ${strings.length} strings to endpoint: ${ENDPOINT}`);

async function translateBatch(batch, batchIndex) {
  const numbered = batch.map((s, i) => `${i + 1}. ${s}`).join('\n');
  const prompt = `You are translating a business simulation game from Chinese to English.

Game context: An Integration Lead at a multinational corporation drives organizational change after an acquisition. 
12 key stakeholders (CEO, Regional GM, HR Director, Finance Director, IT Manager, Sales Director, Operations Manager, Legal Counsel, Union Rep, Marketing Manager, Senior Engineer, Factory Workers) each have their own stance.

Translation rules:
- Keep game mechanics terms: Credibility, Resistance, Resources, Score (already in English in some strings)
- Keep emoji as-is (⚠️ 📈 🔓 ✅ etc.)
- Keep character names already in English
- Keep +/- numbers as-is
- Translate 以身作则 as "lead by example"
- Translate 可信度 as "Credibility", 反抗阻力 as "Resistance", 资源 as "Resources"
- Keep the narrative tone: punchy, present tense, game-like
- For warning strings starting with ⚠️, keep that format
- For strings with 【...】, translate the content inside brackets too

Return ONLY a JSON array of ${batch.length} translated strings in the same order.
Do NOT include the numbers. Do NOT add any explanation.

Input:
${numbered}`;

  const response = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: 'claude-3-5-haiku-20241022',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 3000,
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`API error ${response.status}: ${err.substring(0, 200)}`);
  }

  const data = await response.json();
  const text = data.choices[0].message.content.trim();
  
  // Parse JSON array from response
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    console.error(`Batch ${batchIndex}: No JSON array found in:`, text.substring(0, 300));
    return null;
  }
  
  try {
    const translated = JSON.parse(jsonMatch[0]);
    if (translated.length !== batch.length) {
      console.warn(`Batch ${batchIndex}: Expected ${batch.length}, got ${translated.length}`);
    }
    return translated;
  } catch (e) {
    console.error(`Batch ${batchIndex}: JSON parse error:`, e.message, text.substring(0, 200));
    return null;
  }
}

const BATCH_SIZE = 30;
const translations = {};
const batches = [];
for (let i = 0; i < strings.length; i += BATCH_SIZE) {
  batches.push(strings.slice(i, i + BATCH_SIZE));
}

console.log(`Processing ${batches.length} batches of ${BATCH_SIZE}...`);

for (let i = 0; i < batches.length; i++) {
  const batch = batches[i];
  console.log(`Batch ${i + 1}/${batches.length} (${batch.length} strings)...`);
  
  let translated = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      translated = await translateBatch(batch, i + 1);
      if (translated) break;
    } catch (e) {
      console.error(`  Attempt ${attempt + 1} failed:`, e.message);
      if (attempt < 2) await new Promise(r => setTimeout(r, 2000));
    }
  }
  
  if (translated) {
    batch.forEach((original, j) => {
      translations[original] = translated[j] || original;
    });
    console.log(`  ✓ Done. Sample: "${batch[0].substring(0, 40)}" → "${(translated[0] || '').substring(0, 40)}"`);
  } else {
    console.error(`  ✗ All attempts failed, keeping originals`);
    batch.forEach(s => { translations[s] = s; });
  }
  
  if (i < batches.length - 1) {
    await new Promise(r => setTimeout(r, 800));
  }
}

writeFileSync('/home/ubuntu/story_translations2.json', JSON.stringify(translations, null, 2), 'utf-8');
const translated_count = Object.values(translations).filter((v, i) => v !== Object.keys(translations)[i]).length;
console.log(`\n✅ Done! Saved ${Object.keys(translations).length} translations to /home/ubuntu/story_translations2.json`);
