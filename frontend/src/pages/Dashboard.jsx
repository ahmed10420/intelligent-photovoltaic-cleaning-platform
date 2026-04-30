import { useEffect, useRef } from 'react'
import { Chart, registerables } from 'chart.js'
import { StatCard, Card, CardTitle, AlertItem } from '../components/ui/index'

Chart.register(...registerables)

function isAnalyzed(c) {
  return Boolean(
    c?.derniereAnalyseAt ||
    (c?.dernierScore !== null && c?.dernierScore !== undefined) ||
    c?.derniereDecision ||
    c?.etatActuel
  )
}

function getAlertColor(decision = '') {
  const d = String(decision).toLowerCase()
  if (d === 'critique') return 'red'
  if (d === 'urgent') return 'orange'
  if (d === 'surveillance' || d === 'attention') return 'yellow'
  return 'green'
}

function formatRelativeDate(value) {
  if (!value) return 'Date inconnue'

  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return 'Date inconnue'

  const now = new Date()
  const diffMs = now - d
  const diffMin = Math.floor(diffMs / 60000)
  const diffH = Math.floor(diffMs / 3600000)
  const diffD = Math.floor(diffMs / 86400000)

  if (diffMin < 1) return "À l'instant"
  if (diffMin < 60) return `Il y a ${diffMin} min`
  if (diffH < 24) return `Il y a ${diffH} h`
  if (diffD === 1) return 'Hier'
  if (diffD < 7) return `Il y a ${diffD} jours`

  return d.toLocaleDateString('fr-FR')
}

function buildRecentAlerts(centrales = []) {
  return centrales
    .filter((c) => {
      if (
        !(
          c?.derniereAnalyseAt ||
          (c?.dernierScore !== null && c?.dernierScore !== undefined) ||
          c?.derniereDecision ||
          c?.etatActuel
        )
      ) {
        return false
      }

      const decision = String(c?.derniereDecision || c?.etatActuel || '').toLowerCase()
      return decision === 'urgent' || decision === 'critique'
    })
    .map((c) => {
      const decision = String(c?.derniereDecision || c?.etatActuel || '').toLowerCase()
      const score = Number(c?.dernierScore || 0)
      const time = formatRelativeDate(c?.derniereAnalyseAt)

      return {
        id: c._id || c.id || c.nom,
        text:
          decision === 'critique'
            ? `Intervention critique — ${c.nom} (${score}%)`
            : `Nettoyage requis — ${c.nom} (${score}%)`,
        time,
        color: decision === 'critique' ? 'red' : 'orange',
        sortDate: c?.derniereAnalyseAt ? new Date(c.derniereAnalyseAt).getTime() : 0,
      }
    })
    .sort((a, b) => b.sortDate - a.sortDate)
    .slice(0, 5)
}

export default function Dashboard({ centrales }) {
  const effRef = useRef()
  const statRef = useRef()
  const effChart = useRef()
  const statChart = useRef()

  const total = centrales.length
  const actives = centrales.filter(c => c.statut === 'actif').length
  const maint = centrales.filter(c => c.statut === 'maintenance').length
  const inact = centrales.filter(c => c.statut === 'inactif').length
  const eff = total ? Math.round(centrales.reduce((a, c) => a + c.etatEfficacite, 0) / total) : 0
  const cap = centrales.reduce((a, c) => a + c.capacite, 0).toFixed(1)

  const recentAlerts = buildRecentAlerts(centrales)

  useEffect(() => {
    if (!centrales.length) return

    if (effChart.current) effChart.current.destroy()
    effChart.current = new Chart(effRef.current, {
      type: 'bar',
      data: {
        labels: centrales.map(c => c.nom.replace('Centrale ', '')),
        datasets: [{
          label: 'Efficacité %',
          data: centrales.map(c => c.etatEfficacite),
          backgroundColor: centrales.map(c =>
            c.etatEfficacite >= 80 ? 'rgba(74,230,150,0.75)'
              : c.etatEfficacite >= 50 ? 'rgba(245,216,66,0.75)'
                : 'rgba(245,74,74,0.75)'),
          borderRadius: 6,
          borderSkipped: false,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: { legend: { display: false } },
        scales: {
          x: {
            ticks: { color: '#8aab97', font: { size: 11 } },
            grid: { color: 'rgba(74,230,150,0.05)' }
          },
          y: {
            min: 0,
            max: 100,
            ticks: { color: '#8aab97', font: { size: 11 } },
            grid: { color: 'rgba(74,230,150,0.07)' }
          }
        }
      }
    })

    if (statChart.current) statChart.current.destroy()
    statChart.current = new Chart(statRef.current, {
      type: 'doughnut',
      data: {
        labels: ['Actives', 'Maintenance', 'Inactives'],
        datasets: [{
          data: [actives, maint, inact],
          backgroundColor: [
            'rgba(74,230,150,0.8)',
            'rgba(245,216,66,0.8)',
            'rgba(245,74,74,0.8)'
          ],
          borderColor: '#141c18',
          borderWidth: 3,
        }]
      },
      options: {
        responsive: true,
        cutout: '68%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: '#8aab97', font: { size: 12 }, padding: 12 }
          }
        }
      }
    })

    return () => {
      effChart.current?.destroy()
      statChart.current?.destroy()
    }
  }, [centrales, actives, maint, inact])

  const sorted = [...centrales].sort(
    (a, b) => new Date(b.dernierNettoyage || 0) - new Date(a.dernierNettoyage || 0)
  )

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 20 }}>
        <StatCard label="Centrales totales" value={total} sub={`${actives} actives`} color="green" icon="⚡" />
        <StatCard label="Sites actifs" value={actives} sub={`${maint} maintenance · ${inact} inactives`} color="green" icon="✅" />
        <StatCard label="Efficacité moyenne" value={eff} unit="%" sub="Toutes centrales" color="yellow" icon="📊" />
        <StatCard label="Capacité totale" value={cap} unit="MW" sub="Installée" color="blue" icon="🔋" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 20 }}>
        <Card className="fade-up-1">
          <CardTitle icon={<ChartUpIcon />}>Efficacité par centrale</CardTitle>
          <canvas ref={effRef} style={{ maxHeight: 220 }} />
        </Card>

        <Card className="fade-up-2">
          <CardTitle icon={<ClockIcon />}>Statut des sites</CardTitle>
          <canvas ref={statRef} style={{ maxHeight: 200 }} />
        </Card>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Card className="fade-up-3">
          <CardTitle icon={<HomeIcon />}>Derniers nettoyages</CardTitle>
          {sorted.slice(0, 5).map(c => {
            const d = c.dernierNettoyage ? new Date(c.dernierNettoyage).toLocaleDateString('fr-FR') : 'Jamais'
            const days = c.dernierNettoyage ? Math.floor((Date.now() - new Date(c.dernierNettoyage)) / 86400000) : 999
            const col = days < 30 ? 'var(--accent)' : days < 90 ? 'var(--yellow)' : 'var(--red)'

            return (
              <div
                key={c._id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 0',
                  borderBottom: '1px solid var(--border)'
                }}
              >
                <span style={{ fontSize: 13, color: 'var(--text)' }}>{c.nom}</span>
                <span style={{ fontSize: 12, color: col }}>{d}</span>
              </div>
            )
          })}
        </Card>

        <Card className="fade-up-4">
          <CardTitle icon={<BellIcon />}>Alertes récentes</CardTitle>

          {recentAlerts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 20, color: 'var(--text3)', fontSize: 13 }}>
              Aucune alerte récente.
            </div>
          ) : (
            recentAlerts.map((a) => (
              <AlertItem key={a.id} color={a.color} time={a.time}>
                {a.text}
              </AlertItem>
            ))
          )}
        </Card>
      </div>
    </div>
  )
}

function ChartUpIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 6l-9.5 9.5-5-5L1 18" /></svg>
}
function ClockIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
}
function HomeIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /></svg>
}
function BellIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>
}