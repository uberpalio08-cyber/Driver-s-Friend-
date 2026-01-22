import React, { useState, useMemo, useEffect } from 'react';
import { UserProfile, TrackingPhase, Race, AppProfile, MaintenanceTask } from '../types';
import { Play, UserPlus, Users, Flag, Gauge, Settings, Trash2, Clock, Navigation, ChevronDown, ChevronUp, Fuel, UserCircle, MapPin, Check, Info } from 'lucide-react';

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
  
  const [newApp, setNewApp] = useState({ name: '', tax: '', isFixed: false, fixedVal: '' });

  const { netTotal, progress, selectedApp } = useMemo(() => {
    const net = (currentRaces || []).reduce((acc, r) => acc + r.netProfit, 0);
    const prog = Math.min(100, (net / (user.dailyGoal || 1)) * 100);
    const app = user.appProfiles.find(p => p.id === user.selectedAppProfileId);
    return { netTotal: net, progress: prog, selectedApp: app };
  }, [currentRaces, user.dailyGoal, user.appProfiles, user.selectedAppProfileId]);

  useEffect(() => {
    if (showGross && selectedApp?.isFixedGross) {
      setGrossInput(selectedApp.fixedGrossValue.toString());
    } else if (showGross) {
      setGrossInput('');
    }
  }, [showGross, selectedApp]);

  return (
    <div className="space-y-6 pb-40">
      <header className="flex justify-between items-center pt-4 px-1">
        <div>
          <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest mb-1">Operacional Ativo</p>
          <h1 className="text-2xl font-black italic text-white tracking-tighter leading-none">{user.name}'s Friend</h1>
        </div>
        <div className="bg-slate-900 px-4 py-2 rounded-2xl border border-white/10 shadow-xl flex items-center gap-2">
           <Gauge size={14} className="text-blue-500" />
           <span className="text-xs font-black text-white">{user.lastOdometer.toLocaleString()} KM</span>
        </div>
      </header>

      <div className="bg-slate-900 p-8 rounded-[2.5rem] border-l-8 border-blue-600 shadow-2xl">
         <p className="text-[10px] font-black uppercase text-slate-500 mb-2 tracking-widest">Lucro Livre (Limpo)</p>
         <p className="text-5xl font-black italic text-white tracking-tighter leading-none mb-6">R$ {netTotal.toFixed(2)}</p>
         <div className="h-3 bg-slate-950 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 transition-all duration-1000" style={{width: `${progress}%`}} />
         </div>
         <p className="text-[9px] font-black text-blue-400 mt-3 uppercase tracking-widest text-right">{progress.toFixed(0)}% Meta</p>
      </div>

      <div className="space-y-4">
        {phase === 'IDLE' ? (
          <button onClick={() => setShowAppConfig(true)} className="w-full bg-blue-600 text-white py-16 rounded-[3rem] shadow-2xl border-b-8 border-blue-800 flex flex-col items-center gap-4 active:scale-95 transition-all">
            <Play size={48} fill="white" />
            <span className="text-2xl font-black uppercase italic">Abrir Expediente</span>
          </button>
        ) : (
          <div className="space-y-4 animate-up">
            <div className="flex gap-4">
               <button onClick={() => setShowAppConfig(true)} className="flex-1 bg-slate-900 p-5 rounded-2xl flex items-center justify-between border border-white/5">
                  <div className="text-left overflow-hidden">
                     <p className="text-[8px] font-black text-slate-500 uppercase mb-1">App Selecionado</p>
                     <p className="text-xs font-black text-white italic truncate">{selectedApp?.name || 'Selecione App'}</p>
                  </div>
                  <Settings size={18} className="text-blue-500" />
               </button>
               <button onClick={() => { setOdoInput(''); setShowOdo(true); }} className="bg-rose-950 text-rose-500 px-6 rounded-2xl font-black uppercase text-[10px] border border-rose-500/20 shadow-xl">Encerrar</button>
            </div>

            {phase === 'ON_SHIFT' && (
              <button onClick={() => setPhase('ACCEPTING')} className="w-full bg-blue-600 text-white py-10 rounded-[3rem] font-black uppercase italic text-xl border-b-8 border-blue-800 shadow-2xl flex items-center justify-center gap-4 active:scale-95">
                <UserPlus size={32} /> Aceitar Corrida
              </button>
            )}
            {phase === 'ACCEPTING' && (
              <button onClick={() => setPhase('BOARDING')} className="w-full bg-white text-black py-10 rounded-[3rem] font-black uppercase italic text-xl border-b-8 border-slate-300 shadow-2xl flex items-center justify-center gap-4 active:scale-95">
                <Users size={32} /> Iniciar Viagem
              </button>
            )}
            {phase === 'BOARDING' && (
              <button onClick={() => setShowGross(true)} className="w-full bg-emerald-600 text-white py-10 rounded-[3rem] font-black uppercase italic text-xl border-b-8 border-emerald-800 shadow-2xl flex items-center justify-center gap-4 active:scale-95">
                <Flag size={32} /> Finalizar Corrida
              </button>
            )}
          </div>
        )}
      </div>

      {showAppConfig && (
        <div className="fixed inset-0 bg-slate-950/98 backdrop-blur-2xl z-[200] flex items-center justify-center p-6">
          <div className="w-full max-w-sm p-8 bg-slate-900 border border-white/10 rounded-[3rem] shadow-2xl space-y-6 animate-up max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-black italic uppercase text-white tracking-tighter text-center leading-none">Apps de Trabalho</h2>
            
            <div className="space-y-3">
                 {user.appProfiles.map(p => (
                   <div key={p.id} className="flex gap-2">
                      <button onClick={() => onUpdateUser({...user, selectedAppProfileId: p.id})} className={`flex-1 p-5 rounded-2xl border flex justify-between items-center transition-all ${user.selectedAppProfileId === p.id ? 'bg-blue-600 border-blue-400 text-white shadow-lg' : 'bg-slate-950 border-white/5 text-slate-500'}`}>
                          <span className="font-black uppercase italic text-sm">{p.name}</span>
                          <span className="text-xs font-bold opacity-70">{p.taxPercentage}%</span>
                      </button>
                      <button onClick={() => onUpdateUser({...user, appProfiles: user.appProfiles.filter(x => x.id !== p.id)})} className="p-5 bg-rose-900/20 text-rose-500 rounded-2xl border border-white/5"><Trash2 size={20}/></button>
                   </div>
                 ))}
            </div>

            <div className="bg-slate-950 p-6 rounded-[2rem] border border-white/10 space-y-4">
              <p className="text-[10px] font-black text-blue-500 uppercase text-center tracking-widest">Adicionar Novo App</p>
              <input className="w-full" placeholder="Ex: Uber Comfort" value={newApp.name} onChange={e => setNewApp({...newApp, name: e.target.value})} />
              <input className="w-full text-center" type="number" placeholder="Taxa do App (%)" value={newApp.tax} onChange={e => setNewApp({...newApp, tax: e.target.value})} />
              
              <div className="flex bg-slate-900 p-1 rounded-2xl">
                <button onClick={() => setNewApp({...newApp, isFixed: !newApp.isFixed})} className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase transition-all ${newApp.isFixed ? 'bg-blue-600 text-white' : 'text-slate-600'}`}>Ganho Fixo?</button>
              </div>
              {newApp.isFixed && (
                <input className="w-full text-center" type="number" placeholder="Valor Bruto (R$)" value={newApp.fixedVal} onChange={e => setNewApp({...newApp, fixedVal: e.target.value})} />
              )}
              
              <button onClick={() => {
                if(!newApp.name || !newApp.tax) return;
                const p: AppProfile = { 
                  id: Date.now().toString(), 
                  name: newApp.name, 
                  taxPercentage: parseFloat(newApp.tax) || 0, 
                  isFixedGross: newApp.isFixed, 
                  fixedGrossValue: parseFloat(newApp.fixedVal) || 0 
                };
                onUpdateUser({ ...user, appProfiles: [...user.appProfiles, p], selectedAppProfileId: p.id });
                setNewApp({ name: '', tax: '', isFixed: false, fixedVal: '' });
              }} className="w-full bg-blue-600 text-white font-black text-[11px] py-4 rounded-xl uppercase shadow-xl">Criar Perfil</button>
            </div>
            
            <button onClick={() => { if(!selectedApp) return alert("Selecione um App"); setShowAppConfig(false); setOdoInput(''); setShowOdo(true); }} className="w-full bg-blue-600 text-white py-6 rounded-[2rem] font-black text-lg uppercase italic shadow-2xl border-b-4 border-blue-800">Iniciar Expediente</button>
          </div>
        </div>
      )}

      {showOdo && (
        <div className="fixed inset-0 bg-slate-950/98 z-[210] flex items-center justify-center p-6">
          <div className="w-full max-w-sm p-10 bg-slate-900 border border-white/10 rounded-[3rem] space-y-8 animate-up shadow-2xl text-center">
            <h2 className="text-2xl font-black uppercase italic text-white">KM Atual</h2>
            <input autoFocus type="number" className="w-full py-12 text-6xl font-black text-center !bg-slate-950 !text-white rounded-[2rem] border-2 border-blue-500/20" placeholder="000000" value={odoInput} onChange={e => setOdoInput(e.target.value)} />
            <button onClick={() => { 
              const val = parseFloat(odoInput);
              if(!val) return;
              if(phase === 'IDLE') { setPhase('ON_SHIFT'); onUpdateUser({...user, lastOdometer: val}); } 
              else { onFinishShift(val); } 
              setShowOdo(false); 
            }} className="w-full bg-blue-600 text-white py-8 rounded-[2rem] font-black text-2xl uppercase italic border-b-8 border-blue-800 active:scale-95">Confirmar</button>
          </div>
        </div>
      )}

      {showGross && (
        <div className="fixed inset-0 bg-slate-950/98 z-[210] flex items-center justify-center p-6">
          <div className="w-full max-w-sm p-10 bg-slate-900 border border-white/10 rounded-[3rem] space-y-8 animate-up shadow-2xl text-center">
            <h2 className="text-2xl font-black uppercase italic text-white leading-none">Valor da Corrida</h2>
            <p className="text-[10px] font-black text-slate-500 uppercase -mt-6">App: {selectedApp?.name}</p>
            <input autoFocus type="number" step="0.01" className="w-full py-12 text-6xl font-black text-center !bg-slate-950 !text-white rounded-[2rem] border-2 border-blue-500/20" placeholder="0,00" value={grossInput} onChange={e => setGrossInput(e.target.value)} />
            <button onClick={() => { 
              const val = parseFloat(grossInput);
              onFinishRace(val || 0);
              setShowGross(false); 
            }} className="w-full bg-emerald-600 text-white py-8 rounded-[2rem] font-black text-2xl uppercase italic border-b-8 border-emerald-800 active:scale-95">Cobrar Viagem</button>
          </div>
        </div>
      )}
    </div>
  );
};
export default Home;