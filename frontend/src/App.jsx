import { useState } from 'react'
import * as XLSX from 'xlsx'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

import { AuthProvider, useAuth } from './context/AuthContext'
import { ToastProvider, useToast } from './components/ui/index'
import { useCentrales } from './hooks/useCentrales'

import Sidebar from './components/layout/Sidebar'
import Topbar from './components/layout/Topbar'
import CentraleModal from './components/CentraleModal'

import LoginPage from './pages/LoginPage'
import Dashboard from './pages/Dashboard'
import Carte from './pages/Carte'
import Centrales from './pages/Centrales'
import Analyse from './pages/Analyse'
import Rapports from './pages/Rapports'
import Priorisation from './pages/Priorisation'
import Alertes from './pages/Alertes'
import Comptes from './pages/Comptes'

function normalizeRole(role) {
  return String(role || '').toLowerCase() === 'admin' ? 'admin' : 'user'
}

function isAnalyzed(c) {
  return Boolean(
    c?.derniereAnalyseAt ||
      (c?.dernierScore !== null && c?.dernierScore !== undefined) ||
      c?.derniereDecision ||
      c?.etatActuel
  )
}

function isUrgentAlert(c) {
  const d = String(c?.derniereDecision || c?.etatActuel || '').toLowerCase()
  return ['urgent', 'critique'].includes(d)
}

function AppInner() {
  const { isAuth, user } = useAuth()
  const { toast } = useToast()

  if (!isAuth) return <LoginPage />

  const normalizedRole = normalizeRole(user?.role)
  const isAdmin = normalizedRole === 'admin'

  const { centrales, loading, create, update, remove } = useCentrales()

  const [page, setPage] = useState('dashboard')
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editCentrale, setEditCentrale] = useState(null)

  const centralesCount = centrales.length
  const alertCount =
    centrales.filter((c) => isAnalyzed(c) && isUrgentAlert(c)).length +
    centrales.filter((c) => !isAnalyzed(c)).length

  const openAdd = () => {
    setEditCentrale(null)
    setModalOpen(true)
  }

  const openEdit = (c) => {
    setEditCentrale(c)
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditCentrale(null)
  }

  const handleSave = async (data) => {
    if (editCentrale) {
      await update(editCentrale._id, data)
      toast('Centrale mise à jour ✓')
    } else {
      await create(data)
      toast('Centrale ajoutée ✓')
    }

    closeModal()
  }

  const handleDelete = async (id) => {
    if (!confirm('Supprimer cette centrale ?')) return
    await remove(id)
    toast('Centrale supprimée')
  }

  const buildExportRows = () => {
    return centrales.map((c) => ({
      Nom: c.nom || '',
      Adresse: c.adresse || '',
      Latitude: c.latitude ?? '',
      Longitude: c.longitude ?? '',
      'Capacité (MW)': c.capacite ?? '',
      'Efficacité (%)': c.etatEfficacite ?? '',
      Statut: c.statut || '',
      'Date installation': c.dateInstallation
        ? new Date(c.dateInstallation).toLocaleDateString('fr-FR')
        : '',
      'Dernier nettoyage': c.dernierNettoyage
        ? new Date(c.dernierNettoyage).toLocaleDateString('fr-FR')
        : '',
      'Dernière décision': c.derniereDecision || c.etatActuel || '',
      "Score d'encrassement": c.dernierScore ?? '',
      'Dernière analyse': c.derniereAnalyseAt
        ? new Date(c.derniereAnalyseAt).toLocaleString('fr-FR')
        : '',
    }))
  }

  const exportExcel = () => {
    const rows = buildExportRows()
    const worksheet = XLSX.utils.json_to_sheet(rows)
    const workbook = XLSX.utils.book_new()

    worksheet['!cols'] = [
      { wch: 22 },
      { wch: 42 },
      { wch: 14 },
      { wch: 14 },
      { wch: 16 },
      { wch: 16 },
      { wch: 14 },
      { wch: 18 },
      { wch: 18 },
      { wch: 18 },
      { wch: 20 },
      { wch: 22 },
    ]

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Centrales')
    XLSX.writeFile(workbook, 'centrales_spectra_cpv.xlsx')
    toast('Export Excel généré ✓')
  }

  const pdfSafeText = (value) => {
    if (value === null || value === undefined) return ''
    const text = String(value)
    const hasArabic = /[\u0600-\u06FF]/.test(text)
    if (hasArabic) return 'Voir application'
    return text
  }

  const exportPDF = () => {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    })

    const rows = centrales.map((c) => [
      pdfSafeText(c.nom || ''),
      pdfSafeText(c.adresse || ''),
      c.latitude ?? '—',
      c.longitude ?? '—',
      `${c.capacite ?? ''} MW`,
      `${c.etatEfficacite ?? ''}%`,
      pdfSafeText(c.statut || ''),
      c.dateInstallation ? new Date(c.dateInstallation).toLocaleDateString('fr-FR') : '—',
      c.dernierNettoyage ? new Date(c.dernierNettoyage).toLocaleDateString('fr-FR') : '—',
      c.dernierScore ?? '—',
      pdfSafeText(c.derniereDecision || c.etatActuel || '—'),
      c.derniereAnalyseAt ? new Date(c.derniereAnalyseAt).toLocaleString('fr-FR') : '—',
    ])

    doc.setFontSize(16)
    doc.text('Liste des centrales photovoltaïques', 10, 15)

    autoTable(doc, {
      startY: 24,
      head: [[
        'Nom',
        'Adresse',
        'Latitude',
        'Longitude',
        'Capacité',
        'Efficacité',
        'Statut',
        'Date installation',
        'Dernier nettoyage',
        "Score d'encrassement",
        'Dernière décision',
        'Dernière analyse',
      ]],
      body: rows,
      theme: 'grid',
      styles: {
        fontSize: 8,
        cellPadding: 2.5,
        overflow: 'linebreak',
        valign: 'middle',
      },
      headStyles: {
        fillColor: [18, 28, 24],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
      columnStyles: {
        0: { cellWidth: 24 },
        1: { cellWidth: 42 },
        2: { cellWidth: 18, halign: 'center' },
        3: { cellWidth: 18, halign: 'center' },
        4: { cellWidth: 18, halign: 'center' },
        5: { cellWidth: 18, halign: 'center' },
        6: { cellWidth: 16, halign: 'center' },
        7: { cellWidth: 22, halign: 'center' },
        8: { cellWidth: 22, halign: 'center' },
        9: { cellWidth: 20, halign: 'center' },
        10: { cellWidth: 24, halign: 'center' },
        11: { cellWidth: 28, halign: 'center' },
      },
      margin: { left: 6, right: 6 },
    })

    doc.save('centrales_spectra_cpv.pdf')
    toast('Export PDF généré ✓')
  }

  const pages = {
    dashboard: Dashboard,
    carte: Carte,
    centrales: Centrales,
    analyse: Analyse,
    rapports: Rapports,
    priorisation: Priorisation,
    alertes: Alertes,
    ...(isAdmin ? { comptes: Comptes } : {}),
  }

  const safePage = isAdmin || page !== 'comptes' ? page : 'dashboard'
  const PageComp = pages[safePage] || Dashboard

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar
        currentPage={safePage}
        onNav={setPage}
        count={centralesCount}
        alertCount={alertCount}
      />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Topbar
          page={safePage}
          onAdd={openAdd}
          onExportExcel={exportExcel}
          onExportPDF={exportPDF}
          onNav={setPage}
          search={search}
          onSearch={setSearch}
        />

        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: 24,
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(74,230,150,0.2) transparent',
          }}
        >
          {loading ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: 200,
                gap: 12,
                color: 'var(--text2)',
                fontSize: 14,
              }}
            >
              <span
                style={{
                  width: 20,
                  height: 20,
                  border: '2px solid rgba(74,230,150,.3)',
                  borderTopColor: 'var(--accent)',
                  borderRadius: '50%',
                  animation: 'spin .7s linear infinite',
                  display: 'inline-block',
                }}
              />
              Chargement des données...
            </div>
          ) : (
            <PageComp
              centrales={centrales}
              search={search}
              onEdit={openEdit}
              onDelete={handleDelete}
            />
          )}
        </div>
      </div>

      <CentraleModal
        open={modalOpen}
        onClose={closeModal}
        onSave={handleSave}
        centrale={editCentrale}
      />
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppInner />
      </ToastProvider>
    </AuthProvider>
  )
}