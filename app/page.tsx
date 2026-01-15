'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const [stats, setStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const { data: profiles } = await supabase.from('profiles').select('*');
      const { data: results } = await supabase.from('match_results').select('*');

      if (!profiles || !results) return;

      const playerStats = profiles.map(player => {
        const myResults = results.filter(r => r.user_id === player.id);
        const totalPoints = myResults.reduce((sum, r) => sum + (r.net_score || 0), 0);
        const gameCount = myResults.length;
        const avgRank = gameCount > 0 
          ? (myResults.reduce((sum, r) => sum + r.rank, 0) / gameCount).toFixed(2) 
          : '-';

        return {
          ...player,
          totalPoints: parseFloat(totalPoints.toFixed(1)),
          gameCount,
          avgRank
        };
      });

      setStats(playerStats.sort((a, b) => b.totalPoints - a.totalPoints));
    } catch (error) {
      console.error('데이터 처리 중 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div className="min-h-screen bg-[#f0f4f1] text-slate-800 font-sans pb-20">
      <div className="h-2 bg-green-600 w-full" />

      <div className="p-6 max-w-4xl mx-auto">
        {/* 헤더 섹션 */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 mt-8 gap-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-red-100 text-green-600 text-xs font-black px-2 py-1 rounded-md uppercase tracking-tighter">Season 2026</span>
            </div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              <span className="text-red-600">🀄</span>
              <span>작마에 미친 자들</span>
              <span className="text-red-600">🀄</span>
            </h1>
            <p className="text-slate-500 font-medium mt-1 italic">
              "과연 어디까지 미쳐버린것인가."
            </p>
          </div>
          
          <div className="flex gap-3 w-full md:w-auto">
            <button 
              onClick={() => router.push('/history')}
              className="flex-1 md:flex-none bg-white text-slate-700 px-6 py-3 rounded-2xl font-bold shadow-sm border border-slate-200 hover:bg-slate-50 transition-all active:scale-95"
            >
              📜 대국 기록
            </button>
            <button 
              onClick={() => router.push('/record')}
              className="flex-1 md:flex-none bg-slate-900 text-white px-6 py-3 rounded-2xl font-bold shadow-xl hover:bg-slate-800 transition-all shadow-slate-200 active:scale-95"
            >
              ➕ 대국 기록 추가
            </button>
          </div>
        </header>

        {/* 랭킹 테이블 */}
        <div className="bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2.5rem] overflow-hidden border border-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Rank</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Player</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Games</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Avg. Rank</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Total PT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {stats.map((player, index) => (
                  <tr key={player.id} className="group hover:bg-green-50/40 transition-all">
                    <td className="px-8 py-6">
                      <div className="flex items-center justify-center w-10 h-10 rounded-xl font-black text-lg bg-slate-50 group-hover:bg-white transition-colors border border-transparent group-hover:border-green-100">
                        {index + 1 === 1 ? '🥇' : index + 1 === 2 ? '🥈' : index + 1 === 3 ? '🥉' : index + 1}
                      </div>
                    </td>
                    {/* 수정된 부분: 닉네임 클릭 시 통계 페이지 이동 */}
                    <td className="px-8 py-6 font-bold text-xl text-slate-800 group-hover:text-green-700 transition-colors">
                      <button 
                        onClick={() => router.push(`/stats/${player.id}`)}
                        className="hover:underline decoration-green-500 underline-offset-4 text-left"
                      >
                        {player.nickname}
                      </button>
                    </td>
                    <td className="px-8 py-6 text-right font-bold text-slate-400">
                      {player.gameCount}
                    </td>
                    <td className="px-8 py-6 text-right font-black text-blue-500/80">
                      {player.avgRank}
                    </td>
                    <td className={`px-8 py-6 text-right font-black text-2xl tracking-tighter ${
                      player.totalPoints > 0 ? 'text-green-600' : player.totalPoints < 0 ? 'text-rose-500' : 'text-slate-300'
                    }`}>
                      {player.totalPoints > 0 ? `+${player.totalPoints}` : player.totalPoints}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {loading && (
            <div className="py-32 text-center text-slate-300 animate-pulse font-bold">
              데이터를 불러오는 중...
            </div>
          )}
          
          {!loading && stats.length === 0 && (
            <div className="py-32 text-center text-slate-400">
              데이터가 없습니다. 첫 기록을 등록해 보세요!
            </div>
          )}
        </div>

        {/* 푸터 */}
        <footer className="mt-12 flex flex-col items-center gap-4">
          <div className="h-px w-20 bg-slate-200" />
          <button 
            onClick={() => router.push('/manage')}
            className="flex items-center gap-2 text-slate-400 hover:text-slate-600 font-bold text-sm transition-colors group"
          >
            <span className="p-2 bg-white rounded-lg border border-slate-200 group-hover:border-slate-300 shadow-sm transition-all">⚙️</span>
            작사 관리
          </button>
        </footer>
      </div>
    </div>
  );
}