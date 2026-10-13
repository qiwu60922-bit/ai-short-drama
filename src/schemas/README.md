# src/schemas

V11 permanent object schemas (ADR-0001).

Eleven objects (+ control plane):

1. project-manifest
2. story-bible
3. visual-bible
4. character-dna
5. scene-bible
6. prop-bible
7. episode-manifest
8. shot-spec
9. take-manifest
10. qc-report
11. repair-plan

Wave1: empty stubs only — no Zod persistence / no ShotSpec-QC DB yet.
Boundary: this package must not import `generators/factory`, `@fal-ai/*`, or vendor SDKs.
