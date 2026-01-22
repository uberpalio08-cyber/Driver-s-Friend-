
import React, { useMemo, useState } from 'react';
import { UserProfile, TripSession, Expense, Race, RefuelEntry } from '../types';
import { Wallet, TrendingUp, AlertTriangle, ArrowDownCircle, ArrowUpCircle, RefreshCw, Navigation, History, Trophy, Calendar, Smartphone, Wrench } from 'lucide-react';

interface Props {
  user: UserProfile;
  sessions: TripSession[];
  expenses: Expense[];
  refuels: RefuelEntry[];
  currentRaces: Race[];
  maintCostPerKm: number;
  onResetMonth?: () => void;
}

type Period = 'DIA' | 'SEMANA' | 'MÊS';

const Financeiro: React.FC<Props> = ({ user, sessions = [], expenses = [], refuels = [], currentRaces = [], maintCostPerKm, onResetMonth }) => {
  const [period, setPeriod] = useState<Period>('DIA');

  const stats = useMemo(() => {
    const now = new Date();
    const filter = (date: number) => {
      const d = new Date(date);
      if (period === 'DIA') return d.toDateString() === now.toDateString();
      if (period === 'SEMANA') return d >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    };

    let tGross = 0, tAppTax = 0, tMaint = 0, tRaceKm = 0;
    let extraCosts = 0;
    let fuelSpent = 0;
    let totalShiftKm = 0;
    let raceCount = 0;

    const allRaces: Race[] = [...currentRaces.filter(r => filter(r.date))];
    
    sessions.filter(s => filter(s.date)).forEach(s => {
      totalShiftKm += (s.endOdometer - s.startOdometer);
      s.races.forEach(r => {
        allRaces.push(r);
        tRaceKm += r.raceKm;
      });
    });

    allRaces.forEach(r => {
      tGross += r.grossEarnings;
      tAppTax += r.appTax;
      tMaint += r.maintReserve;
      raceCount++;
    });

    expenses.filter(e => filter(e.date) && e.isWorkExpense).forEach(e => extraCosts += e.amount);
    refuels.filter(r => filter(r.date)).forEach(r => fuelSpent += r.amountMoney);

    const fuelPrice = refuels[0]?.pricePerLiter || 5.85;
    const fuelCostPerKm = fuelPrice / user.calculatedAvgConsumption;
    const deadKm = Math.max(0, totalShiftKm - tRaceKm);
    
    // USA O CUSTO DINÂMICO PARA CALCULAR A RESERVA DO KM MORTO
    const deadMaint = deadKm * maintCostPerKm;
    const totalMaintProv = tMaint + deadMaint;
    const deadFuelCost = deadKm * fuelCostPerKm;

    const totalSpent = tAppTax + fuelSpent + totalMaintProv + extraCosts + deadFuelCost;
    const net = tGross - totalSpent;

    return { 
      tGross, 
      tAppTax, 
      fuelSpent, 
      tMaint: totalMaintProv, 
      extraCosts, 
      net, 
      totalSpent, 
      deadKm, 
      deadFuelCost, 
      raceCount 
    };
  }, [period, sessions, currentRaces, expenses, refuels, user, maintCostPerKm]);

  const formatCurrency = (val: number) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const monthlyHistory = useMemo(() => {
    const months: { [key: string]: any } = {};
    sessions.forEach(s => {
      const d = new Date(s.date);
      const key = `${d.getMonth() + 1}/${d.getFullYear()}`;
      if (!months[key]) months[key] = { gross: 0, net: 0, count: 0, label: key };
      months[key].gross += s.totalGross;
      months[key].net += s.totalNet;
      months[key].count += s.races.length;
    });
    return Object.values(months).sort((a, b) => b.net - a.net);
  }, [sessions]);

  return (
    <div className="space-y-6 pb-40 animate-up">
      <header className="pt-6 px-2 flex justify-between items-center">
        <div>
          <p className="text-[10px] font-black uppercase text-blue-500 tracking-widest leading-none mb-1">AUDITORIA</p>
          <h1 className="text-2xl font-black italic text-white tracking-tighter leading-none">Financeira</h1>
        </div>
        <div className="flex bg-slate-900 p-1 rounded-xl border border-white/5">
           {(['DIA', 'SEMANA', 'MÊS'] as Period[]).map(p => (
             <button key={p} onClick={() => setPeriod(p)} className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${period === p ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-600'}`}>{p}</button>
           ))}
        </div>
      </header>

      <div className="mx-2 bg-slate-900 rounded-[3rem] border border-white/5 p-8 space-y-6 shadow-2xl overflow-hidden relative">
         <div className="absolute top-0 right-0 p-8 opacity-5"><Wallet size={120} /></div>
         <div className="flex justify-between items-start relative z-10">
            <div>
               <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Resultado Líquido</p>
               <h2 className={`text-5xl font-black italic tracking-tighter leading-none ${stats.net >= 0 ? 'text-white' : 'text-rose-500'}`}>{formatCurrency(stats.net)}</h2>
            </div>
            <div className="bg-emerald-600/10 p-4 rounded-2xl border border-emerald-500/20 shadow-inner">
               <Trophy size={24} className="text-emerald-500" />
            </div>
         </div>

         <div className="grid grid-cols-2 gap-4 relative z-10">
            <div className="bg-slate-950 p-4 rounded-2xl border border-white/5 text-center">
               <p className="text-[8px] font-black text-slate-500 uppercase mb-1">Corridas</p>
               <p className="text-lg font-black text-white italic">{stats.raceCount}</p>
            </div>
            <div className="bg-slate-950 p-4 rounded-2xl border border-white/5 text-center">
               <p className="text-[8px] font-black text-slate-500 uppercase mb-1">Eficiência</p>
               <p className="text-lg font-black text-blue-400 italic">{((stats.net / (stats.tGross || 1)) * 100).toFixed(0)}%</p>
            </div>
         </div>
      </div>

      <div className="px-2 space-y-4">
         <div className="bg-slate-900/40 border border-white/5 p-6 rounded-[2.5rem] space-y-4">
            <div className="flex items-center gap-2 mb-2">
               <History size={16} className="text-blue-500" />
               <h3 className="text-[10px] font-black text-white uppercase tracking-widest">Detalhamento de Fluxo</h3>
            </div>
            
            <div className="flex justify-between items-center text-[10px] font-black uppercase">
               <span className="text-slate-400">Faturamento Bruto</span>
               <span className="text-white">{formatCurrency(stats.tGross)}</span>
            </div>
            
            <div className="flex justify-between items-center text-[10px] font-black uppercase">
               <span className="text-slate-500 flex items-center gap-2"><Smartphone size={12}/> Taxas Uber/99</span>
               <span className="text-rose-500">- {formatCurrency(stats.tAppTax)}</span>
            </div>

            <div className="flex justify-between items-center text-[10px] font-black uppercase">
               <span className="text-slate-500 flex items-center gap-2"><Wrench size={12}/> Reserva Manutenção (KM)</span>
               <span className="text-purple-400">- {formatCurrency(stats.tMaint)}</span>
            </div>

            <div className="flex justify-between items-center text-[10px] font-black uppercase">
               <span className="text-slate-500 flex items-center gap-2"><Navigation size={12}/> KM Vazio ({stats.deadKm.toFixed(0)}km)</span>
               <span className="text-orange-400">- {formatCurrency(stats.deadFuelCost)}</span>
            </div>
            
            <div className="flex justify-between items-center text-[10px] font-black uppercase">
               <span className="text-slate-500 flex items-center gap-2">🍔 Gastos Logados</span>
               <span className="text-rose-500">- {formatCurrency(stats.extraCosts + stats.fuelSpent)}</span>
            </div>
            
            <div className="h-px bg-white/5 mt-4" />
            
            <div className="bg-blue-600/10 p-5 rounded-3xl flex justify-between items-center border border-blue-500/20 shadow-inner">
               <span className="text-[10px] font-black text-blue-500 uppercase italic tracking-widest">Saldo no Bolso</span>
               <span className="text-2xl font-black text-white italic tracking-tighter">{formatCurrency(stats.net)}</span>
            </div>
         </div>

         {monthlyHistory.length > 0 && (
           <div className="space-y-3 pt-4">
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-4">Performance Mensal</h3>
              {monthlyHistory.map((m, idx) => (
                <div key={m.label} className="bg-slate-900 border border-white/5 p-5 rounded-[2rem] flex items-center justify-between shadow-xl">
                   <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black ${idx === 0 ? 'bg-amber-500 text-black' : 'bg-slate-800 text-slate-500'}`}>
                         {idx === 0 ? <Trophy size={20} /> : <Calendar size={20} />}
                      </div>
                      <div>
                         <p className="text-xs font-black text-white uppercase italic">{m.label}</p>
                         <p className="text-[8px] font-bold text-slate-600 uppercase tracking-widest">{m.count} Viagens</p>
                      </div>
                   </div>
                   <div className="text-right">
                      <p className="text-lg font-black text-emerald-400 italic leading-none">{formatCurrency(m.net)}</p>
                      <p className="text-[7px] font-black text-slate-700 uppercase mt-1">LUCRO REAL</p>
                   </div>
                </div>
              ))}
           </div>
         )}
      </div>
    </div>
  );
};
export default Financeiro;
