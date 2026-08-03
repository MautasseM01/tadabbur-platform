#!/usr/bin/env node
/**
 * Platform data verification (no dependencies):
 * 1. Every surah (1-114) loads from api.alquran.cloud with clean UTF-8 Arabic.
 * 2. Every YouTube ID (audio + videos) resolves via the oEmbed endpoint.
 * 3. The linguistic-agent word analysis endpoint answers (cached words instant).
 *
 * Usage: node scripts/verify-data.mjs [--prod] [--analyze]
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const isProd = args.includes('--prod');
const withAnalyze = args.includes('--analyze');

const BASE = isProd
  ? 'https://tadabbur-platform-mautassem01s-projects.vercel.app'
  : 'http://localhost:3000';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const strip = (s) => (s || '').replace(/[\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/g, '');

const results = [];
const record = (check, pass, detail) => {
  results.push({ check, pass, detail });
  console.log(`${pass ? 'PASS' : 'FAIL'} | ${check} | ${detail}`);
};

async function fetchWithRetry(url, opts = {}, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    const res = await fetch(url, opts);
    if (res.status !== 429 && res.status < 500) return res;
    await sleep(1500 * attempt);
  }
  return fetch(url, opts);
}

// ---------- 1. Surah availability ----------
async function verifySurahs() {
  console.log('\n== 1. All 114 surahs from api.alquran.cloud ==');
  const failIds = [];
  let checked = 0;
  for (let id = 1; id <= 114; id++) {
    try {
      const res = await fetchWithRetry(`https://api.alquran.cloud/v1/surah/${id}/ar.quran-simple`, {
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const buffer = await res.arrayBuffer();
      const text = new TextDecoder('utf-8').decode(buffer);
      if (text.includes('\uFFFD')) throw new Error('mojibake (replacement char)');
      const json = JSON.parse(text);
      const name = json?.data?.name || '';
      const ayahCount = json?.data?.ayahs?.length || 0;
      if (!name || name.includes('?') || ayahCount === 0) {
        throw new Error(`bad payload name=${JSON.stringify(name)} ayahs=${ayahCount}`);
      }
      checked++;
      if (id % 25 === 0) console.log(`  ...${id}/114 ok`);
    } catch (e) {
      failIds.push(`${id} (${e.message})`);
    }
  }
  record('surahs 1-114', failIds.length === 0, failIds.length === 0 ? `all ${checked}/114 loaded` : `failed: ${failIds.join(', ')}`);
}

// ---------- 2. YouTube IDs ----------
async function checkYoutube(id, label) {
  if (!id) return { ok: false, detail: `${label}: empty id` };
  const url = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${id}&format=json`;
  try {
    const res = await fetchWithRetry(url);
    if (res.status !== 200) return { ok: false, detail: `${label} (${id}): HTTP ${res.status}` };
    const j = await res.json();
    if (!j?.title) return { ok: false, detail: `${label} (${id}): no title` };
    return { ok: true, detail: `${label} (${id}): OK — ${String(j.title).slice(0, 60)}` };
  } catch (e) {
    return { ok: false, detail: `${label} (${id}): ${e.message}` };
  }
}

async function verifyMedia() {
  console.log('\n== 2. YouTube IDs (audio + videos) ==');
  const ids = new Map();

  // Embedded audio map (AUDIO_YOUTUBE_IDS) + local JSON DB
  ids.set('surah 1 (fatiha audio)', 'MDVTdJRGKOo');
  ids.set('surah 21 (anbiya audio)', '0h7Cuotfbjw');
  const dbPath = join(__dirname, '..', 'data', 'app-db.json');
  let db = { videos: [], surahAudioIds: {} };
  try {
    db = JSON.parse(readFileSync(dbPath, 'utf-8'));
  } catch (e) {
    console.warn('  (cannot read data/app-db.json:', e.message + ')');
  }
  for (const [sid, yt] of Object.entries(db.surahAudioIds || {})) {
    if (yt) ids.set(`surah ${sid} audio`, yt);
  }
  for (const v of db.videos || []) {
    if (v.youtubeId && !v.youtubeId.startsWith('V_xyz_dummy')) ids.set(`video ${v.id}`, v.youtubeId);
  }

  let ok = 0;
  let fails = [];
  const checks = [...ids.entries()];
  for (let i = 0; i < checks.length; i++) {
    const [label, id] = checks[i];
    const r = await checkYoutube(id, label);
    if (r.ok) ok++;
    else fails.push(r.detail);
    await sleep(150);
  }
  record('youtube ids (' + checks.length + ')', fails.length === 0, fails.length === 0 ? `all ${ok} valid` : `broken: ${fails.join(' | ')}`);
}

// ---------- 3. Word analysis endpoint ----------
async function verifyAnalyze() {
  console.log('\n== 3. Linguistic agent endpoint ==');
  const cases = [
    { word: 'الدِّينِ', root: 'دِّ', expect: 'دين', seeded: true },
    { word: 'مَالِكِ', root: 'ملك', expect: 'ملك', seeded: true },
    { word: 'الضَّالِّينَ', root: 'ضلل', expect: 'ضلل', seeded: true },
    { word: 'أُوحِيَ', root: 'وحي', expect: 'وحي', seeded: true },
    { word: 'اسْتَمَعَ', root: 'سمع', expect: 'سمع', seeded: true },
    { word: 'الْجِنِّ', root: 'جنن', expect: 'جنن', seeded: true },
    { word: 'قُرْآنًا', root: 'قرا', expect: 'قرأ', seeded: true },
    { word: 'عَجَبًا', root: 'عجب', expect: 'عجب', seeded: true },
    { word: 'الرُّشْدِ', root: 'رشد', expect: 'رشد', seeded: true },
    { word: 'نُشْرِكَ', root: 'شرك', expect: 'شرك', seeded: true },
    { word: 'أَحَدًا', root: 'احد', expect: 'أحد', seeded: true },
  ];
  for (const c of cases) {
    const started = Date.now();
    try {
      const res = await fetch(`${BASE}/api/gemini/analyze-word`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wordText: c.word,
          root: c.root,
          context: 'مَالِكِ يَوْمِ الدِّينِ',
          provider: 'openrouter',
          model: 'openrouter/free',
        }),
      });
      const data = await res.json();
      const secs = Math.round((Date.now() - started) / 1000);
      const gotRoot = data?.wordAnalysis?.root;
      const pass = res.status === 200 && gotRoot === c.expect;
      record(`analyze-word ${c.word}`,
        pass,
        `${secs}s fallback=${data.usedFallback} cached=${data.cached} root=${gotRoot} refs=${data?.wordAnalysis?.lexiconReferences?.length ?? 0}`);
    } catch (e) {
      record(`analyze-word ${c.word}`, false, e.message);
    }
  }
}

(async () => {
  await verifySurahs();
  await verifyMedia();
  if (withAnalyze) await verifyAnalyze();

  const fails = results.filter((r) => !r.pass).length;
  console.log(`\n== SUMMARY: ${results.length - fails}/${results.length} passed ==`);
  process.exit(fails === 0 ? 0 : 1);
})();