
import React, { useState } from 'react';
import { UserProfile, GasStation, RefuelEntry, FuelType } from '../types';
import { Plus, Fuel, ChevronRight } from 'lucide-react';

interface Props {
  user: UserProfile;
  stations: GasStation[];
  refuels: RefuelEntry[];
  onAddStation: (name: string, gasPrice?: number, etanolPrice?: number) => void;
  onRefuel: (entry: RefuelEntry) => void;
  ai: any;
}

const Postos: React.FC<Props> = ({ user, stations, onAddStation, onRefuel }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [showRefuel, setShowRefuel] = useState(false);
  const [newS, setNewS] = useState({ name: '', gas: '', eta: '' });
  const [refuel, setRefuel] = useState({ sId: '', type: 'GASOLINA' as FuelType, p: '', r: '', km: user.lastOdometer.toString() });

  const openRefuel = (s: GasStation) => {
    setRefuel({ sId: s.id, type: 'GASOLINA', p: s.lastGasPrice?.toString() || '', r: '', km: user.lastOdometer.toString() });
    setShowRefuel(true);
  };

  return (
    <div className="p-5 space-y-6 pb-24 animate-up">
      <header className="pt-6 flex justify-between items-center">
        <h1 className="text-3xl font-black italic text-outline">Postos</h1>
        <button onClick={() => setShowAdd(true)} className="bg-white text-black p-3 rounded-2xl shadow-xl active:scale-90 transition-all">
          <Plus size={24} />
        </button>
      </header>

      <div className="glass-card p-6 shadow-2xl">
        <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest text-outline-sm">Tanque Atual</p>
        <p className="text-4xl font-black italic text-outline">{user.currentFuelLevel.toFixed(1)}L <span className="text-sm opacity-40">/ {user.car.tankCapacity}L</span></p>
        <div className="mt-4 h-2.5 bg-white/10 rounded-full overflow-hidden border border-white/5">
          <div className="h-full bg-white transition-all duration-1000 shadow-[0_0_10px_rgba(255,255,255,0.4)]" style={{ width: `${(user.currentFuelLevel/user.car.tankCapacity)*100}%` }} />
        </div>
      </div>

      <div className="space-y-3">
        {stations.length === 0 ? (
          <div className="py-12 text-center text-zinc-700 text-[10px] font-black uppercase border border-dashed border-zinc-900 rounded-3xl bg-black/10">Cadastre um posto</div>
        ) : (
          stations.map(s => (
            <div key={s.id} onClick={() => openRefuel(s)} className="glass-card p-5 flex items-center justify-between border border-white/5 active:scale-[0.98] transition-all cursor-pointer hover:bg-white/5">
              <div className="flex items-center gap-5">
                <div className="bg-white p-3 rounded-xl text-black shadow-lg"><Fuel size={20} /></div>
                <div>
                  <p className="font-black uppercase text-sm text-outline leading-none">{s.name}</p>
                  <p className="text-[9px] text-zinc-500 font-bold uppercase mt-1 text-outline-sm">Gas: R$ {s.lastGasPrice?.toFixed(2)} | Eta: R$ {s.lastEtanolPrice?.toFixed(2)}</p>
                </div>
              </div>
              <ChevronRight size={18} className="text-zinc-600" />
            </div>
          ))
        )}
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-black/95 z-[110] flex items-center justify-center p-6">
          <div className="bg-zinc-900 w-full max-w-sm rounded-[2.5rem] p-10 space-y-6 border border-white/10 shadow-2xl">
            <h2 className="text-2xl font-black text-white text-center uppercase italic text-outline">Novo Perfil</h2>
            <div className="space-y-4">
              <input className="w-full font-black text-center" placeholder="Nome do Posto" value={newS.name} onChange={e => setNewS({...newS, name: e.target.value})} />
              <div className="grid grid-cols-2 gap-3">
                <input type="number" step="0.001" className="text-center" placeholder="Preço Gas" value={newS.gas} onChange={e => setNewS({...newS, gas: e.target.value})} />
                <input type="number" step="0.001" className="text-center" placeholder="Preço Eta" value={newS.eta} onChange={e => setNewS({...newS, eta: e.target.value})} />
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
               <input type="number" step="0.001" className="text-center" placeholder="Preço/L" value={refuel.p} onChange={e => setRefuel({...refuel, p: e.target.value})} />
               <input type="number" step="0.01" className="text-center" placeholder="Total R$" value={refuel.r} onChange={e => setRefuel({...refuel, r: e.target.value})} />
            </div>
            <input type="number" className="w-full text-center text-3xl font-black italic" placeholder="KM Atual" value={refuel.km} onChange={e => setRefuel({...refuel, km: e.target.value})} />
            <button onClick={() => { 
                const liters = parseFloat(refuel.r) / parseFloat(refuel.p);
                onRefuel({ id: Date.now().toString(), date: Date.now(), stationId: refuel.sId, fuelType: refuel.type, pricePerLiter: parseFloat(refuel.p), liters, isFullTank: false, odometerAtRefuel: parseFloat(refuel.km) });
                setShowRefuel(false);
              }} className="w-full bg-white text-black py-5 rounded-2xl font-black uppercase italic text-lg shadow-xl">Confirmar</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Postos;
