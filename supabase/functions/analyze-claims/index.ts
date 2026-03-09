import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const ALLOWED_ORIGINS = [
  "https://truthlens-audit-ai.lovable.app",
  "https://id-preview--619212a0-8095-49ba-b2cd-ec5fa56b285b.lovable.app",
];

const MAX_INPUT_LENGTH = 6000;

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("Origin") || "";
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  };
}

// ─── GEMINI DIRECT FALLBACK (commented out) ───────────────────────────────────
// If you want to use your own Gemini API key instead of the Lovable AI Gateway,
// uncomment this block and comment out the Lovable Gateway block below.
//
// const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
// if (!GEMINI_API_KEY) {
//   return new Response(
//     JSON.stringify({ error: "GEMINI_API_KEY is not configured" }),
//     { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
//   );
// }
//
// const response = await fetch(
//   `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
//   {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify({
//       contents: [{ parts: [{ text: systemPrompt + "\n\nText to analyze:\n" + inputText }] }],
//       generationConfig: { responseMimeType: "application/json" },
//     }),
//   }
// );
// ─── END GEMINI FALLBACK ──────────────────────────────────────────────────────

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { inputText } = await req.json();
    if (!inputText || typeof inputText !== "string") {
      return new Response(
        JSON.stringify({ error: "inputText is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (inputText.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "inputText cannot be empty" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (inputText.length > MAX_INPUT_LENGTH) {
      return new Response(
        JSON.stringify({ error: "Input too long" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const systemPrompt = `You are a fact-checking AI. Analyze the following text and extract 3-5 claims.

CRITICAL RULES:
- For each claim, provide a "claimSnippet" which is the EXACT verbatim substring copied from the input text. Do NOT rephrase or summarize — copy it character-for-character.
- "text" is your analysis/explanation of the claim.
- For each claim, determine if it is an objective factual claim or a personal/subjective statement. If it is personal or subjective (e.g. 'I felt', 'I used', 'in my experience', personal preferences, individual actions), label it Unverifiable. Only apply Verified, Uncertain, or Hallucinated to objective factual claims.
- Each claim verdict: "Verified", "Uncertain", "Hallucinated", or "Unverifiable"
  - "Verified" — objective fact confirmed by live sources
  - "Uncertain" — objective fact that could not be fully confirmed
  - "Hallucinated" — objective fact that contradicts live sources
  - "Unverifiable" — personal opinion, subjective experience, or statement that cannot be fact-checked by nature
- Each claim color: "#16A34A" for Verified, "#D97706" for Uncertain, "#DC2626" for Hallucinated, "#6B7280" for Unverifiable
- trustScore: Calculate as the average of ONLY objective claims (exclude Unverifiable). Use these scores: Verified=85, Uncertain=50, Hallucinated=15. If all claims are Unverifiable, set trustScore to -1.
- verdict: "Reliable" if trustScore >= 70, "Uncertain" if 40-69, "High Risk" if < 40, "N/A" if trustScore is -1

Call the report_analysis function with your results.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: inputText },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "report_analysis",
              description: "Report the fact-check analysis results",
              parameters: {
                type: "object",
                properties: {
                  trustScore: { type: "number", description: "0-100 trust score" },
                  verdict: { type: "string", enum: ["Reliable", "Uncertain", "High Risk"] },
                  claims: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        claimSnippet: { type: "string", description: "The EXACT verbatim substring from the input text. Must be a character-for-character copy." },
                        text: { type: "string", description: "Your analysis/explanation of this claim" },
                        verdict: { type: "string", enum: ["Verified", "Uncertain", "Hallucinated", "Unverifiable"] },
                        color: { type: "string" },
                      },
                      required: ["claimSnippet", "text", "verdict", "color"],
                    },
                  },
                },
                required: ["trustScore", "verdict", "claims"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "report_analysis" } },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);

      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ error: "AI analysis failed" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    // Extract grounding sources from Gemini response
    const groundingChunks = data.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources = groundingChunks
      .filter((chunk: any) => chunk.web?.uri)
      .map((chunk: any) => ({
        url: chunk.web.uri,
        title: chunk.web.title || "Source"
      }));

    if (toolCall?.function?.name === "report_analysis") {
      const result = JSON.parse(toolCall.function.arguments);
      
      // Distribute sources across claims
      if (result.claims && Array.isArray(result.claims)) {
        result.claims = result.claims.map((claim: any, index: number) => ({
          ...claim,
          sourceUrl: sources[index]?.url || null,
          sourceTitle: sources[index]?.title || null
        }));
      }
      
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ error: "Could not extract analysis" }),
      { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("analyze-claims error:", e);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred. Please try again." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
