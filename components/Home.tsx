
import React, { useState, useMemo } from 'react';
import { UserProfile, TrackingPhase, Race, Expense } from '../types';
import { Play, Users, Droplets, Clock, UserPlus, Flag } from 'lucide-react';

interface Props {
  user: UserProfile;
  phase: TrackingPhase;
  setPhase: (p: TrackingPhase) => void;
  kms: { kmParticular: number; kmDeslocamento: number; kmPassageiro: number };
  onFinishSession: (startOdo: number, endOdo: number) => void;
  onFinishRace: (gross: number) => void;
  currentRaces: Race[];
  currentDailyExpenses: Expense[];
}

const Home: React.FC<Props> = ({ user, phase, setPhase, kms, onFinishSession, onFinishRace, currentRaces, currentDailyExpenses }) => {
  const [showStart, setShowStart] = useState(false);
  const [showEnd, setShowEnd] = useState(false);
  const [showGross, setShowGross] = useState(false);
  
  const [startOdo, setStartOdo] = useState(user.lastOdometer?.toString() || '');
  const [endOdo, setEndOdo] = useState('');
  const [grossInput, setGrossInput] = useState('');

  // Lucro Limpo Acumulado Hoje (O que de fato é o salário do motorista)
  const netSalaryToday = useMemo(() => {
    return currentRaces.reduce((acc, r) => acc + (r.netProfit || 0), 0);
  }, [currentRaces]);

  // Meta diária baseada no Salário Desejado + Custos Fixos Pessoais
  const dailyTarget = useMemo(() => {
    return (user.desiredSalary / user.workingDaysPerMonth) + (user.personalFixedCosts / user.workingDaysPerMonth);
  }, [user]);

  const remainingToGoal = Math.max(0, dailyTarget - netSalaryToday);
  const progressPercent = Math.min(100, (netSalaryToday / dailyTarget) * 100);

  const formatTime = (ts: number) => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="p-5 space-y-6 animate-up">
      <header className="pt-6">
        <h1 className="text-3xl font-black italic text-outline">Olá, {user.name}</h1>
      </header>

      {/* Card de Meta Principal - Foco no Restante */}
      <div className="glass-card p-6 shadow-2xl relative overflow-hidden">
        <div className="relative z-10 flex justify-between items-end">
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 text-outline-sm">Falta para a Meta</p>
            <p className="text-4xl font-black italic text-outline">R$ {remainingToGoal.toFixed(2)}</p>
          </div>
          <div className="text-right">
             <p className="text-[9px] font-bold text-zinc-500 text-outline-sm">Salário Hoje</p>
             <p className="text-xl font-black text-white text-outline">R$ {netSalaryToday.toFixed(2)}</p>
          </div>
        </div>
        
        <div className="mt-5 space-y-2">
           <div className="h-2.5 bg-white/10 rounded-full overflow-hidden border border-white/5">
              <div className="h-full bg-white transition-all duration-700 shadow-[0_0_15px_rgba(255,255,255,0.5)]" style={{ width: `${progressPercent}%` }} />
           </div>
           <div className="flex justify-between text-[8px] font-black uppercase text-outline-sm italic">
             <span>Progresso: {progressPercent.toFixed(0)}%</span>
             <span className="flex items-center gap-1"><Droplets size={10} className="text-blue-400" /> {user.currentFuelLevel.toFixed(1)}L</span>
           </div>
        </div>
      </div>

      {/* Controles de Expediente */}
      <div>
        {phase === 'IDLE' ? (
          <button onClick={() => setShowStart(true)} className="w-full bg-white text-black py-10 rounded-3xl shadow-2xl border-2 border-black flex flex-col items-center gap-3 active:scale-95 transition-all">
            <Play size={32} fill="black" />
            <span className="text-lg font-black uppercase italic tracking-tighter">Iniciar Expediente</span>
          </button>
        ) : (
          <div className="glass-card p-5 space-y-5">
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                <p className="text-[10px] font-black uppercase text-outline-sm">Em Serviço</p>
              </div>
              <button onClick={() => setShowEnd(true)} className="text-[10px] font-bold text-zinc-500 uppercase underline">Fechar Dia</button>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-black/30 p-4 rounded-2xl border border-white/5 text-center">
                <p className="text-[8px] font-bold text-zinc-500 uppercase">Km Rodado</p>
                <p className="text-xl font-black text-outline">{(kms.kmParticular + kms.kmDeslocamento + kms.kmPassageiro).toFixed(1)}</p>
              </div>
              <div className="bg-black/30 p-4 rounded-2xl border border-white/5 text-center">
                <p className="text-[8px] font-bold text-zinc-500 uppercase">Tarifa</p>
                <p className="text-xl font-black text-outline">R$ {user.useFixedFare ? user.fixedFareValue.toFixed(2) : 'Dinâmica'}</p>
              </div>
            </div>

            <div className="space-y-3">
              {phase === 'PARTICULAR' && <button onClick={() => setPhase('DESLOCAMENTO')} className="w-full bg-white text-black py-5 rounded-2xl font-black uppercase italic shadow-xl"><UserPlus className="inline mr-2" size={20} /> Aceitar Corrida</button>}
              {phase === 'DESLOCAMENTO' && <button onClick={() => setPhase('PASSAGEIRO')} className="w-full bg-zinc-800 text-white py-5 rounded-2xl font-black uppercase italic border border-white/20"><Users className="inline mr-2" size={20} /> Embarcar Pax</button>}
              {phase === 'PASSAGEIRO' && <button onClick={() => user.useFixedFare ? onFinishRace(user.fixedFareValue) : setShowGross(true)} className="w-full bg-emerald-600 text-white py-5 rounded-2xl font-black uppercase italic border border-white/20 shadow-lg"><Flag className="inline mr-2" size={20} /> Finalizar & Cobrar</button>}
            </div>
          </div>
        )}
      </div>

      {/* Histórico Simplificado */}
      <div className="space-y-3 pb-24">
        <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-1 text-outline-sm flex items-center gap-2">
           <Clock size={14} /> Corridas Recentes
        </h3>
        <div className="space-y-2">
          {currentRaces.length === 0 ? (
            <div className="py-10 text-center text-zinc-700 text-[10px] font-black uppercase border-2 border-dashed border-zinc-900 rounded-3xl bg-black/10">Aguardando atividade</div>
          ) : (
            currentRaces.slice().reverse().map(race => (
              <div key={race.id} className="glass-card p-4 flex items-center justify-between border border-white/5">
                <div className="flex items-center gap-4">
                  <div className={`w-1.5 h-10 rounded-full ${race.score === 'GOOD' ? 'bg-emerald-500' : 'bg-zinc-700'}`} />
                  <div>
                    <p className="text-[9px] font-bold text-zinc-500 uppercase leading-none mb-1 text-outline-sm">{formatTime(race.acceptedAt)}</p>
                    <p className="text-xl font-black italic text-outline leading-none">R$ {race.netProfit.toFixed(2)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-bold text-zinc-500 uppercase italic text-outline-sm">Bruto: R$ {race.grossEarnings.toFixed(2)}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modais de Fluxo */}
      {showStart && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-[100] flex items-center justify-center p-6">
          <div className="bg-zinc-900 w-full max-w-sm rounded-[2.5rem] p-10 space-y-8 border border-white/10 shadow-2xl">
            <h2 className="text-2xl font-black uppercase italic text-center text-outline">Abrir Expediente</h2>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-zinc-500 ml-1 text-outline-sm">Km Atual do Painel</label>
              <input autoFocus type="number" className="w-full text-center text-3xl font-black italic py-4" placeholder="000000" value={startOdo} onChange={e => setStartOdo(e.target.value)} />
            </div>
            <button disabled={!startOdo} onClick={() => { setPhase('PARTICULAR'); setShowStart(false); }} className="w-full bg-white text-black py-5 rounded-2xl font-black text-lg uppercase italic active:scale-95 transition-all">Começar Agora</button>
          </div>
        </div>
      )}

      {showGross && (
        <div className="fixed inset-0 bg-black/95 z-[100] flex items-center justify-center p-6">
          <div className="bg-zinc-900 w-full max-w-sm rounded-[2.5rem] p-10 space-y-8 border border-white/10 shadow-2xl">
            <h2 className="text-2xl font-black uppercase italic text-center text-outline">Valor da Corrida</h2>
            <input autoFocus type="number" step="0.01" className="w-full py-8 text-5xl font-black text-center" placeholder="0.00" value={grossInput} onChange={e => setGrossInput(e.target.value)} />
            <button onClick={() => { onFinishRace(parseFloat(grossInput) || 0); setGrossInput(''); setShowGross(false); }} className="w-full bg-white text-black py-6 rounded-2xl font-black text-xl uppercase italic">Lançar Ganho</button>
            <button onClick={() => setShowGross(false)} className="w-full text-zinc-600 font-bold uppercase text-[10px]">Cancelar</button>
          </div>
        </div>
      )}

      {showEnd && (
        <div className="fixed inset-0 bg-black/95 z-[100] flex items-center justify-center p-6 text-center">
          <div className="bg-zinc-900 w-full max-w-sm rounded-[2.5rem] p-10 space-y-8 border border-white/10 shadow-2xl">
            <h2 className="text-2xl font-black uppercase italic text-outline">Encerrar o Dia</h2>
            <div className="space-y-2">
               <p className="text-[10px] font-bold text-zinc-500 uppercase text-outline-sm">Informe o Km Final</p>
               <input autoFocus type="number" className="w-full py-6 text-4xl font-black text-center" value={endOdo} onChange={e => setEndOdo(e.target.value)} />
            </div>
            <button onClick={() => { if(!endOdo) return; onFinishSession(parseFloat(startOdo) || 0, parseFloat(endOdo) || 0); setShowEnd(false); setEndOdo(''); }} className="w-full bg-white text-black py-5 rounded-2xl font-black text-lg uppercase italic">Salvar e Fechar</button>
            <button onClick={() => setShowEnd(false)} className="text-[10px] font-bold text-zinc-600 uppercase">Voltar</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
