#!/usr/bin/env node
// gsdlite.js — PapperPilot, copilote de rédaction scientifique

import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import https from 'https'
import { execFileSync, execSync } from 'child_process'

// ─────────────────────────────────────────
// CONFIG
// ─────────────────────────────────────────

const PLANS_DIR   = '.plans'
const SOURCES_DIR = 'corpus'
const PDFS_DIR    = path.join(SOURCES_DIR, 'pdfs')
const BIB_DIR     = path.join(SOURCES_DIR, 'bib')
const NOTES_DIR   = path.join(SOURCES_DIR, 'notes')
const INDEX_FILE  = path.join(SOURCES_DIR, '_index.json')
const MERGED_BIB  = path.join(SOURCES_DIR, '_merged.bib')
const ABSTRACTS_CACHE = path.join(SOURCES_DIR, '_abstracts-cache.json')
const OUTPUT_DIR  = 'output'
const PAPER_MD    = path.join(OUTPUT_DIR, 'paper.md')
const PAPER_PDF   = path.join(OUTPUT_DIR, 'paper.pdf')
const PAPER_BIB   = path.join(OUTPUT_DIR, 'bibliography.bib')
const CLI_ROOT = path.dirname(path.resolve(process.argv[1] || 'gsdlite.js'))
const SCRIPTS_DIR = path.join(CLI_ROOT, 'scripts')
const CSL_IEEE    = path.join(SCRIPTS_DIR, 'ieee.csl')

// ─────────────────────────────────────────
// UTILS
// ─────────────────────────────────────────

const log  = (emoji, msg) => console.log(`${emoji}  ${msg}`)
const warn = (msg)        => console.warn(`⚠️   ${msg}`)
const err  = (msg)        => console.error(`❌  ${msg}`)
const ok   = (msg)        => console.log(`✅  ${msg}`)
const PRIMARY_CLI = 'node papperpilot.js'

const TEMPLATES_DIR = path.join(CLI_ROOT, 'scripts', 'templates')
const PLANNING_DIR  = '.planning'

// List of template files that install.sh seeds in .planning/
const PLANNING_TEMPLATES = [
  'config.json',
  'STATE.md',
  'PROJECT.md',
  'corpus/CORPUS_MAP.md',
  'corpus/SEARCH_QUERIES.md',
  'analysis/ANALYSIS_MATRIX.md',
  'analysis/THEMES.md',
  'outline/OUTLINE.md',
  'state_of_art/SOA.md',
  'state_of_art/SOA.bib',
  'reviews/REVIEW_v1.md',
]

function clearDir(dir) {
  if (!fs.existsSync(dir)) return
  for (const entry of fs.readdirSync(dir)) {
    fs.rmSync(path.join(dir, entry), { recursive: true, force: true })
  }
}

async function resetPipeline(args) {
  const force = args.includes('--force')

  if (!force) {
    const { createInterface } = await import('readline')
    const rl = createInterface({ input: process.stdin, output: process.stdout })
    const answer = await new Promise(resolve =>
      rl.question(
        '⚠️   Ceci va remettre le projet à l\'état post-install :\n' +
        '    • .planning/  → templates restaurés, artefacts supprimés\n' +
        '    • .plans/     → artefacts analyze/outline supprimés\n' +
        '    • output/     → paper.md, paper.pdf, bibliography.bib supprimés\n' +
        '    • corpus/     → conservé intact\n' +
        '\n    Continuer ? [y/N] : ',
        ans => { rl.close(); resolve(ans.trim().toLowerCase()) }
      )
    )
    if (answer !== 'y' && answer !== 'yes') {
      log('🚫', 'Reset annulé.')
      return
    }
  }

  const tmplDir = path.join(TEMPLATES_DIR, PLANNING_DIR)
  if (!fs.existsSync(tmplDir)) {
    err(`Templates introuvables : ${tmplDir}`)
    err('Relancez install.sh pour régénérer les templates de reset.')
    process.exit(1)
  }

  // ── 1. Clear .planning/ pipeline sub-dirs entirely
  const artifactDirs = ['corpus', 'analysis', 'outline', 'state_of_art', 'drafts', 'reviews']
  for (const sub of artifactDirs) {
    clearDir(path.join(PLANNING_DIR, sub))
    fs.mkdirSync(path.join(PLANNING_DIR, sub), { recursive: true })
  }

  // ── 2. Restore .planning/ template files from scripts/templates/
  for (const rel of PLANNING_TEMPLATES) {
    const src = path.join(tmplDir, rel)
    const dst = path.join(PLANNING_DIR, rel)
    if (fs.existsSync(src)) {
      fs.mkdirSync(path.dirname(dst), { recursive: true })
      fs.copyFileSync(src, dst)
    } else {
      warn(`Template manquant : ${src}`)
    }
  }

  // ── 3. Clear .plans/ slugs (keep _locks/)
  if (fs.existsSync(PLANS_DIR)) {
    for (const entry of fs.readdirSync(PLANS_DIR)) {
      if (entry === '_locks') continue
      fs.rmSync(path.join(PLANS_DIR, entry), { recursive: true, force: true })
    }
  }

  // ── 4. Clear output/
  const outputFiles = [PAPER_MD, PAPER_PDF, PAPER_BIB]
  for (const f of outputFiles) {
    if (fs.existsSync(f)) fs.rmSync(f)
  }

  ok('Projet remis à l\'état post-install.')
  log('📁', '.planning/  → templates restaurés depuis scripts/templates/')
  log('📁', '.plans/     → artefacts analyze/outline supprimés')
  log('📁', 'output/     → paper.md, paper.pdf, bibliography.bib supprimés')
  log('✔️ ', 'corpus/     → conservé intact')
}

function ensureDirs() {
  for (const dir of [
    PLANS_DIR, SOURCES_DIR, PDFS_DIR, BIB_DIR, NOTES_DIR,
    path.join(BIB_DIR, 'abstracts'),
    '.github/agents', '.github/prompts'
  ]) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

function md5(content) {
  return crypto.createHash('md5').update(content).digest('hex')
}

function countWords(text) {
  return text.split(/\s+/).filter(Boolean).length
}

// ─────────────────────────────────────────
// INGEST (tri-format : PDF + BibTeX + Notes)
// ─────────────────────────────────────────

function hasPdftotext() {
  try {
    const checkCmd = process.platform === 'win32' ? 'where pdftotext' : 'command -v pdftotext'
    execSync(checkCmd, { stdio: 'ignore' }); return true
  } catch { return false }
}

function convertPdf(pdfPath) {
  return execFileSync(
    'pdftotext', ['-layout', '-enc', 'UTF-8', '-nopgbrk', pdfPath, '-'],
    { encoding: 'utf8', maxBuffer: 50 * 1024 * 1024 }
  )
}

function wrapAsMarkdown(pdfName, rawText, pdfHash) {
  const date = new Date().toISOString().split('T')[0]
  return `# Source : ${pdfName}

> **Converti depuis PDF** le ${date} par PapperPilot ingest.
> Ne pas modifier à la main : regénéré automatiquement depuis ${pdfName}.
>
> _pdf_hash: ${pdfHash}

---

${rawText.trim()}
`
}

function migrateFlatSources() {
  if (!fs.existsSync(SOURCES_DIR)) return
  const migrated = []
  for (const f of fs.readdirSync(SOURCES_DIR)) {
    const full = path.join(SOURCES_DIR, f)
    if (!fs.statSync(full).isFile()) continue
    if (f === 'README.md' || f.startsWith('_')) continue
    const low = f.toLowerCase()
    if (low.endsWith('.pdf')) {
      fs.renameSync(full, path.join(PDFS_DIR, f)); migrated.push(f + ' → pdfs/')
    } else if (low.endsWith('.md')) {
      try {
        const c = fs.readFileSync(full, 'utf8')
        const dest = c.includes('_pdf_hash:') ? PDFS_DIR : NOTES_DIR
        fs.renameSync(full, path.join(dest, f))
        migrated.push(f + ` → ${path.basename(dest)}/`)
      } catch {}
    } else if (low.endsWith('.bib')) {
      fs.renameSync(full, path.join(BIB_DIR, f)); migrated.push(f + ' → bib/')
    }
  }
  if (migrated.length > 0) {
    log('🔀', `Migration v5.7 → v5.8 : ${migrated.length} fichier(s) déplacé(s)`)
    for (const m of migrated) console.log(`   • ${m}`)
  }
}

function parseBibFile(content) {
  const entries    = []
  const entryRegex = /@(\w+)\s*\{\s*([^,\s]+)\s*,([^@]*?)\n\s*\}/gs
  let m
  while ((m = entryRegex.exec(content)) !== null) {
    const type = m[1].toLowerCase()
    const key  = m[2].trim()
    const body = m[3]
    if (type === 'comment' || type === 'string' || type === 'preamble') continue

    const entry      = { type, bibtex_key: key }
    const fieldRegex = /(\w+)\s*=\s*(?:\{((?:[^{}]|\{[^{}]*\})*)\}|"([^"]*)"|(\w+))\s*,?/g
    let f
    while ((f = fieldRegex.exec(body)) !== null) {
      const name  = f[1].toLowerCase()
      const value = (f[2] || f[3] || f[4] || '').trim().replace(/\s+/g, ' ')
      entry[name] = value
    }
    entries.push(entry)
  }
  return entries
}

function parseNoteFrontmatter(mdPath) {
  const content = fs.readFileSync(mdPath, 'utf8')
  const m = content.match(/^---\n([\s\S]*?)\n---/)
  const result = {}
  if (!m) {
    const h1 = content.match(/^#\s+(.+)$/m)
    if (h1) result.title = h1[1].trim()
    return result
  }
  for (const line of m[1].split('\n')) {
    const kv = line.match(/^(\w+)\s*:\s*(.+)$/)
    if (!kv) continue
    const key = kv[1].toLowerCase()
    let val = kv[2].trim().replace(/^["'](.*)["']$/, '$1')
    if (val.startsWith('[') && val.endsWith(']')) {
      val = val.slice(1, -1).split(',').map(s => s.trim().replace(/^["'](.*)["']$/, '$1'))
    }
    result[key] = val
  }
  return result
}

function extractArxivId(entry) {
  if (entry.eprint && /^\d{4}\.\d{4,5}(v\d+)?$/.test(entry.eprint)) return entry.eprint
  if (entry.url) {
    const m = entry.url.match(/arxiv\.org\/abs\/([^\s\/]+)/i)
    if (m) return m[1]
  }
  if (entry.archiveprefix && entry.archiveprefix.toLowerCase() === 'arxiv' && entry.eprint) {
    return entry.eprint
  }
  return null
}

// ─────────────────────────────────────────
// FETCHERS HTTP pour abstracts (zero dependency)
// ─────────────────────────────────────────

const USER_AGENT      = 'PapperPilot-abstracts/5.8 (+https://github.com/)'
const FETCH_TIMEOUT_MS = 5000

function httpGetJson(url, extraHeaders = {}) {
  return new Promise((resolve) => {
    const req = https.get(url, {
      headers: { 'User-Agent': USER_AGENT, 'Accept': 'application/json', ...extraHeaders },
      timeout: FETCH_TIMEOUT_MS
    }, (res) => {
      if (res.statusCode < 200 || res.statusCode >= 300) {
        res.resume(); resolve({ error: `HTTP ${res.statusCode}`, status: res.statusCode }); return
      }
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => {
        try { resolve({ data: JSON.parse(data) }) }
        catch (e) { resolve({ error: 'parse error: ' + e.message }) }
      })
    })
    req.on('timeout', () => { req.destroy(); resolve({ error: 'timeout' }) })
    req.on('error', (e) => resolve({ error: e.message }))
  })
}

function httpGetText(url) {
  return new Promise((resolve) => {
    const req = https.get(url, {
      headers: { 'User-Agent': USER_AGENT },
      timeout: FETCH_TIMEOUT_MS
    }, (res) => {
      if (res.statusCode < 200 || res.statusCode >= 300) {
        res.resume(); resolve({ error: `HTTP ${res.statusCode}`, status: res.statusCode }); return
      }
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => resolve({ data }))
    })
    req.on('timeout', () => { req.destroy(); resolve({ error: 'timeout' }) })
    req.on('error', (e) => resolve({ error: e.message }))
  })
}

async function fetchCrossRef(doi) {
  const url = `https://api.crossref.org/works/${encodeURIComponent(doi)}`
  const r = await httpGetJson(url)
  if (r.error) return null
  const msg = r.data && r.data.message
  if (!msg) return null
  const abstract = (msg.abstract || '')
    .replace(/<jats:[^>]+>/g, '').replace(/<\/jats:[^>]+>/g, '').replace(/\s+/g, ' ').trim()
  if (!abstract) return null
  return { abstract, source: 'crossref', lang: 'en' }
}

async function fetchArxiv(arxivId) {
  const url = `https://export.arxiv.org/api/query?id_list=${encodeURIComponent(arxivId)}`
  const r = await httpGetText(url)
  if (r.error) return null
  const m = r.data.match(/<summary[^>]*>([\s\S]*?)<\/summary>/)
  if (!m) return null
  const abstract = m[1].trim().replace(/\s+/g, ' ')
  if (!abstract) return null
  return { abstract, source: 'arxiv', lang: 'en' }
}

async function fetchSemanticScholar(doi, title) {
  let url
  if (doi) {
    url = `https://api.semanticscholar.org/graph/v1/paper/DOI:${encodeURIComponent(doi)}?fields=abstract`
  } else if (title) {
    url = `https://api.semanticscholar.org/graph/v1/paper/search?query=${encodeURIComponent(title)}&limit=1&fields=abstract,title`
  } else return null
  const r = await httpGetJson(url)
  if (r.error) return null
  const d = r.data
  const abstract = (d.abstract || (d.data && d.data[0] && d.data[0].abstract) || '').trim()
  if (!abstract) return null
  return { abstract, source: 'semanticscholar', lang: 'en' }
}

function loadAbstractsCache() {
  if (!fs.existsSync(ABSTRACTS_CACHE)) return {}
  try { return JSON.parse(fs.readFileSync(ABSTRACTS_CACHE, 'utf8')) }
  catch { return {} }
}

function saveAbstractsCache(cache) {
  fs.writeFileSync(ABSTRACTS_CACHE, JSON.stringify(cache, null, 2))
}

const FETCH_PAUSE_MS = 250
function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

async function fetchAbstractForEntry(entry, cache, refresh) {
  if (entry.abstract && entry.abstract.length > 50) {
    return { abstract: entry.abstract, source: 'bib', lang: 'en' }
  }

  const cacheKey = entry.bibtex_key
  if (!refresh && cache[cacheKey]) {
    return cache[cacheKey].abstract ? cache[cacheKey] : null
  }

  const arxivId = extractArxivId(entry)
  const doi     = entry.doi

  let result = null
  if (doi)                          result = await fetchCrossRef(doi)
  await sleep(FETCH_PAUSE_MS)
  if (!result && arxivId)           result = await fetchArxiv(arxivId)
  await sleep(FETCH_PAUSE_MS)
  if (!result && (doi || entry.title)) result = await fetchSemanticScholar(doi, entry.title)

  cache[cacheKey] = result || { abstract: null, source: 'none', lang: null, failed_at: new Date().toISOString() }
  return result
}

// ─────────────────────────────────────────
// INDEX UNIFIÉ (_index.json)
// ─────────────────────────────────────────

async function buildIndex(options = {}) {
  const { noFetch = false, refresh = false } = options
  const index      = {}
  const collisions = []
  const cache      = loadAbstractsCache()
  const stats      = { pdfs: 0, bib: 0, notes: 0, abstracts_fetched: 0, abstracts_cached: 0, abstracts_failed: 0 }

  // 1. PDFs
  if (fs.existsSync(PDFS_DIR)) {
    for (const f of fs.readdirSync(PDFS_DIR)) {
      if (!f.toLowerCase().endsWith('.pdf')) continue
      const slug    = f.replace(/\.pdf$/i, '')
      const mdPath  = path.join(PDFS_DIR, slug + '.md')
      const pdfPath = path.join(PDFS_DIR, f)
      const key     = slug.replace(/[^a-zA-Z0-9_-]/g, '-')
      index[key]    = {
        type: 'pdf', bibtex_key: key, title: slug,
        has_fulltext: fs.existsSync(mdPath), citable: true,
        pdf_path: pdfPath,
        fulltext_path: fs.existsSync(mdPath) ? mdPath : null
      }
      stats.pdfs++
    }
  }

  // 2. BibTeX
  if (fs.existsSync(BIB_DIR)) {
    for (const f of fs.readdirSync(BIB_DIR)) {
      if (!f.toLowerCase().endsWith('.bib') || f === '_merged.bib') continue
      const entries = parseBibFile(fs.readFileSync(path.join(BIB_DIR, f), 'utf8'))
      for (const e of entries) {
        if (index[e.bibtex_key]) {
          collisions.push(`${e.bibtex_key} : présent dans ${index[e.bibtex_key].type} et dans ${f}`)
          continue
        }
        index[e.bibtex_key] = {
          type: 'bib', bibtex_key: e.bibtex_key, bib_source_file: f,
          title: e.title || e.booktitle || e.bibtex_key,
          authors: (e.author || '').split(/\s+and\s+/).filter(Boolean),
          year: e.year ? parseInt(e.year) : null,
          doi: e.doi || null, arxiv_id: extractArxivId(e),
          journal: e.journal || e.booktitle || null,
          has_fulltext: false, citable: true,
          abstract: (e.abstract && e.abstract.length > 50) ? e.abstract : null,
          abstract_source: (e.abstract && e.abstract.length > 50) ? 'bib' : null,
          abstract_lang: (e.abstract && e.abstract.length > 50) ? 'en' : null,
          _raw_bib: e
        }
        stats.bib++
      }
    }
  }

  // 2.b. Fetch abstracts pour les entrées bib
  if (!noFetch) {
    const toFetch = Object.values(index).filter(e => e.type === 'bib' && !e.abstract)
    if (toFetch.length > 0) {
      log('🌐', `Récupération des abstracts pour ${toFetch.length} entrée(s) BibTeX…`)
      for (const entry of toFetch) {
        const result = await fetchAbstractForEntry(entry._raw_bib || entry, cache, refresh)
        if (result && result.abstract) {
          entry.abstract = result.abstract
          entry.abstract_source = result.source
          entry.abstract_lang   = result.lang
          entry.abstract_fetched_at = new Date().toISOString()
          if (cache[entry.bibtex_key]?.source === 'cached') stats.abstracts_cached++
          else stats.abstracts_fetched++
        } else {
          stats.abstracts_failed++
        }
        delete entry._raw_bib
      }
      saveAbstractsCache(cache)
    } else {
      for (const e of Object.values(index)) { if (e._raw_bib) delete e._raw_bib }
    }
  } else {
    for (const e of Object.values(index)) { if (e._raw_bib) delete e._raw_bib }
    log('🚫', 'Fetch d\'abstracts désactivé (--no-fetch)')
  }

  // 3. Notes
  if (fs.existsSync(NOTES_DIR)) {
    for (const f of fs.readdirSync(NOTES_DIR)) {
      if (!f.toLowerCase().endsWith('.md')) continue
      const filePath = path.join(NOTES_DIR, f)
      const slug     = f.replace(/\.md$/i, '')
      const fm       = parseNoteFrontmatter(filePath)
      const key      = slug.replace(/[^a-zA-Z0-9_-]/g, '-')
      if (index[key]) {
        collisions.push(`${key} : collision avec ${index[key].type} (note ${f})`)
        continue
      }
      index[key] = {
        type: 'note', bibtex_key: key,
        title: fm.title || slug,
        authors: Array.isArray(fm.authors) ? fm.authors : (fm.authors ? [fm.authors] : []),
        year: fm.year ? parseInt(fm.year) : null,
        has_fulltext: true, citable: false,
        fulltext_path: filePath,
        note_scope: fm.scope || 'personal'
      }
      stats.notes++
    }
  }

  ensureDirs()
  fs.writeFileSync(INDEX_FILE, JSON.stringify(index, null, 2))
  writeMergedBib(index)

  return { index, collisions, stats }
}

function writeMergedBib(index) {
  const lines = ['% Auto-generated by gsdlite ingest. Do not edit manually.', '']
  for (const [key, e] of Object.entries(index)) {
    if (e.type === 'note') continue
    const bibType = e._raw_bib?.type || (e.type === 'pdf' ? 'misc' : 'article')
    lines.push(`@${bibType}{${key},`)
    if (e.title)   lines.push(`  title = {${e.title}},`)
    if (e.authors && e.authors.length) lines.push(`  author = {${e.authors.join(' and ')}},`)
    if (e.year)    lines.push(`  year = {${e.year}},`)
    if (e.doi)     lines.push(`  doi = {${e.doi}},`)
    if (e.journal) lines.push(`  journal = {${e.journal}},`)
    if (e.arxiv_id) lines.push(`  eprint = {${e.arxiv_id}}, archiveprefix = {arXiv},`)
    if (e.abstract) lines.push(`  abstract = {${e.abstract.replace(/[{}]/g, '')}},`)
    lines.push('}', '')
  }
  fs.writeFileSync(MERGED_BIB, lines.join('\n'))
}

async function ingestSources(argv) {
  ensureDirs()
  migrateFlatSources()

  const noFetch = argv.includes('--no-fetch')
  const refresh = argv.includes('--refresh-abstracts')

  // Phase 1 : conversion PDFs
  if (fs.existsSync(PDFS_DIR)) {
    const pdfs = fs.readdirSync(PDFS_DIR).filter(f => f.toLowerCase().endsWith('.pdf'))
    if (pdfs.length > 0) {
      if (!hasPdftotext()) {
        warn('pdftotext introuvable — les PDFs ne seront pas convertis')
        console.error('   • macOS        : brew install poppler')
        console.error('   • Ubuntu/Debian: sudo apt install poppler-utils')
        console.error('   • Windows      : scoop install poppler')
      } else {
        log('📚', `${pdfs.length} PDF trouvé(s) dans ${PDFS_DIR}/`)
        for (const pdf of pdfs) {
          const pdfPath    = path.join(PDFS_DIR, pdf)
          const mdPath     = path.join(PDFS_DIR, pdf.replace(/\.pdf$/i, '.md'))
          const pdfContent = fs.readFileSync(pdfPath)
          const pdfHash    = md5(pdfContent)

          if (fs.existsSync(mdPath)) {
            const existing = fs.readFileSync(mdPath, 'utf8')
            const match    = existing.match(/_pdf_hash: ([a-f0-9]+)/)
            if (match && match[1] === pdfHash) { log('⏭ ', `${pdf} — inchangé`); continue }
          }
          try {
            const rawText = convertPdf(pdfPath)
            if (!rawText.trim()) { warn(`${pdf} — extraction vide (PDF scanné ? OCR nécessaire)`); continue }
            fs.writeFileSync(mdPath, wrapAsMarkdown(pdf, rawText, pdfHash))
            log('✅', `${pdf} → ${path.basename(mdPath)} (${countWords(rawText)} mots)`)
          } catch (e) {
            err(`${pdf} — échec : ${e.message}`)
          }
        }
      }
    }
  }

  // Phase 2 : index unifié
  console.log('')
  log('🗂', 'Construction de l\'index unifié…')
  const { index, collisions, stats } = await buildIndex({ noFetch, refresh })

  console.log('')
  log('📊', `Corpus : ${Object.keys(index).length} source(s) indexée(s)`)
  console.log(`   • PDFs     : ${stats.pdfs}`)
  console.log(`   • BibTeX   : ${stats.bib}`)
  console.log(`   • Notes    : ${stats.notes} (non-citables)`)
  if (!noFetch) {
    console.log(`   • Abstracts: ${stats.abstracts_fetched} récupérés, ${stats.abstracts_failed} échoués`)
  }

  if (collisions.length > 0) {
    console.log('')
    warn(`${collisions.length} collision(s) de clés :`)
    for (const c of collisions) console.warn(`   • ${c}`)
  }

  console.log('')
  log('💾', `Index → ${INDEX_FILE}`)
  log('💾', `Biblio unifiée → ${MERGED_BIB}`)
}

// ─────────────────────────────────────────
// CORPUS — affichage état des sources
// ─────────────────────────────────────────

function showSources(mode) {
  const isJson = mode === '--json'
  if (!fs.existsSync(INDEX_FILE)) {
    if (isJson) { console.log(JSON.stringify({ error: 'no index, run collect first' })); return }
    warn(`Pas d'index. Lance d'abord : ${PRIMARY_CLI} collect`)
    return
  }
  const entries        = Object.values(JSON.parse(fs.readFileSync(INDEX_FILE, 'utf8')))
  const pdfs           = entries.filter(e => e.type === 'pdf')
  const bibs           = entries.filter(e => e.type === 'bib')
  const notes          = entries.filter(e => e.type === 'note')
  const withAbstract   = bibs.filter(e => e.abstract).length

  if (isJson) {
    console.log(JSON.stringify({
      total: entries.length, pdfs: pdfs.length, bib: bibs.length, notes: notes.length,
      bib_with_abstract: withAbstract, bib_without_abstract: bibs.length - withAbstract
    }, null, 2))
    return
  }

  log('📚', `Corpus : ${entries.length} source(s)`)
  console.log(`   ├── PDFs           : ${pdfs.length} (texte intégral disponible)`)
  console.log(`   ├── BibTeX seuls   : ${bibs.length} (${withAbstract} avec abstract, ${bibs.length - withAbstract} sans)`)
  console.log(`   └── Notes perso    : ${notes.length} (non-citables en sortie finale)`)

  if (bibs.length > 0) {
    const bySource = {}
    for (const e of bibs) {
      if (e.abstract_source) bySource[e.abstract_source] = (bySource[e.abstract_source] || 0) + 1
    }
    if (Object.keys(bySource).length > 0) {
      console.log(`       Abstracts : ${Object.entries(bySource).map(([k, v]) => `${k}: ${v}`).join(', ')}`)
    }
  }
}

function showAbstracts(filter) {
  if (!fs.existsSync(INDEX_FILE)) {
    warn(`Pas d'index. Lance d'abord : ${PRIMARY_CLI} collect`)
    return
  }
  const bibs = Object.values(JSON.parse(fs.readFileSync(INDEX_FILE, 'utf8'))).filter(e => e.type === 'bib')

  let list
  if (filter === '--missing') {
    list = bibs.filter(e => !e.abstract)
    log('⚠️', `${list.length} entrée(s) bib sans abstract :`)
  } else if (filter === '--failed') {
    const cache = loadAbstractsCache()
    list = bibs.filter(e => cache[e.bibtex_key]?.failed_at)
    log('❌', `${list.length} entrée(s) ayant échoué au fetch :`)
  } else {
    list = bibs
    log('📋', `${list.length} entrée(s) bib :`)
  }

  for (const e of list) {
    const src = e.abstract ? `[${e.abstract_source}]` : '[—]'
    console.log(`   ${src.padEnd(18)} ${e.bibtex_key} : ${(e.title || '').slice(0, 60)}`)
  }
}

// ─────────────────────────────────────────
// ANALYZE — matrice de preuves
// ─────────────────────────────────────────

function loadFulltext(entry) {
  if (!entry.fulltext_path || !fs.existsSync(entry.fulltext_path)) return null
  try { return fs.readFileSync(entry.fulltext_path, 'utf8') } catch { return null }
}

function loadFulltextWithFallback(key, entry) {
  const direct = loadFulltext(entry)
  if (direct) return direct

  const candidates = [
    path.join(PDFS_DIR, `${key}.md`),
    entry.bibtex_key ? path.join(PDFS_DIR, `${entry.bibtex_key}.md`) : null,
    entry.title ? path.join(PDFS_DIR, `${entry.title.replace(/[^a-zA-Z0-9_-]/g, '-')}.md`) : null
  ].filter(Boolean)

  for (const candidate of candidates) {
    if (!fs.existsSync(candidate)) continue
    try { return fs.readFileSync(candidate, 'utf8') } catch {}
  }
  return null
}

function normalizeSnippet(text) {
  return (text || '').toLowerCase()
    .replace(/https?:\/\/\S+/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ').trim()
}

function isNoisySnippet(text) {
  const value = (text || '').trim()
  if (value.length < 12) return true
  if (/^(and|or|but|so|however|therefore|thus)\b/i.test(value)) return true
  if (/^[\d\s.,:%-]+$/.test(value)) return true
  return false
}

function pushUniqueSnippet(list, text, maxLen = 90) {
  if (!text) return
  const trimmed = text.trim().replace(/\s+/g, ' ').slice(0, maxLen)
  if (isNoisySnippet(trimmed)) return
  const norm = normalizeSnippet(trimmed)
  if (!norm) return
  for (const existing of list) {
    const existingNorm = normalizeSnippet(existing)
    if (!existingNorm) continue
    if (existingNorm === norm || existingNorm.includes(norm) || norm.includes(existingNorm)) return
  }
  list.push(trimmed)
}

function extractResearchElements(fulltext, abstract) {
  const elements = { objectives: [], methods: [], results: [], conclusions: [], sampleSize: null, bias: [], limitations: [] }
  const text = (fulltext || '') + '\n' + (abstract || '')

  const patterns = {
    objectives: [
      /(?:objective|aim|goal|purpose)[s]?[:\s]([^.!?]{20,200})/gi,
      /^(?:introduction|background)[:\s]([^.!?]{20,200})/gim,
      /(?:we aim|we sought|the objective|this study aims)([^.!?]{20,150})/gi
    ],
    methods: [
      /(?:method|approach|technique|procedure)s?[:\s]([^.!?]{20,200})/gi,
      /(?:we used|we employed|we conducted|using|employing)([^.!?]{10,150})/gi,
      /(?:study design|experiment|analysis)[:\s]([^.!?]{20,150})/gi
    ],
    results: [
      /(?:result|finding)s?[:\s]([^.!?]{20,200})/gi,
      /(?:show|demonstrate|found|achieved)([^.!?]{10,150})/gi,
      /(?:accuracy|precision|recall|f1)\s*[:=]?\s*([^.!?\n]{5,100})/gi
    ],
    conclusions: [
      /(?:conclusion|conclude|implication)s?[:\s]([^.!?]{20,200})/gi,
      /(?:in conclusion|conclude that|we conclude)([^.!?]{10,150})/gi
    ],
    limitations: [
      /(?:limitation|limitation of this study|however|although|despite)([^.!?]{10,150})/gi,
      /(?:future work|further research|open question)([^.!?]{10,100})/gi
    ]
  }

  for (const [key, pats] of Object.entries(patterns)) {
    for (const pattern of pats) {
      let match
      while ((match = pattern.exec(text)) !== null) {
        if (match[1]) pushUniqueSnippet(elements[key], match[1], key === 'limitations' ? 80 : 100)
      }
    }
  }

  const sampleMatch = /(?:n\s*=|sample size|N\s*=|participants?)[\s=]*(\d+(?:,\d+)*)/i.exec(text)
  if (sampleMatch?.[1]) elements.sampleSize = parseInt(sampleMatch[1].replace(/,/g, ''))

  for (const term of ['bias', 'confound', 'limitation', 'caveat', 'skew', 'only', 'merely', 'solely']) {
    const regex = new RegExp(`${term}[^.!?]{0,80}`, 'gi')
    let match
    while ((match = regex.exec(text)) !== null) pushUniqueSnippet(elements.bias, match[0].slice(0, 70), 70)
  }

  return elements
}

function computeEvidenceScore(entry, elements, hasEffectiveFulltext = false) {
  let score = 50
  if (entry.abstract && entry.abstract.length > 100) score += 10
  if (entry.year)    score += 5
  if (entry.authors && entry.authors.length > 0) score += 5
  if (entry.doi)     score += 3
  if (entry.journal) score += 2
  if (entry.has_fulltext || hasEffectiveFulltext) score += 15
  if (elements.sampleSize && elements.sampleSize > 100) score += 5
  if (elements.results.length > 2) score += 5
  if (entry.abstract_source === 'CrossRef' || entry.abstract_source === 'arXiv') score += 3
  if (entry.abstract_source === 'bib')  score += 2
  if (elements.bias.length > 5)         score -= 2
  if (elements.limitations.length > 8)  score -= 2
  return Math.min(100, Math.max(0, score))
}

function detectConflicts(allAnalyzed) {
  const conflicts = []
  const antonyms  = [
    ['positive', 'negative'], ['increase', 'decrease'], ['improve', 'worsen'],
    ['effective', 'ineffective'], ['significant', 'insignificant'],
    ['success', 'failure'], ['benefit', 'harm'], ['safe', 'unsafe']
  ]

  for (const [term1, term2] of antonyms) {
    const term1Re  = new RegExp(`\\b${term1}\\b`, 'i')
    const term2Re  = new RegExp(`\\b${term2}\\b`, 'i')
    const sources1 = Object.keys(allAnalyzed).filter(k => allAnalyzed[k].elements.results.some(r => term1Re.test(r)))
    const sources2 = Object.keys(allAnalyzed).filter(k => allAnalyzed[k].elements.results.some(r => term2Re.test(r)))
    const unique1  = sources1.filter(s => !sources2.includes(s))
    const unique2  = sources2.filter(s => !sources1.includes(s))
    if (unique1.length > 0 && unique2.length > 0) {
      conflicts.push({ type: 'antonym', term1, term2, sources1: unique1, sources2: unique2, severity: 'medium' })
    }
  }
  return conflicts
}

function formatSourceAnalysis(key, entry, elements, hasEffectiveFulltext = false) {
  const score   = computeEvidenceScore(entry, elements, hasEffectiveFulltext)
  const authors = entry.authors?.length > 0
    ? entry.authors.slice(0, 3).join(', ') + (entry.authors.length > 3 ? ' et al.' : '')
    : '(unknown authors)'
  const year = entry.year || '(unknown year)'

  let md = `### ${entry.title}\n`
  md += `\n**${key}** | ${authors} | ${year}\n`
  md += `**Type:** ${entry.type} | **Score:** ${score}/100 | **Citable:** ${entry.citable ? 'Yes' : 'No'}\n`
  if (entry.doi)      md += `**DOI:** https://doi.org/${entry.doi}\n`
  if (entry.arxiv_id) md += `**arXiv:** https://arxiv.org/abs/${entry.arxiv_id}\n`
  if (entry.journal)  md += `**Journal:** ${entry.journal}\n`
  if (entry.has_fulltext || hasEffectiveFulltext) md += `**Fulltext:** Available (PDF converted)\n`

  md += `\n#### Abstract\n\n${entry.abstract || '(no abstract)'}\n`

  const sections = [
    { key: 'objectives',  label: 'Objectives',                       max: 3 },
    { key: 'methods',     label: 'Methodology',                      max: 3 },
    { key: 'results',     label: 'Key Results',                      max: 3 },
    { key: 'conclusions', label: 'Conclusions',                      max: 2 },
    { key: 'bias',        label: '⚠️ Potential Biases Detected',     max: 3 },
    { key: 'limitations', label: 'Declared Limitations',             max: 3 }
  ]
  for (const s of sections) {
    const items = elements[s.key]
    if (Array.isArray(items) && items.length > 0) {
      md += `\n#### ${s.label}\n\n`
      for (const item of items.slice(0, s.max)) md += `- ${item}\n`
    }
  }
  if (elements.sampleSize) md += `\n**Sample Size:** N=${elements.sampleSize}\n`

  md += `\n---\n`
  return md
}

async function analyzeCommand(slug) {
  if (!slug) {
    err('Usage: analyze <slug>')
    err('       Génère .plans/<slug>/evidence-matrix.{md,json}')
    process.exit(1)
  }

  if (!fs.existsSync(INDEX_FILE)) {
    err(`Pas d'index. Lance d'abord : ${PRIMARY_CLI} collect`)
    process.exit(1)
  }

  const projectDir = path.join(PLANS_DIR, slug)
  fs.mkdirSync(projectDir, { recursive: true })

  try {
    const index   = JSON.parse(fs.readFileSync(INDEX_FILE, 'utf8'))
    const entries = Object.entries(index)

    if (entries.length === 0) { warn('Corpus vide — aucune source à analyser'); return }

    log('🔬', `Analyse du corpus : ${entries.length} source(s)…`)

    const allAnalyzed = {}
    const scores      = {}

    for (const [key, entry] of entries) {
      const fulltext          = loadFulltextWithFallback(key, entry)
      const hasEffectiveFulltext = !!fulltext
      const elements          = extractResearchElements(fulltext, entry.abstract)
      allAnalyzed[key]        = { entry, elements, hasEffectiveFulltext }
      scores[key]             = computeEvidenceScore(entry, elements, hasEffectiveFulltext)
    }

    const conflicts = detectConflicts(allAnalyzed)
    if (conflicts.length > 0) log('⚠️ ', `${conflicts.length} contradiction(s) potentielle(s) détectée(s)`)

    const sortedEntries = [...entries].sort(([k1], [k2]) => scores[k2] - scores[k1])

    // Markdown
    const byType = {}
    for (const [key, entry] of entries) {
      if (!byType[entry.type]) byType[entry.type] = { count: 0, scoreSum: 0, fulltext: 0 }
      byType[entry.type].count++
      byType[entry.type].scoreSum += scores[key]
      if (allAnalyzed[key].hasEffectiveFulltext) byType[entry.type].fulltext++
    }

    let md = `# Evidence Matrix — ${slug}\n\n`
    md += `> Generated by PapperPilot analyze · ${new Date().toISOString()} · ${entries.length} sources\n\n`
    md += `## Statistical Summary\n\n`
    md += `| Type | Count | Avg Score | Fulltext |\n|------|-------|-----------|----------|\n`
    for (const [type, data] of Object.entries(byType)) {
      md += `| ${type} | ${data.count} | ${(data.scoreSum / data.count).toFixed(1)} | ${data.fulltext} |\n`
    }

    if (conflicts.length > 0) {
      md += `\n## ⚠️ Detected Contradictions\n\n`
      for (const c of conflicts) {
        md += `- **${c.term1}** vs **${c.term2}**: ${c.sources1.join(', ')} vs ${c.sources2.join(', ')}\n`
      }
    }

    md += `\n## Sources by Evidence Score\n\n`
    md += `| Key | Title | Score | Type | Year | Fulltext |\n|-----|-------|-------|------|------|----------|\n`
    for (const [key, entry] of sortedEntries) {
      md += `| ${key} | ${(entry.title || key).slice(0, 50)} | ${scores[key]}/100 | ${entry.type} | ${entry.year || '—'} | ${allAnalyzed[key].hasEffectiveFulltext ? '✓' : '—'} |\n`
    }

    md += `\n## Detailed Analyses\n\n`
    for (const [key, entry] of sortedEntries) {
      md += formatSourceAnalysis(key, entry, allAnalyzed[key].elements, allAnalyzed[key].hasEffectiveFulltext)
    }

    fs.writeFileSync(path.join(projectDir, 'evidence-matrix.md'), md)
    ok(`Matrice écrite → ${path.join(projectDir, 'evidence-matrix.md')}`)

    // JSON
    const jsonOutput = {
      slug, generatedAt: new Date().toISOString(), version: 'v5.8.0', mode: 'heuristic',
      stats: {
        totalSources: entries.length, byType,
        conflictCount: conflicts.length,
        avgScore: (Object.values(scores).reduce((a, b) => a + b, 0) / entries.length).toFixed(1)
      },
      sources: Object.fromEntries(
        sortedEntries.map(([key, entry]) => [key, {
          key, title: entry.title, authors: entry.authors, year: entry.year,
          type: entry.type, doi: entry.doi, score: scores[key], citable: entry.citable,
          hasFulltext: allAnalyzed[key].hasEffectiveFulltext, elements: allAnalyzed[key].elements
        }])
      ),
      conflicts
    }

    fs.writeFileSync(path.join(projectDir, 'evidence-matrix.json'), JSON.stringify(jsonOutput, null, 2))
    ok(`JSON écrit → ${path.join(projectDir, 'evidence-matrix.json')}`)
    log('📊', `Résumé: ${byType.pdf?.count || 0} PDF, ${byType.bib?.count || 0} BibTeX, ${byType.note?.count || 0} notes, ${conflicts.length} conflits`)

  } catch (e) {
    err(`Analyse échouée : ${e.message}`)
    process.exit(1)
  }
}

// ─────────────────────────────────────────
// OUTLINE — plan narratif
// ─────────────────────────────────────────

function clusterByKeywords(allAnalyzed, elementKey, keywords) {
  const pattern = new RegExp(keywords.join('|'), 'i')
  const claims  = []
  const seen    = new Set()

  for (const [key, data] of Object.entries(allAnalyzed)) {
    const snippets = data.elements?.[elementKey]
    if (!Array.isArray(snippets)) continue
    for (const text of snippets) {
      if (!text || text.length < 15) continue
      const norm = text.toLowerCase().replace(/\s+/g, ' ').trim()
      if (seen.has(norm)) continue
      seen.add(norm)
      claims.push({ text: text.trim(), sources: [key] })
    }
  }

  for (const [key, data] of Object.entries(allAnalyzed)) {
    for (const [ek, snippets] of Object.entries(data.elements || {})) {
      if (ek === elementKey || !Array.isArray(snippets)) continue
      for (const text of snippets) {
        if (!text || text.length < 15 || !pattern.test(text)) continue
        const norm = text.toLowerCase().replace(/\s+/g, ' ').trim()
        if (seen.has(norm)) continue
        seen.add(norm)
        claims.push({ text: text.trim(), sources: [key] })
      }
    }
  }
  return claims
}

function mergeSimilarClaims(claims) {
  const merged = []
  for (const c of claims) {
    const prefix   = c.text.slice(0, 60).toLowerCase()
    const existing = merged.find(m => m.text.slice(0, 60).toLowerCase() === prefix)
    if (existing) {
      for (const s of c.sources) { if (!existing.sources.includes(s)) existing.sources.push(s) }
    } else {
      merged.push({ ...c, sources: [...c.sources] })
    }
  }
  return merged
}

async function outlineCommand(slug) {
  if (!slug) {
    err('Usage: node papperpilot.js outline <slug>')
    process.exit(1)
  }

  const projectDir = path.join(PLANS_DIR, slug)
  const matrixPath = path.join(projectDir, 'evidence-matrix.json')

  if (!fs.existsSync(matrixPath)) {
    err(`evidence-matrix.json introuvable pour "${slug}". Lancez d'abord : ${PRIMARY_CLI} analyze ${slug}`)
    process.exit(1)
  }

  try {
    const matrix      = JSON.parse(fs.readFileSync(matrixPath, 'utf8'))
    const allAnalyzed = {}
    for (const [key, src] of Object.entries(matrix.sources || {})) {
      allAnalyzed[key] = { elements: src.elements || {}, hasEffectiveFulltext: src.hasFulltext }
    }

    const sectionDefs = [
      { id: 'introduction', title: 'Introduction',    elementKeys: ['objectives'],  claimType: 'objective', level: 1,
        extraKeywords: ['objectif', 'but', 'vise', 'propose', 'introduc', 'contexte', 'problématique', 'research question', 'aim', 'purpose'] },
      { id: 'methodologie', title: 'Méthodologie',    elementKeys: ['methods'],     claimType: 'method',    level: 1,
        extraKeywords: ['méthode', 'protocole', 'expériment', 'dataset', 'corpus', 'model', 'architecture', 'approche', 'method', 'approach', 'baseline', 'fine-tun', 'training', 'entraîn'] },
      { id: 'resultats',    title: 'Résultats',        elementKeys: ['results'],     claimType: 'finding',   level: 1,
        extraKeywords: ['résultat', 'performance', 'accuracy', 'f1', 'bleu', 'rouge', 'score', 'améliora', 'surpass', 'outperform', 'achieves', 'obtient', 'atteint', '%', 'point'] },
      { id: 'discussion',   title: 'Discussion',       elementKeys: ['conclusions'], claimType: 'conclusion', level: 1,
        extraKeywords: ['discussion', 'implication', 'perspective', 'futur', 'travaux', 'conclusion', 'suggère', 'recommend', 'conclut', 'hence', 'therefore', 'ainsi'] },
      { id: 'limites',      title: 'Limites & Biais',  elementKeys: ['limitations', 'bias'], claimType: 'limitation', level: 1,
        extraKeywords: ['limit', 'biais', 'faiblesse', 'contrainte', 'lacune', 'gap', 'weakness', 'constraint', 'caveat', 'restriction'] }
    ]

    const sections = []
    for (const def of sectionDefs) {
      const raw = []
      for (const ek of def.elementKeys) raw.push(...clusterByKeywords(allAnalyzed, ek, def.extraKeywords))
      const claims = mergeSimilarClaims(raw).map(c => ({ text: c.text, sources: c.sources, type: def.claimType, level: 2 }))
      sections.push({ id: def.id, title: def.title, level: def.level, claims })
    }

    const discussionSection = sections.find(s => s.id === 'discussion')
    if (matrix.conflicts?.length && discussionSection) {
      for (const conflict of matrix.conflicts) {
        discussionSection.claims.push({
          text: `Conflict detected between "${conflict.term1}" (${conflict.sources1.join(', ')}) and "${conflict.term2}" (${conflict.sources2.join(', ')})`,
          sources: [...(conflict.sources1 || []), ...(conflict.sources2 || [])],
          type: 'conflict', level: 2
        })
      }
    }

    const synthesis    = { consensus: [], contradictions: [], gaps: [] }
    const sourceIndex  = {}
    for (const [key, src] of Object.entries(matrix.sources || {})) {
      sourceIndex[key] = { title: src.title, authors: src.authors, year: src.year, score: src.score, citable: src.citable, hasFulltext: src.hasFulltext }
    }

    const totalClaims  = sections.reduce((n, s) => n + s.claims.length, 0)
    const sourcesUsed  = new Set()
    sections.forEach(s => s.claims.forEach(c => c.sources.forEach(k => sourcesUsed.add(k))))

    // JSON
    const jsonOutput = {
      slug, generatedAt: new Date().toISOString(), version: 'v5.8.0', mode: 'heuristic',
      stats: { totalSections: sections.length, totalClaims, sourcesUsed: sourcesUsed.size, totalSources: Object.keys(matrix.sources || {}).length, conflictsEmbedded: matrix.conflicts?.length || 0 },
      sections, synthesis, conflicts: matrix.conflicts || [], sourceIndex
    }
    fs.mkdirSync(projectDir, { recursive: true })
    fs.writeFileSync(path.join(projectDir, 'outline.json'), JSON.stringify(jsonOutput, null, 2))
    ok(`JSON écrit → ${path.join(projectDir, 'outline.json')}`)

    // Markdown
    const lines = []
    lines.push(`# Writing Plan — ${slug}`)
    lines.push(`> Generated by PapperPilot on ${new Date().toLocaleDateString('en-US')}`)
    lines.push(`> ${totalClaims} claims · ${sourcesUsed.size}/${Object.keys(matrix.sources || {}).length} sources used\n`)

    for (const section of sections) {
      lines.push(`## ${section.title}`)
      if (section.claims.length === 0) { lines.push('_No claims extracted for this section._\n'); continue }
      for (const claim of section.claims) {
        const srcBadges = claim.sources.map(k => `[${k}]`).join(' ')
        const typeLabel = claim.type === 'conflict' ? '⚠️ conflict' : claim.type
        lines.push(`- **[${typeLabel}]** ${claim.text} ${srcBadges}`)
      }
      lines.push('')
    }

    lines.push('---')
    lines.push('## Source Index')
    lines.push('| Key | Title | Year | Score | Fulltext |')
    lines.push('|-----|-------|------|-------|----------|')
    for (const [key, s] of Object.entries(sourceIndex)) {
      lines.push(`| ${key} | ${(s.title || '').slice(0, 60)} | ${s.year || '?'} | ${s.score ?? '?'} | ${s.hasFulltext ? '✅' : '—'} |`)
    }

    fs.writeFileSync(path.join(projectDir, 'outline.md'), lines.join('\n'))
    ok(`Plan écrit → ${path.join(projectDir, 'outline.md')}`)
    log('📝', `Plan: ${sections.length} sections, ${totalClaims} affirmations, ${sourcesUsed.size} sources mobilisées`)

  } catch (e) {
    err(`Outline échoué : ${e.message}`)
    process.exit(1)
  }
}

// ─────────────────────────────────────────
// PRECHECK — hook SessionStart
// ─────────────────────────────────────────

function precheck(mode) {
  const isHook = mode === '--hook'
  const issues = { blockers: [], warnings: [], info: [] }

  // 1. PDFs non convertis
  if (fs.existsSync(PDFS_DIR)) {
    for (const f of fs.readdirSync(PDFS_DIR)) {
      if (!f.toLowerCase().endsWith('.pdf')) continue
      const pdfPath = path.join(PDFS_DIR, f)
      const mdPath  = path.join(PDFS_DIR, f.replace(/\.pdf$/i, '.md'))
      if (!fs.existsSync(mdPath)) {
        issues.info.push(`PDF non converti : ${f} — lance '${PRIMARY_CLI} collect'`)
        continue
      }
      const pdfHash  = md5(fs.readFileSync(pdfPath))
      const mdContent = fs.readFileSync(mdPath, 'utf8')
      const match    = mdContent.match(/_pdf_hash: ([a-f0-9]+)/)
      if (match && match[1] !== pdfHash) {
        issues.warnings.push(`${f} a changé depuis la dernière conversion — relance '${PRIMARY_CLI} collect'`)
      }
    }
  }

  // 2. Entrées BibTeX sans abstract
  if (fs.existsSync(INDEX_FILE)) {
    try {
      const idx       = JSON.parse(fs.readFileSync(INDEX_FILE, 'utf8'))
      const bibsNoAbs = Object.values(idx).filter(e => e.type === 'bib' && !e.abstract).length
      if (bibsNoAbs > 0) {
        issues.info.push(`${bibsNoAbs} entrée(s) BibTeX sans abstract — lance '${PRIMARY_CLI} collect' pour retenter`)
      }
    } catch {}
  }

  if (isHook) {
    const hasBlockers = issues.blockers.length > 0
    const hasWarnings = issues.warnings.length > 0
    let msg = ''
    if (hasBlockers) { msg += '🔴 BLOCKERS :\n'; for (const b of issues.blockers) msg += `  • ${b}\n` }
    if (hasWarnings) { msg += (msg ? '\n' : '') + '⚠️  Warnings :\n'; for (const w of issues.warnings) msg += `  • ${w}\n` }
    if (issues.info.length > 0 && !hasBlockers && !hasWarnings) { msg += 'ℹ️  Info :\n'; for (const i of issues.info) msg += `  • ${i}\n` }

    const output = { hookSpecificOutput: { hookEventName: 'SessionStart', additionalContext: msg || 'PapperPilot precheck : OK.' } }
    if (hasBlockers) { output.systemMessage = msg; output.continue = false; output.stopReason = 'precheck : incohérences détectées' }
    else if (hasWarnings) { output.systemMessage = msg }
    console.log(JSON.stringify(output, null, 2))
    return
  }

  if (issues.blockers.length === 0 && issues.warnings.length === 0 && issues.info.length === 0) {
    ok('Precheck OK — rien à signaler')
    process.exit(0)
  }
  if (issues.blockers.length > 0) { console.log('🔴 BLOCKERS :'); for (const b of issues.blockers) console.log(`   • ${b}`); console.log('') }
  if (issues.warnings.length > 0) { console.log('⚠️  Warnings :'); for (const w of issues.warnings) console.log(`   • ${w}`); console.log('') }
  if (issues.info.length > 0) { console.log('ℹ️  Info :'); for (const i of issues.info) console.log(`   • ${i}`) }

  if (issues.blockers.length > 0) process.exit(2)
  if (issues.warnings.length > 0) process.exit(1)
  process.exit(0)
}

// ─────────────────────────────────────────
// BIBLIOGRAPHY & PDF EXPORT
// ─────────────────────────────────────────

function extractCitationKeys(md) {
  const keys = new Set()
  // Pandoc citation syntax: @key, [@key], [-@key], [@a; @b], with keys
  // starting with a letter and containing letters/digits/underscore/colon/period/hyphen.
  // We match `@key` only when NOT preceded by a word char (avoids e-mails like alice@example.com).
  // Key must start with a letter. Internal chars allow `_:.-`. Trailing punctuation
  // (sentence-ending `.`, `,`, `;`, `!`, `?`) is NOT part of the key per pandoc's spec.
  const re = /(?:^|[^A-Za-z0-9_])-?@([a-zA-Z](?:[a-zA-Z0-9_:.-]*[a-zA-Z0-9_])?)/gm
  let m
  while ((m = re.exec(md)) !== null) keys.add(m[1])
  return [...keys].sort()
}

function serializeBibEntries(entries) {
  const lines = [
    '% Auto-generated by `papperpilot.js export` — contains only refs cited in output/paper.md.',
    '% Source: corpus/_merged.bib. Do not edit manually (regenerated on each export).',
    ''
  ]
  const ordered = ['author', 'title', 'journal', 'booktitle', 'year', 'volume', 'number', 'pages', 'doi', 'url', 'eprint', 'archiveprefix', 'abstract']
  for (const e of entries) {
    lines.push(`@${e.type || 'misc'}{${e.bibtex_key},`)
    for (const f of ordered) {
      if (e[f]) lines.push(`  ${f} = {${String(e[f]).replace(/[{}]/g, '')}},`)
    }
    for (const [k, v] of Object.entries(e)) {
      if (k === 'type' || k === 'bibtex_key' || ordered.includes(k)) continue
      if (!v) continue
      lines.push(`  ${k} = {${String(v).replace(/[{}]/g, '')}},`)
    }
    lines.push('}', '')
  }
  return lines.join('\n')
}

function buildFinalBibliography({ silent = false } = {}) {
  if (!fs.existsSync(PAPER_MD)) {
    err(`${PAPER_MD} introuvable — lance d'abord @Writer pour assembler le paper.`)
    process.exit(1)
  }
  if (!fs.existsSync(MERGED_BIB)) {
    err(`${MERGED_BIB} introuvable — lance '${PRIMARY_CLI} collect' d'abord.`)
    process.exit(1)
  }

  const md      = fs.readFileSync(PAPER_MD, 'utf8')
  const keys    = extractCitationKeys(md)
  const entries = parseBibFile(fs.readFileSync(MERGED_BIB, 'utf8'))
  const byKey   = Object.fromEntries(entries.map(e => [e.bibtex_key, e]))

  const filtered = keys.filter(k => byKey[k]).map(k => byKey[k])
  const missing  = keys.filter(k => !byKey[k])

  fs.mkdirSync(OUTPUT_DIR, { recursive: true })
  fs.writeFileSync(PAPER_BIB, serializeBibEntries(filtered))

  if (!silent) {
    ok(`${PAPER_BIB} écrit (${filtered.length}/${keys.length} entrée(s) trouvée(s))`)
    if (missing.length > 0) {
      warn(`${missing.length} clé(s) citée(s) absente(s) de ${MERGED_BIB} :`)
      for (const k of missing) console.log(`   • ${k}`)
      warn(`Ces citations n'apparaîtront pas dans la bibliographie finale.`)
    }
  }

  return { keys, filtered, missing }
}

function commandExists(cmd) {
  try {
    const checkCmd = process.platform === 'win32' ? `where ${cmd}` : `command -v ${cmd}`
    execSync(checkCmd, { stdio: 'ignore' }); return true
  } catch { return false }
}

function hasLatexClass(className) {
  try {
    const out = execSync(`kpsewhich ${className}.cls`, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim()
    return out.length > 0
  } catch { return false }
}

function argValue(args, flag) {
  const i = args.indexOf(flag)
  return (i >= 0 && i + 1 < args.length) ? args[i + 1] : null
}

async function exportPdf(args) {
  const style    = argValue(args, '--style') || 'ieee'
  const docClass = argValue(args, '--class') || 'article'
  const skipBib  = args.includes('--no-bib')

  if (!fs.existsSync(PAPER_MD)) {
    err(`${PAPER_MD} introuvable — lance d'abord @Writer pour assembler le paper.`)
    process.exit(1)
  }

  // 1. Build filtered bibliography (unless skipped)
  if (!skipBib) buildFinalBibliography()

  // 2. Preflight checks
  if (!commandExists('pandoc')) {
    err('pandoc introuvable — installe-le :')
    if (process.platform === 'win32') {
      console.error('   • winget  : winget install JohnMacFarlane.Pandoc')
      console.error('   • choco   : choco install pandoc')
      console.error('   • scoop   : scoop install pandoc')
    } else if (process.platform === 'darwin') {
      console.error('   • macOS   : brew install pandoc')
    } else {
      console.error('   • Ubuntu  : sudo apt install pandoc')
    }
    process.exit(1)
  }
  if (!commandExists('pdflatex')) {
    err('pdflatex introuvable — installe une distribution LaTeX :')
    if (process.platform === 'win32') {
      console.error('   • MiKTeX  : winget install MiKTeX.MiKTeX  (ou https://miktex.org/download)')
      console.error('   • TeX Live: https://tug.org/texlive/')
    } else if (process.platform === 'darwin') {
      console.error('   • macOS   : brew install --cask basictex')
    } else {
      console.error('   • Ubuntu  : sudo apt install texlive-latex-base')
    }
    process.exit(1)
  }
  if (docClass === 'IEEEtran' && !hasLatexClass('IEEEtran')) {
    err('IEEEtran.cls introuvable — installe-le : `sudo tlmgr install ieeetran collection-publishers`')
    err('Alternative : relance sans `--class IEEEtran` (rendu article générique avec citations IEEE).')
    process.exit(1)
  }
  if (style === 'ieee' && !fs.existsSync(CSL_IEEE)) {
    err(`${CSL_IEEE} introuvable — réinstalle le projet ou télécharge-le depuis https://github.com/citation-style-language/styles`)
    process.exit(1)
  }

  // 3. Load metadata from config.json
  const configPath = path.join('.planning', 'config.json')
  const config = fs.existsSync(configPath) ? JSON.parse(fs.readFileSync(configPath, 'utf8')) : {}
  const p = config.project || {}

  const title = p.title || 'Untitled'
  const authors = Array.isArray(p.authors) && p.authors.length > 0
    ? p.authors
    : [{ name: 'Anonymous', affiliation: 'Unknown Institution' }]

  if (authors[0].name === 'Anonymous') {
    warn('Aucun auteur défini dans config.json.project.authors — valeurs par défaut utilisées.')
    warn('Ajoute un tableau "authors" dans .planning/config.json pour personnaliser le bloc auteur.')
  }

  // 4. Build pandoc invocation
  const authorString = authors.map(a => {
    const parts = [a.name || 'Anonymous']
    if (a.affiliation) parts.push(`\\\\${a.affiliation}`)
    if (a.email)       parts.push(`\\\\\\texttt{${a.email}}`)
    return parts.join('')
  }).join(' \\and ')

  const pandocArgs = [
    PAPER_MD,
    '-o', PAPER_PDF,
    '--pdf-engine=pdflatex',
    '--citeproc',
    '--bibliography=' + PAPER_BIB.replace(/\\/g, '/'),
    '--csl=' + path.relative(process.cwd(), CSL_IEEE).replace(/\\/g, '/'),  
    '-V', `documentclass=${docClass}`,
    '-M', `title=${title}`,
    '-V', `author=${authorString}`,
  ]

  if (docClass === 'IEEEtran') {
    pandocArgs.push('-V', 'classoption=conference')
  }

  log('🛠', `pandoc ${pandocArgs.map(a => /\s/.test(a) ? `"${a}"` : a).join(' ')}`)

  try {
    execFileSync('pandoc', pandocArgs, { stdio: 'inherit' })
    ok(`${PAPER_PDF} généré (style: ${style}, classe: ${docClass})`)
  } catch (e) {
    err(`Échec de la compilation pandoc/pdflatex : ${e.message}`)
    err('Conseil : lance la commande pandoc à la main pour voir les erreurs LaTeX complètes.')
    process.exit(1)
  }
}

// ─────────────────────────────────────────
// ENTRY POINT
// ─────────────────────────────────────────

const HELP = `
PapperPilot v5.8 — copilote de rédaction scientifique pour VS Code Copilot

Usage:
  node papperpilot.js collect [--no-fetch]           Convertit PDF + parse BibTeX + indexe notes
                     [--refresh-abstracts]
  node papperpilot.js corpus [--json]                État du corpus bibliographique
  node papperpilot.js coverage [--missing|--failed]  Diagnostic abstracts
  node papperpilot.js analyze <slug>                 Génère .plans/<slug>/evidence-matrix.{md,json}
  node papperpilot.js outline <slug>                 Génère .plans/<slug>/outline.{md,json}
  node papperpilot.js bibliography                   Extrait les refs citées dans output/paper.md
                                                     → output/bibliography.bib (filtré depuis _merged.bib)
  node papperpilot.js export [--style ieee]          Compile output/paper.md + bibliography.bib → PDF
                     [--class article|IEEEtran]      via pandoc + pdflatex. --class IEEEtran exige
                     [--no-bib]                      'tlmgr install ieeetran'. --no-bib saute l'extraction.
  node papperpilot.js precheck [--hook]              Vérifie l'état du corpus
  node papperpilot.js init                           (Ré)crée les dossiers
  node papperpilot.js reset [--force]               Remet le projet à l'état post-install
                                                     (conserve corpus/, supprime artefacts pipeline)
                                                     --force : pas de confirmation interactive

Pipeline :
  [COLLECT] → [ANALYSE] → [OUTLINE] → [STATE_OF_ART] → [WRITER] → [REVIEWER]

Sources bibliographiques :
  corpus/pdfs/        — articles PDF (convertis en .md par collect)
  corpus/bib/         — exports Zotero/Mendeley (.bib)
  corpus/notes/       — fiches de lecture perso (.md, non-citables)
  corpus/_index.json  — index unifié (auto)
  corpus/_merged.bib  — biblio consolidée (auto)

Agents VS Code Copilot :
  Collector · Analyze · Outline · StateOfArt · Writer · Reviewer
`

const [,, command, ...args] = process.argv

async function main() {
  switch (command) {
    case 'collect':
    case 'ingest':
      await ingestSources(args)
      break
    case 'corpus':
    case 'sources':
      showSources(args[0])
      break
    case 'coverage':
    case 'abstracts':
      showAbstracts(args[0])
      break
    case 'analyze': {
      const slug = args.find(a => !a.startsWith('--'))
      await analyzeCommand(slug)
      break
    }
    case 'outline': {
      const slug = args.find(a => !a.startsWith('--'))
      await outlineCommand(slug)
      break
    }
    case 'bibliography':
    case 'bib':
      buildFinalBibliography()
      break
    case 'export':
    case 'pdf':
      await exportPdf(args)
      break
    case 'precheck':
      precheck(args[0])
      break
    case 'init':
      ensureDirs()
      ok('Dossiers créés')
      break
    case 'reset':
      await resetPipeline(args)
      break
    default:
      console.log(HELP)
  }
}

main().catch(e => { err(e.message); process.exit(1) })
