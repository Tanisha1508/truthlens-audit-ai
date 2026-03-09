

## Three Changes

### 1. Edge Function: Add Gemini fallback (commented out) + fix current issue

The previous Gemini API key code was removed. I'll add it back as a commented-out alternative at the top of the function, clearly labeled so you can switch back if needed.

The Lovable AI Gateway is included with Lovable Cloud usage — no separate API key needed. It uses usage-based pricing tied to your Lovable plan.

### 2. Highlighted Analysis: Fix matching logic

The current highlighting fails because the AI returns **summarized/rephrased claims**, not exact substrings from the input. The `indexOf` lookup finds nothing, so no highlights appear.

**Fix:** Update the system prompt to instruct the AI to return `claimSnippet` (the exact substring from the input text) alongside `text` (the analysis). Then highlight using `claimSnippet` for matching.

**File: `supabase/functions/analyze-claims/index.ts`**
- Update system prompt: tell AI to extract exact verbatim quotes from the input as `claimSnippet`
- Add `claimSnippet` to the tool schema

**File: `src/pages/Index.tsx`**
- Update `Claim` type to include optional `claimSnippet`
- Use `claim.claimSnippet || claim.text` for the `indexOf` matching
- Use fuzzy/partial matching as fallback (search for first 40 chars if full match fails)

### 3. Add Color Legend

**File: `src/pages/Index.tsx`**
- Add a legend bar above the highlighted text showing the three colors:
  - Green (#16A34A) = Verified
  - Amber (#D97706) = Uncertain  
  - Red (#DC2626) = Hallucinated

### Summary of file changes

| File | Change |
|------|--------|
| `supabase/functions/analyze-claims/index.ts` | Add commented Gemini code block, add `claimSnippet` to prompt + schema |
| `src/pages/Index.tsx` | Fix highlight matching with `claimSnippet`, add color legend |

