
import React, { useState, useMemo } from 'react';
import { TripSession, UserProfile, Expense, Race } from '../types';
import { Download, FileText, Activity, PieChart as PieIcon } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface Props {
  sessions: TripSession[];
  expenses: Expense[];
  maintenance: any[];
  user: UserProfile;
  currentRaces: Race[];
  currentDailyExpenses: Expense[];
}

const Financeiro: React.FC<Props> = ({ sessions, expenses, user, currentRaces, currentDailyExpenses }) => {
  const [period, setPeriod] = useState<'SEMANAL' | 'QUINZENAL' | 'MENSAL'>('MENSAL');

  const stats = useMemo(() => {
    const days = period === 'SEMANAL' ? 7 : period === 'QUINZENAL' ? 15 : 30;
    const now = Date.now();
    const periodMs = days * 24 * 60 * 60 * 1000;
    
    // Filtra dados históricos
    const pastSessions = sessions.filter(s => s.date >= now - periodMs);
    const pastExpenses = expenses.filter(e => e.date >= now - periodMs);
    
    // Agrega Faturamento Bruto (Passado + Atual)
    const grossPast = pastSessions.reduce((acc, s) => acc + s.totalGross, 0);
    const grossActive = currentRaces.reduce((acc, r) => acc + (r.grossEarnings || 0), 0);
    const gross = grossPast + grossActive;

    // Agrega Combustível
    const fuelPast = pastSessions.reduce((acc, s) => acc + s.races.reduce((ra, r) => ra + r.fuelCost, 0), 0);
    const fuelActive = currentRaces.reduce((acc, r) => acc + (r.fuelCost || 0), 0);
    const fuel = fuelPast + fuelActive;

    // Agrega Reservas
    const maintResPast = pastSessions.reduce((acc, s) => acc + s.races.reduce((ra, r) => ra + (r.maintenanceReserve || 0), 0), 0);
    const maintResActive = currentRaces.reduce((acc, r) => acc + (r.maintenanceReserve || 0), 0);
    const maintRes = maintResPast + maintResActive;

    const emergencyResPast = pastSessions.reduce((acc, s) => acc + s.races.reduce((ra, r) => ra + (r.emergencyReserve || 0), 0), 0);
    const emergencyResActive = currentRaces.reduce((acc, r) => acc + (r.emergencyReserve || 0), 0);
    const emergencyRes = emergencyResPast + emergencyResActive;

    // Agrega Taxas App
    const appTaxPast = pastSessions.reduce((acc, s) => acc + s.races.reduce((ra, r) => ra + r.appTax, 0), 0);
    const appTaxActive = currentRaces.reduce((acc, r) => acc + (r.appTax || 0), 0);
    const appTax = appTaxPast + appTaxActive;
    
    // Despesas extras (Lançadas manualmente + Despesas ativas do dia)
    const extraCostsPast = pastExpenses.reduce((acc, e) => acc + e.amount, 0);
    const extraCostsActive = currentDailyExpenses.reduce((acc, e) => acc + e.amount, 0);
    const extraCosts = extraCostsPast + extraCostsActive;
    
    // Lucro Líquido Real
    const netPast = pastSessions.reduce((acc, s) => acc + s.totalNet, 0);
    const netActive = currentRaces.reduce((acc, r) => acc + r.netProfit, 0) - extraCostsActive;
    const netSalary = netPast + netActive;

    const totalCosts = fuel + maintRes + emergencyRes + appTax + extraCosts;

    return { gross, fuel, maintRes, emergencyRes, appTax, netSalary, extraCosts, totalCosts };
  }, [sessions, expenses, period, currentRaces, currentDailyExpenses]);

  const costChartData = useMemo(() => [
    { name: 'Combustível', value: stats.fuel, color: '#FF4B4B' },
    { name: 'Reservas', value: stats.maintRes + stats.emergencyRes, color: '#FFB84D' },
    { name: 'Taxas App', value: stats.appTax, color: '#4D94FF' },
    { name: 'Custos Extras', value: stats.extraCosts, color: '#A14DFF' }
  ].filter(d => d.value > 0), [stats]);

  const generateCSV = () => {
    const headers = ["Data", "Categoria", "Descricao", "Valor (R$)"];
    const rows: string[][] = [];
    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n"
      + rows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `relatorio_df_${period.toLowerCase()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const generatePDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    const content = `
      <html>
        <head><title>Relatório - Driver's Friend</title></head>
        <body style="font-family:sans-serif; padding:40px;">
          <h1>Relatório Profissional</h1>
          <p>Líquido no Período: R$ ${stats.netSalary.toFixed(2)}</p>
        </body>
      </html>`;
    printWindow.document.write(content);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="p-5 space-y-6 pb-24 animate-up">
      <header className="pt-6">
        <h1 className="text-3xl font-black italic text-outline">Financeiro</h1>
      </header>

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
            <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest text-outline-sm flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> Lucro Líquido Acumulado
            </p>
            <p className="text-4xl font-black italic text-outline leading-none">R$ {stats.netSalary.toFixed(2)}</p>
          </div>
          <Activity size={24} className="text-white/30" />
        </div>

        <div className="space-y-2">
           <div className="flex items-center gap-2 mb-2">
              <PieIcon size={14} className="text-zinc-500" />
              <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Fluxo de Custos (Total)</p>
           </div>
           <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie 
                  data={costChartData} 
                  innerRadius={60} 
                  outerRadius={80} 
                  paddingAngle={5} 
                  dataKey="value" 
                  stroke="none"
                >
                  {costChartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '15px', background: '#000', border: '1px solid #333', fontSize: '11px', fontWeight: 'bold', color: '#fff' }} 
                  itemStyle={{ color: '#fff' }}
                  formatter={(val: number) => `R$ ${val.toFixed(2)}`}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '9px', fontWeight: 'bold', textTransform: 'uppercase', paddingTop: '20px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white p-5 rounded-2xl text-black shadow-xl">
             <p className="text-[9px] font-black uppercase text-zinc-500 leading-none mb-1">Bruto Total</p>
             <p className="text-xl font-black italic leading-none">R$ {stats.gross.toFixed(0)}</p>
          </div>
          <div className="bg-black/40 p-5 rounded-2xl border border-white/5 text-center flex flex-col justify-center">
             <p className="text-[9px] font-black uppercase text-zinc-500 leading-none mb-1 text-outline-sm">Gastos/Invest.</p>
             <p className="text-lg font-black italic text-outline leading-none">R$ {stats.totalCosts.toFixed(0)}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
         <button onClick={generateCSV} className="bg-zinc-900 border border-zinc-800 p-5 rounded-3xl flex flex-col items-center gap-2 active:scale-95 shadow-xl group transition-all">
            <Download size={20} className="text-white group-hover:translate-y-0.5 transition-transform" />
            <span className="text-[9px] font-black uppercase tracking-widest text-outline-sm">Exportar Dados</span>
         </button>
         <button onClick={generatePDF} className="bg-white text-black p-5 rounded-3xl flex flex-col items-center gap-2 active:scale-95 shadow-xl group transition-all">
            <FileText size={20} className="group-hover:scale-110 transition-transform" />
            <span className="text-[9px] font-black uppercase tracking-widest">Relatório PDF</span>
         </button>
      </div>
    </div>
  );
};

export default Financeiro;
