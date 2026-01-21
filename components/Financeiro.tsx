
import React, { useState, useMemo } from 'react';
import { TripSession, UserProfile, Expense } from '../types';
import { Download, FileText, Activity, TrendingUp } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface Props {
  sessions: TripSession[];
  expenses: Expense[];
  maintenance: any[];
  user: UserProfile;
}

const Financeiro: React.FC<Props> = ({ sessions, expenses, user }) => {
  const [period, setPeriod] = useState<'SEMANAL' | 'QUINZENAL' | 'MENSAL'>('MENSAL');

  const stats = useMemo(() => {
    const days = period === 'SEMANAL' ? 7 : period === 'QUINZENAL' ? 15 : 30;
    const now = Date.now();
    const periodMs = days * 24 * 60 * 60 * 1000;
    const currentSessions = sessions.filter(s => s.date >= now - periodMs);
    const currentExpenses = expenses.filter(e => e.date >= now - periodMs);
    
    const gross = currentSessions.reduce((acc, s) => acc + s.totalGross, 0);
    const fuel = currentSessions.reduce((acc, s) => acc + s.races.reduce((ra, r) => ra + r.fuelCost, 0), 0);
    const maintRes = currentSessions.reduce((acc, s) => acc + s.races.reduce((ra, r) => ra + (r.maintenanceReserve || 0), 0), 0);
    const appTax = currentSessions.reduce((acc, s) => acc + s.races.reduce((ra, r) => ra + r.appTax, 0), 0);
    
    // Lucro Limpo é o faturamento total menos as reservas automáticas e custos operacionais
    const netSalary = currentSessions.reduce((acc, s) => acc + s.totalNet, 0);
    
    // Gastos extras lançados (Manutenção real paga, alimentação etc)
    const extraCosts = currentExpenses.reduce((acc, e) => acc + e.amount, 0);

    return { gross, fuel, maintRes, appTax, netSalary, extraCosts };
  }, [sessions, expenses, period]);

  const chartData = [
    { name: 'Salário (Líquido)', value: stats.netSalary, color: '#ffffff' },
    { name: 'Combustível', value: stats.fuel, color: '#444444' },
    { name: 'Reservas', value: stats.maintRes, color: '#222222' }
  ].filter(d => d.value > 0);

  return (
    <div className="p-5 space-y-6 pb-24 animate-up">
      <header className="pt-6">
        <h1 className="text-3xl font-black italic text-outline">Financeiro</h1>
      </header>

      {/* Seletor de Período Clean */}
      <div className="flex bg-black/40 p-1 rounded-2xl border border-white/10 glass-card">
        {(['SEMANAL', 'QUINZENAL', 'MENSAL'] as const).map(p => (
          <button key={p} onClick={() => setPeriod(p)} className={`flex-1 py-3 text-[10px] font-black rounded-xl transition-all uppercase tracking-widest ${period === p ? 'bg-white text-black shadow-lg' : 'text-zinc-500'}`}>
            {p}
          </button>
        ))}
      </div>

      <div className="glass-card p-6 space-y-6 shadow-2xl">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest text-outline-sm">Salário Acumulado</p>
            <p className="text-4xl font-black italic text-outline leading-none">R$ {stats.netSalary.toFixed(2)}</p>
          </div>
          <Activity size={24} className="text-white/30" />
        </div>

        <div className="h-52 w-full relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={chartData} innerRadius={55} outerRadius={75} paddingAngle={8} dataKey="value" stroke="none">
                {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: '15px', background: '#000', border: '1px solid #333', fontSize: '12px' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-5 rounded-2xl text-black shadow-xl">
             <p className="text-[9px] font-black uppercase text-zinc-500 leading-none mb-1">Bruto Total</p>
             <p className="text-xl font-black italic leading-none">R$ {stats.gross.toFixed(0)}</p>
          </div>
          <div className="bg-black/40 p-5 rounded-2xl border border-white/5 text-center">
             <p className="text-[9px] font-black uppercase text-zinc-500 leading-none mb-1 text-outline-sm">Custos Extras</p>
             <p className="text-xl font-black italic text-outline leading-none">R$ {stats.extraCosts.toFixed(0)}</p>
          </div>
        </div>
      </div>

      {/* Relatório e Exportação */}
      <div className="grid grid-cols-2 gap-4">
         <button onClick={() => alert("Gerando CSV...")} className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl flex flex-col items-center gap-2 active:scale-95 shadow-xl transition-all">
            <Download size={22} className="text-white" />
            <span className="text-[10px] font-black uppercase tracking-widest text-outline-sm">Exportar CSV</span>
         </button>
         <button onClick={() => alert("Gerando PDF...")} className="bg-white text-black p-6 rounded-3xl flex flex-col items-center gap-2 active:scale-95 shadow-xl transition-all">
            <FileText size={22} />
            <span className="text-[10px] font-black uppercase tracking-widest">Baixar PDF</span>
         </button>
      </div>
    </div>
  );
};

export default Financeiro;
