'use client';

import { useEffect, useState, useMemo } from 'react'; // useMemo 추가
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { FaPlus, FaArrowLeft, FaDiceD6, FaCrown, FaTimes, FaCheckCircle, FaSpinner } from 'react-icons/fa'; // 아이콘 추가

export default function RecordPage() {
  const router = useRouter();
  const [players, setPlayers] = useState<any[]>([]);
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>(['', '', '', '']);
  const [scores, setScores] = useState<string[]>(['', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false); // 제출 상태 추가

  useEffect(() => {
    const fetchPlayers = async () => {
      const { data } = await supabase.from('profiles').select('*').order('nickname');
      if (data) setPlayers(data);
    };
    fetchPlayers();
  }, []);

  // 총점 합계 계산 (useMemo로 최적화)
  const totalScore = useMemo(() => scores.reduce((a, b) => a + Number(b || 0), 0), [scores]);
  const isTotalScoreValid = totalScore === 100000;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. 기본 유효성 검사
    if (selectedPlayers.some(p => p === '') || scores.some(s => s === '')) {
      alert('4명의 작사와 점수를 모두 입력해주세요.');
      return;
    }

    const uniquePlayers = new Set(selectedPlayers);
    if (uniquePlayers.size !== 4) {
      alert('중복된 작사가 선택되었습니다.');
      return;
    }

    if (!isTotalScoreValid) {
      alert(`총점이 100,000점이 되어야 합니다. (현재: ${totalScore.toLocaleString()}점)`);
      return;
    }

    setLoading(true);

    try {
      // 2. 대국 생성 (matches)
      const { data: matchData, error: matchError } = await supabase
        .from('matches')
        .insert({})
        .select('id')
        .single();

      if (matchError) {
        throw new Error(`대국 생성 실패: ${matchError.message}`);
      }
      if (!matchData?.id) {
        throw new Error('대국 ID를 가져오지 못했습니다.');
      }

      // 3. 순위 및 M리그 점수 계산
      const numScores = scores.map(Number);
      const sorted = numScores
        .map((score, i) => ({ user_id: selectedPlayers[i], score }))
        .sort((a, b) => b.score - a.score);

      const uma = [30, 10, -10, -30];
      const results = sorted.map((item, index) => {
        let netScore = (item.score - 30000) / 1000 + uma[index];
        if (index === 0) netScore += 20; // Oka (25000점 시작, 30000점 반환 룰)

        return {
          match_id: matchData.id,
          user_id: item.user_id,
          raw_score: item.score,
          net_score: parseFloat(netScore.toFixed(1)),
          rank: index + 1,
        };
      });

      // 4. 결과 저장 (match_results)
      const { error: resultError } = await supabase
        .from('match_results')
        .insert(results);

      if (resultError) {
        throw new Error(`결과 저장 실패: ${resultError.message}`);
      }

      setIsSubmitted(true); // 성공 시 제출 상태 변경
      setTimeout(() => { // 1.5초 후 메인으로 이동
        router.push('/');
      }, 1500);

    } catch (error: any) {
      console.error("저장 중 오류 발생:", error);
      alert('오류: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 text-slate-800 font-sans pb-20">
      {/* 상단 액센트 바 */}
      <div className="h-2 bg-gradient-to-r from-teal-500 to-green-600 w-full shadow-md" />

      <div className="p-6 max-w-3xl mx-auto">
        {/* 헤더 섹션 */}
        <header className="mb-12 mt-8 flex flex-col items-start">
          <button 
            onClick={() => router.push('/')}
            className="text-emerald-700 hover:text-emerald-900 font-bold text-sm transition-colors flex items-center gap-1 mb-4 p-2 -ml-2 rounded-lg"
          >
            <FaArrowLeft className="text-lg" />
            메인으로 돌아가기
          </button>
          <div className="flex items-center gap-4 mb-2">
            <div className="p-4 bg-emerald-500 rounded-2xl shadow-lg">
              <FaPlus className="text-white text-3xl" />
            </div>
            <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">새 대국 기록 추가</h1>
          </div>
          <p className="text-slate-600 font-medium mt-2 text-lg italic pl-16">"M리그 룰 (25,000점 시작 / 30,000점 반환) 적용"</p>
        </header>

        {/* 폼 섹션 */}
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="bg-white shadow-2xl rounded-[3rem] p-10 border border-emerald-50 relative">
            <div className="space-y-6">
              {[0, 1, 2, 3].map((i) => (
                <div 
                  key={i} 
                  className="flex flex-col md:flex-row gap-4 items-center bg-emerald-50 p-6 rounded-3xl border border-transparent transition-all focus-within:border-emerald-300 hover:shadow-sm"
                >
                  <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-white shadow-md font-black text-emerald-500 text-xl">
                    <FaDiceD6 /> {/* 주사위 아이콘 */}
                  </div>
                  
                  <select
                    value={selectedPlayers[i]}
                    onChange={(e) => {
                      const newP = [...selectedPlayers];
                      newP[i] = e.target.value;
                      setSelectedPlayers(newP);
                    }}
                    className="flex-1 bg-white border-2 border-emerald-100 rounded-xl px-5 py-3 font-semibold text-slate-700 focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 transition-all outline-none appearance-none cursor-pointer"
                  >
                    <option value="" disabled>작사 선택</option>
                    {players.map(p => (
                      <option key={p.id} value={p.id}>{p.nickname}</option>
                    ))}
                  </select>

                  <input
                    type="number"
                    placeholder="점수 (예: 32000)"
                    value={scores[i]}
                    onChange={(e) => {
                      const newS = [...scores];
                      newS[i] = e.target.value;
                      setScores(newS);
                    }}
                    className="w-full md:w-48 bg-white border-2 border-emerald-100 rounded-xl px-5 py-3 font-extrabold text-slate-800 text-right focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 transition-all outline-none"
                    min="0"
                    max="100000" // 점수 범위 제한
                  />
                  <span className="hidden md:block text-slate-400 font-bold text-lg">점</span>
                </div>
              ))}
            </div>

            {/* 총점 합계 및 저장 버튼 */}
            <div className="mt-12 pt-10 border-t border-emerald-100">
              <div className="flex justify-between items-center mb-8 bg-emerald-50 p-6 rounded-2xl shadow-inner">
                <span className="text-slate-600 font-bold text-lg flex items-center gap-2">
                  <FaCrown className="text-yellow-500 text-2xl"/> 총점 합계
                </span>
                <span className={`text-3xl font-extrabold ${
                  isTotalScoreValid ? 'text-emerald-600' : 'text-rose-500'
                }`}>
                  {totalScore.toLocaleString()} / 100,000
                </span>
              </div>

              <button
                type="submit"
                disabled={loading || isSubmitted}
                className={`w-full py-6 rounded-3xl font-black text-2xl shadow-xl transition-all active:scale-[0.98] 
                  ${loading || isSubmitted 
                    ? 'bg-slate-300 text-slate-500 cursor-not-allowed' 
                    : 'bg-emerald-600 text-white hover:bg-emerald-700'
                  }`}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-3">
                    <FaSpinner className="animate-spin text-xl" /> 기록 저장 중...
                  </span>
                ) : isSubmitted ? (
                  <span className="flex items-center justify-center gap-3">
                    <FaCheckCircle className="text-xl" /> 저장 완료!
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-3">
                    <FaDiceD6 className="text-xl" /> 대국 결과 저장
                  </span>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}