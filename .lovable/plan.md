

## Plan: Redesign Results UI in `src/pages/Index.tsx`

### Changes

**1. Remove Highlighted Analysis section** (lines 353-431) — delete entirely.

**2. Add Summary Verdict Bar** — inserted at the top of the `showResults && result` block (line 304), before the gauge/claims grid. Computes `hallucinatedCount` from `result.claims.filter(c => c.verdict === "Hallucinated").length`. Renders a full-width flex banner with dynamic background/border/text based on trust score thresholds.

**3. Replace claim chips** (lines 327-344) with Verdict Cards containing: claim text (charcoal, `font-medium`), colored verdict badge pill, and italic grey subtext mapped by verdict type.

**4. SVG gauge** — left column unchanged.

Single file edit: `src/pages/Index.tsx`.

