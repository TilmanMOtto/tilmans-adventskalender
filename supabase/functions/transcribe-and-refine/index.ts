import "https://deno.land/x/xhr@0.1.0/mod.ts";
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
    const { audio, mimeType } = await req.json();
    
    if (!audio) {
      throw new Error('No audio data provided');
    }

    // Map MIME types to file extensions
    const mimeToExtension: Record<string, string> = {
      'audio/ogg': 'ogg',
      'audio/webm': 'webm',
      'audio/mpeg': 'mp3',
      'audio/mp3': 'mp3',
      'audio/mp4': 'm4a',
      'audio/x-m4a': 'm4a',
      'audio/wav': 'wav',
      'audio/wave': 'wav',
      'audio/flac': 'flac',
      'audio/oga': 'oga',
    };

    const fileExtension = mimeToExtension[mimeType] || 'webm';
    const actualMimeType = mimeType || 'audio/webm';

    console.log(`Starting transcription... MIME: ${actualMimeType}, Extension: ${fileExtension}`);

    // Convert base64 to binary in chunks to prevent memory issues
    const processBase64Chunks = (base64String: string, chunkSize = 32768) => {
      const chunks: Uint8Array[] = [];
      let position = 0;
      
      while (position < base64String.length) {
        const chunk = base64String.slice(position, position + chunkSize);
        const binaryChunk = atob(chunk);
        const bytes = new Uint8Array(binaryChunk.length);
        
        for (let i = 0; i < binaryChunk.length; i++) {
          bytes[i] = binaryChunk.charCodeAt(i);
        }
        
        chunks.push(bytes);
        position += chunkSize;
      }

      const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
      const result = new Uint8Array(totalLength);
      let offset = 0;

      for (const chunk of chunks) {
        result.set(chunk, offset);
        offset += chunk.length;
      }

      return result;
    };

    const binaryAudio = processBase64Chunks(audio);
    
    // Prepare form data for OpenAI Whisper
    const formData = new FormData();
    const blob = new Blob([binaryAudio], { type: actualMimeType });
    formData.append('file', blob, `audio.${fileExtension}`);
    formData.append('model', 'whisper-1');
    formData.append('language', 'de');

    // Transcribe with OpenAI Whisper
    const openaiResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
      },
      body: formData,
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error('OpenAI API error:', errorText);
      throw new Error(`OpenAI API error: ${errorText}`);
    }

    const transcriptionResult = await openaiResponse.json();
    const transcribedText = transcriptionResult.text;

    console.log('Transcription complete, refining text...');

    // Refine the text using Lovable AI
    const lovableResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('LOVABLE_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'Du bist ein Texteditor, der gesprochene Texte in geschriebene Form umwandelt. Behalte den gleichen Inhalt, die gleiche Sprachweise und alle Details bei. Verbessere nur die Grammatik und Struktur für geschriebene Form. Fasse nichts zusammen und ändere keine Inhalte. WICHTIG: Setze die wichtigsten Wörter und Phrasen in *Sternchen*, damit sie fett dargestellt werden (z.B. *wichtiger Text*).'
          },
          {
            role: 'user',
            content: `Wandle den folgenden gesprochenen Text in geschriebenen Stil um, ohne den Inhalt zu ändern oder zusammenzufassen:\n\n${transcribedText}`
          }
        ],
      }),
    });

    if (!lovableResponse.ok) {
      const errorText = await lovableResponse.text();
      console.error('Lovable AI error:', errorText);
      throw new Error(`Lovable AI error: ${errorText}`);
    }

    const refinementResult = await lovableResponse.json();
    const refinedText = refinementResult.choices[0].message.content;

    console.log('Text refinement complete');

    return new Response(
      JSON.stringify({ 
        transcribedText,
        refinedText 
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error: any) {
    console.error('Error in transcribe-and-refine:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
      }
    );
  }
});
