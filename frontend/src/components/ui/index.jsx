import { useState, useEffect, useRef } from 'react'

/* ── BADGE ── */
export function Badge({ statut }) {
  const map = {
    actif:       { label: 'Actif',        color: '#4ae696', bg: 'rgba(74,230,150,0.12)' },
    maintenance: { label: 'Maintenance',  color: '#f5d842', bg: 'rgba(245,216,66,0.12)' },
    inactif:     { label: 'Inactif',      color: '#f54a4a', bg: 'rgba(245,74,74,0.12)'  },
  }
  const s = map[statut] || map.inactif
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'3px 10px',
      borderRadius:20, fontSize:11, fontWeight:600, color:s.color, background:s.bg }}>
      <span style={{ width:5, height:5, borderRadius:'50%', background:s.color, display:'inline-block' }}/>
      {s.label}
    </span>
  )
}

/* ── PROGRESS BAR ── */
export function ProgressBar({ value }) {
  const color = value >= 80 ? '#4ae696' : value >= 50 ? '#f5d842' : '#f54a4a'
  return (
    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
      <div style={{ height:5, width:70, background:'var(--surface2)', borderRadius:10, overflow:'hidden' }}>
        <div style={{ height:'100%', width:`${value}%`, background:color, borderRadius:10, transition:'width .6s ease' }}/>
      </div>
      <span style={{ fontSize:12, color:'var(--text2)' }}>{value}%</span>
    </div>
  )
}

/* ── BUTTON ── */
export function Btn({ children, variant='primary', onClick, disabled, style={}, small }) {
  const base = {
    display:'inline-flex', alignItems:'center', gap:6,
    padding: small ? '5px 12px' : '8px 16px',
    borderRadius: small ? 6 : 8, border:'none', cursor: disabled ? 'not-allowed' : 'pointer',
    fontSize: small ? 12 : 13, fontFamily:'var(--font-body)', fontWeight:500,
    transition:'all .2s', opacity: disabled ? .5 : 1, ...style
  }
  const variants = {
    primary:   { background:'var(--accent)', color:'var(--bg)' },
    secondary: { background:'var(--surface)', color:'var(--text)', border:'1px solid var(--border)' },
    danger:    { background:'none', color:'var(--red)', border:'1px solid rgba(245,74,74,0.3)' },
    ghost:     { background:'none', color:'var(--text2)', border:'1px solid var(--border)' },
  }
  return (
    <button style={{ ...base, ...variants[variant] }} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  )
}

/* ── CARD ── */
export function Card({ children, style={}, className='' }) {
  return (
    <div className={className} style={{
      background:'var(--surface)', border:'1px solid var(--border)',
      borderRadius:'var(--r2)', padding:20, ...style
    }}>
      {children}
    </div>
  )
}

/* ── CARD TITLE ── */
export function CardTitle({ children, icon }) {
  return (
    <div style={{ fontFamily:'var(--font-head)', fontSize:14, fontWeight:700, color:'var(--text)',
      marginBottom:16, display:'flex', alignItems:'center', gap:8 }}>
      {icon && <span style={{ color:'var(--accent)', display:'flex' }}>{icon}</span>}
      {children}
    </div>
  )
}

/* ── STAT CARD ── */
export function StatCard({ label, value, unit, sub, color='green', icon }) {
  const colors = { green:'var(--accent)', yellow:'var(--yellow)', orange:'var(--orange)', blue:'var(--blue)' }
  return (
    <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--r2)',
      padding:20, position:'relative', overflow:'hidden', transition:'border-color .3s' }}
      className="fade-up"
      onMouseEnter={e=>e.currentTarget.style.borderColor='var(--border2)'}
      onMouseLeave={e=>e.currentTarget.style.borderColor='var(--border)'}
    >
      <div style={{ position:'absolute', top:0, left:0, right:0, height:3,
        borderRadius:'var(--r2) var(--r2) 0 0', background:colors[color] }}/>
      <div style={{ fontSize:11, color:'var(--text3)', fontWeight:500, letterSpacing:.5,
        textTransform:'uppercase', marginBottom:10 }}>{label}</div>
      <div>
        <span style={{ fontFamily:'var(--font-head)', fontSize:32, fontWeight:800, color:'var(--text)', lineHeight:1 }}>{value}</span>
        {unit && <span style={{ fontSize:14, color:'var(--text2)', marginLeft:4 }}>{unit}</span>}
      </div>
      {sub && <div style={{ fontSize:12, color:'var(--text3)', marginTop:8 }}>{sub}</div>}
      {icon && <div style={{ position:'absolute', right:16, top:'50%', transform:'translateY(-50%)', opacity:.08, fontSize:48 }}>{icon}</div>}
    </div>
  )
}

/* ── MODAL ── */
export function Modal({ open, onClose, title, children, width=520 }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    if (open) document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null
  return (
    <div onClick={onClose} style={{
      position:'fixed', inset:0, background:'rgba(0,0,0,.75)',
      backdropFilter:'blur(6px)', zIndex:1000, display:'flex',
      alignItems:'center', justifyContent:'center'
    }}>
      <div onClick={e=>e.stopPropagation()} style={{
        background:'var(--bg2)', border:'1px solid var(--border)',
        borderRadius:'var(--r2)', padding:28, width, maxWidth:'95vw',
        maxHeight:'90vh', overflowY:'auto', position:'relative',
        animation:'fadeUp .25s ease'
      }}>
        <div style={{ fontFamily:'var(--font-head)', fontSize:18, fontWeight:700,
          color:'var(--text)', marginBottom:20 }}>{title}</div>
        <button onClick={onClose} style={{
          position:'absolute', top:18, right:18, background:'var(--surface)',
          border:'1px solid var(--border)', borderRadius:8, width:30, height:30,
          display:'flex', alignItems:'center', justifyContent:'center',
          cursor:'pointer', color:'var(--text2)', fontSize:16
        }}>✕</button>
        {children}
      </div>
    </div>
  )
}

/* ── FORM FIELD ── */
export function Field({ label, children }) {
  return (
    <div style={{ marginBottom:14 }}>
      <label style={{ fontSize:12, fontWeight:500, color:'var(--text2)',
        marginBottom:6, display:'block', letterSpacing:.3 }}>{label}</label>
      {children}
    </div>
  )
}

export function Input({ ...props }) {
  return (
    <input {...props} style={{
      width:'100%', background:'var(--surface)', border:'1px solid var(--border)',
      borderRadius:8, padding:'10px 14px', color:'var(--text)', fontSize:13.5,
      fontFamily:'var(--font-body)', outline:'none', transition:'border-color .2s',
      ...props.style
    }}
    onFocus={e=>e.target.style.borderColor='var(--accent)'}
    onBlur={e=>e.target.style.borderColor='var(--border)'}
    />
  )
}

export function Select({ children, ...props }) {
  return (
    <select {...props} style={{
      width:'100%', background:'var(--surface)', border:'1px solid var(--border)',
      borderRadius:8, padding:'10px 14px', color:'var(--text)', fontSize:13.5,
      fontFamily:'var(--font-body)', outline:'none', appearance:'none',
      transition:'border-color .2s', ...props.style
    }}
    onFocus={e=>e.target.style.borderColor='var(--accent)'}
    onBlur={e=>e.target.style.borderColor='var(--border)'}
    >
      {children}
    </select>
  )
}

/* ── SUBMIT BUTTON ── */
export function SubmitBtn({ children, loading, onClick }) {
  return (
    <button onClick={onClick} disabled={loading} style={{
      width:'100%', padding:'12px', background:'var(--accent)', color:'var(--bg)',
      border:'none', borderRadius:10, fontSize:14, fontWeight:600,
      fontFamily:'var(--font-head)', cursor: loading ? 'not-allowed' : 'pointer',
      transition:'all .2s', marginTop:8, opacity: loading ? .7 : 1,
      display:'flex', alignItems:'center', justifyContent:'center', gap:8
    }}>
      {loading && <span style={{ width:16, height:16, border:'2px solid rgba(0,0,0,.3)',
        borderTopColor:'var(--bg)', borderRadius:'50%', animation:'spin .7s linear infinite', display:'inline-block' }}/>}
      {children}
    </button>
  )
}

/* ── TOAST ── */
let toastFn = null
export function useToast() {
  return { toast: toastFn }
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  toastFn = (msg, type='ok') => {
    const id = Date.now()
    setToasts(t => [...t, { id, msg, type }])
    setTimeout(() => setToasts(t => t.filter(x=>x.id!==id)), 3000)
  }
  return (
    <>
      {children}
      <div style={{ position:'fixed', bottom:24, right:24, zIndex:9000, display:'flex', flexDirection:'column', gap:8 }}>
        {toasts.map(t => (
          <div key={t.id} style={{
            background:'var(--surface2)', border:`1px solid ${t.type==='ok'?'rgba(74,230,150,.4)':'rgba(245,74,74,.4)'}`,
            borderRadius:12, padding:'12px 20px', fontSize:13,
            color: t.type==='ok'?'var(--accent)':'var(--red)',
            animation:'fadeUp .3s ease', boxShadow:'0 4px 20px rgba(0,0,0,.4)'
          }}>
            {t.msg}
          </div>
        ))}
      </div>
    </>
  )
}

/* ── LOADER ── */
export function Loader({ size=20 }) {
  return (
    <span style={{ width:size, height:size, border:'2px solid rgba(74,230,150,.3)',
      borderTopColor:'var(--accent)', borderRadius:'50%',
      animation:'spin .7s linear infinite', display:'inline-block' }}/>
  )
}

/* ── EMPTY STATE ── */
export function Empty({ title, sub, icon }) {
  return (
    <div style={{ textAlign:'center', padding:40, color:'var(--text3)' }}>
      {icon && <div style={{ fontSize:40, marginBottom:12, opacity:.3 }}>{icon}</div>}
      <div style={{ fontSize:15, fontWeight:500, color:'var(--text2)', marginBottom:4 }}>{title}</div>
      <div style={{ fontSize:13 }}>{sub}</div>
    </div>
  )
}

/* ── ALERT ITEM ── */
export function AlertItem({ color, children, time }) {
  const colors = { red:'var(--red)', orange:'var(--orange)', yellow:'var(--yellow)', green:'var(--accent)', blue:'var(--blue)' }
  return (
    <div style={{ display:'flex', gap:12, alignItems:'flex-start', padding:12, borderRadius:10,
      background:'var(--surface2)', border:'1px solid var(--border)', marginBottom:10 }}>
      <div style={{ width:8, height:8, borderRadius:'50%', background:colors[color]||colors.green,
        flexShrink:0, marginTop:3 }}/>
      <div>
        <div style={{ fontSize:13, color:'var(--text)', lineHeight:1.5 }}>{children}</div>
        {time && <div style={{ fontSize:11, color:'var(--text3)', marginTop:2 }}>{time}</div>}
      </div>
    </div>
  )
}
