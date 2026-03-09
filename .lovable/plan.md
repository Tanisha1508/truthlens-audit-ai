

## Fix: Load PDF.js Library

### Problem
`index.html` has no `<script>` tag for PDF.js. The code in `Index.tsx` checks `window.pdfjsLib`, finds it undefined, throws an error, and shows the "Could not read this PDF" message.

### Solution
Add the PDF.js CDN script to `index.html` before the main app script:

**File: `index.html`** — Add before `<script type="module" src="/src/main.tsx">`:
```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
```

This matches the worker URL already configured in the code (`pdf.js/3.11.174/pdf.worker.min.js`).

One line change. Nothing else needed.

