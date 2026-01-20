
import React, { useState } from 'react';
import { TripSession, UserProfile, Expense } from '../types';
import { Calendar, TrendingUp, TrendingDown, DollarSign, ShieldAlert, BarChart3, AlertCircle } from 'lucide-react';

interface Props {
  sessions: TripSession[];
  expenses: Expense[];
  maintenance: any[];
  user: UserProfile;
}

type Period = 'SEMANAL' | 'QUINZENAL' | 'MENSAL' | 'ANUAL';

const Financeiro: React.FC<Props> = ({ sessions, expenses, user }) => {
  const [period, setPeriod] = useState<Period>('SEMANAL');

  const getPeriodDays = (p: Period) => {
    switch (p) {
      case 'SEMANAL': return 7;
      case 'QUINZENAL': return 15;
      case 'MENSAL': return 30;
      case 'ANUAL': return 365;
    }
  };

  const days = getPeriodDays(period);
  const now = Date.now();
  const periodMs = days * 24 * 60 * 60 * 1000;

  const filterByDate = <T extends { date: number }>(items: T[], start: number, end: number): T[] => 
    items.filter(item => item.date >= start && item.date < end);

  const currentSessions = filterByDate<TripSession>(sessions, now - periodMs, now);
  const currentExpenses = filterByDate<Expense>(expenses, now - periodMs, now);
  
  const prevSessions = filterByDate<TripSession>(sessions, now - (periodMs * 2), now - periodMs);

  const calculateStats = (sess: TripSession[], exp: Expense[]) => {
    const stats = sess.reduce((acc, s) => ({
      gross: acc.gross + s.totalGross,
      net: acc.net + s.totalNet,
      km: acc.km + (s.endOdometer - s.startOdometer)
    }), { gross: 0, net: 0, km: 0 });

    const totalExp = exp.reduce((acc, e) => acc + e.amount, 0);
    return { ...stats, totalExp, pocket: stats.net - totalExp };
  };

  const currentStats = calculateStats(currentSessions, currentExpenses);
  const prevStats = calculateStats(prevSessions, []); // Para comparação básica

  const profitDiff = prevStats.pocket === 0 ? 0 : ((currentStats.pocket - prevStats.pocket) / prevStats.pocket) * 100;

  return (
    <div className="p-6 space-y-6">
      <header className="py-4">
        <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">Relatórios Mensais</p>
        <h1 className="text-2xl font-black text-black">Financeiro</h1>
      </header>

      <div className="flex bg-zinc-100 p-1 rounded-2xl">
        {(['SEMANAL', 'QUINZENAL', 'MENSAL', 'ANUAL'] as Period[]).map(p => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`flex-1 py-2 text-[10px] font-black rounded-xl transition-all ${period === p ? 'bg-black text-white shadow-sm' : 'text-zinc-400'}`}
          >
            {p}
          </button>
        ))}
      </div>

      <div className="bg-black p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden">
        <div className="z-10 relative">
          <p className="text-zinc-400 text-xs font-black uppercase mb-1">Lucro Real</p>
          <p className="text-4xl font-black">R$ {currentStats.pocket.toFixed(2)}</p>
          
          <div className="flex items-center gap-2 mt-4">
            <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black ${profitDiff >= 0 ? 'bg-zinc-800 text-white' : 'bg-zinc-800 text-zinc-500'}`}>
              {profitDiff >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {Math.abs(profitDiff).toFixed(1)}% vs anterior
            </div>
          </div>
        </div>
        <BarChart3 size={120} className="opacity-10 absolute -right-4 -bottom-4 rotate-12" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-zinc-200 space-y-2">
          <div className="bg-zinc-50 w-fit p-2 rounded-xl text-black"><DollarSign size={16} /></div>
          <p className="text-[9px] font-black text-zinc-400 uppercase">Custos Extras</p>
          <p className="text-lg font-black text-black">R$ {currentStats.totalExp.toFixed(2)}</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-zinc-200 space-y-2">
          <div className="bg-zinc-50 w-fit p-2 rounded-xl text-black"><TrendingUp size={16} /></div>
          <p className="text-[9px] font-black text-zinc-400 uppercase">Bruto/km</p>
          <p className="text-lg font-black text-black">R$ {(currentStats.gross / (currentStats.km || 1)).toFixed(2)}</p>
        </div>
      </div>

      <div className="bg-zinc-900 p-6 rounded-[2.5rem] shadow-sm space-y-5">
        <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
          <ShieldAlert size={18} className="text-white" /> Reservas Acumuladas
        </h3>
        
        <div className="grid grid-cols-1 gap-3">
          <div className="flex justify-between items-center p-4 bg-white/5 rounded-2xl">
            <p className="text-[10px] font-black text-zinc-500 uppercase">Trabalho Total</p>
            <p className="text-xl font-black text-white">R$ {currentStats.net.toFixed(2)}</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-black text-black">Histórico Recente</h3>
        {currentSessions.length === 0 ? (
          <div className="bg-zinc-50 border-2 border-dashed border-zinc-200 rounded-[2rem] p-12 text-center text-zinc-400 font-black uppercase text-[10px]">Sem dados</div>
        ) : (
          currentSessions.slice().reverse().map(session => (
            <div key={session.id} className="bg-white p-5 rounded-3xl border border-zinc-100 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="bg-zinc-50 p-3 rounded-2xl text-black"><Calendar size={20} /></div>
                <div>
                  <p className="text-xs font-black text-black">{new Date(session.date).toLocaleDateString()}</p>
                  <p className="text-[9px] font-black text-zinc-400 uppercase">{(session.endOdometer - session.startOdometer).toFixed(1)} km</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-black text-black">+ R$ {session.totalNet.toFixed(2)}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Financeiro;
