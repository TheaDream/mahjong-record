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

    // 1. 기본 유효성 검사
    if (selectedPlayers.some(p => p === '') || scores.some(s => s === '')) {
      alert('4명의 작사와 점수를 모두 입력해주세요.');
      return;
    }

    const numScores = scores.map(Number);
    if (numScores.reduce((a, b) => a + b, 0) !== 100000) {
      alert('총점이 100,000점이 되어야 합니다.');
      return;
    }

    setLoading(true);

    try {
      // 2. [핵심] matches 생성 - 오직 필수 필드만 전송 (나머지는 DB Default)
      // Conflict 방지를 위해 전송 객체를 비웁니다.
      const { data: matchData, error: matchError } = await supabase
        .from('matches')
        .insert({}) 
        .select('id')
        .single();

      if (matchError) throw matchError;

      // 3. 점수 계산 로직
      const sorted = numScores
        .map((score, i) => ({ user_id: selectedPlayers[i], score }))
        .sort((a, b) => b.score - a.score);

      const uma = [30, 10, -10, -30];
      
      // 전송할 결과 배열 생성 (id 필드 절대 포함 금지)
      const results = sorted.map((item, index) => {
        let netScore = (item.score - 30000) / 1000 + uma[index];
        if (index === 0) netScore += 20; // Oka

        return {
          match_id: matchData.id,
          user_id: item.user_id,
          raw_score: item.score,
          net_score: parseFloat(netScore.toFixed(1)),
          rank: index + 1
        };
      });

      // 4. [핵심] match_results 저장
      // Supabase SDK 이슈를 피하기 위해 가장 표준적인 방식으로 insert
      const { error: resultError } = await supabase
        .from('match_results')
        .insert(results);

      if (resultError) throw resultError;

      alert('대국 기록이 성공적으로 저장되었습니다!');
      router.push('/');

    } catch (error: any) {
      console.error("Critical Error:", error);
      alert(`저장 실패: ${error.message || '알 수 없는 오류'}`);
    } finally {
      setLoading(false);
    }
  };

  // UI 부분은 기존과 동일하게 유지 (생략)
  return (
    <div className="min-h-screen bg-[#f0f4f1] text-slate-800 font-sans pb-20">
      <div className="h-2 bg-green-600 w-full" />
      <div className="p-6 max-w-2xl mx-auto">
        <header className="mb-10 mt-8">
          <button onClick={() => router.push('/')} className="text-slate-400 hover:text-green-600 font-bold text-sm mb-2">← 메인으로 돌아가기</button>
          <h1 className="text-3xl font-black text-slate-900">➕ 새 대국 기록 추가</h1>
        </header>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white shadow-sm rounded-[2.5rem] p-8 border border-white">
            <div className="space-y-6">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="flex gap-4 items-center bg-slate-50 p-5 rounded-3xl">
                  <select
                    value={selectedPlayers[i]}
                    onChange={(e) => {
                      const newP = [...selectedPlayers];
                      newP[i] = e.target.value;
                      setSelectedPlayers(newP);
                    }}
                    className="flex-1 bg-white rounded-xl px-4 py-3 outline-none"
                  >
                    <option value="">작사 선택</option>
                    {players.map(p => <option key={p.id} value={p.id}>{p.nickname}</option>)}
                  </select>
                  <input
                    type="number"
                    value={scores[i]}
                    onChange={(e) => {
                      const newS = [...scores];
                      newS[i] = e.target.value;
                      setScores(newS);
                    }}
                    className="w-32 bg-white rounded-xl px-4 py-3 text-right outline-none"
                    placeholder="점수"
                  />
                </div>
              ))}
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 text-white py-5 rounded-2xl mt-10 font-black text-xl disabled:bg-slate-300"
            >
              {loading ? '저장 중...' : '대국 결과 저장'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}