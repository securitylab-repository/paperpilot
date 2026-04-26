---
description: 'Remettre le projet à l''état post-install — supprime les artefacts pipeline, conserve le corpus.'
---

# Reset du pipeline PapperPilot

Remet le projet à l'état initial (équivalent d'un `install.sh` frais) sans toucher au corpus bibliographique.

## Ce que le reset efface

| Cible | Action |
|-------|--------|
| `.planning/corpus/`, `analysis/`, `outline/`, `state_of_art/`, `drafts/`, `reviews/` | Vidés |
| `.planning/STATE.md`, `PROJECT.md`, `config.json` | Restaurés depuis les templates |
| `.plans/<slug>/` | Supprimés (artefacts analyze/outline) |
| `output/paper.md`, `output/paper.pdf`, `output/bibliography.bib` | Supprimés |

## Ce que le reset **conserve**

- `corpus/pdfs/`, `corpus/bib/`, `corpus/notes/` — toutes les sources
- `corpus/_index.json`, `_merged.bib`, `_abstracts-cache.json` — index calculés
- `.plans/_locks/` — verrous CLI

## Exécution

Lance la commande suivante via `runCommands` :

```bash
node papperpilot.js reset --force
```

Puis confirme à l'utilisateur :

```
✅ Projet remis à l'état post-install.
   corpus/  → intact (X sources préservées)
   Prochaine étape : rpw-init.prompt.md pour reconfigurer le projet,
                     ou rpw-collect.prompt.md si le corpus est déjà prêt.
```

## Quand utiliser ce prompt

- Recommencer un projet sur un nouveau sujet en gardant le corpus
- Corriger une corruption du pipeline (STATE.md / artefacts incohérents)
- Tester le pipeline depuis zéro sans perdre les sources collectées

⚠️ **Irréversible** : les drafts, l'état de l'art et les révisions seront perdus. S'assurer que l'utilisateur a bien validé avant d'exécuter.
