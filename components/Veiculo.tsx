
import React, { useState } from 'react';
import { UserProfile, MaintenanceTask, TripSession } from '../types';
import { Wrench, Plus, AlertTriangle, Coins } from 'lucide-react';

interface Props {
  user: UserProfile;
  maintenance: MaintenanceTask[];
  onUpsert: (task: MaintenanceTask) => void;
  sessions: TripSession[];
}

const Veiculo: React.FC<Props> = ({ user, maintenance, onUpsert, sessions }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [data, setData] = useState({
    name: 'Troca de Óleo',
    interval: '',
    lastOdo: user.lastOdometer.toString(),
    lastCost: ''
  });

  const getAlert = (m: MaintenanceTask) => {
    const nextAt = m.lastOdo + m.interval;
    const remaining = nextAt - user.lastOdometer;
    if (remaining <= 3000) return remaining <= 0 ? 'URGENTE' : 'AVISO';
    return null;
  };

  const last30Days = sessions.filter(s => s.date > Date.now() - 30 * 24 * 60 * 60 * 1000);
  const kmMonth = last30Days.reduce((acc, s) => acc + (s.endOdometer - s.startOdometer), 0);
  
  const monthlyReserve = maintenance.reduce((acc, m) => {
    return acc + (m.lastCost / m.interval) * (kmMonth || 1);
  }, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (data.name && data.interval && data.lastCost) {
      onUpsert({
        id: Date.now().toString(),
        name: data.name,
        interval: parseInt(data.interval),
        lastOdo: parseInt(data.lastOdo),
        lastCost: parseFloat(data.lastCost)
      });
      setShowAdd(false);
      setData({ name: 'Troca de Óleo', interval: '', lastOdo: user.lastOdometer.toString(), lastCost: '' });
    }
  };

  return (
    <div className="p-6 space-y-6">
      <header className="py-4 flex justify-between items-center">
        <div>
          <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">Manutenção Preventiva</p>
          <h1 className="text-2xl font-black text-black">Seu Veículo</h1>
        </div>
        <button onClick={() => setShowAdd(true)} className="bg-black text-white p-3 rounded-2xl shadow-lg active:scale-95 transition-transform">
          <Plus size={24} />
        </button>
      </header>

      {/* Reserve Card - Agora Preto para ornar com o tema */}
      <div className="bg-black p-8 rounded-[2.5rem] text-white shadow-2xl flex items-center justify-between border border-zinc-800">
        <div className="space-y-1">
          <p className="text-zinc-400 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Reserva Mensal</p>
          <h2 className="text-4xl font-black italic tracking-tighter">R$ {monthlyReserve.toFixed(2)}</h2>
          <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">Base: {kmMonth.toFixed(0)} km/mês</p>
        </div>
        <div className="bg-white/10 p-5 rounded-[2rem] border border-white/5 shadow-inner">
          <Coins size={36} className="text-white" />
        </div>
      </div>

      <div className="space-y-4">
        {maintenance.length === 0 ? (
          <div className="text-center py-16 bg-zinc-50 border-2 border-dashed border-zinc-200 rounded-[2.5rem]">
            <p className="text-zinc-400 text-xs font-black uppercase tracking-widest">Cadastre alertas de manutenção</p>
          </div>
        ) : (
          maintenance.map(m => {
            const alertType = getAlert(m);
            return (
              <div key={m.id} className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-zinc-100 space-y-4">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-4">
                    <div className={`p-4 rounded-2xl ${alertType ? 'bg-black text-white' : 'bg-zinc-50 text-zinc-400'}`}>
                      <Wrench size={22} />
                    </div>
                    <div>
                      <h4 className="font-black text-black uppercase text-sm tracking-tight">{m.name}</h4>
                      <p className="text-[9px] text-zinc-400 uppercase font-black tracking-widest">Intervalo: {m.interval}km</p>
                    </div>
                  </div>
                  {alertType && (
                    <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-[9px] font-black ${alertType === 'URGENTE' ? 'bg-black text-white' : 'bg-zinc-200 text-zinc-600'}`}>
                      <AlertTriangle size={10} /> {alertType}
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-zinc-50">
                   <div>
                     <p className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">Último Gasto</p>
                     <p className="text-md font-black text-black">R$ {m.lastCost.toFixed(2)}</p>
                   </div>
                   <div className="text-right">
                     <p className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">Próxima em</p>
                     <p className="text-md font-black text-black italic">{(m.lastOdo + m.interval).toLocaleString()} km</p>
                   </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-[100] flex items-center justify-center p-8">
          <div className="bg-white w-full rounded-[3rem] p-10 space-y-8 animate-in zoom-in-95 duration-200">
            <h2 className="text-2xl font-black text-black text-center uppercase tracking-tighter">Configurar Alerta</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Serviço</label>
                <select className="w-full bg-zinc-50 border-2 border-zinc-100 rounded-2xl px-6 py-5 outline-none appearance-none font-black text-black" value={data.name} onChange={e => setData({...data, name: e.target.value})}>
                  <option>Troca de Óleo</option>
                  <option>Pastilhas de Freio</option>
                  <option>Filtro de Ar</option>
                  <option>Ar Condicionado</option>
                  <option>Correia Dentada</option>
                  <option>Pneus</option>
                  <option>Outros</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Custo (R$)</label>
                  <input required type="number" className="w-full bg-zinc-50 border-2 border-zinc-100 rounded-2xl px-5 py-4 outline-none font-black text-black" placeholder="250" value={data.lastCost} onChange={e => setData({...data, lastCost: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Km Intervalo</label>
                  <input required type="number" className="w-full bg-zinc-50 border-2 border-zinc-100 rounded-2xl px-5 py-4 outline-none font-black text-black" placeholder="10000" value={data.interval} onChange={e => setData({...data, interval: e.target.value})} />
                </div>
              </div>
              <div className="flex flex-col gap-3 pt-4">
                <button type="submit" className="w-full bg-black text-white py-5 rounded-[2rem] font-black text-lg shadow-2xl active:scale-95 transition-all uppercase tracking-widest">Salvar</button>
                <button type="button" onClick={() => setShowAdd(false)} className="w-full py-2 text-zinc-400 font-black text-[10px] uppercase tracking-widest">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Veiculo;
