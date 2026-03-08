

# Add Mock Results Panel

## Single file change: `src/pages/Index.tsx`

### 1. Add constants above component (before line 8)
- `MOCK_SCORE = 38`
- `MOCK_CLAIMS` array with the 4 claims (text, color, label)

### 2. Add state (after line 10)
- `const [showResults, setShowResults] = useState(false);`

### 3. Button onClick (line 158)
- Add `onClick={() => setShowResults(true)}`

### 4. Replace placeholder (lines 163-165)
When `showResults` is false: existing grey placeholder.

When true: a rounded card with `grid grid-cols-1 md:grid-cols-2 gap-6`:

**Left column — SVG gauge:**
- 120x120 SVG, radius ~52, stroke-width 8
- Gray background circle (`#E5E7EB`)
- Red arc: circumference = 2π×52 ≈ 327; dasharray = 327, dashoffset = 327 × (1 - 0.38) ≈ 203; rotate -90deg for top start
- Bold "38" centered, smaller "/100" below
- "High Risk" in red bold text beneath SVG

**Right column — Claim cards:**
- Map `MOCK_CLAIMS`, each rendered as a `rounded-lg border-l-4 bg-[#F9FAFB] p-4` with `borderLeftColor` set to claim color
- Claim text in charcoal, small badge with matching background color (10% opacity) and colored text showing the label

