import { useState, useEffect } from 'react'
import { Badge, ProgressBar, Btn, Empty, Modal, Card, CardTitle } from '../components/ui/index'

const API_APP_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'
const API_IA_URL = import.meta.env.VITE_IA_URL || 'http://127.0.0.1:8000'

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

function getAnnotatedImageUrl(path) {
  if (!path) return ''
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  return `${API_IA_URL}${path.startsWith('/') ? '' : '/'}${path}`
}

function isAnalyzed(c) {
  return Boolean(
    c?.derniereAnalyseAt ||
    (c?.dernierScore !== null && c?.dernierScore !== undefined) ||
    c?.derniereDecision ||
    c?.etatActuel
  )
}

function needsCleaning(c) {
  const d = String(c?.derniereDecision || c?.etatActuel || '').toLowerCase()
  return ['surveillance', 'attention', 'urgent', 'critique'].includes(d)
}

function getRecommendationText(score) {
  const s = Number(score || 0)

  if (s >= 75) {
    return `Surface encrassée : ${s.toFixed(1)}%. Intervention immédiate requise.`
  }

  if (s >= 50) {
    return `Surface encrassée : ${s.toFixed(1)}%. Nettoyage recommandé dans 2 semaines.`
  }

  if (s >= 25) {
    return `Surface encrassée : ${s.toFixed(1)}%. Prévoir un nettoyage prochainement.`
  }

  if (s > 0) {
    return `Surface encrassée : ${s.toFixed(1)}%. Prochain nettoyage dans 30 jours.`
  }

  return 'Aucun défaut détecté. Panneau propre.'
}

function MiniStat({ label, value, color }) {
  return (
    <div
      style={{
        padding: 14,
        borderRadius: 12,
        background: 'var(--surface)',
        border: '1px solid var(--border)',
      }}
    >
      <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ fontSize: 22, fontWeight: 800, color }}>
        {value}
      </div>
    </div>
  )
}

export default function Centrales({ centrales, search, onEdit, onDelete }) {
  const [detail, setDetail] = useState(null)

  const aNettoyer = centrales.filter(c => isAnalyzed(c) && needsCleaning(c)).length
  const pasEncoreAnalysees = centrales.filter(c => !isAnalyzed(c)).length
  const total = centrales.length

  const filtered = centrales.filter(c =>
    c.nom.toLowerCase().includes(search.toLowerCase()) ||
    (c.adresse || '').toLowerCase().includes(search.toLowerCase())
  )

  const showDetail = (c) => setDetail(c)

  return (
    <>
      <Card style={{ marginBottom: 16 }}>
        <CardTitle icon={<BellIcon />}>Résumé des centrales</CardTitle>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
            gap: 12,
            marginBottom: 4,
          }}
        >
          <MiniStat label="À nettoyer" value={aNettoyer} color="var(--orange)" />
          <MiniStat label="Pas encore analysées" value={pasEncoreAnalysees} color="var(--yellow)" />
          <MiniStat label="Total" value={total} color="var(--text)" />
        </div>
      </Card>

      <Card>
        <CardTitle icon={<BoltIcon />}>Liste des centrales photovoltaïques</CardTitle>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Nom', 'Localisation', 'Capacité', 'Efficacité', 'Statut', 'Dernier nettoyage', 'Actions'].map(h => (
                  <th
                    key={h}
                    style={{
                      textAlign: 'left',
                      padding: '10px 14px',
                      fontSize: 11,
                      fontWeight: 600,
                      color: 'var(--text3)',
                      letterSpacing: .8,
                      textTransform: 'uppercase',
                      borderBottom: '1px solid var(--border)'
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {filtered.map(c => (
                <tr
                  key={c._id}
                  onClick={() => showDetail(c)}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(74,230,150,0.04)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                  style={{
                    borderBottom: '1px solid rgba(74,230,150,0.05)',
                    cursor: 'pointer',
                    transition: 'background .15s'
                  }}
                >
                  <td style={{ padding: '12px 14px' }}>
                    <strong>{c.nom}</strong>
                  </td>

                  <td style={{ padding: '12px 14px', color: 'var(--text2)' }}>
                    {c.adresse || `${c.latitude?.toFixed(3)}, ${c.longitude?.toFixed(3)}`}
                  </td>

                  <td style={{ padding: '12px 14px' }}>{c.capacite} MW</td>

                  <td style={{ padding: '12px 14px' }}>
                    <ProgressBar value={c.etatEfficacite} />
                  </td>

                  <td style={{ padding: '12px 14px' }}>
                    <Badge statut={c.statut} />
                  </td>

                  <td style={{ padding: '12px 14px', color: 'var(--text2)', fontSize: 13 }}>
                    {c.dernierNettoyage ? new Date(c.dernierNettoyage).toLocaleDateString('fr-FR') : '—'}
                  </td>

                  <td style={{ padding: '12px 14px' }} onClick={e => e.stopPropagation()}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <Btn small variant="ghost" onClick={() => onEdit(c)}>Modifier</Btn>
                      <Btn small variant="danger" onClick={() => onDelete(c._id)}>Suppr.</Btn>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <Empty
              icon="⚡"
              title="Aucune centrale trouvée"
              sub={search ? 'Aucun résultat pour votre recherche' : 'Cliquez sur "Ajouter centrale" pour commencer'}
            />
          )}
        </div>
      </Card>

      <Modal open={!!detail} onClose={() => setDetail(null)} title="Détail de la centrale" width={760}>
        {detail && (
          <CentraleDetail
            c={detail}
            onEdit={() => {
              onEdit(detail)
              setDetail(null)
            }}
            onClose={() => setDetail(null)}
          />
        )}
      </Modal>
    </>
  )
}

function CentraleDetail({ c, onEdit, onClose }) {
  const [latestAnalysis, setLatestAnalysis] = useState(null)
  const [analysisLoading, setAnalysisLoading] = useState(false)

  const eff = c.etatEfficacite ?? 0
  const col = eff >= 80 ? 'var(--accent)' : eff >= 50 ? 'var(--yellow)' : 'var(--red)'
  const circ = 314.15
  const offset = circ * (1 - eff / 100)

  useEffect(() => {
    let cancelled = false

    const loadLatestAnalysis = async () => {
      const centralId = c?._id || c?.id
      if (!centralId) {
        setLatestAnalysis(null)
        return
      }

      try {
        setAnalysisLoading(true)

        const token = getAuthToken()
        const res = await fetch(`${API_APP_URL}/api/analysis/central/${centralId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })

        if (!res.ok) {
          throw new Error(`Erreur ${res.status}`)
        }

        const data = await res.json()

        if (!cancelled) {
          setLatestAnalysis(data?.analyses?.[0] || null)
        }
      } catch (err) {
        console.error('Erreur chargement dernière analyse:', err)
        if (!cancelled) setLatestAnalysis(null)
      } finally {
        if (!cancelled) setAnalysisLoading(false)
      }
    }

    loadLatestAnalysis()

    return () => {
      cancelled = true
    }
  }, [c])

  const decision = c?.derniereDecision || c?.etatActuel || latestAnalysis?.messageDecision || ''
  const decisionColor = getDecisionColor(decision)
  const analysisScore = Number(latestAnalysis?.scoreGlobal ?? c?.dernierScore ?? 0)

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 20 }}>
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 16,
            background: 'rgba(74,230,150,0.1)',
            border: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
          </svg>
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'var(--font-head)', fontSize: 22, fontWeight: 800, color: 'var(--text)' }}>
            {c.nom}
          </div>

          <div
            style={{
              fontSize: 13,
              color: 'var(--text2)',
              marginTop: 4,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              flexWrap: 'wrap'
            }}
          >
            {c.adresse || ''} <Badge statut={c.statut} />
          </div>
        </div>

        {decision && (
          <div
            style={{
              padding: '6px 12px',
              borderRadius: 999,
              fontSize: 12,
              fontWeight: 800,
              color: decisionColor,
              background: `${decisionColor}18`,
              border: `1px solid ${decisionColor}33`,
              whiteSpace: 'nowrap'
            }}
          >
            {getDecisionLabel(decision)}
          </div>
        )}
      </div>

      <div style={{ textAlign: 'center', margin: '16px 0' }}>
        <div style={{ display: 'inline-block', position: 'relative' }}>
          <svg width="120" height="120" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="50" fill="none" stroke="var(--surface2)" strokeWidth="10" />
            <circle
              cx="60"
              cy="60"
              r="50"
              fill="none"
              stroke={col}
              strokeWidth="10"
              strokeDasharray={circ}
              strokeDashoffset={offset}
              strokeLinecap="round"
              transform="rotate(-90 60 60)"
              style={{ transition: 'stroke-dashoffset 1s ease' }}
            />
          </svg>

          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <div style={{ fontFamily: 'var(--font-head)', fontSize: 28, fontWeight: 800, color: 'var(--text)' }}>
              {eff}%
            </div>
            <div style={{ fontSize: 11, color: 'var(--text3)' }}>Efficacité</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {[
          { label: 'Capacité', val: `${c.capacite} MW` },
          { label: 'Coordonnées GPS', val: `${c.latitude?.toFixed(4)}, ${c.longitude?.toFixed(4)}`, small: true },
          { label: 'Date installation', val: c.dateInstallation ? new Date(c.dateInstallation).toLocaleDateString('fr-FR') : '—' },
          { label: 'Dernier nettoyage', val: c.dernierNettoyage ? new Date(c.dernierNettoyage).toLocaleDateString('fr-FR') : 'Jamais' },
        ].map(item => (
          <div key={item.label} style={{ background: 'var(--surface2)', borderRadius: 10, padding: 14 }}>
            <div
              style={{
                fontSize: 11,
                color: 'var(--text3)',
                textTransform: 'uppercase',
                letterSpacing: .5,
                marginBottom: 6
              }}
            >
              {item.label}
            </div>
            <div style={{ fontSize: item.small ? 13 : 15, fontWeight: 600, color: 'var(--text)' }}>
              {item.val}
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          marginTop: 18,
          padding: 16,
          borderRadius: 14,
          background: 'var(--surface)',
          border: '1px solid var(--border)',
        }}
      >
        <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 14 }}>
          Résultat de la dernière analyse
        </div>

        {analysisLoading ? (
          <div style={{ color: 'var(--text3)', fontSize: 13 }}>
            Chargement de l’analyse...
          </div>
        ) : !latestAnalysis ? (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
              <InfoBox
                label="Score d’encrassement"
                value={`${c?.dernierScore ?? 0}%`}
              />
              <InfoBox
                label="Date d’analyse"
                value={
                  c?.derniereAnalyseAt
                    ? new Date(c.derniereAnalyseAt).toLocaleString('fr-FR')
                    : 'Inconnue'
                }
              />
            </div>

            <div
              style={{
                padding: 12,
                borderRadius: 12,
                background: 'rgba(245,131,74,0.08)',
                border: '1px solid rgba(245,131,74,0.20)',
                color: 'var(--text2)',
                marginBottom: c?.derniereImageAnnotee ? 14 : 0,
              }}
            >
              {getRecommendationText(analysisScore)}
            </div>

           
          </>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
              <InfoBox
                label="Score d’encrassement"
                value={`${latestAnalysis?.scoreGlobal ?? c?.dernierScore ?? 0}%`}
              />
              <InfoBox
                label="Date d’analyse"
                value={
                  latestAnalysis?.createdAt
                    ? new Date(latestAnalysis.createdAt).toLocaleString('fr-FR')
                    : c?.derniereAnalyseAt
                    ? new Date(c.derniereAnalyseAt).toLocaleString('fr-FR')
                    : 'Inconnue'
                }
              />
            </div>

            <div style={{ marginBottom: 14 }}>
              {[
                { key: 'Physical', label: 'Dommage (Physical)' },
                { key: 'dust', label: 'Poussière (dust)' },
                { key: 'bird', label: 'Fientes (bird)' },
                { key: 'leaf', label: 'Feuilles (leaf)' },
                { key: 'snow', label: 'Neige/Sable (snow)' },
              ].map(item => {
                const value = Number(latestAnalysis?.classPercentages?.[item.key] || 0)

                return (
                  <div key={item.key} style={{ marginBottom: 10 }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: 12,
                        marginBottom: 5,
                        color: 'var(--text2)',
                      }}
                    >
                      <span>{item.label}</span>
                      <span>{value.toFixed(1)}%</span>
                    </div>

                    <div
                      style={{
                        height: 6,
                        borderRadius: 999,
                        background: 'var(--surface2)',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          width: `${Math.min(value, 100)}%`,
                          height: '100%',
                          borderRadius: 999,
                          background:
                            item.key === 'Physical'
                              ? 'var(--red)'
                              : value >= 40
                              ? 'var(--orange)'
                              : 'var(--accent)',
                        }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>

            <div
              style={{
                padding: 12,
                borderRadius: 12,
                background: 'rgba(245,131,74,0.08)',
                border: '1px solid rgba(245,131,74,0.20)',
                color: 'var(--text2)',
                marginBottom: latestAnalysis?.imageAnnotee ? 14 : 0,
              }}
            >
              {getRecommendationText(analysisScore)}
            </div>

          
          </>
        )}
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
        <Btn variant="secondary" onClick={onEdit} style={{ flex: 1 }}>Modifier</Btn>
        <Btn variant="primary" onClick={onClose} style={{ flex: 1 }}>Fermer</Btn>
      </div>
    </>
  )
}

function InfoBox({ label, value }) {
  return (
    <div style={{ padding: 14, borderRadius: 12, background: 'var(--surface2)', border: '1px solid var(--border)' }}>
      <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)' }}>
        {value}
      </div>
    </div>
  )
}

function getDecisionColor(decision = '') {
  const d = String(decision).toLowerCase()
  if (d === 'critique') return 'var(--red)'
  if (d === 'urgent') return 'var(--orange)'
  if (d === 'surveillance' || d === 'attention') return 'var(--yellow)'
  return 'var(--accent)'
}

function getDecisionLabel(decision = '') {
  const d = String(decision).toLowerCase()
  if (d === 'critique') return 'CRITIQUE'
  if (d === 'urgent') return 'URGENT'
  if (d === 'surveillance' || d === 'attention') return 'SURVEILLANCE'
  return 'ÉTAT CORRECT'
}

function BellIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  )
}

function BoltIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  )
}