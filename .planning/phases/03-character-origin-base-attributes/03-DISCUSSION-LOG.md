# Phase 3: Character Origin & Base Attributes - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md - this log preserves the alternatives considered.

**Date:** 2026-03-30
**Phase:** 03-character-origin-base-attributes
**Areas discussed:** screen ownership, origin flow, starting attributes, restriction feedback, optional deity handling, abilities gating

---

## Screen ownership

| Option | Description | Selected |
|--------|-------------|----------|
| Identity in `Construccion`, stats in `Atributos` | Matches the routed shell already in place and keeps Phase 3 aligned with the current screen split. | ✓ |
| Keep most Phase 3 work in one Build screen | Concentrates origin and attributes in a single editor surface. | |
| Put everything under Build and leave `Atributos` secondary | Preserves the route but weakens its ownership. | |

**User's choice:** Identity in `Construccion`, stats in `Atributos`.
**Notes:** The user explicitly chose the option that fits the shell already created in Phase 2.

---

## Origin flow

| Option | Description | Selected |
|--------|-------------|----------|
| Stepped dependent flow | Race, subrace, alignment, and deity react to each other as the user advances. | ✓ |
| Flat selector set | Show all selectors together and validate after each change. | |
| Catalog-first chooser | Start from browseable lists or cards before filling the final state. | |

**User's choice:** Stepped dependent flow.
**Notes:** The user wanted incompatibilities to become clearer as choices narrow.

---

## Starting attributes interaction

| Option | Description | Selected |
|--------|-------------|----------|
| Cost or budget centered UI | Make spend and remaining budget visible while editing if that is the supported rule. | ✓ |
| Direct value entry with validation | Let users type or step values directly and only show resulting legality. | |
| Presets plus manual adjustment | Offer starting templates before fine-tuning. | |

**User's choice:** Cost or budget centered UI, if that is the supported rule.
**Notes:** The user wants the limits to be visible during entry rather than reconstructed afterward.

---

## Restriction feedback

| Option | Description | Selected |
|--------|-------------|----------|
| Inline only | Show incompatibilities only next to the field being edited. | |
| Centralized conflict panel | Collect origin and attribute problems in one dedicated area. | |
| Inline plus blocked global summary state | Show field-level reasons and also reflect blocked status in the persistent summary. | ✓ |

**User's choice:** Inline plus blocked global summary state.
**Notes:** The user does not want people hunting for errors in a separate review area.

---

## Optional deity handling

| Option | Description | Selected |
|--------|-------------|----------|
| Visible field with `Sin deidad` | Keep deity explicit even when the current origin does not require one. | ✓ |
| Hide until required | Do not show deity unless a rule forces it. | |
| Visible but disabled until required | Reserve the UI space but delay interaction. | |

**User's choice:** Visible field with `Sin deidad`.
**Notes:** This keeps the origin model explicit without implying a forced choice too early.

---

## Abilities gating

| Option | Description | Selected |
|--------|-------------|----------|
| Allow editing before origin is complete | Let users set stats first and reconcile dependencies later. | |
| Block `Atributos` until origin is sufficiently defined | Prevent stat editing until the required origin inputs are ready. | ✓ |
| Allow entry but hold the UI in a blocked explainer state | Let users open the page but not commit edits yet. | |

**User's choice:** Block `Atributos` until origin is sufficiently defined.
**Notes:** The user preferred a hard gate instead of partial editing or a soft-locked page.

---

## the agent's Discretion

- Exact rule for when the origin state is sufficiently complete to unlock `Atributos`.
- Exact structure of the stepped dependent UI within the existing shell.
- Exact presentation details for the cost or budget editor if the underlying rule differs from classic point-buy.

## Deferred Ideas

None - discussion stayed within phase scope.
