import React, { useState, useMemo, useEffect } from 'react';
import { UserProfile, TrackingPhase, Race, AppProfile, MaintenanceTask } from '../types';
import { Play, UserPlus, Users, Flag, Gauge, Settings, Trash2, Clock, CheckCircle2, Navigation, MapPin } from 'lucide-react';

interface Props {
  user: UserProfile;
  phase: TrackingPhase;
  setPhase: (p: TrackingPhase) => void;
  kms: { particular: number; deslocamento: number; passageiro: number };
  currentRaces: Race[];
  maintenance: MaintenanceTask[];
  onFinishRace: (gross: number) => void;
  onRemoveRace: (id: string) => void;
  onFinishShift: (odo: number) => void;
  onUpdateUser: (u: UserProfile) => void;
}

const Home: React.FC<Props> = ({ user, phase, setPhase, kms, currentRaces = [], maintenance = [], onFinishRace, onRemoveRace, onFinishShift, onUpdateUser }) => {
  const [showOdo, setShowOdo] = useState(false);
  const [showGross, setShowGross] = useState(false);
  const [showAppConfig, setShowAppConfig] = useState(false);
  const [odoInput, setOdoInput] = useState('');
  const [grossInput, setGrossInput] = useState('');

  const { netTotal, progress, selectedApp } = useMemo(() => {
    const net = currentRaces.reduce((acc, r) => acc + r.netProfit, 0);
    const prog = Math.min(100, (net / (user.dailyGoal || 1)) * 100);
    const app = user.appProfiles.find(p => p.id === user.selectedAppProfileId);
    return { netTotal: net, progress: prog, selectedApp: app };
  }, [currentRaces, user.dailyGoal, user.appProfiles, user.selectedAppProfileId]);

  return (
    <div className="space-y-6 pb-40">
      <header className="flex justify-between items-center pt-4 px-1">
        <div>
          <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest mb-1">Operacional Ativo</p>
          <h1 className="text-2xl font-black italic text-white tracking-tighter leading-none">{user.name}</h1>
        </div>
        <div className="bg-slate-900 px-4 py-2 rounded-2xl border border-white/10 shadow-xl flex items-center gap-2">
           <Gauge size={14} className="text-blue-500" />
           <span className="text-xs font-black text-white">{user.lastOdometer.toLocaleString()} KM</span>
        </div>
      </header>

      <div className="bg-slate-900 p-8 rounded-[2.5rem] border-l-8 border-blue-600 shadow-2xl">
         <p className="text-[10px] font-black uppercase text-slate-500 mb-2 tracking-widest">Lucro do Expediente (Líquido)</p>
         <p className="text-5xl font-black italic text-white tracking-tighter leading-none mb-6">R$ {netTotal.toFixed(2)}</p>
         <div className="h-3 bg-slate-950 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 transition-all duration-1000" style={{width: `${progress}%`}} />
         </div>
         <p className="text-[9px] font-black text-blue-400 mt-3 uppercase tracking-widest text-right">{progress.toFixed(0)}% Meta Diária</p>
      </div>

      <div className="space-y-4">
        {phase === 'IDLE' ? (
          <button onClick={() => setShowAppConfig(true)} className="w-full bg-blue-600 text-white py-16 rounded-[3rem] shadow-2xl border-b-8 border-blue-800 flex flex-col items-center gap-4 active:scale-95 transition-all">
            <Play size={48} fill="white" />
            <span className="text-2xl font-black uppercase italic">Abrir Expediente</span>
          </button>
        ) : (
          <div className="space-y-4">
            <div className="flex gap-4">
               <button onClick={() => setShowAppConfig(true)} className="flex-1 bg-slate-900 p-5 rounded-2xl flex items-center justify-between border border-white/5">
                  <div className="text-left overflow-hidden">
                     <p className="text-[8px] font-black text-slate-500 uppercase mb-1">App</p>
                     <p className="text-xs font-black text-white italic truncate">{selectedApp?.name || 'Selecione'}</p>
                  </div>
                  <Settings size={18} className="text-blue-500" />
               </button>
               <button onClick={() => { setOdoInput(''); setShowOdo(true); }} className="bg-rose-950 text-rose-500 px-6 rounded-2xl font-black uppercase text-[10px] border border-rose-500/20 shadow-xl">Encerrar</button>
            </div>

            {phase === 'ON_SHIFT' && (
              <button onClick={() => setPhase('ACCEPTING')} className="w-full bg-blue-600 text-white py-10 rounded-[3rem] font-black uppercase italic text-xl border-b-8 border-blue-800 shadow-2xl flex items-center justify-center gap-4 active:scale-95">
                <Navigation size={32} /> Buscar Passageiro
              </button>
            )}
            {phase === 'ACCEPTING' && (
              <button onClick={() => setPhase('BOARDING')} className="w-full bg-white text-black py-10 rounded-[3rem] font-black uppercase italic text-xl border-b-8 border-slate-300 shadow-2xl flex items-center justify-center gap-4 active:scale-95">
                <Users size={32} /> Iniciar Viagem
              </button>
            )}
            {phase === 'BOARDING' && (
              <button onClick={() => setShowGross(true)} className="w-full bg-emerald-600 text-white py-10 rounded-[3rem] font-black uppercase italic text-xl border-b-8 border-emerald-800 shadow-2xl flex items-center justify-center gap-4 active:scale-95">
                <Flag size={32} /> Finalizar & Receber
              </button>
            )}
          </div>
        )}
      </div>

      {/* CARDS DE DETALHAMENTO DE CORRIDA */}
      {currentRaces.length > 0 && (
        <div className="space-y-4 pt-6 animate-up">
           <h3 className="text-[10px] font-black text-slate-600 uppercase tracking-widest px-1">Corridas Concluídas Hoje</h3>
           <div className="space-y-3">
              {[...currentRaces].reverse().map(r => (
                <div key={r.id} className="bg-slate-900/40 border border-white/5 p-5 rounded-[2rem] flex justify-between items-center shadow-lg">
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-600/10 rounded-2xl flex items-center justify-center text-blue-500">
                         <CheckCircle2 size={24} />
                      </div>
                      <div>
                         <p className="text-xs font-black text-white italic uppercase">{r.appName}</p>
                         <p className="text-[8px] font-bold text-slate-600 uppercase tracking-tighter">Recebido: R$ {r.grossEarnings.toFixed(2)}</p>
                      </div>
                   </div>
                   <div className="text-right">
                      <p className="text-lg font-black text-emerald-400 italic leading-none">+ R$ {r.netProfit.toFixed(2)}</p>
                      <p className="text-[8px] font-black text-slate-700 uppercase mt-1">Líquido</p>
                   </div>
                </div>
              ))}
           </div>
        </div>
      )}

      {/* MODAL KM */}
      {showOdo && (
        <div className="fixed inset-0 bg-slate-950/98 z-[300] flex items-center justify-center p-6">
          <div className="w-full max-w-sm p-10 bg-slate-900 border border-white/10 rounded-[3rem] space-y-8 animate-up shadow-2xl text-center">
            <h2 className="text-2xl font-black uppercase italic text-white">Hodômetro Atual</h2>
            <input autoFocus type="number" className="w-full py-12 text-5xl font-black text-center !bg-slate-950 !text-white rounded-[2rem] border-2 border-blue-500/20" value={odoInput} onChange={e => setOdoInput(e.target.value)} />
            <button onClick={() => { 
              const val = parseFloat(odoInput);
              if(!val) return;
              if(phase === 'IDLE') { setPhase('ON_SHIFT'); onUpdateUser({...user, lastOdometer: val}); } 
              else { onFinishShift(val); } 
              setShowOdo(false); 
            }} className="w-full bg-blue-600 text-white py-8 rounded-[2rem] font-black text-2xl uppercase italic border-b-8 border-blue-800">Confirmar</button>
          </div>
        </div>
      )}

      {/* MODAL RECEBIMENTO */}
      {showGross && (
        <div className="fixed inset-0 bg-slate-950/98 z-[300] flex items-center justify-center p-6">
          <div className="w-full max-w-sm p-10 bg-slate-900 border border-white/10 rounded-[3rem] space-y-8 animate-up shadow-2xl text-center">
            <h2 className="text-2xl font-black uppercase italic text-white">Valor Recebido</h2>
            <input autoFocus type="number" step="0.01" className="w-full py-12 text-5xl font-black text-center !bg-slate-950 !text-white rounded-[2rem] border-2 border-emerald-500/20" value={grossInput} onChange={e => setGrossInput(e.target.value)} />
            <button onClick={() => { 
              const val = parseFloat(grossInput);
              if(!val) return;
              onFinishRace(val);
              setShowGross(false); 
              setGrossInput('');
            }} className="w-full bg-emerald-600 text-white py-8 rounded-[2rem] font-black text-2xl uppercase italic border-b-8 border-emerald-800">Confirmar & Fechar</button>
          </div>
        </div>
      )}

      {showAppConfig && (
        <div className="fixed inset-0 bg-slate-950/98 backdrop-blur-2xl z-[300] flex items-center justify-center p-6">
          <div className="w-full max-w-sm p-8 bg-slate-900 border border-white/10 rounded-[3rem] shadow-2xl space-y-6 animate-up">
            <h2 className="text-xl font-black italic uppercase text-white tracking-tighter text-center">Configurar Apps</h2>
            {user.appProfiles.length === 0 ? (
               <div className="bg-slate-950 p-6 rounded-2xl text-center">
                  <p className="text-xs text-slate-500 uppercase font-black">Nenhum App Cadastrado</p>
                  <button onClick={() => onUpdateUser({...user, appProfiles: [{id:'1', name:'Uber X', taxPercentage:25, isFixedGross:false, fixedGrossValue:0}]})} className="mt-4 text-blue-500 text-[10px] font-black uppercase">Adicionar Padrão</button>
               </div>
            ) : (
              <div className="space-y-3 max-h-40 overflow-y-auto">
                {user.appProfiles.map(p => (
                  <button key={p.id} onClick={() => { onUpdateUser({...user, selectedAppProfileId: p.id}); setShowAppConfig(false); if(phase === 'IDLE') setShowOdo(true); }} className={`w-full p-4 rounded-xl border flex justify-between items-center ${user.selectedAppProfileId === p.id ? 'bg-blue-600 border-blue-400' : 'bg-slate-950 border-white/5'}`}>
                    <span className="font-black italic uppercase text-xs">{p.name}</span>
                    <span className="text-[10px] opacity-60">{p.taxPercentage}%</span>
                  </button>
                ))}
              </div>
            )}
            <button onClick={() => setShowAppConfig(false)} className="w-full text-slate-600 font-black text-[10px] uppercase">Voltar</button>
          </div>
        </div>
      )}
    </div>
  );
};
export default Home;