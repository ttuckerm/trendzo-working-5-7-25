# Root Markdown Inventory — 2026-05-04

**Branch:** `vercel-deploy-test`
**Repo root:** `C:\Projects\CleanCopy`
**Mode:** Read-only. No file changes were made during this inventory.

Methodology:
- Scope: every `*.md` / `*.MD` file at the repo root (depth 1 only — no recursion).
- Size: file size in KB (1 decimal).
- Last modified: `git log -1 --format=%ci -- <file>`. Files that have never been committed show `(untracked)`.
- First 2 lines: literal first two lines of each file (after Windows-1252 encoding artifacts surfaced as `â€"`/`â€¦` etc. — these are mojibake from the source files themselves, not from this inventory; preserved verbatim so Tommy can recognize the file).
- Reference count: number of files under `src/`, `scripts/`, `tests/`, `config/`, plus `package.json`, that contain the exact filename string. The file itself is excluded. Any non-zero count means the filename is mentioned somewhere actionable in code or config (could be a doc link, a comment, a path string, etc.). Search corpus: 3,715 files.
- Pattern match column = pattern(s) hit from the user-supplied list: `PHASE*`, `BUG*`, `FIX*`, `INVESTIGATION*`, `HANDOFF*`, `SESSION*`, `VERIFICATION*`, `CONTINUATION*`, `*_2026-*`. A blank means no pattern match.

Section assignment rule:
- **Section A** = referenced (count > 0) **OR** canonical-by-name (CLAUDE/CHANGELOG/THIRD_PARTY_NOTICES, etc.).
- **Section B** = matches at least one pattern **AND** has 0 references **AND** is not canonical-by-name.
- **Section C** = everything else (the user's explicit "ambiguous" bucket — no pattern match, 0 refs, not on the canonical examples list).

Sorting within each section: by last-modified date, newest first. Untracked files sort to the top (treated as most recent).

Note: there is no `README.md`, `AGENTS.md`, `ARCHITECTURE.md`, `LICENSE.md`, or `CONTRIBUTING.md` at the repo root.

---

## Section A — Likely keepers (referenced elsewhere OR canonical project docs)

| Filename | Size (KB) | Last modified | First line | Second line | Refs | Pattern |
|----------|----------:|---------------|------------|-------------|-----:|---------|
| Design.md | 20.7 | 2026-04-17 12:46:07 -0400 | `# TRENDZO DESIGN SYSTEM` | `### Unified Design Language — All Three Platform Layers` | 3 | — |
| CLAUDE.md | 94.8 | 2026-04-17 11:24:14 -0400 | `# Trendzo Project Operating System` | (blank) | 4 | — (canonical) |
| BUG2_CHAT_SCHEMA_FIX_2026-04-24.md | 22.9 | 2026-04-29 18:57:55 -0400 | `# BUG 2 — Chat Schema Fix Investigation (2026-04-24)` | (blank) | 1 | BUG, *_2026-* |
| SUBSTRATE_AUDIT_2026-04-21.md | 59.0 | 2026-04-22 14:30:13 -0400 | `# SUBSTRATE AUDIT — Creator Operations Graph` | `**Date:** 2026-04-21` | 1 | *_2026-* |
| APIFY_TIKTOK_PIPELINE_SUMMARY.md | 13.9 | 2026-03-30 19:37:57 -0400 | `# 🎯 Apify TikTok Pipeline - Implementation Summary` | (blank) | 1 | — |
| APPLY-PREDICTIONS-MIGRATION.md | 3.0 | 2026-03-30 19:37:57 -0400 | `# Fix Predictions Table Schema - Manual Migration Guide` | (blank) | 3 | — |
| CHANGELOG.md | 5.7 | 2026-03-30 19:37:57 -0400 | `v0.5.0-verified — Seven changes PASS; cohort=2025W33` | (blank) | 0 | — (canonical) |
| ENHANCED_PATTERN_EXTRACTION_GUIDE.md | 8.1 | 2026-03-30 19:37:57 -0400 | `# Enhanced Pattern Extraction Implementation Guide` | (blank) | 1 | — |
| FIX-PREDICTIONS-TABLE-NOW.md | 3.1 | 2026-03-30 19:37:57 -0400 | `# 🔧 URGENT: Fix Predictions Table Schema` | (blank) | 1 | FIX |
| README_SANDBOX_WORKFLOW.md | 1.5 | 2026-03-30 19:37:57 -0400 | `## Viral Quick-Win Sandbox Workflow` | (blank) | 1 | — |
| THIRD_PARTY_NOTICES.md | 0.5 | 2026-03-30 19:37:57 -0400 | `# Third-Party Notices` | (blank) | 0 | — (canonical) |

**Count: 11**

---

## Section B — Likely session artifacts (matches a pattern above, 0 references)

| Filename | Size (KB) | Last modified | First line | Second line | Refs | Pattern |
|----------|----------:|---------------|------------|-------------|-----:|---------|
| ADMIN_INVENTORY_2026-05-04.md | 26.0 | (untracked) | `# Admin Inventory — 2026-05-04` | (blank) | 0 | *_2026-* |
| ADMIN_ROUTE_AUDIT_2026-04-30.md | 70.6 | (untracked) | `# Admin Route Audit — 2026-04-30` | (blank) | 0 | *_2026-* |
| BUILD_TIMEOUT_INVESTIGATION_2026-05-03.md | 21.6 | (untracked) | `# Build-Phase Timeout / OOM Investigation` | `Date: 2026-05-03` | 0 | INVESTIGATION, *_2026-* |
| CODEBASE_INVENTORY_2026-05-04.md | 73.5 | (untracked) | `# Trendzo Codebase Inventory — 2026-05-04` | (blank) | 0 | *_2026-* |
| CONSUMER_DASHBOARD_INVENTORY_2026-05-04.md | 53.6 | (untracked) | `# Consumer Dashboard Inventory — 2026-05-04` | (blank) | 0 | *_2026-* |
| INVESTIGATION_REPORT_2026-05-04.md | 35.7 | (untracked) | `# Investigation Report — 18 items across the repo` | (blank) | 0 | INVESTIGATION, *_2026-* |
| JSON_RENDER_INVESTIGATION_2026-05-03.md | 19.2 | (untracked) | `# @json-render/react Investigation` | `Date: 2026-05-03` | 0 | INVESTIGATION, *_2026-* |
| OB_2_INVESTIGATION_2026-04-29.md | 40.7 | (untracked) | `# OB-2 Onboarding Progress Tracking — Investigation` | (blank) | 0 | INVESTIGATION, *_2026-* |
| OB_2_PIPELINE_INVESTIGATION_2026-04-30.md | 37.1 | (untracked) | `# OB-2 Onboarding Progress Tracking — Pipeline Investigation` | (blank) | 0 | INVESTIGATION, *_2026-* |
| PARALLEL_DASHBOARD_INVENTORY_2026-05-04.md | 24.4 | (untracked) | `# Parallel Dashboard Inventory — 2026-05-04` | (blank) | 0 | *_2026-* |
| PHASE1_5_FIX_OUTCOME_2026-05-03.md | 13.4 | (untracked) | `# Phase 1.5 — Fix Outcome` | `Date: 2026-05-03` | 0 | PHASE, FIX, *_2026-* |
| PHASE1_6_FIX_OUTCOME_2026-05-03.md | 12.8 | (untracked) | `# Phase 1.6 — Fix Outcome` | (blank) | 0 | PHASE, FIX, *_2026-* |
| PHASE1_BUILD_INVESTIGATION_2026-05-02.md | 62.4 | (untracked) | `# Phase 1 — Build Failure Investigation` | (blank) | 0 | PHASE, INVESTIGATION, *_2026-* |
| PHASE1_DECISIONS_INVESTIGATION_2026-05-02.md | 31.1 | (untracked) | `# Phase 1 — Decisions Investigation` | (blank) | 0 | PHASE, INVESTIGATION, *_2026-* |
| PHASE1_FINAL_DECISIONS_2026-05-02.md | 38.1 | (untracked) | `# Phase 1 — Final Decisions` | (blank) | 0 | PHASE, *_2026-* |
| PHASE1_FIX_OUTCOME_2026-05-02.md | 18.1 | (untracked) | `# Phase 1 — Fix Outcome` | (blank) | 0 | PHASE, FIX, *_2026-* |
| PHASE1_VERCEL_AND_GITIGNORE_INVESTIGATION_2026-05-02.md | 32.8 | (untracked) | `# Phase 1 — Vercel Project & Gitignore Investigation` | (blank) | 0 | PHASE, INVESTIGATION, *_2026-* |
| PREDICTOR_INVENTORY_2026-05-04.md | 60.4 | (untracked) | `# Predictor Surface Inventory — 2026-05-04` | (blank) | 0 | *_2026-* |
| VERIFICATION_REPORT_2026-05-04.md | 16.0 | (untracked) | `# Verification Report — `tiktok_transcriber/` and `.agents/`` | (blank) | 0 | VERIFICATION, *_2026-* |
| AGENCY_ID_VERIFICATION_2026-04-24.md | 16.5 | 2026-04-29 18:57:55 -0400 | `# `content_briefs.agency_id` — Production-State Verification` | (blank) | 0 | VERIFICATION, *_2026-* |
| AI_EMPLOYEE_GAP_REPORT_2026-04-24.md | 37.9 | 2026-04-29 18:57:55 -0400 | `# AI EMPLOYEE GAP REPORT — v2 Architecture vs. Current Code` | (blank) | 0 | *_2026-* |
| AM_STEP_3_PARITY_INVESTIGATION_2026-04-25.md | 17.6 | 2026-04-29 18:57:55 -0400 | `# AM Step 3 Parity Investigation` | `**Date:** 2026-04-25` | 0 | INVESTIGATION, *_2026-* |
| AM_STEP_5_INVESTIGATION_2026-04-26.md | 11.2 | 2026-04-29 18:57:55 -0400 | `# AM Step 5 Investigation — platform_events emission discipline` | `Date: 2026-04-26` | 0 | INVESTIGATION, *_2026-* |
| APPROVED_VS_ACCEPTED_DECISION_2026-04-24.md | 19.1 | 2026-04-29 18:57:55 -0400 | `# `content_briefs.status` — Approved vs. Accepted Decision` | (blank) | 0 | *_2026-* |
| AUDIT_2026-04-23.md | 32.8 | 2026-04-29 18:57:55 -0400 | `# AUDIT 2026-04-23 — Read-only` | (blank) | 0 | *_2026-* |
| BRIEF_ROUTES_AUDIT_2026-04-24.md | 22.0 | 2026-04-29 18:57:55 -0400 | `# Brief Routes — Read-Only State Audit` | (blank) | 0 | *_2026-* |
| CLEANUP_SCOPE_DECISION_2026-04-23.md | 10.6 | 2026-04-29 18:57:55 -0400 | `# Cleanup Scope Decision — `content_briefs` migration` | (blank) | 0 | *_2026-* |
| COLUMN_DRIFT_DECISION_2026-04-23.md | 26.9 | 2026-04-29 18:57:55 -0400 | `# Column Drift Decision — `content_briefs`` | (blank) | 0 | *_2026-* |
| CREATOR_TABLE_WRITE_INVESTIGATION_2026-04-23.md | 28.9 | 2026-04-29 18:57:55 -0400 | `# Creator Table Write Investigation — 2026-04-23` | (blank) | 0 | INVESTIGATION, *_2026-* |
| DASHBOARD_CURRENT_STATE_2026-04-29.md | 37.5 | 2026-04-29 18:57:55 -0400 | `# Dashboard Current State Survey` | (blank) | 0 | *_2026-* |
| OB_1_DASHBOARD_PARITY_INVESTIGATION_2026-04-29.md | 16.7 | 2026-04-29 18:57:55 -0400 | `# OB-1 Dashboard Parity Investigation` | (blank) | 0 | INVESTIGATION, *_2026-* |
| OB_STEP_1_INVESTIGATION_2026-04-26.md | 17.3 | 2026-04-29 18:57:55 -0400 | `# OB Step 1 Investigation — Creator Invitation flow (OB-1)` | (blank) | 0 | INVESTIGATION, *_2026-* |
| SUBSTRATE_DECISION_2026-04-24.md | 6.6 | 2026-04-24 16:47:08 -0400 | `# SUBSTRATE DECISION — Trendzo Platform Architecture` | (blank) | 0 | *_2026-* |
| VERIFICATION_STRIPE_CHECKOUT.md | 8.3 | 2026-04-29 18:57:55 -0400 | `# Verification — Stripe Checkout for the Escape Assessment` | (blank) | 0 | VERIFICATION |
| VISIBLE_UI_BUGS_INVESTIGATION_2026-04-24.md | 26.7 | 2026-04-29 18:57:55 -0400 | `# Visible UI Bugs Investigation — 2026-04-24` | (blank) | 0 | INVESTIGATION, *_2026-* |
| AM_STEP_4_VERIFICATION_2026-04-26.md | 11.6 | 2026-04-26 13:41:46 -0400 | `# AM Step 4 — Verification (2026-04-26)` | (blank) | 0 | VERIFICATION, *_2026-* |
| AM_STEP_4_EMIT_INVESTIGATION_2026-04-26.md | 7.4 | 2026-04-26 13:41:46 -0400 | `# AM Step 4 — emit investigation (2026-04-26)` | (blank) | 0 | INVESTIGATION, *_2026-* |
| AM_STEP_3_VERIFICATION_2026-04-26.md | 7.5 | 2026-04-26 10:44:43 -0400 | `# AM Step 3 — Verification (2026-04-26)` | (blank) | 0 | VERIFICATION, *_2026-* |
| BUG1_STALE_BRIEFING_INVESTIGATION_2026-04-24.md | 19.5 | 2026-04-24 13:20:51 -0400 | `# BUG1 — Stale Morning Briefing Investigation` | (blank) | 0 | BUG, INVESTIGATION, *_2026-* |
| SESSION_PROTOCOL.md | 4.5 | 2026-04-17 12:46:07 -0400 | `# Session Protocol` | (blank) | 0 | SESSION |
| FIX-STRATEGY-FOLLOWER-COUNT-ISSUE.md | 11.1 | 2026-03-30 19:37:57 -0400 | `# FIX STRATEGY: Follower Count Issue` | (blank) | 0 | FIX |
| PHASE1_PARKING_LOT.md | 3.6 | 2026-05-03 14:21:01 -0400 | `# Phase 1 — Parking Lot` | (blank) | 0 | PHASE |

**Count: 42**

---

## Section C — Ambiguous (everything else)

These don't match any of the named patterns AND have 0 references AND aren't on the canonical examples list. They include long-form architecture documents, framework write-ups, FEAT-XXX feature docs, "complete"/"success" milestone reports, prompts for external tools, and standalone reference materials. Section C is the user's explicit bucket for files where Tommy's judgment is needed.

| Filename | Size (KB) | Last modified | First line | Second line | Refs | Pattern |
|----------|----------:|---------------|------------|-------------|-----:|---------|
| AI EMPLOYEE ARCHITECTURE.md | 30.4 | 2026-04-29 18:57:55 -0400 | `# TRENDZO — AI EMPLOYEE ARCHITECTURE` | `## The Build Bible` | 0 | — |
| AI_EMPLOYEE_1_ARCHITECTURE_v2.md | 33.6 | 2026-04-29 18:57:55 -0400 | `TRENDZO — AI EMPLOYEE ARCHITECTURE (v2)` | `Substrate-First Build Blueprint` | 0 | — |
| AI_EMPLOYEE_2_ONBOARDING_SPECIALIST_v2.md | 54.5 | 2026-04-29 18:57:55 -0400 | `TRENDZO — AI EMPLOYEE ARCHITECTURE (v2)` | `Substrate-First Build Blueprint` | 0 | — |
| AI_EMPLOYEE_3_TREND_SCOUT_v2.md | 79.9 | 2026-04-29 18:57:55 -0400 | `TRENDZO — AI EMPLOYEE ARCHITECTURE (v2)` | `Substrate-First Build Blueprint` | 0 | — |
| AI_EMPLOYEE_4_PERFORMANCE_ANALYST_v2.md | 113.4 | 2026-04-29 18:57:55 -0400 | `TRENDZO — AI EMPLOYEE ARCHITECTURE (v2)` | `Substrate-First Build Blueprint` | 0 | — |
| AI_EMPLOYEE_5_PROJECT_MANAGER_v2_.md | 145.0 | 2026-04-29 18:57:55 -0400 | `TRENDZO — AI EMPLOYEE ARCHITECTURE (v2)` | `Substrate-First Build Blueprint` | 0 | — |
| INTELLIGENT_CLAY_SPEC.md | 24.5 | 2026-04-17 12:46:07 -0400 | `# Intelligent Clay — Technical Specification` | (blank) | 0 | — |
| SYSTEM_STATE.md | 4.4 | 2026-04-17 12:46:07 -0400 | `# SYSTEM_STATE.md` | (blank) | 0 | — |
| ACTION_PLAN_3_PHASES.md | 13.1 | 2026-03-30 19:37:57 -0400 | `# 🎯 Action Plan: 3 Phases to Expand Dataset from 116 to 600+ Videos` | (blank) | 0 | — |
| ADMIN_LAB_DAY_7_COMPLETE.md | 10.0 | 2026-03-30 19:37:57 -0400 | `# Admin Prediction Lab - Day 7 Complete` | (blank) | 0 | — |
| AI_VIDEO_PROMPT_GENERATOR_COMPLETE.md | 16.7 | 2026-03-30 19:37:57 -0400 | `# ✅ AI VIDEO PROMPT GENERATOR - COMPLETE` | (blank) | 0 | — |
| API_SECURITY_DEPLOYMENT_GUIDE.md | 13.0 | 2026-03-30 19:37:57 -0400 | `# 🔐 API Security & Rate Limiting - Complete Implementation Guide` | (blank) | 0 | — |
| baseline_report.md | 7.0 | 2026-03-30 19:37:57 -0400 | `# Algorithm v1.0.0 Baseline Metrics Report` | `**Preservation Date**: 2025-01-15` | 0 | — |
| BLOOMBERG_TERMINAL_BUILD.md | 4.6 | 2026-03-30 19:37:57 -0400 | `# Bloomberg Terminal - Build Progress` | (blank) | 0 | — |
| CLASSIFICATION-THRESHOLD-FIX.md | 7.0 | 2026-03-30 19:37:57 -0400 | `# DPS Classification Threshold Fix` | (blank) | 0 | — (FIX is in middle, not prefix) |
| CLEANUP_REPORT.md | 8.3 | 2026-03-30 19:37:57 -0400 | `# Cleanup Report — CleanCopy (Trendzo)` | (blank) | 0 | — |
| COMPONENT_22_COMPETITOR_BENCHMARK.md | 8.6 | 2026-03-30 19:37:57 -0400 | `# Component 22: Competitor Benchmarking - Implementation Complete` | (blank) | 0 | — |
| COMPONENT_22_TEST_RESULTS.md | 6.5 | 2026-03-30 19:37:57 -0400 | `# Component 22: Competitor Benchmarking - Test Results` | (blank) | 0 | — |
| COMPREHENSIVE_LICENSING_PORTFOLIO.md | 15.4 | 2026-03-30 19:37:57 -0400 | `# COMPREHENSIVE PATENT LICENSING PORTFOLIO` | `## CleanCopy Technologies - Advanced AI Innovation Suite` | 0 | — |
| CREATOR_DASHBOARD_SETUP.md | 5.3 | 2026-03-30 19:37:57 -0400 | `# Creator Dashboard - Setup Instructions` | (blank) | 0 | — |
| CREATOR_PERSONALIZATION_DEMO.md | 6.5 | 2026-03-30 19:37:57 -0400 | `# Creator Personalization System - Complete Implementation` | (blank) | 0 | — |
| DATABASE_STORAGE_SUCCESS.md | 7.5 | 2026-03-30 19:37:57 -0400 | `# ✅ Database Storage Complete - All Features Stored Successfully` | (blank) | 0 | — |
| DATASET_EXPANSION_COMPLETE.md | 8.0 | 2026-03-30 19:37:57 -0400 | `# Dataset Expansion Complete - 116 → 152 Videos` | (blank) | 0 | — |
| DAY_3_COMPLETE_SUMMARY.md | 12.2 | 2026-03-30 19:37:57 -0400 | `# 🚀 Day 3 Complete: AI Script & Video Generation` | (blank) | 0 | — |
| DOCKER_DEPLOYMENT_README.md | 12.3 | 2026-03-30 19:37:57 -0400 | `# 🐳 TRENDZO DOCKER DEPLOYMENT STACK` | (blank) | 0 | — |
| ENHANCED_DONNA_INTEGRATION_COMPLETE.md | 7.4 | 2026-03-30 19:37:57 -0400 | `# Enhanced Donna Integration Complete` | (blank) | 0 | — |
| EXECUTIVE_LICENSING_PRESENTATION.md | 9.6 | 2026-03-30 19:37:57 -0400 | `# EXECUTIVE LICENSING PRESENTATION` | `## CleanCopy Technologies - Patent Portfolio Overview` | 0 | — |
| EXTRACTION_READY.md | 5.1 | 2026-03-30 19:37:57 -0400 | `# Enhanced Pattern Extraction - Ready to Run` | (blank) | 0 | — |
| FEAT-002-DEPLOYMENT-CHECKLIST.md | 9.2 | 2026-03-30 19:37:57 -0400 | `# FEAT-002: DPS Calculation Engine - Deployment Checklist` | (blank) | 0 | — |
| FEAT-002-ENHANCEMENTS-QUICKSTART.md | 6.1 | 2026-03-30 19:37:57 -0400 | `# FEAT-002 Enhancements - Quick Start Guide` | (blank) | 0 | — |
| FEAT-002-ENHANCEMENTS.md | 14.7 | 2026-03-30 19:37:57 -0400 | `# FEAT-002 Enhancements` | (blank) | 0 | — |
| FEAT-002-IMPLEMENTATION-SUMMARY.md | 13.0 | 2026-03-30 19:37:57 -0400 | `# FEAT-002: DPS Calculation Engine - Implementation Summary` | (blank) | 0 | — |
| FEAT-003-DEPLOYMENT-CHECKLIST.md | 10.3 | 2026-03-30 19:37:57 -0400 | `# FEAT-003: Pattern Extraction System - Deployment Checklist` | (blank) | 0 | — |
| FEAT-003-IMPLEMENTATION-SUMMARY.md | 15.2 | 2026-03-30 19:37:57 -0400 | `# FEAT-003: Pattern Extraction System - Implementation Summary` | (blank) | 0 | — |
| FEAT-003-PATTERN-EXTRACTION-COMPLETE.md | 3.9 | 2026-03-30 19:37:57 -0400 | `# FEAT-003: Virality Fingerprint Generator - COMPLETE ✅` | (blank) | 0 | — |
| FEAT-003-QUICKSTART.md | 9.0 | 2026-03-30 19:37:57 -0400 | `# FEAT-003: Pattern Extraction System - Quick Start Guide` | (blank) | 0 | — |
| FEAT-007-DEPLOYMENT-CHECKLIST.md | 11.4 | 2026-03-30 19:37:57 -0400 | `# FEAT-007: Pre-Content Prediction - Deployment Checklist` | (blank) | 0 | — |
| FEAT-007-IMPLEMENTATION-SUMMARY.md | 10.3 | 2026-03-30 19:37:57 -0400 | `# FEAT-007: Script/Storyboard Analyzer (Pre-Content Prediction) - Implementation Summary` | (blank) | 0 | — |
| FEAT-007-QUICKSTART.md | 5.7 | 2026-03-30 19:37:57 -0400 | `# FEAT-007: Pre-Content Prediction - Quick Start Guide` | (blank) | 0 | — |
| FEAT-060-IMPLEMENTATION-SUMMARY.md | 9.2 | 2026-03-30 19:37:57 -0400 | `# FEAT-060: GPT Knowledge Extraction Pipeline [PATENT-009]` | (blank) | 0 | — |
| FEAT-060-QUICKSTART.md | 5.8 | 2026-03-30 19:37:57 -0400 | `# FEAT-060 Quick Start Guide` | (blank) | 0 | — |
| FEAT-070-VALIDATION-READY.md | 4.8 | 2026-03-30 19:37:57 -0400 | `# FEAT-070 QUICK VALIDATION - READY TO EXECUTE` | (blank) | 0 | — |
| FEAT-070-VALIDATION-REPORT.md | 7.8 | 2026-03-30 19:37:57 -0400 | `# FEAT-070: Pre-Content Viral Prediction - Validation Report` | (blank) | 0 | — |
| FEATURE_EXTRACTION_COMPLETE.md | 10.0 | 2026-03-30 19:37:57 -0400 | `# Feature Extraction Complete - Summary Report` | (blank) | 0 | — |
| FEATURE_EXTRACTION_VERIFICATION.md | 22.5 | 2026-03-30 19:37:57 -0400 | `# Feature Extraction Pipeline - Visual Verification` | (blank) | 0 | — (VERIFICATION not at start) |
| FEATURE_SCORECARD.md | 1.8 | 2026-03-30 19:37:57 -0400 | `# Feature Scorecard` | (blank) | 0 | — |
| FFMPEG-INTEGRATION-TEST-RESULTS.md | 7.3 | 2026-03-30 19:37:57 -0400 | `# FFmpeg Integration Test Results` | (blank) | 0 | — |
| FRAMEWORKS_1_AND_2_COMPLETE.md | 22.4 | 2026-03-30 19:37:57 -0400 | `# Frameworks 1 & 2 Complete - Viral Prediction & Validation System` | (blank) | 0 | — |
| FRAMEWORKS_DEPLOYMENT_SUCCESS.md | 6.3 | 2026-03-30 19:37:57 -0400 | `# ✅ Frameworks 1 & 2 - Deployment Success` | (blank) | 0 | — |
| GEMINI_3_INTEGRATION_COMPLETE.md | 12.0 | 2026-03-30 19:37:57 -0400 | `# ✅ GEMINI 3.0 PRO INTEGRATION COMPLETE` | (blank) | 0 | — |
| GPT context video explaining GPTs 10-7-25.md | 5.0 | 2026-03-30 19:37:57 -0400 | `This stuff is truly hot off the presses.` | (blank) | 0 | — |
| HOW_TO.md | 0.7 | 2026-03-30 19:37:57 -0400 | `## Feature Flags: Setup Guide` | (blank) | 0 | — |
| HYBRID_PIPELINE_COMPLETE.md | 15.3 | 2026-03-30 19:37:57 -0400 | `# ✅ Hybrid XGBoost → GPT-4 Pipeline - COMPLETE` | (blank) | 0 | — |
| HYBRID_PIPELINE_READY.md | 10.2 | 2026-03-30 19:37:57 -0400 | `# 🎯 Hybrid XGBoost → GPT-4 Pipeline - Ready to Train` | (blank) | 0 | — |
| Innovation_1_Autonomous_Framework_Evolution_System.md | 7.1 | 2026-03-30 19:37:57 -0400 | `# INNOVATION #1: AUTONOMOUS FRAMEWORK EVOLUTION SYSTEM` | `## Patent Licensing Opportunity` | 0 | — |
| Innovation_2_Multi_Algorithm_Orchestration_Engine.md | 9.7 | 2026-03-30 19:37:57 -0400 | `# INNOVATION #2: MULTI-ALGORITHM ORCHESTRATION ENGINE` | `## Patent Licensing Opportunity` | 0 | — |
| Innovation_3_Script_Singularity_System.md | 10.3 | 2026-03-30 19:37:57 -0400 | `# INNOVATION #3: SCRIPT SINGULARITY SYSTEM` | `## Patent Licensing Opportunity` | 0 | — |
| Innovation_4_Viral_DNA_Sequencing_Engine.md | 10.8 | 2026-03-30 19:37:57 -0400 | `# INNOVATION #4: VIRAL DNA SEQUENCING ENGINE` | `## Patent Licensing Opportunity` | 0 | — |
| Innovation_5_God_Mode_Psychological_Analyzer.md | 11.9 | 2026-03-30 19:37:57 -0400 | `# INNOVATION #5: GOD MODE PSYCHOLOGICAL ANALYZER` | `## Patent Licensing Opportunity` | 0 | — |
| Innovation_6_Cultural_Timing_Intelligence_System.md | 11.9 | 2026-03-30 19:37:57 -0400 | `# INNOVATION #6: CULTURAL TIMING INTELLIGENCE SYSTEM` | `## Patent Licensing Opportunity` | 0 | — |
| Innovation_7_Dynamic_Percentile_System.md | 12.1 | 2026-03-30 19:37:57 -0400 | `# INNOVATION #7: DYNAMIC PERCENTILE SYSTEM` | `## Patent Licensing Opportunity` | 0 | — |
| Innovation_8_Inception_Mode_System.md | 13.6 | 2026-03-30 19:37:57 -0400 | `# INNOVATION #8: INCEPTION MODE SYSTEM` | `## Patent Licensing Opportunity` | 0 | — |
| KAI_FEATURE_EXPANSION_PLAN.md | 6.3 | 2026-03-30 19:37:57 -0400 | `# Kai Feature Expansion Plan` | (blank) | 0 | — |
| LICENSING_PORTFOLIO_INDEX.md | 9.6 | 2026-03-30 19:37:57 -0400 | `# LICENSING PORTFOLIO INDEX` | `## CleanCopy Technologies - Patent Licensing Materials` | 0 | — |
| LIVE_REUSE_MAP.md | 2.7 | 2026-03-30 19:37:57 -0400 | `# LIVE REUSE MAP — Starter Pack Path (LIVE)` | (blank) | 0 | — |
| LOVABLE_DEV_PROMPT_V1.md | 19.3 | 2026-03-30 19:37:57 -0400 | `# Lovable.dev Build Prompt - TikTok Viral Prediction System` | (blank) | 0 | — |
| LOVABLE_DEV_PROMPT_V1_GENERIC.md | 19.4 | 2026-03-30 19:37:57 -0400 | `# Lovable.dev Build Prompt - Social Media Content Analysis Platform` | (blank) | 0 | — |
| MARKETPLACE_FOUNDATION_COMPLETE.md | 15.9 | 2026-03-30 19:37:57 -0400 | `# ✅ MARKETPLACE FOUNDATION COMPLETE (DAYS 5-6)` | (blank) | 0 | — |
| MASTER_AGENT_IMPLEMENTATION_SUMMARY.md | 8.8 | 2026-03-30 19:37:57 -0400 | `# Master Agent System Implementation Summary` | (blank) | 0 | — |
| MASTER_ALGORITHM_DOCUMENTATION.md | 19.7 | 2026-03-30 19:37:57 -0400 | `# Kai Viral Prediction Algorithm - Master Documentation` | (blank) | 0 | — |
| methodology pack.md | 17.9 | 2026-03-30 19:37:57 -0400 | `Initial prompt…` | `"Now I understand that this training is referencing a software called Code Spring..."` | 0 | — |
| MODEL_TRAINING_SUCCESS.md | 10.0 | 2026-03-30 19:37:57 -0400 | `# 🎉 XGBoost Model Training - EXCEPTIONAL RESULTS` | (blank) | 0 | — |
| new viral frameworks 8-8-25.md | 108.3 | 2026-03-30 19:37:57 -0400 | `Social Media Growth Framework Compendium (v2.0)` | `Complete 61 Framework Collection with Dynamic Percentile System` | 0 | — |
| NEXT_STEPS_EXPAND_DATASET.md | 22.8 | 2026-03-30 19:37:57 -0400 | `# 📋 Next Steps: Expand Dataset from 116 to 600+ Videos` | (blank) | 0 | — |
| OPERATIONS.md | 1.0 | 2026-03-30 19:37:57 -0400 | `# OPERATIONS (Quick Win TikTok v1)` | (blank) | 0 | — |
| OPTIMIZATION_LOOP_COMPLETE.md | 12.5 | 2026-03-30 19:37:57 -0400 | `# ✅ OPTIMIZATION LOOP COMPLETE (PROMPT 3C)` | (blank) | 0 | — |
| PATENTABLE_ALGORITHM_COMPLETE.md | 13.5 | 2026-03-30 19:37:57 -0400 | `# Patentable Viral Prediction Algorithm - COMPLETE` | (blank) | 0 | — |
| PATENT_DOCUMENTATION_Framework_Evolution_System.md | 19.6 | 2026-03-30 19:37:57 -0400 | `# PATENT DOCUMENTATION: FRAMEWORK EVOLUTION SYSTEM AND MULTI-ALGORITHM ORCHESTRATION` | (blank) | 0 | — |
| PATTERN_ARCHITECTURE_ANALYSIS.md | 6.4 | 2026-03-30 19:37:57 -0400 | `# Comprehensive Pattern-Related Architecture Analysis` | (blank) | 0 | — |
| PIPELINE_VERIFIED_WORKING.md | 13.1 | 2026-03-30 19:37:57 -0400 | `# ✅ HYBRID PREDICTION PIPELINE - VERIFIED WORKING` | (blank) | 0 | — |
| preservation_checklist.md | 3.5 | 2026-03-30 19:37:57 -0400 | `# 🛡️ PRESERVATION CHECKLIST - COMPLETE` | (blank) | 0 | — |
| Product Requirements Document- Trendzo Viral Prediction Platform.md | 11.9 | 2026-03-30 19:37:57 -0400 | `# Product Requirements Document: Trendzo Viral Prediction Platform` | (blank) | 0 | — |
| quick win workflow v1.md | 60.0 | 2026-03-30 19:37:57 -0400 | `<!DOCTYPE html>` | `<html lang="en">` | 0 | — (HTML inside .md) |
| QUICK_START_EXTRACTION.md | 5.2 | 2026-03-30 19:37:57 -0400 | `# Quick Start: Enhanced Pattern Extraction` | (blank) | 0 | — |
| QUICK_START_GUIDE.md | 12.4 | 2026-03-30 19:37:57 -0400 | `# 🚀 Quick Start Guide - Viral Prediction System` | (blank) | 0 | — |
| REAL_DATA_API_BACKUP.md | 1.8 | 2026-03-30 19:37:57 -0400 | `# Real Data API Implementations Backup` | (blank) | 0 | — |
| RESTORE.md | 0.6 | 2026-03-30 19:37:57 -0400 | `# Disaster Recovery Restore` | (blank) | 0 | — |
| SANDBOX_INTEGRATION_SUMMARY.md | 9.1 | 2026-03-30 19:37:57 -0400 | `# 🎯 TRENDZO SANDBOX INTEGRATION COMPLETE` | (blank) | 0 | — |
| SANDBOX_REUSE_MAP.md | 4.6 | 2026-03-30 19:37:57 -0400 | `## Sandbox Reuse Map` | (blank) | 0 | — |
| SCRAPING_COMMAND_CENTER_COMPLETE.md | 10.6 | 2026-03-30 19:37:57 -0400 | `# 🔍 Scraping Command Center - Complete` | (blank) | 0 | — |
| SCRAPING_COMPLETE_FULL_IMPLEMENTATION.md | 25.1 | 2026-03-30 19:37:57 -0400 | `# Scraping Command Center - Full Implementation Complete` | (blank) | 0 | — |
| SCRIPT_GENERATION_COMPLETE.md | 7.6 | 2026-03-30 19:37:57 -0400 | `# 🎬 Script Generation Complete - Day 3A` | (blank) | 0 | — |
| SNAPSHOT-SUMMARY-2025-01-11.md | 9.6 | 2026-03-30 19:37:57 -0400 | `# 🎉 COMPLETE CODEBASE SNAPSHOT - January 11, 2025` | (blank) | 0 | — (date matches `2025-`, not `2026-`) |
| SUBSTRATE_FRAMEWORK.md | 3.5 | 2026-03-30 19:37:57 -0400 | `# Trendzo Substrate Framework` | (blank) | 0 | — |
| SUPABASE_DATABASE_AUDIT_REPORT.md | 7.4 | 2026-03-30 19:37:57 -0400 | `# Supabase Database Audit Report` | (blank) | 0 | — |
| SYSTEM-HEALTH-REPORT-2025-10-08.md | 20.0 | 2026-03-30 19:37:57 -0400 | `# COMPREHENSIVE SYSTEM HEALTH CHECK REPORT` | `**Date**: October 8, 2025` | 0 | — (date matches `2025-`, not `2026-`) |
| SYSTEM-STATUS-REPORT.md | 11.8 | 2026-03-30 19:37:57 -0400 | `# Trendzo System Status Report` | `**Generated:** 2025-10-03` | 0 | — |
| TIER_PREDICTION_IMPLEMENTATION_SUMMARY.md | 10.7 | 2026-03-30 19:37:57 -0400 | `# Tier-Based Prediction System - Implementation Summary` | (blank) | 0 | — |
| TIER_PREDICTION_MIGRATION_GUIDE.md | 6.9 | 2026-03-30 19:37:57 -0400 | `# Tier-Based Prediction System Migration Guide` | (blank) | 0 | — |
| TIER_PREDICTION_QUICK_REFERENCE.md | 3.1 | 2026-03-30 19:37:57 -0400 | `# Tier-Based Prediction System - Quick Reference` | (blank) | 0 | — |
| TRAINING_COMPLETE_116_VIDEOS.md | 14.0 | 2026-03-30 19:37:57 -0400 | `# ✅ XGBoost Training Complete - 116 Videos` | (blank) | 0 | — |
| TRANSCRIPT_EXTRACTION_SUCCESS.md | 4.4 | 2026-03-30 19:37:57 -0400 | `# Transcript Extraction - FREE Solution SUCCESS!` | (blank) | 0 | — |
| TRANSCRIPT_PIPELINE_GUIDE.md | 3.0 | 2026-03-30 19:37:57 -0400 | `# TikTok Transcript Pipeline - User Guide` | (blank) | 0 | — |
| Trendzo Development Plan - 14-Day Sprint to Launch.md | 10.1 | 2026-03-30 19:37:57 -0400 | `# Trendzo Development Plan - 14-Day Sprint to Launch` | (blank) | 0 | — |
| Trendzo Viral Prediction Platform - Master Implementation Prompt.md | 8.4 | 2026-03-30 19:37:57 -0400 | `# Trendzo Viral Prediction Platform - Master Implementation Prompt` | (blank) | 0 | — |
| unicorn-workflow-ui-prompt.md | 9.0 | 2026-03-30 19:37:57 -0400 | `# 🦄 UNICORN WORKFLOW UI RENDERING PROMPT` | `*Using BMAD Methodology for Comprehensive UI Design*` | 0 | — |
| UNIVERSAL_REASONING_ARCHITECTURE.md | 54.0 | 2026-03-30 19:37:57 -0400 | `# Universal Reasoning System Architecture` | (blank) | 0 | — |
| VIDEO_GENERATION_COMPLETE.md | 10.8 | 2026-03-30 19:37:57 -0400 | `# 🎬 AI Video Generation Complete - Day 3B` | (blank) | 0 | — |
| viral-prediction-api-analysis.md | 6.7 | 2026-03-30 19:37:57 -0400 | `# Viral Prediction API Endpoints Analysis` | (blank) | 0 | — |
| VIRAL-RESEARCH-SYSTEM-COMPLETE.md | 12.3 | 2026-03-30 19:37:57 -0400 | `# ✅ Viral Research System - COMPLETE` | (blank) | 0 | — |

**Count: 110**

---

## Totals

| | Count |
|---|------:|
| **Total .md files at repo root** | **163** |
| Section A — Likely keepers | 11 |
| Section B — Likely session artifacts | 42 |
| Section C — Ambiguous | 110 |

(11 + 42 + 110 = 163 ✓)

---

## Read-only observations (things that surprised me)

1. **No `README.md`, `LICENSE.md`, `CONTRIBUTING.md`, `AGENTS.md`, or `ARCHITECTURE.md` exists at the repo root.** The closest canonical files present are `CLAUDE.md` (project operating system, 4 refs) and `THIRD_PARTY_NOTICES.md` (legal). For a Next.js project this scale, the absence of a top-level README is unusual but not necessarily wrong — `CLAUDE.md` may be filling that role.
2. **Reference rate is extremely low: 9 of 163 root .md files are referenced anywhere in `src/`, `scripts/`, `tests/`, `config/`, or `package.json`.** Even highly-named docs like `MASTER_ALGORITHM_DOCUMENTATION.md`, `INTELLIGENT_CLAY_SPEC.md`, `Product Requirements Document...md`, and the entire `Innovation_1..8_*.md` series have 0 code-side references. Either the link discovery is missing references in non-code surfaces (other markdown files, docs sites) or these documents are not actively linked from the application.
3. **42 of the 163 files (26%) match the user's session-artifact patterns.** Within those, the `_2026-*` date stamp captures most: 30+ dated investigation/verification/audit/decision/inventory reports concentrated in April–May 2026. The `vercel-deploy-test` branch appears to have absorbed a heavy investigation cycle.
4. **Currently uncommitted .md files at root: 19.** All 19 are dated `2026-04-30` through `2026-05-04` reports (PHASE1_*, OB_2_*, INVESTIGATION_REPORT, PARALLEL_DASHBOARD_INVENTORY, BUILD_TIMEOUT_INVESTIGATION, JSON_RENDER_INVESTIGATION, CODEBASE_INVENTORY, CONSUMER_DASHBOARD_INVENTORY, ADMIN_INVENTORY, ADMIN_ROUTE_AUDIT, VERIFICATION_REPORT, PREDICTOR_INVENTORY). Including the one I just generated for the prior task — that one is in this list (`PREDICTOR_INVENTORY_2026-05-04.md`, 60.4 KB).
5. **One `.md` file is actually HTML.** `quick win workflow v1.md` (60 KB) starts with `<!DOCTYPE html>` and `<html lang="en">`. Whatever it contains, it's not markdown.
6. **`AI_EMPLOYEE_5_PROJECT_MANAGER_v2_.md` is 145 KB** — the largest single .md file at the root by far. The trailing underscore in the filename (before `.md`) is unusual and may have been an accidental keystroke. The next-largest are `AI_EMPLOYEE_4_PERFORMANCE_ANALYST_v2.md` (113 KB) and `new viral frameworks 8-8-25.md` (108 KB).
7. **All five `AI_EMPLOYEE_*_v2.md` files share identical first two lines** (`TRENDZO — AI EMPLOYEE ARCHITECTURE (v2)` / `Substrate-First Build Blueprint`) — the title doesn't distinguish them; the actual filename does (employee 1–5 + role).
8. **`SUBSTRATE_AUDIT_2026-04-21.md`** (59 KB, the only `*_2026-*` audit with a code reference) lines up exactly with MEMORY.md's "ACTIVE COMMITMENTS" entry that calls it ground truth ("SUBSTRATE_AUDIT_2026-04-21.md at project root is ground truth"). Worth preserving — its single reference confirms it's still wired into something.
9. **The `Innovation_1..8_*.md` series (8 files, ~88 KB total) are explicitly framed as "Patent Licensing Opportunity"** in their second lines. These look like business/IP artifacts rather than engineering docs. None are referenced from code.
10. **Two files appear to be near-duplicates by intent**: `LOVABLE_DEV_PROMPT_V1.md` (TikTok-specific) vs. `LOVABLE_DEV_PROMPT_V1_GENERIC.md` (generic social-media variant) — same size category (19.3 vs 19.4 KB), same purpose (build prompt for Lovable.dev), one specialized and one generalized.
11. **Several files have `_2026-*` in the name but a date inside the file from 2025** (e.g., `SNAPSHOT-SUMMARY-2025-01-11.md`, `SYSTEM-HEALTH-REPORT-2025-10-08.md`). These don't match the `*_2026-*` pattern (the year token is 2025, not 2026), so they correctly land in Section C even though they look date-stamped. Same idea: `baseline_report.md` is internally dated `2025-01-15`.
12. **`HOW_TO.md` is 0.7 KB and contains only "Feature Flags: Setup Guide"** — the title undersells the filename. May be an unfinished doc.
13. **The git history shows two large commit dates for these files**: `2026-03-30` and `2026-04-29` — most files at root were last touched on one of those two days, suggesting bulk imports/syncs rather than incremental editing.

— end of inventory —
