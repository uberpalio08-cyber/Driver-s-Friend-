
import React, { useState, useMemo } from 'react';
import { UserProfile, TrackingPhase, MaintenanceTask, Race, Expense } from '../types';
import { Play, Navigation, Users, Car, Droplets, Wallet, Target, CheckCircle, AlertTriangle, TrendingUp, Info } from 'lucide-react';

interface Props {
  user: UserProfile;
  phase: TrackingPhase;
  setPhase: (p: TrackingPhase) => void;
  kms: { kmParticular: number; kmDeslocamento: number; kmPassageiro: number };
  onFinishSession: (startOdo: number, endOdo: number) => void;
  onFinishRace: (gross: number) => void;
  currentRaces: Race[];
  currentDailyExpenses: Expense[];
  maintenance: MaintenanceTask[];
}

const Home: React.FC<Props> = ({ user, phase, setPhase, kms, onFinishSession, onFinishRace, currentRaces, currentDailyExpenses, maintenance }) => {
  const [showStartSessionDialog, setShowStartSessionDialog] = useState(false);
  const [showFinishSessionDialog, setShowFinishSessionDialog] = useState(false);
  const [showRaceGrossDialog, setShowRaceGrossDialog] = useState(false);
  
  const [startOdo, setStartOdo] = useState(user.lastOdometer?.toString() || '0');
  const [endOdo, setEndOdo] = useState('');
  const [grossInput, setGrossInput] = useState('');

  // Lógica de Sugestão de Meta Diária com proteção contra divisão por zero
  const suggestedGoal = useMemo(() => {
    if (!user) return 150;
    const consumption = user.calculatedAvgConsumption || 10;
    const dailyGoal = user.dailyGoal || 150;
    const dailyMaint = (user.maintenanceReservePercent / 100) * dailyGoal;
    const dailyEmerg = (user.emergencyReservePercent / 100) * dailyGoal;
    
    const avgKmPerDay = 150; 
    const fuelCost = (avgKmPerDay / consumption) * 6.0; 
    const totalCosts = dailyMaint + dailyEmerg + fuelCost;
    
    const suggested = totalCosts / 0.6; 
    return Math.ceil(suggested / 10) * 10; 
  }, [user]);

  const handleFinishRace = () => {
    onFinishRace(parseFloat(grossInput) || 0);
    setGrossInput('');
    setShowRaceGrossDialog(false);
  };

  const handleStartSession = () => {
    setPhase('PARTICULAR');
    setShowStartSessionDialog(false);
  };

  const currentRacesList = currentRaces || [];
  const currentExpensesList = currentDailyExpenses || [];

  const totalNetToday = currentRacesList.reduce((acc, r) => acc + (r.netProfit || 0), 0) - 
                        currentExpensesList.reduce((acc, e) => acc + (e.amount || 0), 0);
  
  const dailyGoalValue = user.dailyGoal || 150;
  const goalProgress = Math.min(100, Math.round((totalNetToday / dailyGoalValue) * 100));

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <header className="flex justify-between items-center pt-8 pb-4">
        <div className="max-w-[75%]">
          <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Drivers Intelligence</p>
          <h1 className="text-3xl font-black text-white leading-tight">{user.name}'s Friend</h1>
        </div>
        <div className="bg-white/10 border border-white/20 px-4 py-2 rounded-2xl text-[10px] font-black text-white uppercase flex items-center gap-2">
          <Droplets size={14} className="text-zinc-400" /> {(user.currentFuelLevel || 0).toFixed(1)}L
        </div>
      </header>

      {/* Insight de Metas */}
      <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-[2.5rem] shadow-2xl space-y-6">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <p className="text-zinc-500 text-[9px] font-black uppercase tracking-widest">Sua Eficiência</p>
            <h2 className="text-xl font-black text-white">Metas e Lucros</h2>
          </div>
          <div className="p-2 bg-white/5 rounded-full text-zinc-400">
            <Target size={18} />
          </div>
        </div>

        {user.dailyGoal < suggestedGoal && (
          <div className="bg-white p-4 rounded-3xl flex items-center gap-4 animate-in fade-in zoom-in-95 duration-500">
            <div className="bg-black p-2 rounded-xl">
               <TrendingUp className="text-white" size={20} />
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black text-zinc-500 uppercase">Meta Sugerida</p>
              <p className="text-xs text-black leading-tight font-black">
                Aumente para R$ {suggestedGoal} para cobrir seus custos atuais.
              </p>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <div className="flex justify-between text-[10px] font-black text-zinc-500 uppercase">
            <span>Progresso da Meta</span>
            <span>{goalProgress}%</span>
          </div>
          <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
            <div className="h-full bg-white transition-all duration-1000" style={{ width: `${goalProgress}%` }} />
          </div>
        </div>
      </div>

      {/* Operação */}
      <div className="space-y-4">
        {phase === 'IDLE' ? (
          <button 
            onClick={() => setShowStartSessionDialog(true)}
            className="w-full bg-white text-black p-8 rounded-[2.5rem] shadow-2xl flex flex-col items-center gap-4 active:scale-95 transition-all border-b-[6px] border-zinc-300"
          >
            <Play size={44} fill="black" />
            <h2 className="text-xl font-black uppercase tracking-tight">Iniciar Trabalho</h2>
          </button>
        ) : (
          <div className="bg-black border border-zinc-800 rounded-[2.5rem] p-8 text-white shadow-2xl space-y-6">
            <div className="flex justify-between items-center">
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Em Turno: {phase}</p>
              <button onClick={() => setShowFinishSessionDialog(true)} className="bg-white text-black px-4 py-2 rounded-xl text-[9px] font-black uppercase">Encerrar</button>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-zinc-900 p-5 rounded-3xl border border-zinc-800">
                <p className="text-zinc-500 text-[9px] font-black uppercase">Líquido</p>
                <p className="text-2xl font-black">R$ {totalNetToday.toFixed(2)}</p>
              </div>
              <div className="bg-zinc-900 p-5 rounded-3xl border border-zinc-800">
                <p className="text-zinc-500 text-[9px] font-black uppercase">Falta</p>
                <p className="text-2xl font-black">R$ {Math.max(0, user.dailyGoal - totalNetToday).toFixed(0)}</p>
              </div>
            </div>

            <div className="space-y-3">
              {phase === 'PARTICULAR' && (
                <button onClick={() => setPhase('DESLOCAMENTO')} className="w-full bg-white text-black py-5 rounded-3xl font-black text-lg flex items-center justify-center gap-3 active:scale-95 transition-all">
                  <Car size={24} /> NOVA CORRIDA
                </button>
              )}
              {phase === 'DESLOCAMENTO' && (
                <button onClick={() => setPhase('PASSAGEIRO')} className="w-full bg-white text-black py-5 rounded-3xl font-black text-lg flex items-center justify-center gap-3">
                  <Users size={24} /> EMBARCAR
                </button>
              )}
              {phase === 'PASSAGEIRO' && (
                <button onClick={() => setShowRaceGrossDialog(true)} className="w-full bg-white text-black py-5 rounded-3xl font-black text-lg flex items-center justify-center gap-3">
                  <CheckCircle size={24} /> FINALIZAR
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Atividade Recente */}
      <div className="bg-zinc-100 rounded-[2.5rem] p-6 border border-zinc-200 shadow-sm space-y-5">
        <h3 className="text-lg font-black text-black flex items-center gap-2">
          <Wallet size={20} /> Recentes
        </h3>
        
        <div className="space-y-3">
          {currentRacesList.length === 0 ? (
            <div className="py-10 text-center text-zinc-400 text-[10px] font-black uppercase border-2 border-dashed border-zinc-300 rounded-3xl">Sem atividades hoje</div>
          ) : (
            currentRacesList.slice().reverse().map(race => (
              <div key={race.id} className="bg-white p-5 rounded-3xl flex items-center justify-between border border-zinc-200 group">
                <div className="flex items-center gap-4">
                  <div className="bg-black text-white p-3 rounded-2xl"><Wallet size={18} /></div>
                  <div>
                    <p className="text-[9px] font-black text-zinc-400 uppercase">Líquido</p>
                    <p className="text-md font-black text-black">R$ {race.netProfit.toFixed(2)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-black text-zinc-500 uppercase">Bruto R$ {race.grossEarnings.toFixed(2)}</p>
                  <p className="text-[9px] font-bold text-zinc-300">{(race.kmDeslocamento + race.kmPassageiro).toFixed(1)} km</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modais */}
      {showRaceGrossDialog && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-[100] flex items-center justify-center p-8">
          <div className="bg-white w-full rounded-[2.5rem] p-8 space-y-6">
            <h2 className="text-2xl font-black text-black text-center uppercase">Valor da Corrida</h2>
            <div className="relative">
              <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-black text-zinc-300">R$</span>
              <input autoFocus required type="number" step="0.01" className="w-full bg-zinc-50 border-2 border-zinc-100 rounded-[2rem] pl-16 pr-6 py-6 text-3xl font-black outline-none focus:border-black" placeholder="0.00" value={grossInput} onChange={e => setGrossInput(e.target.value)} />
            </div>
            <button onClick={handleFinishRace} className="w-full bg-black text-white py-6 rounded-3xl font-black text-xl shadow-2xl">SALVAR</button>
            <button onClick={() => setShowRaceGrossDialog(false)} className="w-full text-zinc-400 font-black uppercase text-xs tracking-widest py-2">Cancelar</button>
          </div>
        </div>
      )}

      {showStartSessionDialog && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-[100] flex items-center justify-center p-8">
          <div className="bg-white w-full rounded-[2.5rem] p-8 space-y-6">
            <h2 className="text-xl font-black text-black text-center uppercase">Sincronizar KM</h2>
            <div className="bg-zinc-50 p-6 rounded-3xl border border-zinc-100">
              <label className="text-[10px] font-black text-zinc-400 uppercase block mb-2">Painel do Carro</label>
              <input type="number" className="w-full bg-white border-2 border-zinc-200 rounded-2xl px-6 py-4 text-2xl font-black outline-none focus:border-black" value={startOdo} onChange={e => setStartOdo(e.target.value)} />
            </div>
            <button onClick={handleStartSession} className="w-full bg-black text-white py-5 rounded-3xl font-black text-lg">ABRIR TURNO</button>
          </div>
        </div>
      )}

      {showFinishSessionDialog && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-[100] flex items-center justify-center p-8">
          <div className="bg-white w-full rounded-[3rem] p-10 space-y-8">
            <h2 className="text-2xl font-black text-black text-center uppercase">Encerrar Trabalho</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-zinc-50 p-6 rounded-3xl border border-zinc-100">
                <span className="text-xs font-black text-zinc-400 uppercase">Lucro Final</span>
                <span className="text-2xl font-black text-black">R$ {totalNetToday.toFixed(2)}</span>
              </div>
              <input required type="number" className="w-full bg-zinc-50 border-2 border-zinc-100 rounded-3xl px-8 py-6 text-xl font-black outline-none focus:border-black" placeholder="KM Final" value={endOdo} onChange={e => setEndOdo(e.target.value)} />
            </div>
            <div className="flex gap-4">
              <button onClick={() => setShowFinishSessionDialog(false)} className="flex-1 bg-zinc-100 py-5 rounded-3xl font-black text-zinc-400 uppercase text-xs">Voltar</button>
              <button onClick={() => onFinishSession(parseFloat(startOdo) || 0, parseFloat(endOdo) || 0)} className="flex-1 bg-black text-white py-5 rounded-3xl font-black uppercase text-xs">Encerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
