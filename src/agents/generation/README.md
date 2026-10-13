# src/agents/generation — Wave6 Mock/Local Take pipeline

**Scope:** contract + **memory** TakeManifest / Take / SelectionHead CAS only.

## Hard constraints

- **No paid APIs** (`cn.ark.*`, `cn.kling.*`, `global.*` refused).
- **No real ComfyUI / network.**
- **No db push / Prisma dual-write** (`V11_DUAL_WRITE_TAKES` stays off).
- Generator keys: `local.mock.image` | `local.mock.video` only (ADR-0004 `local.mock.*`).
- **UNKNOWN attempts must not auto-retry** (same `providerRequestKey`).

## Entry

1. Caller runs generate preflight (continuity / previs) externally.
2. `createTakeManifest(...)` → memory store.
3. `startMockTakes({ ..., preflightOk: true, count: ≥2 })` — **fail-closed** if `preflightOk` is not `true`.
4. Optional `store.selectTake(...)` for Head CAS.

Flag `V11_MOCK_TAKE_PIPELINE` documents mock entry (default **false** / prod-safe). Tests call the API directly.

## Mapping

| Concept | V6 approx | Wave6 |
| --- | --- | --- |
| CandidateSet | candidate-service | TakeManifest |
| Candidate | — | Take |
| ProviderAttempt | provider-attempt | TakeAttemptRecord |
| Selection head | panel select | TakeSelectionHead CAS |

## Not in this wave

Comfy HTTP, cloud adapters, replacing `generators/factory`, Prisma migrate.
