/**
 * Batch-translate 400 story strings from Chinese to English
 * using the built-in LLM API.
 * Processes in batches of 40 strings to stay within token limits.
 */
import { readFileSync, writeFileSync } from 'fs';
import { config } from 'dotenv';
config();

const API_URL = process.env.BUILT_IN_FORGE_API_URL;
const API_KEY = process.env.BUILT_IN_FORGE_API_KEY;

if (!API_URL || !API_KEY) {
  console.error('Missing BUILT_IN_FORGE_API_URL or BUILT_IN_FORGE_API_KEY');
  process.exit(1);
}

const strings = JSON.parse(readFileSync('/home/ubuntu/story_strings.json', 'utf-8'));
console.log(`Translating ${strings.length} strings...`);

async function translateBatch(batch, batchIndex) {
  const numbered = batch.map((s, i) => `${i + 1}. ${s}`).join('\n');
  const prompt = `You are translating a business simulation game from Chinese to English.
The game is about an Integration Lead at a multinational corporation driving organizational change after an acquisition.
Context: The player leads change management, working with 12 key stakeholders (executives, managers, workers).
Action types: demonstrate, communicate, enable, institutionalize, interview, social gathering, etc.

Translate each numbered string from Chinese to English. Keep:
- Game mechanics terms (Credibility, Resistance, Resources, Score) capitalized
- Character names already in English (they were pre-translated)
- Emoji and special characters as-is
- Short, punchy narrative style
- Warning/status prefixes like ⚠️ 📈 🔓 as-is

Return ONLY a JSON array of translated strings in the same order, no extra text.
Example input: ["1. 你以身作则", "2. 可信度 +2"]
Example output: ["You lead by example", "Credibility +2"]

Strings to translate:
${numbered}`;

  const baseUrl = API_URL.replace(/\/$/, '');
  const endpoint = baseUrl.includes('/v1') ? `${baseUrl}/chat/completions` : `${baseUrl}/v1/chat/completions`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: 'claude-3-5-haiku-20241022',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 4000,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`API error ${response.status}: ${err}`);
  }

  const data = await response.json();
  const text = data.choices[0].message.content.trim();
  
  // Parse JSON array from response
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    console.error(`Batch ${batchIndex}: Could not parse JSON from response:`, text.substring(0, 200));
    return batch; // Return original on failure
  }
  
  try {
    const translated = JSON.parse(jsonMatch[0]);
    if (translated.length !== batch.length) {
      console.warn(`Batch ${batchIndex}: Expected ${batch.length} translations, got ${translated.length}`);
    }
    return translated;
  } catch (e) {
    console.error(`Batch ${batchIndex}: JSON parse error:`, e.message);
    return batch;
  }
}

const BATCH_SIZE = 40;
const translations = {};
const batches = [];
for (let i = 0; i < strings.length; i += BATCH_SIZE) {
  batches.push(strings.slice(i, i + BATCH_SIZE));
}

console.log(`Processing ${batches.length} batches of ${BATCH_SIZE}...`);

for (let i = 0; i < batches.length; i++) {
  const batch = batches[i];
  console.log(`Batch ${i + 1}/${batches.length} (${batch.length} strings)...`);
  try {
    const translated = await translateBatch(batch, i + 1);
    batch.forEach((original, j) => {
      translations[original] = translated[j] || original;
    });
    console.log(`  ✓ Batch ${i + 1} done. Sample: "${batch[0]}" → "${translated[0]}"`);
  } catch (e) {
    console.error(`  ✗ Batch ${i + 1} failed:`, e.message);
    batch.forEach(s => { translations[s] = s; }); // Keep original on failure
  }
  // Small delay between batches
  if (i < batches.length - 1) {
    await new Promise(r => setTimeout(r, 500));
  }
}

writeFileSync('/home/ubuntu/story_translations.json', JSON.stringify(translations, null, 2), 'utf-8');
console.log(`\n✅ Done! Saved ${Object.keys(translations).length} translations to /home/ubuntu/story_translations.json`);
