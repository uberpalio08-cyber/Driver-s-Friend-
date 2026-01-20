
import React, { useState } from 'react';
import { UserProfile } from '../types';
import { User, Car, ArrowRight, Loader2, Target } from 'lucide-react';

interface Props {
  onComplete: (profile: UserProfile) => void;
}

const Onboarding: React.FC<Props> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  
  const [carData, setCarData] = useState({
    brand: '',
    model: '',
    year: '',
    power: '',
    tankCapacity: '',
    initialOdometer: '',
    appPercentage: '25',
    appName: 'Uber',
    maintenanceReserve: '5',
    emergencyReserve: '3',
    dailyGoal: '150',
    monthlyGoal: '3000'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) {
      if (name.trim()) setStep(2);
      return;
    }
    if (step === 2) {
      setStep(3);
      return;
    }

    setLoading(true);

    const profile: UserProfile = {
      name: name.trim(),
      appName: carData.appName || 'Uber',
      appPercentage: parseFloat(carData.appPercentage) || 25,
      maintenanceReservePercent: parseFloat(carData.maintenanceReserve) || 5,
      emergencyReservePercent: parseFloat(carData.emergencyReserve) || 3,
      dailyGoal: parseFloat(carData.dailyGoal) || 150,
      monthlyGoal: parseFloat(carData.monthlyGoal) || 3000,
      currentFuelLevel: 0, 
      lastOdometer: parseFloat(carData.initialOdometer) || 0,
      calculatedAvgConsumption: 10, 
      car: {
        brand: carData.brand,
        model: carData.model,
        year: carData.year,
        power: carData.power,
        tankCapacity: parseFloat(carData.tankCapacity) || 50
      }
    };

    setTimeout(() => {
      onComplete(profile);
      setLoading(false);
    }, 800);
  };

  const inputClass = "w-full bg-zinc-50 border-2 border-zinc-100 rounded-2xl px-5 py-4 focus:outline-none focus:border-black transition-all placeholder:text-zinc-300 text-black font-bold";
  const labelClass = "text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1 mb-2 block";

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center space-y-2">
          <div className="w-20 h-20 bg-black rounded-3xl mx-auto flex items-center justify-center shadow-2xl shadow-zinc-200 animate-float">
            {step === 1 ? <User className="text-white" size={40} /> : step === 2 ? <Car className="text-white" size={40} /> : <Target className="text-white" size={40} />}
          </div>
          <h1 className="text-3xl font-black text-black tracking-tight uppercase">
            {step === 1 ? 'Identificação' : step === 2 ? 'Veículo' : 'Sua Meta'}
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {step === 1 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <label className={labelClass}>Como devemos te chamar?</label>
              <input autoFocus required className={inputClass} placeholder="Seu nome" value={name} onChange={e => setName(e.target.value)} />
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="grid grid-cols-2 gap-3">
                <input required className={inputClass} placeholder="Marca" value={carData.brand} onChange={e => setCarData({...carData, brand: e.target.value})} />
                <input required className={inputClass} placeholder="Modelo" value={carData.model} onChange={e => setCarData({...carData, model: e.target.value})} />
              </div>
              <input required type="number" className={inputClass} placeholder="KM Atual" value={carData.initialOdometer} onChange={e => setCarData({...carData, initialOdometer: e.target.value})} />
              <div className="grid grid-cols-2 gap-3">
                <input required type="number" className={inputClass} placeholder="Tanque (L)" value={carData.tankCapacity} onChange={e => setCarData({...carData, tankCapacity: e.target.value})} />
                <input required className={inputClass} placeholder="Aplicativo" value={carData.appName} onChange={e => setCarData({...carData, appName: e.target.value})} />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Meta Diária R$</label>
                  <input required type="number" className={inputClass} value={carData.dailyGoal} onChange={e => setCarData({...carData, dailyGoal: e.target.value})} />
                </div>
                <div>
                  <label className={labelClass}>Meta Mensal R$</label>
                  <input required type="number" className={inputClass} value={carData.monthlyGoal} onChange={e => setCarData({...carData, monthlyGoal: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Manut (%)</label>
                  <input required type="number" className={inputClass} value={carData.maintenanceReserve} onChange={e => setCarData({...carData, maintenanceReserve: e.target.value})} />
                </div>
                <div>
                  <label className={labelClass}>Taxa App (%)</label>
                  <input required type="number" className={inputClass} value={carData.appPercentage} onChange={e => setCarData({...carData, appPercentage: e.target.value})} />
                </div>
              </div>
            </div>
          )}

          <button disabled={loading} type="submit" className="w-full bg-black text-white font-black py-5 rounded-2xl shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 uppercase">
            {loading ? <Loader2 className="animate-spin" /> : <> {step < 3 ? 'Próximo' : 'Finalizar'} <ArrowRight size={20} /> </>}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Onboarding;
