const User = require('../models/User');
const jwt = require('jsonwebtoken');

const genToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '7d' });

// POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const { nom, email, motDePasse, role } = req.body;
    if (await User.findOne({ email }))
      return res.status(400).json({ success: false, message: 'Email déjà utilisé.' });
    const user = await User.create({ nom, email, motDePasse, role });
    res.status(201).json({
      success: true,
      token: genToken(user._id),
      user: { id: user._id, nom: user.nom, email: user.email, role: user.role }
    });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
};

// POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, motDePasse } = req.body;
    if (!email || !motDePasse)
      return res.status(400).json({ success: false, message: 'Email et mot de passe requis.' });
    const user = await User.findOne({ email }).select('+motDePasse');
    if (!user || !(await user.comparePassword(motDePasse)))
      return res.status(401).json({ success: false, message: 'Email ou mot de passe incorrect.' });
    res.json({
      success: true,
      token: genToken(user._id),
      user: { id: user._id, nom: user.nom, email: user.email, role: user.role }
    });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// GET /api/auth/me
exports.getMe = async (req, res) => {
  res.json({ success: true, user: req.user });
};
