---
canonicalId: dept-opti-content-model
name: "Content Model Design for Optimizely"
description: "Design a CMS-agnostic content model from source content inventory, then validate against target Optimizely platform (CMS 12 or SaaS CMS) architectural patterns. Produces type definitions, attributes, relationships, and validation rules."
domain: optimizely
category: analysis
---

# Content Model Design for Optimizely

**Entry Point**: `dept-opti-content-model`

This skill designs a CMS-agnostic content model from source content inventory, then validates it against your target Optimizely platform (CMS 12 or SaaS CMS) architectural patterns.

## What This Skill Does

Transforms raw content types into a structured, reusable content model by:
- Accepting input from multiple sources (URLs, exports, screenshots, documents)
- Classifying content types vs UI patterns
- Defining attributes and relationships
- Validating against target platform constraints
- Producing a model ready for technical implementation

## When To Use It

After source audit completes, use this skill to move from "what exists" to "how it should be structured on Optimizely".

## Inputs

- Source content (URLs, CMS exports, PDFs, screenshots, documents)
- Source audit report (content inventory and types)
- Target platform preference (CMS 12 PaaS or SaaS CMS)

## Outputs

- CMS-Agnostic Content Model (markdown)
- Content Type Definitions (attributes, relationships, validation rules)
- Platform-Specific Validation (CMS 12: PageData/BlockData patterns OR SaaS CMS: Experiences/Sections)
- Mapping from Source to Target Types
- Open Questions & Decisions Document

## Process

The skill delegates to `workflow.md` which guides you through two steps:

1. **Initialize** - Accept input sources, parse content, understand target platform
2. **Classify** - Apply four-question test, separate types from UI patterns, design attributes

Total time: 4-6 hours depending on content complexity

## Success Criteria

✓ Content model complete with all types defined
✓ Attributes specified for each type with validation rules
✓ Relationships mapped (references, collections, hierarchies)
✓ Validated against target platform patterns
✓ Open questions documented and gated
✓ Model reviewed and approved by stakeholders
