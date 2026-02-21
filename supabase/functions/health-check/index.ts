import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

serve(async (req) => {
    const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Fetch all models
    const { data: models, error: fetchError } = await supabaseClient
        .from('models')
        .select('*')

    if (fetchError) {
        return new Response(JSON.stringify({ error: fetchError.message }), { status: 500 })
    }

    const results = await Promise.all(models.map(async (model) => {
        const start = Date.now()
        try {
            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), 8000) // 8s timeout

            const response = await fetch(`${model.base_url}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${model.api_key}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: model.model_identifier,
                    messages: [{ role: 'user', content: 'ping' }],
                    max_tokens: 1
                }),
                signal: controller.signal
            })

            clearTimeout(timeoutId)
            const latency = Date.now() - start

            if (response.ok) {
                await supabaseClient
                    .from('models')
                    .update({
                        status: 'available',
                        last_checked: new Date().toISOString(),
                        response_time_ms: latency,
                        error_message: null
                    })
                    .eq('id', model.id)
                return { name: model.name, status: 'available' }
            } else {
                const errData = await response.text()
                await supabaseClient
                    .from('models')
                    .update({
                        status: 'unavailable',
                        last_checked: new Date().toISOString(),
                        response_time_ms: latency,
                        error_message: `HTTP ${response.status}: ${errData}`
                    })
                    .eq('id', model.id)
                return { name: model.name, status: 'unavailable' }
            }
        } catch (error) {
            const latency = Date.now() - start
            await supabaseClient
                .from('models')
                .update({
                    status: 'unavailable',
                    last_checked: new Date().toISOString(),
                    response_time_ms: latency,
                    error_message: error.message
                })
                .eq('id', model.id)
            return { name: model.name, status: 'unavailable' }
        }
    }))

    return new Response(JSON.stringify({ results }), {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
    })
})
