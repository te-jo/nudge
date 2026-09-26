# ADR-000: Short title describing the decision

- **Date:** YYYY-MM-DD
- **Status:** Proposed | Accepted | Superseded by [ADR-00X](./00X-example.md) | Deprecated

## Context

What's the situation that forces a decision? Constraints, requirements, and
anything already tried. Describe the forces at play, not the answer — someone
reading this in six months should understand the problem without knowing how it
turned out.

## Decision

What we're doing, stated plainly and in the present tense ("We identify tags by
a token the app writes to NDEF data"). Name the alternatives that were
seriously considered and why they lost.

## Consequences

What becomes easier, what becomes harder, and what this commits us to. Include
the bad parts — an ADR that only lists upsides isn't recording a trade-off.
Note any follow-up work this creates.

---

### How to use this file

1. Copy to `NNN-short-title.md`, numbering sequentially (`001-`, `002-`, …).
2. Keep one decision per file, and keep it short — a screen or so.
3. Don't edit an accepted ADR to change its decision. Write a new one and mark
   the old one `Superseded by`, so the history of thinking stays readable.
4. Record decisions that were expensive to make or are expensive to reverse:
   data model shapes, protocols, dependencies, hosting. Not routine coding
   choices — those belong in [AGENTS.md](../../AGENTS.md).
