# Magnanimous Agent Skills compatibility

Date: 2026-10-16

## Source reviewed

- Official public repository: `anthropics/skills`
- Reviewed upstream commit: `dbd4588f9e1033efb41dad4bef2f7947c8993d44`
- Public format specification: `https://agentskills.io/specification`

Anthropic's repository describes Agent Skills as self-contained folders centered on `SKILL.md`, with metadata loaded first and detailed instructions/resources loaded only when needed. The repository contains a mixture of Apache-2.0 example skills and source-available document skills.

## What Magnanimous adopted

Magnanimous now has its own provider-neutral Agent Skills compatibility core:

- safe parsing of the common `SKILL.md` frontmatter fields;
- validation of name, description, compatibility and progressive-disclosure limits;
- metadata-first discovery;
- goal-to-skill resolution;
- optional loading of instructions only after a skill is selected;
- policy warnings for skill text that appears to request authorization or confirmation bypasses;
- Capability Mesh routes for summary, catalog, resolution and validation;
- regression checks that keep Magnanimous AI as the brain and Capability Mesh as the authorization owner.

The initial native skills are Magnanimous-owned operational instructions for capability orchestration, skill authoring, MCP integration, web-app verification, clean-room capability assimilation, and billing/cost protection.

## License and identity boundary

This integration does **not** copy Anthropic's proprietary Claude Code implementation.

It also does **not** import the `docx`, `pdf`, `pptx`, or `xlsx` skill families from `anthropics/skills`, because Anthropic describes those as source-available rather than open source.

Where public Apache-2.0 examples informed the architecture, Magnanimous uses independent platform-specific instructions and keeps the upstream source/commit recorded for provenance. Any future verbatim Apache-2.0 imports must preserve the applicable copyright, license and notice obligations.

External providers remain replaceable tools. Magnanimous AI remains the identity, memory, reasoning, orchestration, learning, verification and policy layer.

## Runtime routes

The Capability Mesh exposes:

- `skills.summary` — native implementation status and startup metadata;
- `skills.catalog` — searchable metadata-first skill list;
- `skills.resolve` — rank relevant skills for a user goal and optionally disclose instructions;
- `skills.validate` — validate supplied `SKILL.md` content before it is accepted by future authoring/import workflows.

These routes are read/validation surfaces. Skill selection does not create a second execution authority and cannot bypass existing authentication, consent, billing, legal, authorization or confirmation gates.

## Verification

`qa/scripts/magnanimous-agent-skills-lock.mjs` checks:

- Magnanimous AI ownership invariants;
- Anthropic provenance and excluded source-available families;
- valid and invalid `SKILL.md` parsing behavior;
- goal-based skill resolution;
- Capability Mesh route wiring;
- the explicit no-proprietary-Claude-Code boundary.
