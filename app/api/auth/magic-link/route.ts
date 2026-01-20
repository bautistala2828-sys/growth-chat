import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(req: Request) {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
  const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!SUPABASE_URL || !SUPABASE_ANON) {
    return NextResponse.json(
      { error: "Missing Supabase env vars (URL / ANON KEY) in Vercel" },
      { status: 500 }
    )
  }

  const { email } = await req.json()

  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "Email requerido" }, { status: 400 })
  }

  // dominio permitido (usa tu env o hardcode por ahora)
  const allowed = (process.env.NEXT_PUBLIC_ALLOWED_EMAIL_DOMAIN || "@growthlarriera.com").toLowerCase()
  if (!email.toLowerCase().endsWith(allowed)) {
    return NextResponse.json({ error: "Email no autorizado" }, { status: 401 })
  }

  // ✅ crear el cliente DENTRO del handler
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON)

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      // para demo: mandalo al chat directo
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/chat`,
    },
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}
