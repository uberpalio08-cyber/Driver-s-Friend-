
import React, { useState } from 'react';
import { UserProfile, GasStation, RefuelEntry, FuelType } from '../types';
import { Plus, Fuel, MapPin, Droplets, Gauge, ChevronRight, History, RefreshCw, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface Props {
  user: UserProfile;
  stations: GasStation[];
  refuels: RefuelEntry[];
  onAddStation: (name: string) => GasStation;
  onRefuel: (entry: RefuelEntry) => void;
}

const Postos: React.FC<Props> = ({ user, stations, refuels, onAddStation, onRefuel }) => {
  const [showAddStation, setShowAddStation] = useState(false);
  const [showRefuel, setShowRefuel] = useState(false);
  const [stationName, setStationName] = useState('');
  
  const [refuelData, setRefuelData] = useState({
    stationId: '',
    fuelType: 'GASOLINA' as FuelType,
    pricePerLiter: '',
    liters: '',
    amountPaid: '',
    isFullTank: false,
    odometerAtRefuel: user.lastOdometer.toString()
  });

  const openRefuelWithStation = (station: GasStation) => {
    const defaultPrice = refuelData.fuelType === 'GASOLINA' 
      ? (station.lastGasPrice?.toString() || '') 
      : (station.lastEtanolPrice?.toString() || '');
      
    setRefuelData({
      ...refuelData,
      stationId: station.id,
      pricePerLiter: defaultPrice,
      liters: '',
      amountPaid: '',
      isFullTank: false,
      odometerAtRefuel: user.lastOdometer.toString()
    });
    setShowRefuel(true);
  };

  const handlePriceChange = (val: string) => {
    const price = parseFloat(val);
    let newLiters = refuelData.liters;
    if (!isNaN(price) && price > 0 && refuelData.amountPaid) {
      newLiters = (parseFloat(refuelData.amountPaid) / price).toFixed(2);
    }
    setRefuelData({ ...refuelData, pricePerLiter: val, liters: newLiters });
  };

  const handleAmountPaidChange = (val: string) => {
    const amount = parseFloat(val);
    const price = parseFloat(refuelData.pricePerLiter);
    let newLiters = refuelData.liters;
    if (!isNaN(amount) && !isNaN(price) && price > 0) {
      newLiters = (amount / price).toFixed(2);
    }
    setRefuelData({ ...refuelData, amountPaid: val, liters: newLiters });
  };

  const handleRefuelSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const litersValue = parseFloat(refuelData.liters);
    if (refuelData.stationId && (litersValue > 0 || refuelData.isFullTank)) {
      onRefuel({
        id: Date.now().toString(),
        date: Date.now(),
        stationId: refuelData.stationId,
        fuelType: refuelData.fuelType,
        pricePerLiter: parseFloat(refuelData.pricePerLiter) || 0,
        liters: litersValue || 0,
        isFullTank: refuelData.isFullTank,
        odometerAtRefuel: parseFloat(refuelData.odometerAtRefuel) || user.lastOdometer
      });
      setShowRefuel(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <header className="flex justify-between items-center py-4">
        <div>
          <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">Controle de Combustível</p>
          <h1 className="text-2xl font-black text-black">Postos</h1>
        </div>
        <div className="bg-black text-white px-5 py-2 rounded-2xl text-[10px] font-black flex items-center gap-2 border border-zinc-800 uppercase tracking-widest">
          <Droplets size={14} /> {user.currentFuelLevel.toFixed(1)}L
        </div>
      </header>

      {/* Status B&W */}
      <div className="bg-black p-8 rounded-[2.5rem] text-white shadow-2xl space-y-5 border border-zinc-800">
        <div className="flex justify-between items-end">
          <div className="space-y-1">
            <p className="text-zinc-500 text-[9px] font-black uppercase tracking-widest">Média Real</p>
            <p className="text-3xl font-black italic">{user.calculatedAvgConsumption.toFixed(1)} km/l</p>
          </div>
          <div className="text-right">
            <p className="text-zinc-500 text-[9px] font-black uppercase tracking-widest">Tanque</p>
            <p className="text-xl font-black">{Math.round((user.currentFuelLevel / user.car.tankCapacity) * 100)}%</p>
          </div>
        </div>
        <div className="h-3 bg-zinc-900 rounded-full overflow-hidden border border-white/5 p-[2px]">
           <div className="h-full bg-white rounded-full transition-all duration-1000" style={{ width: `${(user.currentFuelLevel / user.car.tankCapacity) * 100}%` }} />
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <h3 className="text-lg font-black text-black">Rede de Postos</h3>
          <button onClick={() => setShowAddStation(true)} className="text-[10px] font-black uppercase text-zinc-400 hover:text-black transition-colors tracking-widest">Novo Posto</button>
        </div>

        <div className="grid gap-3">
          {stations.map(s => (
            <button key={s.id} onClick={() => openRefuelWithStation(s)} className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-zinc-100 flex items-center justify-between group active:scale-95 transition-all">
              <div className="flex items-center gap-5">
                <div className="bg-zinc-50 p-4 rounded-2xl text-black group-hover:bg-black group-hover:text-white transition-all"><MapPin size={24} /></div>
                <div className="text-left">
                  <p className="font-black text-black uppercase text-sm tracking-tight">{s.name}</p>
                  <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Último G: {s.lastGasPrice ? `R$${s.lastGasPrice.toFixed(2)}` : '--'}</p>
                </div>
              </div>
              <ChevronRight size={20} className="text-zinc-200" />
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4 pt-4">
        <h3 className="text-sm font-black text-black uppercase tracking-widest flex items-center gap-2 px-1"><History size={16} /> Histórico</h3>
        <div className="space-y-2">
          {refuels.slice(-3).reverse().map(r => {
            const station = stations.find(s => s.id === r.stationId);
            return (
              <div key={r.id} className="bg-zinc-50 p-5 rounded-3xl border border-zinc-100 flex justify-between items-center">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-black uppercase">{station?.name || 'Posto'}</p>
                  <p className="text-[9px] text-zinc-400 font-bold uppercase">{r.liters.toFixed(1)}L • {r.fuelType}</p>
                </div>
                <div className="text-right">
                  <p className="text-md font-black text-black">R$ {(r.liters * r.pricePerLiter).toFixed(2)}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {showRefuel && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-[100] flex items-center justify-center p-8">
          <div className="bg-white w-full rounded-[3rem] p-10 space-y-8 animate-in slide-in-from-bottom duration-300">
            <h2 className="text-2xl font-black text-black text-center uppercase tracking-tighter">Abastecer</h2>
            <form onSubmit={handleRefuelSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-3">
                <button type="button" onClick={() => setRefuelData({...refuelData, fuelType: 'GASOLINA'})} className={`py-4 rounded-2xl border-2 font-black uppercase text-[10px] tracking-widest transition-all ${refuelData.fuelType === 'GASOLINA' ? 'bg-black border-black text-white' : 'bg-zinc-50 border-zinc-100 text-zinc-400'}`}>Gasolina</button>
                <button type="button" onClick={() => setRefuelData({...refuelData, fuelType: 'ETANOL'})} className={`py-4 rounded-2xl border-2 font-black uppercase text-[10px] tracking-widest transition-all ${refuelData.fuelType === 'ETANOL' ? 'bg-black border-black text-white' : 'bg-zinc-50 border-zinc-100 text-zinc-400'}`}>Etanol</button>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Preço /L (R$)</label>
                <input required type="number" step="0.001" className="w-full bg-zinc-50 border-2 border-zinc-100 rounded-2xl px-6 py-4 font-black text-black outline-none" value={refuelData.pricePerLiter} onChange={e => handlePriceChange(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Valor Total Pago</label>
                <input required type="number" step="0.01" className="w-full bg-zinc-50 border-2 border-zinc-100 rounded-2xl px-6 py-4 font-black text-black outline-none" placeholder="0.00" value={refuelData.amountPaid} onChange={e => handleAmountPaidChange(e.target.value)} />
              </div>
              <button 
                type="button" 
                onClick={() => setRefuelData({...refuelData, isFullTank: !refuelData.isFullTank})}
                className={`w-full py-5 rounded-[2rem] border-2 font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-3 transition-all ${refuelData.isFullTank ? 'bg-black border-black text-white' : 'bg-zinc-50 border-zinc-100 text-zinc-400'}`}
              >
                {refuelData.isFullTank ? 'TANQUE CHEIO ✓' : 'ABASTECIMENTO PARCIAL'}
              </button>
              <button type="submit" className="w-full bg-black text-white py-6 rounded-[2rem] font-black uppercase tracking-widest shadow-2xl active:scale-95 transition-all">Registrar</button>
              <button type="button" onClick={() => setShowRefuel(false)} className="w-full text-zinc-400 text-[10px] font-black uppercase tracking-widest">Cancelar</button>
            </form>
          </div>
        </div>
      )}

      {showAddStation && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-[100] flex items-center justify-center p-8">
          <div className="bg-white w-full rounded-[3rem] p-10 space-y-6">
            <h2 className="text-2xl font-black text-black uppercase tracking-tighter">Novo Posto</h2>
            <input autoFocus className="w-full bg-zinc-50 border-2 border-zinc-100 rounded-2xl px-6 py-5 font-black text-black outline-none" placeholder="Nome do Posto" value={stationName} onChange={e => setStationName(e.target.value)} />
            <div className="flex flex-col gap-3">
              <button onClick={() => { if(stationName) { onAddStation(stationName); setShowAddStation(false); setStationName(''); } }} className="w-full bg-black text-white py-5 rounded-[2rem] font-black uppercase tracking-widest">Cadastrar</button>
              <button onClick={() => setShowAddStation(false)} className="w-full text-zinc-400 text-[10px] font-black uppercase tracking-widest">Voltar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Postos;
