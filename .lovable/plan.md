

# TruthLens AI — Implementation Plan

## Overview
A single-page AI content auditing tool with a clean, professional design using navy (#1E3A5F) and teal (#2D9CDB) on a white background.

## Layout & Components

### Navbar
- Left: "TruthLens AI" in navy bold
- Right: Gray tagline text
- Clean, minimal header with subtle bottom border

### Main Content (centered, max-width 860px)

**Tab Switcher** — Two side-by-side tabs:
1. **Paste Text** (default) — Large textarea, 8 rows, with placeholder text
2. **Upload PDF** — Dashed border drag-and-drop zone with cloud upload icon and helper text

**AI Source Selector** — Row of pill toggle buttons (single-select): ChatGPT, Claude, Gemini, Copilot, Other

**Analyse Button** — Full-width or prominent teal "Analyse Now" button

### Results Placeholder
- Light gray rounded box with centered text: "Your audit will appear here"

## Design Details
- White background only, no dark mode
- Navy and teal color scheme applied to headings, buttons, and accents
- Clean typography, generous spacing
- Responsive layout that works on desktop and mobile

## Pages
- Single page (`Index.tsx`) containing all components
- No routing needed beyond the landing page

