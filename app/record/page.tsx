'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function RecordPage() {
  const router = useRouter();
  const [players, setPlayers] = useState<any[]>([]);
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>(['', '', '', '']);
  const [scores, setScores] = useState<string[]>(['', '', '', '']);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchPlayers = async () => {
      const { data } = await supabase.from('profiles').select('*').order('nickname');
      if (data) setPlayers(data);
    };
    fetchPlayers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedPlayers.some(p => p === '') || scores.some(s => s === '')) {
      alert('4명의 작사와 점수를 모두 입력해주세요.');
      return;
    }

    const numScores = scores.map(Number);
    const totalScore = numScores.reduce((a, b) => a + b, 0);
    if (totalScore !== 100000) {
      alert(`총점이 100,000점이 되어야 합니다. (현재: ${totalScore.toLocaleString()}점)`);
      return;
    }

    setLoading(true);
    try {
      const matchId = crypto.randomUUID();
      const sorted = numScores
        .map((score, i) => ({ id: selectedPlayers[i], score, originalIndex: i }))
        .sort((a, b) => b.score - a.score);

      const uma = [30, 10, -10, -30];
      const results = sorted.map((item, index) => {
        let netScore = (item.score - 30000) / 1000 + uma[index];
        if (index === 0) netScore += 20; // Oka
        return {
          match_id: matchId,
          user_id: item.id,
          raw_score: item.score,
          net_score: parseFloat(netScore.toFixed(1)),
          rank: index + 1,
        };
      });

      const { error } = await supabase.from('match_results').insert(results);
      if (error) throw error;

      alert('대국 기록이 성공적으로 저장되었습니다!');
      router.push('/');
    } catch (error: any) {
      alert('저장 오류: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f0f4f1] text-slate-800 font-sans pb-20">
      <div className="h-2 bg-green-600 w-full" />

      <div className="p-6 max-w-2xl mx-auto">
        <header className="mb-10 mt-8">
          <button 
            onClick={() => router.push('/')}
            className="text-slate-400 hover:text-green-600 font-bold text-sm transition-colors flex items-center gap-1 mb-2"
          >
            ← 메인으로 돌아가기
          </button>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">➕ 새 대국 기록 추가</h1>
          <p className="text-slate-500 font-medium mt-1 italic">"M리그 룰(25,000점 시작 / 30,000점 반환)이 적용."</p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white shadow-[0_8px_30px_rgb(0,0,0,0.02)] rounded-[2.5rem] overflow-hidden border border-white p-8">
            <div className="space-y-6">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="flex flex-col md:flex-row gap-4 items-center bg-slate-50 p-5 rounded-3xl border border-transparent focus-within:border-green-200 transition-all">
                  <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-white shadow-sm font-black text-slate-400">
                    {i + 1}
                  </div>
                  
                  <select
                    value={selectedPlayers[i]}
                    onChange={(e) => {
                      const newP = [...selectedPlayers];
                      newP[i] = e.target.value;
                      setSelectedPlayers(newP);
                    }}
                    className="flex-1 bg-white border-none rounded-xl px-4 py-3 font-bold text-slate-700 focus:ring-2 focus:ring-green-500 transition-all outline-none"
                  >
                    <option value="">작사 선택</option>
                    {players.map(p => (
                      <option key={p.id} value={p.id}>{p.nickname}</option>
                    ))}
                  </select>

                  <input
                    type="number"
                    placeholder="점수 (예: 6974)"
                    value={scores[i]}
                    onChange={(e) => {
                      const newS = [...scores];
                      newS[i] = e.target.value;
                      setScores(newS);
                    }}
                    className="w-full md:w-40 bg-white border-none rounded-xl px-4 py-3 font-black text-slate-700 text-right focus:ring-2 focus:ring-green-500 transition-all outline-none"
                  />
                  <span className="hidden md:block text-slate-300 font-bold">점</span>
                </div>
              ))}
            </div>

            <div className="mt-10 pt-8 border-t border-slate-100">
              <div className="flex justify-between items-center mb-6">
                <span className="text-slate-400 font-bold">총점 합계</span>
                <span className={`text-2xl font-black ${
                  scores.reduce((a, b) => a + Number(b), 0) === 100000 ? 'text-green-600' : 'text-rose-500'
                }`}>
                  {scores.reduce((a, b) => a + Number(b), 0).toLocaleString()} / 100,000
                </span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-xl shadow-xl hover:bg-slate-800 transition-all active:scale-[0.98] disabled:bg-slate-300"
              >
                {loading ? '기록 저장 중...' : '대국 결과 저장'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}