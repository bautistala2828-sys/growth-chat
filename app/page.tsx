export default function Home() {
  return (
    <main className="main-wrapper">
      <section className="card">
        <h1>Mr. Larriera</h1>

        <p className="subtitle">
          Asesor privado de performance. Decisiones basadas en números,
          estructura y ejecución.
        </p>

        <label>Email de la agencia</label>
        <input
          type="email"
          placeholder="tu-email@growthlarriera.com"
        />

        <button>Enviar Magic Link</button>

        <p className="helper-text">
          Acceso cifrado · Sin contraseñas · Supabase OTP
        </p>
      </section>
    </main>
  );
}

