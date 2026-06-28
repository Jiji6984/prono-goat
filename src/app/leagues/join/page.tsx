'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function JoinLeaguePage() {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth/login'); return }

    const { data: league, error: leagueError } = await supabase
      .from('leagues')
      .select('id, name')
      .eq('code', code.toUpperCase().trim())
      .single()

    if (leagueError || !league) {
      setError('Code invalide. Vérifie le code et réessaie.')
      setLoading(false)
      return
    }

    const { error: memberError } = await supabase
      .from('league_members')
      .insert({ league_id: league.id, user_id: user.id })

    if (memberError) {
      if (memberError.code === '23505') {
        setError('Tu fais déjà partie de cette ligue.')
      } else {
        setError(memberError.message)
      }
      setLoading(false)
      return
    }

    router.push(`/leagues/${league.id}`)
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white px-4 py-10">
      <div className="max-w-md mx-auto">
        <Link href="/dashboard" className="text-gray-400 hover:text-white text-sm mb-6 inline-block">
          ← Retour
        </Link>

        <h1 className="text-2xl font-bold mb-6">Rejoindre une ligue</h1>

        <form onSubmit={handleJoin} className="bg-gray-900 rounded-2xl p-8 space-y-5">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg px-4 py-3 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm text-gray-400 mb-1">Code d&apos;invitation</label>
            <input
              type="text"
              value={code}
              onChange={e => setCode(e.target.value)}
              required
              maxLength={6}
              className="w-full bg-gray-800 text-white rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-green-500 uppercase tracking-widest text-center text-xl font-mono"
              placeholder="ABC123"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-500 hover:bg-green-400 disabled:opacity-50 text-black font-semibold rounded-lg py-3 transition-colors"
          >
            {loading ? 'Recherche...' : 'Rejoindre'}
          </button>
        </form>
      </div>
    </div>
  )
}
