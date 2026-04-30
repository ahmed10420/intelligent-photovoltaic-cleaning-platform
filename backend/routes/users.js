const express = require('express')
const jwt = require('jsonwebtoken')
const User = require('../models/User')
const {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
} = require('../controllers/usersController')

const router = express.Router()

function normalizeRole(role) {
  return String(role || '').toLowerCase() === 'admin' ? 'admin' : 'user'
}

async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || ''
    const token = header.startsWith('Bearer ') ? header.slice(7) : null

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Non autorisé. Token manquant.',
      })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secretkey')

    const user = await User.findById(decoded.id || decoded._id)
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur introuvable.',
      })
    }

    req.user = {
      id: user._id,
      nom: user.nom,
      email: user.email,
      role: normalizeRole(user.role),
    }

    next()
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Token invalide ou expiré.',
    })
  }
}

function requireAdmin(req, res, next) {
  if (normalizeRole(req.user?.role) !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Accès réservé à l’administrateur.',
    })
  }
  next()
}

router.use(requireAuth, requireAdmin)

router.get('/', getUsers)
router.post('/', createUser)
router.put('/:id', updateUser)
router.delete('/:id', deleteUser)

module.exports = router