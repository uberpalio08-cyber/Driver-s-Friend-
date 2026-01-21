
import React, { useState } from 'react';
import { UserProfile, GasStation, RefuelEntry, FuelType } from '../types';
import { Plus, Fuel, ChevronRight, Gauge, Clock, Droplets, TrendingUp } from 'lucide-react';

interface Props {
  user: UserProfile;
  stations: GasStation[];
  onAddStation: (name: string, gasPrice?: number, etanolPrice?: number) => void;
  onRefuel: (entry: RefuelEntry) => void;
  refuels: RefuelEntry[];
}

const Postos: React.FC<Props> = ({ user, stations, onAddStation, onRefuel, refuels }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [showRefuel, setShowRefuel] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  const [newS, setNewS] = useState({ name: '', gas: '', eta: '' });
  const [refuelForm, setRefuelForm] = useState({ 
    sId: '', 
    type: 'GASOLINA' as FuelType, 
    p: '', 
    r: '', 
    km: '',
    isFull: false 
  });

  const tankPercent = Math.round((user.currentFuelLevel / user.car.tankCapacity) * 100);

  const openRefuel = (s: GasStation) => {
    setRefuelForm({ 
      sId: s.id, 
      type: 'GASOLINA', 
      p: s.lastGasPrice?.toString() || '', 
      r: '', 
      km: '',
      isFull: false
    });
    setShowRefuel(true);
  };

  const handleTypeSwitch = (type: FuelType) => {
    const s = stations.find(st => st.id === refuelForm.sId);
    const price = type === 'GASOLINA' ? s?.lastGasPrice : s?.lastEtanolPrice;
    setRefuelForm({...refuelForm, type, p: price?.toString() || ''});
  };

  const formatDate = (ts: number) => new Date(ts).toLocaleDateString();
  const formatTime = (ts: number) => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Cálculo de rendimento: KM atual - KM anterior / Litros
  const getEfficiency = (entry: RefuelEntry, index: number) => {
    const sortedRefuels = [...refuels].sort((a,b) => a.date - b.date);
    const currentIdx = sortedRefuels.findIndex(r => r.id === entry.id);
    if (currentIdx <= 0) return null;
    const prev = sortedRefuels[currentIdx - 1];
    const dist = entry.odometerAtRefuel - prev.odometerAtRefuel;
    if (dist <= 0) return null;
    return dist / entry.liters;
  };

  return (
    <div className="p-5 space-y-6 pb-24 animate-up">
      <header className="pt-6 flex justify-between items-center">
        <h1 className="text-3xl font-black italic text-outline">Postos</h1>
        <button onClick={() => setShowAdd(true)} className="bg-white text-black p-3 rounded-2xl shadow-xl active:scale-90 transition-all">
          <Plus size={24} />
        </button>
      </header>

      {/* Medidor do Tanque Profissional */}
      <div className="glass-card p-8 shadow-2xl flex flex-col items-center">
        <div className="relative w-44 h-44">
           <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
              <circle cx="50" cy="50" r="45" fill="none" stroke="white" strokeWidth="10" strokeDasharray="282.7" strokeDashoffset={282.7 - (282.7 * tankPercent) / 100} strokeLinecap="round" className="transition-all duration-1000" />
           </svg>
           <div className="absolute inset-0 flex flex-col items-center justify-center transform rotate-0">
              <p className="text-4xl font-black italic text-outline">{tankPercent}%</p>
              <p className="text-[7px] font-black text-zinc-500 uppercase tracking-widest mt-1">Nível de Combustível</p>
           </div>
        </div>
        <div className="w-full flex justify-between mt-6 px-4">
           <div className="text-center">
              <p className="text-[8px] font-bold text-zinc-500 uppercase">Litros</p>
              <p className="text-sm font-black text-white">{user.currentFuelLevel.toFixed(1)}L</p>
           </div>
           <div className="h-8 w-px bg-zinc-800" />
           <div className="text-center">
              <p className="text-[8px] font-bold text-zinc-500 uppercase">Capacidade</p>
              <p className="text-sm font-black text-white">{user.car.tankCapacity}L</p>
           </div>
        </div>
      </div>

      <div className="space-y-3">
        {stations.map(s => (
          <div key={s.id} onClick={() => openRefuel(s)} className="glass-card p-5 flex items-center justify-between border border-white/5 active:scale-[0.98] transition-all cursor-pointer hover:bg-white/5">
            <div className="flex items-center gap-5">
              <div className="bg-white p-3 rounded-xl text-black shadow-lg"><Fuel size={20} /></div>
              <div>
                <p className="font-black uppercase text-sm text-outline leading-none">{s.name}</p>
                <div className="flex gap-4 mt-2">
                   <p className="text-[9px] text-zinc-500 font-bold uppercase text-outline-sm">G: <span className="text-white">R$ {s.lastGasPrice?.toFixed(3) || '--'}</span></p>
                   <p className="text-[9px] text-zinc-500 font-bold uppercase text-outline-sm">E: <span className="text-white">R$ {s.lastEtanolPrice?.toFixed(3) || '--'}</span></p>
                </div>
              </div>
            </div>
            <ChevronRight size={18} className="text-zinc-600" />
          </div>
        ))}
      </div>

      {/* Histórico de Abastecimento - Mesma lógica da Home */}
      <div className="space-y-3">
        <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-1 text-outline-sm">Abastecimentos</h3>
        <div className="space-y-2">
          {refuels.length === 0 ? (
            <div className="py-12 text-center text-zinc-800 text-[10px] font-black uppercase border border-dashed border-zinc-900 rounded-3xl bg-black/5">Sem histórico</div>
          ) : (
            refuels.slice().reverse().map(entry => (
              <div key={entry.id} onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)} className="glass-card overflow-hidden cursor-pointer border border-white/5 active:scale-[0.99] transition-all">
                <div className="p-4 flex items-center justify-between">
                   <div className="flex items-center gap-4">
                      <div className="text-center">
                        <p className="text-[7px] font-bold text-zinc-500 uppercase leading-none mb-1">DATA</p>
                        <p className="text-[9px] font-black text-white text-outline-sm">{formatDate(entry.date)}</p>
                      </div>
                      <div className="h-6 w-px bg-zinc-800" />
                      <div className="text-center">
                        <p className="text-[7px] font-bold text-zinc-500 uppercase leading-none mb-1">HORA</p>
                        <p className="text-[9px] font-black text-white text-outline-sm">{formatTime(entry.date)}</p>
                      </div>
                   </div>
                   <div className="text-right">
                      <p className="text-xl font-black italic text-outline leading-none">R$ {(entry.liters * entry.pricePerLiter).toFixed(2)}</p>
                      <p className="text-[7px] font-bold text-zinc-500 uppercase mt-1">{entry.liters.toFixed(1)}L {entry.fuelType.charAt(0)}</p>
                   </div>
                </div>

                {expandedId === entry.id && (
                  <div className="p-4 bg-black/50 border-t border-white/5 space-y-4 animate-in fade-in slide-in-from-top-1">
                    <div className="grid grid-cols-2 gap-3">
                       <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                          <p className="text-[8px] font-bold text-zinc-500 uppercase mb-1">Preço/L</p>
                          <p className="text-xs font-black text-white">R$ {entry.pricePerLiter.toFixed(3)}</p>
                       </div>
                       <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                          <p className="text-[8px] font-bold text-zinc-500 uppercase mb-1">KM Painel</p>
                          <p className="text-xs font-black text-white">{entry.odometerAtRefuel.toLocaleString()} KM</p>
                       </div>
                    </div>
                    {getEfficiency(entry, 0) && (
                      <div className="bg-emerald-600/10 p-4 rounded-xl border border-emerald-500/20 flex items-center justify-between">
                         <div className="flex items-center gap-2">
                            <TrendingUp size={16} className="text-emerald-500" />
                            <p className="text-[9px] font-black text-emerald-500 uppercase">Rendimento Médio</p>
                         </div>
                         <p className="text-lg font-black italic text-emerald-500">{getEfficiency(entry, 0)?.toFixed(1)} Km/L</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modais sem valores pré-preenchidos */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/95 z-[110] flex items-center justify-center p-6">
          <div className="bg-zinc-900 w-full max-w-sm rounded-[2.5rem] p-10 space-y-6 border border-white/10 shadow-2xl">
            <h2 className="text-2xl font-black text-white text-center uppercase italic text-outline">Novo Perfil Posto</h2>
            <div className="space-y-4">
              <input className="w-full font-black text-center" placeholder="Ex: Shell Marginal" value={newS.name} onChange={e => setNewS({...newS, name: e.target.value})} />
              <div className="grid grid-cols-2 gap-3">
                <input type="number" step="0.001" className="text-center" placeholder="R$ Gas" value={newS.gas} onChange={e => setNewS({...newS, gas: e.target.value})} />
                <input type="number" step="0.001" className="text-center" placeholder="R$ Eta" value={newS.eta} onChange={e => setNewS({...newS, eta: e.target.value})} />
              </div>
            </div>
            <button onClick={() => { onAddStation(newS.name, parseFloat(newS.gas), parseFloat(newS.eta)); setShowAdd(false); setNewS({name:'', gas:'', eta:''}); }} className="w-full bg-white text-black py-5 rounded-2xl font-black uppercase italic text-lg shadow-xl">Salvar Posto</button>
            <button onClick={() => setShowAdd(false)} className="w-full text-zinc-600 font-black uppercase text-[10px]">Fechar</button>
          </div>
        </div>
      )}

      {showRefuel && (
        <div className="fixed inset-0 bg-black/95 z-[110] flex items-center justify-center p-6">
          <div className="bg-zinc-900 w-full max-w-sm rounded-[2.5rem] p-10 space-y-6 border border-white/10 shadow-2xl">
            <h2 className="text-2xl font-black text-white text-center uppercase italic text-outline">Abastecer</h2>
            
            <div className="grid grid-cols-2 gap-3">
               <button onClick={() => handleTypeSwitch('GASOLINA')} className={`py-3 rounded-xl font-black text-[10px] uppercase transition-all ${refuelForm.type === 'GASOLINA' ? 'bg-white text-black' : 'bg-zinc-800 text-zinc-500'}`}>Gasolina</button>
               <button onClick={() => handleTypeSwitch('ETANOL')} className={`py-3 rounded-xl font-black text-[10px] uppercase transition-all ${refuelForm.type === 'ETANOL' ? 'bg-white text-black' : 'bg-zinc-800 text-zinc-500'}`}>Etanol</button>
            </div>

            <div className="grid grid-cols-2 gap-3">
               <div className="space-y-1 text-center">
                  <p className="text-[7px] text-zinc-500 uppercase font-black">Preço/L</p>
                  <input type="number" step="0.001" className="text-center w-full" placeholder="0.000" value={refuelForm.p} onChange={e => setRefuelForm({...refuelForm, p: e.target.value})} />
               </div>
               <div className="space-y-1 text-center">
                  <p className="text-[7px] text-zinc-500 uppercase font-black">Total Pago (R$)</p>
                  <input type="number" step="0.01" className="text-center w-full" placeholder="0.00" value={refuelForm.r} onChange={e => setRefuelForm({...refuelForm, r: e.target.value})} />
               </div>
            </div>

            <div className="flex items-center justify-between bg-black/40 p-4 rounded-2xl border border-white/5">
               <span className="text-[10px] font-black uppercase italic text-outline-sm">Tanque Cheio?</span>
               <input type="checkbox" className="w-7 h-7 accent-white" checked={refuelForm.isFull} onChange={e => setRefuelForm({...refuelForm, isFull: e.target.checked})} />
            </div>

            <div className="space-y-1">
               <p className="text-[8px] text-zinc-500 uppercase font-black text-center">KM do Painel</p>
               <input type="number" className="w-full text-center text-2xl font-black italic" placeholder="000000" value={refuelForm.km} onChange={e => setRefuelForm({...refuelForm, km: e.target.value})} />
            </div>
            
            <button onClick={() => { 
                const liters = parseFloat(refuelForm.r) / (parseFloat(refuelForm.p) || 1);
                onRefuel({ 
                  id: Date.now().toString(), 
                  date: Date.now(), 
                  stationId: refuelForm.sId, 
                  fuelType: refuelForm.type, 
                  pricePerLiter: parseFloat(refuelForm.p) || 0, 
                  liters: isNaN(liters) ? 0 : liters, 
                  isFullTank: refuelForm.isFull, 
                  odometerAtRefuel: parseFloat(refuelForm.km) || user.lastOdometer 
                });
                setShowRefuel(false);
              }} className="w-full bg-white text-black py-5 rounded-2xl font-black uppercase italic text-lg shadow-xl">Confirmar</button>
            <button onClick={() => setShowRefuel(false)} className="w-full text-zinc-600 font-black uppercase text-[10px]">Cancelar</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Postos;
