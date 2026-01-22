
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { UserProfile, TripSession, AppState, AppView, TrackingPhase, Race, Expense, RefuelEntry, MaintenanceTask, AppProfile } from './types';
import Landing from './components/Landing';
import Onboarding from './components/Onboarding';
import Home from './components/Home';
import Financeiro from './components/Financeiro';
import Postos from './components/Postos';
import Custos from './components/Custos';
import Veiculo from './components/Veiculo';
import { LayoutDashboard, Wallet, Fuel, Receipt, Car } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

const STORAGE_KEY = 'drivers_friend_v701_pro';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    user: null, sessions: [], refuels: [], expenses: [], maintenance: [], currentRaces: [], isLoaded: false
  });
  const [view, setView] = useState<AppView>('LANDING');
  const [phase, setPhase] = useState<TrackingPhase>('IDLE');
  
  const [sessionKms, setSessionKms] = useState({ particular: 0, deslocamento: 0, passageiro: 0 });
  const [currentRaceTimes, setCurrentRaceTimes] = useState({ start: 0, boarding: 0 });
  const [startCoords, setStartCoords] = useState<{lat: number, lng: number} | null>(null);

  const lastPos = useRef<GeolocationCoordinates | null>(null);
  const watchId = useRef<number | null>(null);

  const maintCostPerKm = useMemo(() => {
    if (!state.maintenance || state.maintenance.length === 0) return 0.12;
    return state.maintenance.reduce((acc, task) => {
      const cost = Number(task.lastCost) || 0;
      const interval = Number(task.interval) || 1; 
      return acc + (cost / interval);
    }, 0);
  }, [state.maintenance]);

  useEffect(() => {
    if (phase === 'IDLE') {
      if (watchId.current) navigator.geolocation.clearWatch(watchId.current);
      return;
    }

    if (phase === 'ACCEPTING' && currentRaceTimes.start === 0) {
      setCurrentRaceTimes(p => ({ ...p, start: Date.now() }));
    }
    if (phase === 'BOARDING' && currentRaceTimes.boarding === 0) {
      setCurrentRaceTimes(p => ({ ...p, boarding: Date.now() }));
    }
    
    watchId.current = navigator.geolocation.watchPosition((pos) => {
      if (!startCoords) setStartCoords({lat: pos.coords.latitude, lng: pos.coords.longitude});
      if (lastPos.current) {
        const R = 6371;
        const dLat = (pos.coords.latitude - lastPos.current.latitude) * Math.PI / 180;
        const dLon = (pos.coords.longitude - lastPos.current.longitude) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lastPos.current.latitude * Math.PI/180) * Math.cos(pos.coords.latitude * Math.PI/180) * Math.sin(dLon/2) * Math.sin(dLon/2);
        const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        if (dist > 0.002) { 
          setSessionKms(prev => {
            if (phase === 'ON_SHIFT') return { ...prev, particular: prev.particular + dist };
            if (phase === 'ACCEPTING') return { ...prev, deslocamento: prev.deslocamento + dist };
            if (phase === 'BOARDING') return { ...prev, passageiro: prev.passageiro + dist };
            return prev;
          });
        }
      }
      lastPos.current = pos.coords;
    }, null, { enableHighAccuracy: true });
    return () => { if (watchId.current) navigator.geolocation.clearWatch(watchId.current); };
  }, [phase]);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const p = JSON.parse(saved);
        setState({ ...state, ...p.state, isLoaded: true });
        setPhase(p.phase || 'IDLE');
        if (p.phase && p.phase !== 'IDLE') setView('HOME');
      } catch (e) { setState(prev => ({ ...prev, isLoaded: true })); }
    } else setState(prev => ({ ...prev, isLoaded: true }));
  }, []);

  useEffect(() => {
    if (state.isLoaded) localStorage.setItem(STORAGE_KEY, JSON.stringify({ state, phase }));
  }, [state, phase]);

  const ai = useMemo(() => new GoogleGenAI({ apiKey: process.env.API_KEY }), []);

  const handleFinishRace = (gross: number) => {
    if (!state.user) return;
    const profile = state.user.appProfiles.find(p => p.id === state.user?.selectedAppProfileId);
    if (!profile) return;

    // VALOR BRUTO (RECEBIDO)
    const safeGross = Math.max(0, Number(gross) || 0);
    const raceKm = sessionKms.deslocamento + sessionKms.passageiro;
    
    // CALCULO DA TAXA DO APP (CORREÇÃO CRÍTICA)
    // A taxa é SEMPRE uma porcentagem do valor bruto informado.
    const taxRate = (Number(profile.taxPercentage) || 0) / 100;
    const appTax = safeGross * taxRate;
    
    // CUSTOS OPERACIONAIS
    const avgFuelPrice = state.refuels.length > 0 ? state.refuels[state.refuels.length-1].pricePerLiter : 5.85;
    const fuelCost = (raceKm / (state.user.calculatedAvgConsumption || 10)) * avgFuelPrice;
    const maintRes = raceKm * maintCostPerKm;
    
    // RESERVA PESSOAL (SALÁRIO)
    const dailyGoal = Number(state.user.dailyGoal) || 1;
    const dailyExpenses = (state.user.desiredSalary + state.user.personalFixedCosts) / (state.user.workingDaysPerMonth || 22);
    const personalRes = (safeGross / dailyGoal) * dailyExpenses;

    const netProfit = safeGross - appTax - fuelCost - maintRes - personalRes;

    const newRace: Race = {
      id: Date.now().toString(), date: Date.now(), appName: profile.name,
      startTime: currentRaceTimes.start || Date.now(), boardingTime: currentRaceTimes.boarding || Date.now(), endTime: Date.now(),
      kmDeslocamento: sessionKms.deslocamento, kmPassageiro: sessionKms.passageiro,
      grossEarnings: safeGross, appTax, fuelCost, maintReserve: maintRes, personalReserve: personalRes,
      netProfit: netProfit
    };

    setState(prev => ({
      ...prev,
      currentRaces: [...prev.currentRaces, newRace],
      user: prev.user ? { ...prev.user, lastOdometer: prev.user.lastOdometer + raceKm } : null
    }));
    
    setSessionKms({ particular: 0, deslocamento: 0, passageiro: 0 });
    setPhase('ON_SHIFT');
    setStartCoords(null);
  };

  const handleRemoveRace = (id: string) => {
    setState(prev => ({ ...prev, currentRaces: prev.currentRaces.filter(r => r.id !== id) }));
  };

  const handleFinishShift = (odo: number) => {
    if (!state.user) return;
    const totalGross = state.currentRaces.reduce((acc, r) => acc + r.grossEarnings, 0);
    const totalNet = state.currentRaces.reduce((acc, r) => acc + r.netProfit, 0);
    const session: TripSession = { id: Date.now().toString(), date: Date.now(), startOdometer: state.user.lastOdometer, endOdometer: odo, kmParticular: sessionKms.particular, races: [...state.currentRaces], totalGross, totalNet };
    setState(prev => ({ ...prev, sessions: [...prev.sessions, session], currentRaces: [], user: prev.user ? { ...prev.user, lastOdometer: odo } : null }));
    setSessionKms({ particular: 0, deslocamento: 0, passageiro: 0 });
    setPhase('IDLE');
  };

  if (!state.isLoaded) return <div className="h-screen bg-slate-950 flex items-center justify-center text-white font-black italic">DRIVER'S FRIEND</div>;

  return (
    <div id="root" className="flex flex-col h-screen bg-slate-950 text-slate-100 overflow-hidden">
      <div className="flex-1 overflow-y-auto px-4 safe-scroll pt-2">
        {view === 'LANDING' && <Landing user={state.user} onStart={() => setView('ONBOARDING')} onSelect={() => setView('HOME')} onNewRegistration={() => { localStorage.clear(); window.location.reload(); }} />}
        {view === 'ONBOARDING' && <Onboarding ai={ai} onComplete={(u) => { setState(p => ({ ...p, user: u })); setView('HOME'); }} />}
        {view === 'HOME' && state.user && <Home 
          user={state.user} phase={phase} setPhase={setPhase} kms={sessionKms} 
          currentRaces={state.currentRaces} maintenance={state.maintenance} 
          onFinishRace={handleFinishRace} onRemoveRace={handleRemoveRace} 
          onFinishShift={handleFinishShift} onUpdateUser={(u) => setState(p => ({ ...p, user: u }))} 
        />}
        {view === 'FINANCEIRO' && state.user && <Financeiro user={state.user} sessions={state.sessions} expenses={state.expenses} refuels={state.refuels} currentRaces={state.currentRaces} />}
        {view === 'POSTOS' && state.user && <Postos user={state.user} refuels={state.refuels} onRefuel={(r) => setState(p => ({ ...p, refuels: [...p.refuels, r] }))} />}
        {view === 'CUSTOS' && <Custos expenses={state.expenses} refuels={state.refuels} onAdd={(e) => setState(p => ({ ...p, expenses: [...p.expenses, e] }))} onRemoveExpense={(id) => setState(p => ({ ...p, expenses: p.expenses.filter(x => x.id !== id) }))} onRemoveRefuel={(id) => setState(p => ({ ...p, refuels: p.refuels.filter(x => x.id !== id) }))} isWorking={phase !== 'IDLE'} />}
        {view === 'VEICULO' && state.user && <Veiculo user={state.user} maintenance={state.maintenance} onUpsert={(m) => setState(p => ({ ...p, maintenance: [...p.maintenance.filter(item => item.id !== m.id), m] }))} onDelete={(id) => setState(p => ({ ...p, maintenance: p.maintenance.filter(item => item.id !== id) }))} maintCostPerKm={maintCostPerKm} currentRaces={state.currentRaces} sessions={state.sessions} />}
      </div>
      {state.user && view !== 'LANDING' && view !== 'ONBOARDING' && (
        <nav className="fixed bottom-6 left-6 right-6 h-16 bg-slate-900/95 backdrop-blur-2xl border border-white/5 rounded-3xl flex justify-around items-center shadow-2xl z-50">
          {[{ id: 'HOME', icon: LayoutDashboard }, { id: 'POSTOS', icon: Fuel }, { id: 'CUSTOS', icon: Receipt }, { id: 'VEICULO', icon: Car }, { id: 'FINANCEIRO', icon: Wallet }].map(tab => (
            <button key={tab.id} onClick={() => setView(tab.id as AppView)} className={`p-3 rounded-2xl transition-all ${view === tab.id ? 'bg-blue-600 text-white scale-110' : 'text-slate-500 opacity-50'}`}>
              <tab.icon size={22} />
            </button>
          ))}
        </nav>
      )}
    </div>
  );
};
export default App;
