
import React, { useState } from 'react';
import { UserProfile, RefuelEntry, FuelType, StationProfile } from '../types';
import { Plus, Fuel, ChevronRight, History, MapPin, Gauge } from 'lucide-react';

interface Props {
  user: UserProfile;
  onRefuel: (entry: RefuelEntry) => void;
  refuels: RefuelEntry[];
}

const Postos: React.FC<Props> = ({ user, onRefuel, refuels = [] }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ 
    station: '', type: 'GASOLINA' as FuelType, price: '', amount: '', km: '' 
  });

  const tankPercent = Math.round((user.currentFuelLevel / (user.car?.tankCapacity || 50)) * 100);

  const handleSave = () => {
    const p = parseFloat(form.price);
    const m = parseFloat(form.amount);
    const l = m / p;
    if (!p || !m) return;

    onRefuel({
      id: Date.now().toString(),
      date: Date.now(),
      stationName: form.station || 'Posto Desconhecido',
      fuelType: form.type,
      pricePerLiter: p,
      amountMoney: m,
      liters: l,
      odometerAtRefuel: parseFloat(form.km) || user.lastOdometer
    });
    setShowAdd(false);
    setForm({ station: '', type: 'GASOLINA', price: '', amount: '', km: '' });
  };

  const selectStation = (s: StationProfile) => {
    setForm({ ...form, station: s.name, price: s.lastPrice.toString(), type: s.lastFuelType });
  };

  return (
    <div className="space-y-6 pb-40">
      <header className="pt-3 px-1">
        <p className="text-[10px] font-black uppercase text-blue-500 tracking-widest leading-none mb-1 opacity-70">Nível de</p>
        <h1 className="text-2xl font-black italic text-white tracking-tighter">Combustível</h1>
      </header>

      {/* VIVID FUEL STATUS CARD */}
      <div className="bento-card p-6 border-b-4 border-blue-600/20 bg-slate-900/40 relative overflow-hidden shadow-2xl">
        <div className="flex justify-between items-center relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-blue-600/10 rounded-2xl flex items-center justify-center text-blue-500 border border-blue-500/20 shadow-inner"><Fuel size={34} /></div>
            <div>
               <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Status no Tanque</p>
               <p className="text-4xl font-black italic text-white tracking-tighter leading-none">{tankPercent}%</p>
            </div>
          </div>
          <div className="text-right">
             <p className="text-[11px] font-black text-emerald-400 uppercase leading-none">{user.calculatedAvgConsumption.toFixed(1)} km/L</p>
             <p className="text-[8px] font-bold text-slate-600 uppercase mt-1 tracking-tighter">CONSUMO REAL</p>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-2 bg-slate-950">
           <div className="h-full bg-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.8)] transition-all duration-1000" style={{width: `${tankPercent}%`}} />
        </div>
      </div>

      <button onClick={() => setShowAdd(true)} className="bento-card w-full p-6 flex items-center justify-between border-l-4 border-l-blue-600 bg-blue-600/5 active:scale-95 transition-all shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg"><Plus size={26} /></div>
          <div className="text-left">
            <h3 className="text-lg font-black text-white uppercase italic leading-none">Novo Abastecimento</h3>
            <p className="text-[9px] font-bold text-slate-500 uppercase mt-1">Registrar reabastecimento</p>
          </div>
        </div>
        <ChevronRight size={20} className="text-slate-700" />
      </button>

      {/* QUICK SELECTION PROFILES */}
      {user.stationProfiles.length > 0 && (
        <div className="space-y-3 px-1 animate-up">
          <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Postos Frequentes</p>
          <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide snap-x">
            {user.stationProfiles.map(s => (
              <button 
                key={s.id} 
                onClick={() => { selectStation(s); setShowAdd(true); }} 
                className="flex-shrink-0 snap-start bento-card p-4 min-w-[150px] bg-slate-900 border-white/5 text-left active:scale-95 transition-all shadow-md"
              >
                <div className="flex items-center gap-2 mb-2">
                   <MapPin size={12} className="text-blue-500" />
                   <p className="text-[10px] font-black text-white uppercase italic truncate leading-none">{s.name}</p>
                </div>
                <div className="flex justify-between items-end">
                   <p className="text-sm font-black text-white leading-none">R$ {s.lastPrice}</p>
                   <p className="text-[8px] font-bold text-slate-600 uppercase leading-none">{s.lastFuelType}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* RE-FUELING HISTORY */}
      <div className="space-y-3 px-1">
         <div className="flex items-center gap-2">
            <History size={16} className="text-slate-600" />
            <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Histórico de Reabastecimento</p>
         </div>
         <div className="space-y-2">
           {refuels.length === 0 ? (
             <div className="p-12 bento-card border-dashed border-slate-800 text-center text-slate-700 font-black uppercase text-[10px] italic">Sem registros de postos</div>
           ) : (
             [...refuels].reverse().map(r => (
               <div key={r.id} className="bento-card p-4 flex justify-between items-center bg-slate-900/40 border-white/5">
                  <div className="flex items-center gap-3">
                     <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${r.fuelType === 'GASOLINA' ? 'bg-orange-500/10 text-orange-500' : 'bg-emerald-500/10 text-emerald-500'}`}><Fuel size={18}/></div>
                     <div className="min-w-0">
                        <p className="text-xs font-black text-white uppercase italic truncate max-w-[140px] leading-none mb-1">{r.stationName}</p>
                        <p className="text-[8px] font-bold text-slate-600 uppercase tracking-widest">{new Date(r.date).toLocaleDateString()}</p>
                     </div>
                  </div>
                  <div className="text-right">
                     <p className="text-sm font-black text-white italic leading-none">R$ {r.amountMoney.toFixed(2)}</p>
                     <p className="text-[8px] font-bold text-blue-500 uppercase mt-1 tracking-tighter">{r.liters.toFixed(1)} L</p>
                  </div>
               </div>
             ))
           )}
         </div>
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-slate-950/98 backdrop-blur-2xl z-[200] flex items-center justify-center p-6 overflow-y-auto">
          <div className="w-full max-w-sm p-8 bg-slate-900 border border-white/10 rounded-[2.5rem] shadow-2xl space-y-5 animate-up">
            <h2 className="text-2xl font-black text-white uppercase italic text-center tracking-tighter leading-none mb-2">Dados do Posto</h2>
            <div className="space-y-4">
              <input className="w-full !bg-slate-950 font-black border-slate-800 text-center" placeholder="Nome do Posto" value={form.station} onChange={e => setForm({...form, station: e.target.value})} />
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => setForm({...form, type: 'GASOLINA'})} className={`py-4 rounded-xl font-black text-[10px] uppercase border transition-all ${form.type === 'GASOLINA' ? 'bg-orange-500 border-orange-400 text-white shadow-lg' : 'bg-slate-950 border-white/5 text-slate-600'}`}>Gasolina</button>
                <button onClick={() => setForm({...form, type: 'ETANOL'})} className={`py-4 rounded-xl font-black text-[10px] uppercase border transition-all ${form.type === 'ETANOL' ? 'bg-emerald-600 border-emerald-400 text-white shadow-lg' : 'bg-slate-950 border-white/5 text-slate-600'}`}>Álcool/Etanol</button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                 <div>
                    <label className="text-[8px] font-black text-slate-500 uppercase ml-1 mb-1 block">Preço/L</label>
                    <input type="number" step="0.001" className="w-full text-center font-black !bg-slate-950 border-slate-800" placeholder="5.89" value={form.price} onChange={e => setForm({...form, price: e.target.value})} />
                 </div>
                 <div>
                    <label className="text-[8px] font-black text-slate-500 uppercase ml-1 mb-1 block">Valor Gasto (R$)</label>
                    <input type="number" step="0.01" className="w-full text-center font-black !bg-slate-900 border-slate-800" placeholder="150.00" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} />
                 </div>
              </div>
              <button onClick={handleSave} className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black text-lg uppercase italic shadow-2xl active:scale-95 border-b-4 border-blue-800 transition-all mt-4">Confirmar Abastecimento</button>
            </div>
            <button onClick={() => setShowAdd(false)} className="w-full text-slate-600 font-black uppercase text-[10px] tracking-widest text-center mt-2">Voltar</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Postos;
