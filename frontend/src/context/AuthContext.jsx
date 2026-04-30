import { createContext, useContext, useState } from 'react'
import { authAPI } from '../services/api'

const AuthContext = createContext(null)

function normalizeRole(role) {
  return String(role || '').toLowerCase() === 'admin' ? 'admin' : 'user'
}

function normalizeUser(user) {
  if (!user) return null
  return {
    ...user,
    role: normalizeRole(user.role),
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const raw = JSON.parse(localStorage.getItem('cpv_user') || 'null')
      return normalizeUser(raw)
    } catch {
      return null
    }
  })

  const [token, setToken] = useState(() => localStorage.getItem('cpv_token'))
  const [loading, setLoading] = useState(false)

  const login = async (email, motDePasse) => {
    setLoading(true)
    try {
      const { data } = await authAPI.login({ email, motDePasse })

      const normalizedUser = normalizeUser(data.user)

      localStorage.setItem('cpv_token', data.token)
      localStorage.setItem('cpv_user', JSON.stringify(normalizedUser))

      setToken(data.token)
      setUser(normalizedUser)

      return { success: true }
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Erreur de connexion',
      }
    } finally {
      setLoading(false)
    }
  }

  const register = async (nom, email, motDePasse, role = 'user') => {
    setLoading(true)
    try {
      await authAPI.register({
        nom,
        email,
        motDePasse,
        role: normalizeRole(role),
      })

      return { success: true }
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Erreur inscription',
      }
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    localStorage.removeItem('cpv_token')
    localStorage.removeItem('cpv_user')
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        isAuth: !!token,
        isAdmin: normalizeRole(user?.role) === 'admin',
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)