
import React, { useState, useMemo, useEffect } from 'react';
import { UserProfile, TrackingPhase, Race, AppProfile, TripSession } from '../types';
import { Play, Users, Flag, Activity, Navigation, Plus, Smartphone, TrendingUp, XCircle, Clock, Fuel, Wrench, MapPin, AlertCircle } from 'lucide-react';

interface Props {
  user: UserProfile;
  phase: TrackingPhase;
  setPhase: (p: TrackingPhase) => void;
  currentRaces: Race[];
  sessions: TripSession[];
  trackedKm: number;
  onFinishRace: (gross: number, profile: AppProfile) => void;
  onFinishShift: (odo: number) => void;
  onStartShift: (odo: number) => void;
  onUpdateUser: (u: UserProfile) => void;
  onRemoveRace: (id: string) => void;
}

const Home: React.FC<Props> = ({ 
  user, phase, currentRaces = [], sessions = [], trackedKm,
  onFinishRace, onFinishShift, onStartShift, onUpdateUser, onRemoveRace 
}) => {
  const [showAppSelection, setShowAppSelection] = useState(false);
  const [showStartOdo, setShowStartOdo] = useState(false);
  const [showEndOdo, setShowEndOdo] = useState(false);
  const [showFinishRaceModal, setShowFinishRaceModal] = useState(false);
  const [showAddApp, setShowAddApp] = useState(false);
  
  const [reportPeriod, setReportPeriod] = useState<'D' | 'S' | 'M'>('D');
  const [odoInput, setOdoInput] = useState('');
  const [grossInput, setGrossInput] = useState('');

  const [newApp, setNewApp] = useState({ 
    name: '', isFixedValue: false, fixedAmount: '', taxPercentage: '' 
  });

  const haptic = (p: number = 20) => (window as any).NativeBridge.vibrate(p);
  const formatCurrency = (val: number) => val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const activeProfile = useMemo(() => 
    user.appProfiles.find(p => p.id === user.selectedAppProfileId) || user.appProfiles[0],
  [user.appProfiles, user.selectedAppProfileId]);

  const performance = useMemo(() => {
    const now = new Date();
    const filter = (date: number) => {
      const d = new Date(date);
      if (reportPeriod === 'D') return d.toDateString() === now.toDateString();
      if (reportPeriod === 'S') return d >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    };
    const periodRaces = [...currentRaces.filter(r => filter(r.date))];
    sessions.filter(s => filter(s.date)).forEach(s => periodRaces.push(...s.races));
    
    const net = periodRaces.reduce((acc, r) => acc + r.netProfit, 0);
    const gross = periodRaces.reduce((acc, r) => acc + r.grossEarnings, 0);
    const costs = periodRaces.reduce((acc, r) => acc + r.fuelCost + r.maintReserve + r.appTax, 0);
    
    return { net, gross, costs, count: periodRaces.length };
  }, [reportPeriod, sessions, currentRaces]);

  const handleStartExpediente = () => {
    if (user.appProfiles.length === 0) {
      setShowAddApp(true);
    } else {
      setShowAppSelection(true);
    }
  };

  const saveNewApp = () => {
    if (!newApp.name || !newApp.taxPercentage) return alert("Preencha o nome e a taxa do aplicativo.");
    const profile: AppProfile = {
      id: Date.now().toString(),
      name: newApp.name,
      taxValue: parseFloat(newApp.taxPercentage),
      isFixedTax: newApp.isFixedValue,
      defaultGross: parseFloat(newApp.fixedAmount) || 0
    };
    onUpdateUser({ 
      ...user, 
      appProfiles: [...user.appProfiles, profile], 
      selectedAppProfileId: profile.id 
    });
    setShowAddApp(false);
    setNewApp({ name: '', isFixedValue: false, fixedAmount: '', taxPercentage: '' });
    setShowAppSelection(true);
  };

  const handleFinishRaceClick = () => {
    const gross = parseFloat(grossInput);
    if (!gross || !activeProfile) return alert("Informe o valor bruto.");
    onFinishRace(gross, activeProfile);
    setShowFinishRaceModal(false);
    setGrossInput('');
    haptic(50);
  };

  const inputStyle = "w-full py-5 text-4xl font-black text-center bg-slate-950 text-white rounded-3xl border-2 border-slate-800 focus:border-blue-500 outline-none transition-all placeholder-slate-900";

  return (
    <div className="space-y-6 pb-40 animate-up">
      <header className="flex justify-between items-end pt-8 px-2">
        <div className="space-y-1">
          <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${phase !== 'IDLE' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-700'}`} /> 
            {phase === 'IDLE' ? 'TURNO ENCERRADO' : 'EXPEDIENTE ATIVO'}
          </p>
          <h1 className="text-3xl font-black italic text-white tracking-tighter leading-none">{user.name.split(' ')[0]}</h1>
        </div>
        <div className="bg-slate-900 border border-white/10 px-4 py-2 rounded-2xl flex items-center gap-3">
           <Activity size={14} className="text-blue-500" />
           <span className="text-sm font-black text-white italic">{user.lastOdometer} KM</span>
        </div>
      </header>

      {/* DASHBOARD PRINCIPAL */}
      <div className="bg-gradient-to-br from-slate-900 to-black p-8 rounded-[3rem] border border-white/10 shadow-2xl relative overflow-hidden">
         <div className="absolute top-0 right-0 p-8 opacity-5"><TrendingUp size={120} /></div>
         <p className="text-[10px] font-black uppercase text-slate-500 mb-2 tracking-widest">LUCRO REAL ({reportPeriod === 'D' ? 'HOJE' : reportPeriod === 'S' ? 'SEMANA' : 'MÊS'})</p>
         <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-blue-500 italic">R$</span>
            <p className="text-6xl font-black italic text-white tracking-tighter leading-none">{formatCurrency(performance.net)}</p>
         </div>
         
         <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="bg-white/5 p-3 rounded-2xl border border-white/5">
               <p className="text-[7px] font-black text-slate-500 uppercase">Faturamento Bruto</p>
               <p className="text-sm font-black text-white italic">R$ {formatCurrency(performance.gross)}</p>
            </div>
            <div className="bg-white/5 p-3 rounded-2xl border border-white/5">
               <p className="text-[7px] font-black text-slate-500 uppercase">Custos Acumulados</p>
               <p className="text-sm font-black text-rose-500 italic">R$ {formatCurrency(performance.costs)}</p>
            </div>
         </div>

         <div className="mt-6 flex gap-2">
            {(['D', 'S', 'M'] as const).map(p => (
              <button key={p} onClick={() => setReportPeriod(p)} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase transition-all ${reportPeriod === p ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-950 text-slate-600 border border-white/5'}`}>
                {p === 'D' ? 'DIA' : p === 'S' ? 'SEM' : 'MÊS'}
              </button>
            ))}
         </div>
      </div>

      {/* FLUXO DE TRABALHO */}
      <div className="px-2 space-y-4">
        {phase === 'IDLE' ? (
           <button 
             onClick={handleStartExpediente}
             className="w-full bg-blue-600 text-white py-12 rounded-[3.5rem] shadow-2xl border-b-8 border-blue-900 flex flex-col items-center gap-3 active:scale-95 transition-all"
           >
             <Play size={48} fill="white" />
             <span className="text-2xl font-black uppercase italic tracking-tight">Iniciar Expediente</span>
           </button>
        ) : (
          <div className="space-y-6">
            <div className="bg-slate-900/50 p-6 rounded-[2.5rem] border border-white/5 flex items-center justify-between">
               <div className="flex items-center gap-4">
                  <div className={`p-4 rounded-2xl ${phase === 'PASSAGEIRO' ? 'bg-emerald-600' : phase === 'DESLOCAMENTO' ? 'bg-blue-600' : 'bg-slate-800'} text-white`}>
                     {phase === 'PASSAGEIRO' ? <Users size={24}/> : phase === 'DESLOCAMENTO' ? <Navigation size={24} className="animate-pulse"/> : <Activity size={24}/>}
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest leading-none mb-1">{activeProfile?.name}</p>
                    <p className="text-2xl font-black text-white italic leading-none">{trackedKm.toFixed(2)} <span className="text-xs">KM</span></p>
                  </div>
               </div>
               <div className="text-right">
                  <p className="text-[8px] font-black text-slate-600 uppercase">Status</p>
                  <p className="text-[10px] font-black text-white uppercase italic">{phase === 'ON_SHIFT' ? 'EM ESPERA' : phase === 'DESLOCAMENTO' ? 'A CAMINHO' : 'CORRIDA'}</p>
               </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {phase === 'ON_SHIFT' && (
                <button onClick={() => (window as any).AppLogic.setPhase('DESLOCAMENTO')} className="w-full bg-blue-600 text-white py-10 rounded-[3rem] font-black uppercase italic text-2xl shadow-2xl flex items-center justify-center gap-4 active:scale-95">
                  <Navigation size={32} /> Aceitar Corrida
                </button>
              )}

              {phase === 'DESLOCAMENTO' && (
                <button onClick={() => (window as any).AppLogic.setPhase('PASSAGEIRO')} className="w-full bg-orange-600 text-white py-10 rounded-[3rem] font-black uppercase italic text-2xl shadow-2xl flex items-center justify-center gap-4 active:scale-95">
                  <Users size={32} /> Embarcar Pax
                </button>
              )}

              {phase === 'PASSAGEIRO' && (
                <button onClick={() => { setGrossInput(activeProfile?.isFixedTax ? activeProfile.defaultGross.toString() : ''); setShowFinishRaceModal(true); }} className="w-full bg-emerald-600 text-white py-10 rounded-[3rem] font-black uppercase italic text-2xl shadow-2xl flex items-center justify-center gap-4 active:scale-95">
                  <Flag size={32} /> Finalizar Corrida
                </button>
              )}
            </div>

            <button onClick={() => setShowEndOdo(true)} className="w-full py-4 text-rose-500 font-black uppercase text-[10px] tracking-widest opacity-40">Encerrar Turno Hoje</button>
          </div>
        )}
      </div>

      {/* HISTÓRICO RECENTE */}
      <div className="px-2 space-y-3">
        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Histórico do Turno</h3>
        {currentRaces.length === 0 ? (
          <div className="p-10 border-2 border-dashed border-slate-800 rounded-[2.5rem] text-center">
             <p className="text-[9px] font-black text-slate-700 uppercase">Aguardando primeira corrida</p>
          </div>
        ) : (
          currentRaces.map(race => (
            <div key={race.id} className="bg-slate-900 border border-white/5 p-6 rounded-[3rem] shadow-xl relative overflow-hidden group">
               <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-3">
                     <div className="bg-blue-600/10 p-2 rounded-xl text-blue-500"><Smartphone size={16} /></div>
                     <div>
                        <p className="text-sm font-black text-white italic uppercase leading-none">{race.appName}</p>
                        <p className="text-[7px] font-bold text-slate-500 uppercase mt-1">{new Date(race.date).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}</p>
                     </div>
                  </div>
                  <div className="text-right">
                     <p className="text-xl font-black text-emerald-400 italic leading-none">R$ {formatCurrency(race.netProfit)}</p>
                     <p className="text-[7px] font-black text-emerald-600 uppercase mt-1">LUCRO NO BOLSO</p>
                  </div>
               </div>

               <div className="grid grid-cols-4 gap-2 border-t border-white/5 pt-4 text-center">
                  <div>
                     <p className="text-[10px] font-black text-white italic">R$ {formatCurrency(race.grossEarnings)}</p>
                     <p className="text-[6px] font-black text-slate-600 uppercase">Bruto</p>
                  </div>
                  <div className="border-x border-white/5">
                     <p className="text-[10px] font-black text-rose-500 italic">- R$ {formatCurrency(race.appTax)}</p>
                     <p className="text-[6px] font-black text-slate-600 uppercase">App</p>
                  </div>
                  <div>
                     <p className="text-[10px] font-black text-orange-400 italic">- R$ {formatCurrency(race.fuelCost)}</p>
                     <p className="text-[6px] font-black text-slate-600 uppercase">Gás</p>
                  </div>
                  <div className="border-l border-white/5">
                     <p className="text-[10px] font-black text-purple-400 italic">- R$ {formatCurrency(race.maintReserve)}</p>
                     <p className="text-[6px] font-black text-slate-600 uppercase">Revisão</p>
                  </div>
               </div>

               <div className="mt-4 flex justify-between items-center text-[8px] font-black text-slate-500 uppercase bg-slate-950/50 p-2 rounded-xl">
                  <span className="flex items-center gap-1"><MapPin size={8}/> Distância: {race.raceKm.toFixed(2)} KM</span>
                  <button onClick={() => onRemoveRace(race.id)} className="text-rose-500/40 hover:text-rose-500">Excluir</button>
               </div>
            </div>
          ))
        )}
      </div>

      {/* MODAL: SELEÇÃO DE APP */}
      {showAppSelection && (
        <div className="fixed inset-0 bg-slate-950/98 z-[999] flex items-center justify-center p-6 animate-up">
           <div className="w-full max-w-sm p-8 bg-slate-900 border border-white/10 rounded-[3rem] space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-black uppercase italic text-white">App de Trabalho</h2>
                <button onClick={() => { setShowAddApp(true); setShowAppSelection(false); }} className="p-2 bg-blue-600 text-white rounded-lg"><Plus size={16}/></button>
              </div>
              
              <div className="grid grid-cols-2 gap-3 min-h-[100px]">
                 {user.appProfiles.map(app => (
                   <button key={app.id} onClick={() => { onUpdateUser({...user, selectedAppProfileId: app.id}); setShowAppSelection(false); setShowStartOdo(true); }} className="p-6 bg-slate-950 border border-slate-800 rounded-3xl flex flex-col items-center gap-2 active:scale-95 transition-all">
                      <Smartphone size={24} className="text-blue-500" />
                      <span className="text-[10px] font-black uppercase italic truncate w-full text-center text-white">{app.name}</span>
                   </button>
                 ))}
                 
                 {user.appProfiles.length === 0 && (
                   <button onClick={() => { setShowAddApp(true); setShowAppSelection(false); }} className="col-span-2 p-10 border-2 border-dashed border-slate-800 rounded-3xl flex flex-col items-center gap-4 group">
                      <AlertCircle size={32} className="text-slate-700 group-active:text-blue-500" />
                      <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest text-center">Toque para cadastrar App</p>
                   </button>
                 )}
              </div>
              <button onClick={() => setShowAppSelection(false)} className="w-full text-slate-600 font-black uppercase text-[10px] text-center">Fechar</button>
           </div>
        </div>
      )}

      {/* MODAL: CADASTRO DE APP */}
      {showAddApp && (
        <div className="fixed inset-0 bg-slate-950/98 z-[1010] flex items-center justify-center p-6 animate-up">
           <div className="w-full max-w-sm p-8 bg-slate-900 border border-white/10 rounded-[3rem] space-y-6">
              <h2 className="text-xl font-black uppercase italic text-white text-center">Novo Aplicativo</h2>
              <div className="space-y-4">
                 <input className="w-full py-4 text-center font-black bg-slate-950 text-white rounded-2xl border border-slate-800" placeholder="Nome (Ex: Uber, 99)" value={newApp.name} onChange={e => setNewApp({...newApp, name: e.target.value})} />
                 <div className="flex bg-slate-950 p-1 rounded-2xl border border-white/5">
                    <button onClick={() => setNewApp({...newApp, isFixedValue: false})} className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase transition-all ${!newApp.isFixedValue ? 'bg-blue-600 text-white' : 'text-slate-600'}`}>Variável</button>
                    <button onClick={() => setNewApp({...newApp, isFixedValue: true})} className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase transition-all ${newApp.isFixedValue ? 'bg-blue-600 text-white' : 'text-slate-600'}`}>Fixo</button>
                 </div>
                 {newApp.isFixedValue && (
                   <input type="number" className="w-full py-4 text-center font-black bg-slate-950 text-white rounded-2xl border border-slate-800" placeholder="Valor Corrida (R$)" value={newApp.fixedAmount} onChange={e => setNewApp({...newApp, fixedAmount: e.target.value})} />
                 )}
                 <input type="number" className="w-full py-4 text-center font-black bg-slate-950 text-white rounded-2xl border border-slate-800" placeholder="Taxa do App (%)" value={newApp.taxPercentage} onChange={e => setNewApp({...newApp, taxPercentage: e.target.value})} />
                 <button onClick={saveNewApp} className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black uppercase italic shadow-2xl">Salvar App</button>
                 <button onClick={() => setShowAddApp(false)} className="w-full text-slate-600 font-black uppercase text-[10px] text-center">Voltar</button>
              </div>
           </div>
        </div>
      )}

      {/* MODAL: ODÔMETRO INICIAL */}
      {showStartOdo && (
        <div className="fixed inset-0 bg-slate-950/98 z-[999] flex items-center justify-center p-6 animate-up">
          <div className="w-full max-w-sm p-10 bg-slate-900 rounded-[3rem] text-center space-y-8 shadow-2xl">
            <h2 className="text-2xl font-black uppercase italic text-white leading-tight">KM INICIAL HOJE</h2>
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Confirme o odômetro do painel</p>
            <input type="number" autoFocus className={inputStyle} value={odoInput} onChange={e => setOdoInput(e.target.value)} placeholder={user.lastOdometer.toString()} />
            <button onClick={() => { onStartShift(parseFloat(odoInput)); setShowStartOdo(false); setOdoInput(''); }} className="w-full bg-blue-600 text-white py-6 rounded-[2rem] font-black text-xl uppercase italic shadow-2xl">Abrir Turno</button>
          </div>
        </div>
      )}

      {/* MODAL: FINALIZAR CORRIDA */}
      {showFinishRaceModal && (
        <div className="fixed inset-0 bg-slate-950/98 z-[1000] flex items-center justify-center p-6 animate-up">
          <div className="w-full max-w-sm p-10 bg-slate-900 rounded-[3.5rem] text-center space-y-6 shadow-2xl border border-emerald-500/20">
            <h2 className="text-2xl font-black uppercase italic text-white leading-none">Valor Recebido</h2>
            <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Distância Rastreada: {trackedKm.toFixed(2)} KM</p>
            <input autoFocus type="number" inputMode="decimal" className={inputStyle} placeholder="0,00" value={grossInput} onChange={e => setGrossInput(e.target.value)} />
            <button onClick={handleFinishRaceClick} className="w-full bg-emerald-600 text-white py-6 rounded-[2.5rem] font-black text-xl uppercase italic shadow-2xl active:scale-95">Salvar Corrida</button>
            <button onClick={() => setShowFinishRaceModal(false)} className="text-[10px] font-black text-slate-600 uppercase">Cancelar</button>
          </div>
        </div>
      )}

      {/* MODAL: ODÔMETRO FINAL */}
      {showEndOdo && (
        <div className="fixed inset-0 bg-slate-950/98 z-[999] flex items-center justify-center p-6 animate-up">
          <div className="w-full max-w-sm p-10 bg-slate-900 rounded-[3rem] text-center space-y-8 shadow-2xl">
            <h2 className="text-2xl font-black uppercase italic text-white leading-tight">FECHAR EXPEDIENTE</h2>
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Informe o KM final do painel</p>
            <input type="number" autoFocus className={inputStyle} value={odoInput} onChange={e => setOdoInput(e.target.value)} />
            <button onClick={() => { onFinishShift(parseFloat(odoInput)); setShowEndOdo(false); setOdoInput(''); }} className="w-full bg-rose-600 text-white py-6 rounded-[2rem] font-black text-xl uppercase italic shadow-2xl">Finalizar Turno</button>
            <button onClick={() => setShowEndOdo(false)} className="text-[10px] font-black text-slate-600 uppercase">Voltar</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
