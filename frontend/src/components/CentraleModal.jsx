import { useState, useEffect, useRef } from 'react'
import { Modal, Field, Input, Select, SubmitBtn } from './ui/index'

const empty = {
  nom: '',
  adresse: '',
  latitude: '',
  longitude: '',
  capacite: '',
  etatEfficacite: 100,
  statut: 'actif',
  dateInstallation: '',
  dernierNettoyage: ''
}

export default function CentraleModal({ open, onClose, onSave, centrale }) {
  const [form, setForm] = useState(empty)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const mapRef = useRef(null)
  const mapInstance = useRef(null)
  const markerRef = useRef(null)

  useEffect(() => {
    if (centrale) {
      setForm({
        nom: centrale.nom || '',
        adresse: centrale.adresse || '',
        latitude: centrale.latitude ?? '',
        longitude: centrale.longitude ?? '',
        capacite: centrale.capacite ?? '',
        etatEfficacite: centrale.etatEfficacite ?? 100,
        statut: centrale.statut || 'actif',
        dateInstallation: centrale.dateInstallation?.split('T')[0] || '',
        dernierNettoyage: centrale.dernierNettoyage?.split('T')[0] || '',
      })
    } else {
      setForm({
        ...empty,
        dateInstallation: new Date().toISOString().split('T')[0]
      })
    }
    setError('')
  }, [centrale, open])

  useEffect(() => {
    if (!open || !mapRef.current || mapInstance.current) return

    import('leaflet').then((L) => {
      const lat = centrale?.latitude ?? 34.0
      const lng = centrale?.longitude ?? 9.0

      const map = L.map(mapRef.current, { zoomControl: true }).setView([lat, lng], centrale ? 10 : 6)

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
        maxZoom: 19
      }).addTo(map)

      map.on('click', (e) => {
        const { lat, lng } = e.latlng

        setForm((f) => ({
          ...f,
          latitude: lat.toFixed(6),
          longitude: lng.toFixed(6)
        }))

        if (markerRef.current) {
          markerRef.current.setLatLng([lat, lng])
        } else {
          markerRef.current = L.marker([lat, lng]).addTo(map)
        }
      })

      if (centrale?.latitude && centrale?.longitude) {
        markerRef.current = L.marker([centrale.latitude, centrale.longitude]).addTo(map)
      }

      mapInstance.current = map
      setTimeout(() => map.invalidateSize(), 200)
    })

    return () => {}
  }, [open, centrale])

  useEffect(() => {
    if (!open) {
      if (mapInstance.current) {
        mapInstance.current.remove()
        mapInstance.current = null
      }
      markerRef.current = null
    }
  }, [open])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async () => {
    if (!form.nom || !form.capacite || ((!form.adresse || form.adresse.trim() === '') && (!form.latitude || !form.longitude))) {
      setError('Veuillez remplir nom, capacité, puis soit adresse soit localisation sur la carte.')
      return
    }

    setLoading(true)
    setError('')

try {
  await onSave({
    ...form,
    latitude: form.latitude !== '' ? parseFloat(form.latitude) : undefined,
    longitude: form.longitude !== '' ? parseFloat(form.longitude) : undefined,
    capacite: parseFloat(form.capacite),
    etatEfficacite: parseInt(form.etatEfficacite, 10) || 100,
  })
  setError('')
} catch (e) {
  setError(e.response?.data?.message || 'Erreur lors de la sauvegarde')
} finally {
  setLoading(false)
}
  }

  return (
    <Modal open={open} onClose={onClose} title={centrale ? 'Modifier la centrale' : 'Ajouter une centrale'}>
      {error && (
        <div
          style={{
            background: 'rgba(245,74,74,.1)',
            border: '1px solid rgba(245,74,74,.3)',
            color: 'var(--red)',
            borderRadius: 8,
            padding: '10px 14px',
            fontSize: 13,
            marginBottom: 16
          }}
        >
          {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label="Nom de la centrale *">
          <Input
            value={form.nom}
            onChange={e => set('nom', e.target.value)}
            placeholder="Centrale Tunis Nord"
          />
        </Field>

        <Field label="Capacité (MW) *">
          <Input
            type="number"
            value={form.capacite}
            onChange={e => set('capacite', e.target.value)}
            placeholder="8.5"
          />
        </Field>

        <Field label="Statut">
          <Select value={form.statut} onChange={e => set('statut', e.target.value)}>
            <option value="actif">Actif</option>
            <option value="maintenance">Maintenance</option>
            <option value="inactif">Inactif</option>
          </Select>
        </Field>

        <Field label="Efficacité (%)">
          <Input
            type="number"
            min="0"
            max="100"
            value={form.etatEfficacite}
            onChange={e => set('etatEfficacite', e.target.value)}
            placeholder="92"
          />
        </Field>

        <Field label="Date d'installation">
          <Input
            type="date"
            value={form.dateInstallation}
            onChange={e => set('dateInstallation', e.target.value)}
          />
        </Field>

        <Field label="Dernier nettoyage">
          <Input
            type="date"
            value={form.dernierNettoyage}
            onChange={e => set('dernierNettoyage', e.target.value)}
          />
        </Field>
      </div>

      <Field label="Adresse / Localité">
        <Input
          value={form.adresse}
          onChange={e => set('adresse', e.target.value)}
          placeholder="Ex: Sfax, Tunisie"
        />
      </Field>

      <Field label="Choisir la localisation sur la carte">
        <div
          ref={mapRef}
          style={{
            height: 280,
            borderRadius: 12,
            overflow: 'hidden',
            border: '1px solid var(--border)'
          }}
        />
      </Field>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
        <Field label="Latitude sélectionnée">
          <Input type="number" step="any" value={form.latitude} readOnly />
        </Field>

        <Field label="Longitude sélectionnée">
          <Input type="number" step="any" value={form.longitude} readOnly />
        </Field>
      </div>

      <SubmitBtn loading={loading} onClick={handleSave}>
        {loading ? 'Enregistrement...' : 'Enregistrer la centrale'}
      </SubmitBtn>
    </Modal>
  )
}