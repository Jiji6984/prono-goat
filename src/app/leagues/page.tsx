import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function LeaguesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: memberships } = await supabase
    .from('league_members')
    .select('league_id, leagues(id, name, code, created_by)')
    .eq('user_id', user.id)

  const leagues = memberships?.map((m: any) => m.leagues).filter(Boolean) || []

  return (
    <div className="min-h-screen bg-gray-950 text-white px-4 py-10">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Link href="/dashboard" className="text-gray-400 hover:text-white text-sm">← Retour</Link>
          <h1 className="text-xl font-bold">Mes ligues</h1>
          <Link href="/leagues/create" className="text-green-400 text-sm hover:underline">+ Créer</Link>
        </div>

        {leagues.length === 0 ? (
          <div className="bg-gray-900 rounded-2xl p-8 text-center">
            <p className="text-gray-400 mb-4">Tu n&apos;es dans aucune ligue pour l&apos;instant.</p>
            <div className="flex gap-3 justify-center">
              <Link href="/leagues/create" className="bg-green-500 hover:bg-green-400 text-black font-semibold px-4 py-2 rounded-lg text-sm transition-colors">
                Créer une ligue
              </Link>
              <Link href="/leagues/join" className="bg-gray-700 hover:bg-gray-600 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors">
                Rejoindre
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {leagues.map((league: any) => (
              <Link
                key={league.id}
                href={`/leagues/${league.id}`}
                className="block bg-gray-900 hover:bg-gray-800 border border-gray-800 rounded-2xl p-5 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">{league.name}</h3>
                    {league.created_by === user.id && (
                      <span className="text-xs text-gray-500">Admin</span>
                    )}
                  </div>
                  <span className="font-mono text-green-400 bg-green-500/10 border border-green-500/20 px-3 py-1 rounded-lg text-sm tracking-widest">
                    {league.code}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
