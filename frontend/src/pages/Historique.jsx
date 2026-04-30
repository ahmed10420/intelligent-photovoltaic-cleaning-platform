import { useEffect, useMemo, useState } from 'react'
import { Card, CardTitle, Empty, Select } from '../components/ui/index'

const API_APP_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

function getAuthToken() {
  const cpvToken = localStorage.getItem('cpv_token')
  if (cpvToken) return cpvToken

  const directToken = localStorage.getItem('token')
  if (directToken) return directToken

  try {
    const cpvUser = JSON.parse(localStorage.getItem('cpv_user') || 'null')
    if (cpvUser?.token) return cpvUser.token
  } catch {}

  try {
    const user = JSON.parse(localStorage.getItem('user') || 'null')
    if (user?.token) return user.token
  } catch {}

  return ''
}

function formatDate(value) {
  if (!value) return 'Date inconnue'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return 'Date inconnue'
  return d.toLocaleString('fr-FR')
}

function getSeverityColor(level = '') {
  const d = String(level).toLowerCase()
  if (d === 'critique') return 'var(--red)'
  if (d === 'urgent') return 'var(--orange)'
  if (d === 'surveillance' || d === 'attention') return 'var(--yellow)'
  return 'var(--accent)'
}

function getCleaningTypeLabel(type = '') {
  const t = String(type).toLowerCase()
  if (t === 'urgent') return 'Urgent'
  if (t === 'planifie') return 'Planifié'
  return 'Manuel'
}

export default function Historique({ centrales = [] }) {
  const [tab, setTab] = useState('analyses')
  const [selectedCentral, setSelectedCentral] = useState('')
  const [analyses, setAnalyses] = useState([])
  const [cleanings, setCleanings] = useState([])
  const [loadingAnalyses, setLoadingAnalyses] = useState(true)
  const [loadingCleanings, setLoadingCleanings] = useState(true)

  useEffect(() => {
    let cancelled = false

    const loadAnalyses = async () => {
      try {
        setLoadingAnalyses(true)
        const token = getAuthToken()

        const res = await fetch(`${API_APP_URL}/api/analysis`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })

        if (!res.ok) throw new Error(`Erreur ${res.status}`)

        const data = await res.json()

        if (!cancelled) {
          setAnalyses(Array.isArray(data?.analyses) ? data.analyses : [])
        }
      } catch (err) {
        console.error('Erreur chargement historique analyses:', err)
        if (!cancelled) setAnalyses([])
      } finally {
        if (!cancelled) setLoadingAnalyses(false)
      }
    }

    const loadCleanings = async () => {
      try {
        setLoadingCleanings(true)
        const token = getAuthToken()

        const res = await fetch(`${API_APP_URL}/api/cleanings`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })

        if (!res.ok) throw new Error(`Erreur ${res.status}`)

        const data = await res.json()

        if (!cancelled) {
          setCleanings(Array.isArray(data?.cleanings) ? data.cleanings : [])
        }
      } catch (err) {
        console.error('Erreur chargement historique nettoyages:', err)
        if (!cancelled) setCleanings([])
      } finally {
        if (!cancelled) setLoadingCleanings(false)
      }
    }

    loadAnalyses()
    loadCleanings()

    return () => {
      cancelled = true
    }
  }, [])

  const filteredAnalyses = useMemo(() => {
    return analyses.filter((a) => {
      if (!selectedCentral) return true
      const cid = a?.centralId?._id || a?.centralId
      return cid === selectedCentral
    })
  }, [analyses, selectedCentral])

  const filteredCleanings = useMemo(() => {
    return cleanings.filter((c) => {
      if (!selectedCentral) return true
      const cid = c?.centralId?._id || c?.centralId
      return cid === selectedCentral
    })
  }, [cleanings, selectedCentral])

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <CardTitle icon={<HistoryIcon />}>Historique global</CardTitle>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => setTab('analyses')}
              style={tab === 'analyses' ? activeTabBtn : tabBtn}
            >
              Analyses
            </button>

            <button
              onClick={() => setTab('nettoyages')}
              style={tab === 'nettoyages' ? activeTabBtn : tabBtn}
            >
              Nettoyages
            </button>
          </div>

          <div style={{ minWidth: 240 }}>
            <Select value={selectedCentral} onChange={(e) => setSelectedCentral(e.target.value)}>
              <option value="">Toutes les centrales</option>
              {centrales.map((c) => (
                <option key={c._id || c.id} value={c._id || c.id}>
                  {c.nom}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </Card>

      {tab === 'analyses' ? (
        <Card>
          <CardTitle icon={<ChartIcon />}>Historique des analyses</CardTitle>

          {loadingAnalyses ? (
            <div style={{ color: 'var(--text3)', fontSize: 13 }}>Chargement...</div>
          ) : filteredAnalyses.length === 0 ? (
            <Empty icon="🧠" title="Aucune analyse" sub="Aucune analyse trouvée pour cette sélection" />
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['Date', 'Centrale', 'Score', 'Niveau', 'Défauts', 'Modèle'].map((h) => (
                      <th
                        key={h}
                        style={{
                          textAlign: 'left',
                          padding: '10px 14px',
                          fontSize: 11,
                          fontWeight: 600,
                          color: 'var(--text3)',
                          letterSpacing: 0.8,
                          textTransform: 'uppercase',
                          borderBottom: '1px solid var(--border)',
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {filteredAnalyses.map((a) => {
                    const level = a?.messageDecision || ''
                    const levelColor = getSeverityColor(level)

                    return (
                      <tr key={a._id} style={{ borderBottom: '1px solid rgba(74,230,150,0.05)' }}>
                        <td style={{ padding: '12px 14px', color: 'var(--text2)' }}>
                          {formatDate(a?.createdAt)}
                        </td>
                        <td style={{ padding: '12px 14px', color: 'var(--text)' }}>
                          {a?.centralId?.nom || 'Centrale'}
                        </td>
                        <td style={{ padding: '12px 14px', color: 'var(--text)' }}>
                          {Number(a?.scoreGlobal || 0).toFixed(1)}%
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <span
                            style={{
                              color: levelColor,
                              background: `${levelColor}18`,
                              border: `1px solid ${levelColor}33`,
                              padding: '4px 10px',
                              borderRadius: 999,
                              fontSize: 12,
                              fontWeight: 700,
                              display: 'inline-block',
                            }}
                          >
                            {level || 'etat correct'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px', color: 'var(--text2)' }}>
                          {Number(a?.defectsCount || 0)}
                        </td>
                        <td style={{ padding: '12px 14px', color: 'var(--text2)' }}>
                          {a?.modelName || 'YOLO'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      ) : (
        <Card>
          <CardTitle icon={<CleanIcon />}>Historique des nettoyages</CardTitle>

          {loadingCleanings ? (
            <div style={{ color: 'var(--text3)', fontSize: 13 }}>Chargement...</div>
          ) : filteredCleanings.length === 0 ? (
            <Empty icon="🧼" title="Aucun nettoyage" sub="Aucun nettoyage trouvé pour cette sélection" />
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['Date', 'Centrale', 'Type', 'Score avant', 'Remarque'].map((h) => (
                      <th
                        key={h}
                        style={{
                          textAlign: 'left',
                          padding: '10px 14px',
                          fontSize: 11,
                          fontWeight: 600,
                          color: 'var(--text3)',
                          letterSpacing: 0.8,
                          textTransform: 'uppercase',
                          borderBottom: '1px solid var(--border)',
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {filteredCleanings.map((c) => (
                    <tr key={c._id} style={{ borderBottom: '1px solid rgba(74,230,150,0.05)' }}>
                      <td style={{ padding: '12px 14px', color: 'var(--text2)' }}>
                        {formatDate(c?.dateNettoyage)}
                      </td>
                      <td style={{ padding: '12px 14px', color: 'var(--text)' }}>
                        {c?.centralId?.nom || 'Centrale'}
                      </td>
                      <td style={{ padding: '12px 14px', color: 'var(--text2)' }}>
                        {getCleaningTypeLabel(c?.typeNettoyage)}
                      </td>
                      <td style={{ padding: '12px 14px', color: 'var(--text)' }}>
                        {c?.scoreAvant === null || c?.scoreAvant === undefined
                          ? '—'
                          : `${Number(c.scoreAvant).toFixed(1)}%`}
                      </td>
                      <td style={{ padding: '12px 14px', color: 'var(--text2)' }}>
                        {c?.remarque || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}
    </div>
  )
}

const tabBtn = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  color: 'var(--text2)',
  padding: '8px 14px',
  borderRadius: 10,
  cursor: 'pointer',
  fontSize: 13,
  fontWeight: 600,
}

const activeTabBtn = {
  ...tabBtn,
  background: 'rgba(74,230,150,0.08)',
  color: 'var(--accent)',
  border: '1px solid var(--border)',
}

function HistoryIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 3v5h5" />
      <path d="M3.05 13A9 9 0 1 0 6 5.3L3 8" />
      <path d="M12 7v5l4 2" />
    </svg>
  )
}

function ChartIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M23 6l-9.5 9.5-5-5L1 18" />
      <path d="M17 6h6v6" />
    </svg>
  )
}

function CleanIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 21h18" />
      <path d="M5 21V8l7-5 7 5v13" />
      <path d="M9 21v-6h6v6" />
    </svg>
  )
}