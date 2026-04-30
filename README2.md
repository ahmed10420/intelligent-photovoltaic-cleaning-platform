# Spectra CPV — Plateforme Intelligente

## Lancement rapide

### 1. Backend (Terminal 1)
```bash
cd backend
npm install
node seed.js       # peuple la base de données
npm run dev        # démarre sur http://localhost:5000
```

### 2. Frontend (Terminal 2)
```bash
cd frontend
npm install
npm run dev        # démarre sur http://localhost:3000
```

### 3. Ouvrir dans le navigateur
http://localhost:3000

### Compte admin
- Email : admin@spectra.tn
- Mot de passe : admin123

## Structure
```
cpv-complet/
├── backend/           # Node.js + Express + MongoDB
│   ├── config/db.js
│   ├── models/        # User.js, Central.js
│   ├── controllers/   # authController.js, centralController.js
│   ├── routes/        # auth.js, centrals.js
│   ├── middleware/    # auth.js (JWT)
│   ├── server.js
│   ├── seed.js        # données de démo
│   └── .env
└── frontend/          # React + Vite
    └── src/
        ├── App.jsx
        ├── pages/     # Dashboard, Carte, Centrales, Analyse, Rapports, Alertes
        ├── components/
        ├── context/   # AuthContext
        ├── hooks/     # useCentrales
        └── services/  # api.js (axios)
```
