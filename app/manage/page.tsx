'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function ManagePage() {
  const router = useRouter();
  const [players, setPlayers] = useState<any[]>([]);
  const [newNickname, setNewNickname] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchPlayers = async () => {
    setLoading(true);
    const { data } = await supabase.from('profiles').select('*').order('nickname');
    if (data) setPlayers(data);
    setLoading(false);
  };

  useEffect(() => { fetchPlayers(); }, []);

  const addPlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNickname.trim()) return;
    
    const { error } = await supabase.from('profiles').insert({ nickname: newNickname });
    if (error) {
      alert('등록 오류: ' + error.message);
    } else {
      setNewNickname('');
      fetchPlayers();
    }
  };

  const deletePlayer = async (id: string, nickname: string) => {
    if (!confirm(`[${nickname}] 작사를 명단에서 제외하시겠습니까?\n기존 대국 기록은 유지되지만 랭킹 집계에서 제외될 수 있습니다.`)) return;
    
    const { error } = await supabase.from('profiles').delete().eq('id', id);
    if (error) alert('삭제 오류: ' + error.message);
    else fetchPlayers();
  };

  return (
    <div className="min-h-screen bg-[#f0f4f1] text-slate-800 font-sans pb-20">
      <div className="h-2 bg-green-600 w-full" />

      <div className="p-6 max-w-2xl mx-auto">
        {/* 상단 네비게이션 */}
        <header className="mb-10 mt-8">
          <button 
            onClick={() => router.push('/')}
            className="text-slate-400 hover:text-green-600 font-bold text-sm transition-colors flex items-center gap-1 mb-2"
          >
            ← 메인으로 돌아가기
          </button>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">⚙️ 작사 관리 시스템</h1>
          <p className="text-slate-500 font-medium mt-1">대국에 참여할 새로운 작사를 등록하거나 관리합니다.</p>
        </header>

        {/* 새 작사 등록 섹션 */}
        <section className="mb-10">
          <form onSubmit={addPlayer} className="flex gap-3 bg-white p-3 rounded-[2rem] shadow-sm border border-white">
            <input
              type="text"
              placeholder="새로운 작사 닉네임"
              value={newNickname}
              onChange={(e) => setNewNickname(e.target.value)}
              className="flex-1 bg-slate-50 border-none rounded-2xl px-6 py-4 font-bold text-slate-700 focus:ring-2 focus:ring-green-500 outline-none transition-all"
            />
            <button
              type="submit"
              className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black hover:bg-slate-800 transition-all active:scale-95 shadow-lg shadow-slate-200"
            >
              등록
            </button>
          </form>
        </section>

        {/* 작사 목록 섹션 */}
        <div className="bg-white shadow-[0_8px_30px_rgb(0,0,0,0.02)] rounded-[2.5rem] overflow-hidden border border-white">
          <div className="p-8 border-b border-slate-50">
            <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest">Current Players ({players.length})</h2>
          </div>
          
          <div className="divide-y divide-slate-50">
            {loading ? (
              <div className="py-20 text-center text-slate-300 font-bold">작사 명단을 불러오는 중...</div>
            ) : players.length === 0 ? (
              <div className="py-20 text-center text-slate-400 font-medium">등록된 작사가 없습니다.</div>
            ) : (
              players.map((player) => (
                <div key={player.id} className="flex justify-between items-center px-8 py-5 group hover:bg-slate-50 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-black">
                      {player.nickname.charAt(0)}
                    </div>
                    <span className="text-lg font-bold text-slate-700">{player.nickname}</span>
                  </div>
                  
                  <button
                    onClick={() => deletePlayer(player.id, player.nickname)}
                    className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                    title="작사 삭제"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 하단 안내 */}
        <footer className="mt-12 text-center text-slate-400 text-xs font-medium">
          작사를 삭제해도 기존의 대국 히스토리 데이터는 사라지지 않습니다.
        </footer>
      </div>
    </div>
  );
}