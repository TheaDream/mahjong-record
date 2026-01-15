'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function HistoryPage() {
  const router = useRouter();
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const { data: results, error: resError } = await supabase
        .from('match_results')
        .select('*, created_at');

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, nickname');

      if (resError) throw resError;

      const profileMap: Record<string, string> = {};
      profiles?.forEach(p => { profileMap[p.id] = p.nickname; });

      const grouped: Record<string, any> = {};
      results?.forEach((cur) => {
        const mId = cur.match_id;
        if (!grouped[mId]) {
          grouped[mId] = { 
            id: mId, 
            date: cur.created_at || new Date().toISOString(), 
            results: [] 
          };
        }
        grouped[mId].results.push({
          ...cur,
          nickname: profileMap[cur.user_id] || '퇴장한 작사'
        });
      });

      const sortedMatches = Object.values(grouped).sort((a: any, b: any) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      setMatches(sortedMatches);
    } catch (error: any) {
      console.error('데이터 로드 에러:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchHistory(); }, []);

  const deleteMatch = async (matchId: string) => {
    if (!confirm('이 대국 기록을 삭제하시겠습니까?\n해당 판의 모든 데이터가 삭제됩니다.')) return;

    try {
      const { error } = await supabase
        .from('match_results')
        .delete()
        .eq('match_id', matchId);

      if (error) throw error;
      alert('삭제되었습니다.');
      fetchHistory();
    } catch (error: any) {
      alert('삭제 중 오류 발생: ' + error.message);
    }
  };

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    return `${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-[#f0f4f1] text-slate-800 font-sans pb-20">
      <div className="h-2 bg-green-600 w-full" />

      <div className="p-6 max-w-3xl mx-auto">
        {/* 상단 네비게이션 */}
        <header className="flex justify-between items-center mb-10 mt-8">
          <div>
            <button 
              onClick={() => router.push('/')}
              className="text-slate-400 hover:text-green-600 font-bold text-sm transition-colors flex items-center gap-1 mb-2"
            >
              ← 랭킹 보드로 돌아가기
            </button>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">📜 대국 기록</h1>
          </div>
          <button 
            onClick={fetchHistory}
            className="p-3 bg-white rounded-xl border border-slate-200 shadow-sm hover:bg-slate-50 transition-all active:scale-95"
          >
            🔄
          </button>
        </header>

        {loading ? (
          <div className="py-20 text-center text-slate-400 font-bold animate-pulse">기록을 불러오는 중...</div>
        ) : matches.length === 0 ? (
          <div className="py-20 text-center bg-white rounded-[2.5rem] border border-white shadow-sm text-slate-400 font-medium">
            아직 기록된 대국이 없습니다.
          </div>
        ) : (
          <div className="space-y-8">
            {matches.map((match) => (
              <div key={match.id} className="bg-white shadow-[0_8px_30px_rgb(0,0,0,0.02)] rounded-[2.5rem] overflow-hidden border border-white p-8 relative group">
                
                {/* 헤더: 날짜 및 삭제 버튼 */}
                <div className="flex justify-between items-start mb-6">
                  <div className="px-4 py-1.5 bg-slate-50 rounded-full border border-slate-100 text-[11px] font-black text-slate-400 tracking-wider font-mono">
                    {formatDate(match.date)}
                  </div>
                  <button 
                    onClick={() => deleteMatch(match.id)}
                    className="text-slate-300 hover:text-rose-500 font-bold text-xs transition-colors opacity-0 group-hover:opacity-100 p-1"
                  >
                    기록 삭제
                  </button>
                </div>

                {/* 대국 결과 리스트 */}
                <div className="space-y-3">
                  {match.results.sort((a: any, b: any) => a.rank - b.rank).map((res: any) => (
                    <div key={res.id} className="flex justify-between items-center bg-slate-50/50 px-5 py-4 rounded-2xl border border-transparent hover:border-slate-100 transition-all">
                      <div className="flex items-center gap-4">
                        <div className={`w-8 h-8 flex items-center justify-center rounded-lg font-black text-sm shadow-sm ${
                          res.rank === 1 ? 'bg-yellow-400 text-white' : 
                          res.rank === 2 ? 'bg-slate-300 text-slate-600' : 
                          res.rank === 3 ? 'bg-orange-300 text-white' : 'bg-blue-200 text-blue-600'
                        }`}>
                          {res.rank}
                        </div>
                        <span className="font-bold text-lg text-slate-800">{res.nickname}</span>
                      </div>
                      
                      <div className="flex items-center gap-6">
                        <span className="text-slate-400 font-medium text-sm">{res.raw_score.toLocaleString()}</span>
                        <span className={`font-black text-xl w-20 text-right tracking-tighter ${
                          res.net_score > 0 ? 'text-green-600' : res.net_score < 0 ? 'text-rose-500' : 'text-slate-300'
                        }`}>
                          {res.net_score > 0 ? `+${res.net_score}` : res.net_score}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}