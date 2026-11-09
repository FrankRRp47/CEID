import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import './App.css'

type AuthMode = 'login' | 'register'
type Notice = { kind: 'error' | 'success'; message: string }

const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')
const WHATSAPP_URL = 'https://wa.me/51967002006?text=Hola%20kiraiSoft%2C%20quiero%20hablar%20sobre%20un%20proyecto.'

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (options: { client_id: string; callback: (response: { credential: string }) => void }) => void
          renderButton: (element: HTMLElement, options: { theme: string; size: string; width: number; text: string }) => void
        }
      }
    }
  }
}

function getErrorMessage(data: unknown) {
  if (typeof data === 'object' && data !== null && 'detail' in data) {
    const detail = data.detail
    if (typeof detail === 'string') return detail
    if (Array.isArray(detail)) return detail.map((item) => typeof item === 'object' && item !== null && 'msg' in item ? item.msg : '').filter(Boolean).join(' ')
  }
  return 'No se pudo completar la solicitud. Inténtalo de nuevo.'
}

function App() {
  const [mode, setMode] = useState<AuthMode>('login')
  const [showAuth, setShowAuth] = useState(false)
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [notice, setNotice] = useState<Notice | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [signedInEmail, setSignedInEmail] = useState(() => localStorage.getItem('kirai_user_email'))
  const googleButton = useRef<HTMLDivElement>(null)

  async function handleGoogleLogin(response: { credential: string }) {
    setNotice(null)
    setIsSubmitting(true)
    try {
      const result = await fetch(`${API_URL}/api/v1/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: response.credential }),
      })
      const data: unknown = await result.json().catch(() => null)
      if (!result.ok) throw new Error(getErrorMessage(data))
      if (typeof data === 'object' && data !== null && 'access_token' in data && typeof data.access_token === 'string' && 'email' in data && typeof data.email === 'string') {
        localStorage.setItem('kirai_access_token', data.access_token)
        localStorage.setItem('kirai_user_email', data.email)
        setSignedInEmail(data.email)
        setShowAuth(false)
      } else throw new Error('La respuesta del servidor no contiene un token válido.')
    } catch (error) {
      setNotice({ kind: 'error', message: error instanceof TypeError ? 'No se pudo conectar con el servidor.' : error instanceof Error ? error.message : 'Ocurrió un error inesperado.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
    if (!showAuth || !clientId || !window.google || !googleButton.current) return
    window.google.accounts.id.initialize({ client_id: clientId, callback: (response) => { void handleGoogleLogin(response) } })
    googleButton.current.replaceChildren()
    window.google.accounts.id.renderButton(googleButton.current, { theme: 'outline', size: 'large', width: 430, text: 'continue_with' })
  }, [showAuth])

  function openAuth(nextMode: AuthMode = 'login') {
    setMode(nextMode)
    setNotice(null)
    setShowAuth(true)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setNotice(null)
    setIsSubmitting(true)
    const payload = mode === 'register' ? { username: username.trim(), email: email.trim(), password } : { email: email.trim(), password }
    try {
      const response = await fetch(`${API_URL}/api/v1/auth/${mode === 'register' ? 'register' : 'login'}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const data: unknown = await response.json().catch(() => null)
      if (!response.ok) throw new Error(getErrorMessage(data))
      if (mode === 'register') {
        setNotice({ kind: 'success', message: 'Tu cuenta está lista. Ahora puedes iniciar sesión.' })
        setMode('login')
        setPassword('')
      } else if (typeof data === 'object' && data !== null && 'access_token' in data && typeof data.access_token === 'string') {
        localStorage.setItem('kirai_access_token', data.access_token)
        localStorage.setItem('kirai_user_email', email.trim())
        setSignedInEmail(email.trim())
        setShowAuth(false)
      } else throw new Error('La respuesta del servidor no contiene un token válido.')
    } catch (error) {
      setNotice({ kind: 'error', message: error instanceof TypeError ? 'No se pudo conectar con el servidor. Comprueba que la API esté disponible.' : error instanceof Error ? error.message : 'Ocurrió un error inesperado.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  function signOut() {
    localStorage.removeItem('kirai_access_token')
    localStorage.removeItem('kirai_user_email')
    setSignedInEmail(null)
  }

  return (
    <div className="site-shell">
      <header className="topbar">
        <a className="brand" href="#inicio" aria-label="kiraiSoft, inicio"><span className="brand-symbol">k<span>i</span></span><span>kirai<span className="brand-accent">Soft</span></span></a>
        <nav className="nav-links" aria-label="Navegación principal"><a href="#servicios">Servicios</a><a href="#proceso">Cómo trabajamos</a><a href="#contacto">Contacto</a></nav>
        <div className="top-actions">{signedInEmail ? <button className="text-button" onClick={signOut}>Cerrar sesión</button> : <button className="outline-button" onClick={() => openAuth()}>Acceder <span>↗</span></button>}</div>
      </header>

      <main>
        <section className="hero" id="inicio">
          <div className="hero-grid" />
          <div className="hero-copy"><p className="eyebrow"><span className="pulse" /> UN MENSAJE ESPECIAL PARA TI</p><h1 className="love-message">Hola amoshito,<br /><em>solo quería decirte</em><br />que te amo con todo mi corazón <span className="heart" aria-label="corazón">♥</span></h1><p className="hero-intro">Un pequeño mensaje para recordarte lo mucho que significas para mí.</p><div className="hero-actions"><a className="primary-button" href={WHATSAPP_URL} target="_blank" rel="noreferrer">Hablemos de tu proyecto <span>↗</span></a><a className="play-link" href="#servicios"><span className="play-icon">↓</span> Explora lo que hacemos</a></div></div>
          <div className="hero-orbit" aria-hidden="true"><div className="orbit orbit-one" /><div className="orbit orbit-two" /><div className="orbit-core"><span>k</span><small>BUILD<br />BOLD</small></div><i className="orbit-dot dot-one" /><i className="orbit-dot dot-two" /></div>
          <div className="hero-foot"><span>01 — 04</span><span>ESTRATEGIA · DISEÑO · TECNOLOGÍA</span><span>SCROLL TO EXPLORE ↓</span></div>
        </section>

        <section className="statement section" id="servicios"><div className="section-label">01 / LO QUE HACEMOS</div><div><h2>Convertimos lo complejo en <span>experiencias simples.</span></h2><p>Somos un equipo estratégico y técnico que acompaña a empresas a crear, escalar y transformar sus productos digitales.</p></div></section>
        <section className="services section"><div className="service-card featured"><span className="card-number">01</span><span className="card-icon">◈</span><h3>Productos<br />digitales</h3><p>De la primera idea al producto que tus usuarios quieren usar.</p><a href={WHATSAPP_URL} target="_blank" rel="noreferrer">Descubrir más ↗</a></div><div className="service-card"><span className="card-number">02</span><span className="card-icon">⌁</span><h3>Software<br />a medida</h3><p>Soluciones robustas que encajan con la forma en que trabajas.</p><a href={WHATSAPP_URL} target="_blank" rel="noreferrer">Descubrir más ↗</a></div><div className="service-card"><span className="card-number">03</span><span className="card-icon">✦</span><h3>Diseño &<br />experiencia</h3><p>Interfaces claras y memorables que hacen la diferencia.</p><a href={WHATSAPP_URL} target="_blank" rel="noreferrer">Descubrir más ↗</a></div></section>
        <section className="process section" id="proceso"><div className="section-label">02 / NUESTRO MÉTODO</div><div className="process-content"><h2>De la visión<br />a la <span>realidad.</span></h2><div className="process-list"><div><b>01</b><span><strong>Entender</strong><small>Nos sumergimos en tu negocio y tus objetivos.</small></span></div><div><b>02</b><span><strong>Diseñar</strong><small>Convertimos oportunidades en experiencias claras.</small></span></div><div><b>03</b><span><strong>Construir</strong><small>Desarrollamos tecnología lista para crecer.</small></span></div></div></div></section>
        <section className="contact section" id="contacto"><p className="eyebrow">¿TIENES UN RETO?</p><h2>Hagamos algo<br /><span>extraordinario.</span></h2><a className="primary-button" href={WHATSAPP_URL} target="_blank" rel="noreferrer">Escribir por WhatsApp <span>↗</span></a><p className="phone">+51 967 002 006</p></section>
      </main>
      <footer className="footer"><a className="brand" href="#inicio"><span className="brand-symbol">k<span>i</span></span><span>kirai<span className="brand-accent">Soft</span></span></a><span>© 2026 kiraiSoft. Lima, Perú.</span><span>Software with intent.</span></footer>

      {showAuth && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setShowAuth(false)}><section className="auth-modal" role="dialog" aria-modal="true" aria-labelledby="auth-title"><button className="modal-close" aria-label="Cerrar" onClick={() => setShowAuth(false)}>×</button><p className="eyebrow">KIRAISOFT / CUENTA</p><h2 id="auth-title">{mode === 'login' ? 'Bienvenido de vuelta.' : 'Construyamos juntos.'}</h2><p className="modal-intro">{mode === 'login' ? 'Accede a tu espacio de cliente.' : 'Crea tu cuenta para comenzar.'}</p>{notice && <div className={`notice ${notice.kind}`}>{notice.message}</div>}<div ref={googleButton} className="google-button">{!import.meta.env.VITE_GOOGLE_CLIENT_ID && <button className="google-fallback" type="button" onClick={() => setNotice({ kind: 'error', message: 'Configura VITE_GOOGLE_CLIENT_ID para activar Google Sign-In.' })}><b>G</b> Continuar con Google</button>}</div><div className="or-divider"><span>o continúa con email</span></div><form className="auth-form" onSubmit={handleSubmit}>{mode === 'register' && <label className="field"><span>Nombre de usuario</span><input autoComplete="username" maxLength={50} minLength={3} pattern="[A-Za-z0-9_.-]+" required value={username} onChange={(event) => setUsername(event.target.value)} /></label>}<label className="field"><span>Correo electrónico</span><input autoComplete="email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} /></label><label className="field"><span>Contraseña</span><input autoComplete={mode === 'login' ? 'current-password' : 'new-password'} minLength={mode === 'register' ? 8 : 1} type="password" required value={password} onChange={(event) => setPassword(event.target.value)} /></label><button className="primary-button submit-button" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Un momento…' : mode === 'login' ? 'Iniciar sesión' : 'Crear mi cuenta'} <span>↗</span></button></form><p className="switch-prompt">{mode === 'login' ? '¿Aún no tienes cuenta?' : '¿Ya tienes una cuenta?'} <button type="button" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setNotice(null) }}>{mode === 'login' ? 'Regístrate' : 'Inicia sesión'}</button></p></section></div>}
    </div>
  )
}

export default App
