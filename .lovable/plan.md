

# PDF Text Extraction with pdf.js

## Approach

Load pdf.js from CDN via a `<script>` tag in `index.html`. In `Index.tsx`, add a helper function that uses `pdfjsLib` to extract text from all pages of a dropped/selected PDF. Manage loading, success, and error states with new state variables, and use controlled Tabs to auto-switch to "Paste Text" after extraction.

## Changes

### 1. `index.html`
Add the pdf.js CDN script and its worker:
```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
```
Set the worker source in the script or in the component.

### 2. `src/pages/Index.tsx`

**New state:**
- `activeTab` — controlled tab value (for auto-switching)
- `pdfLoading` — boolean for "Reading PDF..." indicator
- `pdfSuccess` — string like "PDF loaded — 5 pages extracted" (or `null`)
- `pdfError` — string error message (or `null`)

**PDF extraction logic:**
- Shared `processPdf(file)` function called from both `handleDrop` and `handleFileSelect`
- Uses `window.pdfjsLib.getDocument()` to load the file as an ArrayBuffer
- Iterates all pages, extracts text content, joins into a single string
- On success: sets `text`, switches `activeTab` to `"paste"`, shows green success banner
- On error (password-protected, corrupt): shows red error banner

**UI additions:**
- Convert `<Tabs defaultValue="paste">` to `<Tabs value={activeTab} onValueChange={setActiveTab}>`
- In the Upload tab: show a spinner/loader with "Reading PDF..." when `pdfLoading` is true
- Above or below the tabs: conditionally render a green success alert or red error alert
- Success and error banners auto-dismiss or persist until next action

### 3. `src/vite-env.d.ts`
Add type declaration for `window.pdfjsLib` to avoid TypeScript errors.

## User flow
1. User drops/selects PDF → "Reading PDF..." appears in the drop zone
2. Extraction completes → tab switches to "Paste Text", textarea filled, green banner shown
3. If PDF is unreadable → error message shown, user stays on Upload tab
4. User clicks "Analyse Now" as normal

