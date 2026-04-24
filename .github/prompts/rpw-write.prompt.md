---
description: 'Lancer la phase de rédaction — écriture section par section.'
---

# Phase WRITE

Lance l'agent Writer pour rédiger le document section par section selon le plan validé.

## Prérequis

- `.planning/outline/OUTLINE.md` doit exister (plan validé)
- `.planning/corpus/CORPUS_MAP.md` doit exister
- `.planning/state_of_art/SOA.bib` doit exister (recommandé)

## Action via agent Copilot Chat

⚠️ **Ne pas tenter `node papperpilot.js write`** — cette commande n'existe pas. La rédaction est produite par l'agent `@Writer` dans Copilot Chat.

```
@Writer Rédige le document section par section selon .planning/outline/OUTLINE.md. Cite systématiquement depuis CORPUS_MAP.md et SOA.bib.
```

## Pour rédiger une section spécifique

```
@Writer Rédige uniquement la section "<titre>" du plan. Sauvegarde dans .planning/drafts/section_XX_<titre>.md.
```

## Sorties produites

- `.planning/drafts/section_XX_nom.md` — une par section
- `output/paper.md` — assemblage final

## Après la rédaction

Lancer `rpw-review.prompt.md` pour la révision.
