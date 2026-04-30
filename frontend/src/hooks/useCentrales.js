import { useState, useEffect, useCallback } from 'react'
import { centralsAPI } from '../services/api'

export function useCentrales() {
  const [centrales, setCentrales] = useState([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState(null)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      const { data } = await centralsAPI.getAll()
      setCentrales(data.data)
      setError(null)
    } catch (e) {
      setError(e.response?.data?.message || 'Erreur de chargement')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const create = async (body) => {
    const { data } = await centralsAPI.create(body)
    await load()
    return data.data
  }

  const update = async (id, body) => {
    const { data } = await centralsAPI.update(id, body)
    await load()
    return data.data
  }

  const remove = async (id) => {
    await centralsAPI.delete(id)
    await load()
  }

  return { centrales, loading, error, reload: load, create, update, remove }
}
