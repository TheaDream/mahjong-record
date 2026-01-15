'use client';

import { useEffect, useState, use } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, LineChart, Line, XAxis, YAxis } from 'recharts';

export default function PlayerStatsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [player, setPlayer] = useState<any>(null);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', id).single();
      const { data: matchResults } = await supabase.from('match_results').select('*').eq('user_id', id).order('created_at', { ascending: true });
      
      if (profile) setPlayer(profile);
      if (matchResults) setResults(matchResults);
      setLoading(false);
    };
    fetchData();
  }, [id]);

  if (loading) return <div className="p-20 text-center font-black text-slate-400">데이터 분석 중...</div>;
  if (!player) return <div className="p-20 text-center font-black text-slate-400">작사를 찾을 수 없습니다.</div>;

  // --- 데이터 가공 섹션 ---
  
  // 1. 순위 분포
  const rankDist = [
    { name: '1위', value: results.filter(r => r.rank === 1).length, color: '#facc15' },
    { name: '2위', value: results.filter(r => r.rank === 2).length, color: '#94a3b8' },
    { name: '3위', value: results.filter(r => r.rank === 3).length, color: '#fdba74' },
    { name: '4위', value: results.filter(r => r.rank === 4).length, color: '#93c5fd' },
  ];

  // 2. 최고 점수 및 통계 지표
  const totalPt = results.reduce((sum, r) => sum + r.net_score, 0);
  const maxRawScore = results.length > 0 ? Math.max(...results.map(r => r.raw_score)) : 0;
  const bestNetScore = results.length > 0 ? Math.max(...results.map(r => r.net_score)) : 0;
  const avgRank = results.length > 0 ? (results.reduce((sum, r) => sum + r.rank, 0) / results.length).toFixed(2) : '-';

  // 3. 누적 포인트 이력
  const scoreHistory = results.map((r, i) => ({
    index: i + 1,
    cumPt: parseFloat(results.slice(0, i + 1).reduce((sum, curr) => sum + curr.net_score, 0).toFixed(1))
  }));

  // 4. 최근 10대국 성적 (특정 기간 대용)
  const recentResults = results.slice(-10);
  const recentAvgRank = recentResults.length > 0 
    ? (recentResults.reduce((sum, r) => sum + r.rank, 0) / recentResults.length).toFixed(2) 
    : '-';

  return (
    <div className="min-h-screen bg-[#f0f4f1] text-slate-800 font-sans pb-20">
      <div className="h-2 bg-green-600 w-full" />
      <div className="p-6 max-w-4xl mx-auto">
        
        {/* 헤더 */}
        <header className="mb-10 mt-8 flex justify-between items-end">
          <div>
            <button onClick={() => router.push('/')} className="text-slate-400 hover:text-green-600 font-bold text-sm mb-2 flex items-center gap-1">← 돌아가기</button>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">{player.nickname}</h1>
            <p className="text-slate-500 font-medium italic mt-1">"1등 아니면 허접이죠?"</p>
          </div>
          <div className="text-right">
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Points</div>
            <div className={`text-4xl font-black tracking-tighter ${totalPt >= 0 ? 'text-green-600' : 'text-rose-500'}`}>
              {totalPt > 0 ? `+${totalPt.toFixed(1)}` : totalPt.toFixed(1)}
            </div>
          </div>
        </header>

        {/* 메인 통계 그리드 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* 왼쪽: 지표 요약 */}
          <div className="space-y-6">
            {/* 하이라이트 지표 */}
            <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-xl">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Highlights</div>
              <div className="space-y-5">
                <div>
                  <div className="text-xs text-slate-500 font-bold mb-1">최고 득점 </div>
                  <div className="text-2xl font-black">{maxRawScore.toLocaleString()}<span className="text-sm ml-1 text-slate-400">점</span></div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 font-bold mb-1">한 판 최다 획득 포인트</div>
                  <div className="text-2xl font-black text-green-400">+{bestNetScore.toFixed(1)}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 font-bold mb-1">최근 10경기 평균 순위</div>
                  <div className="text-2xl font-black text-blue-400">{recentAvgRank}위</div>
                </div>
              </div>
            </div>

            {/* 순위 분포 파이 */}
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-white">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 text-center">Rank Ratio</div>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={rankDist} innerRadius={50} outerRadius={70} paddingAngle={8} dataKey="value">
                      {rankDist.map((entry, index) => <Cell key={index} fill={entry.color} stroke="none" />)}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '1rem', border: 'none' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-between mt-4 px-2">
                {rankDist.map(r => (
                  <div key={r.name} className="flex flex-col items-center">
                    <span className="text-[10px] font-black text-slate-300 mb-1">{r.name}</span>
                    <span className="font-black text-slate-700">{r.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 오른쪽: 그래프 & 트렌드 */}
          <div className="md:col-span-2 space-y-6">
            {/* 누적 그래프 */}
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-white h-full flex flex-col">
              <div className="flex justify-between items-center mb-8">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Growth Curve</div>
                <div className="px-3 py-1 bg-green-50 text-green-600 rounded-full text-[10px] font-black uppercase">All Time</div>
              </div>
              <div className="flex-1 min-h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={scoreHistory}>
                    <XAxis dataKey="index" hide />
                    <YAxis hide domain={['auto', 'auto']} />
                    <Tooltip 
                      cursor={{ stroke: '#f1f5f9', strokeWidth: 2 }}
                      contentStyle={{ borderRadius: '1.2rem', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}
                      formatter={(value: any) => [`${value} PT`, '누적 점수']}
                      labelFormatter={(label) => `${label}번째 대국`}
                    />
                    <Line 
                      type="stepAfter" 
                      dataKey="cumPt" 
                      stroke="#16a34a" 
                      strokeWidth={5} 
                      dot={false}
                      activeDot={{ r: 6, fill: '#16a34a', strokeWidth: 4, stroke: '#fff' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-6 grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-2xl">
                  <div className="text-[10px] font-black text-slate-400 uppercase mb-1">평균 순위 (전체)</div>
                  <div className="text-xl font-black">{avgRank}위</div>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl">
                  <div className="text-[10px] font-black text-slate-400 uppercase mb-1">총 대국 수</div>
                  <div className="text-xl font-black">{results.length}국</div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}