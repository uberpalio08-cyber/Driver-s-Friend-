
import React, { useState } from 'react';
import { UserProfile, RefuelEntry, FuelType, StationProfile } from '../types';
import { Fuel as FuelIcon, MapPin, Droplets, CheckCircle2, TrendingUp, ChevronRight } from 'lucide-react';

interface Props {
  user: UserProfile;
  onRefuel: (entry: RefuelEntry) => void;
  refuels: RefuelEntry[];
  onUpdateUser: (u: UserProfile) => void;
}

const Postos: React.FC<Props> = ({ user, onRefuel, refuels = [], onUpdateUser }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [formStep, setFormStep] = useState(1);
  const [form, setForm] = useState({ 
    station: '', type: 'GASOLINA' as FuelType, price: '', amount: '', km: '', isFull: false 
  });

  const tankPercent = Math.min(100, Math.round((user.currentFuelLevel / (user.car?.tankCapacity || 50)) * 100));

  const handleCardClick = (s: StationProfile) => {
    setForm({
      station: s.name,
      type: s.lastFuelType,
      price: s.lastPrice.toString(),
      amount: '',
      km: '',
      isFull: false
    });
    setFormStep(1); // Abre no passo 1 para escolher o combustível conforme solicitado
    setShowAdd(true);
  };

  const handleSave = (isFull: boolean) => {
    const p = parseFloat(form.price);
    const amountMoney = parseFloat(form.amount);
    const k = parseFloat(form.km) || user.lastOdometer;
    const stationName = form.station || 'Posto Desconhecido';
    
    if (!p || !amountMoney) return alert("Informe o preço por litro e o valor pago.");

    const litersAdded = amountMoney / p;

    const entry: RefuelEntry = {
      id: Date.now().toString(),
      date: Date.now(),
      stationName: stationName,
      fuelType: form.type,
      pricePerLiter: p,
      amountMoney: amountMoney,
      liters: litersAdded,
      odometerAtRefuel: k,
      isFullTank: isFull
    };

    let newAvg = user.calculatedAvgConsumption;

    if (isFull) {
      const lastFull = refuels.find(r => r.isFullTank);
      if (lastFull) {
        const kmDiff = k - lastFull.odometerAtRefuel;
        if (kmDiff > 0) {
          newAvg = parseFloat((kmDiff / litersAdded).toFixed(2));
        }
      }
    }

    const exists = user.stationProfiles.find(s => s.name.toLowerCase() === stationName.toLowerCase());
    let newProfiles = [...user.stationProfiles];
    if (!exists) {
      newProfiles.push({ id: Date.now().toString(), name: stationName, lastPrice: p, lastFuelType: entry.fuelType });
    } else {
      newProfiles = newProfiles.map(s => s.name === stationName ? { ...s, lastPrice: p, lastFuelType: entry.fuelType } : s);
    }

    onUpdateUser({ 
      ...user, 
      calculatedAvgConsumption: newAvg,
      stationProfiles: newProfiles.slice(-5) 
    });
    
    onRefuel(entry);
    setShowAdd(false);
    setFormStep(1);
    setForm({ station: '', type: 'GASOLINA', price: '', amount: '', km: '', isFull: false });
  };

  const selectFuelType = (type: FuelType) => {
    const profile = user.stationProfiles.find(s => s.name.toLowerCase() === form.station.toLowerCase());
    let price = form.price;
    
    // Se o combustível selecionado for o mesmo do perfil salvo, mantém o preço. Caso contrário, limpa para nova entrada.
    if (profile && profile.lastFuelType !== type) {
      price = '';
    } else if (profile && profile.lastFuelType === type) {
      price = profile.lastPrice.toString();
    }

    setForm({ ...form, type, price });
  };

  return (
    <div className="space-y-6 pb-40 animate-up">
      <header className="pt-6 px-2 flex justify-between items-end">
        <div>
          <p className="text-[10px] font-black uppercase text-blue-500 tracking-widest mb-1">GESTÃO DE</p>
          <h1 className="text-2xl font-black italic text-white tracking-tighter leading-none">Abastecimento</h1>
        </div>
        <div className="bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-2xl text-right">
           <div className="flex items-center gap-1 justify-end">
             <TrendingUp size={10} className="text-emerald-500" />
             <p className="text-[8px] font-black text-emerald-500 uppercase tracking-widest leading-none">Consumo</p>
           </div>
           <p className="text-sm font-black text-white italic">{user.calculatedAvgConsumption} KM/L</p>
        </div>
      </header>

      {/* TANQUE INDICATOR */}
      <div className="bg-slate-900 p-8 rounded-[2.5rem] border border-white/5 shadow-2xl overflow-hidden">
        <div className="flex justify-between items-center mb-6">
          <div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Nível do Tanque</p>
            <div className="flex items-baseline gap-2">
              <span className={`text-6xl font-black italic ${tankPercent < 20 ? 'text-rose-500' : 'text-white'}`}>{tankPercent}%</span>
              <span className="text-xs font-bold text-blue-500 uppercase">{user.currentFuelLevel.toFixed(1)}L / {user.car.tankCapacity}L</span>
            </div>
          </div>
          <div className={`p-5 rounded-2xl ${tankPercent < 20 ? 'bg-rose-500/20 text-rose-500 animate-pulse' : 'bg-blue-600/10 text-blue-500'} border border-white/5`}>
            <FuelIcon size={40} />
          </div>
        </div>
        <div className="h-4 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-white/5">
           <div 
            className={`h-full rounded-full transition-all duration-1000 ${tankPercent < 20 ? 'bg-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.5)]' : 'bg-blue-600'}`} 
            style={{width: `${tankPercent}%`}} 
           />
        </div>
        <button onClick={() => setShowAdd(true)} className="w-full mt-6 bg-blue-600 text-white py-5 rounded-2xl font-black uppercase italic shadow-xl active:scale-95 transition-all">Informar Abastecimento</button>
      </div>

      {/* RECENTES */}
      <div className="px-2 space-y-3">
        <h2 className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-4">Últimos Postos</h2>
        <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide px-1">
           {user.stationProfiles.length === 0 ? (
             <div className="w-full p-10 border-2 border-dashed border-slate-800 rounded-[2rem] text-center">
                <p className="text-[9px] font-black text-slate-700 uppercase tracking-widest">Nenhum posto cadastrado</p>
             </div>
           ) : (
             user.stationProfiles.map(s => (
               <button 
                key={s.id} 
                onClick={() => handleCardClick(s)}
                className="flex-shrink-0 bg-slate-900 border border-white/5 p-6 rounded-[2.5rem] min-w-[170px] text-left active:scale-95 shadow-xl transition-all"
               >
                  <div className="flex items-center gap-2 mb-3">
                     <div className="p-2 bg-blue-600/10 rounded-xl text-blue-500"><MapPin size={12} /></div>
                     <p className="text-[10px] font-black text-white uppercase italic truncate">{s.name}</p>
                  </div>
                  <p className="text-2xl font-black text-white leading-none">R$ {s.lastPrice.toFixed(2)}</p>
                  <p className="text-[8px] font-bold text-slate-600 uppercase mt-1">{s.lastFuelType}</p>
               </button>
             ))
           )}
        </div>
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-slate-950/98 z-[999] flex items-center justify-center p-6 animate-up overflow-y-auto">
          <div className="w-full max-w-sm p-8 bg-slate-900 border border-white/10 rounded-[3rem] space-y-6 shadow-2xl">
            <h2 className="text-xl font-black uppercase italic text-white text-center">Registrar Abastecimento</h2>
            
            {formStep === 1 ? (
              <div className="space-y-4 animate-up">
                <div>
                  <p className="text-[8px] font-black text-slate-500 uppercase mb-1 ml-4 tracking-widest italic">Nome do Posto</p>
                  <input className="w-full py-4 text-center font-black bg-slate-950 text-white rounded-2xl border border-slate-800" placeholder="Posto (Ex: Ipiranga)" value={form.station} onChange={e => setForm({...form, station: e.target.value})} />
                </div>
                
                <div className="flex gap-2">
                  <button onClick={() => selectFuelType('GASOLINA')} className={`flex-1 py-4 rounded-xl font-black text-[10px] uppercase transition-all ${form.type === 'GASOLINA' ? 'bg-orange-600 text-white shadow-lg' : 'bg-slate-950 text-slate-600 border border-white/5'}`}>Gasolina</button>
                  <button onClick={() => selectFuelType('ETANOL')} className={`flex-1 py-4 rounded-xl font-black text-[10px] uppercase transition-all ${form.type === 'ETANOL' ? 'bg-emerald-600 text-white shadow-lg' : 'bg-slate-950 text-slate-600 border border-white/5'}`}>Etanol</button>
                </div>

                <button onClick={() => setFormStep(2)} className="w-full bg-blue-600 text-white py-6 rounded-2xl font-black text-lg uppercase italic shadow-2xl flex items-center justify-center gap-2">Próximo <ChevronRight size={20} /></button>
              </div>
            ) : (
              <div className="space-y-6 animate-up">
                 <div className="space-y-4">
                    <div>
                      <p className="text-[8px] font-black text-slate-500 uppercase mb-1 ml-4 tracking-widest italic text-center">Preço por Litro (R$)</p>
                      <input type="number" step="0.001" autoFocus className="w-full py-5 text-4xl font-black text-center bg-slate-950 text-white rounded-2xl border-2 border-slate-800 focus:border-blue-500" placeholder="0,000" value={form.price} onChange={e => setForm({...form, price: e.target.value})} />
                    </div>

                    <div>
                      <p className="text-[8px] font-black text-slate-500 uppercase mb-1 ml-4 tracking-widest italic text-center">Valor Total Pago (R$)</p>
                      <input type="number" className="w-full py-5 text-4xl font-black text-center bg-slate-950 text-white rounded-2xl border-2 border-slate-800 focus:border-blue-500" placeholder="0,00" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} />
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-3 pt-2">
                    <button onClick={() => handleSave(true)} className="flex flex-col items-center justify-center gap-2 py-6 bg-emerald-600 text-white rounded-3xl border-b-4 border-emerald-900 shadow-xl active:scale-95 transition-all">
                       <CheckCircle2 size={24} />
                       <span className="text-[10px] font-black uppercase italic">Tanque Cheio</span>
                    </button>
                    <button onClick={() => handleSave(false)} className="flex flex-col items-center justify-center gap-2 py-6 bg-slate-950 text-white rounded-3xl border-2 border-slate-800 shadow-xl active:scale-95 transition-all">
                       <Droplets size={24} className="text-blue-500" />
                       <span className="text-[10px] font-black uppercase italic">Tanque Parcial</span>
                    </button>
                 </div>

                 <button onClick={() => setFormStep(1)} className="w-full text-slate-600 font-black uppercase text-[10px] text-center">Voltar</button>
              </div>
            )}
            <button onClick={() => setShowAdd(false)} className="w-full text-rose-500/40 font-black uppercase text-[9px] text-center tracking-widest">Cancelar</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Postos;
