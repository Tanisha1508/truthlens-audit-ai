

## Rate Limiter for Edge Function

### File: `supabase/functions/analyze-claims/index.ts`

**Add after `corsHeaders` (line 7), before `serve()`:**
- `rateLimitMap`, `RATE_LIMIT = 10`, `WINDOW_MS = 60_000` constants

**Add inside handler, after CORS check (after line 12), before `try`:**
1. Extract IP from `x-forwarded-for` header, fallback `"unknown"`
2. Prune expired entries from map
3. Get/create entry for IP
4. If `count >= RATE_LIMIT` → return 429 with `{ error: "Rate limit exceeded. Please try again shortly." }`
5. Increment count, continue

No other changes to the function.

