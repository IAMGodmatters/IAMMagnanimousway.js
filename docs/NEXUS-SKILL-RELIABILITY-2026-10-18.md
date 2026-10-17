# Nexus skill reliability research — 2026-10-18

## Source studied

- https://github.com/prathyushnallamothu/nexus — MIT licensed
- https://github.com/prathyushnallamothu/nexus/blob/master/docs/user-guide/skills.md

The public Nexus skill design describes a trajectory-driven learning lifecycle in which repeatable workflows can become skills, failures can inform later revisions, and Wilson score confidence is used to avoid trusting a skill solely because its raw success percentage looks high on a small sample.

## Why this matters to Magnanimous

Magnanimous already had a stronger safety starting point from the Judgment Core:

- workflows become **candidate** skills rather than silently activating themselves
- promotion already requires schema validation, permission review, regression success, reversibility and provenance
- Magnanimous AI remains the final decision owner
- hidden chain-of-thought is not required or stored
- billing, tenant, consequence and provider-policy gates remain authoritative

The missing piece was a statistical reliability layer for repeated skill outcomes.

## Magnanimous-native improvement implemented

`worker/src/magnanimous-judgment-core.js` now adds:

- `wilsonScoreInterval(successes,total,z)` for a conservative binomial confidence interval
- `evaluateMagnanimousSkillReliability(...)` for separate shadow-test and observed-use evidence
- minimum sample requirements before trust can be recommended
- `candidate`, `shadow`, `supervised`, `trusted-ready`, and `retirement-review` recommendations
- explicit remaining requirements when a skill is not yet ready
- `auto_activate:false` and `auto_retire:false`
- Magnanimous AI remains the final decision owner

The policy is intentionally stricter than simply copying an auto-learning system. Strong statistics cannot override missing permission review, failed regression tests, irreversibility, missing provenance, billing controls, tenant boundaries or consequential-action gates.

## Default evidence thresholds

Defaults are deliberately conservative and configurable:

- at least 10 shadow evaluations
- shadow Wilson lower bound at least 0.60
- at least 20 observed/supervised uses
- observed Wilson lower bound at least 0.70
- poor observed performance with sufficient samples can trigger `retirement-review`, never automatic deletion or retirement

A perfect 5/5 result therefore cannot immediately become trusted merely because its raw success rate is 100%. The lower confidence bound remains conservative until there is enough evidence.

## Better-than-equal behavior

Magnanimous combines the useful statistical idea with controls the public Nexus skill lifecycle does not make authoritative for this platform:

1. statistical evidence **plus** permission review
2. statistical evidence **plus** regression tests
3. statistical evidence **plus** reversibility
4. statistical evidence **plus** provenance
5. no automatic activation
6. no automatic retirement/deletion
7. no bypass of tenant, billing or consequential-action controls
8. final decision ownership remains with Magnanimous AI

## Regression proof

`qa/scripts/magnanimous-judgment-core-lock.mjs` now proves:

- Wilson intervals remain conservative
- zero observations produce no false confidence
- high-quality shadow + observed evidence can reach `trusted-ready`
- high shadow confidence with too little observed evidence remains supervised
- missing permission review blocks trust even with excellent statistics
- sustained poor observed results trigger only `retirement-review`
- the system never auto-activates or auto-retires a learned skill

No Nexus runtime or provider was added. No proprietary code, prompt, credentials or private data were copied.
