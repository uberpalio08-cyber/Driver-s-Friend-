import React, { useState } from 'react';
import { UserProfile } from '../types';
import { User, Car, ArrowRight, Loader2, Coins, Target } from 'lucide-react';

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
    tankCapacity: '50',
    initialOdometer: '',
    appPercentage: '25',
    appName: 'Uber',
    maintenanceReserve: '5',
    emergencyReserve: '3',
    desiredSalary: '3000',
    personalFixedCosts: '1000',
    workingDays: '22'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (step < 3) {
      setStep(step + 1);
      return;
    }
    setLoading(true);
    const salary = parseFloat(carData.desiredSalary) || 3000;
    const fixed = parseFloat(carData.personalFixedCosts) || 1000;
    const days = parseFloat(carData.workingDays) || 22;
    const suggestedDaily = ((salary + fixed) / days) * 1.5;

    const profile: UserProfile = {
      name: name.trim(),
      appName: carData.appName || 'Uber',
      appPercentage: parseFloat(carData.appPercentage) || 25,
      maintenanceReservePercent: parseFloat(carData.maintenanceReserve) || 5,
      emergencyReservePercent: parseFloat(carData.emergencyReserve) || 3,
      desiredSalary: salary,
      personalFixedCosts: fixed,
      workingDaysPerMonth: days,
      dailyGoal: Math.ceil(suggestedDaily / 10) * 10,
      currentFuelLevel: 0, 
      lastOdometer: parseFloat(carData.initialOdometer) || 0,
      calculatedAvgConsumption: 10, 
      car: {
        brand: carData.brand,
        model: carData.model,
        year: carData.year,
        power: '1.0',
        tankCapacity: parseFloat(carData.tankCapacity) || 50
      }
    };

    setTimeout(() => {
      onComplete(profile);
      setLoading(false);
    }, 800);
  };

  const inputClass = "w-full bg-zinc-100 border-2 border-zinc-200 rounded-2xl px-5 py-4 focus:outline-none focus:border-black transition-all placeholder:text-zinc-400 text-black font-bold text-lg";
  const labelClass = "text-[11px] font-black text-zinc-600 uppercase tracking-widest ml-1 mb-2 block";

  return (
    <div className="min-h-screen bg-transparent flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-sm space-y-8 bg-white/80 backdrop-blur-md p-8 rounded-[3rem] shadow-2xl border border-white">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-black rounded-2xl mx-auto flex items-center justify-center shadow-xl animate-float">
            {step === 1 ? <User className="text-white" size={32} /> : step === 2 ? <Car className="text-white" size={32} /> : <Target className="text-white" size={32} />}
          </div>
          <h1 className="text-2xl font-black text-black tracking-tight uppercase">
            {step === 1 ? 'Bem-vindo' : step === 2 ? 'Seu Carro' : 'Seus Objetivos'}
          </h1>
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Passo {step} de 3</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {step === 1 && (
            <div className="animate-in slide-in-from-right duration-300 space-y-4">
              <div>
                <label className={labelClass}>Como devemos te chamar?</label>
                <input autoFocus required className={inputClass} placeholder="Digite seu nome" value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>Nome do App que trabalha</label>
                <input required className={inputClass} placeholder="Ex: Uber, 99" value={carData.appName} onChange={e => setCarData({...carData, appName: e.target.value})} />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 animate-in slide-in-from-right duration-300">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Marca</label>
                  <input required className={inputClass} placeholder="Ex: Fiat" value={carData.brand} onChange={e => setCarData({...carData, brand: e.target.value})} />
                </div>
                <div>
                  <label className={labelClass}>Modelo</label>
                  <input required className={inputClass} placeholder="Ex: Palio" value={carData.model} onChange={e => setCarData({...carData, model: e.target.value})} />
                </div>
              </div>
              <div>
                <label className={labelClass}>Kilometragem Atual</label>
                <input required type="number" className={inputClass} placeholder="Ex: 85000" value={carData.initialOdometer} onChange={e => setCarData({...carData, initialOdometer: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Capac. Tanque</label>
                  <input required type="number" className={inputClass} placeholder="Litros" value={carData.tankCapacity} onChange={e => setCarData({...carData, tankCapacity: e.target.value})} />
                </div>
                <div>
                  <label className={labelClass}>Taxa do App %</label>
                  <input required type="number" className={inputClass} placeholder="Ex: 25" value={carData.appPercentage} onChange={e => setCarData({...carData, appPercentage: e.target.value})} />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 animate-in slide-in-from-right duration-300">
              <div>
                <label className={labelClass}>Quanto quer ganhar (Limpo)?</label>
                <input required type="number" className={inputClass} placeholder="Ex: 3000" value={carData.desiredSalary} onChange={e => setCarData({...carData, desiredSalary: e.target.value})} />
              </div>
              <div>
                <label className={labelClass}>Custos Pessoais (Casa, etc)</label>
                <input required type="number" className={inputClass} placeholder="Ex: 1200" value={carData.personalFixedCosts} onChange={e => setCarData({...carData, personalFixedCosts: e.target.value})} />
              </div>
              <div>
                <label className={labelClass}>Dias de Trabalho por Mês</label>
                <input required type="number" className={inputClass} placeholder="Ex: 22" value={carData.workingDays} onChange={e => setCarData({...carData, workingDays: e.target.value})} />
              </div>
            </div>
          )}

          <button disabled={loading} type="submit" className="w-full bg-black text-white font-black py-5 rounded-2xl shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 uppercase tracking-widest mt-6">
            {loading ? <Loader2 className="animate-spin" /> : <> {step < 3 ? 'Continuar' : 'Calcular Minha Meta'} <ArrowRight size={20} /> </>}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Onboarding;