import { useMemo, useState } from 'react'
import { Card, CardTitle, Empty, Select } from '../components/ui/index'

function isAnalyzed(c) {
  return Boolean(
    c?.derniereAnalyseAt ||
    (c?.dernierScore !== null && c?.dernierScore !== undefined) ||
    c?.derniereDecision ||
    c?.etatActuel
  )
}

function getDecision(c) {
  return String(c?.derniereDecision || c?.etatActuel || '').toLowerCase()
}

function getDecisionRank(decision = '') {
  const d = String(decision).toLowerCase()
  if (d === 'critique') return 4
  if (d === 'urgent') return 3
  if (d === 'surveillance' || d === 'attention') return 2
  if (d === 'etat correct') return 1
  return 0
}

function getDecisionLabel(decision = '') {
  const d = String(decision).toLowerCase()
  if (d === 'critique') return 'CRITIQUE'
  if (d === 'urgent') return 'URGENT'
  if (d === 'surveillance' || d === 'attention') return 'SURVEILLANCE'
  if (d === 'etat correct') return 'ÉTAT CORRECT'
  return 'NON ANALYSÉE'
}

function getDecisionColor(decision = '') {
  const d = String(decision).toLowerCase()
  if (d === 'critique') return 'var(--red)'
  if (d === 'urgent') return 'var(--orange)'
  if (d === 'surveillance' || d === 'attention') return 'var(--yellow)'
  if (d === 'etat correct') return 'var(--accent)'
  return 'var(--text3)'
}

function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Number(value) || 0))
}

function getDaysSinceCleaning(dateValue) {
  if (!dateValue) return null

  const d = new Date(dateValue)
  if (Number.isNaN(d.getTime())) return null

  return Math.max(0, Math.floor((Date.now() - d.getTime()) / 86400000))
}

function getAncienneteNettoyageScore(dateValue) {
  const days = getDaysSinceCleaning(dateValue)

  if (days === null) return 100
  return clamp((days / 90) * 100)
}

function getCapaciteNormalisee(capacite, maxCapacity) {
  if (!maxCapacity) return 0
  return clamp((Number(capacite || 0) / maxCapacity) * 100)
}

function computePriorityScore(c, maxCapacity) {
  const encrassement = clamp(c?.dernierScore || 0)
  const ancienneteNettoyage = getAncienneteNettoyageScore(c?.dernierNettoyage)
  const capaciteNormalisee = getCapaciteNormalisee(c?.capacite, maxCapacity)

  const score =
    0.7 * encrassement +
    0.2 * ancienneteNettoyage +
    0.1 * capaciteNormalisee

  return Math.round(score * 10) / 10
}

function buildPriorityRows(centrales = []) {
  const analyzed = centrales.filter(isAnalyzed)
  const maxCapacity = Math.max(...analyzed.map((c) => Number(c?.capacite || 0)), 0)

  return analyzed
    .map((c) => {
      const decision = getDecision(c)
      const priorityScore = computePriorityScore(c, maxCapacity)
      const daysSinceCleaning = getDaysSinceCleaning(c?.dernierNettoyage)

      return {
        ...c,
        decision,
        decisionRank: getDecisionRank(decision),
        priorityScore,
        daysSinceCleaning,
        encrassement: clamp(c?.dernierScore || 0),
        ancienneteScore: getAncienneteNettoyageScore(c?.dernierNettoyage),
        capaciteNormalisee: getCapaciteNormalisee(c?.capacite, maxCapacity),
      }
    })
    .sort((a, b) => {
      if (b.decisionRank !== a.decisionRank) {
        return b.decisionRank - a.decisionRank
      }

      if (b.priorityScore !== a.priorityScore) {
        return b.priorityScore - a.priorityScore
      }

      if (b.encrassement !== a.encrassement) {
        return b.encrassement - a.encrassement
      }

      return Number(b.capacite || 0) - Number(a.capacite || 0)
    })
}

export default function Priorisation({ centrales = [], search = '' }) {
  const [filterDecision, setFilterDecision] = useState('')

  const analyzedRows = useMemo(() => buildPriorityRows(centrales), [centrales])

  const filteredRows = useMemo(() => {
    return analyzedRows.filter((c) => {
      const matchSearch =
        !search ||
        String(c?.nom || '').toLowerCase().includes(search.toLowerCase()) ||
        String(c?.adresse || '').toLowerCase().includes(search.toLowerCase())

      const matchDecision = !filterDecision || c.decision === filterDecision

      return matchSearch && matchDecision
    })
  }, [analyzedRows, search, filterDecision])

  const nonAnalyzed = useMemo(() => {
    return centrales.filter((c) => {
      const matchSearch =
        !search ||
        String(c?.nom || '').toLowerCase().includes(search.toLowerCase()) ||
        String(c?.adresse || '').toLowerCase().includes(search.toLowerCase())

      return !isAnalyzed(c) && matchSearch
    })
  }, [centrales, search])

  const top3 = filteredRows.slice(0, 3)

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <CardTitle icon={<RankIcon />}>Priorisation intelligente des nettoyages</CardTitle>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ minWidth: 220 }}>
            <Select value={filterDecision} onChange={(e) => setFilterDecision(e.target.value)}>
              <option value="">Tous les niveaux</option>
              <option value="critique">Critique</option>
              <option value="urgent">Urgent</option>
              <option value="surveillance">Surveillance</option>
              <option value="etat correct">État correct</option>
            </Select>
          </div>
        </div>

        <div
          style={{
            marginTop: 14,
            padding: 12,
            borderRadius: 12,
            background: 'rgba(74,230,150,0.08)',
            border: '1px solid rgba(74,230,150,0.18)',
            color: 'var(--text2)',
            fontSize: 13,
            lineHeight: 1.7,
          }}
        >
          <strong>Tri 1 :</strong> critique &gt; urgent &gt; surveillance &gt; état correct
          <br />
          <strong>Tri 2 :</strong> ScorePriorité = 0.7 × Encrassement + 0.2 × AnciennetéNettoyage + 0.1 × CapacitéNormalisée
        </div>
      </Card>

      <Card style={{ marginBottom: 16 }}>
        <CardTitle icon={<StarIcon />}>Top 3 des centrales à traiter</CardTitle>

        {top3.length === 0 ? (
          <Empty icon="📌" title="Aucune priorité disponible" sub="Aucune centrale ne correspond aux filtres." />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12 }}>
            {top3.map((c, index) => (
              <div
                key={c._id || c.id}
                style={{
                  padding: 16,
                  borderRadius: 14,
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                }}
              >
                <div
                  style={{
                    fontSize: 12,
                    color: 'var(--text3)',
                    marginBottom: 6,
                    textTransform: 'uppercase',
                    letterSpacing: 0.8,
                  }}
                >
                  Rang #{index + 1}
                </div>

                <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)', marginBottom: 6 }}>
                  {c.nom}
                </div>

                <div
                  style={{
                    display: 'inline-block',
                    padding: '4px 10px',
                    borderRadius: 999,
                    fontSize: 12,
                    fontWeight: 800,
                    color: getDecisionColor(c.decision),
                    background: `${getDecisionColor(c.decision)}18`,
                    border: `1px solid ${getDecisionColor(c.decision)}33`,
                    marginBottom: 10,
                  }}
                >
                  {getDecisionLabel(c.decision)}
                </div>

                <div style={{ fontSize: 28, fontWeight: 900, color: 'var(--accent)', marginBottom: 8 }}>
                  {c.priorityScore}
                </div>

                <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6 }}>
                  Encrassement : {c.encrassement}%
                  <br />
                  Capacité : {Number(c?.capacite || 0)} MW
                  <br />
                  Dernier nettoyage :{' '}
                  {c.daysSinceCleaning === null ? 'Jamais' : `${c.daysSinceCleaning} jour(s)`}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card style={{ marginBottom: 16 }}>
        <CardTitle icon={<TableIcon />}>Classement complet des centrales</CardTitle>

        {filteredRows.length === 0 ? (
          <Empty icon="📊" title="Aucune donnée" sub="Aucune centrale à classer avec les filtres actuels." />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {[
                    'Rang',
                    'Centrale',
                    'Score priorité',
                    'Encrassement',
                    'Capacité',
                    'Dernier nettoyage',
                    'Niveau',
                  ].map((h) => (
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
                {filteredRows.map((c, index) => (
                  <tr key={c._id || c.id} style={{ borderBottom: '1px solid rgba(74,230,150,0.05)' }}>
                    <td style={{ padding: '12px 14px', color: 'var(--text)', fontWeight: 700 }}>
                      #{index + 1}
                    </td>
                    <td style={{ padding: '12px 14px', color: 'var(--text)' }}>
                      {c.nom}
                    </td>
                    <td style={{ padding: '12px 14px', color: 'var(--accent)', fontWeight: 800 }}>
                      {c.priorityScore}
                    </td>
                    <td style={{ padding: '12px 14px', color: 'var(--text2)' }}>
                      {c.encrassement}%
                    </td>
                    <td style={{ padding: '12px 14px', color: 'var(--text2)' }}>
                      {Number(c?.capacite || 0)} MW
                    </td>
                    <td style={{ padding: '12px 14px', color: 'var(--text2)' }}>
                      {c.daysSinceCleaning === null ? 'Jamais' : `${c.daysSinceCleaning} jour(s)`}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span
                        style={{
                          color: getDecisionColor(c.decision),
                          background: `${getDecisionColor(c.decision)}18`,
                          border: `1px solid ${getDecisionColor(c.decision)}33`,
                          padding: '4px 10px',
                          borderRadius: 999,
                          fontSize: 12,
                          fontWeight: 700,
                          display: 'inline-block',
                        }}
                      >
                        {getDecisionLabel(c.decision)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card>
        <CardTitle icon={<ClockIcon />}>Centrales non encore analysées</CardTitle>

        {nonAnalyzed.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 24, color: 'var(--text3)', fontSize: 14 }}>
            Toutes les centrales ont déjà été analysées.
          </div>
        ) : (
          nonAnalyzed.map((c) => (
            <div
              key={c._id || c.id}
              style={{
                padding: 16,
                borderRadius: 14,
                background: 'rgba(245,216,66,0.08)',
                border: '1px solid rgba(245,216,66,0.20)',
                marginBottom: 12,
              }}
            >
              <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)', marginBottom: 6 }}>
                {c.nom}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 8 }}>
                Statut : {c.statut || 'actif'}
              </div>
              <div style={{ fontSize: 14, color: 'var(--text2)' }}>
                Cette centrale n’a pas encore été analysée. Elle n’entre pas dans la priorisation intelligente.
              </div>
            </div>
          ))
        )}
      </Card>
    </div>
  )
}

function RankIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 20V10" />
      <path d="M18 20V4" />
      <path d="M6 20v-6" />
    </svg>
  )
}

function StarIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="12 2 15 9 22 9 17 14 19 21 12 17 5 21 7 14 2 9 9 9 12 2" />
    </svg>
  )
}

function TableIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <line x1="3" y1="9" x2="21" y2="9" />
      <line x1="9" y1="21" x2="9" y2="9" />
    </svg>
  )
}

function ClockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  )
}