
import React, { useState } from 'react';
import { UserProfile } from '../types';
import { User, Car, Target, ArrowRight, Loader2, Sparkles, Zap } from 'lucide-react';
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
    salary: '', costs: '', days: '22'
  });

  const fetchTankCapacity = async () => {
    if (!data.brand || !data.model) return alert("Preencha Marca e Modelo.");
    setLoading(true);
    try {
      const resp = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `JSON: Capacidade exata do tanque de combustível em litros para o veículo ${data.brand} ${data.model} ${data.year}. FORMATO: {"liters": number}`,
        config: { responseMimeType: "application/json" }
      });
      const res = JSON.parse(resp.text);
      setData(p => ({ ...p, tank: res.liters?.toString() || '' }));
    } catch (e) { alert("IA indisponível. Preencha manualmente."); }
    finally { setLoading(false); }
  };

  const calculateDailyGoal = () => {
    const s = parseFloat(data.salary) || 0;
    const c = parseFloat(data.costs) || 0;
    const d = parseFloat(data.days) || 1;
    // Sugestão de Meta Bruta Diária: Meta Líquida / 0.55 (considerando aprox 45% de gastos operacionais médios)
    return Math.round(((s + c) / d) / 0.55);
  };

  const next = () => { if (step < 3) setStep(step + 1); else finish(); };
  const finish = () => {
    onComplete({
      name: data.name, currentFuelLevel: 0, lastOdometer: 0, calculatedAvgConsumption: 10, maintenanceCostPerKm: 0.15,
      car: { brand: data.brand, model: data.model, year: data.year, power: data.power, tankCapacity: parseFloat(data.tank) || 50 },
      desiredSalary: parseFloat(data.salary), personalFixedCosts: parseFloat(data.costs), workingDaysPerMonth: parseInt(data.days),
      dailyGoal: calculateDailyGoal(), appProfiles: [], selectedAppProfileId: '', stationProfiles: []
    });
  };

  const inputStyle = "w-full bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3.5 text-white font-bold text-sm focus:border-blue-500 outline-none transition-all";
  const labelStyle = "text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block ml-1";

  return (
    <div className="min-h-screen flex items-center justify-center py-10 animate-up px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl mx-auto flex items-center justify-center text-white shadow-xl border-b-4 border-blue-800">
            {step === 1 ? <User size={30} /> : step === 2 ? <Car size={30} /> : <Target size={30} />}
          </div>
          <h1 className="text-2xl font-black italic uppercase tracking-tighter">
            {step === 1 ? 'Como se chama?' : step === 2 ? 'Seu Veículo' : 'Sua Meta Diária'}
          </h1>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest opacity-60">Passo {step} de 3</p>
        </div>

        <div className="space-y-5">
          {step === 1 && (
            <div className="animate-up">
              <label className={labelStyle}>Seu Nome</label>
              <input className={inputStyle} value={data.name} onChange={e => setData({...data, name: e.target.value})} placeholder="Ex: Rodrigo" />
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 animate-up">
              <div className="grid grid-cols-2 gap-3">
                <div><label className={labelStyle}>Marca</label><input className={inputStyle} value={data.brand} onChange={e => setData({...data, brand: e.target.value})} placeholder="Toyota" /></div>
                <div><label className={labelStyle}>Modelo</label><input className={inputStyle} value={data.model} onChange={e => setData({...data, model: e.target.value})} placeholder="Corolla" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={labelStyle}>Ano</label><input className={inputStyle} value={data.year} onChange={e => setData({...data, year: e.target.value})} placeholder="2024" /></div>
                <div>
                  <label className={labelStyle}>Motor</label>
                  <select className={inputStyle} value={data.power} onChange={e => setData({...data, power: e.target.value})}>
                    <option value="1.0">1.0</option>
                    <option value="1.6">1.6</option>
                    <option value="2.0">2.0</option>
                  </select>
                </div>
              </div>
              <div>
                <label className={labelStyle}>Tanque (Litros)</label>
                <div className="relative">
                  <input className={inputStyle} type="number" value={data.tank} onChange={e => setData({...data, tank: e.target.value})} placeholder="Capacidade em L" />
                  <button onClick={fetchTankCapacity} disabled={loading} className="absolute right-2 top-2 bottom-2 bg-blue-600/20 text-blue-400 px-3 rounded-xl flex items-center gap-1.5 text-[9px] font-black uppercase border border-blue-500/10">
                    {loading ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />} IA Tank
                  </button>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 animate-up">
              <div className="grid grid-cols-2 gap-3">
                <div><label className={labelStyle}>Salário Livre/Mês</label><input className={inputStyle} type="number" value={data.salary} onChange={e => setData({...data, salary: e.target.value})} placeholder="4000" /></div>
                <div><label className={labelStyle}>Custos Pessoais</label><input className={inputStyle} type="number" value={data.costs} onChange={e => setData({...data, costs: e.target.value})} placeholder="1500" /></div>
              </div>
              <div><label className={labelStyle}>Dias Trabalhados/Mês</label><input className={inputStyle} type="number" value={data.days} onChange={e => setData({...data, days: e.target.value})} placeholder="22" /></div>
              
              <div className="bento-card p-5 bg-blue-600/5 border-blue-500/20">
                <div className="flex items-center gap-3 mb-2">
                  <Zap size={16} className="text-blue-500" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-blue-500">Meta Sugerida</span>
                </div>
                <p className="text-3xl font-black italic text-white tracking-tighter leading-none">R$ {calculateDailyGoal()}</p>
                <p className="text-[8px] font-bold text-slate-500 uppercase mt-2">Faturamento bruto diário para cobrir tudo.</p>
              </div>
            </div>
          )}

          <button onClick={next} className="w-full bg-blue-600 text-white font-black py-4.5 rounded-2xl flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all border-b-4 border-blue-800">
            {step < 3 ? 'Avançar' : 'Finalizar Cadastro'} <ArrowRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
