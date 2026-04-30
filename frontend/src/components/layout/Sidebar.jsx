import { useAuth } from '../../context/AuthContext'

function normalizeRole(role) {
  return String(role || '').toLowerCase() === 'admin' ? 'admin' : 'user'
}

const navItems = [
  { page: 'dashboard', label: 'Tableau de bord', icon: <GridIcon /> },
  { page: 'carte', label: 'Carte interactive', icon: <MapIcon /> },
  { page: 'centrales', label: 'Centrales', icon: <BoltIcon />, badge: true },

  { section: 'Analyse' },
  { page: 'analyse', label: "Analyse d'images", icon: <ChartIcon /> },
  { page: 'rapports', label: 'Rapports', icon: <DocIcon /> },
  { page: 'priorisation', label: 'Priorisation', icon: <PriorityIcon /> },

  { section: 'Système' },
  { page: 'alertes', label: 'Alertes', icon: <BellIcon />, alertBadge: true, badgeColor: '#f5834a' },
  { page: 'comptes', label: 'Gestion des comptes', icon: <UsersIcon />, adminOnly: true },
]

export default function Sidebar({ currentPage, onNav, count, alertCount }) {
  const { user, logout } = useAuth()
  const normalizedRole = normalizeRole(user?.role)
  const visibleItems = navItems.filter((item) => !item.adminOnly || normalizedRole === 'admin')

  return (
    <aside
      style={{
        width: 'var(--sidebar-w)',
        minWidth: 'var(--sidebar-w)',
        background: 'var(--bg2)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 100,
      }}
    >
      <div style={{ padding: '22px 20px 18px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 36,
              height: 36,
              background: 'var(--accent)',
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <SunIcon />
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-head)', fontSize: 17, fontWeight: 800, color: 'var(--text)' }}>
              PV SmartCare
            </div>
            <div style={{ fontSize: 10, color: 'var(--text3)', letterSpacing: 0.5 }}>
              Gestion intelligente
            </div>
          </div>
        </div>
      </div>

      <nav style={{ padding: '14px 0', flex: 1, overflowY: 'auto' }}>
        <div style={{ padding: '0 12px 6px' }}>
          <div
            style={{
              fontSize: 9,
              fontWeight: 600,
              color: 'var(--text3)',
              letterSpacing: 1.5,
              textTransform: 'uppercase',
              padding: '8px 8px 4px',
            }}
          >
            Principal
          </div>

          {visibleItems.map((item, i) => {
            if (item.section) {
              return (
                <div
                  key={i}
                  style={{
                    fontSize: 9,
                    fontWeight: 600,
                    color: 'var(--text3)',
                    letterSpacing: 1.5,
                    textTransform: 'uppercase',
                    padding: '14px 8px 4px',
                  }}
                >
                  {item.section}
                </div>
              )
            }

            const active = currentPage === item.page

            return (
              <div
                key={item.page}
                onClick={() => onNav(item.page)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '9px 10px',
                  borderRadius: 'var(--r)',
                  marginBottom: 2,
                  color: active ? 'var(--accent)' : 'var(--text2)',
                  background: active ? 'rgba(74,230,150,0.08)' : 'transparent',
                  border: `1px solid ${active ? 'var(--border)' : 'transparent'}`,
                  cursor: 'pointer',
                  fontSize: 13.5,
                  transition: 'all .2s',
                }}
                onMouseEnter={(e) => {
                  if (!active) {
                    e.currentTarget.style.color = 'var(--text)'
                    e.currentTarget.style.background = 'var(--surface)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    e.currentTarget.style.color = 'var(--text2)'
                    e.currentTarget.style.background = 'transparent'
                  }
                }}
              >
                <span style={{ display: 'flex', flexShrink: 0 }}>{item.icon}</span>
                <span style={{ flex: 1 }}>{item.label}</span>

                {item.badge && (
                  <span
                    style={{
                      background: 'var(--accent)',
                      color: 'var(--bg)',
                      fontSize: 10,
                      fontWeight: 700,
                      padding: '1px 6px',
                      borderRadius: 20,
                    }}
                  >
                    {count}
                  </span>
                )}

                {item.alertBadge && alertCount > 0 && (
                  <span
                    style={{
                      background: item.badgeColor || 'var(--accent)',
                      color: '#fff',
                      fontSize: 10,
                      fontWeight: 700,
                      padding: '1px 6px',
                      borderRadius: 20,
                    }}
                  >
                    {alertCount}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </nav>

      <div style={{ borderTop: '1px solid var(--border)', padding: 14 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: 10,
            borderRadius: 'var(--r)',
            background: 'var(--surface)',
            cursor: 'pointer',
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              flexShrink: 0,
              background: 'linear-gradient(135deg,var(--accent),var(--blue))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 12,
              fontWeight: 700,
              color: 'var(--bg)',
            }}
          >
            {user?.nom?.[0]?.toUpperCase() || 'U'}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: 'var(--text)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {user?.nom}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text3)' }}>
              {normalizedRole === 'admin' ? 'Admin' : 'Utilisateur'}
            </div>
          </div>

          <button
            onClick={logout}
            title="Déconnexion"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text3)',
              fontSize: 16,
              padding: 4,
              borderRadius: 6,
              transition: 'color .2s',
            }}
            onMouseEnter={(e) => (e.target.style.color = 'var(--red)')}
            onMouseLeave={(e) => (e.target.style.color = 'var(--text3)')}
          >
            ⏏
          </button>
        </div>
      </div>
    </aside>
  )
}

function SunIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0a0f0d" strokeWidth="2.5" strokeLinecap="round">
      <circle cx="12" cy="12" r="5" />
      <path d="M12 1v3M12 20v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M1 12h3M20 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12" />
    </svg>
  )
}
function GridIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  )
}
function MapIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
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
function ChartIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M23 6l-9.5 9.5-5-5L1 18" />
      <path d="M17 6h6v6" />
    </svg>
  )
}
function DocIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  )
}
function PriorityIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 20V10" />
      <path d="M18 20V4" />
      <path d="M6 20v-6" />
    </svg>
  )
}
function BellIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  )
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