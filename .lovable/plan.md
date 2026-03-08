

## Final Polish Plan

### Files to modify

**`src/App.css`** — Remove all content (conflicting styles like `#root` padding, `.card`, etc.)

**`src/pages/Index.tsx`** — Four changes:

1. **Error banner state**: Add `apiError` state string. Show orange banner (`bg-orange-100 border-orange-400 text-orange-800`) below the Analyse button when set. Clear it on new analysis or Clear click.

2. **Error handling updates**:
   - `handleAnalyse`: on API failure, set `apiError` to "Audit failed. Check your API key and try again." instead of just toast
   - Empty input check already uses toast — update message to "Please paste text or upload a PDF first."
   - `processPdf`: add 5MB check at top (`if (f.size > 5 * 1024 * 1024)`) → set `setPdfError("This PDF is too large. Please try a smaller file.")`
   - `handleDrop` and `handleFileSelect`: add same 5MB guard before calling `processPdf`

3. **Clear button**: Add a "Clear" text button positioned top-right of the Tabs area (use a flex wrapper with `justify-between`). On click: `setText("")`, `clearPdf()`, `setShowResults(false)`, `setResult(null)`, `setApiError(null)`.

4. **Character count + truncation**:
   - Below textarea: show `<p>{text.length.toLocaleString()} / 4,000</p>`
   - If `text.length > 4000`: amber warning text "Long document — only the first 4,000 characters will be audited"
   - In `handleAnalyse`: `inputText = inputText.slice(0, 4000)` before sending

