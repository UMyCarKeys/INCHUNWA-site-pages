#!/usr/bin/env node
/**
 * Syncs new episodes from the Buzzsprout RSS feed into src/content/episodes/
 *
 * Run manually:  node scripts/sync-episodes.mjs
 * Run in CI:     same command — no build step needed
 *
 * Safe to run at any time:
 *  - Episodes already in content/ are identified by their Buzzsprout episode ID
 *    (extracted from audioUrl) and skipped, so hand-edited metadata is preserved.
 *  - New episodes get a stub file with RSS data. Add series, tags, transcripts etc. manually.
 */

import { writeFileSync, readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const EPISODES_DIR = join(__dirname, '../src/content/episodes');
const FEED_URL = 'https://rss.buzzsprout.com/1810796.rss';
const PODCAST_ID = '1810796';

// ---------------------------------------------------------------------------
// XML helpers (no deps — Buzzsprout RSS is predictably structured)
// ---------------------------------------------------------------------------

function extractTag(xml, tag) {
  // CDATA first
  const cdata = xml.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`, 'i'));
  if (cdata) return cdata[1].trim();
  const plain = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
  return plain ? plain[1].trim() : '';
}

function extractAttr(xml, tag, attr) {
  const match = xml.match(new RegExp(`<${tag}[^>]*?\\s${attr}="([^"]*)"`, 'i'));
  return match ? match[1] : '';
}

function parseItems(xml) {
  const items = [];
  const re = /<item>([\s\S]*?)<\/item>/gi;
  let m;
  while ((m = re.exec(xml)) !== null) items.push(m[1]);
  return items;
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

/** Strip HTML tags and decode common entities */
function stripHtml(html) {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Escape double-quotes for YAML frontmatter strings */
function yamlStr(s) {
  return s.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

/** Convert seconds (integer or string) to HH:MM:SS */
function secondsToHMS(raw) {
  // Already formatted (HH:MM:SS or MM:SS)
  if (/^\d+:\d+/.test(raw)) return raw.includes(':') && raw.split(':').length === 3 ? raw : `00:${raw}`;
  const total = Math.floor(Number(raw));
  if (isNaN(total)) return '00:00:00';
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/** Slugify a title for use in filenames */
function slugify(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 50);
}

/**
 * Extract Buzzsprout numeric episode ID.
 * Supports:
 *   guid  "Buzzsprout-17755788"
 *   url   "https://www.buzzsprout.com/1810796/episodes/17755788-slug.mp3"
 *   url   "https://www.buzzsprout.com/1810796/17755788.mp3"
 */
function extractId(guidOrUrl) {
  const fromGuid = guidOrUrl.match(/Buzzsprout-(\d+)/i);
  if (fromGuid) return fromGuid[1];
  const fromUrl = guidOrUrl.match(/buzzsprout\.com\/\d+\/(?:episodes\/)?(\d+)/i);
  return fromUrl ? fromUrl[1] : null;
}

// ---------------------------------------------------------------------------
// Existing episode IDs
// ---------------------------------------------------------------------------

function getExistingIds() {
  const ids = new Set();
  for (const file of readdirSync(EPISODES_DIR).filter(f => f.endsWith('.md'))) {
    const content = readFileSync(join(EPISODES_DIR, file), 'utf8');
    const m = content.match(/audioUrl:\s*"([^"]+)"/);
    if (m) {
      const id = extractId(m[1]);
      if (id) ids.add(id);
    }
  }
  return ids;
}

// ---------------------------------------------------------------------------
// Parse a single RSS <item>
// ---------------------------------------------------------------------------

function parseEpisode(item) {
  const guid = extractTag(item, 'guid');
  const episodeId = extractId(guid) || extractId(extractAttr(item, 'enclosure', 'url'));
  if (!episodeId) return null;

  const title = extractTag(item, 'title');
  if (!title) return null;

  const rawDesc = extractTag(item, 'description') || extractTag(item, 'itunes:summary') || '';
  const description = stripHtml(rawDesc).slice(0, 280);

  const pubDateStr = extractTag(item, 'pubDate');
  const pubDate = new Date(pubDateStr);
  if (isNaN(pubDate.getTime())) return null;
  const pubDateFormatted = pubDate.toISOString().split('T')[0];

  const duration = secondsToHMS(extractTag(item, 'itunes:duration'));
  const episodeNumber = parseInt(extractTag(item, 'itunes:episode'), 10) || null;
  const episodeTypeRaw = extractTag(item, 'itunes:episodeType') || 'full';
  const episodeType = ['full', 'trailer', 'bonus'].includes(episodeTypeRaw) ? episodeTypeRaw : 'full';
  const explicit = extractTag(item, 'itunes:explicit') === 'true';
  const audioLength = parseInt(extractAttr(item, 'enclosure', 'length'), 10) || null;

  const audioUrl = `https://www.buzzsprout.com/${PODCAST_ID}/episodes/${episodeId}.mp3`;

  return { id: episodeId, title, description, pubDate: pubDateFormatted, episodeNumber, episodeType, duration, audioUrl, audioLength, explicit };
}

// ---------------------------------------------------------------------------
// Generate markdown file content
// ---------------------------------------------------------------------------

function generateMarkdown(ep) {
  const lines = [
    '---',
    `title: "${yamlStr(ep.title)}"`,
    `description: "${yamlStr(ep.description)}"`,
    `pubDate: ${ep.pubDate}`,
  ];

  if (ep.episodeNumber) lines.push(`episodeNumber: ${ep.episodeNumber}`);
  lines.push(`episodeType: "${ep.episodeType}"`);
  lines.push(`duration: "${ep.duration}"`);
  lines.push(`audioUrl: "${ep.audioUrl}"`);
  if (ep.audioLength) lines.push(`audioLength: ${ep.audioLength}`);
  lines.push(`explicit: ${ep.explicit}`);
  lines.push('featured: false');
  lines.push('tags: []');
  lines.push('draft: false');
  lines.push('---');
  lines.push('');
  lines.push(ep.description);
  lines.push('');

  return lines.join('\n');
}

function generateFilename(ep) {
  const prefix = ep.episodeNumber ? `ep-${ep.episodeNumber}` : `ep`;
  return `${prefix}-${slugify(ep.title)}.md`;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log(`Fetching ${FEED_URL} ...`);
  const res = await fetch(FEED_URL);
  if (!res.ok) throw new Error(`RSS fetch failed: ${res.status} ${res.statusText}`);
  const xml = await res.text();

  const existing = getExistingIds();
  console.log(`Existing episodes: ${existing.size}`);

  const items = parseItems(xml);
  console.log(`Feed episodes:     ${items.length}`);

  let created = 0;
  for (const item of items) {
    const ep = parseEpisode(item);
    if (!ep) { console.log('  [skip] could not parse item'); continue; }
    if (existing.has(ep.id)) { console.log(`  [skip] ${ep.title}`); continue; }

    const filename = generateFilename(ep);
    writeFileSync(join(EPISODES_DIR, filename), generateMarkdown(ep), 'utf8');
    console.log(`  [new]  ${filename}`);
    created++;
  }

  console.log(`\nDone — ${created} new episode(s) created.`);
}

main().catch(err => { console.error(err); process.exit(1); });
