
import React, { useMemo } from 'react';
import { UserProfile, TripSession, Expense, Race, RefuelEntry } from '../types';
import { Download, AlertCircle, TrendingUp, BarChart3, Wallet } from 'lucide-react';

interface Props {
  user: UserProfile;
  sessions: TripSession[];
  expenses: Expense[];
  refuels: RefuelEntry[];
  currentRaces: Race[];
}

const Financeiro: React.FC<Props> = ({ user, sessions = [], expenses = [], refuels = [], currentRaces = [] }) => {
  // PROCESSAMENTO DE DADOS LINEAR (Evita travamentos por complexidade)
  const stats = useMemo(() => {
    let tGross = 0, tAppTax = 0, tFuel = 0, tMaintRes = 0, tPersonalRes = 0, tOthers = 0;

    const safe = (n: any) => {
      const val = parseFloat(n);
      return isNaN(val) || !isFinite(val) ? 0 : val;
    };

    // 1. Processar todas as corridas (atuais e passadas) para pegar os ganhos e as reservas por KM
    const allRaces: Race[] = [];
    if (Array.isArray(currentRaces)) allRaces.push(...currentRaces);
    if (Array.isArray(sessions)) {
      sessions.forEach(s => { if (s?.races) allRaces.push(...s.races); });
    }

    allRaces.forEach(r => {
      tGross += safe(r.grossEarnings);
      tAppTax += safe(r.appTax);
      tFuel += safe(r.fuelCost);
      tMaintRes += safe(r.maintReserve); // Reserva guardada por KM rodado
      tPersonalRes += safe(r.personalReserve);
    });

    // 2. Processar Despesas Manuais (Notas Fiscais de custos que JÁ foram feitos)
    if (Array.isArray(expenses)) {
      expenses.forEach(e => {
        const amt = safe(e.amount);
        if (e.isWorkExpense) {
          if (e.category === 'COMBUSTÍVEL') tFuel += amt;
          else if (e.category === 'MANUTENÇÃO') {
             // Quando uma manutenção é feita, ela usa o dinheiro da reserva. 
             // Aqui no financeiro, mostramos o fluxo total.
             tOthers += amt; 
          }
          else tOthers += amt;
        } else tOthers += amt;
      });
    }

    // 3. Abastecimentos
    if (Array.isArray(refuels)) {
      refuels.forEach(r => { tFuel += safe(r.amountMoney); });
    }

    const totalSpent = tAppTax + tFuel + tMaintRes + tPersonalRes + tOthers;
    return { tGross, tAppTax, tFuel, tMaintRes, tPersonalRes, tOthers, totalSpent, net: tGross - totalSpent };
  }, [sessions, expenses, refuels, currentRaces]);

  const items = [
    { label: 'Combustível', val: stats.tFuel, color: '#3b82f6' },
    { label: 'Apps (Taxas)', val: stats.tAppTax, color: '#10b981' },
    { label: 'Reserva Mecânica', val: stats.tMaintRes, color: '#f59e0b' },
    { label: 'Poup./Reservas', val: stats.tPersonalRes, color: '#6366f1' },
    { label: 'Outros Custos', val: stats.tOthers, color: '#f43f5e' }
  ].filter(i => i.val > 0.1);

  const renderChart = () => {
    if (items.length === 0) return (
      <div className="h-full flex flex-col items-center justify-center border-2 border-dashed border-slate-800 rounded-3xl">
        <p className="text-[10px] font-black text-slate-700 uppercase italic">Aguardando dados</p>
      </div>
    );

    let cumulative = 0;
    return (
      <svg viewBox="0 0 200 200" className="w-full h-full max-w-[180px]">
        {items.map((it, idx) => {
          const percent = (it.val / (stats.totalSpent || 1)) * 100;
          const offset = 100 - cumulative + 25;
          cumulative += percent;
          return (
            <circle
              key={idx} cx="100" cy="100" r="75"
              fill="none" stroke={it.color} strokeWidth="20"
              strokeDasharray={`${percent} ${100 - percent}`}
              strokeDashoffset={offset} pathLength="100"
            />
          );
        })}
        <text x="50%" y="50%" textAnchor="middle" dy=".3em" className="fill-white font-black italic text-xl">100%</text>
      </svg>
    );
  };

  return (
    <div className="space-y-6 pb-40 animate-up overflow-hidden">
      <header className="pt-3 px-1 flex justify-between items-center">
        <div>
          <p className="text-[10px] font-black uppercase text-blue-500 tracking-widest leading-none mb-1 opacity-70">Sua Operação</p>
          <h1 className="text-2xl font-black italic text-white tracking-tighter">Balanço Real</h1>
        </div>
        <div className="w-10 h-10 bg-slate-900 rounded-full flex items-center justify-center border border-white/5 shadow-xl"><Wallet size={18} className="text-blue-500" /></div>
      </header>

      <div className="grid grid-cols-2 gap-3">
         <div className="bento-card p-5 border-l-4 border-blue-500 bg-slate-900 shadow-xl">
            <p className="text-[9px] font-black text-slate-500 uppercase mb-1">Ganhos Brutos</p>
            <p className="text-2xl font-black italic text-white leading-none">R$ {stats.tGross.toFixed(0)}</p>
         </div>
         <div className="bento-card p-5 border-l-4 border-emerald-500 bg-emerald-950/20 shadow-xl">
            <p className="text-[9px] font-black text-emerald-600 uppercase mb-1">Lucro Livre</p>
            <p className="text-2xl font-black italic text-emerald-400 leading-none">R$ {stats.net.toFixed(0)}</p>
         </div>
      </div>

      <div className="bento-card p-6 bg-slate-900/40 border-white/5 shadow-inner">
         <div className="flex items-center justify-between mb-8">
            <h2 className="text-[10px] font-black uppercase italic text-white tracking-widest flex items-center gap-2">
              <BarChart3 size={14} className="text-blue-500" /> Distribuição de Custos
            </h2>
            <p className="text-[10px] font-black text-slate-600">Total: R$ {stats.totalSpent.toFixed(0)}</p>
         </div>
         
         <div className="h-44 w-full flex items-center justify-center">
            {renderChart()}
         </div>

         <div className="mt-8 grid grid-cols-2 gap-y-3 gap-x-5 px-1">
            {items.map((it, idx) => (
              <div key={idx} className="flex items-center gap-2.5">
                 <div className="w-2.5 h-2.5 rounded-full" style={{backgroundColor: it.color}} />
                 <div className="flex flex-col min-w-0">
                   <span className="text-[9px] font-bold text-slate-400 uppercase truncate leading-none">{it.label}</span>
                   <span className="text-[8px] font-black text-white mt-1 leading-none">R$ {it.val.toFixed(0)}</span>
                 </div>
              </div>
            ))}
         </div>
      </div>

      <div className="p-5 rounded-[2rem] border-2 bg-slate-900/40 border-slate-800 flex items-start gap-4 shadow-xl">
         <AlertCircle size={24} className="text-blue-500 flex-shrink-0" />
         <div>
            <p className="text-[10px] font-black text-white uppercase italic tracking-tight mb-1">Dica de Engenharia</p>
            <p className="text-[11px] font-medium text-slate-400 leading-snug">
              A "Reserva Mecânica" é o dinheiro que você deve separar de cada corrida para não ter sustos na oficina.
            </p>
         </div>
      </div>
    </div>
  );
};

export default Financeiro;
