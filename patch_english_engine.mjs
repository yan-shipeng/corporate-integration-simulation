#!/usr/bin/env node
/**
 * Patch the Chinese game engine to create an English version.
 * Replaces PEOPLE, STATUS_LABELS, ROLES, ACTION_GROUPS, ACTION_TYPE_ALIASES,
 * and action label/desc/cooldownReason strings.
 * 
 * Run: node patch_english_engine.mjs
 */
import fs from 'fs';

const srcPath = '/home/ubuntu/china-outbound-online/client/src/game-engine.html';
const outPath = '/home/ubuntu/china-outbound-online/client/src/game-engine-en.html';

let content = fs.readFileSync(srcPath, 'utf8');

// ─── 1. Replace PEOPLE ────────────────────────────────────────────────────────
const peopleRaw = fs.readFileSync('/home/ubuntu/translated_people.js', 'utf8').trim();
// Extract just the object body (strip markdown fences if any)
const peopleCleaned = peopleRaw.replace(/^```[a-z]*\n?/m, '').replace(/\n?```$/m, '').trim();

const peopleStart = content.indexOf('const PEOPLE={');
const peopleEnd = content.indexOf('\nconst AVATARS=', peopleStart);
if (peopleStart === -1 || peopleEnd === -1) {
  console.error('Could not find PEOPLE block');
  process.exit(1);
}
content = content.slice(0, peopleStart) + peopleCleaned + '\n' + content.slice(peopleEnd);
console.log('✓ PEOPLE replaced');

// ─── 2. Replace STATUS_LABELS ─────────────────────────────────────────────────
content = content.replace(
  "const STATUS_LABELS=['未动','意识觉醒','初步理解','主动参与','已转化'];",
  "const STATUS_LABELS=['Unaware','Aware','Interested','Committed','Converted'];"
);
console.log('✓ STATUS_LABELS replaced');

// ─── 3. Replace ROLES ─────────────────────────────────────────────────────────
const rolesRaw = fs.readFileSync('/home/ubuntu/translated_roles.js', 'utf8').trim();
const rolesCleaned = rolesRaw.replace(/^```[a-z]*\n?/m, '').replace(/\n?```$/m, '').trim();

// Find and replace the ROLES block
const rolesStart = content.indexOf('const ROLES = {');
if (rolesStart === -1) {
  console.error('Could not find ROLES block');
  process.exit(1);
}
// Find end of ROLES (closing };)
let braceCount = 0;
let rolesEnd = rolesStart;
for (let i = rolesStart; i < content.length; i++) {
  if (content[i] === '{') braceCount++;
  if (content[i] === '}') {
    braceCount--;
    if (braceCount === 0) {
      rolesEnd = i + 1;
      // consume trailing semicolon
      if (content[rolesEnd] === ';') rolesEnd++;
      break;
    }
  }
}

// Extract just the ROLES const from rolesCleaned
const rolesMatch = rolesCleaned.match(/const ROLES\s*=\s*\{[\s\S]*?\};/);
if (rolesMatch) {
  content = content.slice(0, rolesStart) + rolesMatch[0] + content.slice(rolesEnd);
  console.log('✓ ROLES replaced');
} else {
  console.warn('⚠ Could not extract ROLES from translated file, skipping');
}

// ─── 4. Replace ACTION_GROUPS ─────────────────────────────────────────────────
const agMatch = rolesCleaned.match(/const ACTION_GROUPS\s*=\s*\[[\s\S]*?\];/);
if (agMatch) {
  const agStart = content.indexOf('const ACTION_GROUPS = [');
  if (agStart !== -1) {
    let bracketCount = 0;
    let agEnd = agStart;
    for (let i = agStart; i < content.length; i++) {
      if (content[i] === '[') bracketCount++;
      if (content[i] === ']') {
        bracketCount--;
        if (bracketCount === 0) {
          agEnd = i + 1;
          if (content[agEnd] === ';') agEnd++;
          break;
        }
      }
    }
    content = content.slice(0, agStart) + agMatch[0] + content.slice(agEnd);
    console.log('✓ ACTION_GROUPS replaced');
  }
}

// ─── 5. Replace ACTION_TYPE_ALIASES ──────────────────────────────────────────
const ataMatch = rolesCleaned.match(/const ACTION_TYPE_ALIASES\s*=\s*\{[\s\S]*?\};/);
if (ataMatch) {
  const ataStart = content.indexOf('const ACTION_TYPE_ALIASES = {');
  if (ataStart !== -1) {
    let braceCount2 = 0;
    let ataEnd = ataStart;
    for (let i = ataStart; i < content.length; i++) {
      if (content[i] === '{') braceCount2++;
      if (content[i] === '}') {
        braceCount2--;
        if (braceCount2 === 0) {
          ataEnd = i + 1;
          if (content[ataEnd] === ';') ataEnd++;
          break;
        }
      }
    }
    content = content.slice(0, ataStart) + ataMatch[0] + content.slice(ataEnd);
    console.log('✓ ACTION_TYPE_ALIASES replaced');
  }
}

// ─── 6. Replace PRESSURE_RELIEF_ACTION ───────────────────────────────────────
const praMatch = rolesCleaned.match(/const PRESSURE_RELIEF_ACTION\s*=\s*\{[\s\S]*?\};/);
if (praMatch) {
  const praStart = content.indexOf('const PRESSURE_RELIEF_ACTION = {');
  if (praStart !== -1) {
    let braceCount3 = 0;
    let praEnd = praStart;
    for (let i = praStart; i < content.length; i++) {
      if (content[i] === '{') braceCount3++;
      if (content[i] === '}') {
        braceCount3--;
        if (braceCount3 === 0) {
          praEnd = i + 1;
          if (content[praEnd] === ';') praEnd++;
          break;
        }
      }
    }
    content = content.slice(0, praStart) + praMatch[0] + content.slice(praEnd);
    console.log('✓ PRESSURE_RELIEF_ACTION replaced');
  }
}

// ─── 7. Replace STATUS_LABELS in ROLES (from translated_roles.js) ────────────
const slMatch = rolesCleaned.match(/const STATUS_LABELS\s*=\s*\[[\s\S]*?\];/);
if (slMatch) {
  // Already replaced above, skip
  console.log('✓ STATUS_LABELS already replaced');
}

// ─── 8. Replace individual action label/desc/cooldownReason ──────────────────
const actionsMetaRaw = fs.readFileSync('/home/ubuntu/translated_actions_meta.json', 'utf8').trim();
const actionsMeta = JSON.parse(actionsMetaRaw.replace(/^```[a-z]*\n?/m, '').replace(/\n?```$/m, '').trim());

for (const action of actionsMeta) {
  const { id, label, type, desc, cooldownReason } = action;
  
  // Replace label (inside the action object, after id:'...')
  // Pattern: id:'exemplify',label:'以身作则'
  const labelRe = new RegExp(`(id:'${id}',label:')[^']*(')`);
  if (labelRe.test(content)) {
    content = content.replace(labelRe, `$1${label}$2`);
  }
  
  // Replace type
  const typeRe = new RegExp(`(id:'${id}'[^}]{0,200}type:')[^']*(')`);
  if (typeRe.test(content)) {
    content = content.replace(typeRe, `$1${type}$2`);
  }
  
  // Replace desc — use a more targeted approach
  // Find the action block by id and replace desc within it
  const actionBlockStart = content.indexOf(`{id:'${id}',`);
  if (actionBlockStart !== -1) {
    // Find the end of this action object
    let bCount = 0;
    let actionBlockEnd = actionBlockStart;
    for (let i = actionBlockStart; i < content.length; i++) {
      if (content[i] === '{') bCount++;
      if (content[i] === '}') {
        bCount--;
        if (bCount === 0) {
          actionBlockEnd = i + 1;
          break;
        }
      }
    }
    let block = content.slice(actionBlockStart, actionBlockEnd);
    
    // Replace desc in block
    block = block.replace(/,desc:'[^']*'/, `,desc:'${desc.replace(/'/g, "\\'")}'`);
    // Replace cooldownReason in block
    block = block.replace(/,cooldownReason:'[^']*'/, `,cooldownReason:'${cooldownReason.replace(/'/g, "\\'")}'`);
    
    content = content.slice(0, actionBlockStart) + block + content.slice(actionBlockEnd);
  }
}
console.log('✓ Action labels/desc/cooldownReason replaced');

// ─── 9. Replace prefs keys in PEOPLE (示范→demonstrate etc.) ─────────────────
// These are in the PEOPLE block which was already replaced with translated version
// But the translated PEOPLE might still have Chinese prefs keys if LLM didn't convert them
// Let's do a global replacement as safety net
content = content.replace(/'示范'/g, "'demonstrate'");
content = content.replace(/'沟通'/g, "'communicate'");
content = content.replace(/'赋能'/g, "'enable'");
content = content.replace(/'制度'/g, "'institutionalize'");
console.log('✓ Prefs keys normalized');

// ─── 10. Replace UI strings ───────────────────────────────────────────────────
// Title
content = content.replace(
  /<title>中国企业出海整合管理<\/title>/,
  '<title>Global Integration Challenge</title>'
);
// Header title in game HUD
content = content.replace(/中国企业出海整合管理/g, 'Global Integration Challenge');
// Faction labels
content = content.replace(/faction:'总部'/g, "faction:'HQ'");
content = content.replace(/faction:'当地'/g, "faction:'Local'");
// Common UI labels
content = content.replace(/'总部'/g, "'HQ'");
content = content.replace(/'当地'/g, "'Local'");
// Status comment
content = content.replace(
  '/* 状态字形（双编码核心）：未动○ → 觉醒◔ → 理解◑ → 参与◕ → 已转化● */',
  '/* Status glyphs: Unaware○ → Aware◔ → Interested◑ → Committed◕ → Converted● */'
);
console.log('✓ UI strings replaced');

// ─── 11. Replace PRESSURE_RELIEF_ACTION label/desc ───────────────────────────
content = content.replace(
  "label: '缓解组织压力'",
  "label: 'Relieve Organizational Pressure'"
);
content = content.replace(
  "type: '沟通'",
  "type: 'communicate'"
);
content = content.replace(
  "desc: '当组织压力过高时，主动采取措施缓解紧张局势。'",
  "desc: 'When organizational pressure is too high, proactively take steps to ease tension.'"
);
console.log('✓ PRESSURE_RELIEF_ACTION text replaced');

// ─── Write output ─────────────────────────────────────────────────────────────
fs.writeFileSync(outPath, content, 'utf8');
console.log(`\n✅ English engine written to: ${outPath}`);
console.log(`   Size: ${(content.length / 1024).toFixed(0)} KB`);
