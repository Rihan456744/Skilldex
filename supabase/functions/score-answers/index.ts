import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { questions, answers, jobTitle } = await req.json();
    if (!questions || !answers || !jobTitle) {
      return new Response(JSON.stringify({ error: "questions, answers, and jobTitle are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const qaPairs = questions.map((q: any, i: number) => {
      const answer = answers[q.id] || "";
      return `Q${i + 1}: ${q.question}\nA${i + 1}: ${answer || "(No answer provided)"}`;
    }).join("\n\n");

    const systemPrompt = `You are an expert recruiter evaluating pre-screening answers for a "${jobTitle}" position. Score each answer and provide an overall ranking score.

Return a JSON object with this exact structure:
{
  "overallScore": <number 0-100>,
  "answerScores": [
    {
      "questionId": "<string>",
      "score": <number 0-10>,
      "feedback": "<short 1-sentence evaluation>"
    }
  ],
  "summary": "<2-sentence overall assessment of answer quality>"
}

Scoring criteria per answer (0-10):
- 0-2: No answer or completely irrelevant
- 3-4: Vague, generic, lacks specifics
- 5-6: Adequate but could be stronger
- 7-8: Good, relevant with some specifics
- 9-10: Excellent, detailed, highly relevant

Overall score is a weighted combination of individual answer scores normalized to 0-100.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: qaPairs },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "return_answer_scores",
              description: "Return the structured answer scoring",
              parameters: {
                type: "object",
                properties: {
                  overallScore: { type: "number" },
                  answerScores: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        questionId: { type: "string" },
                        score: { type: "number" },
                        feedback: { type: "string" },
                      },
                      required: ["questionId", "score", "feedback"],
                    },
                  },
                  summary: { type: "string" },
                },
                required: ["overallScore", "answerScores", "summary"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "return_answer_scores" } },
      }),
    });

    if (!response.ok) {
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call in response");

    const result = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("score-answers error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
