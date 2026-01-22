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
  const [expandedRaceId, setExpandedRaceId] = useState<string | null>(null);
  
  const [newApp, setNewApp] = useState({ name: '', tax: '12', isFixed: false, fixedVal: '15.00' });

  // Consolidação Inteligente: Um único useMemo para todas as estatísticas principais
  const { netTotal, progress, currentMaintRate, selectedApp } = useMemo(() => {
    const net = (currentRaces || []).reduce((acc, r) => acc + r.netProfit, 0);
    const prog = Math.min(100, (net / (user.dailyGoal || 1)) * 100);
    
    const maintRate = (!maintenance || maintenance.length === 0) 
      ? 0.12 
      : maintenance.reduce((acc, task) => acc + ((Number(task.lastCost) || 0) / (Number(task.interval) || 1)), 0);

    const app = user.appProfiles.find(p => p.id === user.selectedAppProfileId);

    return { netTotal: net, progress: prog, currentMaintRate: maintRate, selectedApp: app };
  }, [currentRaces, user.dailyGoal, maintenance, user.appProfiles, user.selectedAppProfileId]);

  // Efeito unificado para preenchimento de valor bruto fixo
  useEffect(() => {
    if (showGross) {
      setGrossInput(selectedApp?.isFixedGross ? selectedApp.fixedGrossValue.toString() : '');
    }
  }, [showGross, selectedApp]);

  const formatTime = (ts: number) => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const totalCurrentKm = kms.deslocamento + kms.passageiro;

  return (
    <div className="space-y-5 pb-40">
      <header className="flex justify-between items-center pt-3 px-1">
        <div>
          <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest mb-1 opacity-70">Operacional Ativo</p>
          <h1 className="text-xl font-black italic text-white tracking-tighter leading-none">{user.name}'s Friend</h1>
        </div>
        <div className="flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-full border border-white/5 shadow-xl">
           <Gauge size={12} className="text-blue-500" />
           <span className="text-[10px] font-black text-slate-300 uppercase">{user.lastOdometer.toLocaleString()} KM</span>
        </div>
      </header>

      {/* DASHBOARD DE LUCRO LÍQUIDO */}
      <div className="bento-card p-6 border-l-4 border-blue-500 bg-slate-800/10 shadow-2xl relative overflow-hidden">
        <div className="flex justify-between items-start mb-4 relative z-10">
          <div>
            <p className="text-[10px] font-black uppercase text-slate-500 mb-1 tracking-widest">Lucro Livre (Limpo)</p>
            <p className="text-4xl font-black italic text-white tracking-tighter leading-none">R$ {netTotal.toFixed(2)}</p>
          </div>
          <div className="text-right">
             <p className="text-[10px] font-black text-blue-400 uppercase leading-none">{progress.toFixed(0)}% Meta</p>
          </div>
        </div>
        <div className="h-2 bg-slate-950 rounded-full overflow-hidden shadow-inner relative z-10">
           <div className="h-full bg-blue-500 transition-all duration-1000 shadow-[0_0_20px_rgba(59,130,246,0.6)]" style={{width: `${progress}%`}} />
        </div>
      </div>

      {/* CONTROLES DE EXPEDIENTE */}
      <div className="space-y-3">
        {phase === 'IDLE' ? (
          <button onClick={() => setShowAppConfig(true)} className="w-full bg-blue-600 text-white py-14 rounded-[3rem] shadow-2xl flex flex-col items-center gap-3 border-b-8 border-blue-800 active:scale-95 transition-all">
            <Play size={44} fill="white" />
            <span className="text-xl font-black uppercase italic tracking-tighter">Iniciar Expediente</span>
          </button>
        ) : (
          <div className="space-y-3 animate-up">
            <div className="flex gap-3">
               <button onClick={() => setShowAppConfig(true)} className="flex-1 bg-slate-900 border border-white/5 p-4 rounded-2xl flex items-center justify-between shadow-xl">
                  <div className="text-left">
                     <p className="text-[7px] font-black text-slate-500 uppercase">App Selecionado</p>
                     <p className="text-[12px] font-black text-white uppercase italic truncate max-w-[120px]">{selectedApp?.name || '---'}</p>
                  </div>
                  <Settings size={16} className="text-blue-500" />
               </button>
               <button onClick={() => { setOdoInput(''); setShowOdo(true); }} className="px-5 bg-rose-600/10 border border-rose-500/20 py-4 rounded-2xl text-rose-500 font-black uppercase text-[9px] tracking-widest shadow-xl">Encerrar</button>
            </div>

            {phase === 'ON_SHIFT' && (
              <button onClick={() => setPhase('ACCEPTING')} className="w-full bg-blue-600 text-white py-9 rounded-[2.5rem] font-black uppercase italic text-lg shadow-xl border-b-8 border-blue-800 flex items-center justify-center gap-4 active:scale-95 transition-all">
                <UserPlus size={28} /> Aceitar Corrida
              </button>
            )}
            {phase === 'ACCEPTING' && (
              <button onClick={() => setPhase('BOARDING')} className="w-full bg-white text-black py-9 rounded-[2.5rem] font-black uppercase italic text-lg shadow-xl border-b-8 border-slate-300 flex items-center justify-center gap-4 active:scale-95 transition-all">
                <Users size={28} /> Iniciar Viagem (Pax)
              </button>
            )}
            {phase === 'BOARDING' && (
              <button onClick={() => setShowGross(true)} className="w-full bg-emerald-600 text-white py-9 rounded-[2.5rem] font-black uppercase italic text-lg shadow-xl border-b-8 border-emerald-800 flex items-center justify-center gap-4 active:scale-95 transition-all">
                <Flag size={28} /> Finalizar Viagem
              </button>
            )}
          </div>
        )}
      </div>

      {/* LISTA DE CORRIDAS */}
      {currentRaces.length > 0 && (
        <div className="space-y-3 animate-up">
          <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest px-1">Ganhos Reais da Sessão</p>
          <div className="space-y-3">
            {[...currentRaces].reverse().map(race => {
              const isExpanded = expandedRaceId === race.id;
              const totalKm = race.kmDeslocamento + race.kmPassageiro;
              
              return (
                <div key={race.id} className={`bento-card overflow-hidden border-l-4 transition-all ${isExpanded ? 'bg-slate-900 border-l-blue-500' : 'bg-slate-900/40 border-l-emerald-500 shadow-md'}`}>
                  <div onClick={() => setExpandedRaceId(isExpanded ? null : race.id)} className="p-4 flex justify-between items-center cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center text-blue-500 shadow-inner"><Navigation size={18} /></div>
                      <div>
                        <p className="text-xs font-black text-white uppercase italic">{race.appName}</p>
                        <p className="text-[8px] font-bold text-slate-500 uppercase mt-1">{totalKm.toFixed(1)} KM • {formatTime(race.endTime)}</p>
                      </div>
                    </div>
                    <div className="text-right flex items-center gap-3">
                      <div>
                        <p className="text-sm font-black text-emerald-400 italic">R$ {race.netProfit.toFixed(2)}</p>
                        <p className="text-[7px] font-bold text-slate-600 uppercase">Lucro Limpo</p>
                      </div>
                      <ChevronDown size={14} className={`text-slate-700 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="px-4 pb-5 space-y-4 animate-up border-t border-white/5 pt-4">
                      <div className="bg-slate-950/60 rounded-2xl p-4 space-y-2 border border-white/5">
                        <div className="flex justify-between items-center">
                          <span className="text-[9px] font-black text-slate-500 uppercase">Valor Bruto</span>
                          <span className="text-sm font-black text-white italic">R$ {race.grossEarnings.toFixed(2)}</span>
                        </div>
                        <div className="h-px bg-white/5 my-1" />
                        <div className="flex justify-between items-center">
                          <span className="text-[9px] font-black text-rose-500 uppercase flex items-center gap-1"><Trash2 size={8}/> Taxa do App</span>
                          <span className="text-[11px] font-black text-rose-400">- R$ {race.appTax.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-[9px] font-black text-rose-500 uppercase flex items-center gap-1"><Fuel size={8}/> Combustível</span>
                          <span className="text-[11px] font-black text-rose-400">- R$ {race.fuelCost.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="flex flex-col">
                            <span className="text-[9px] font-black text-rose-500 uppercase flex items-center gap-1"><Gauge size={8}/> Reserva Mecânica</span>
                            {totalKm === 0 && <span className="text-[6px] font-bold text-slate-600 uppercase ml-3 italic">Taxa: R$ {currentMaintRate.toFixed(3)}/KM</span>}
                          </div>
                          <span className="text-[11px] font-black text-rose-400">- R$ {race.maintReserve.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-[9px] font-black text-rose-500 uppercase flex items-center gap-1"><UserCircle size={8}/> Reserva Pessoal</span>
                          <span className="text-[11px] font-black text-rose-400">- R$ {race.personalReserve.toFixed(2)}</span>
                        </div>
                        <div className="h-px bg-white/5 my-1" />
                        <div className="flex justify-between items-center pt-1">
                          <span className="text-[10px] font-black text-emerald-500 uppercase italic">Seu Lucro (Limpo)</span>
                          <span className="text-xl font-black text-emerald-400 italic">R$ {race.netProfit.toFixed(2)}</span>
                        </div>
                      </div>
                      <button onClick={() => onRemoveRace(race.id)} className="w-full py-3 bg-rose-900/10 text-rose-500 rounded-xl font-black uppercase text-[8px] tracking-[0.2em] border border-rose-500/10">Apagar Registro</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODAL FECHAMENTO DE CORRIDA */}
      {showGross && (
        <div className="fixed inset-0 bg-slate-950/98 backdrop-blur-3xl z-[200] flex items-center justify-center p-6">
          <div className="w-full max-w-sm p-8 bg-slate-900 border border-white/10 rounded-[3rem] shadow-2xl space-y-6 animate-up">
            <div className="text-center">
               <h2 className="text-2xl font-black italic uppercase text-white tracking-tighter">
                 {selectedApp?.isFixedGross ? 'Confirmar Ganhos' : 'Finalizar Viagem'}
               </h2>
               <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1">App: {selectedApp?.name} • Taxa: {selectedApp?.taxPercentage}%</p>
            </div>
            
            <div className="space-y-4">
               <div className="relative">
                  <input autoFocus type="number" step="0.01" className="w-full py-10 text-6xl font-black text-center !text-white !bg-slate-950 border-2 border-blue-500/20" placeholder="0,00" value={grossInput} onChange={e => setGrossInput(e.target.value)} />
               </div>
               
               <div className="bg-slate-950 p-5 rounded-3xl border border-white/5 text-center flex flex-col items-center gap-1">
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest flex items-center justify-center gap-2">
                    <Navigation size={14} className="text-blue-500"/> GPS: {totalCurrentKm.toFixed(2)} KM
                  </p>
                  {totalCurrentKm === 0 && (
                    <p className="text-[7px] font-bold text-amber-500 uppercase italic">Atenção: KM zerado impede reserva mecânica.</p>
                  )}
               </div>
            </div>
            
            <button onClick={() => { onFinishRace(parseFloat(grossInput) || 0); setShowGross(false); }} className="w-full bg-emerald-600 text-white py-7 rounded-[2rem] font-black text-xl uppercase italic border-b-8 border-emerald-800 shadow-xl transition-all active:scale-95">
              Confirmar & Finalizar
            </button>
            <button onClick={() => setShowGross(false)} className="text-[10px] font-black text-slate-600 uppercase tracking-widest text-center py-2 w-full">Voltar</button>
          </div>
        </div>
      )}

      {/* MODAL HODÔMETRO */}
      {showOdo && (
        <div className="fixed inset-0 bg-slate-950/98 z-[210] flex items-center justify-center p-6">
          <div className="w-full max-w-sm p-8 bg-slate-900 border border-white/10 rounded-[3rem] space-y-6 animate-up shadow-2xl">
            <h2 className="text-xl font-black uppercase italic text-white tracking-tighter text-center">KM do Veículo</h2>
            <input autoFocus type="number" className="w-full py-12 text-5xl font-black text-center !bg-slate-950 !text-white" placeholder="000000" value={odoInput} onChange={e => setOdoInput(e.target.value)} />
            <button onClick={() => { 
              const val = parseFloat(odoInput);
              if(phase === 'IDLE') { setPhase('ON_SHIFT'); onUpdateUser({...user, lastOdometer: val}); } 
              else { onFinishShift(val); } 
              setShowOdo(false); 
            }} className="w-full bg-blue-600 text-white py-6 rounded-[2rem] font-black text-xl uppercase italic border-b-4 border-blue-800 shadow-xl active:scale-95">Confirmar</button>
          </div>
        </div>
      )}

      {/* CONFIGURAÇÃO DE APPS */}
      {showAppConfig && (
        <div className="fixed inset-0 bg-slate-950/98 backdrop-blur-2xl z-[200] flex items-center justify-center p-6 overflow-y-auto">
          <div className="w-full max-w-sm p-8 bg-slate-900 border border-white/10 rounded-[3rem] shadow-2xl space-y-5 animate-up">
            <h2 className="text-xl font-black italic uppercase text-white tracking-tighter text-center">Gestão de Apps</h2>
            
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                 {user.appProfiles.map(p => (
                   <div key={p.id} className="flex gap-2">
                      <button onClick={() => onUpdateUser({...user, selectedAppProfileId: p.id})} className={`flex-1 p-4 rounded-2xl border flex justify-between items-center transition-all ${user.selectedAppProfileId === p.id ? 'bg-blue-600 border-blue-400 text-white shadow-lg' : 'bg-slate-950 border-white/5 text-slate-500'}`}>
                          <span className="font-black uppercase italic text-xs">{p.name}</span>
                          <span className="text-[10px] font-bold opacity-70">{p.taxPercentage}%</span>
                      </button>
                      <button onClick={() => onUpdateUser({...user, appProfiles: user.appProfiles.filter(x => x.id !== p.id)})} className="p-4 bg-rose-900/20 text-rose-500 rounded-2xl border border-white/5"><Trash2 size={16}/></button>
                   </div>
                 ))}
            </div>

            <div className="pt-4 border-t border-white/5 space-y-3 bg-slate-950/50 p-5 rounded-3xl">
              <input className="w-full !text-xs !py-3.5" placeholder="Nome (Ex: Uber, 99, Particular)" value={newApp.name} onChange={e => setNewApp({...newApp, name: e.target.value})} />
              <div className="space-y-2">
                <label className="text-[8px] font-black text-blue-500 uppercase tracking-widest ml-1">Comissão App (%)</label>
                <input className="w-full !text-xs !py-3.5 text-center" type="number" placeholder="Ex: 12" value={newApp.tax} onChange={e => setNewApp({...newApp, tax: e.target.value})} />
              </div>
              <div className="flex bg-slate-900 p-1 rounded-2xl border border-white/5">
                <button onClick={() => setNewApp({...newApp, isFixed: !newApp.isFixed})} className={`flex-1 py-2.5 rounded-xl font-black text-[9px] uppercase transition-all ${newApp.isFixed ? 'bg-blue-600 text-white' : 'text-slate-600'}`}>Valor Bruto Fixo?</button>
              </div>
              {newApp.isFixed && (
                <div className="space-y-2">
                  <label className="text-[8px] font-black text-blue-500 uppercase tracking-widest ml-1">Ganho Fixo (R$)</label>
                  <input className="w-full !py-3.5 !text-center !text-xs" type="number" placeholder="Ex: 15.00" value={newApp.fixedVal} onChange={e => setNewApp({...newApp, fixedVal: e.target.value})} />
                </div>
              )}
              <button onClick={() => {
                if(!newApp.name) return;
                const p: AppProfile = { 
                  id: Date.now().toString(), 
                  name: newApp.name, 
                  taxPercentage: parseFloat(newApp.tax) || 0, 
                  isFixedGross: newApp.isFixed, 
                  fixedGrossValue: parseFloat(newApp.fixedVal) || 0 
                };
                onUpdateUser({ ...user, appProfiles: [...user.appProfiles, p], selectedAppProfileId: p.id });
                setNewApp({ name: '', tax: '12', isFixed: false, fixedVal: '15.00' });
              }} className="w-full bg-blue-600/10 text-blue-500 font-black text-[10px] py-4 rounded-xl border border-blue-500/20 uppercase">Salvar Novo App</button>
            </div>
            
            <button onClick={() => { if(!selectedApp) return alert("Selecione um App"); setShowAppConfig(false); setOdoInput(''); setShowOdo(true); }} className="w-full bg-blue-600 text-white py-6 rounded-[2rem] font-black text-lg uppercase italic shadow-2xl border-b-4 border-blue-800">Confirmar & Iniciar Turno</button>
          </div>
        </div>
      )}
    </div>
  );
};
export default Home;