
import React, { useState, useMemo } from 'react';
import { UserProfile, MaintenanceTask, Race, TripSession } from '../types';
import { Wrench, Plus, Trash2, Gauge, Bell, CheckCircle2, Car, RefreshCcw } from 'lucide-react';

interface Props {
  user: UserProfile;
  maintenance: MaintenanceTask[];
  onUpsert: (task: MaintenanceTask) => void;
  onDelete: (id: string) => void;
  maintCostPerKm: number;
  currentRaces: Race[];
  sessions: TripSession[];
}

const Veiculo: React.FC<Props> = ({ user, maintenance = [], onUpsert, onDelete, maintCostPerKm }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ id: '', name: '', interval: '', cost: '', alertBefore: '1000' });

  const handleSave = () => {
    if (!form.name || !form.interval || !form.cost) return alert("Preencha os campos.");
    onUpsert({
      id: form.id || Date.now().toString(),
      name: form.name,
      interval: parseFloat(form.interval),
      lastOdo: user.lastOdometer,
      lastCost: parseFloat(form.cost),
      alertBeforeKm: parseFloat(form.alertBefore) || 1000
    });
    setShowAdd(false);
    setForm({ id: '', name: '', interval: '', cost: '', alertBefore: '1000' });
  };

  const handleCompleteMaint = (task: MaintenanceTask) => {
    if (confirm(`Confirmar que a manutenção "${task.name}" foi realizada hoje com ${user.lastOdometer} KM?`)) {
       onUpsert({ ...task, lastOdo: user.lastOdometer });
    }
  };

  return (
    <div className="space-y-6 pb-40 animate-up">
      <header className="pt-6 px-2">
        <p className="text-[10px] font-black uppercase text-blue-500 tracking-widest leading-none mb-1">GARAGEM</p>
        <h1 className="text-2xl font-black italic text-white tracking-tighter">Manutenção</h1>
      </header>

      {/* PERFIL DO CARRO */}
      <div className="mx-2 bg-gradient-to-br from-slate-900 to-black p-8 rounded-[3rem] border border-white/5 relative overflow-hidden shadow-2xl">
         <Car size={120} className="absolute -bottom-8 -right-8 text-white/5 rotate-12" />
         <div className="space-y-1 relative z-10">
            <h2 className="text-3xl font-black italic text-white uppercase tracking-tighter">{user.car.brand} {user.car.model}</h2>
            <div className="flex gap-3 text-[10px] font-black text-blue-400 uppercase tracking-widest">
               <span>Ano {user.car.year}</span>
               <span>•</span>
               <span>{user.car.power}</span>
            </div>
         </div>
         <div className="mt-8 grid grid-cols-2 gap-4 relative z-10">
            <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
               <p className="text-[8px] font-black text-slate-500 uppercase">Odômetro Atual</p>
               <p className="text-xl font-black text-white italic">{user.lastOdometer} KM</p>
            </div>
            <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
               <p className="text-[8px] font-black text-slate-500 uppercase">Total Reserva/KM</p>
               <p className="text-xl font-black text-emerald-400 italic">R$ {maintCostPerKm.toFixed(3)}</p>
            </div>
         </div>
      </div>

      {/* LISTA DE TAREFAS */}
      <div className="space-y-3 px-2">
         <div className="flex justify-between items-center px-2">
            <h3 className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Monitoramento Ativo</h3>
            <button onClick={() => setShowAdd(true)} className="p-2 bg-blue-600 text-white rounded-xl active:scale-90"><Plus size={18}/></button>
         </div>
         
         {maintenance.length === 0 ? (
           <div className="p-10 border-2 border-dashed border-slate-800 rounded-[2.5rem] text-center mx-2">
              <p className="text-[9px] font-black text-slate-700 uppercase">Adicione revisões (Óleo, Pneus, Correia) para criar a reserva automática.</p>
           </div>
         ) : maintenance.map(m => {
            const nextMaint = m.lastOdo + m.interval;
            const remaining = nextMaint - user.lastOdometer;
            const progress = Math.max(0, Math.min(100, (remaining / m.interval) * 100));
            const isCritical = remaining <= m.alertBeforeKm;
            const costPerKm = m.interval > 0 ? (m.lastCost / m.interval) : 0;

            return (
              <div key={m.id} className="bg-slate-900/50 border border-white/5 p-6 rounded-[2.5rem] space-y-4 shadow-lg">
                 <div className="flex justify-between items-start">
                    <div className="flex items-center gap-4">
                       <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isCritical ? 'bg-rose-500/10 text-rose-500 animate-pulse' : 'bg-blue-600/10 text-blue-500'}`}>
                          <Wrench size={24} />
                       </div>
                       <div>
                          <p className="text-lg font-black text-white italic uppercase leading-none">{m.name}</p>
                          <p className="text-[8px] font-bold text-slate-600 uppercase mt-1">Troca a cada {m.interval} KM • R$ {costPerKm.toFixed(4)}/KM</p>
                       </div>
                    </div>
                    <button onClick={() => handleCompleteMaint(m)} className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl active:scale-90 shadow-lg border border-emerald-500/20">
                       <RefreshCcw size={18} />
                    </button>
                 </div>
                 
                 <div className="space-y-2">
                    <div className="flex justify-between items-baseline">
                       <span className="text-[9px] font-black text-slate-500 uppercase">Restam {remaining} KM</span>
                       <span className={`text-xl font-black italic ${isCritical ? 'text-rose-500' : 'text-emerald-400'}`}>
                          {remaining > 0 ? `${remaining} km` : 'VENCIDO'}
                       </span>
                    </div>
                    <div className="h-2 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-white/5">
                       <div className={`h-full rounded-full transition-all duration-1000 ${isCritical ? 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]' : 'bg-emerald-500'}`} style={{width: `${progress}%`}} />
                    </div>
                 </div>
                 <div className="flex justify-between items-center pt-2">
                    <button onClick={() => onDelete(m.id)} className="text-[8px] font-black text-rose-500 uppercase underline decoration-rose-500/30 underline-offset-4">Remover Item</button>
                    <span className="text-[8px] font-bold text-slate-700 uppercase">Última: {m.lastOdo} KM • Valor: R$ {m.lastCost}</span>
                 </div>
              </div>
            );
         })}
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-slate-950/98 z-[999] flex items-center justify-center p-6 animate-up">
           <div className="w-full max-w-sm p-8 bg-slate-900 border border-white/10 rounded-[3rem] space-y-5">
              <h2 className="text-xl font-black uppercase italic text-white text-center">Configurar Reserva</h2>
              <div className="space-y-4">
                 <input className="w-full py-5 text-xl font-black text-center bg-slate-950 text-white rounded-2xl border-2 border-slate-800 focus:border-blue-500 outline-none placeholder-slate-800" placeholder="Nome (Ex: Troca de Óleo)" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                 <div className="grid grid-cols-2 gap-3">
                    <div>
                       <p className="text-[8px] font-black text-slate-500 uppercase mb-1 ml-1 text-center">Intervalo (KM)</p>
                       <input type="number" className="w-full py-4 text-center font-black bg-slate-950 text-white rounded-xl border border-slate-800 placeholder-slate-900" placeholder="10000" value={form.interval} onChange={e => setForm({...form, interval: e.target.value})} />
                    </div>
                    <div>
                       <p className="text-[8px] font-black text-slate-500 uppercase mb-1 ml-1 text-center">Custo Estimado (R$)</p>
                       <input type="number" className="w-full py-4 text-center font-black bg-slate-950 text-white rounded-xl border border-slate-800 placeholder-slate-900" placeholder="285.00" value={form.cost} onChange={e => setForm({...form, cost: e.target.value})} />
                    </div>
                 </div>
                 <div className="bg-blue-600/10 p-4 rounded-xl text-center border border-blue-500/20">
                    <p className="text-[9px] font-black text-blue-400 uppercase">RESERVA CALCULADA</p>
                    <p className="text-lg font-black text-white italic">R$ {((parseFloat(form.cost)||0)/(parseFloat(form.interval)||1)).toFixed(4)} <span className="text-[10px]">por KM</span></p>
                 </div>
                 <button onClick={handleSave} className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black text-lg uppercase italic shadow-2xl active:scale-95">Salvar Monitoramento</button>
                 <button onClick={() => setShowAdd(false)} className="w-full text-slate-600 font-black uppercase text-[10px] text-center tracking-widest">Cancelar</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
export default Veiculo;
