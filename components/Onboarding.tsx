
import React, { useState } from 'react';
import { UserProfile, Type } from '../types';
import { User, Car, Target, ArrowRight, Loader2, Sparkles } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

interface Props {
  ai: GoogleGenAI;
  onComplete: (u: UserProfile) => void;
}

const Onboarding: React.FC<Props> = ({ ai, onComplete }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({
    name: '', brand: '', model: '', year: '', power: '1.0', tank: '',
    salary: '', costs: '', days: ''
  });

  const fetchTankCapacity = async () => {
    if (!data.brand || !data.model) return alert("Digite Marca e Modelo primeiro.");
    setLoading(true);
    try {
      const prompt = `Qual a capacidade do tanque para ${data.brand} ${data.model} ${data.year}? Responda apenas JSON: {"liters": numero}.`;
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { 
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: { liters: { type: Type.NUMBER } },
            required: ["liters"]
          }
        }
      });
      const res = JSON.parse(response.text.trim());
      if (res.liters) setData(p => ({ ...p, tank: res.liters.toString() }));
    } catch (e) { alert("Erro ao consultar IA. Digite manualmente."); }
    finally { setLoading(false); }
  };

  const calculateDailyGoal = () => {
    const s = parseFloat(data.salary) || 0;
    const c = parseFloat(data.costs) || 0;
    const d = parseFloat(data.days) || 1;
    return Math.round(((s + c) / d) / 0.55);
  };

  const finish = () => {
    onComplete({
      name: data.name, 
      currentFuelLevel: 0, // Começa vazio para o motorista abastecer no app
      lastOdometer: 0,     // Sinaliza primeiro registro no App.tsx
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
          <div className="w-24 h-24 bg-blue-600 rounded-[2.5rem] mx-auto flex items-center justify-center shadow-2xl border-b-8 border-blue-900">
            {step === 1 ? <User size={48} /> : step === 2 ? <Car size={48} /> : <Target size={48} />}
          </div>
          <h1 className="text-4xl font-black italic uppercase tracking-tighter leading-none">
            {step === 1 ? 'Perfil' : step === 2 ? 'Veículo' : 'Sua Meta'}
          </h1>
        </div>

        <div className="space-y-6">
          {step === 1 && (
            <div className="animate-up">
              <input className={inputClass} value={data.name} onChange={e => setData({...data, name: e.target.value})} placeholder="Seu Nome Completo" />
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 animate-up">
              <div className="grid grid-cols-2 gap-3">
                <input className={inputClass} value={data.brand} onChange={e => setData({...data, brand: e.target.value})} placeholder="Marca" />
                <input className={inputClass} value={data.model} onChange={e => setData({...data, model: e.target.value})} placeholder="Modelo" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input className={inputClass} value={data.year} onChange={e => setData({...data, year: e.target.value})} placeholder="Ano" />
                <select className={inputClass} value={data.power} onChange={e => setData({...data, power: e.target.value})}>
                   <option value="1.0">1.0 Flex</option>
                   <option value="1.3">1.3 Turbo</option>
                   <option value="1.6">1.6 Flex</option>
                   <option value="2.0">2.0 Flex</option>
                </select>
              </div>
              <div className="relative">
                <input className={inputClass} type="number" value={data.tank} onChange={e => setData({...data, tank: e.target.value})} placeholder="Capacidade Tanque (L)" />
                <button onClick={fetchTankCapacity} disabled={loading} className="absolute right-3 top-1/2 -translate-y-1/2 bg-blue-600 p-3 rounded-xl">
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 animate-up">
              <div className="grid grid-cols-2 gap-3">
                 <input className={inputClass} type="number" value={data.salary} onChange={e => setData({...data, salary: e.target.value})} placeholder="Alvo R$" />
                 <input className={inputClass} type="number" value={data.costs} onChange={e => setData({...data, costs: e.target.value})} placeholder="Custos R$" />
              </div>
              <input className={inputClass} type="number" value={data.days} onChange={e => setData({...data, days: e.target.value})} placeholder="Dias/Mês" />
              <div className="bg-blue-600/10 border-2 border-blue-500/20 p-8 rounded-[3rem] text-center">
                 <p className="text-[10px] font-black text-blue-500 uppercase mb-2 leading-none">Meta Bruta Diária</p>
                 <p className="text-5xl font-black italic">R$ {calculateDailyGoal()}</p>
              </div>
            </div>
          )}

          <button onClick={() => step < 3 ? setStep(step + 1) : finish()} className="w-full bg-blue-600 text-white font-black py-6 rounded-[2.5rem] flex items-center justify-center gap-4 shadow-2xl border-b-8 border-blue-900 transition-all uppercase italic text-xl">
            {step < 3 ? 'Continuar' : 'Finalizar'} <ArrowRight size={28} />
          </button>
        </div>
      </div>
    </div>
  );
};
export default Onboarding;
