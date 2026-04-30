const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

function normalizeRole(role) {
  return String(role || '').toLowerCase() === 'admin' ? 'admin' : 'user'
}

const userSchema = new mongoose.Schema(
  {
    nom: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    motDePasse: { type: String, required: true, minlength: 6, select: false },
    role: {
      type: String,
      enum: ['admin', 'user', 'technicien', 'superviseur'],
      default: 'user',
    },
  },
  { timestamps: true }
)

userSchema.pre('save', async function (next) {
  this.role = normalizeRole(this.role)

  if (!this.isModified('motDePasse')) return next()

  this.motDePasse = await bcrypt.hash(this.motDePasse, 10)
  next()
})

userSchema.pre('findOneAndUpdate', function (next) {
  const update = this.getUpdate() || {}

  if (update.role !== undefined) {
    update.role = normalizeRole(update.role)
  }

  if (update.$set && update.$set.role !== undefined) {
    update.$set.role = normalizeRole(update.$set.role)
  }

  this.setUpdate(update)
  next()
})

userSchema.methods.comparePassword = async function (saisi) {
  return bcrypt.compare(saisi, this.motDePasse)
}

userSchema.methods.toSafeObject = function () {
  const obj = this.toObject()
  obj.role = normalizeRole(obj.role)
  delete obj.motDePasse
  return obj
}

module.exports = mongoose.model('User', userSchema)