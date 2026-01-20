import { createClient } from "@supabase/supabase-js"

const ALLOWED_ORIGIN = "https://magenta-buttons-463687.framer.app"

const corsHeaders = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
  "Vary": "Origin",
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders })
}

export async function POST(req: Request) {
  try {
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
    const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!SUPABASE_URL || !SUPABASE_ANON) {
      return new Response(JSON.stringify({ error: "Missing Supabase env vars" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      })
    }

    let body: any = {}
    try { body = await req.json() } catch {}
    const email = body?.email

    if (!email || typeof email !== "string") {
      return new Response(JSON.stringify({ error: "Email requerido" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      })
    }

    const allowed = (process.env.NEXT_PUBLIC_ALLOWED_EMAIL_DOMAIN || "@growthlarriera.com").toLowerCase()
    if (!email.toLowerCase().endsWith(allowed)) {
      return new Response(JSON.stringify({ error: `Email no autorizado (solo ${allowed})` }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      })
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON)

    const redirectTo =
      process.env.NEXT_PUBLIC_SITE_URL
        ? `${process.env.NEXT_PUBLIC_SITE_URL}/chat`
        : "https://growth-chat.vercel.app/chat"

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo },
    })

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      })
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    })
  } catch {
    return new Response(JSON.stringify({ error: "Error inesperado" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    })
  }
}

