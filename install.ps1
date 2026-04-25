param(
  [string]$TargetDir = (Get-Location).Path,
  [switch]$Interactive,
  [switch]$SkipDeps
)

$ErrorActionPreference = 'Stop'

# By default, install all missing dependencies non-interactively.
# Use -Interactive to be prompted per dependency.
# Use -SkipDeps to skip the dependency installation step entirely.
$AutoYes = -not $Interactive

function Get-NormalizedPath {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Path
  )

  $ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath($Path).TrimEnd('\')
}

function Copy-FileSet {
  param(
    [Parameter(Mandatory = $true)]
    [string]$SourceDir,
    [Parameter(Mandatory = $true)]
    [string]$Filter,
    [Parameter(Mandatory = $true)]
    [string]$DestinationDir,
    [Parameter(Mandatory = $true)]
    [string]$Message
  )

  $files = @(Get-ChildItem -Path $SourceDir -Filter $Filter -File)
  foreach ($file in $files) {
    Copy-Item -LiteralPath $file.FullName -Destination $DestinationDir -Force
  }

  Write-Host ($Message -f $files.Count)
}

$scriptPath = if ($PSCommandPath) { $PSCommandPath } else { $MyInvocation.MyCommand.Path }
$scriptDir = Split-Path -Parent $scriptPath
$normalizedScriptDir = Get-NormalizedPath -Path $scriptDir
$normalizedTargetDir = Get-NormalizedPath -Path $TargetDir

if ($normalizedScriptDir -eq $normalizedTargetDir) {
  Write-Host 'WARNING: you are running install.ps1 from the PapperPilot repo itself.'
  Write-Host '         Pass the target project path as an argument:'
  Write-Host '         .\install.ps1 C:\path\to\your\project'
  exit 1
}

if (-not (Test-Path -LiteralPath $normalizedTargetDir -PathType Container)) {
  throw "Target directory does not exist: $normalizedTargetDir"
}

Write-Host 'Installing PapperPilot'
Write-Host "  Source: $normalizedScriptDir"
Write-Host "  Target: $normalizedTargetDir"

Set-Location -LiteralPath $normalizedTargetDir

$directories = @(
  'corpus\pdfs',
  'corpus\bib',
  'corpus\notes',
  '.plans\_locks',
  '.github\agents',
  '.github\hooks',
  '.github\prompts',
  '.github\instructions',
  '.planning\corpus',
  '.planning\analysis',
  '.planning\outline',
  '.planning\state_of_art',
  '.planning\drafts',
  '.planning\reviews',
  'output'
)

foreach ($directory in $directories) {
  New-Item -ItemType Directory -Path $directory -Force | Out-Null
}

if (-not (Test-Path -LiteralPath 'corpus\README.md')) {
  @'
# Sources bibliographiques

Tu peux alimenter ton corpus de **trois facons** :

```
corpus/
|- pdfs/      <- articles PDF telecharges (convertis en .md par collect)
|- bib/       <- exports Zotero / Mendeley / JabRef (.bib)
|- notes/     <- fiches de lecture perso (.md, NON-citables)
|
|- _index.json           <- index consolide (produit par collect)
|- _merged.bib           <- biblio unifiee (produit par collect)
`- _abstracts-cache.json <- cache des abstracts recuperes
```

## Les 3 voies d'entree

### 1. PDFs (`pdfs/`)
Depose ici les articles PDF telecharges depuis arXiv, HAL, l'editeur, etc.
`ingest` les convertit en `.md` pour que les agents puissent les lire.

### 2. BibTeX (`bib/`)
Depose ici tes exports Zotero, Mendeley ou JabRef.
`ingest` parse les metadonnees (titre, auteurs, DOI, abstract) et les ajoute a l'index.

Utile pour :
- Declarer des sources sans avoir le PDF sous la main
- Importer rapidement une biblio existante
- Referencer des livres, chapitres, actes de conference

### 3. Notes personnelles (`notes/`)
Depose ici tes fiches de lecture, syntheses perso, notes de cours.
Ces `.md` sont **lus** par les agents pour contextualiser, mais **non-citables**
en sortie finale - ils servent a nourrir ton raisonnement, pas comme reference.

Format recommande (frontmatter YAML optionnel) :
```markdown
---
title: Notes cours Bengio Mila 2024
authors: [Moi]
year: 2024
scope: personal
---

# Notes cours Bengio Mila 2024
...
```

## Utilisation

```bash
# 1. Depose tes sources dans les bons sous-dossiers

# 2. Indexe tout + recupere les abstracts manquants automatiquement
node papperpilot.js collect

# Variantes :
node papperpilot.js collect --no-fetch            # sans appels reseau (offline)
node papperpilot.js collect --refresh-abstracts   # force le re-fetch (cache ignore)

# 3. Consulte l'etat du corpus
node papperpilot.js corpus
node papperpilot.js coverage --missing

# Compatibilite :
# node gsdlite.js ingest/sources/abstracts reste supporte
```

## Recuperation d'abstracts automatique

Pour chaque entree `.bib` sans abstract, `ingest` tente la cascade :
1. **CrossRef** (si DOI present)
2. **arXiv** (si arXiv ID / eprint)
3. **Semantic Scholar** (par DOI ou titre)

Les resultats sont mis en cache dans `_abstracts-cache.json`.

## Dependances systeme

- **pdftotext** (pour les PDFs - optionnel si tu n'utilises que bib/notes) :
  - macOS : `brew install poppler`
  - Ubuntu/Debian : `sudo apt install poppler-utils`
  - Windows : `scoop install poppler`

- **Acces internet** (pour les abstracts - optionnel avec `--no-fetch`)

## Notes importantes

- `_index.json`, `_merged.bib`, `_abstracts-cache.json` sont **generes** - ne les edite pas a la main
- Les `.md` dans `pdfs/` ont un `_pdf_hash` qui evite de reconvertir inutilement
- Si un PDF est scanne (image), l'extraction sera vide -> OCR prealable necessaire
- Les notes dans `notes/` peuvent avoir un frontmatter YAML (title/authors/year) mais c'est optionnel
- **Les notes ne sont pas citables en sortie finale** : Writer peut s'en inspirer mais pas produire `[@key]`
'@ | Set-Content -LiteralPath 'corpus\README.md' -Encoding utf8
  Write-Host 'Created corpus\README.md with usage guidance'
}

Copy-Item -LiteralPath (Join-Path $scriptDir 'papperpilot.js') -Destination '.\papperpilot.js' -Force
Copy-Item -LiteralPath (Join-Path $scriptDir 'gsdlite.js') -Destination '.\gsdlite.js' -Force
Write-Host 'Copied papperpilot.js (main entrypoint)'
Write-Host 'Copied gsdlite.js (legacy compatibility)'

New-Item -ItemType Directory -Path '.vscode' -Force | Out-Null
if (-not (Test-Path -LiteralPath '.vscode\settings.json')) {
  Copy-Item -LiteralPath (Join-Path $scriptDir '.vscode\settings.json') -Destination '.vscode\settings.json' -Force
  Write-Host 'Created .vscode\settings.json (chat.agent.enabled: true)'
} else {
  Write-Host '.vscode\settings.json already exists - not overwritten'
}

if (-not (Test-Path -LiteralPath 'package.json')) {
  @'
{
  "name": "papperpilot-project",
  "version": "1.0.0",
  "type": "module",
  "private": true,
  "scripts": {
    "status": "node papperpilot.js status",
    "unlock": "node papperpilot.js unlock",
    "collect": "node papperpilot.js collect",
    "corpus": "node papperpilot.js corpus",
    "coverage": "node papperpilot.js coverage"
  }
}
'@ | Set-Content -LiteralPath 'package.json' -Encoding utf8
  Write-Host 'Created package.json'
} else {
  if (-not (Select-String -Path 'package.json' -Pattern '"type"\s*:\s*"module"' -Quiet)) {
    Write-Host 'WARNING: package.json does not contain "type": "module".'
    Write-Host '         papperpilot.js / gsdlite.js use ESM imports. Add it manually to avoid warnings.'
  }
}

if (-not (Test-Path -LiteralPath '.plans\_backlog.md')) {
  @'
# Backlog

| Feature | Statut | Date |
|---|---|---|
'@ | Set-Content -LiteralPath '.plans\_backlog.md' -Encoding utf8
}

Copy-Item -LiteralPath (Join-Path $scriptDir '.github\copilot-instructions.md') -Destination '.github\copilot-instructions.md' -Force

Copy-FileSet -SourceDir (Join-Path $scriptDir '.github\agents') -Filter '*.agent.md' -DestinationDir '.github\agents' -Message 'Copied {0} agent definitions (.github\agents)'
Copy-FileSet -SourceDir (Join-Path $scriptDir '.github\prompts') -Filter '*.prompt.md' -DestinationDir '.github\prompts' -Message 'Copied {0} prompt files (.github\prompts)'
Copy-FileSet -SourceDir (Join-Path $scriptDir '.github\instructions') -Filter '*.instructions.md' -DestinationDir '.github\instructions' -Message 'Copied {0} instruction files (.github\instructions)'
Copy-FileSet -SourceDir (Join-Path $scriptDir '.github\hooks') -Filter '*.json' -DestinationDir '.github\hooks' -Message 'Copied {0} hook files (.github\hooks)'

if (-not (Test-Path -LiteralPath '.planning\config.json')) {
  Copy-Item -LiteralPath (Join-Path $scriptDir '.planning\config.json') -Destination '.planning\config.json' -Force
  Copy-Item -LiteralPath (Join-Path $scriptDir '.planning\STATE.md') -Destination '.planning\STATE.md' -Force
  Copy-Item -LiteralPath (Join-Path $scriptDir '.planning\PROJECT.md') -Destination '.planning\PROJECT.md' -Force

  $planningFiles = @(
    'corpus\CORPUS_MAP.md',
    'corpus\SEARCH_QUERIES.md',
    'analysis\ANALYSIS_MATRIX.md',
    'analysis\THEMES.md',
    'outline\OUTLINE.md',
    'state_of_art\SOA.md',
    'state_of_art\SOA.bib',
    'reviews\REVIEW_v1.md'
  )

  foreach ($planningFile in $planningFiles) {
    Copy-Item -LiteralPath (Join-Path $scriptDir ".planning\$planningFile") -Destination (Join-Path '.planning' $planningFile) -Force
  }

  Write-Host 'Initialized .planning\'
}

if (Test-Path -LiteralPath '.gitignore') {
  if (-not (Select-String -Path '.gitignore' -Pattern '^[.]plans[\\/]_locks[\\/]?$' -Quiet)) {
    Add-Content -LiteralPath '.gitignore' -Value ''
    Add-Content -LiteralPath '.gitignore' -Value '# PapperPilot'
    Add-Content -LiteralPath '.gitignore' -Value '.plans/_locks/'
  }
} else {
  @'
node_modules/
.plans/_locks/
'@ | Set-Content -LiteralPath '.gitignore' -Encoding utf8
}

Write-Host ''
Write-Host 'PapperPilot installed (no credentials required)'
Write-Host ''

# --- Dependency checks -------------------------------------------------------

function Test-Cmd {
  param([string]$Name)
  return [bool](Get-Command $Name -ErrorAction SilentlyContinue)
}

function Get-PackageManager {
  if (Test-Cmd 'winget') { return 'winget' }
  if (Test-Cmd 'scoop')  { return 'scoop'  }
  if (Test-Cmd 'choco')  { return 'choco'  }
  return $null
}

function Invoke-Install {
  param(
    [string]$DisplayName,
    [string]$WingetId,
    [string]$ScoopPkg,
    [string]$ChocoPkg,
    [string]$ManualUrl,
    [switch]$Heavy
  )

  $pm = Get-PackageManager
  if (-not $pm) {
    Write-Host "  No package manager found (winget/scoop/choco). Install manually: $ManualUrl"
    return
  }

  $sizeNote = if ($Heavy) { ' (~500 MB, takes a few minutes)' } else { '' }

  if ($AutoYes) {
    Write-Host "  Installing $DisplayName via $pm$sizeNote ..."
  } else {
    $ans = Read-Host "  Install $DisplayName via $pm$sizeNote? [Y/n]"
    if ($ans -ne '' -and $ans -notmatch '^[Yy]') {
      Write-Host "  Skipped. Install manually: $ManualUrl"
      return
    }
  }

  try {
    switch ($pm) {
      'winget' { winget install --id $WingetId --accept-source-agreements --accept-package-agreements --silent }
      'scoop'  { scoop install $ScoopPkg }
      'choco'  { choco install $ChocoPkg -y }
    }
    Write-Host "  $DisplayName installed. Restart your terminal to update PATH."
  } catch {
    Write-Host "  Installation failed: $_"
    Write-Host "  Install manually: $ManualUrl"
  }
}

Write-Host ''
if ($SkipDeps) {
  Write-Host '--- Dependency checks (skipped via -SkipDeps) --------------------'
} else {
  Write-Host '--- Dependency checks --------------------------------------------'
  if ($AutoYes) {
    Write-Host '  Auto-install mode: missing dependencies will be installed without prompting.'
    Write-Host '  Use -Interactive to confirm each install, or -SkipDeps to skip.'
  }
}

if (-not $SkipDeps) {

# Node.js >= 18
if (Test-Cmd 'node') {
  $nodeVersion = (node --version 2>$null) -replace '^v', ''
  $nodeMajor   = [int]($nodeVersion -split '\.')[0]
  if ($nodeMajor -ge 18) {
    Write-Host "  [OK] Node.js v$nodeVersion"
  } else {
    Write-Host "  [WARN] Node.js v$nodeVersion detected -- v18+ required."
    Invoke-Install -DisplayName 'Node.js LTS' `
      -WingetId 'OpenJS.NodeJS.LTS' -ScoopPkg 'nodejs-lts' -ChocoPkg 'nodejs-lts' `
      -ManualUrl 'https://nodejs.org'
  }
} else {
  Write-Host '  [MISSING] Node.js not found -- required to run papperpilot.js.'
  Invoke-Install -DisplayName 'Node.js LTS' `
    -WingetId 'OpenJS.NodeJS.LTS' -ScoopPkg 'nodejs-lts' -ChocoPkg 'nodejs-lts' `
    -ManualUrl 'https://nodejs.org'
}

# pdftotext (poppler) - optional, for PDF ingestion
if (Test-Cmd 'pdftotext') {
  Write-Host '  [OK] pdftotext (poppler) - PDF ingestion ready'
} else {
  Write-Host '  [OPTIONAL] pdftotext not found -- needed to ingest PDF files.'
  Invoke-Install -DisplayName 'poppler (pdftotext)' `
    -WingetId 'oschwartz10612.poppler' -ScoopPkg 'poppler' -ChocoPkg 'poppler' `
    -ManualUrl 'https://github.com/oschwartz10612/poppler-windows/releases'
}

# pandoc - optional, for export to PDF
if (Test-Cmd 'pandoc') {
  Write-Host '  [OK] pandoc - PDF export ready'
} else {
  Write-Host '  [OPTIONAL] pandoc not found -- needed for: node papperpilot.js export'
  Invoke-Install -DisplayName 'pandoc' `
    -WingetId 'JohnMacFarlane.Pandoc' -ScoopPkg 'pandoc' -ChocoPkg 'pandoc' `
    -ManualUrl 'https://pandoc.org/installing.html'
}

# pdflatex (MiKTeX) - optional, for export to PDF
if (Test-Cmd 'pdflatex') {
  Write-Host '  [OK] pdflatex - LaTeX compilation ready'
} else {
  Write-Host '  [OPTIONAL] pdflatex not found -- needed for: node papperpilot.js export'
  Invoke-Install -DisplayName 'MiKTeX (pdflatex)' `
    -WingetId 'MiKTeX.MiKTeX' -ScoopPkg 'miktex' -ChocoPkg 'miktex' `
    -ManualUrl 'https://miktex.org/download' -Heavy
}

} # end if (-not $SkipDeps)

Write-Host '-----------------------------------------------------------------'
Write-Host ''
Write-Host 'Next steps:'
Write-Host '  1. Close and reopen VS Code (required to load custom agents)'
Write-Host '  2. Open the Chat view (Ctrl+Alt+I)'
Write-Host '  3. In the agent dropdown, you should see:'
Write-Host '     Collector, Analyze, Outline, StateOfArt, Writer, Reviewer'
Write-Host '  4. Drop your PDFs into corpus\ then launch the Collector agent'
Write-Host '     or: @workspace #file:.github/prompts/rpw-init.prompt.md'
Write-Host '  5. Main runtime: node papperpilot.js <command>'
Write-Host '     Compatibility: node gsdlite.js <command>'
Write-Host ''
Write-Host 'NOTE: custom agents are selected in the dropdown, not with @'
Write-Host '      (@ is reserved for chat participants such as @workspace)'
Write-Host ''
Write-Host 'If the agents do not appear:'
Write-Host '  - Check chat.agent.enabled=true in VS Code settings'
Write-Host '  - Check that the files exist: Get-ChildItem .github\agents\'
Write-Host "  - Reload the window: Ctrl+Shift+P -> 'Developer: Reload Window'"
Write-Host '  - Your GitHub organization may have disabled custom agents'
