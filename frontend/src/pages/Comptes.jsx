import { useEffect, useMemo, useState } from 'react'
import { Card, CardTitle, Empty, Select } from '../components/ui/index'
import { useAuth } from '../context/AuthContext'

const API_APP_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

function getAuthToken() {
  return localStorage.getItem('cpv_token') || ''
}

function normalizeRole(role) {
  return String(role || '').toLowerCase() === 'admin' ? 'admin' : 'user'
}

function roleLabel(role) {
  return normalizeRole(role) === 'admin' ? 'Admin' : 'Utilisateur'
}

function roleColor(role) {
  return normalizeRole(role) === 'admin' ? 'var(--orange)' : 'var(--accent)'
}

function formatDate(value) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString('fr-FR')
}

export default function Comptes() {
  const { user } = useAuth()
  const isAdmin = normalizeRole(user?.role) === 'admin'

  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')

  const [editingUser, setEditingUser] = useState(null)
  const [form, setForm] = useState({
    nom: '',
    email: '',
    motDePasse: '',
    role: 'user',
  })

  const resetForm = () => {
    setEditingUser(null)
    setForm({
      nom: '',
      email: '',
      motDePasse: '',
      role: 'user',
    })
  }

  const loadUsers = async () => {
    try {
      setLoading(true)
      setError('')
      const token = getAuthToken()

      const res = await fetch(`${API_APP_URL}/api/users`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!res.ok) {
        throw new Error(`Erreur ${res.status}`)
      }

      const data = await res.json()
      const rows = Array.isArray(data?.users)
        ? data.users
        : Array.isArray(data?.data)
        ? data.data
        : Array.isArray(data)
        ? data
        : []

      setUsers(rows)
    } catch (err) {
      console.error('Erreur chargement comptes:', err)
      setError("Impossible de charger les comptes. Vérifie la route /api/users.")
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isAdmin) {
      loadUsers()
    } else {
      setLoading(false)
    }
  }, [isAdmin])

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const q = search.trim().toLowerCase()
      const matchSearch =
        !q ||
        String(u?.nom || '').toLowerCase().includes(q) ||
        String(u?.email || '').toLowerCase().includes(q)

      const matchRole = !roleFilter || normalizeRole(u?.role) === roleFilter
      return matchSearch && matchRole
    })
  }, [users, search, roleFilter])

  const stats = useMemo(() => {
    const admins = users.filter((u) => normalizeRole(u?.role) === 'admin').length
    const normalUsers = users.filter((u) => normalizeRole(u?.role) === 'user').length
    return {
      total: users.length,
      admins,
      users: normalUsers,
    }
  }, [users])

  const handleEdit = (u) => {
    setEditingUser(u)
    setForm({
      nom: u?.nom || '',
      email: u?.email || '',
      motDePasse: '',
      role: normalizeRole(u?.role),
    })
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!form.nom.trim() || !form.email.trim()) {
      setError('Nom et email sont obligatoires.')
      return
    }

    if (!editingUser && !form.motDePasse.trim()) {
      setError('Le mot de passe est obligatoire pour la création.')
      return
    }

    if (form.motDePasse && form.motDePasse.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.')
      return
    }

    try {
      setSaving(true)
      setError('')
      const token = getAuthToken()

      const payload = {
        nom: form.nom.trim(),
        email: form.email.trim(),
        role: normalizeRole(form.role),
      }

      if (form.motDePasse.trim()) {
        payload.motDePasse = form.motDePasse.trim()
      }

      const url = editingUser
        ? `${API_APP_URL}/api/users/${editingUser._id}`
        : `${API_APP_URL}/api/users`

      const method = editingUser ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.message || `Erreur ${res.status}`)
      }

      await loadUsers()
      resetForm()
    } catch (err) {
      console.error('Erreur sauvegarde compte:', err)
      setError(err.message || 'Erreur lors de la sauvegarde du compte.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (u) => {
    if (!u?._id) return
    if (!window.confirm(`Supprimer le compte ${u.nom} ?`)) return

    try {
      const token = getAuthToken()

      const res = await fetch(`${API_APP_URL}/api/users/${u._id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.message || `Erreur ${res.status}`)
      }

      await loadUsers()
      if (editingUser?._id === u._id) resetForm()
    } catch (err) {
      console.error('Erreur suppression compte:', err)
      setError(err.message || 'Erreur lors de la suppression du compte.')
    }
  }

  if (!isAdmin) {
    return (
      <div>
        <Card>
          <CardTitle icon={<UsersIcon />}>Gestion des comptes</CardTitle>
          <Empty
            icon="🔒"
            title="Accès réservé"
            sub="Cette page est accessible uniquement à l’administrateur."
          />
        </Card>
      </div>
    )
  }

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <CardTitle icon={<UsersIcon />}>Gestion des comptes</CardTitle>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
            gap: 12,
          }}
        >
          <MiniStat label="Total comptes" value={stats.total} color="var(--text)" />
          <MiniStat label="Admins" value={stats.admins} color="var(--orange)" />
          <MiniStat label="Utilisateurs" value={stats.users} color="var(--accent)" />
        </div>
      </Card>

      <Card style={{ marginBottom: 16 }}>
        <CardTitle icon={<EditIcon />}>
          {editingUser ? 'Modifier un compte' : 'Ajouter un compte'}
        </CardTitle>

        {error && (
          <div
            style={{
              marginBottom: 14,
              padding: '10px 12px',
              borderRadius: 10,
              background: 'rgba(245,74,74,0.08)',
              border: '1px solid rgba(245,74,74,0.2)',
              color: 'var(--red)',
              fontSize: 13,
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
              gap: 12,
              marginBottom: 12,
            }}
          >
            <Field label="Nom complet">
              <input
                value={form.nom}
                onChange={(e) => setForm((p) => ({ ...p, nom: e.target.value }))}
                placeholder="Nom complet"
                style={inputStyle}
              />
            </Field>

            <Field label="Email">
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                placeholder="email@example.com"
                style={inputStyle}
              />
            </Field>

            <Field label={editingUser ? 'Nouveau mot de passe (optionnel)' : 'Mot de passe'}>
              <input
                type="password"
                value={form.motDePasse}
                onChange={(e) => setForm((p) => ({ ...p, motDePasse: e.target.value }))}
                placeholder={editingUser ? 'Laisser vide pour ne pas changer' : 'Minimum 6 caractères'}
                style={inputStyle}
              />
            </Field>

            <Field label="Rôle">
              <Select
                value={form.role}
                onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}
                style={{ width: '100%' }}
              >
                <option value="user">Utilisateur</option>
                <option value="admin">Admin</option>
              </Select>
            </Field>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button type="submit" disabled={saving} style={primaryBtn}>
              {saving ? 'Enregistrement...' : editingUser ? 'Mettre à jour' : 'Créer le compte'}
            </button>

            <button type="button" onClick={resetForm} style={secondaryBtn}>
              Réinitialiser
            </button>
          </div>
        </form>
      </Card>

      <Card>
        <CardTitle icon={<ListIcon />}>Liste des comptes</CardTitle>

        <div
          style={{
            display: 'flex',
            gap: 12,
            flexWrap: 'wrap',
            marginBottom: 14,
          }}
        >
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par nom ou email..."
            style={{ ...inputStyle, maxWidth: 340 }}
          />

          <div style={{ minWidth: 220 }}>
            <Select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
              <option value="">Tous les rôles</option>
              <option value="admin">Admin</option>
              <option value="user">Utilisateur</option>
            </Select>
          </div>
        </div>

        {loading ? (
          <div style={{ color: 'var(--text3)', fontSize: 13 }}>Chargement...</div>
        ) : filteredUsers.length === 0 ? (
          <Empty icon="👤" title="Aucun compte" sub="Aucun compte trouvé pour cette sélection." />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Nom', 'Email', 'Rôle', 'Créé le', 'Actions'].map((h) => (
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
                {filteredUsers.map((u) => (
                  <tr key={u._id} style={{ borderBottom: '1px solid rgba(74,230,150,0.05)' }}>
                    <td style={{ padding: '12px 14px', color: 'var(--text)', fontWeight: 600 }}>
                      {u.nom}
                    </td>
                    <td style={{ padding: '12px 14px', color: 'var(--text2)' }}>
                      {u.email}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '4px 10px',
                          borderRadius: 999,
                          fontSize: 12,
                          fontWeight: 700,
                          color: roleColor(u.role),
                          background: `${roleColor(u.role)}18`,
                          border: `1px solid ${roleColor(u.role)}33`,
                        }}
                      >
                        {roleLabel(u.role)}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', color: 'var(--text2)' }}>
                      {formatDate(u.createdAt)}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button type="button" onClick={() => handleEdit(u)} style={smallEditBtn}>
                          Modifier
                        </button>
                        <button type="button" onClick={() => handleDelete(u)} style={smallDeleteBtn}>
                          Supprimer
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div>
      <label
        style={{
          display: 'block',
          marginBottom: 6,
          fontSize: 12,
          color: 'var(--text3)',
          fontWeight: 600,
        }}
      >
        {label}
      </label>
      {children}
    </div>
  )
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
      <div style={{ fontSize: 24, fontWeight: 800, color }}>
        {value}
      </div>
    </div>
  )
}

const inputStyle = {
  width: '100%',
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 10,
  padding: '10px 12px',
  color: 'var(--text)',
  outline: 'none',
  fontSize: 13,
}

const primaryBtn = {
  background: 'var(--accent)',
  color: 'var(--bg)',
  border: 'none',
  borderRadius: 10,
  padding: '10px 16px',
  cursor: 'pointer',
  fontWeight: 700,
}

const secondaryBtn = {
  background: 'var(--surface)',
  color: 'var(--text)',
  border: '1px solid var(--border)',
  borderRadius: 10,
  padding: '10px 16px',
  cursor: 'pointer',
  fontWeight: 700,
}

const smallEditBtn = {
  background: 'rgba(74,230,150,0.08)',
  color: 'var(--accent)',
  border: '1px solid rgba(74,230,150,0.18)',
  borderRadius: 8,
  padding: '6px 10px',
  cursor: 'pointer',
  fontSize: 12,
  fontWeight: 700,
}

const smallDeleteBtn = {
  background: 'rgba(245,74,74,0.08)',
  color: 'var(--red)',
  border: '1px solid rgba(245,74,74,0.18)',
  borderRadius: 8,
  padding: '6px 10px',
  cursor: 'pointer',
  fontSize: 12,
  fontWeight: 700,
}

function UsersIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

function EditIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
    </svg>
  )
}

function ListIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  )
}