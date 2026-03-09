# 🔍 TruthLens AI

**Audit any AI-generated content for factual accuracy — instantly.**

Live Demo → https://truthlens-audit-ai.lovable.app/

---

## What it does

Paste any AI-generated text or upload a PDF, and TruthLens AI:
- Extracts 3–5 factual claims from the content
- Verifies each claim using Gemini 2.0 Flash with live Google Search Grounding
- Returns a 0–100 trust score with a colour-coded verdict (Reliable / Uncertain / High Risk)
- Highlights exactly which sentences are supported, uncertain, or likely hallucinated

Works on output from any LLM — ChatGPT, Claude, Gemini, Copilot, or any other.

---

## Why I built it

AI hallucinations are a daily reality for millions of users who copy AI output 
directly into reports, emails, and decisions. No existing tool audits factual 
reliability of AI output in a model-agnostic way. TruthLens fills that gap.

Built as a PM portfolio project to demonstrate product discovery, AI prototyping, 
and end-to-end shipping using modern AI-native tooling.

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React + TypeScript + Tailwind CSS |
| AI + Fact Verification | Gemini 2.0 Flash API with Search Grounding |
| Edge Function | Supabase Edge Functions (Deno) |
| Deployment | Lovable |

---

## Run Locally
```bash
git clone https://github.com/Tanisha1508/truthlens-audit-ai.git
cd truthlens-audit-ai
npm install
npm run dev
```

Add `VITE_GEMINI_API_KEY` to your `.env` file:
```
VITE_GEMINI_API_KEY= <your_key_from_aistudio.google.com>
```

---

Built by Tanisha · PM Portfolio 2026
