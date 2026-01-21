
import React, { useState } from 'react';
import { UserProfile, MaintenanceTask } from '../types';
import { Wrench, Plus } from 'lucide-react';

interface Props {
  user: UserProfile;
  maintenance: MaintenanceTask[];
  onUpsert: (task: MaintenanceTask) => void;
  onUpdateMaintCost: (cost: number) => void;
  ai: any;
}

const Veiculo: React.FC<Props> = ({ user, maintenance, onUpsert }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [task, setTask] = useState({ name: '', interval: '', cost: '' });

  return (
    <div className="p-5 space-y-6 pb-24 animate-up">
      <header className="pt-6 flex justify-between items-center">
        <h1 className="text-3xl font-black italic text-outline">Manutenção</h1>
        <button onClick={() => setShowAdd(true)} className="bg-white text-black p-3 rounded-2xl shadow-xl active:scale-90 transition-all">
          <Plus size={24} />
        </button>
      </header>

      <div className="glass-card p-6 flex justify-between items-center shadow-2xl">
        <div className="space-y-1">
          <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest text-outline-sm">Reserva Atual / KM</p>
          <p className="text-3xl font-black italic text-outline">R$ {user.maintenanceCostPerKm?.toFixed(2) || '0.00'}</p>
        </div>
        <Wrench size={28} className="text-white/20" />
      </div>

      <div className="space-y-3">
        {maintenance.length === 0 ? (
           <div className="py-12 text-center text-zinc-700 text-[10px] font-black uppercase border border-dashed border-zinc-900 rounded-3xl bg-black/10">Sem tarefas registradas</div>
        ) : (
          maintenance.map(m => (
            <div key={m.id} className="glass-card p-5 flex items-center justify-between border border-white/5 hover:bg-white/5 transition-colors">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-zinc-800 rounded-xl text-white shadow-lg"><Wrench size={18} /></div>
                <div>
                  <p className="font-black text-white uppercase text-sm italic text-outline-sm leading-none mb-1">{m.name}</p>
                  <p className="text-[8px] text-zinc-500 font-bold uppercase">Custo Médio: R$ {m.lastCost.toFixed(0)}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xl font-black text-outline">{(m.lastOdo + m.interval - user.lastOdometer).toLocaleString()} KM</p>
                <p className="text-[8px] font-bold text-zinc-500 uppercase italic">Faltam</p>
              </div>
            </div>
          ))
        )}
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-[110] flex items-center justify-center p-6 text-center">
          <div className="bg-zinc-900 w-full max-w-sm rounded-[2.5rem] p-10 space-y-6 border border-white/10 shadow-2xl">
            <h2 className="text-2xl font-black uppercase italic text-outline">Nova Tarefa</h2>
            <div className="space-y-4">
              <input className="w-full text-center font-black" placeholder="Descrição (Ex: Óleo)" value={task.name} onChange={e => setTask({...task, name: e.target.value})} />
              <div className="grid grid-cols-2 gap-3">
                <input type="number" className="text-center" placeholder="Km (Intervalo)" value={task.interval} onChange={e => setTask({...task, interval: e.target.value})} />
                <input type="number" className="text-center" placeholder="Preço (R$)" value={task.cost} onChange={e => setTask({...task, cost: e.target.value})} />
              </div>
            </div>
            <button onClick={() => { onUpsert({ id: Date.now().toString(), name: task.name, interval: parseFloat(task.interval), lastOdo: user.lastOdometer, lastCost: parseFloat(task.cost) }); setShowAdd(false); setTask({name:'', interval:'', cost:''}); }} className="w-full bg-white text-black py-5 rounded-2xl font-black uppercase italic text-lg shadow-xl">Salvar Tarefa</button>
            <button onClick={() => setShowAdd(false)} className="text-[10px] font-black text-zinc-600 uppercase">Cancelar</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Veiculo;
