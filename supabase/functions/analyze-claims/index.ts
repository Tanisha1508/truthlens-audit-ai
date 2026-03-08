import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 10;
const WINDOW_MS = 60_000;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Rate limiting
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const now = Date.now();

  // Prune expired entries
  for (const [key, val] of rateLimitMap) {
    if (val.resetAt < now) rateLimitMap.delete(key);
  }

  const entry = rateLimitMap.get(ip) || { count: 0, resetAt: now + WINDOW_MS };
  if (!rateLimitMap.has(ip)) rateLimitMap.set(ip, entry);

  if (entry.count >= RATE_LIMIT) {
    return new Response(
      JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }),
      { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
  entry.count++;

  try {
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      return new Response(
        JSON.stringify({ error: "GEMINI_API_KEY is not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { inputText } = await req.json();
    if (!inputText || typeof inputText !== "string") {
      return new Response(
        JSON.stringify({ error: "inputText is required and must be a string" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const systemPrompt = `You are a fact-checking AI. Analyze the following text and extract 3-5 factual claims from it. For each claim, verify it using Google Search grounding.

Return a JSON object with this exact structure:
{
  "trustScore": <number 0-100, where 100 is fully trustworthy>,
  "verdict": "<one of: Reliable, Uncertain, High Risk>",
  "claims": [
    {
      "text": "<the claim text>",
      "verdict": "<one of: Verified, Uncertain, Hallucinated>",
      "color": "<#16A34A for Verified, #D97706 for Uncertain, #DC2626 for Hallucinated>"
    }
  ]
}

Rules:
- trustScore should reflect the overall reliability of all claims combined
- verdict: "Reliable" if trustScore >= 70, "Uncertain" if 40-69, "High Risk" if < 40
- Each claim's color must match its verdict exactly
- Return ONLY the JSON object, no markdown, no code fences, no extra text`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

    const geminiResponse = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: `${systemPrompt}\n\nText to analyze:\n${inputText}` }],
          },
        ],
        tools: [{ google_search: {} }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 2048,
        },
      }),
    });

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error("Gemini API error:", geminiResponse.status, errorText);
      return new Response(
        JSON.stringify({ error: `Gemini API error [${geminiResponse.status}]: ${errorText}` }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const geminiData = await geminiResponse.json();
    console.log("Gemini raw response:", JSON.stringify(geminiData));

    // Extract text from Gemini response
    const parts = geminiData?.candidates?.[0]?.content?.parts;
    if (!parts || parts.length === 0) {
      return new Response(
        JSON.stringify({ error: "No response from Gemini" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Find the text part (skip function call parts)
    const textPart = parts.find((p: any) => p.text);
    if (!textPart) {
      return new Response(
        JSON.stringify({ error: "No text in Gemini response" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Clean and parse JSON from response
    let jsonStr = textPart.text.trim();
    // Remove markdown code fences if present
    jsonStr = jsonStr.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "");

    let result;
    try {
      result = JSON.parse(jsonStr);
    } catch {
      console.error("Failed to parse Gemini JSON:", jsonStr);
      return new Response(
        JSON.stringify({ error: "Failed to parse Gemini response as JSON", raw: jsonStr }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-claims error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
