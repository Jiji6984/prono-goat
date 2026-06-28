'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

function generateCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

export default function CreateLeaguePage() {
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth/login'); return }

    const code = generateCode()

    const { data: league, error: leagueError } = await supabase
      .from('leagues')
      .insert({ name, code, created_by: user.id })
      .select()
      .single()

    if (leagueError) {
      setError(leagueError.message)
      setLoading(false)
      return
    }

    await supabase.from('league_members').insert({ league_id: league.id, user_id: user.id })

    router.push(`/leagues/${league.id}`)
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white px-4 py-10">
      <div className="max-w-md mx-auto">
        <Link href="/dashboard" className="text-gray-400 hover:text-white text-sm mb-6 inline-block">
          ← Retour
        </Link>

        <h1 className="text-2xl font-bold mb-6">Créer une ligue</h1>

        <form onSubmit={handleCreate} className="bg-gray-900 rounded-2xl p-8 space-y-5">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg px-4 py-3 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm text-gray-400 mb-1">Nom de la ligue</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              className="w-full bg-gray-800 text-white rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Les Experts du Ballon"
            />
          </div>

          <p className="text-gray-500 text-sm">
            Un code d&apos;invitation unique sera généré automatiquement pour partager à tes amis.
          </p>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-500 hover:bg-green-400 disabled:opacity-50 text-black font-semibold rounded-lg py-3 transition-colors"
          >
            {loading ? 'Création...' : 'Créer la ligue'}
          </button>
        </form>
      </div>
    </div>
  )
}
