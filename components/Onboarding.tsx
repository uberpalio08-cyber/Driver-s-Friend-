
import React, { useState } from 'react';
import { UserProfile } from '../types';
import { User, Car, Target, ArrowRight, Loader2, Sparkles } from 'lucide-react';
import { GeminiService } from '../services/geminiService';

interface Props {
  onComplete: (u: UserProfile) => void;
}

const Onboarding: React.FC<Props> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({
    name: '', brand: '', model: '', year: '', power: '1.0', tank: '',
    salary: '', costs: '', days: '22'
  });

  const handleFetchSpecs = async () => {
    if (!data.brand || !data.model) return alert("Preencha marca e modelo.");
    setLoading(true);
    const specs = await GeminiService.getCarSpecs(data.brand, data.model, data.year);
    if (specs) {
      setData(p => ({ ...p, tank: specs.tankLiters.toString() }));
    } else {
      alert("Não conseguimos consultar. Por favor, insira manualmente.");
    }
    setLoading(false);
  };

  const calculateDailyGoal = () => {
    const s = parseFloat(data.salary) || 0;
    const c = parseFloat(data.costs) || 0;
    const d = parseFloat(data.days) || 1;
    // Cálculo de meta bruta considerando margem de impostos e apps (est. 45% de custos totais)
    return Math.round(((s + c) / d) / 0.55);
  };

  const finish = () => {
    if (!data.name || !data.brand || !data.salary) return alert("Preencha todos os campos fundamentais.");
    
    onComplete({
      name: data.name, 
      currentFuelLevel: 0,
      lastOdometer: 0,
      calculatedAvgConsumption: 10,
      car: { 
        brand: data.brand, 
        model: data.model, 
        year: data.year, 
        power: data.power, 
        tankCapacity: parseFloat(data.tank) || 50 
      },
      desiredSalary: parseFloat(data.salary) || 0, 
      personalFixedCosts: parseFloat(data.costs) || 0, 
      workingDaysPerMonth: parseInt(data.days) || 22,
      dailyGoal: calculateDailyGoal(), 
      appProfiles: [], 
      selectedAppProfileId: '', 
      stationProfiles: []
    });
  };

  const inputClass = "w-full bg-slate-900 border-2 border-slate-800 text-white placeholder-slate-600 rounded-2xl px-5 py-5 focus:ring-2 focus:ring-blue-600 outline-none transition-all font-bold text-lg";

  return (
    <div className="min-h-screen flex items-center justify-center py-10 animate-up bg-[#020617]">
      <div className="w-full max-w-sm px-6 space-y-8 text-white">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 bg-blue-600 rounded-[2rem] mx-auto flex items-center justify-center shadow-2xl">
            {step === 1 ? <User size={40} /> : step === 2 ? <Car size={40} /> : <Target size={40} />}
          </div>
          <h1 className="text-3xl font-black italic uppercase tracking-tighter leading-none">
            {step === 1 ? 'Seu Perfil' : step === 2 ? 'Seu Veículo' : 'Sua Meta'}
          </h1>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Passo {step} de 3</p>
        </div>

        <div className="space-y-6">
          {step === 1 && (
            <div className="animate-up">
              <input className={inputClass} value={data.name} onChange={e => setData({...data, name: e.target.value})} placeholder="Como devemos te chamar?" />
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 animate-up">
              <div className="grid grid-cols-2 gap-3">
                <input className={inputClass} value={data.brand} onChange={e => setData({...data, brand: e.target.value})} placeholder="Marca" />
                <input className={inputClass} value={data.model} onChange={e => setData({...data, model: e.target.value})} placeholder="Modelo" />
              </div>
              <input className={inputClass} value={data.year} onChange={e => setData({...data, year: e.target.value})} placeholder="Ano" />
              <div className="relative">
                <input className={inputClass} type="number" value={data.tank} onChange={e => setData({...data, tank: e.target.value})} placeholder="Tanque (Litros)" />
                <button onClick={handleFetchSpecs} disabled={loading} className="absolute right-3 top-1/2 -translate-y-1/2 bg-blue-600 p-3 rounded-xl active:scale-90 transition-all">
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 animate-up">
              <div className="grid grid-cols-2 gap-3">
                 <div className="space-y-1">
                    <p className="text-[8px] font-black text-slate-500 uppercase ml-2">Salário Alvo</p>
                    <input className={inputClass} type="number" value={data.salary} onChange={e => setData({...data, salary: e.target.value})} placeholder="Ex: 5000" />
                 </div>
                 <div className="space-y-1">
                    <p className="text-[8px] font-black text-slate-500 uppercase ml-2">Custos Fixos</p>
                    <input className={inputClass} type="number" value={data.costs} onChange={e => setData({...data, costs: e.target.value})} placeholder="Ex: 1500" />
                 </div>
              </div>
              <div className="space-y-1">
                 <p className="text-[8px] font-black text-slate-500 uppercase ml-2">Dias de Trabalho por Mês</p>
                 <input className={inputClass} type="number" value={data.days} onChange={e => setData({...data, days: e.target.value})} placeholder="Ex: 22" />
              </div>
              <div className="bg-blue-600/10 border-2 border-blue-500/20 p-6 rounded-[2.5rem] text-center shadow-xl">
                 <p className="text-[10px] font-black text-blue-500 uppercase mb-2 tracking-widest">Sua Meta Bruta é de:</p>
                 <p className="text-4xl font-black italic">R$ {calculateDailyGoal()} <span className="text-xs">/ DIA</span></p>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            {step > 1 && (
              <button onClick={() => setStep(step - 1)} className="flex-1 bg-slate-900 text-white font-black py-6 rounded-[2rem] border border-white/5 uppercase italic">Voltar</button>
            )}
            <button onClick={() => step < 3 ? setStep(step + 1) : finish()} className="flex-[2] bg-blue-600 text-white font-black py-6 rounded-[2rem] flex items-center justify-center gap-4 shadow-2xl active:scale-95 transition-all uppercase italic text-lg border-b-4 border-blue-800">
              {step < 3 ? 'Próximo' : 'Concluir'} <ArrowRight size={24} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
export default Onboarding;
