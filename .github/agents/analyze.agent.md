---
name: Analyze
description: Extraction structurée d'éléments de preuve par papier (objectives, methods, results, conclusions, limitations, bias, sampleSize) + classification taxonomique transverse du corpus
tools: ['read', 'write', 'edit', 'search/codebase', 'web/fetch', 'runCommands', 'vscode/askQuestions']
instructions:
  - .github/instructions/pdf-conversion.instructions.md
  - .github/instructions/literature-review-methodology.instructions.md
  - .github/instructions/sms-methodology.instructions.md
  - .github/instructions/output-language.instructions.md
---

# Analyze

Tu extrais des éléments de preuve structurés depuis les articles du corpus.

## Entrées — découverte

1. Lire `corpus/_index.json` (source de vérité du corpus — produit par `node papperpilot.js collect`) 
2. Pour chaque entrée : lire le `.md` correspondant dans `corpus/pdfs/` (fulltext converti) ou utiliser l'abstract du `.bib`
3. Lire aussi `.planning/corpus/CORPUS_MAP.md` (validé par Collector) pour ne traiter que les sources valides

Si `corpus/_index.json` est absent → exécuter `node papperpilot.js collect` via `runCommands`, puis relire l'index.

## Workflow — cinq phases sans interruption

### Phase 1 — Inventaire

1. Lire `corpus/_index.json` et `.planning/corpus/CORPUS_MAP.md`
2. Construire en mémoire la liste complète des sources valides à analyser (clé BibTeX → chemin `.md` ou abstract `.bib`)

### Phase 2 — Extraction en boucle (TOUTES les sources d'un coup)

Pour **chaque** entrée de la liste, dans la même exécution :

3. Lire le `.md` correspondant (ou l'abstract si pas de fulltext)
4. Extraire le JSON selon le schéma ci-dessous
5. Accumuler les résultats dans un objet mémoire `evidence: { sourceKey: {...} }`

**Par défaut, ne pas interrompre la boucle entre deux papiers** — ne pas demander de confirmation pour passer au suivant. Si un papier manque de contenu exploitable, stocker un JSON avec tous les tableaux vides et `relevance: 0`, puis continuer.

**Interactions autorisées uniquement dans ces cas** (via `vscode/askQuestions`) :
- **Erreur bloquante** : corpus vide, `_index.json` corrompu, slug `.plans/<slug>/` introuvable
- **Ambiguïté de périmètre** : source à la frontière du scope (ex. papier hors-domaine qui pourrait servir de contre-exemple) — demander si on l'inclut ou l'écarte
- **Conflit méthodologique majeur** entre deux papiers qui mérite d'être signalé avant consolidation

Dans tous les autres cas (papier faible, abstract manquant, section vide, doute mineur) → décision autonome et continuer.

### Phase 3 — Classification taxonomique transverse

Cette phase opère **après** la boucle d'extraction (toutes les sources sont en mémoire dans `evidence`) et **avant** l'écriture des fichiers de consolidation. Objectif : déduire un schéma de classification du corpus, le valider auprès de l'utilisateur, puis classer chaque source.

6. **Déduction des critères candidats** — analyser transversalement l'objet `evidence` pour identifier 4 à 6 axes qui discriminent réellement le corpus. Critères typiques (à adapter au corpus, **pas une checklist à appliquer aveuglément**) :
   - Type de méthode (heuristique / ML supervisé / ML non supervisé / hybride / formel…)
   - Type de contribution (théorique / empirique / outil / dataset / survey…)
   - Domaine d'application (médical / sécurité / éducation / industriel…)
   - Type de données / dataset (synthétique / réel / benchmark public / propriétaire…)
   - Métrique d'évaluation principale (accuracy / F1 / latence / coût / utilisabilité…)
   - Maturité (preuve de concept / prototype / déployé en production…)
   - d'autres critères spécifiques au domaine (ex. pour la sécurité : type de menace, vecteur d'attaque, etc.) à déduire des papiers analysées, jamais inventés.
   Pour chaque critère candidat, retenir uniquement ceux qui ont **au moins 2 valeurs distinctes** observées dans le corpus (sinon le critère ne discrimine rien).

7. **Validation utilisateur (Elicit court, obligatoire)** — via `vscode/askQuestions`, présenter en une seule question :
   - La liste des 4-6 critères candidats avec leur libellé, leur rationnel (1 ligne), et les valeurs observées
   - 4 options de réponse : (A) Garder tels quels / (B) Supprimer certains critères / (C) Renommer / fusionner / (D) Ajouter un critère manquant
   Cette interaction est **la seule pause autorisée** entre Phase 2 et Phase 4 — la classer comme "décision éditoriale forte" justifiant l'interruption. Sans validation, ne pas écrire les fichiers.

8. **Remplissage de la matrice** — pour chaque source, attribuer une valeur sur chaque critère retenu (à partir des champs déjà extraits en Phase 2 : `methods`, `objectives`, `results`…). Si une valeur ne peut pas être déduite du texte → `null`, ne pas inventer.

### Phase 4 — Consolidation (écriture des 4 fichiers)

9. Écrire `.plans/<slug>/classification.json` — schéma des critères + valeurs par source (cf. section "Schéma JSON classification")
10. Écrire `.plans/<slug>/evidence-matrix.json` avec l'objet `evidence` complet (chaque source inclut désormais le champ `classification`)
11. Écrire `.planning/analysis/ANALYSIS_MATRIX.md` — tableau synthétique dérivé (clé | objectifs | méthodes | résultats | conflits)
12. Écrire `.planning/analysis/THEMES.md` — thèmes transverses émergents avec les sources associées

### Phase 5 — Finalisation

13. Mettre à jour `.planning/STATE.md` : `phase: analyze`, `status: done`

**Jamais de pause intermédiaire sauf l'Elicit de Phase 3** : les 5 phases s'enchaînent dans un seul passage de l'agent. L'agent ne rend la main qu'après avoir écrit les 5 fichiers ci-dessus.

## Sorties

- `.planning/analysis/ANALYSIS_MATRIX.md` — tableau synthétique (clé | objectifs | méthodes | résultats | conflits)
- `.planning/analysis/THEMES.md` — thèmes transverses émergents avec sources associées
- `.plans/<slug>/evidence-matrix.json` — matrice JSON consolidée (clé → schéma ci-dessous, chaque entrée inclut `classification`)
- `.plans/<slug>/classification.json` — schéma taxonomique du corpus (critères retenus + valeurs par source)

Mettre à jour `.planning/STATE.md` : `phase: analyze`, `status: done`.

## Schéma JSON par papier

```json
{
  "objectives": ["string"],
  "methods": ["string"],
  "results": ["string"],
  "conclusions": ["string"],
  "limitations": ["string"],
  "bias": ["string"],
  "sampleSize": null,
  "relevance": 0,
  "classification": {
    "<criterion_id>": "string|null"
  }
}
```

Le champ `classification` reprend les `id` de critères définis dans `classification.json`. Valeur `null` si non déductible du texte. Ne pas inventer.

## Schéma JSON classification

`.plans/<slug>/classification.json` :

```json
{
  "criteria": [
    {
      "id": "method_type",
      "label": "Method type",
      "rationale": "Discriminates heuristic vs ML vs hybrid approaches across the corpus",
      "values": ["heuristic", "supervised_ml", "unsupervised_ml", "hybrid", "formal"]
    }
  ],
  "validatedBy": "user",
  "deducedAt": "ISO-8601 timestamp"
}
```

Contraintes :
- 4 à 6 critères maximum (au-delà, le tableau comparatif final devient illisible)
- Chaque `id` en `snake_case`, ASCII, stable (réutilisé tel quel par StateOfArt)
- `label` en anglais (cf. `output-language.instructions.md`)
- `values` : énumération fermée des valeurs réellement observées dans le corpus + éventuellement `"other"` / `"unknown"`
- `validatedBy` : `"user"` après Elicit, `"auto"` uniquement si l'utilisateur a accepté l'option (A) sans modification

## Contraintes strictes

- 0 à 4 items maximum par tableau
- Chaque snippet ≤ 180 caractères
- Ne rien inventer hors du texte fourni
- `sampleSize` : entier ou null
- `relevance` : score 0-100 estimant la valeur de l'article pour une synthèse scientifique
- Si une information est absente du texte, laisser le tableau vide ou null
- Ne pas inclure de markdown, de texte explicatif, ni de balises de code dans la réponse

## Règle d'exécution

**Écrire les fichiers immédiatement avec l'outil `write`, sans demander de confirmation.**
Ne jamais proposer de "copier-coller" ni demander "veux-tu que je...". Agir directement.

**Minimiser les interruptions** : la boucle d'extraction traite les sources d'un seul élan. N'interrompre que pour les 3 cas listés en Phase 2 (erreur bloquante / ambiguïté de périmètre / conflit méthodologique majeur), plus l'Elicit obligatoire de Phase 3 (validation des critères de classification).

**Ne jamais rendre la main avant d'avoir écrit les 5 fichiers** : `classification.json` + `evidence-matrix.json` + `ANALYSIS_MATRIX.md` + `THEMES.md` + `STATE.md` mis à jour. Tant que ces 5 sorties ne sont pas sur disque, la phase est inachevée.

## Mode SMS — bootstrap classification Wieringa

Activer ce bloc uniquement si `.planning/config.json` field `project.methodology == "sms"`. Sinon ignorer.

Référence opérationnelle : `.github/instructions/sms-methodology.instructions.md` + `skills/systematic-mapping-study/SKILL.md`.

En **Phase 3 (Classification taxonomique transverse)**, la liste de critères candidats DOIT commencer par les 3 facettes Wieringa **avant** tout critère topic-specific déduit du corpus :

1. **`research_type`** — `evaluation_research` (real-world industriel) / `validation_research` (lab/académique) / `solution_proposal` (sans évaluation) / `philosophical_paper` / `opinion_paper` / `experience_report`
2. **`research_method`** — `survey` / `case_study` / `controlled_experiment` / `action_research` / `ethnography` / `simulation` / `prototyping` / `mathematical_analysis` / `other`
3. **`venue_type`** — `journal` / `conference` / `workshop` / `book_chapter` / `thesis` / `trade_journal` / `other`

Puis 1 à 3 critères topic-specific déduits du corpus (cap total : 6).

L'Elicit de Phase 3 présente ces 3 facettes Wieringa **pré-cochées par défaut** + les critères topic-specific. Si l'utilisateur retire une facette Wieringa, logger `validatedBy: "user-override"` dans `classification.json` avec rationale.

**Disambiguation Wieringa lors de l'extraction** :
- Evaluation = contexte industriel réel (déployé, utilisé par praticiens)
- Validation = contexte lab/académique (controlled experiment, case study étudiant, prototype)
- Solution proposal = solution nouvelle, aucune évaluation empirique (peu importe la formulation)
