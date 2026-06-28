import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function LeaguePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: league } = await supabase
    .from('leagues')
    .select('*')
    .eq('id', id)
    .single()

  if (!league) redirect('/leagues')

  const { data: members } = await supabase
    .from('league_members')
    .select('user_id, joined_at')
    .eq('league_id', id)

  return (
    <div className="min-h-screen bg-gray-950 text-white px-4 py-10">
      <div className="max-w-2xl mx-auto">
        <Link href="/dashboard" className="text-gray-400 hover:text-white text-sm mb-6 inline-block">
          ← Retour au dashboard
        </Link>

        <div className="bg-gray-900 rounded-2xl p-6 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold">{league.name}</h1>
              <p className="text-gray-400 text-sm mt-1">{members?.length ?? 0} membre(s)</p>
            </div>
            <div className="text-right">
              <p className="text-gray-400 text-xs mb-1">Code d&apos;invitation</p>
              <span className="bg-green-500/10 text-green-400 border border-green-500/30 font-mono font-bold text-lg px-4 py-2 rounded-lg tracking-widest">
                {league.code}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            href={`/matches?league=${id}`}
            className="bg-gray-900 hover:bg-gray-800 border border-gray-800 rounded-2xl p-6 transition-colors"
          >
            <div className="text-3xl mb-3">📅</div>
            <h3 className="text-lg font-semibold">Faire mes pronos</h3>
            <p className="text-gray-400 text-sm mt-1">Pronostique les matchs avant le coup d&apos;envoi</p>
          </Link>

          <Link
            href={`/leagues/${id}/ranking`}
            className="bg-gray-900 hover:bg-gray-800 border border-gray-800 rounded-2xl p-6 transition-colors"
          >
            <div className="text-3xl mb-3">🏅</div>
            <h3 className="text-lg font-semibold">Classement</h3>
            <p className="text-gray-400 text-sm mt-1">Voir qui mène la course</p>
          </Link>
        </div>
      </div>
    </div>
  )
}
