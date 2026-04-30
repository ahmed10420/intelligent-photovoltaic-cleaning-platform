import { useEffect, useRef, useState } from 'react'
import { Btn } from '../ui/index'

const titles = {
  dashboard: 'Tableau de bord',
  carte: 'Carte interactive',
  centrales: 'Centrales CPV',
  analyse: "Analyse d'images IA",
  rapports: 'Rapports & Statistiques',
  priorisation: 'Priorisation des nettoyages',
  historique: 'Historique global',
  alertes: 'Alertes & Notifications',
}

export default function Topbar({
  page,
  onAdd,
  onExportExcel,
  onExportPDF,
  onNav,
  search,
  onSearch,
}) {
  const [openExport, setOpenExport] = useState(false)
  const exportRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (exportRef.current && !exportRef.current.contains(event.target)) {
        setOpenExport(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <header
      style={{
        height: 56,
        background: 'var(--bg2)',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 24px',
        gap: 14,
        flexShrink: 0,
      }}
    >
      <div
        style={{
          fontFamily: 'var(--font-head)',
          fontSize: 17,
          fontWeight: 700,
          color: 'var(--text)',
          flex: 1,
        }}
      >
        {titles[page] || page}
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 8,
          padding: '6px 12px',
          width: 220,
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth="2">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Rechercher..."
          style={{
            background: 'none',
            border: 'none',
            outline: 'none',
            color: 'var(--text)',
            fontSize: 13,
            fontFamily: 'var(--font-body)',
            width: '100%',
          }}
        />
      </div>

      <div ref={exportRef} style={{ position: 'relative' }}>
        <Btn variant="secondary" onClick={() => setOpenExport((v) => !v)}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Exporter
        </Btn>

        {openExport && (
          <div
            style={{
              position: 'absolute',
              top: 44,
              right: 0,
              minWidth: 180,
              background: 'var(--bg2)',
              border: '1px solid var(--border)',
              borderRadius: 10,
              boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
              overflow: 'hidden',
              zIndex: 200,
            }}
          >
            <button
              onClick={() => {
                setOpenExport(false)
                onExportExcel()
              }}
              style={menuBtnStyle}
            >
              Export Excel (.xlsx)
            </button>

            <button
              onClick={() => {
                setOpenExport(false)
                onExportPDF()
              }}
              style={{ ...menuBtnStyle, borderTop: '1px solid var(--border)' }}
            >
              Export PDF (.pdf)
            </button>
          </div>
        )}
      </div>

      <Btn variant="primary" onClick={onAdd}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        Ajouter centrale
      </Btn>

      <div
        onClick={() => onNav('alertes')}
        style={{
          width: 36,
          height: 36,
          borderRadius: 8,
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 7,
            right: 7,
            width: 7,
            height: 7,
            borderRadius: '50%',
            background: 'var(--orange)',
            border: '1.5px solid var(--bg2)',
          }}
        />
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text2)" strokeWidth="2">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
      </div>
    </header>
  )
}

const menuBtnStyle = {
  width: '100%',
  background: 'transparent',
  border: 'none',
  color: 'var(--text)',
  textAlign: 'left',
  padding: '12px 14px',
  cursor: 'pointer',
  fontSize: 13,
  fontFamily: 'var(--font-body)',
}