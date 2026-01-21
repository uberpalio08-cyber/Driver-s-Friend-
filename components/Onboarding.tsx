
import React, { useState } from 'react';
import { UserProfile } from '../types';
import { User, Car, ArrowRight, Loader2, Target, Sparkles, Zap, DollarSign, Activity } from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";

interface Props {
  onComplete: (profile: UserProfile) => void;
  ai: GoogleGenAI;
}

const Onboarding: React.FC<Props> = ({ onComplete, ai }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [detecting, setDetecting] = useState(false);
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
    desiredSalary: '3000',
    personalFixedCosts: '1000',
    workingDays: '22',
    avgConsumption: '',
    useFixedFare: false,
    fixedFareValue: '15.00',
    suggestedGoal: '250'
  });

  const autoFillVehicleData = async () => {
    if (!carData.brand || !carData.model || !carData.year) {
      alert("Informe marca, modelo e ano.");
      return;
    }
    setDetecting(true);
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Retorne em JSON as especificações de um ${carData.brand} ${carData.model} ${carData.year} ${carData.power || ""}: 'tankCapacity' (number, em litros) e 'avgConsumption' (number, km/l urbano).`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              tankCapacity: { type: Type.NUMBER },
              avgConsumption: { type: Type.NUMBER }
            },
            required: ["tankCapacity", "avgConsumption"]
          }
        }
      });
      const result = JSON.parse(response.text);
      setCarData(prev => ({
        ...prev,
        tankCapacity: result.tankCapacity?.toString() || prev.tankCapacity,
        avgConsumption: result.avgConsumption?.toString() || prev.avgConsumption
      }));
    } catch (e) {
      alert("A IA não conseguiu identificar os valores. Insira manualmente.");
    } finally {
      setDetecting(false);
    }
  };

  const generateSmartGoal = async () => {
    setDetecting(true);
    try {
      const prompt = `Sugira a meta de faturamento BRUTO diária para um motorista que quer R$ ${carData.desiredSalary} de lucro e tem R$ ${carData.personalFixedCosts} de custos, trabalhando ${carData.workingDays} dias. Considere taxa de app de ${carData.appPercentage}%. Retorne apenas o número da meta.`;
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt
      });
      const goal = response.text.replace(/[^0-9.]/g, '');
      setCarData(prev => ({ ...prev, suggestedGoal: goal }));
    } catch (e) {
      alert("Erro ao sugerir meta.");
    } finally {
      setDetecting(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (step < 3) {
      setStep(step + 1);
      return;
    }
    setLoading(true);

    const profile: UserProfile = {
      name: name.trim(),
      appName: carData.appName || 'Uber',
      appPercentage: parseFloat(carData.appPercentage) || 25,
      maintenanceReservePercent: parseFloat(carData.maintenanceReserve) || 5,
      emergencyReservePercent: parseFloat(carData.emergencyReserve) || 3,
      desiredSalary: parseFloat(carData.desiredSalary),
      personalFixedCosts: parseFloat(carData.personalFixedCosts),
      workingDaysPerMonth: parseFloat(carData.workingDays),
      dailyGoal: parseFloat(carData.suggestedGoal),
      currentFuelLevel: 0, 
      lastOdometer: parseFloat(carData.initialOdometer) || 0,
      calculatedAvgConsumption: parseFloat(carData.avgConsumption) || 10, 
      useFixedFare: carData.useFixedFare,
      fixedFareValue: parseFloat(carData.fixedFareValue) || 15.0,
      car: {
        brand: carData.brand,
        model: carData.model,
        year: carData.year,
        power: carData.power,
        tankCapacity: parseFloat(carData.tankCapacity) || 50
      }
    };

    onComplete(profile);
  };

  const inputClass = "w-full bg-zinc-50 border-2 border-zinc-200 rounded-2xl px-5 py-4 focus:outline-none focus:border-black transition-all text-black font-bold text-lg leading-tight";
  const labelClass = "text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1 mb-1.5 block";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-8 bg-white/95 p-8 rounded-[3.5rem] shadow-2xl border border-white">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-black rounded-2xl mx-auto flex items-center justify-center shadow-xl">
            {step === 1 ? <User className="text-white" size={28} /> : step === 2 ? <Car className="text-white" size={28} /> : <Target className="text-white" size={28} />}
          </div>
          <h1 className="text-xl font-black text-black tracking-tighter uppercase italic">Configuração</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className={labelClass}>Nome</label>
                <input required className={inputClass} value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>App</label>
                  <input required className={inputClass} value={carData.appName} onChange={e => setCarData({...carData, appName: e.target.value})} />
                </div>
                <div>
                  <label className={labelClass}>Taxa %</label>
                  <input required type="number" className={inputClass} value={carData.appPercentage} onChange={e => setCarData({...carData, appPercentage: e.target.value})} />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Marca</label>
                  <input required className={inputClass} value={carData.brand} onChange={e => setCarData({...carData, brand: e.target.value})} />
                </div>
                <div>
                  <label className={labelClass}>Modelo</label>
                  <input required className={inputClass} value={carData.model} onChange={e => setCarData({...carData, model: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Ano</label>
                  <input required type="number" className={inputClass} value={carData.year} onChange={e => setCarData({...carData, year: e.target.value})} />
                </div>
                <div>
                  <label className={labelClass}>Potência</label>
                  <input required className={inputClass} value={carData.power} onChange={e => setCarData({...carData, power: e.target.value})} />
                </div>
              </div>
              <button type="button" onClick={autoFillVehicleData} disabled={detecting} className="w-full bg-zinc-900 text-white p-3 rounded-xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest">
                {detecting ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />} Identificar Dados IA
              </button>
              <div className="grid grid-cols-2 gap-3">
                <div className="h-full">
                  <label className={labelClass}>Tanque (L)</label>
                  <input required type="number" className={inputClass} value={carData.tankCapacity} onChange={e => setCarData({...carData, tankCapacity: e.target.value})} />
                </div>
                <div className="h-full">
                  <label className={labelClass}>Consumo (Km/L)</label>
                  <input required type="number" step="0.1" className={inputClass} value={carData.avgConsumption} onChange={e => setCarData({...carData, avgConsumption: e.target.value})} />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="bg-zinc-50 p-6 rounded-[2.5rem] border-2 border-zinc-100 space-y-2">
                 <div className="flex items-center justify-between">
                    <p className="text-[10px] font-black text-zinc-900 uppercase">Sugestão de Meta IA</p>
                    <button type="button" onClick={generateSmartGoal} disabled={detecting} className="text-black"><Activity size={16} /></button>
                 </div>
                 <input type="number" className="w-full bg-transparent text-4xl font-black italic text-center outline-none" value={carData.suggestedGoal} onChange={e => setCarData({...carData, suggestedGoal: e.target.value})} />
                 <p className="text-[8px] text-zinc-400 font-black uppercase text-center tracking-widest">Faturamento Bruto Alvo</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Salário</label>
                  <input required type="number" className={inputClass} value={carData.desiredSalary} onChange={e => setCarData({...carData, desiredSalary: e.target.value})} />
                </div>
                <div>
                  <label className={labelClass}>Fixos</label>
                  <input required type="number" className={inputClass} value={carData.personalFixedCosts} onChange={e => setCarData({...carData, personalFixedCosts: e.target.value})} />
                </div>
              </div>
            </div>
          )}

          <button type="submit" className="w-full bg-black text-white font-black py-6 rounded-[2rem] shadow-2xl flex items-center justify-center gap-3 uppercase italic text-lg">
            {step < 3 ? 'Próximo' : 'Iniciar'} <ArrowRight size={20} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default Onboarding;
