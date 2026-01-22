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
    if (!data.brand || !data.model) return alert("Digite Marca e Modelo primeiro para eu pesquisar.");
    setLoading(true);
    try {
      const prompt = `Qual a capacidade do tanque de combustível em litros para o veículo ${data.brand} ${data.model} ${data.year}? Retorne apenas um JSON com a chave "liters" sendo um número.`;
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { 
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              liters: { type: Type.NUMBER }
            },
            required: ["liters"]
          }
        }
      });
      
      const jsonStr = response.text.trim();
      const res = JSON.parse(jsonStr);
      if (res.liters) {
        setData(p => ({ ...p, tank: res.liters.toString() }));
      }
    } catch (e) {
      console.error("Erro IA:", e);
      alert("IA ocupada ou sem internet. Digite o valor manualmente.");
    } finally { setLoading(false); }
  };

  const calculateDailyGoal = () => {
    const s = parseFloat(data.salary) || 0;
    const c = parseFloat(data.costs) || 0;
    const d = parseFloat(data.days) || 1;
    // Margem de 45% para impostos, taxas do app e combustível
    return Math.round(((s + c) / d) / 0.55);
  };

  const next = () => { 
    if (step === 1 && !data.name) return alert("Digite seu nome.");
    if (step < 3) setStep(step + 1); 
    else finish(); 
  };

  const finish = () => {
    onComplete({
      name: data.name, currentFuelLevel: 0, lastOdometer: 0, calculatedAvgConsumption: 10,
      car: { brand: data.brand, model: data.model, year: data.year, power: data.power, tankCapacity: parseFloat(data.tank) || 50 },
      desiredSalary: parseFloat(data.salary) || 0, personalFixedCosts: parseFloat(data.costs) || 0, workingDaysPerMonth: parseInt(data.days) || 22,
      dailyGoal: calculateDailyGoal(), appProfiles: [], selectedAppProfileId: '', stationProfiles: []
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-10 animate-up">
      <div className="w-full max-w-sm px-6 space-y-8">
        <div className="text-center space-y-3">
          <div className="w-20 h-20 bg-blue-600 rounded-[2rem] mx-auto flex items-center justify-center text-white shadow-2xl border-b-8 border-blue-800">
            {step === 1 ? <User size={40} /> : step === 2 ? <Car size={40} /> : <Target size={40} />}
          </div>
          <h1 className="text-3xl font-black italic uppercase tracking-tighter text-white">
            {step === 1 ? 'Seu Perfil' : step === 2 ? 'Seu Veículo' : 'Sua Meta'}
          </h1>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest opacity-60">Configuração Inicial</p>
        </div>

        <div className="space-y-6">
          {step === 1 && (
            <div className="animate-up">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block ml-1">Como devemos te chamar?</label>
              <input value={data.name} onChange={e => setData({...data, name: e.target.value})} placeholder="Ex: Diego Rafael" />
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 animate-up">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-[10px] font-black text-slate-500 uppercase mb-2 block">Marca</label><input value={data.brand} onChange={e => setData({...data, brand: e.target.value})} placeholder="Ex: VW" /></div>
                <div><label className="text-[10px] font-black text-slate-500 uppercase mb-2 block">Modelo</label><input value={data.model} onChange={e => setData({...data, model: e.target.value})} placeholder="Ex: Virtus" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-[10px] font-black text-slate-500 uppercase mb-2 block">Ano</label><input value={data.year} onChange={e => setData({...data, year: e.target.value})} placeholder="Ex: 2024" /></div>
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase mb-2 block">Motor</label>
                  <select value={data.power} onChange={e => setData({...data, power: e.target.value})}>
                    <option value="1.0">1.0</option>
                    <option value="1.3">1.3</option>
                    <option value="1.6">1.6</option>
                    <option value="2.0">2.0</option>
                  </select>
                </div>
              </div>
              <div className="relative">
                <label className="text-[10px] font-black text-slate-500 uppercase mb-2 block">Capacidade Tanque (L)</label>
                <input type="number" value={data.tank} onChange={e => setData({...data, tank: e.target.value})} placeholder="Ex: 52" />
                <button onClick={fetchTankCapacity} disabled={loading} className="absolute right-2 bottom-1.5 bg-blue-600 text-white p-3 rounded-xl shadow-lg active:scale-90 transition-all">
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 animate-up">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-[10px] font-black text-slate-500 uppercase mb-2 block">Meta Limpa/Mês</label><input type="number" value={data.salary} onChange={e => setData({...data, salary: e.target.value})} placeholder="Ex: 5000" /></div>
                <div><label className="text-[10px] font-black text-slate-500 uppercase mb-2 block">Custos Fixos/Mês</label><input type="number" value={data.costs} onChange={e => setData({...data, costs: e.target.value})} placeholder="Ex: 1500" /></div>
              </div>
              <div><label className="text-[10px] font-black text-slate-500 uppercase mb-2 block">Dias Trabalhados/Mês</label><input type="number" value={data.days} onChange={e => setData({...data, days: e.target.value})} placeholder="Ex: 22" /></div>
              
              <div className="bg-blue-600/10 border border-blue-500/20 p-6 rounded-[2rem] text-center">
                 <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-2">Meta Diária Sugerida</p>
                 <p className="text-4xl font-black italic text-white leading-none">R$ {calculateDailyGoal()}</p>
                 <p className="text-[8px] font-bold text-slate-500 uppercase mt-3">Faturamento bruto diário necessário.</p>
              </div>
            </div>
          )}

          <button onClick={next} className="w-full bg-blue-600 text-white font-black py-6 rounded-[2.5rem] flex items-center justify-center gap-4 shadow-2xl active:scale-95 transition-all border-b-8 border-blue-800">
            {step < 3 ? 'CONTINUAR' : 'CONCLUIR E ACESSAR'} <ArrowRight size={24} />
          </button>
        </div>
      </div>
    </div>
  );
};
export default Onboarding;