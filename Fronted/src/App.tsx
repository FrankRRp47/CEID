import { useState } from 'react'
import type { FormEvent } from 'react'
import './App.css'

type AuthMode = 'login' | 'register'
type Notice = { kind: 'error' | 'success'; message: string }

const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')

function getErrorMessage(data: unknown) {
  if (typeof data === 'object' && data !== null && 'detail' in data) {
    const detail = data.detail
    if (typeof detail === 'string') return detail
    if (Array.isArray(detail)) {
      return detail.map((item) => typeof item === 'object' && item !== null && 'msg' in item ? item.msg : '').filter(Boolean).join(' ')
    }
  }
  return 'No se pudo completar la solicitud. Inténtalo de nuevo.'
}

function App() {
  const [mode, setMode] = useState<AuthMode>('login')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [notice, setNotice] = useState<Notice | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [signedInEmail, setSignedInEmail] = useState(() => localStorage.getItem('ceid_user_email'))

  function changeMode(nextMode: AuthMode) {
    setMode(nextMode)
    setNotice(null)
    setPassword('')
    setShowPassword(false)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setNotice(null)
    setIsSubmitting(true)

    const payload = mode === 'register'
      ? { username: username.trim(), email: email.trim(), password }
      : { email: email.trim(), password }

    try {
      const response = await fetch(`${API_URL}/api/v1/auth/${mode === 'register' ? 'register' : 'login'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data: unknown = await response.json().catch(() => null)

      if (!response.ok) throw new Error(getErrorMessage(data))

      if (mode === 'register') {
        setNotice({ kind: 'success', message: 'Tu cuenta está lista. Ahora puedes iniciar sesión.' })
        setMode('login')
        setPassword('')
      } else if (typeof data === 'object' && data !== null && 'access_token' in data && typeof data.access_token === 'string') {
        localStorage.setItem('ceid_access_token', data.access_token)
        localStorage.setItem('ceid_user_email', email.trim())
        setSignedInEmail(email.trim())
      } else {
        throw new Error('La respuesta del servidor no contiene un token válido.')
      }
    } catch (error) {
      setNotice({
        kind: 'error',
        message: error instanceof TypeError
          ? 'No se pudo conectar con el servidor. Comprueba que la API esté disponible.'
          : error instanceof Error ? error.message : 'Ocurrió un error inesperado.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  function signOut() {
    localStorage.removeItem('ceid_access_token')
    localStorage.removeItem('ceid_user_email')
    setSignedInEmail(null)
    setNotice(null)
  }

  return (
    <div className="auth-page">
      <aside className="brand-panel">
        <a className="brand" href="/" aria-label="CEID, inicio">
          <span className="brand-mark" aria-hidden="true">C</span>
          <span>CEID<span className="brand-period">.</span></span>
        </a>
        <div className="brand-copy">
          <p className="eyebrow">COMUNIDAD · IDEAS · DESARROLLO</p>
          <h2>Un espacio para lo que viene.</h2>
          <p>Conecta con una comunidad que convierte buenas ideas en proyectos reales.</p>
        </div>
        <div className="brand-art" aria-hidden="true">
          <div className="art-ring art-ring-one" />
          <div className="art-ring art-ring-two" />
          <div className="art-core"><span>CEID</span><span>2026</span></div>
          <span className="art-label art-label-top">IDEAS EN MOVIMIENTO</span>
          <span className="art-label art-label-bottom">CRECER · CREAR · COMPARTIR</span>
        </div>
        <p className="brand-footer">PENSADO PARA CONSTRUIR EN COMUNIDAD</p>
      </aside>

      <main className="form-panel">
        <div className="form-topline"><span className="status-dot" /> Plataforma CEID</div>
        {signedInEmail ? (
          <section className="auth-content signed-in" aria-live="polite">
            <p className="eyebrow">SESIÓN ACTIVA</p>
            <h1>Qué bueno verte.</h1>
            <p className="form-intro">Has iniciado sesión como <strong>{signedInEmail}</strong>.</p>
            <button className="submit-button" type="button" onClick={signOut}>Cerrar sesión <span aria-hidden="true">→</span></button>
          </section>
        ) : (
          <section className="auth-content">
            <p className="eyebrow">TU ESPACIO TE ESPERA</p>
            <h1>{mode === 'login' ? 'Qué bueno verte.' : 'Forma parte de CEID.'}</h1>
            <p className="form-intro">{mode === 'login' ? 'Ingresa a tu cuenta para continuar.' : 'Crea tu cuenta y empieza a construir en comunidad.'}</p>

            <div className="mode-switch" role="tablist" aria-label="Acceso a cuenta">
              <button type="button" role="tab" aria-selected={mode === 'login'} className={mode === 'login' ? 'active' : ''} onClick={() => changeMode('login')}>Iniciar sesión</button>
              <button type="button" role="tab" aria-selected={mode === 'register'} className={mode === 'register' ? 'active' : ''} onClick={() => changeMode('register')}>Crear cuenta</button>
            </div>

            {notice && <div className={`notice ${notice.kind}`} role="status">{notice.message}</div>}

            <form className="auth-form" onSubmit={handleSubmit}>
              {mode === 'register' && (
                <label className="field">
                  <span>Nombre de usuario</span>
                  <input
                    autoComplete="username"
                    maxLength={50}
                    minLength={3}
                    pattern="[A-Za-z0-9_.-]+"
                    placeholder="ej. ana_garcia"
                    required
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                  />
                  <small>3–50 caracteres: letras, números, punto, guion o guion bajo.</small>
                </label>
              )}
              <label className="field">
                <span>Correo electrónico</span>
                <input
                  autoComplete="email"
                  maxLength={254}
                  placeholder="nombre@correo.com"
                  required
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </label>
              <label className="field">
                <span>Contraseña</span>
                <span className="password-input">
                  <input
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                    maxLength={128}
                    minLength={mode === 'register' ? 8 : 1}
                    placeholder={mode === 'register' ? 'Mínimo 8 caracteres' : 'Tu contraseña'}
                    required
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                  />
                  <button
                    className="password-toggle"
                    type="button"
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    aria-pressed={showPassword}
                    onClick={() => setShowPassword((isVisible) => !isVisible)}
                  >
                    <svg aria-hidden="true" viewBox="0 0 24 24">
                      {showPassword ? (
                        <>
                          <path d="M3 3l18 18" />
                          <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
                          <path d="M9.9 5.2A10.7 10.7 0 0 1 12 5c5.5 0 9 5 9 7s-3.5 7-9 7a9.8 9.8 0 0 1-4.1-.9" />
                          <path d="M6.6 6.6C4.3 8.1 3 10.7 3 12c0 1 1.5 3.4 4.1 5" />
                        </>
                      ) : (
                        <>
                          <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
                          <circle cx="12" cy="12" r="2.5" />
                        </>
                      )}
                    </svg>
                  </button>
                </span>
              </label>
              <button className="submit-button" type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Un momento…' : mode === 'login' ? 'Entrar a mi cuenta' : 'Crear mi cuenta'}
                {!isSubmitting && <span aria-hidden="true">→</span>}
              </button>
            </form>
            <p className="switch-prompt">
              {mode === 'login' ? '¿Aún no tienes cuenta?' : '¿Ya tienes una cuenta?'}{' '}
              <button type="button" onClick={() => changeMode(mode === 'login' ? 'register' : 'login')}>
                {mode === 'login' ? 'Regístrate' : 'Inicia sesión'}
              </button>
            </p>
          </section>
        )}
        <footer className="form-footer"><span>© 2026 CEID</span><span>Comunidad para crear</span></footer>
      </main>
    </div>
  )
}

export default App
