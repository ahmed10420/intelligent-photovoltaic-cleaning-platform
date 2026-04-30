import { Card, CardTitle } from '../components/ui/index'

function formatDate(value) {
  if (!value) return 'Date inconnue'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return 'Date inconnue'
  return d.toLocaleString('fr-FR')
}

function isAnalyzed(c) {
  return Boolean(
    c?.derniereAnalyseAt ||
    (c?.dernierScore !== null && c?.dernierScore !== undefined) ||
    c?.derniereDecision ||
    c?.etatActuel
  )
}

function isUrgent(c) {
  const d = String(c?.derniereDecision || c?.etatActuel || '').toLowerCase()
  return d === 'urgent' || d === 'critique'
}

function getBadge(decision = '') {
  const d = String(decision).toLowerCase()

  if (d === 'critique') {
    return {
      label: 'CRITIQUE',
      color: 'var(--red)',
      bg: 'rgba(245,74,74,0.10)',
      border: 'rgba(245,74,74,0.28)',
    }
  }

  return {
    label: 'URGENT',
    color: 'var(--orange)',
    bg: 'rgba(245,131,74,0.10)',
    border: 'rgba(245,131,74,0.28)',
  }
}

function AlertBlock({ color, bg, border, badge, title, subtitle, text }) {
  return (
    <div
      style={{
        marginBottom: 14,
        padding: 16,
        borderRadius: 12,
        background: bg,
        border: `1px solid ${border}`,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: 12,
          alignItems: 'flex-start',
          marginBottom: 8,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>
            {title}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4 }}>
            {subtitle}
          </div>
        </div>

        <div
          style={{
            padding: '5px 10px',
            borderRadius: 999,
            fontSize: 11,
            fontWeight: 800,
            color,
            background: `${color}18`,
            border: `1px solid ${color}33`,
            whiteSpace: 'nowrap',
          }}
        >
          {badge}
        </div>
      </div>

      <div style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--text2)' }}>
        {text}
      </div>
    </div>
  )
}

export default function Alertes({ centrales = [] }) {
  const urgentes = [...centrales]
    .filter((c) => isAnalyzed(c) && isUrgent(c))
    .sort((a, b) => {
      const da = a?.derniereAnalyseAt ? new Date(a.derniereAnalyseAt).getTime() : 0
      const db = b?.derniereAnalyseAt ? new Date(b.derniereAnalyseAt).getTime() : 0
      return db - da
    })

  const notAnalysed = [...centrales]
    .filter((c) => !isAnalyzed(c))
    .sort((a, b) => (a?.nom || '').localeCompare(b?.nom || '', 'fr'))

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <CardTitle icon={<WaveIcon />}>Centrales à nettoyer</CardTitle>

        {urgentes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 20, color: 'var(--text3)', fontSize: 13 }}>
            Aucune centrale urgente pour le moment.
          </div>
        ) : (
          urgentes.map((c) => {
            const badge = getBadge(c?.derniereDecision || c?.etatActuel)

            return (
              <AlertBlock
                key={c._id || c.id}
                color={badge.color}
                bg={badge.bg}
                border={badge.border}
                badge={badge.label}
                title={c.nom}
                subtitle={`Dernière analyse : ${formatDate(c.derniereAnalyseAt)}`}
                text={`Nettoyage requis. Score d’encrassement = ${c?.dernierScore ?? 0}%. Efficacité estimée = ${c?.etatEfficacite ?? 0}%.`}
              />
            )
          })
        )}
      </Card>

      <Card>
        <CardTitle icon={<ClockIcon />}>Centrales non encore analysées</CardTitle>

        {notAnalysed.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 20, color: 'var(--text3)', fontSize: 13 }}>
            Toutes les centrales ont déjà été analysées.
          </div>
        ) : (
          notAnalysed.map((c) => (
            <AlertBlock
              key={c._id || c.id}
              color="var(--yellow)"
              bg="rgba(245,216,66,0.10)"
              border="rgba(245,216,66,0.28)"
              badge="EN ATTENTE"
              title={c.nom}
              subtitle={`Statut : ${c?.statut || 'actif'}`}
              text="Cette centrale n’a pas encore été analysée."
            />
          ))
        )}
      </Card>
    </div>
  )
}

function WaveIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  )
}

function ClockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <polyline points="12 7 12 12 15 15" />
    </svg>
  )
}