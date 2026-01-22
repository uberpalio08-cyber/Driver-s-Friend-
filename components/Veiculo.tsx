
import React, { useState, useMemo } from 'react';
import { UserProfile, MaintenanceTask, Race, TripSession } from '../types';
import { Wrench, Plus, Trash2, Info, ArrowRight, Gauge, Bell, CheckCircle2, RefreshCcw } from 'lucide-react';

interface Props {
  user: UserProfile;
  maintenance: MaintenanceTask[];
  onUpsert: (task: MaintenanceTask) => void;
  onDelete: (id: string) => void;
  maintCostPerKm: number;
  currentRaces: Race[];
  sessions: TripSession[];
}

const Veiculo: React.FC<Props> = ({ user, maintenance = [], onUpsert, onDelete, maintCostPerKm, currentRaces = [], sessions = [] }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ id: '', name: '', interval: '', cost: '', alertBefore: '1000' });

  const totalBudgetRequired = useMemo(() => {
    return maintenance.reduce((acc, m) => acc + (Number(m.lastCost) || 0), 0);
  }, [maintenance]);

  const handleSave = () => {
    if (!form.name || !form.interval || !form.cost) {
      alert("Preencha os campos obrigatórios.");
      return;
    }
    onUpsert({
      id: form.id || Date.now().toString(),
      name: form.name,
      interval: parseFloat(form.interval),
      lastOdo: form.id ? (maintenance.find(x => x.id === form.id)?.lastOdo || user.lastOdometer) : user.lastOdometer,
      lastCost: parseFloat(form.cost),
      alertBeforeKm: parseFloat(form.alertBefore) || 1000
    });
    setShowAdd(false);
    setForm({ id: '', name: '', interval: '', cost: '', alertBefore: '1000' });
  };

  const openEdit = (m: MaintenanceTask) => {
    setForm({
      id: m.id,
      name: m.name,
      interval: m.interval.toString(),
      cost: m.lastCost.toString(),
      alertBefore: m.alertBeforeKm.toString()
    });
    setShowAdd(true);
  };

  return (
    <div className="space-y-6 pb-40 animate-up">
      <header className="flex justify-between items-center pt-2 px-1">
        <div>
          <p className="text-[10px] font-black uppercase text-blue-500 tracking-widest leading-none mb-1 opacity-70">Engenharia de Custos</p>
          <h1 className="text-2xl font-black italic text-white tracking-tighter">Manutenção</h1>
        </div>
        <button onClick={() => { setForm({ id:'', name:'', interval:'', cost:'', alertBefore:'1000' }); setShowAdd(true); }} className="bg-blue-600 text-white p-3 rounded-2xl shadow-xl active:scale-95 border-b-4 border-blue-800 transition-all">
          <Plus size={20} />
        </button>
      </header>

      <div className="bento-card p-6 border-l-4 border-blue-500 bg-slate-900 shadow-2xl">
        <div className="flex justify-between items-start mb-4">
          <div className="space-y-1">
            <p className="text-slate-500 text-[9px] font-black uppercase tracking-widest leading-none">Custo Estimado por KM</p>
            <p className="text-4xl font-black italic text-white tracking-tighter leading-none">R$ {maintCostPerKm.toFixed(3)}</p>
            <p className="text-[8px] font-bold text-slate-600 uppercase mt-1 italic">Baseado no plano de R$ {totalBudgetRequired.toFixed(0)} total</p>
          </div>
          <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-500 shadow-inner">
            <Wrench size={24} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-4">
           <div>
              <p className="text-[7px] font-black text-slate-600 uppercase mb-1">Itens Ativos</p>
              <p className="text-xs font-black text-blue-400 italic">{maintenance.length} Monitorados</p>
           </div>
           <div className="text-right">
              <p className="text-[7px] font-black text-slate-600 uppercase mb-1">Hodômetro Atual</p>
              <p className="text-xs font-black text-slate-300 italic">{user.lastOdometer.toLocaleString()} KM</p>
           </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-center px-1">
           <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Plano de Manutenção</p>
        </div>
        
        {maintenance.length === 0 ? (
           <div className="py-16 text-center bento-card border-dashed border-slate-800 bg-transparent flex flex-col items-center gap-4">
              <Wrench size={24} className="text-slate-800" />
              <p className="text-[10px] font-black text-slate-700 uppercase italic px-10 leading-relaxed max-w-[280px]">
                Adicione itens como Troca de Óleo, Pneus ou Freios para monitorar o desgaste.
              </p>
           </div>
        ) : (
          maintenance.map(m => {
            const nextMaint = m.lastOdo + m.interval;
            const remaining = nextMaint - user.lastOdometer;
            const isCritical = remaining <= m.alertBeforeKm;
            const isOverdue = remaining <= 0;
            const isJustReset = user.lastOdometer === m.lastOdo;

            return (
              <div 
                key={m.id} 
                onClick={() => openEdit(m)}
                className={`bento-card p-5 flex items-center justify-between border-l-4 transition-all shadow-lg active:bg-slate-800 cursor-pointer relative overflow-hidden ${isOverdue ? 'border-l-rose-600 bg-rose-950/20' : isJustReset ? 'border-l-emerald-500 bg-emerald-950/10' : isCritical ? 'border-l-amber-500 bg-amber-500/5' : 'border-l-blue-600 bg-slate-900/60'}`}
              >
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${isOverdue ? 'bg-rose-500 text-white shadow-lg' : isJustReset ? 'bg-emerald-600 text-white' : isCritical ? 'bg-amber-500 text-white' : 'bg-slate-800 text-blue-500'}`}>
                    <Wrench size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-black text-white uppercase text-sm italic leading-none">{m.name}</p>
                      {isJustReset && (
                        <span className="flex items-center gap-1 bg-emerald-500/20 text-emerald-400 text-[7px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-tighter animate-pulse">
                          <CheckCircle2 size={8}/> Zerado
                        </span>
                      )}
                    </div>
                    <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest leading-none">
                      A CADA {m.interval.toLocaleString()} KM • R$ {m.lastCost.toFixed(2)}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <p className={`text-xl font-black tracking-tighter leading-none ${isOverdue ? 'text-rose-500' : isJustReset ? 'text-emerald-400' : isCritical ? 'text-amber-500' : 'text-white'}`}>
                    {Math.max(0, remaining).toLocaleString()} KM
                  </p>
                  <p className="text-[7px] font-black text-slate-700 uppercase italic mt-1.5">
                    RESTANTES
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-slate-950/98 backdrop-blur-xl z-[200] flex items-center justify-center p-6">
          <div className="w-full max-w-sm p-8 bg-slate-900 border border-white/10 rounded-[3rem] shadow-2xl space-y-5 animate-up">
            <h2 className="text-xl font-black uppercase italic text-center text-white tracking-tighter">
              {form.id ? 'Editar Monitoramento' : 'Novo Serviço'}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="text-[8px] font-black text-slate-600 uppercase ml-1 mb-1 block tracking-widest">Nome do Serviço</label>
                <input className="w-full font-black text-sm !bg-slate-950 border-slate-800 rounded-xl px-4 py-4 text-white" placeholder="Ex: Troca de Oleo" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[8px] font-black text-slate-600 uppercase ml-1 mb-1 block tracking-widest">Ciclo (KM)</label>
                  <input type="number" className="w-full text-center font-black !bg-slate-950 border-slate-800 rounded-xl px-4 py-4 text-white" placeholder="10000" value={form.interval} onChange={e => setForm({...form, interval: e.target.value})} />
                </div>
                <div>
                  <label className="text-[8px] font-black text-slate-600 uppercase ml-1 mb-1 block tracking-widest">Custo Estimado</label>
                  <input type="number" className="w-full text-center font-black !bg-slate-950 border-slate-800 rounded-xl px-4 py-4 text-white" placeholder="285" value={form.cost} onChange={e => setForm({...form, cost: e.target.value})} />
                </div>
              </div>

              <div>
                <label className="text-[8px] font-black text-slate-600 uppercase ml-1 mb-1 block tracking-widest flex items-center gap-1"><Bell size={10}/> Alerta de Antecedência (KM)</label>
                <input type="number" className="w-full font-black text-sm !bg-slate-950 border-slate-800 rounded-xl px-4 py-4 text-white" placeholder="Ex: 1000" value={form.alertBefore} onChange={e => setForm({...form, alertBefore: e.target.value})} />
              </div>
            </div>
            
            <div className="space-y-3 pt-2">
              <button onClick={handleSave} className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black uppercase italic text-base shadow-xl active:scale-95 border-b-4 border-blue-800 flex items-center justify-center gap-2">
                Salvar Monitoramento <ArrowRight size={18} />
              </button>
              
              {form.id && (
                <button onClick={(e) => { e.stopPropagation(); if(confirm("Remover este item?")) { onDelete(form.id); setShowAdd(false); } }} className="w-full bg-rose-900/20 text-rose-500 py-4 rounded-2xl font-black uppercase text-[10px] flex items-center justify-center gap-2 border border-rose-500/10">
                  <Trash2 size={14} /> Excluir Registro
                </button>
              )}
              
              <button onClick={() => setShowAdd(false)} className="w-full text-slate-600 font-black uppercase text-[10px] tracking-widest text-center py-2">Voltar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default Veiculo;
