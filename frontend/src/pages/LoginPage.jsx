import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const { login, register, loading } = useAuth()
  const [tab, setTab] = useState('login')
  const [msg, setMsg] = useState({ text: '', type: '' })

  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')

  const [nom, setNom] = useState('')
  const [rEmail, setREmail] = useState('')
  const [rPass, setRPass] = useState('')
  const [role, setRole] = useState('user')

  const showMsg = (text, type) => setMsg({ text, type })

  const doLogin = async () => {
    if (!email || !pass) return showMsg('Email et mot de passe requis.', 'error')
    const res = await login(email, pass)
    if (!res.success) showMsg(res.message, 'error')
  }

  const doRegister = async () => {
    if (!nom || !rEmail || !rPass) return showMsg('Tous les champs sont requis.', 'error')
    if (rPass.length < 6) return showMsg('Mot de passe : 6 caractères minimum.', 'error')

    const res = await register(nom, rEmail, rPass, role)

    if (res.success) {
      showMsg('Compte créé avec succès. Connectez-vous.', 'success')
      setTab('login')
      setNom('')
      setREmail('')
      setRPass('')
      setRole('user')
    } else {
      showMsg(res.message, 'error')
    }
  }

  const inputStyle = {
    width: '100%',
    background: '#1a2420',
    border: '1px solid rgba(74,230,150,0.12)',
    borderRadius: 8,
    padding: '10px 14px',
    color: '#e8f5ee',
    fontSize: 13.5,
    fontFamily: "'DM Sans',sans-serif",
    outline: 'none',
    marginBottom: 0,
    transition: 'border-color .2s',
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: '#0a0f0d',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse 60% 50% at 70% 40%,rgba(74,230,150,0.07) 0%,transparent 60%),radial-gradient(ellipse 40% 60% at 20% 80%,rgba(74,158,245,0.05) 0%,transparent 50%)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.03,
          backgroundImage:
            'linear-gradient(#4ae696 1px,transparent 1px),linear-gradient(90deg,#4ae696 1px,transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <div
        style={{
          position: 'relative',
          zIndex: 2,
          background: '#0f1612',
          border: '1px solid rgba(74,230,150,0.12)',
          borderRadius: 24,
          padding: 40,
          width: 400,
          animation: 'fadeUp .5s ease',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
          <div
            style={{
              width: 44,
              height: 44,
              background: '#4ae696',
              borderRadius: 14,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg
              width="26"
              height="26"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#0a0f0d"
              strokeWidth="2.5"
              strokeLinecap="round"
            >
              <circle cx="12" cy="12" r="5" />
              <path d="M12 1v3M12 20v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M1 12h3M20 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12" />
            </svg>
          </div>
          <div>
            <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 22, fontWeight: 800, color: '#e8f5ee' }}>
              PV SmartCare
            </div>
            <div style={{ fontSize: 11, color: '#4d7060' }}>Plateforme de gestion intelligente</div>
          </div>
        </div>

        <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 24, fontWeight: 800, color: '#e8f5ee', marginBottom: 6 }}>
          Bienvenue
        </div>
        <div style={{ fontSize: 13, color: '#8aab97', marginBottom: 28 }}>
          Connectez-vous pour accéder à votre espace
        </div>

        <div style={{ display: 'flex', gap: 4, background: '#1a2420', borderRadius: 10, padding: 4, marginBottom: 24 }}>
          {['login', 'register'].map((t, i) => (
            <button
              key={t}
              onClick={() => {
                setTab(t)
                setMsg({ text: '', type: '' })
              }}
              style={{
                flex: 1,
                padding: 8,
                borderRadius: 7,
                textAlign: 'center',
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
                fontFamily: "'DM Sans',sans-serif",
                transition: 'all .2s',
                color: tab === t ? '#e8f5ee' : '#8aab97',
                background: tab === t ? '#0f1612' : 'transparent',
                border: tab === t ? '1px solid rgba(74,230,150,0.12)' : '1px solid transparent',
              }}
            >
              {i === 0 ? 'Connexion' : 'Inscription'}
            </button>
          ))}
        </div>

        {msg.text && (
          <div
            style={{
              borderRadius: 8,
              padding: '10px 14px',
              fontSize: 13,
              marginBottom: 16,
              background: msg.type === 'error' ? 'rgba(245,74,74,0.1)' : 'rgba(74,230,150,0.1)',
              border: `1px solid ${msg.type === 'error' ? 'rgba(245,74,74,0.3)' : 'rgba(74,230,150,0.3)'}`,
              color: msg.type === 'error' ? '#f54a4a' : '#4ae696',
            }}
          >
            {msg.text}
          </div>
        )}

        {tab === 'login' && (
          <div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: '#8aab97', marginBottom: 6, display: 'block' }}>
                Email
              </label>
              <input
                style={inputStyle}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder=""
                onKeyDown={(e) => e.key === 'Enter' && doLogin()}
              />
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: '#8aab97', marginBottom: 6, display: 'block' }}>
                Mot de passe
              </label>
              <input
                style={inputStyle}
                type="password"
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                placeholder=""
                onKeyDown={(e) => e.key === 'Enter' && doLogin()}
              />
            </div>

            <button
              onClick={doLogin}
              disabled={loading}
              style={{
                width: '100%',
                padding: 12,
                background: '#4ae696',
                color: '#0a0f0d',
                border: 'none',
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 600,
                fontFamily: "'Syne',sans-serif",
                cursor: loading ? 'not-allowed' : 'pointer',
                marginTop: 8,
                opacity: loading ? 0.7 : 1,
              }}
            >
              Se connecter
            </button>
          </div>
        )}

        {tab === 'register' && (
          <div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: '#8aab97', marginBottom: 6, display: 'block' }}>
                Nom complet
              </label>
              <input style={inputStyle} type="text" value={nom} onChange={(e) => setNom(e.target.value)} placeholder="" />
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: '#8aab97', marginBottom: 6, display: 'block' }}>
                Email
              </label>
              <input style={inputStyle} type="email" value={rEmail} onChange={(e) => setREmail(e.target.value)} placeholder="" />
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: '#8aab97', marginBottom: 6, display: 'block' }}>
                Mot de passe
              </label>
              <input style={inputStyle} type="password" value={rPass} onChange={(e) => setRPass(e.target.value)} placeholder="Min. 6 caractères" />
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: '#8aab97', marginBottom: 6, display: 'block' }}>
                Type de compte
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                style={{ ...inputStyle, appearance: 'none' }}
              >
                <option value="user">Utilisateur</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <button
              onClick={doRegister}
              disabled={loading}
              style={{
                width: '100%',
                padding: 12,
                background: '#4ae696',
                color: '#0a0f0d',
                border: 'none',
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 600,
                fontFamily: "'Syne',sans-serif",
                cursor: loading ? 'not-allowed' : 'pointer',
                marginTop: 8,
                opacity: loading ? 0.7 : 1,
              }}
            >
              Créer le compte
            </button>
          </div>
        )}
      </div>
    </div>
  )
}