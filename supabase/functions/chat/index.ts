import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const CATCLAW_KEY = "sk-BtKsVhNLErn5elGarqj7tzi35g6GCGtRYcMy4TuVQCFCtIgc";
const CATCLAW_BASE = "https://www.catclawai.top/v1";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? 'https://mrmtvnzbjdpyjgtzvvjl.supabase.co',
            Deno.env.get('SUPABASE_ANON_KEY') ?? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ybXR2bnpiamRweWpndHp2dmpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2NDM4NjgsImV4cCI6MjA4NzIxOTg2OH0.4_lD8EPuhSyDQsaoVpSFVbb4eMUqCG1UJxJyIC9bOmY'
        )

        const { model_id, messages } = await req.json()

        // 1. Fetch the model identifier
        const { data: model, error: dbError } = await supabaseClient
            .from('models')
            .select('model_identifier')
            .eq('id', model_id)
            .single()

        if (dbError || !model) throw new Error('Model not found')

        // 2. Perform streaming fetch to CatClaw
        const response = await fetch(`${CATCLAW_BASE}/chat/completions`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${CATCLAW_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: model.model_identifier,
                messages: messages,
                stream: true // ENABLE STREAMING
            }),
        })

        if (!response.ok) {
            const errorText = await response.text();
            return new Response(JSON.stringify({ error: errorText }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: response.status,
            })
        }

        // 3. Setup streaming response
        const stream = new ReadableStream({
            async start(controller) {
                const reader = response.body?.getReader();
                if (!reader) {
                    controller.close();
                    return;
                }

                const decoder = new TextDecoder();
                try {
                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;

                        // Just forward the chunks from CatClaw
                        controller.enqueue(value);
                    }
                } catch (err) {
                    controller.error(err);
                } finally {
                    controller.close();
                }
            },
        });

        return new Response(stream, {
            headers: {
                ...corsHeaders,
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            },
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
