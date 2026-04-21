import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { resumeText } = await req.json();
    if (!resumeText || typeof resumeText !== "string") {
      return new Response(JSON.stringify({ error: "resumeText is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are an expert ATS (Applicant Tracking System) resume analyzer. Analyze the provided resume text and return a JSON object with this exact structure:

{
  "score": <number 0-100>,
  "pros": [<string array of 3-7 strengths>],
  "cons": [<string array of 3-7 weaknesses>],
  "recommendations": [<string array of 4-8 actionable improvements>],
  "keywords": {
    "found": [<string array of keywords present in the resume>],
    "missing": [<string array of important keywords missing>]
  },
  "sections": [
    {"name": "Contact Information", "found": <boolean>},
    {"name": "Summary/Objective", "found": <boolean>},
    {"name": "Work Experience", "found": <boolean>},
    {"name": "Education", "found": <boolean>},
    {"name": "Skills", "found": <boolean>},
    {"name": "Certifications", "found": <boolean>},
    {"name": "Projects", "found": <boolean>}
  ]
}

Scoring criteria:
- Section completeness (30%): Are key sections present and well-organized?
- Keyword relevance (25%): Industry-relevant keywords, action verbs, technical terms
- Formatting & readability (15%): Bullet points, consistent formatting, appropriate length
- Quantifiable achievements (15%): Numbers, percentages, measurable results
- ATS compatibility (15%): Clean formatting, standard section headers, no complex layouts

Be specific and actionable in pros, cons, and recommendations. Reference actual content from the resume.`;

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
          { role: "user", content: `Analyze this resume:\n\n${resumeText.slice(0, 8000)}` },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "return_analysis",
              description: "Return the structured ATS resume analysis",
              parameters: {
                type: "object",
                properties: {
                  score: { type: "number", description: "ATS score 0-100" },
                  pros: { type: "array", items: { type: "string" } },
                  cons: { type: "array", items: { type: "string" } },
                  recommendations: { type: "array", items: { type: "string" } },
                  keywords: {
                    type: "object",
                    properties: {
                      found: { type: "array", items: { type: "string" } },
                      missing: { type: "array", items: { type: "string" } },
                    },
                    required: ["found", "missing"],
                  },
                  sections: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        found: { type: "boolean" },
                      },
                      required: ["name", "found"],
                    },
                  },
                },
                required: ["score", "pros", "cons", "recommendations", "keywords", "sections"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "return_analysis" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      throw new Error("No tool call in response");
    }

    const analysis = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-resume error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
