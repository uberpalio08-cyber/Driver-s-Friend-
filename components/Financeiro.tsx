import React, { useState, useMemo } from 'react';
import { TripSession, UserProfile, Expense } from '../types';
import { Calendar, Table, FileText, PieChart as ChartIcon, Download, ChevronRight } from 'lucide-react';
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
    
    const gross = currentSessions.reduce((acc, s) => acc + s.totalGross, 0);
    const fuel = currentSessions.reduce((acc, s) => acc + s.races.reduce((ra, r) => ra + r.fuelCost, 0), 0);
    const maint = currentSessions.reduce((acc, s) => acc + s.races.reduce((ra, r) => ra + (r.maintenanceReserve || 0) + (r.emergencyReserve || 0), 0), 0);
    const appTax = currentSessions.reduce((acc, s) => acc + s.races.reduce((ra, r) => ra + r.appTax, 0), 0);
    const net = currentSessions.reduce((acc, s) => acc + s.totalNet, 0);

    return { gross, fuel, maint, appTax, net };
  }, [sessions, period]);

  const chartData = [
    { name: 'Lucro Limpo', value: stats.net, color: '#FFFFFF' },
    { name: 'Combustível', value: stats.fuel, color: '#52525b' },
    { name: 'Manutenção', value: stats.maint, color: '#27272a' },
    { name: 'Taxas App', value: stats.appTax, color: '#a1a1aa' }
  ].filter(d => d.value > 0);

  const exportCSV = () => {
    let csv = "Data;Faturamento Bruto;Lucro Liquido;KM Rodados\n";
    sessions.forEach(s => {
      csv += `${new Date(s.date).toLocaleDateString()};${s.totalGross.toFixed(2)};${s.totalNet.toFixed(2)};${(s.endOdometer - s.startOdometer).toFixed(1)}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `relatorio_drivers_friend_${period.toLowerCase()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportPDF = () => {
    window.print();
  };

  return (
    <div className="p-6 space-y-6 pb-24">
      <header className="py-4 flex justify-between items-center print-hidden">
        <div>
          <p className="text-zinc-600 text-[10px] font-black uppercase tracking-widest">Painel de Resultados</p>
          <h1 className="text-2xl font-black text-zinc-900">Financeiro</h1>
        </div>
        <div className="flex gap-2">
          <button onClick={exportCSV} className="p-3 bg-zinc-100 rounded-xl text-black hover:bg-black hover:text-white transition-all active:scale-95">
            <Table size={20} />
          </button>
          <button onClick={exportPDF} className="p-3 bg-black text-white rounded-xl active:scale-95 transition-all">
            <FileText size={20} />
          </button>
        </div>
      </header>

      {/* Seletor de Período */}
      <div className="flex bg-zinc-200 p-1 rounded-2xl print-hidden shadow-inner">
        {(['SEMANAL', 'QUINZENAL', 'MENSAL'] as const).map(p => (
          <button key={p} onClick={() => setPeriod(p)} className={`flex-1 py-2 text-[10px] font-black rounded-xl transition-all ${period === p ? 'bg-black text-white shadow-lg' : 'text-zinc-500'}`}>
            {p}
          </button>
        ))}
      </div>

      {/* Gráfico Principal */}
      <div className="bg-black p-8 rounded-[2.5rem] text-white shadow-2xl space-y-8">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">Lucro Real ({period})</p>
            <p className="text-4xl font-black italic">R$ {stats.net.toFixed(2)}</p>
          </div>
          <div className="bg-white/10 p-3 rounded-2xl">
            <ChartIcon size={24} className="text-white" />
          </div>
        </div>

        <div className="h-64 w-full">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={chartData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#111', border: 'none', borderRadius: '15px', color: '#fff', fontSize: '10px', fontWeight: 'bold' }}
                  itemStyle={{ color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-zinc-700 font-black uppercase text-[10px]">Sem dados no período</div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-x-8 gap-y-4 pt-4 border-t border-zinc-900">
          {chartData.map(d => (
            <div key={d.name} className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
              <div>
                <p className="text-[8px] font-black text-zinc-500 uppercase tracking-tighter">{d.name}</p>
                <p className="text-xs font-black">R$ {d.value.toFixed(2)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Listagem de Sessões */}
      <div className="space-y-4 pb-12">
        <h3 className="text-sm font-black text-white uppercase tracking-widest px-1">Histórico de Sessões</h3>
        <div className="space-y-3">
          {sessions.length === 0 ? (
            <div className="bg-zinc-800/30 backdrop-blur-md border-2 border-dashed border-zinc-700 rounded-[2rem] p-12 text-center text-zinc-500 font-black uppercase text-[10px]">Ainda não há sessões fechadas</div>
          ) : (
            sessions.slice().reverse().map(session => (
              <div key={session.id} className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl flex justify-between items-center group">
                <div className="flex items-center gap-4">
                  <div className="bg-zinc-800 p-3 rounded-2xl text-zinc-500 group-hover:bg-white group-hover:text-black transition-all"><Calendar size={20} /></div>
                  <div>
                    <p className="text-xs font-black text-white">{new Date(session.date).toLocaleDateString()}</p>
                    <p className="text-[9px] font-black text-zinc-500 uppercase">{(session.endOdometer - session.startOdometer).toFixed(1)} km rodados</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-md font-black text-white italic">R$ {session.totalNet.toFixed(2)}</p>
                  <p className="text-[8px] text-zinc-600 uppercase font-black">Bruto: R$ {session.totalGross.toFixed(2)}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Financeiro;