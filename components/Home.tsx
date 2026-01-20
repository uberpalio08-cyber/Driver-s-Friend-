import React, { useState, useMemo } from 'react';
import { UserProfile, TrackingPhase, MaintenanceTask, Race, Expense } from '../types';
import { Play, Navigation, Users, Car, Droplets, Target, CheckCircle, Clock, MapPin, TrendingUp } from 'lucide-react';

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

const Home: React.FC<Props> = ({ user, phase, setPhase, kms, onFinishSession, onFinishRace, currentRaces, currentDailyExpenses }) => {
  const [showStartSessionDialog, setShowStartSessionDialog] = useState(false);
  const [showFinishSessionDialog, setShowFinishSessionDialog] = useState(false);
  const [showRaceGrossDialog, setShowRaceGrossDialog] = useState(false);
  const [startOdo, setStartOdo] = useState(user.lastOdometer?.toString() || '0');
  const [endOdo, setEndOdo] = useState('');
  const [grossInput, setGrossInput] = useState('');

  const totalNetToday = useMemo(() => {
    return currentRaces.reduce((acc, r) => acc + (r.netProfit || 0), 0) - 
           currentDailyExpenses.reduce((acc, e) => acc + (e.amount || 0), 0);
  }, [currentRaces, currentDailyExpenses]);

  const goalProgress = Math.min(100, Math.round((totalNetToday / (user.dailyGoal || 150)) * 100));
  const formatTime = (ts: number) => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="p-6 space-y-6">
      <header className="flex justify-between items-center pt-8 pb-4">
        <div>
          <p className="text-zinc-600 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Painel do Motorista</p>
          <h1 className="text-3xl font-black text-zinc-900 leading-tight">Olá, {user.name}</h1>
        </div>
        <div className="bg-zinc-900 border border-zinc-700 px-4 py-2 rounded-2xl text-[10px] font-black text-white uppercase flex items-center gap-2">
          <Droplets size={14} className="text-zinc-400" /> {user.currentFuelLevel.toFixed(1)}L
        </div>
      </header>

      {/* Meta Inteligente Card - Senta no meio da transição */}
      <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-[2.5rem] shadow-2xl space-y-5">
        <div className="flex justify-between items-center">
          <p className="text-zinc-500 text-[9px] font-black uppercase tracking-widest">Meta Bruta Diária</p>
          <Target size={16} className="text-zinc-400" />
        </div>
        <div className="flex items-baseline gap-2">
          <p className="text-3xl font-black text-white">R$ {user.dailyGoal.toFixed(0)}</p>
          <p className="text-[10px] text-zinc-500 font-bold uppercase">Objetivo</p>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-[10px] font-black text-zinc-500 uppercase">
            <span>Seu Progresso Hoje</span>
            <span>{goalProgress}%</span>
          </div>
          <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
            <div className="h-full bg-white transition-all duration-1000" style={{ width: `${goalProgress}%` }} />
          </div>
        </div>
        <p className="text-[8px] text-zinc-600 font-black uppercase tracking-widest leading-relaxed">
          Para garantir salário de R$ {user.desiredSalary} e pagar R$ {user.personalFixedCosts} em contas.
        </p>
      </div>

      <div className="space-y-4">
        {phase === 'IDLE' ? (
          <button onClick={() => setShowStartSessionDialog(true)} className="w-full bg-black text-white p-8 rounded-[2.5rem] shadow-2xl flex flex-col items-center gap-4 active:scale-95 transition-all">
            <Play size={44} fill="white" />
            <h2 className="text-xl font-black uppercase tracking-tight">Iniciar Turno</h2>
          </button>
        ) : (
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-[2.5rem] p-8 text-white shadow-2xl space-y-6">
            <div className="flex justify-between items-center">
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Em Serviço • {phase}</p>
              <button onClick={() => setShowFinishSessionDialog(true)} className="bg-white text-black px-4 py-2 rounded-xl text-[9px] font-black uppercase">Encerrar</button>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-black/50 p-5 rounded-3xl border border-white/5">
                <p className="text-zinc-500 text-[9px] font-black uppercase">Lucro Real</p>
                <p className="text-2xl font-black">R$ {totalNetToday.toFixed(2)}</p>
              </div>
              <div className="bg-black/50 p-5 rounded-3xl border border-white/5">
                <p className="text-zinc-500 text-[9px] font-black uppercase">KM Hoje</p>
                <p className="text-2xl font-black">{(kms.kmParticular + kms.kmDeslocamento + kms.kmPassageiro).toFixed(1)}</p>
              </div>
            </div>

            <div className="space-y-3">
              {phase === 'PARTICULAR' && <button onClick={() => setPhase('DESLOCAMENTO')} className="w-full bg-white text-black py-5 rounded-3xl font-black text-lg flex items-center justify-center gap-3 active:scale-95 transition-all"> <Navigation size={24} /> BUSCAR PAX </button>}
              {phase === 'DESLOCAMENTO' && <button onClick={() => setPhase('PASSAGEIRO')} className="w-full bg-white text-black py-5 rounded-3xl font-black text-lg flex items-center justify-center gap-3 active:scale-95 transition-all"> <Users size={24} /> INICIAR CORRIDA </button>}
              {phase === 'PASSAGEIRO' && <button onClick={() => setShowRaceGrossDialog(true)} className="w-full bg-white text-black py-5 rounded-3xl font-black text-lg flex items-center justify-center gap-3 active:scale-95 transition-all"> <CheckCircle size={24} /> FINALIZAR </button>}
            </div>
          </div>
        )}
      </div>

      <div className="space-y-5 pb-24">
        <h3 className="text-lg font-black text-white flex items-center gap-2 px-2">
          <Clock size={20} className="text-zinc-500" /> Atividade Recente
        </h3>
        
        <div className="space-y-4">
          {currentRaces.length === 0 ? (
            <div className="py-16 text-center text-zinc-600 text-[10px] font-black uppercase border-2 border-dashed border-zinc-800 rounded-[2rem]">Nenhuma corrida hoje</div>
          ) : (
            currentRaces.slice().reverse().map(race => (
              <div key={race.id} className="bg-zinc-900 border border-zinc-800 p-6 rounded-[2.5rem] space-y-4 shadow-xl">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Lucro Líquido</p>
                    <p className="text-2xl font-black text-white italic">R$ {race.netProfit.toFixed(2)}</p>
                  </div>
                  <div className="bg-white/5 px-3 py-1 rounded-full">
                    <p className="text-[10px] font-black text-zinc-400">R$ {race.grossEarnings.toFixed(2)} Bruto</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 py-4 border-y border-zinc-800/50">
                  <div className="flex items-center gap-3">
                    <Clock size={16} className="text-zinc-500" />
                    <div>
                      <p className="text-[8px] font-black text-zinc-600 uppercase">Horário</p>
                      <p className="text-[10px] font-bold text-white">{formatTime(race.acceptedAt)} - {formatTime(race.finishedAt)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin size={16} className="text-zinc-500" />
                    <div>
                      <p className="text-[8px] font-black text-zinc-600 uppercase">Percurso</p>
                      <p className="text-[10px] font-bold text-white">{(race.kmDeslocamento + race.kmPassageiro).toFixed(1)} km</p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center text-[9px] font-black text-zinc-600 uppercase">
                   <span>Manut: R$ {race.maintenanceReserve.toFixed(2)}</span>
                   <span>Gas: R$ {race.fuelCost.toFixed(2)}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modais de Entrada - Sempre Texto Preto em Fundo Branco/Claro */}
      {showRaceGrossDialog && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-[100] flex items-center justify-center p-8">
          <div className="bg-white w-full rounded-[2.5rem] p-8 space-y-6 shadow-2xl border border-zinc-200">
            <div className="text-center">
              <h2 className="text-2xl font-black text-black uppercase tracking-tighter">Valor Bruto</h2>
              <p className="text-[10px] text-zinc-400 font-bold uppercase mt-1">Insira o valor total que apareceu no App da Uber/99</p>
            </div>
            <div className="relative">
              <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-black text-zinc-400">R$</span>
              <input autoFocus type="number" step="0.01" className="w-full bg-zinc-100 border-2 border-zinc-200 rounded-[2rem] pl-16 pr-6 py-6 text-3xl font-black outline-none focus:border-black text-black" placeholder="0.00" value={grossInput} onChange={e => setGrossInput(e.target.value)} />
            </div>
            <button onClick={() => { onFinishRace(parseFloat(grossInput) || 0); setGrossInput(''); setShowRaceGrossDialog(false); }} className="w-full bg-black text-white py-6 rounded-3xl font-black text-xl shadow-xl active:scale-95 transition-all uppercase tracking-widest">Registrar Ganho</button>
            <button onClick={() => setShowRaceGrossDialog(false)} className="w-full text-zinc-400 font-black uppercase text-[10px] tracking-widest py-2">Voltar</button>
          </div>
        </div>
      )}

      {showStartSessionDialog && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-[100] flex items-center justify-center p-8">
          <div className="bg-white w-full rounded-[2.5rem] p-8 space-y-6 border border-zinc-200">
            <div className="text-center">
              <h2 className="text-xl font-black text-black uppercase tracking-tighter">Sincronizar Painel</h2>
              <p className="text-[10px] text-zinc-400 font-bold uppercase mt-1">Informe a kilometragem atual do veículo para controle de desgaste</p>
            </div>
            <input type="number" className="w-full bg-zinc-100 border-2 border-zinc-200 rounded-2xl px-6 py-5 text-2xl font-black outline-none focus:border-black text-black" value={startOdo} onChange={e => setStartOdo(e.target.value)} />
            <button onClick={() => { setPhase('PARTICULAR'); setShowStartSessionDialog(false); }} className="w-full bg-black text-white py-5 rounded-3xl font-black text-lg uppercase tracking-widest active:scale-95 transition-all">Começar Agora</button>
          </div>
        </div>
      )}

      {showFinishSessionDialog && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-[100] flex items-center justify-center p-8">
          <div className="bg-white w-full rounded-[3rem] p-10 space-y-8 text-center border border-zinc-200">
            <div>
              <h2 className="text-2xl font-black text-black uppercase tracking-tighter">Encerrar Turno</h2>
              <p className="text-zinc-400 text-[11px] font-bold uppercase mt-2 px-4">Informe o KM final para fechar o lucro real de hoje.</p>
            </div>
            <div className="text-left space-y-2">
               <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Kilometragem Final (Painel do Carro)</label>
               <input type="number" className="w-full bg-zinc-100 border-2 border-zinc-200 rounded-3xl px-8 py-6 text-2xl font-black outline-none text-black" placeholder="Ex: 85540" value={endOdo} onChange={e => setEndOdo(e.target.value)} />
            </div>
            <div className="flex gap-4">
              <button onClick={() => setShowFinishSessionDialog(false)} className="flex-1 bg-zinc-100 py-5 rounded-3xl font-black text-zinc-400 uppercase text-[10px] tracking-widest">Voltar</button>
              <button onClick={() => onFinishSession(parseFloat(startOdo) || 0, parseFloat(endOdo) || 0)} className="flex-1 bg-black text-white py-5 rounded-3xl font-black uppercase text-[10px] tracking-widest shadow-xl">Fechar Dia</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;