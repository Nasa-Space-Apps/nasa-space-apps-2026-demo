---
name: mars-dossier-reconciliation
description: Phase 2.3 — reconcile the researched dossiers with the base timeline: detect contradictions, gaps and fragile events, and decide with the user what to keep, fix or replace before writing the story. Use it when `estado` says PHASE 2.3 or before `mars-story-writing`.
---

# Phase 2.3 — Reconciliation

Requirement: all the dossiers of the selection exist (`estado` → 0 pending).

## 1. Generate the report

`PY pipeline.py conciliar <id>` → `misiones/<id>/informes/conciliacion.md` and `.json`: per event, verified vs unverified data, contradictions, gaps, strong sources and a **fragile** flag.
An event is fragile if: more than 1/3 of its data was not verified, or it has fewer than 5 verified items, or it has no official/scientific source.

## 2. Read and decide (your job)

For every flagged event (and every one with contradictions), compare with the base (`nota`, `discutido`):

| Situation | Default decision |
|---|---|
| The dossier confirms the base and adds detail | **keep** |
| The dossier corrects a datum of the base (date, figure) | keep the dossier; note the discrepancy in the report, **do not** edit the base without permission |
| Two official sources disagree | **keep with a warning**: the story will say "according to X… according to Y…" |
| Fragile event with a strong theme for the story | propose a second pass (`agente.py --forzar`) or look for a source by hand |
| Fragile and replaceable event | propose to **replace** it with another event of the same phase (go back to 2.1 for that one only) |

Mark the decision in the table of the `.md` (☐ → ☑) and summarise for the user: fragile events, relevant contradictions, proposal. **Wait for their answer** if anything has to be replaced or redone (it spends quota).

## 3. Rules

- An `unverified` datum **does not go into the story as a fact**. It may go as "it is said that…" only if the user accepts it.
- Do not resolve contradictions by picking the source you like most: official/scientific wins; if they tie, the discrepancy is shown.
- Do not edit the dossiers by hand. Correcting = researching again.
- The base in `timelines_v0/` is not modified here; the discrepancies stay in the report to be decided later.

## Afterwards

With the decisions made, continue with `mars-story-writing`. `estado` moves to PHASE 2.4 when `informes/conciliacion.json` exists.
