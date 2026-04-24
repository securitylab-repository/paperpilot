---
description: 'Lancer l''état de l''art — synthèse argumentative de la littérature par thème.'
---

# Phase STATE OF ART

Lance l'agent StateOfArt pour produire la revue de littérature argumentée.

## Prérequis

- `.plans/<slug>/outline.json` doit exister (phase OUTLINE terminée)
- `.plans/<slug>/evidence-matrix.json` doit exister

## Action via agent Copilot Chat

⚠️ **Ne pas tenter `node papperpilot.js stateofart <slug>`** — cette commande n'existe pas. La synthèse est produite par l'agent `@StateOfArt` dans Copilot Chat.

```
@StateOfArt Produis l'état de l'art depuis .plans/<slug>/evidence-matrix.json et .plans/<slug>/outline.json. Synthèse par thème, traçable aux sources.
```

## Sorties produites

- `.planning/state_of_art/SOA.md` — revue de littérature rédigée
- `.planning/state_of_art/SOA.bib` — bibliographie de l'état de l'art

## Contraintes

- Synthèse par thème, pas par papier
- Signaler papiers fondateurs vs. récents
- Signaler accès libre vs. payant
- Toutes les affirmations référencées `[sourceKey]`

## Après l'état de l'art

Lancer `rpw-write.prompt.md` pour la rédaction complète.
