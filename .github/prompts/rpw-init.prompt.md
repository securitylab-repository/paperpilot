---
description: 'Initialiser un nouveau projet PapperPilot — configure le contexte et prépare le pipeline.'
---

# Initialisation d'un projet PapperPilot

Initialise un nouveau projet de rédaction scientifique.

## Étapes

1. Lis `.planning/config.json` pour voir si un projet existe déjà.
2. Pose les questions suivantes à l'utilisateur :
   - Quel est le **titre** du projet (ou sujet principal) ?
   - Quel est le **type** de document ? (survey | paper | report | thesis | bibliography)
   - Quel est le **domaine** scientifique ?
   - Qui est l'**audience cible** ?
   - Quel **style de citation** ? (APA | IEEE | Vancouver | Chicago)

   **Langue des livrables — non-question** : tous les livrables du pipeline sont en anglais (cf. `.github/instructions/output-language.instructions.md`). Ne pas poser de question sur la langue. Le champ `config.json.project.language` reste figé à `"en"`.

3. Crée ou met à jour `.planning/config.json` avec ces informations.
4. Crée `.planning/PROJECT.md` avec le contexte du projet.
5. Crée `.planning/STATE.md` avec `phase: init`, `status: done`.
6. Vérifie que `corpus/` existe et affiche son contenu actuel.
7. Indique la prochaine étape : lancer l'agent **Collector**.

## Rappel structure

```
corpus/          ← Déposer ici les PDFs et fichiers sources
.planning/       ← État du pipeline (géré automatiquement)
output/          ← Livrables finaux
```
