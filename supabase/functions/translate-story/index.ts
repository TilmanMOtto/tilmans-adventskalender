import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { title, story } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Translating content to English...");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: "You are a professional translator. Translate the given German text to English. Maintain the tone, style, and formatting. IMPORTANT: Wrap the most important words and phrases in *asterisks* so they appear bold (e.g. *important text*). If the German text already has asterisks for bold formatting, preserve them in the translation. Only return the translated text, nothing else."
          },
          {
            role: "user",
            content: `Translate the following German advent calendar entry to English:

Title: ${title}

Story: ${story}

Return the translation in this exact format:
TITLE: [translated title]
STORY: [translated story]`
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error("AI translation failed");
    }

    const data = await response.json();
    const translatedText = data.choices[0].message.content;
    
    // Parse the response
    const titleMatch = translatedText.match(/TITLE:\s*(.+?)(?=\nSTORY:|$)/s);
    const storyMatch = translatedText.match(/STORY:\s*(.+?)$/s);
    
    const title_en = titleMatch ? titleMatch[1].trim() : title;
    const story_en = storyMatch ? storyMatch[1].trim() : story;

    console.log("Translation completed successfully");

    return new Response(
      JSON.stringify({ title_en, story_en }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in translate-story function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
