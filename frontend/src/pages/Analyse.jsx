import { useEffect, useMemo, useRef, useState } from 'react'
import { Chart, registerables } from 'chart.js'
import { Card, CardTitle, Field, Select, SubmitBtn, Empty } from '../components/ui/index'

Chart.register(...registerables)

const API_IA_URL = import.meta.env.VITE_IA_URL || 'http://localhost:8000'
const API_APP_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const round = (v) => Math.round((Number(v) || 0) * 10) / 10
const clamp = (v, min = 0, max = 100) => Math.max(min, Math.min(max, Number(v) || 0))

const WEIGHTS = {
  Physical: 3.0,
  bird: 2.0,
  dust: 1.0,
  snow: 1.2,
  leaf: 0.8,
}

const DEFAUTS = [
  { key: 'Physical', label: '🔴 Dommage (Physical)', fallback: 'Damage' },
  { key: 'dust', label: '🌫️ Poussière (dust)' },
  { key: 'bird', label: '🐦 Fientes (bird)' },
  { key: 'leaf', label: '🍃 Feuilles (leaf)' },
  { key: 'snow', label: '❄️ Neige/Sable (snow)' },
]

function computeScoreFromRaw(raw) {
  const weighted = Object.entries(WEIGHTS).reduce((acc, [key, weight]) => {
    return acc + (Number(raw?.[key]) || 0) * weight
  }, 0)

  return clamp(Math.round(weighted / 3.5))
}

function getDecisionFromScore(score) {
  if (score >= 75) return 'critique'
  if (score >= 50) return 'urgent'
  if (score >= 25) return 'surveillance'
  return 'etat correct'
}

function getRecommendation(score, total) {
  if (score >= 75) {
    return `⚠️ Encrassement critique (${round(total)}%). Intervention immédiate requise.`
  }
  if (score >= 50) {
    return `🚨 Encrassement important (${round(total)}%). Nettoyage urgent recommandé.`
  }
  if (score >= 25) {
    return `📋 Encrassement modéré (${round(total)}%). Prévoir un nettoyage prochainement.`
  }
  if (score > 0) {
    return `✅ Encrassement faible (${round(total)}%). Prochain nettoyage dans 30 jours.`
  }
  return '✅ Aucun défaut détecté. Panneau propre.'
}

function normalizeRawPercentages(data) {
  const raw = data?.raw_percentages || data?.classPercentages || {}
  return {
    Physical: clamp(raw.Physical ?? raw.Damage ?? 0),
    dust: clamp(raw.dust ?? 0),
    bird: clamp(raw.bird ?? 0),
    leaf: clamp(raw.leaf ?? 0),
    snow: clamp(raw.snow ?? 0),
  }
}

function normalizeResult(data) {
  const raw = normalizeRawPercentages(data)
  const score = clamp(data?.scoreGlobal ?? data?.score ?? computeScoreFromRaw(raw))
  const total = Object.values(raw).reduce((a, b) => a + (Number(b) || 0), 0)
  const niveau = data?.messageDecision || data?.niveau || getDecisionFromScore(score)
  const totalDetections =
    Number(data?.total_detections ?? data?.defectsCount) ||
    Object.values(raw).filter((v) => Number(v) > 0).length

  return {
    score,
    niveau,
    total_detections: totalDetections,
    raw_percentages: raw,
    recommandation: data?.recommandation || getRecommendation(score, total),
    imageAnnotee:
      data?.imageAnnotee ||
      data?.annotated_image ||
      data?.annotated_image_url ||
      data?.output_image ||
      '',
    modelName: data?.modelName || 'YOLO',
    inferenceMs: Number(data?.inferenceMs || 0),
    rawResponse: data,
  }
}

async function readJsonSafe(response) {
  try {
    return await response.json()
  } catch {
    return null
  }
}

export default function Analyse({ centrales = [] }) {
  const [selectedFile, setSelectedFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [saveNotice, setSaveNotice] = useState(null)
  const [centrale, setCentrale] = useState('')

  const chartRef = useRef(null)
  const chartInst = useRef(null)

  useEffect(() => {
    return () => {
      if (chartInst.current) {
        chartInst.current.destroy()
        chartInst.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (!result || !chartRef.current) return

    if (chartInst.current) {
      chartInst.current.destroy()
      chartInst.current = null
    }

    const raw = result.raw_percentages || {}
    const values = DEFAUTS.map((d) =>
      round(raw[d.key] ?? (d.fallback ? raw[d.fallback] : 0) ?? 0)
    )
    const allZero = values.every((v) => v === 0)

    chartInst.current = new Chart(chartRef.current, {
      type: 'doughnut',
      data: {
        labels: DEFAUTS.map((d) => d.label),
        datasets: [
          {
            data: allZero ? DEFAUTS.map(() => 1) : values,
            backgroundColor: [
              'rgba(220,50,50,.85)',
              'rgba(245,180,50,.85)',
              'rgba(245,100,50,.85)',
              'rgba(74,200,120,.85)',
              'rgba(100,180,245,.85)',
            ],
            borderColor: '#141c18',
            borderWidth: 3,
          },
        ],
      },
      options: {
        responsive: true,
        cutout: '60%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: '#8aab97', font: { size: 11 }, padding: 8 },
          },
          tooltip: {
            callbacks: {
              label: (ctx) =>
                allZero ? ' Aucune donnée' : ` ${ctx.label}: ${Number(ctx.raw).toFixed(1)}%`,
            },
          },
        },
      },
    })
  }, [result])

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview)
    }
  }, [preview])

  const handleFile = (e) => {
    const f = e.target.files?.[0]
    if (!f) return

    if (!['image/png', 'image/jpeg', 'image/jpg', 'image/webp'].includes(f.type)) {
      setError('Format non supporté. Utilisez PNG, JPG ou WEBP.')
      return
    }

    if (f.size > 10 * 1024 * 1024) {
      setError('Image trop volumineuse. Taille maximale : 10 MB.')
      return
    }

    if (preview) URL.revokeObjectURL(preview)

    setSelectedFile(f)
    setPreview(URL.createObjectURL(f))
    setResult(null)
    setError('')
    setSaveNotice(null)
  }

  const runAnalysis = async () => {
    if (!selectedFile) {
      setError("Importez d'abord une image.")
      return
    }

    if (!centrale) {
      setError("Sélectionnez d'abord une centrale.")
      return
    }

    setLoading(true)
    setError('')
    setSaveNotice(null)
    setResult(null)

    try {
      const formData = new FormData()
      formData.append('image', selectedFile)

      const response = await fetch(`${API_IA_URL}/predict`, {
        method: 'POST',
        body: formData,
      })

      const data = await readJsonSafe(response)

      if (!response.ok) {
        throw new Error(data?.message || `Erreur serveur IA ${response.status}`)
      }

      if (!data?.success) {
        throw new Error(data?.message || 'Erreur analyse IA.')
      }

      const normalized = normalizeResult(data)
      setResult(normalized)

      const saveResponse = await fetch(`${API_APP_URL}/api/analysis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          centralId: centrale,
          imageOriginal: selectedFile.name,
          imageAnnotee: normalized.imageAnnotee || '',
          scoreGlobal: normalized.score,
          raw_percentages: normalized.raw_percentages,
          total_detections: normalized.total_detections,
          messageDecision: normalized.niveau,
          modelName: normalized.modelName,
          inferenceMs: normalized.inferenceMs,
          rawResponse: normalized.rawResponse,
        }),
      })

      const saveData = await readJsonSafe(saveResponse)

      if (!saveResponse.ok) {
        setSaveNotice({
          type: 'warning',
          text:
            saveData?.message ||
            "Analyse terminée, mais non enregistrée dans la base.",
        })
        return
      }

      setSaveNotice({
        type: 'success',
        text: 'Analyse terminée et enregistrée dans la base. La centrale a été mise à jour.',
      })
    } catch (err) {
      setError(err.message || "Erreur pendant l'analyse.")
    } finally {
      setLoading(false)
    }
  }

  const score = result?.score || 0
  const scoreColor =
    score >= 75 ? 'var(--red)' : score >= 50 ? 'var(--orange)' : score >= 25 ? 'var(--yellow)' : 'var(--accent)'

  const decisionColor =
    score >= 75 ? 'var(--red)' : score >= 50 ? 'var(--orange)' : score >= 25 ? 'var(--yellow)' : 'var(--accent)'

  const circleLength = 251.2
  const offset = circleLength * (1 - score / 100)

  const defautsVals = useMemo(() => {
    if (!result) return []
    return DEFAUTS.map((d) => ({
      label: d.label,
      val: round(
        result.raw_percentages?.[d.key] ??
          (d.fallback ? result.raw_percentages?.[d.fallback] : 0) ??
          0
      ),
    }))
  }, [result])

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
      <Card>
        <CardTitle icon={<ImgIcon />}>Analyse d'image par IA (YOLO)</CardTitle>

        <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 16, lineHeight: 1.6 }}>
          Importez une image de panneau solaire. Après l'analyse YOLO, le résultat est enregistré
          en base et la centrale est automatiquement mise à jour.
        </p>

        <Field label="Centrale concernée">
          <Select value={centrale} onChange={(e) => setCentrale(e.target.value)}>
            <option value="">— Sélectionner —</option>
            {centrales.map((c) => (
              <option key={c._id || c.id} value={c._id || c.id}>
                {c.nom}
              </option>
            ))}
          </Select>
        </Field>

        <div
          onClick={() => document.getElementById('file-in')?.click()}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--accent)'
            e.currentTarget.style.background = 'rgba(74,230,150,0.04)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--border2)'
            e.currentTarget.style.background = 'var(--surface)'
          }}
          style={{
            border: '2px dashed var(--border2)',
            borderRadius: 12,
            padding: 32,
            textAlign: 'center',
            cursor: 'pointer',
            background: 'var(--surface)',
            transition: 'all .2s',
            marginBottom: 16,
          }}
        >
          <input
            id="file-in"
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp"
            onChange={handleFile}
            style={{ display: 'none' }}
          />

          <div
            style={{
              width: 60,
              height: 60,
              borderRadius: '50%',
              margin: '0 auto 14px',
              display: 'grid',
              placeItems: 'center',
              background: 'rgba(74,230,150,0.08)',
              color: 'var(--text2)',
            }}
          >
            <UploadIcon />
          </div>

          <div style={{ fontWeight: 700, marginBottom: 6 }}>
            {selectedFile ? selectedFile.name : "Cliquez pour importer une image"}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text3)' }}>PNG, JPG — max 10 MB</div>
        </div>

        {preview && (
          <div
            style={{
              overflow: 'hidden',
              borderRadius: 12,
              border: '1px solid var(--border)',
              marginBottom: 16,
              background: '#111',
            }}
          >
            <img
              src={preview}
              alt="preview"
              style={{ width: '100%', display: 'block', maxHeight: 280, objectFit: 'cover' }}
            />
          </div>
        )}

        {error && (
          <div
            style={{
              marginBottom: 14,
              padding: 14,
              borderRadius: 10,
              background: 'rgba(220, 50, 50, 0.08)',
              border: '1px solid rgba(220, 50, 50, 0.22)',
              color: '#ffb3b3',
              fontSize: 14,
            }}
          >
            {error}
          </div>
        )}

        {saveNotice && (
          <div
            style={{
              marginBottom: 14,
              padding: 14,
              borderRadius: 10,
              background:
                saveNotice.type === 'success'
                  ? 'rgba(74,230,150,0.08)'
                  : 'rgba(245,180,50,0.08)',
              border:
                saveNotice.type === 'success'
                  ? '1px solid rgba(74,230,150,0.22)'
                  : '1px solid rgba(245,180,50,0.22)',
              color: saveNotice.type === 'success' ? '#98f0ba' : '#ffd27a',
              fontSize: 14,
            }}
          >
            {saveNotice.text}
          </div>
        )}

        <SubmitBtn onClick={runAnalysis} disabled={loading}>
          {loading ? 'Analyse en cours...' : "🔍 Lancer l'analyse IA"}
        </SubmitBtn>
      </Card>

      <div style={{ display: 'grid', gap: 16 }}>
        <Card>
          <CardTitle icon={<WaveIcon />}>Résultat de l'analyse</CardTitle>

          {!result ? (
            <Empty icon="🧠" title="Aucun résultat" sub="Importez une image puis lancez l'analyse" />
          ) : (
            <>
              <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 16 }}>
                Score d'encrassement
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr auto',
                  alignItems: 'start',
                  gap: 16,
                  marginBottom: 18,
                }}
              >
                <div />
                <div style={{ color: decisionColor, fontSize: 14, fontWeight: 700 }}>
                  • {result.niveau}
                </div>
              </div>

              <div
                style={{
                  display: 'grid',
                  placeItems: 'center',
                  marginBottom: 20,
                }}
              >
                <div style={{ position: 'relative', width: 110, height: 110 }}>
                  <svg width="110" height="110" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="rgba(255,255,255,0.07)"
                      strokeWidth="8"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke={scoreColor}
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={circleLength}
                      strokeDashoffset={offset}
                      transform="rotate(-90 50 50)"
                      style={{ transition: 'all .6s ease' }}
                    />
                  </svg>

                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      display: 'grid',
                      placeItems: 'center',
                      textAlign: 'center',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 20, fontWeight: 900, lineHeight: 1 }}>
                        {score}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text3)' }}>%</div>
                    </div>
                  </div>
                </div>
              </div>

              <div
                style={{
                  textAlign: 'center',
                  marginBottom: 16,
                  color: 'var(--text2)',
                  fontSize: 14,
                }}
              >
                {result.total_detections} type(s) de défaut détecté(s)
              </div>

              {defautsVals.map((d) => {
                const col =
                  d.val >= 30 ? 'var(--red)' : d.val >= 15 ? 'var(--yellow)' : 'var(--accent)'

                return (
                  <div key={d.label} style={{ marginBottom: 12 }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: 12,
                        color: 'var(--text2)',
                        marginBottom: 5,
                      }}
                    >
                      <span>{d.label}</span>
                      <span style={{ color: d.val > 0 ? col : 'var(--text3)' }}>
                        {d.val.toFixed(1)}%
                      </span>
                    </div>

                    <div
                      style={{
                        height: 5,
                        background: 'var(--surface2)',
                        borderRadius: 10,
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          height: '100%',
                          width: `${Math.min(d.val, 100)}%`,
                          background: col,
                          borderRadius: 10,
                          transition: 'width .6s ease',
                        }}
                      />
                    </div>
                  </div>
                )
              })}

              <div
                style={{
                  marginTop: 8,
                  marginBottom: 4,
                  fontSize: 11,
                  color: 'var(--text3)',
                  textAlign: 'right',
                }}
              >
                Score = surface détectée × gravité par classe
              </div>

              <div
                style={{
                  marginTop: 10,
                  padding: 12,
                  background: 'rgba(245,131,74,0.08)',
                  border: '1px solid rgba(245,131,74,0.2)',
                  borderRadius: 8,
                  fontSize: 13,
                  color: 'var(--text2)',
                  lineHeight: 1.6,
                }}
              >
                {result.recommandation}
              </div>
            </>
          )}
        </Card>

        <Card>
          <CardTitle>Répartition des défauts</CardTitle>

          {!result ? (
            <Empty icon="📊" title="Aucun résultat" sub="Lancez une analyse" />
          ) : (
            <canvas ref={chartRef} style={{ maxHeight: 260 }} />
          )}
        </Card>
      </div>
    </div>
  )
}

function ImgIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  )
}

function WaveIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  )
}

function UploadIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  )
}