import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', user.id)
    .single()

  const username = profile?.username || user.email?.split('@')[0]

  const { data: memberships } = await supabase
    .from('league_members')
    .select('league_id, leagues(id, name, code)')
    .eq('user_id', user.id)

  const leagues = memberships?.map((m: any) => m.leagues).filter(Boolean) || []

  const { data: predictions } = await supabase
    .from('predictions')
    .select('points, match_id')
    .eq('user_id', user.id)

  const totalPronos = predictions?.length || 0
  const totalPoints = predictions?.reduce((sum, p) => sum + (p.points || 0), 0) || 0
  const exactPronos = predictions?.filter(p => p.points === 3).length || 0

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">⚽ Prono du GOAT</h1>
        <div className="flex items-center gap-4">
          <span className="text-gray-400 text-sm">
            Bonjour, <span className="text-white font-medium">{username}</span>
          </span>
          <form action="/auth/logout" method="post">
            <button className="text-sm text-gray-400 hover:text-white transition-colors">
              Déconnexion
            </button>
          </form>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h2 className="text-2xl font-bold">Tableau de bord</h2>
          <p className="text-gray-400 mt-1">Coupe du Monde 2026 — que le meilleur pronostiqueur gagne !</p>
        </div>

        {/* Stats perso */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-gray-900 rounded-2xl p-5 text-center">
            <p className="text-3xl font-bold text-green-400">{totalPoints}</p>
            <p className="text-gray-400 text-sm mt-1">Points total</p>
          </div>
          <div className="bg-gray-900 rounded-2xl p-5 text-center">
            <p className="text-3xl font-bold text-yellow-400">{exactPronos}</p>
            <p className="text-gray-400 text-sm mt-1">Scores exacts</p>
          </div>
          <div className="bg-gray-900 rounded-2xl p-5 text-center">
            <p className="text-3xl font-bold text-white">{totalPronos}</p>
            <p className="text-gray-400 text-sm mt-1">Pronos joués</p>
          </div>
        </div>

        {/* Mes ligues */}
        {leagues.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-3">Mes ligues</h3>
            <div className="space-y-3">
              {leagues.map((league: any) => (
                <div key={league.id} className="bg-gray-900 border border-gray-800 rounded-2xl p-4 flex items-center justify-between">
                  <span className="font-medium">{league.name}</span>
                  <div className="flex gap-2">
                    <Link href={`/matches?league=${league.id}`} className="text-sm bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded-lg transition-colors">
                      Pronos
                    </Link>
                    <Link href={`/leagues/${league.id}/ranking`} className="text-sm bg-green-500/10 hover:bg-green-500/20 text-green-400 px-3 py-1.5 rounded-lg transition-colors">
                      Classement
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link href="/leagues/create" className="bg-gray-900 hover:bg-gray-800 border border-gray-800 rounded-2xl p-6 transition-colors">
            <div className="text-3xl mb-3">🏆</div>
            <h3 className="text-lg font-semibold">Créer une ligue</h3>
            <p className="text-gray-400 text-sm mt-1">Lance ton groupe et invite tes amis</p>
          </Link>

          <Link href="/leagues/join" className="bg-gray-900 hover:bg-gray-800 border border-gray-800 rounded-2xl p-6 transition-colors">
            <div className="text-3xl mb-3">🎟️</div>
            <h3 className="text-lg font-semibold">Rejoindre une ligue</h3>
            <p className="text-gray-400 text-sm mt-1">Entre un code d&apos;invitation</p>
          </Link>
        </div>
      </main>
    </div>
  )
}
