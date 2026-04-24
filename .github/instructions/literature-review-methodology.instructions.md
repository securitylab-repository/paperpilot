---
applyTo: "**/*.{md,json}"
description: Méthodologies de revue de littérature en computing science / IA — choix, phases, artefacts, références canoniques
---

# Méthodologies de revue de littérature — Computing Science / IA

Le choix de la méthodologie dépend du **type de document cible** défini dans `.planning/config.json` (champ `project.methodology`). Chaque méthode impose un cadre rigoureux avec phases, artefacts, critères de qualité et références canoniques à citer.

## Mapping `project.methodology` → cadre

| Valeur `methodology` | Cadre principal | Reporting complémentaire | Quand l'utiliser |
|----------------------|-----------------|--------------------------|------------------|
| `slr` | Kitchenham SLR | PRISMA 2020 | Survey académique rigoureux, target journal |
| `sms` | Petersen SMS | PRISMA 2020 | Cartographie d'un champ émergent, gap analysis |
| `mlr` | Garousi MLR | PRISMA 2020 | Revue incluant grey literature (blogs OpenAI, arXiv non-reviewed) |
| `sok` | SoK format | — | Publication sécurité (S&P, USENIX, CCS, NDSS) |
| `rapid` | Cartaxo Rapid Review | — | Rapport praticien, compromis rigueur/vitesse |
| `narrative` | Revue narrative | — | Introduction de thèse, état de l'art informel |

Si `methodology` est absent ou vide → l'agent Collector **pose la question en premier** avant toute autre.

---

## 1. SLR — Systematic Literature Review

**Référence canonique** : Kitchenham & Charters (2007). *Guidelines for performing Systematic Literature Reviews in Software Engineering*. EBSE Technical Report EBSE-2007-01.

### Phases

**Planning** :
- Définir les Research Questions (RQ) — questions Elicit-style (voir plus bas)
- Protocole : search strings, bases de données, critères d'inclusion/exclusion
- Stratégie d'extraction et de synthèse

**Conducting** :
- Recherche primaire (IEEE Xplore, ACM DL, Scopus, Semantic Scholar, arXiv)
- Screening : titre → abstract → full text
- Quality assessment (Dybå & Dingsøyr 2008)
- Extraction structurée (schéma evidence-matrix)
- Synthèse narrative ou quantitative

**Reporting** :
- Flow diagram PRISMA
- Tableaux de synthèse
- Réponse aux RQ
- Threats to validity

### Artefacts attendus
- `PROTOCOL.md` (RQ, search strings, critères)
- `PRISMA_FLOW.md` (diagramme de flux)
- `QUALITY_ASSESSMENT.md` (scores par papier)
- `evidence-matrix.json` (extraction)
- `SOA.md` (synthèse)

---

## 2. SMS — Systematic Mapping Study

**Référence canonique** : Petersen, Vakkalanka, Kuzniarz (2015). *Guidelines for conducting systematic mapping studies in software engineering: An update*. Information and Software Technology, 64, 1-18.

### Phases
1. Définition des RQ (scope plus large qu'un SLR)
2. Recherche
3. Screening
4. **Keywording** depuis les abstracts → schéma de classification
5. Data extraction + mapping process

### Artefacts attendus
- `CLASSIFICATION_SCHEME.md` (facettes)
- `BUBBLE_CHART.md` ou figure (distribution papiers par facette)
- `GAP_ANALYSIS.md` (zones sous-étudiées)

### Quand l'utiliser
Champ émergent, peu mature, besoin de cartographier avant revue approfondie. Produit une **vue d'ensemble** plutôt qu'une synthèse fine.

---

## 3. PRISMA 2020 — Reporting framework

**Référence canonique** : Page, McKenzie, Bossuyt et al. (2021). *The PRISMA 2020 statement: an updated guideline for reporting systematic reviews*. BMJ, 372, n71.

### Nature
Framework de **reporting**, pas d'investigation. Complémente un SLR/SMS/MLR.

### Artefacts obligatoires
- **Checklist 27 items** (Page et al. Table S2)
- **Flow diagram 4 phases** :
  1. Identification (records identified from databases + other sources)
  2. Screening (after duplicates removed)
  3. Eligibility (full-text assessed)
  4. Included (final synthesis set)

---

## 4. MLR — Multivocal Literature Review

**Référence canonique** : Garousi, Felderer, Mäntylä (2019). *Guidelines for including grey literature and conducting multivocal literature reviews in software engineering*. Information and Software Technology, 106, 101-121.

### Particularité
Inclut la **grey literature** : blogs techniques, tech reports, arXiv non-reviewed, GitHub READMEs, Stack Overflow, podcasts, talks conférence.

**Crucial en IA** : beaucoup d'avancées sont publiées hors peer review (tech blogs OpenAI / Anthropic / DeepMind / Meta AI).

### Phases additionnelles vs SLR
- **Quality assessment des sources grey** (autorité de l'auteur, méthodologie, date, reproductibilité)
- **Triangulation** white literature ↔ grey literature
- Déclaration explicite du ratio white/grey et justification

---

## 5. SoK — Systematization of Knowledge

**Format accepté** : IEEE S&P, USENIX Security, CCS, NDSS (venues sécurité top-tier).

### Structure type
1. Introduction + scope
2. **Taxonomie** structurée des approches existantes
3. **Évaluation critique** (forces/faiblesses) de chaque approche
4. Identification des **open problems**
5. Recommandations pour la communauté

### Quand l'utiliser
Champ avec approches contradictoires à systématiser :
- Adversarial ML (AdvML)
- Privacy-preserving ML (DP, FL, HE)
- LLM safety & alignment
- IoT security

---

## 6. Rapid Review

**Référence canonique** : Cartaxo, Pinto, Soares (2018). *The Role of Rapid Reviews in Supporting Decision-Making in Software Engineering Practice*. EASE 2018.

### Particularité
Compromis **rigueur/vitesse** pour praticiens (semaines vs mois).

### Simplifications vs SLR
- Une seule base de données (ex. Scopus ou Semantic Scholar)
- Search strings plus larges
- Single-reviewer extraction (pas de double-coding)
- Pas de quality assessment formel
- Pas de snowballing systématique

### Limite
Non acceptable pour un journal academic top-tier — réservé aux rapports internes ou décisions tactiques.

---

## 7. Snowballing — technique complémentaire

**Référence canonique** : Wohlin (2014). *Guidelines for snowballing in systematic literature studies and a replication in software engineering*. EASE 2014.

### Usage
Complète un SLR ou SMS existant. Pas une méthodologie autonome.

- **Backward snowballing** : analyser les références citées par le seed set
- **Forward snowballing** : chercher qui cite les papiers du seed set (Google Scholar "Cited by", Semantic Scholar)
- Itération : chaque nouveau papier ajouté devient candidat au snowballing

### Quand obligatoire
Pour tout SLR sérieux, snowballing ≥ 1 itération est attendu. Les search strings seuls ratent typiquement 10-20% des papiers pertinents.

---

## Questions de cadrage (style Elicit) — phase Planning

Les "questions Elicit-style" utilisées dans PapperPilot correspondent à la **définition des RQ** dans la phase Planning d'un SLR/SMS. C'est une convention UX, pas une méthode formelle distincte.

### Principes
- **3 à 7 questions** ouvertes, groupées en un seul tour
- Pas de questions fermées oui/non
- Pas de questions sur l'implémentation (détails techniques)
- Focus : objectif, audience, périmètre, sources incontournables, exclusions
- Chaque réponse doit pouvoir être tracée dans le protocole

### Catalogue par phase

**Phase Planning (Collector, début)** :
- Quel est l'objectif principal de ce survey/article (RQ principale) ?
- Quelle est l'audience cible (chercheurs, praticiens, décideurs, étudiants) ?
- Y a-t-il des sources incontournables (seed papers) déjà identifiées ?
- Quelles périodes temporelles sont pertinentes (début/fin) ?
- Quelles méthodes ou approches inclure / exclure explicitement ?
- Quels venues prioriser (journaux, conférences) ?
- Quel niveau d'inclusion de grey literature (aucun / modéré / fort → choix MLR) ?

**Phase Eligibility (Collector, mi-parcours)** :
- Ce papier frontière est-il inclus ou exclu ? (justifier avec le critère)
- Ce papier non peer-reviewed est-il une source valide ici ? (selon `methodology`)

**Phase Synthesis (Writer, StateOfArt)** :
- Quelle position éditoriale adopter sur cette contradiction (neutre / prescriptive / descriptive) ?
- Ce gap identifié mérite-t-il une section dédiée ou une mention en conclusion ?

### Anti-patterns
- Poser des questions dont la réponse est dérivable de `config.json` ou des entrées
- Multiplier les tours au lieu de batcher
- Demander validation au lieu de décider de façon autonome
- Poser des questions de forme ("faut-il mettre en gras ?") — jamais justifié

---

## Critères de qualité (Dybå & Dingsøyr 2008)

**Référence** : Dybå, Dingsøyr (2008). *Empirical studies of agile software development: A systematic review*. Information and Software Technology, 50(9-10), 833-859.

Checklist de quality assessment pour études primaires (à adapter selon le contexte) :

- [ ] **Design** : l'étude répond-elle à une RQ claire et justifiée ?
- [ ] **Sampling** : le choix des cas/participants est-il justifié et représentatif ?
- [ ] **Data collection** : la collecte est-elle rigoureuse et décrite en détail ?
- [ ] **Data analysis** : l'analyse est-elle rigoureuse (stats, coding, triangulation) ?
- [ ] **Reflexivity** : les biais et limitations sont-ils discutés ?
- [ ] **Findings** : les résultats sont-ils clairement rapportés et liés aux RQ ?
- [ ] **Value** : l'étude apporte-t-elle une valeur tangible au champ ?

---

## Bases de données recommandées (CS / IA)

| Base | Usage | Priorité IA/CS |
|------|-------|----------------|
| **Semantic Scholar** | API gratuite, index large, abstracts | ★★★★★ |
| **arXiv** | Preprints IA/CS (crucial) | ★★★★★ |
| **IEEE Xplore** | Revues/conférences IEEE | ★★★★ |
| **ACM Digital Library** | Revues/conférences ACM | ★★★★ |
| **DBLP** | Index conférences CS | ★★★ |
| **Scopus** | Agrégateur large | ★★★ |
| **CrossRef** | DOI lookup, métadonnées | ★★★ |
| **Google Scholar** | Couverture large mais bruyante | ★★ (complément) |
| **Papers With Code** | Benchmarks + implémentations | ★★★ (IA seulement) |

---

## Anti-patterns méthodologiques

- Méthodologie implicite / non documentée dans le papier final
- Pas de critères d'inclusion / exclusion explicites
- Search strings non reproductibles
- Pas de quality assessment
- Cite uniquement des papiers récents sans backward snowballing
- Mélange white et grey literature sans triangulation ni justification
- Faire un "survey" narratif en prétendant à la rigueur d'un SLR

---

## Références canoniques — entrées BibTeX

Toutes ces références sont **attendues en citation** dans un survey sérieux en CS/IA. À inclure dans la section Méthodologie du papier final.

```bibtex
@techreport{kitchenham2007guidelines,
  title={Guidelines for performing systematic literature reviews in software engineering},
  author={Kitchenham, Barbara and Charters, Stuart},
  year={2007},
  institution={EBSE Technical Report EBSE-2007-01},
  number={EBSE-2007-01}
}

@article{petersen2015guidelines,
  title={Guidelines for conducting systematic mapping studies in software engineering: An update},
  author={Petersen, Kai and Vakkalanka, Sairam and Kuzniarz, Ludwik},
  journal={Information and Software Technology},
  volume={64},
  pages={1--18},
  year={2015},
  publisher={Elsevier}
}

@article{page2021prisma,
  title={The PRISMA 2020 statement: an updated guideline for reporting systematic reviews},
  author={Page, Matthew J and McKenzie, Joanne E and Bossuyt, Patrick M and Boutron, Isabelle and Hoffmann, Tammy C and Mulrow, Cynthia D and others},
  journal={BMJ},
  volume={372},
  year={2021},
  publisher={British Medical Journal Publishing Group}
}

@article{garousi2019guidelines,
  title={Guidelines for including grey literature and conducting multivocal literature reviews in software engineering},
  author={Garousi, Vahid and Felderer, Michael and M{\"a}ntyl{\"a}, Mika V},
  journal={Information and Software Technology},
  volume={106},
  pages={101--121},
  year={2019},
  publisher={Elsevier}
}

@inproceedings{wohlin2014guidelines,
  title={Guidelines for snowballing in systematic literature studies and a replication in software engineering},
  author={Wohlin, Claes},
  booktitle={Proceedings of the 18th International Conference on Evaluation and Assessment in Software Engineering (EASE)},
  pages={1--10},
  year={2014}
}

@inproceedings{cartaxo2018rapid,
  title={The Role of Rapid Reviews in Supporting Decision-Making in Software Engineering Practice},
  author={Cartaxo, Bruno and Pinto, Gustavo and Soares, S{\'e}rgio},
  booktitle={Proceedings of the 22nd International Conference on Evaluation and Assessment in Software Engineering (EASE)},
  pages={142--151},
  year={2018}
}

@article{dyba2008empirical,
  title={Empirical studies of agile software development: A systematic review},
  author={Dyb{\aa}, Tore and Dings{\o}yr, Torgeir},
  journal={Information and Software Technology},
  volume={50},
  number={9-10},
  pages={833--859},
  year={2008},
  publisher={Elsevier}
}
```

---

## Usage dans les agents PapperPilot

- **Collector** : applique la méthodologie choisie → définit RQ, search strings, critères d'inclusion, pose les questions Planning Elicit-style
- **Analyze** : extraction structurée conforme au schéma de la méthodologie (evidence-matrix respecte les facettes du SMS ou les dimensions d'un SLR)
- **Outline** : clustering aligné sur la taxonomie (pour SoK) ou les RQ (pour SLR)
- **StateOfArt** : synthèse narrative référencée par RQ, inclut PRISMA flow + threats to validity si applicable
- **Writer** : cite les références canoniques de la méthodologie dans la section Méthodologie du papier
- **Reviewer** : vérifie la conformité au cadre choisi (checklist 27 items PRISMA pour SLR, etc.)
