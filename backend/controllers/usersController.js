const bcrypt = require('bcryptjs')
const User = require('../models/User')

function normalizeRole(role) {
  return String(role || '').toLowerCase() === 'admin' ? 'admin' : 'user'
}

function sanitizeUser(userDoc) {
  if (!userDoc) return null
  const obj = userDoc.toObject ? userDoc.toObject() : { ...userDoc }
  delete obj.motDePasse
  obj.role = normalizeRole(obj.role)
  return obj
}

exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 })

    return res.json({
      success: true,
      users: users.map(sanitizeUser),
    })
  } catch (error) {
    console.error('Erreur getUsers:', error)
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur lors du chargement des comptes.',
    })
  }
}

exports.createUser = async (req, res) => {
  try {
    const { nom, email, motDePasse, role } = req.body

    if (!nom || !email || !motDePasse) {
      return res.status(400).json({
        success: false,
        message: 'Nom, email et mot de passe sont obligatoires.',
      })
    }

    if (String(motDePasse).length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Le mot de passe doit contenir au moins 6 caractères.',
      })
    }

    const existing = await User.findOne({ email: String(email).toLowerCase().trim() })
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Cet email existe déjà.',
      })
    }

    const user = await User.create({
      nom: String(nom).trim(),
      email: String(email).toLowerCase().trim(),
      motDePasse: String(motDePasse),
      role: normalizeRole(role),
    })

    return res.status(201).json({
      success: true,
      message: 'Compte créé avec succès.',
      user: sanitizeUser(user),
    })
  } catch (error) {
    console.error('Erreur createUser:', error)
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la création du compte.',
    })
  }
}

exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params
    const { nom, email, motDePasse, role } = req.body

    const user = await User.findById(id)
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Compte introuvable.',
      })
    }

    if (email) {
      const existing = await User.findOne({
        email: String(email).toLowerCase().trim(),
        _id: { $ne: id },
      })

      if (existing) {
        return res.status(409).json({
          success: false,
          message: 'Cet email est déjà utilisé par un autre compte.',
        })
      }
    }

    if (nom !== undefined) user.nom = String(nom).trim()
    if (email !== undefined) user.email = String(email).toLowerCase().trim()
    if (role !== undefined) user.role = normalizeRole(role)

    if (motDePasse !== undefined && String(motDePasse).trim() !== '') {
      if (String(motDePasse).length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Le mot de passe doit contenir au moins 6 caractères.',
        })
      }

      user.motDePasse = await bcrypt.hash(String(motDePasse), 10)
    }

    await user.save()

    return res.json({
      success: true,
      message: 'Compte mis à jour avec succès.',
      user: sanitizeUser(user),
    })
  } catch (error) {
    console.error('Erreur updateUser:', error)
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la mise à jour du compte.',
    })
  }
}

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params

    if (String(req.user?.id) === String(id)) {
      return res.status(400).json({
        success: false,
        message: 'Vous ne pouvez pas supprimer votre propre compte.',
      })
    }

    const user = await User.findById(id)
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Compte introuvable.',
      })
    }

    await User.findByIdAndDelete(id)

    return res.json({
      success: true,
      message: 'Compte supprimé avec succès.',
    })
  } catch (error) {
    console.error('Erreur deleteUser:', error)
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la suppression du compte.',
    })
  }
}