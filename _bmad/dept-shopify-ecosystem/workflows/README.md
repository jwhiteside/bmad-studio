# Shopify Ecosystem BMAD Workflows

Complete set of 10 workflow definitions for the `dept-shopify-ecosystem` BMAD module, organized by implementation phase.

## Overview

This collection provides end-to-end workflow definitions covering the full lifecycle of Shopify ecosystem implementation, from initial assessment through go-live.

**Total Workflows**: 10
**Total Step Files**: 52
**Documentation**: Complete SKILL.md, bmad-skill-manifest.yaml, workflow.md, and detailed step specifications for all workflows.

---

## Phase 1: ANALYSIS (3 Workflows)

### 1. dept-shopify-ecosystem-assessment
**Path**: `1-analysis/dept-shopify-ecosystem-assessment/`

Comprehensive assessment of current or proposed Shopify ecosystem composition. Evaluates business profile, identifies anti-patterns, matches to ecosystem patterns, analyzes gaps, and produces recommendations.

**Steps** (6):
1. Business Context Gathering
2. Current Stack Documentation
3. Anti-Pattern Analysis
4. Pattern Matching
5. Gap Analysis
6. Recommendations & Report

**Entry Point**: `dept-shopify-ecosystem-assessment`

---

### 2. dept-shopify-pim-selection
**Path**: `1-analysis/dept-shopify-pim-selection/`

Structured decision guide for PIM platform selection. Uses complexity scoring to evaluate Akeneo, Bluestone, Inriver, and skip-PIM approaches.

**Steps** (5):
1. Product Context Gathering
2. PIM Complexity Scoring
3. Platform Evaluation
4. Integration Assessment
5. Selection & Recommendation

**Entry Point**: `dept-shopify-pim-selection`

---

### 3. dept-shopify-platform-audit
**Path**: `1-analysis/dept-shopify-platform-audit/`

Health assessment of existing Shopify ecosystem. Evaluates integration reliability, identifies anti-patterns, reviews costs, and produces optimization recommendations.

**Steps** (5):
1. Platform Inventory & Assessment
2. Integration Health Assessment
3. Anti-Pattern Analysis
4. Cost Review & Optimization
5. Audit Report & Recommendations

**Entry Point**: `dept-shopify-platform-audit`

---

## Phase 2: PLANNING (3 Workflows)

### 4. dept-shopify-stack-architecture
**Path**: `2-planning/dept-shopify-stack-architecture/`

Design technical architecture for Shopify ecosystem. Selects integration pattern, defines data ownership, maps data flows, creates architecture decision records.

**Steps** (6):
1. Review & Architecture Kickoff
2. Integration Pattern Selection
3. Data Architecture Design
4. Data Flow Mapping
5. Architecture Decision Records (ADRs)
6. Architecture Documentation

**Entry Point**: `dept-shopify-stack-architecture`

---

### 5. dept-shopify-integration-plan
**Path**: `2-planning/dept-shopify-integration-plan/`

Create phased implementation plan with sequencing, dependencies, and go/no-go checkpoints.

**Steps** (5):
1. Plan Kickoff & Review
2. Dependency Mapping
3. Sequencing & Phasing
4. Go/No-Go Checkpoints
5. Implementation Plan Document

**Entry Point**: `dept-shopify-integration-plan`

---

### 6. dept-shopify-cost-model
**Path**: `2-planning/dept-shopify-cost-model/`

Build detailed cost model for ecosystem implementation including licensing, implementation, and operational costs.

**Steps** (5):
1. Cost Model Kickoff
2. Platform Licensing Costs
3. Integration Implementation Costs
4. Ongoing Operational Costs
5. Cost Model & TCO Analysis

**Entry Point**: `dept-shopify-cost-model`

---

## Phase 3: SOLUTIONING (2 Workflows)

### 7. dept-shopify-integration-build
**Path**: `3-solutioning/dept-shopify-integration-build/`

Build and configure specific platform integrations with data mapping and testing.

**Steps** (5):
1. Integration Kickoff
2. Platform Configuration
3. Data Mapping
4. Integration Testing
5. Documentation

**Entry Point**: `dept-shopify-integration-build`

---

### 8. dept-shopify-data-flow-design
**Path**: `3-solutioning/dept-shopify-data-flow-design/`

Design detailed data flows for specific integration scenarios with transformation rules and error handling.

**Steps** (5):
1. Data Flow Analysis Kickoff
2. Source Data Analysis
3. Field Mapping & Transformation Design
4. Error Handling & Reconciliation Design
5. Data Flow Specification Document

**Entry Point**: `dept-shopify-data-flow-design`

---

## Phase 4: IMPLEMENTATION (2 Workflows)

### 9. dept-shopify-integration-validate
**Path**: `4-implementation/dept-shopify-integration-validate/`

Validate integrations are working correctly and data is flowing as designed.

**Steps** (5):
1. Validation Planning
2. Data Accuracy & Completeness Validation
3. Sync Timing & Reliability Validation
4. Error Handling & Recovery Validation
5. Validation Report

**Entry Point**: `dept-shopify-integration-validate`

---

### 10. dept-shopify-go-live
**Path**: `4-implementation/dept-shopify-go-live/`

Go/no-go assessment and go-live preparation for ecosystem launch.

**Steps** (5):
1. Go-Live Preparation
2. Go/No-Go Checklist
3. Cutover Planning
4. Rollback Strategy
5. Go-Live Plan & Final Sign-Off

**Entry Point**: `dept-shopify-go-live`

---

## File Structure

Each workflow contains:

```
workflow-name/
├── SKILL.md                    # Skill metadata and description
├── bmad-skill-manifest.yaml    # Manifest with inputs, outputs, success metrics
├── workflow.md                 # Workflow overview and step references
└── steps/
    ├── step-01-name.md
    ├── step-02-name.md
    ├── step-03-name.md
    ├── step-04-name.md
    └── step-05-name.md
```

### File Format Standards

**SKILL.md Pattern**:
- YAML frontmatter with canonicalId, name, description, domain, category
- Clear description of what the skill does
- When to use it
- Input and output specifications

**bmad-skill-manifest.yaml Pattern**:
- Metadata: name, id, type, version, description, category, tags
- Inputs with name, type, required, description
- Outputs with name, type, format, description
- Success metrics and failure modes
- Roles and permissions

**workflow.md Pattern**:
- Overview and prerequisites
- Ordered steps with references to step files
- Completion criteria

**Step Files (step-NN-name.md) Pattern**:
- Clear objective for the step
- Detailed instructions for implementation
- Inputs and outputs
- Completion criteria

---

## Usage

These workflows are designed to be used sequentially through the implementation lifecycle:

1. **Start with Analysis Phase** (Workflows 1-3) to assess current state, select platforms, and audit existing ecosystems
2. **Move to Planning Phase** (Workflows 4-6) to design architecture and plan implementation
3. **Execute Solutioning Phase** (Workflows 7-8) to build integrations and design data flows
4. **Complete with Implementation Phase** (Workflows 9-10) to validate and go live

Each workflow can also be used independently for specific tasks (e.g., use Workflow 2 for a standalone PIM selection decision).

---

## Key Features

- **Comprehensive**: Covers complete lifecycle from assessment through launch
- **Structured**: Clear phases, objectives, and completion criteria
- **Practical**: Detailed instructions suitable for implementation teams
- **Flexible**: Workflows can be used independently or sequentially
- **Scalable**: Patterns work for small to enterprise implementations

---

## Categories

All workflows are tagged with:
- **Domain**: shopify-ecosystem
- **Category**: analysis | planning | solutioning | implementation
- **Tags**: Specific topics like ecosystem, platform-selection, data-architecture, etc.

---

## Version

Created: 2026-04-02
Version: 1.0.0
Author: BMAD Shopify Ecosystem CoE

---

## Base Path

`/sessions/keen-sleepy-planck/mnt/Project - Agents - Shopify and Friends/_bmad/dept-shopify-ecosystem/workflows/`
