
import React, { useMemo, useState } from 'react';
import { UserProfile, TripSession, Expense, Race, RefuelEntry } from '../types';
import { Wallet, Trophy, Calendar, Smartphone, Wrench, Navigation, History, Sparkles, Loader2 } from 'lucide-react';
import { GeminiService } from '../services/geminiService';

interface Props {
  user: UserProfile;
  sessions: TripSession[];
  expenses: Expense[];
  refuels: RefuelEntry[];
  currentRaces: Race[];
  maintCostPerKm: number;
}

const Financeiro: React.FC<Props> = ({ user, sessions = [], expenses = [], refuels = [], currentRaces = [], maintCostPerKm }) => {
  const [period, setPeriod] = useState<'DIA' | 'SEMANA' | 'MÊS'>('DIA');
  const [iaAnalysis, setIaAnalysis] = useState<string | null>(null);
  const [loadingIA, setLoadingIA] = useState(false);

  const stats = useMemo(() => {
    const now = new Date();
    const filter = (date: number) => {
      const d = new Date(date);
      if (period === 'DIA') return d.toDateString() === now.toDateString();
      if (period === 'SEMANA') return d >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    };

    let tGross = 0, tAppTax = 0, tMaint = 0, tRaceKm = 0;
    let extraCosts = 0, fuelSpent = 0, totalShiftKm = 0, raceCount = 0;

    const allRaces: Race[] = [...currentRaces.filter(r => filter(r.date))];
    sessions.filter(s => filter(s.date)).forEach(s => {
      totalShiftKm += (s.endOdometer - s.startOdometer);
      s.races.forEach(r => { allRaces.push(r); tRaceKm += r.raceKm; });
    });

    allRaces.forEach(r => { tGross += r.grossEarnings; tAppTax += r.appTax; tMaint += r.maintReserve; raceCount++; });
    expenses.filter(e => filter(e.date) && e.isWorkExpense).forEach(e => extraCosts += e.amount);
    refuels.filter(r => filter(r.date)).forEach(r => fuelSpent += r.amountMoney);

    const fuelPrice = refuels[0]?.pricePerLiter || 5.85;
    const fuelCostPerKm = fuelPrice / user.calculatedAvgConsumption;
    const deadKm = Math.max(0, totalShiftKm - tRaceKm);
    const deadFuelCost = deadKm * fuelCostPerKm;

    const totalSpent = tAppTax + fuelSpent + tMaint + extraCosts + deadFuelCost;
    const net = tGross - totalSpent;

    return { tGross, tAppTax, fuelSpent, tMaint, extraCosts, net, totalSpent, deadKm, deadFuelCost, raceCount };
  }, [period, sessions, currentRaces, expenses, refuels, user, maintCostPerKm]);

  const handleIAAnalysis = async () => {
    setLoadingIA(true);
    const analysis = await GeminiService.analyzeFinance({
      gross: stats.tGross.toFixed(2),
      fuel: (stats.fuelSpent + stats.deadFuelCost).toFixed(2),
      maint: stats.tMaint.toFixed(2),
      net: stats.net.toFixed(2)
    });
    setIaAnalysis(analysis);
    setLoadingIA(false);
  };

  const formatCurrency = (val: number) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div className="space-y-6 pb-40 animate-up">
      <header className="pt-6 px-2 flex justify-between items-center">
        <div>
          <p className="text-[10px] font-black uppercase text-blue-500 tracking-widest leading-none mb-1">AUDITORIA</p>
          <h1 className="text-2xl font-black italic text-white tracking-tighter">Financeiro</h1>
        </div>
        <div className="flex bg-slate-900 p-1 rounded-xl border border-white/5">
           {['DIA', 'SEMANA', 'MÊS'].map(p => (
             <button key={p} onClick={() => setPeriod(p as any)} className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${period === p ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-600'}`}>{p}</button>
           ))}
        </div>
      </header>

      {/* IA INSIGHTS */}
      <div className="mx-2 bg-blue-600/10 border border-blue-500/30 p-6 rounded-[2.5rem] relative overflow-hidden">
        <div className="flex items-center justify-between mb-4">
           <div className="flex items-center gap-2">
              <Sparkles className="text-blue-500" size={18} />
              <h3 className="text-[10px] font-black text-white uppercase tracking-widest">Auditoria Inteligente</h3>
           </div>
           <button 
             onClick={handleIAAnalysis} 
             disabled={loadingIA}
             className="bg-blue-600 text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase flex items-center gap-2 active:scale-95 transition-all"
           >
             {loadingIA ? <Loader2 size={12} className="animate-spin" /> : 'Analisar Ganho'}
           </button>
        </div>
        {iaAnalysis ? (
          <p className="text-sm font-bold text-slate-300 italic animate-up">{iaAnalysis}</p>
        ) : (
          <p className="text-[10px] text-slate-500 uppercase font-black">Toque para receber uma dica de rentabilidade baseada nos seus dados.</p>
        )}
      </div>

      <div className="mx-2 bg-slate-900 rounded-[3rem] border border-white/5 p-8 space-y-6 shadow-2xl relative">
         <div className="absolute top-0 right-0 p-8 opacity-5"><Wallet size={120} /></div>
         <div className="flex justify-between items-start">
            <div>
               <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Lucro Líquido</p>
               <h2 className={`text-5xl font-black italic tracking-tighter leading-none ${stats.net >= 0 ? 'text-white' : 'text-rose-500'}`}>{formatCurrency(stats.net)}</h2>
            </div>
            <div className="bg-emerald-600/10 p-4 rounded-2xl border border-emerald-500/20">
               <Trophy size={24} className="text-emerald-500" />
            </div>
         </div>
      </div>

      <div className="px-2 space-y-4">
         <div className="bg-slate-900/40 border border-white/5 p-6 rounded-[2.5rem] space-y-4">
            <div className="flex items-center gap-2 mb-2">
               <History size={16} className="text-blue-500" />
               <h3 className="text-[10px] font-black text-white uppercase tracking-widest">Fluxo de Caixa</h3>
            </div>
            
            <div className="flex justify-between items-center text-[10px] font-black uppercase">
               <span className="text-slate-400">Bruto</span>
               <span className="text-white">{formatCurrency(stats.tGross)}</span>
            </div>
            
            <div className="flex justify-between items-center text-[10px] font-black uppercase">
               <span className="text-slate-500 flex items-center gap-2"><Smartphone size={12}/> Taxas Apps</span>
               <span className="text-rose-500">- {formatCurrency(stats.tAppTax)}</span>
            </div>

            <div className="flex justify-between items-center text-[10px] font-black uppercase">
               <span className="text-slate-500 flex items-center gap-2"><Wrench size={12}/> Manutenção</span>
               <span className="text-purple-400">- {formatCurrency(stats.tMaint)}</span>
            </div>

            <div className="flex justify-between items-center text-[10px] font-black uppercase">
               <span className="text-slate-500 flex items-center gap-2"><Navigation size={12}/> KM Vazio</span>
               <span className="text-orange-400">- {formatCurrency(stats.deadFuelCost)}</span>
            </div>
            
            <div className="h-px bg-white/5 mt-4" />
            
            <div className="bg-blue-600 p-5 rounded-3xl flex justify-between items-center shadow-2xl">
               <span className="text-[10px] font-black text-white/70 uppercase italic">Saldo Real</span>
               <span className="text-2xl font-black text-white italic tracking-tighter">{formatCurrency(stats.net)}</span>
            </div>
         </div>
      </div>
    </div>
  );
};
export default Financeiro;
