'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'

type Match = {
  id: string
  home_team: string
  away_team: string
  kickoff_at: string
  home_score: number | null
  away_score: number | null
  status: string
}

type Prediction = {
  match_id: string
  home_score: number
  away_score: number
  points: number
}

export default function MatchesPage() {
  const [matches, setMatches] = useState<Match[]>([])
  const [predictions, setPredictions] = useState<Record<string, Prediction>>({})
  const [drafts, setDrafts] = useState<Record<string, { home: string; away: string }>>({})
  const [saving, setSaving] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const searchParams = useSearchParams()
  const router = useRouter()
  const leagueId = searchParams.get('league')
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }
      setUserId(user.id)

      const { data: matchData } = await supabase
        .from('matches')
        .select('*')
        .order('kickoff_at', { ascending: true })
      setMatches(matchData || [])

      if (leagueId) {
        const { data: predData } = await supabase
          .from('predictions')
          .select('*')
          .eq('user_id', user.id)
          .eq('league_id', leagueId)

        const predMap: Record<string, Prediction> = {}
        predData?.forEach(p => { predMap[p.match_id] = p })
        setPredictions(predMap)
      }
    }
    load()
  }, [leagueId])

  function isLocked(kickoffAt: string) {
    return new Date(kickoffAt) <= new Date()
  }

  function getDraft(matchId: string, side: 'home' | 'away') {
    return drafts[matchId]?.[side] ?? ''
  }

  function setDraft(matchId: string, side: 'home' | 'away', value: string) {
    setDrafts(prev => ({
      ...prev,
      [matchId]: { ...prev[matchId], [side]: value }
    }))
  }

  async function savePrediction(matchId: string) {
    if (!leagueId || !userId) return
    const home = parseInt(drafts[matchId]?.home ?? '')
    const away = parseInt(drafts[matchId]?.away ?? '')
    if (isNaN(home) || isNaN(away)) return

    setSaving(matchId)
    const { data, error } = await supabase
      .from('predictions')
      .upsert(
        { user_id: userId, match_id: matchId, league_id: leagueId, home_score: home, away_score: away },
        { onConflict: 'user_id,match_id,league_id' }
      )
      .select()
      .single()

    if (error) {
      console.error('Erreur prono:', error)
      alert('Erreur : ' + error.message)
    } else if (data) {
      setPredictions(prev => ({ ...prev, [matchId]: data }))
      setDrafts(prev => { const n = { ...prev }; delete n[matchId]; return n })
    }
    setSaving(null)
  }

  const formatDate = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white px-4 py-10">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Link href={leagueId ? `/leagues/${leagueId}` : '/dashboard'} className="text-gray-400 hover:text-white text-sm">
            ← Retour
          </Link>
          <h1 className="text-xl font-bold">⚽ Matchs CdM 2026</h1>
          {!leagueId && (
            <Link href="/leagues" className="text-green-400 text-sm hover:underline">Mes ligues</Link>
          )}
        </div>

        {!leagueId && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 rounded-lg px-4 py-3 text-sm mb-6">
            Sélectionne une ligue pour enregistrer tes pronostics.
          </div>
        )}

        <div className="space-y-4">
          {matches.map(match => {
            const locked = isLocked(match.kickoff_at)
            const pred = predictions[match.match_id] || predictions[match.id]
            const hasDraft = drafts[match.id]?.home !== undefined && drafts[match.id]?.away !== undefined

            return (
              <div key={match.id} className={`bg-gray-900 rounded-2xl p-5 border ${locked ? 'border-gray-800 opacity-80' : 'border-gray-700'}`}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-gray-500">{formatDate(match.kickoff_at)}</span>
                  {locked ? (
                    <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">🔒 Verrouillé</span>
                  ) : (
                    <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">✏️ Ouvert</span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <span className="flex-1 text-right font-semibold">{match.home_team}</span>

                  {locked || !leagueId ? (
                    <div className="flex items-center gap-2">
                      <span className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center font-mono font-bold text-lg">
                        {pred?.home_score ?? (match.home_score ?? '?')}
                      </span>
                      <span className="text-gray-500">-</span>
                      <span className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center font-mono font-bold text-lg">
                        {pred?.away_score ?? (match.away_score ?? '?')}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <input
                        type="number" min="0" max="20"
                        value={getDraft(match.id, 'home') !== '' ? getDraft(match.id, 'home') : (pred ? String(pred.home_score) : '')}
                        onChange={e => setDraft(match.id, 'home', e.target.value)}
                        className="w-10 h-10 bg-gray-800 rounded-lg text-center font-mono font-bold text-lg outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="0"
                      />
                      <span className="text-gray-500">-</span>
                      <input
                        type="number" min="0" max="20"
                        value={getDraft(match.id, 'away') !== '' ? getDraft(match.id, 'away') : (pred ? String(pred.away_score) : '')}
                        onChange={e => setDraft(match.id, 'away', e.target.value)}
                        className="w-10 h-10 bg-gray-800 rounded-lg text-center font-mono font-bold text-lg outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="0"
                      />
                    </div>
                  )}

                  <span className="flex-1 font-semibold">{match.away_team}</span>
                </div>

                {!locked && leagueId && (
                  <div className="mt-3 flex justify-end">
                    <button
                      onClick={() => savePrediction(match.id)}
                      disabled={saving === match.id || (!hasDraft && !pred)}
                      className="text-sm bg-green-500 hover:bg-green-400 disabled:opacity-40 text-black font-semibold px-4 py-1.5 rounded-lg transition-colors"
                    >
                      {saving === match.id ? 'Enregistrement...' : pred && !hasDraft ? '✓ Enregistré' : 'Enregistrer'}
                    </button>
                  </div>
                )}

                {pred && locked && (
                  <div className="mt-2 text-right text-xs text-gray-500">
                    Ton prono : <span className="text-white font-mono">{pred.home_score} - {pred.away_score}</span>
                    {pred.points > 0 && <span className="ml-2 text-green-400">+{pred.points} pts</span>}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
