import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

type RankEntry = {
  user_id: string
  username: string
  total_points: number
  exact: number
  correct: number
  total_pronos: number
}

export default async function RankingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: league } = await supabase
    .from('leagues')
    .select('*')
    .eq('id', id)
    .single()

  if (!league) redirect('/dashboard')

  const { data: members } = await supabase
    .from('league_members')
    .select('user_id')
    .eq('league_id', id)

  const userIds = members?.map(m => m.user_id) || []

  const { data: profilesData } = await supabase
    .from('profiles')
    .select('id, username')
    .in('id', userIds)

  const profileMap: Record<string, string> = {}
  profilesData?.forEach((p: any) => { profileMap[p.id] = p.username })

  const { data: predictions } = await supabase
    .from('predictions')
    .select('user_id, points, home_score, away_score, match_id, matches(home_score, away_score, status)')
    .eq('league_id', id)

  const rankMap: Record<string, RankEntry> = {}

  members?.forEach((m: any) => {
    rankMap[m.user_id] = {
      user_id: m.user_id,
      username: profileMap[m.user_id] || m.user_id.slice(0, 8),
      total_points: 0,
      exact: 0,
      correct: 0,
      total_pronos: 0,
    }
  })

  predictions?.forEach((p: any) => {
    if (!rankMap[p.user_id]) return
    const match = p.matches
    rankMap[p.user_id].total_pronos++

    if (match?.status === 'finished' && match.home_score !== null) {
      const pts = calculatePoints(p.home_score, p.away_score, match.home_score, match.away_score)
      rankMap[p.user_id].total_points += pts
      if (pts === 3) rankMap[p.user_id].exact++
      else if (pts === 1) rankMap[p.user_id].correct++
    }
  })

  const ranking = Object.values(rankMap).sort((a, b) => b.total_points - a.total_points)

  return (
    <div className="min-h-screen bg-gray-950 text-white px-4 py-10">
      <div className="max-w-2xl mx-auto">
        <Link href={`/leagues/${id}`} className="text-gray-400 hover:text-white text-sm mb-6 inline-block">
          ← Retour
        </Link>

        <h1 className="text-2xl font-bold mb-2">🏅 Classement</h1>
        <p className="text-gray-400 text-sm mb-6">{league.name}</p>

        <div className="bg-gray-900 rounded-2xl overflow-hidden">
          <div className="grid grid-cols-12 text-xs text-gray-500 px-4 py-3 border-b border-gray-800">
            <span className="col-span-1">#</span>
            <span className="col-span-5">Joueur</span>
            <span className="col-span-2 text-center">Pts</span>
            <span className="col-span-2 text-center">Exacts</span>
            <span className="col-span-2 text-center">Pronos</span>
          </div>

          {ranking.length === 0 && (
            <div className="px-4 py-8 text-center text-gray-500">
              Aucun membre pour l&apos;instant.
            </div>
          )}

          {ranking.map((entry, i) => (
            <div
              key={entry.user_id}
              className={`grid grid-cols-12 items-center px-4 py-4 border-b border-gray-800 last:border-0 ${entry.user_id === user.id ? 'bg-green-500/5' : ''}`}
            >
              <span className={`col-span-1 font-bold text-lg ${i === 0 ? 'text-yellow-400' : i === 1 ? 'text-gray-300' : i === 2 ? 'text-amber-600' : 'text-gray-500'}`}>
                {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
              </span>
              <span className="col-span-5 font-medium">
                {entry.username}
                {entry.user_id === user.id && <span className="ml-2 text-xs text-green-400">(moi)</span>}
              </span>
              <span className="col-span-2 text-center font-bold text-green-400">{entry.total_points}</span>
              <span className="col-span-2 text-center text-yellow-400">{entry.exact}</span>
              <span className="col-span-2 text-center text-gray-400">{entry.total_pronos}</span>
            </div>
          ))}
        </div>

        <div className="mt-6 bg-gray-900 rounded-2xl p-4 text-sm text-gray-400">
          <p className="font-semibold text-white mb-2">Système de points</p>
          <div className="space-y-1">
            <p>🎯 <span className="text-yellow-400 font-bold">3 pts</span> — Score exact</p>
            <p>✅ <span className="text-green-400 font-bold">1 pt</span> — Bonne tendance (victoire/nul)</p>
            <p>❌ <span className="text-red-400 font-bold">0 pt</span> — Mauvais pronostic</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function calculatePoints(predHome: number, predAway: number, realHome: number, realAway: number): number {
  if (predHome === realHome && predAway === realAway) return 3
  const predResult = predHome > predAway ? 'H' : predHome < predAway ? 'A' : 'D'
  const realResult = realHome > realAway ? 'H' : realHome < realAway ? 'A' : 'D'
  if (predResult === realResult) return 1
  return 0
}
