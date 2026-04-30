import { useEffect, useRef } from 'react'
import { Card, CardTitle } from '../components/ui/index'

export default function Carte({ centrales }) {
  const mapRef  = useRef()
  const mapInst = useRef()
  const markers = useRef([])

  useEffect(() => {
    if (mapInst.current) return
    import('leaflet').then(L => {
      mapInst.current = L.map(mapRef.current, { zoomControl: true }).setView([34.0, 9.0], 6)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap', maxZoom: 19
      }).addTo(mapInst.current)
      addMarkers(L)
    })
  }, [])

  useEffect(() => {
    if (!mapInst.current) return
    import('leaflet').then(L => {
      markers.current.forEach(m => m.remove())
      markers.current = []
      addMarkers(L)
    })
  }, [centrales])

  const addMarkers = (L) => {
    centrales.forEach(c => {
      const color = c.statut==='actif' ? '#4ae696' : c.statut==='maintenance' ? '#f5d842' : '#f54a4a'
      const icon = L.divIcon({
        html: `<div style="width:14px;height:14px;border-radius:50%;background:${color};border:2px solid rgba(255,255,255,.4);box-shadow:0 0 10px ${color}66"></div>`,
        iconSize: [14,14], iconAnchor: [7,7], className:''
      })
      const m = L.marker([c.latitude, c.longitude], { icon }).addTo(mapInst.current)
      m.bindPopup(`
        <div style="font-family:'DM Sans',sans-serif;min-width:180px;padding:4px">
          <strong style="font-size:14px;color:#111">${c.nom}</strong><br>
          <span style="color:#666;font-size:12px">${c.adresse||''}</span><br><br>
          <b>Capacité :</b> ${c.capacite} MW<br>
          <b>Efficacité :</b> ${c.etatEfficacite}%<br>
          <b>Statut :</b> <span style="color:${color};font-weight:600">${c.statut}</span>
        </div>
      `)
      markers.current.push(m)
    })
    if (mapInst.current) mapInst.current.invalidateSize()
  }

  return (
    <div>
      <Card style={{ marginBottom:16 }}>
        <CardTitle icon={<MapIcon/>}>Carte des centrales photovoltaïques — Tunisie</CardTitle>
        <div ref={mapRef} style={{ height:400, borderRadius:12, overflow:'hidden' }}/>
      </Card>

      <Card>
        <CardTitle>Légende & Résumé</CardTitle>
        <div style={{ display:'flex', gap:24, flexWrap:'wrap', marginBottom:16 }}>
          {[
            { color:'#4ae696', label:'Actif' },
            { color:'#f5d842', label:'En maintenance' },
            { color:'#f54a4a', label:'Inactif' },
          ].map(l=>(
            <div key={l.label} style={{ display:'flex', alignItems:'center', gap:6, fontSize:13, color:'var(--text2)' }}>
              <span style={{ width:12,height:12,borderRadius:'50%',background:l.color,display:'inline-block' }}/>
              {l.label}
            </div>
          ))}
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
          {centrales.slice(0,6).map(c=>(
            <div key={c._id} style={{ background:'var(--surface2)', borderRadius:10, padding:'10px 14px',
              display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ width:8,height:8,borderRadius:'50%',flexShrink:0,
                background:c.statut==='actif'?'#4ae696':c.statut==='maintenance'?'#f5d842':'#f54a4a' }}/>
              <div>
                <div style={{ fontSize:13,fontWeight:500,color:'var(--text)' }}>{c.nom}</div>
                <div style={{ fontSize:11,color:'var(--text3)' }}>{c.capacite} MW · {c.etatEfficacite}%</div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

function MapIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg> }
