
import React, { useState, useMemo } from 'react';
import { UserProfile, TrackingPhase, Race, Expense } from '../types';
import { Play, Users, UserPlus, Flag, ChevronDown, ChevronUp, Fuel } from 'lucide-react';

interface Props {
  user: UserProfile;
  phase: TrackingPhase;
  setPhase: (p: TrackingPhase) => void;
  onStartShift: (odo: number, config: { appName: string, appPercentage: number, useFixed: boolean, fixedVal: number }) => void;
  kms: { kmParticular: number; kmDeslocamento: number; kmPassageiro: number };
  onFinishSession: (startOdo: number, endOdo: number) => void;
  onFinishRace: (gross: number) => void;
  currentRaces: Race[];
  currentDailyExpenses: Expense[];
}

const Home: React.FC<Props> = ({ user, phase, setPhase, onStartShift, kms, onFinishSession, onFinishRace, currentRaces, currentDailyExpenses }) => {
  const [showStart, setShowStart] = useState(false);
  const [showEnd, setShowEnd] = useState(false);
  const [showGross, setShowGross] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  // States dos modais
  const [startOdo, setStartOdo] = useState('');
  const [shiftAppName, setShiftAppName] = useState('');
  const [shiftAppPercent, setShiftAppPercent] = useState('');
  const [useFixed, setUseFixed] = useState(user.useFixedFare);
  const [fixedVal, setFixedVal] = useState('');

  const [endOdo, setEndOdo] = useState('');
  const [grossInput, setGrossInput] = useState('');

  const grossToday = useMemo(() => {
    return currentRaces.reduce((acc, r) => acc + (r.grossEarnings || 0), 0);
  }, [currentRaces]);

  const netSalaryToday = useMemo(() => {
    const racesNet = currentRaces.reduce((acc, r) => acc + (r.netProfit || 0), 0);
    const expensesValue = currentDailyExpenses.reduce((acc, e) => acc + e.amount, 0);
    return racesNet - expensesValue;
  }, [currentRaces, currentDailyExpenses]);

  const targetNetGoal = user.dailyGoal;
  const remainingToGoal = Math.max(0, targetNetGoal - netSalaryToday);
  const progressPercent = Math.min(100, (netSalaryToday / targetNetGoal) * 100);

  const formatTime = (ts: number) => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Cálculo de combustível para o modal de faturamento
  const estimatedFuelCost = useMemo(() => {
    const totalKm = kms.kmDeslocamento + kms.kmPassageiro;
    const liters = totalKm / user.calculatedAvgConsumption;
    return liters * 5.89; // Preço base para estimativa visual
  }, [kms, user.calculatedAvgConsumption]);

  return (
    <div className="p-5 space-y-6 animate-up">
      <header className="pt-6">
        <h1 className="text-3xl font-black italic text-outline">Olá, {user.name}</h1>
      </header>

      {/* Card de Meta Principal */}
      <div className="glass-card p-8 shadow-2xl relative overflow-hidden flex flex-col items-center">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-2 text-outline-sm">Falta para Lucro Líquido</p>
        <p className="text-5xl font-black italic text-outline mb-6">R$ {remainingToGoal.toFixed(2)}</p>
        
        <div className="w-full space-y-3">
           <div className="flex justify-between items-end px-1">
              <div>
                 <p className="text-[8px] font-bold text-zinc-500 uppercase text-outline-sm">Lucro Adquirido</p>
                 <p className="text-xl font-black text-emerald-400 text-outline">R$ {netSalaryToday.toFixed(2)}</p>
              </div>
              <div className="text-right">
                 <p className="text-[8px] font-bold text-zinc-500 uppercase text-outline-sm">App: {user.appName}</p>
                 <p className="text-xs font-bold text-zinc-300">Bruto: R$ {grossToday.toFixed(2)}</p>
              </div>
           </div>
           <div className="h-3 bg-white/10 rounded-full overflow-hidden border border-white/5">
              <div className="h-full bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.7)] transition-all duration-700" style={{ width: `${progressPercent}%` }} />
           </div>
           <div className="flex justify-between items-center px-1">
              <p className="text-[8px] font-black text-zinc-500 uppercase italic">Meta Líquida: R$ {targetNetGoal.toFixed(2)}</p>
              <p className="text-xl font-black text-emerald-500 text-outline italic">{progressPercent.toFixed(1)}%</p>
           </div>
        </div>
      </div>

      {/* Controles Operacionais */}
      <div>
        {phase === 'IDLE' ? (
          <button onClick={() => setShowStart(true)} className="w-full bg-white text-black py-10 rounded-3xl shadow-2xl border-2 border-black flex flex-col items-center gap-3 active:scale-95 transition-all">
            <Play size={32} fill="black" />
            <span className="text-lg font-black uppercase italic tracking-tighter">Iniciar Expediente</span>
          </button>
        ) : (
          <div className="glass-card p-5 space-y-5">
            <div className="flex justify-between items-center pb-2 border-b border-white/10">
              <p className="text-[10px] font-black uppercase text-outline-sm flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Em Serviço ({user.appName})
              </p>
              <button onClick={() => setShowEnd(true)} className="text-[9px] font-bold text-zinc-500 uppercase underline">Encerrar Turno</button>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-black/40 p-3 rounded-xl border border-white/5 text-center">
                <p className="text-[8px] font-bold text-zinc-500 uppercase">Km Particular</p>
                <p className="text-lg font-black text-outline">{kms.kmParticular.toFixed(1)}</p>
              </div>
              <div className="bg-black/40 p-3 rounded-xl border border-white/5 text-center">
                <p className="text-[8px] font-bold text-zinc-500 uppercase">Km Trabalho</p>
                <p className="text-lg font-black text-outline">{(kms.kmDeslocamento + kms.kmPassageiro).toFixed(1)}</p>
              </div>
            </div>

            <div className="space-y-3">
              {phase === 'PARTICULAR' && (
                <button onClick={() => setPhase('DESLOCAMENTO')} className="w-full bg-white text-black py-5 rounded-2xl font-black uppercase italic shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3">
                  <UserPlus size={20} /> Aceitar Corrida
                </button>
              )}
              {phase === 'DESLOCAMENTO' && (
                <button onClick={() => setPhase('PASSAGEIRO')} className="w-full bg-zinc-800 text-white py-5 rounded-2xl font-black uppercase italic border border-white/20 active:scale-95 transition-all flex items-center justify-center gap-3">
                  <Users size={20} /> Embarcar Pax
                </button>
              )}
              {phase === 'PASSAGEIRO' && (
                <button 
                  onClick={() => user.useFixedFare ? onFinishRace(user.fixedFareValue) : setShowGross(true)} 
                  className="w-full bg-emerald-600 text-white py-5 rounded-2xl font-black uppercase italic border border-white/20 shadow-lg active:scale-95 transition-all flex items-center justify-center gap-3"
                >
                  <Flag size={20} /> Finalizar Corrida
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modais de Operação */}
      {showGross && (
        <div className="fixed inset-0 bg-black/95 z-[100] flex items-center justify-center p-6">
          <div className="bg-zinc-900 w-full max-w-sm rounded-[2.5rem] p-10 space-y-6 border border-white/10 shadow-2xl">
            <div className="text-center space-y-1">
              <h2 className="text-2xl font-black uppercase italic text-outline">Check-out Corrida</h2>
              <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest">Resumo de custos da atividade</p>
            </div>

            <div className="grid grid-cols-2 gap-2">
               <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                  <p className="text-[7px] font-bold text-zinc-500 uppercase">Deslocamento</p>
                  <p className="text-xs font-black text-white">{kms.kmDeslocamento.toFixed(1)} KM</p>
               </div>
               <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                  <p className="text-[7px] font-bold text-zinc-500 uppercase">Passageiro</p>
                  <p className="text-xs font-black text-white">{kms.kmPassageiro.toFixed(1)} KM</p>
               </div>
            </div>

            <div className="bg-emerald-600/10 p-4 rounded-2xl border border-emerald-500/20 flex items-center justify-between">
               <div className="flex items-center gap-2">
                  <Fuel size={14} className="text-emerald-500" />
                  <p className="text-[9px] font-black text-emerald-500 uppercase">Custo Combustível</p>
               </div>
               <p className="text-lg font-black italic text-emerald-500">R$ {estimatedFuelCost.toFixed(2)}</p>
            </div>

            <div className="space-y-1">
               <label className="text-[9px] font-bold text-zinc-500 uppercase ml-1">Valor Bruto Recebido</label>
               <input autoFocus type="number" step="0.01" className="w-full py-6 text-5xl font-black text-center" placeholder="0.00" value={grossInput} onChange={e => setGrossInput(e.target.value)} />
            </div>

            <button onClick={() => { onFinishRace(parseFloat(grossInput) || 0); setGrossInput(''); setShowGross(false); }} className="w-full bg-white text-black py-6 rounded-2xl font-black text-xl uppercase italic shadow-xl active:scale-95 transition-all">Lançar & Continuar</button>
            <button onClick={() => setShowGross(false)} className="w-full text-zinc-600 font-bold uppercase text-[10px]">Cancelar</button>
          </div>
        </div>
      )}

      {showStart && (
        <div className="fixed inset-0 bg-black/95 z-[100] flex items-center justify-center p-6 overflow-y-auto">
          <div className="bg-zinc-900 w-full max-w-sm rounded-[2.5rem] p-8 space-y-6 border border-white/10 shadow-2xl my-auto">
            <h2 className="text-2xl font-black uppercase italic text-center text-outline">Abrir Expediente</h2>
            
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-zinc-500 uppercase ml-1">Odômetro Atual (Painel)</label>
                <input autoFocus type="number" className="w-full text-center text-3xl font-black italic py-3" placeholder={user.lastOdometer.toString()} value={startOdo} onChange={e => setStartOdo(e.target.value)} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                 <div className="space-y-1">
                    <label className="text-[9px] font-bold text-zinc-500 uppercase ml-1">App Hoje</label>
                    <input className="w-full text-center text-sm font-black" placeholder={user.appName} value={shiftAppName} onChange={e => setShiftAppName(e.target.value)} />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[9px] font-bold text-zinc-500 uppercase ml-1">Taxa (%)</label>
                    <input type="number" className="w-full text-center text-sm font-black" placeholder={user.appPercentage.toString()} value={shiftAppPercent} onChange={e => setShiftAppPercent(e.target.value)} />
                 </div>
              </div>

              <div className="flex items-center justify-between bg-black/40 p-4 rounded-2xl border border-white/5">
                <span className="text-[10px] font-black uppercase text-white italic">Tarifa Fixa?</span>
                <input type="checkbox" className="w-6 h-6 accent-white" checked={useFixed} onChange={e => setUseFixed(e.target.checked)} />
              </div>

              {useFixed && (
                <div className="space-y-1 animate-in fade-in slide-in-from-top-2">
                  <label className="text-[9px] font-bold text-zinc-500 uppercase ml-1">Valor/Corrida (R$)</label>
                  <input type="number" className="w-full text-center text-xl font-black" placeholder={user.fixedFareValue.toString()} value={fixedVal} onChange={e => setFixedVal(e.target.value)} />
                </div>
              )}
            </div>

            <button 
              disabled={!startOdo && !user.lastOdometer} 
              onClick={() => { 
                onStartShift(parseFloat(startOdo) || user.lastOdometer, { 
                  appName: shiftAppName || user.appName, 
                  appPercentage: parseFloat(shiftAppPercent) || user.appPercentage, 
                  useFixed, 
                  fixedVal: parseFloat(fixedVal) || user.fixedFareValue 
                }); 
                setShowStart(false); 
              }} 
              className="w-full bg-white text-black py-5 rounded-2xl font-black text-lg uppercase italic shadow-xl active:scale-95 transition-all"
            >
              Começar Agora
            </button>
            <button onClick={() => setShowStart(false)} className="w-full text-zinc-600 font-bold uppercase text-[10px]">Cancelar</button>
          </div>
        </div>
      )}

      {showEnd && (
        <div className="fixed inset-0 bg-black/95 z-[100] flex items-center justify-center p-6 text-center">
          <div className="bg-zinc-900 w-full max-w-sm rounded-[2.5rem] p-10 space-y-8 border border-white/10 shadow-2xl">
            <h2 className="text-2xl font-black uppercase italic text-outline">Km Final (Painel)</h2>
            <input autoFocus type="number" className="w-full py-6 text-4xl font-black text-center" placeholder="Ex: 045450" value={endOdo} onChange={e => setEndOdo(e.target.value)} />
            <button onClick={() => { if(!endOdo) return; onFinishSession(user.lastOdometer, parseFloat(endOdo)); setShowEnd(false); setEndOdo(''); }} className="w-full bg-white text-black py-5 rounded-2xl font-black text-lg uppercase italic shadow-xl">Fechar Dia</button>
            <button onClick={() => setShowEnd(false)} className="text-[10px] font-bold text-zinc-600 uppercase">Voltar</button>
          </div>
        </div>
      )}

      {/* Histórico Atividade Hoje */}
      <div className="space-y-3 pb-24">
        <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-1 text-outline-sm">Corridas Hoje</h3>
        <div className="space-y-2">
          {currentRaces.length === 0 ? (
            <div className="py-10 text-center text-zinc-800 text-[10px] font-black uppercase border border-dashed border-zinc-900 rounded-3xl bg-black/5">Aguardando Atividade</div>
          ) : (
            currentRaces.slice().reverse().map(race => (
              <div key={race.id} onClick={() => setExpandedId(expandedId === race.id ? null : race.id)} className="glass-card overflow-hidden cursor-pointer border border-white/5 active:scale-[0.99] transition-all">
                <div className="p-4 flex items-center justify-between">
                   <div className="flex items-center gap-4">
                      <div className="text-center">
                         <p className="text-[7px] font-bold text-zinc-500 uppercase leading-none mb-1 text-outline-sm">HORA</p>
                         <p className="text-[9px] font-black text-white text-outline-sm">{formatTime(race.finishedAt)}</p>
                      </div>
                      <div className="h-6 w-px bg-zinc-800" />
                      <div className="text-center">
                         <p className="text-[7px] font-bold text-zinc-500 uppercase leading-none mb-1 text-outline-sm">KM</p>
                         <p className="text-[9px] font-black text-white text-outline-sm">{(race.kmDeslocamento + race.kmPassageiro).toFixed(1)}</p>
                      </div>
                   </div>
                   <div className="text-right flex items-center gap-3">
                      <div>
                        <p className="text-xl font-black italic text-outline leading-none text-emerald-400">R$ {race.netProfit.toFixed(2)}</p>
                        <p className="text-[7px] font-bold text-zinc-500 uppercase mt-1">Líquido</p>
                      </div>
                      {expandedId === race.id ? <ChevronUp size={16} className="text-zinc-600" /> : <ChevronDown size={16} className="text-zinc-600" />}
                   </div>
                </div>

                {expandedId === race.id && (
                  <div className="p-4 bg-black/50 border-t border-white/5 space-y-4 animate-in fade-in slide-in-from-top-1">
                    <div className="grid grid-cols-2 gap-3">
                       <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                          <p className="text-[8px] font-bold text-zinc-500 uppercase mb-1">Bruto</p>
                          <p className="text-xs font-black text-white">R$ {race.grossEarnings.toFixed(2)}</p>
                       </div>
                       <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                          <p className="text-[8px] font-bold text-zinc-500 uppercase mb-1">Deslocamento</p>
                          <p className="text-xs font-black text-white">{race.kmDeslocamento.toFixed(1)} KM</p>
                       </div>
                    </div>
                    <div className="bg-zinc-900/50 p-3 rounded-xl space-y-2 border border-white/5">
                       <p className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">Deduções Reais</p>
                       <div className="flex justify-between text-[10px]"><span className="text-zinc-500">Taxa App</span><span className="text-red-400 font-bold">- R$ {race.appTax.toFixed(2)}</span></div>
                       <div className="flex justify-between text-[10px]"><span className="text-zinc-500">Combustível</span><span className="text-red-400 font-bold">- R$ {race.fuelCost.toFixed(2)}</span></div>
                       <div className="flex justify-between text-[10px]"><span className="text-zinc-500">Reserva Manut.</span><span className="text-red-400 font-bold">- R$ {race.maintenanceReserve.toFixed(2)}</span></div>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;
