import { useEffect, useMemo, useRef, useState } from 'react'
import { Chart, registerables } from 'chart.js'
import { Card, CardTitle } from '../components/ui/index'

Chart.register(...registerables)

const API_APP_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const MONTHS_FR = ['Jan', 'Fév', 'Mars', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sept', 'Oct', 'Nov', 'Déc']

const SERIES_COLORS = [
  '#4ae696',
  '#4a9ef5',
  '#f5d842',
  '#f5834a',
  '#c86bfa',
  '#ff6b9a',
  '#00c2a8',
  '#a3e635',
  '#38bdf8',
  '#f97316',
]

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

function buildLast6Months() {
  const now = new Date()

  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1)
    return {
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      label: MONTHS_FR[d.getMonth()],
      date: d,
    }
  })
}

function isValidDate(value) {
  if (!value) return false
  const d = new Date(value)
  return !Number.isNaN(d.getTime())
}

function monthKeyFromDate(value) {
  const d = new Date(value)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function buildEfficiencyDatasets(centrales, analyses, months) {
  const byCentralMonth = {}

  analyses.forEach((a) => {
    const central = a?.centralId
    const centralId = central?._id || a?.centralId?._id || a?.centralId || a?.central?._id
    if (!centralId) return
    if (!isValidDate(a?.createdAt)) return

    const key = monthKeyFromDate(a.createdAt)
    const score = Number(a?.scoreGlobal || 0)
    const efficacite = Math.max(0, Math.min(100, 100 - score))

    if (!byCentralMonth[centralId]) byCentralMonth[centralId] = {}
    if (!byCentralMonth[centralId][key]) {
      byCentralMonth[centralId][key] = { total: 0, count: 0 }
    }

    byCentralMonth[centralId][key].total += efficacite
    byCentralMonth[centralId][key].count += 1
  })

  return centrales.map((c, i) => {
    const centralId = c?._id || c?.id
    const monthsData = byCentralMonth[centralId] || {}

    const data = months.map((m) => {
      const bucket = monthsData[m.key]
      if (!bucket || !bucket.count) return null
      return Math.round((bucket.total / bucket.count) * 10) / 10
    })

    return {
      label: (c?.nom || '').replace('Centrale ', ''),
      data,
      borderColor: SERIES_COLORS[i % SERIES_COLORS.length],
      backgroundColor: 'transparent',
      tension: 0.35,
      borderWidth: 2,
      pointBackgroundColor: SERIES_COLORS[i % SERIES_COLORS.length],
      pointBorderColor: SERIES_COLORS[i % SERIES_COLORS.length],
      pointRadius: data.some((v) => v !== null) ? 4 : 0,
      pointHoverRadius: data.some((v) => v !== null) ? 5 : 0,
      spanGaps: false,
    }
  })
}

function buildCleaningCounts(centrales, months) {
  const counts = {}
  months.forEach((m) => {
    counts[m.key] = 0
  })

  centrales.forEach((c) => {
    if (!isValidDate(c?.dernierNettoyage)) return
    const key = monthKeyFromDate(c.dernierNettoyage)
    if (key in counts) counts[key] += 1
  })

  return months.map((m) => counts[m.key] || 0)
}

export default function Rapports({ centrales = [] }) {
  const [analyses, setAnalyses] = useState([])

  const evolRef = useRef(null)
  const evolChart = useRef(null)

  const capRef = useRef(null)
  const capChart = useRef(null)

  const nettRef = useRef(null)
  const nettChart = useRef(null)

  const months = useMemo(() => buildLast6Months(), [])
  const monthLabels = months.map((m) => m.label)

  useEffect(() => {
    let cancelled = false

    const loadAnalyses = async () => {
      try {
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
        console.error('Erreur chargement analyses rapports:', err)
        if (!cancelled) setAnalyses([])
      }
    }

    loadAnalyses()

    return () => {
      cancelled = true
    }
  }, [])

  const efficiencyDatasets = useMemo(() => {
    return buildEfficiencyDatasets(centrales, analyses, months)
  }, [centrales, analyses, months])

  const cleaningCounts = useMemo(() => {
    return buildCleaningCounts(centrales, months)
  }, [centrales, months])

  useEffect(() => {
    if (evolChart.current) {
      evolChart.current.destroy()
      evolChart.current = null
    }

    if (capChart.current) {
      capChart.current.destroy()
      capChart.current = null
    }

    if (nettChart.current) {
      nettChart.current.destroy()
      nettChart.current = null
    }

    if (evolRef.current) {
      evolChart.current = new Chart(evolRef.current, {
        type: 'line',
        data: {
          labels: monthLabels,
          datasets: efficiencyDatasets,
        },
        options: {
          responsive: true,
          plugins: {
            legend: {
              labels: { color: '#8aab97' },
            },
            tooltip: {
              callbacks: {
                label: (ctx) => {
                  if (ctx.raw === null || ctx.raw === undefined) {
                    return ` ${ctx.dataset.label}: Aucune donnée`
                  }
                  return ` ${ctx.dataset.label}: ${ctx.raw}%`
                },
              },
            },
          },
          scales: {
            x: {
              ticks: { color: '#8aab97' },
              grid: { color: 'rgba(74,230,150,0.05)' },
            },
            y: {
              min: 0,
              max: 100,
              ticks: { color: '#8aab97' },
              grid: { color: 'rgba(74,230,150,0.07)' },
            },
          },
        },
      })
    }

    if (capRef.current) {
      capChart.current = new Chart(capRef.current, {
        type: 'bar',
        data: {
          labels: centrales.map((c) => (c?.nom || '').replace('Centrale ', '')),
          datasets: [
            {
              label: 'MW',
              data: centrales.map((c) => Number(c?.capacite || 0)),
              backgroundColor: 'rgba(74,158,245,0.75)',
              borderRadius: 6,
              borderSkipped: false,
            },
          ],
        },
        options: {
          responsive: true,
          plugins: { legend: { display: false } },
          scales: {
            x: {
              ticks: { color: '#8aab97' },
              grid: { color: 'rgba(74,230,150,0.05)' },
            },
            y: {
              beginAtZero: true,
              ticks: { color: '#8aab97' },
              grid: { color: 'rgba(74,230,150,0.07)' },
            },
          },
        },
      })
    }

    if (nettRef.current) {
      nettChart.current = new Chart(nettRef.current, {
        type: 'bar',
        data: {
          labels: monthLabels,
          datasets: [
            {
              label: 'Nettoyages',
              data: cleaningCounts,
              backgroundColor: 'rgba(245,216,66,0.75)',
              borderRadius: 6,
              borderSkipped: false,
            },
          ],
        },
        options: {
          responsive: true,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (ctx) => {
                  if (!ctx.raw) return ' Aucune donnée'
                  return ` ${ctx.raw} nettoyage(s)`
                },
              },
            },
          },
          scales: {
            x: {
              ticks: { color: '#8aab97' },
              grid: { color: 'rgba(74,230,150,0.05)' },
            },
            y: {
              beginAtZero: true,
              ticks: { color: '#8aab97', precision: 0 },
              grid: { color: 'rgba(74,230,150,0.07)' },
            },
          },
        },
      })
    }

    return () => {
      evolChart.current?.destroy()
      capChart.current?.destroy()
      nettChart.current?.destroy()
    }
  }, [centrales, monthLabels, efficiencyDatasets, cleaningCounts])

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <CardTitle icon={<TrendIcon />}>Évolution efficacité — 6 derniers mois</CardTitle>
        <canvas ref={evolRef} style={{ maxHeight: 260 }} />
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Card>
          <CardTitle icon={<BarIcon />}>Capacité par centrale (MW)</CardTitle>
          <canvas ref={capRef} />
        </Card>

        <Card>
          <CardTitle icon={<CalIcon />}>Nettoyages par mois</CardTitle>
          <canvas ref={nettRef} />
        </Card>
      </div>
    </div>
  )
}

function TrendIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M23 6l-9.5 9.5-5-5L1 18" />
    </svg>
  )
}

function BarIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  )
}

function CalIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  )
}