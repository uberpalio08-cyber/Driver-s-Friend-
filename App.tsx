
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { UserProfile, TripSession, AppState, AppView, TrackingPhase, GasStation, RefuelEntry, Expense, MaintenanceTask, Race } from './types';
import Landing from './components/Landing';
import Onboarding from './components/Onboarding';
import Home from './components/Home';
import Financeiro from './components/Financeiro';
import Postos from './components/Postos';
import Custos from './components/Custos';
import Veiculo from './components/Veiculo';
import { LayoutDashboard, Wallet, Fuel, Receipt, Car } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

const INITIAL_STATE: AppState = {
  user: null,
  sessions: [],
  stations: [],
  refuels: [],
  expenses: [],
  maintenance: [],
  currentRaces: [],
  currentDailyExpenses: [],
  isLoaded: false
};

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(INITIAL_STATE);
  const [view, setView] = useState<AppView>('LANDING');
  const [phase, setPhase] = useState<TrackingPhase>('IDLE');
  
  const [kmParticular, setKmParticular] = useState(0);
  const [kmDeslocamento, setKmDeslocamento] = useState(0);
  const [kmPassageiro, setKmPassageiro] = useState(0);
  const [raceStartTime, setRaceStartTime] = useState<number | null>(null);
  
  const lastPos = useRef<GeolocationCoordinates | null>(null);
  const watchId = useRef<number | null>(null);

  const ai = useMemo(() => new GoogleGenAI({ apiKey: process.env.API_KEY || "" }), []);

  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  useEffect(() => {
    const saved = localStorage.getItem('drivers_friend_v19_clean');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setState({ ...INITIAL_STATE, ...parsed, isLoaded: true });
      } catch (e) {
        setState(prev => ({ ...prev, isLoaded: true }));
      }
    } else {
      setState(prev => ({ ...prev, isLoaded: true }));
    }
  }, []);

  useEffect(() => {
    if (state.isLoaded) {
      localStorage.setItem('drivers_friend_v19_clean', JSON.stringify(state));
    }
  }, [state]);

  useEffect(() => {
    if (phase !== 'IDLE') {
      watchId.current = navigator.geolocation.watchPosition(
        (pos) => {
          if (lastPos.current) {
            const dist = getDistance(lastPos.current.latitude, lastPos.current.longitude, pos.coords.latitude, pos.coords.longitude);
            if (dist > 0.005) { 
              if (phase === 'PARTICULAR') setKmParticular(p => p + dist);
              else if (phase === 'DESLOCAMENTO') setKmDeslocamento(p => p + dist);
              else if (phase === 'PASSAGEIRO') setKmPassageiro(p => p + dist);
              
              setState(prev => {
                if (!prev.user) return prev;
                const fuelSpent = dist / (prev.user.calculatedAvgConsumption || 10);
                return { ...prev, user: { ...prev.user, currentFuelLevel: Math.max(0, prev.user.currentFuelLevel - fuelSpent) }};
              });
            }
          }
          lastPos.current = pos.coords;
        },
        (err) => console.error(err),
        { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
      );
    } else {
      if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
      lastPos.current = null;
    }
    return () => { if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current); };
  }, [phase]);

  const addRace = (gross: number) => {
    if (!state.user) return;
    
    const allPrices = state.stations.flatMap(s => [s.lastGasPrice, s.lastEtanolPrice]).filter(p => p !== undefined) as number[];
    const fuelPrice = allPrices.length > 0 ? Math.min(...allPrices) : 5.89;
    
    const totalRaceKm = kmDeslocamento + kmPassageiro;
    const fuelCost = (totalRaceKm / (state.user.calculatedAvgConsumption || 10)) * fuelPrice;
    
    // Reservas que reduzem o Lucro Limpo (Salário do motorista)
    const appTaxAmount = gross * (state.user.appPercentage / 100);
    const maintenanceRes = (gross * (state.user.maintenanceReservePercent / 100));
    const emergencyRes = (gross * (state.user.emergencyReservePercent / 100));

    // Lucro Limpo = O que entra no bolso do motorista após todas as deduções
    const netProfit = gross - appTaxAmount - fuelCost - maintenanceRes - emergencyRes;
    
    const newRace: Race = {
      id: Date.now().toString(),
      date: Date.now(),
      acceptedAt: raceStartTime || Date.now(),
      finishedAt: Date.now(),
      kmDeslocamento,
      kmPassageiro,
      grossEarnings: gross,
      netProfit,
      fuelCost,
      appTax: appTaxAmount,
      maintenanceReserve: maintenanceRes,
      emergencyReserve: emergencyRes,
      score: netProfit > (totalRaceKm * 2.5) ? 'GOOD' : 'OK'
    };
    
    setState(prev => ({ ...prev, currentRaces: [...prev.currentRaces, newRace] }));
    setKmDeslocamento(0);
    setKmPassageiro(0);
    setPhase('PARTICULAR'); 
  };

  const saveSession = (startOdometer: number, endOdometer: number) => {
    if (!state.user) return;
    const totalGross = state.currentRaces.reduce((acc, r) => acc + r.grossEarnings, 0);
    const totalNet = state.currentRaces.reduce((acc, r) => acc + r.netProfit, 0);
    
    const newSession: TripSession = {
      id: Date.now().toString(),
      date: Date.now(),
      startOdometer,
      endOdometer,
      kmParticular,
      races: state.currentRaces,
      dailyExpenses: state.currentDailyExpenses,
      totalGross,
      totalNet
    };
    
    setState(prev => ({
      ...prev,
      sessions: [...prev.sessions, newSession],
      currentRaces: [],
      currentDailyExpenses: [],
      user: prev.user ? { ...prev.user, lastOdometer: endOdometer } : null
    }));
    setKmParticular(0);
    setPhase('IDLE');
  };

  return (
    <div className="min-h-screen flex flex-col max-w-md mx-auto relative overflow-hidden">
      <div className="flex-1 overflow-auto pb-24">
        {state.isLoaded ? (
          (() => {
            switch (view) {
              case 'LANDING': return <Landing user={state.user} onStart={() => setView('ONBOARDING')} onSelect={() => setView('HOME')} onNewRegistration={() => { localStorage.clear(); window.location.reload(); }} />;
              case 'ONBOARDING': return <Onboarding onComplete={(profile) => { setState(p => ({ ...p, user: profile })); setView('HOME'); }} ai={ai} />;
              case 'HOME': return state.user ? <Home user={state.user} phase={phase} setPhase={(p) => { if (p === 'DESLOCAMENTO') setRaceStartTime(Date.now()); setPhase(p); }} kms={{ kmParticular, kmDeslocamento, kmPassageiro }} onFinishSession={saveSession} onFinishRace={addRace} currentRaces={state.currentRaces} currentDailyExpenses={state.currentDailyExpenses} /> : null;
              case 'FINANCEIRO': return state.user ? <Financeiro sessions={state.sessions} expenses={state.expenses} maintenance={state.maintenance} user={state.user} /> : null;
              case 'POSTOS': return state.user ? <Postos user={state.user} stations={state.stations} onAddStation={(name, g, e) => { const s = { id: Date.now().toString(), name, lastGasPrice: g, lastEtanolPrice: e }; setState(p => ({ ...p, stations: [...p.stations, s] })); }} onRefuel={(e) => {
                setState(p => ({ ...p, refuels: [...p.refuels, e], user: p.user ? { ...p.user, currentFuelLevel: Math.min(p.user.car.tankCapacity, p.user.currentFuelLevel + e.liters), lastOdometer: Math.max(p.user.lastOdometer, e.odometerAtRefuel) } : null }));
              }} refuels={state.refuels} ai={ai} /> : null;
              case 'CUSTOS': return <Custos expenses={state.expenses} refuels={state.refuels} onAdd={(exp) => setState(p => ({ ...p, expenses: [...p.expenses, exp], currentDailyExpenses: exp.isWorkExpense ? [...p.currentDailyExpenses, exp] : p.currentDailyExpenses }))} isWorking={phase !== 'IDLE'} />;
              case 'VEICULO': return state.user ? <Veiculo user={state.user} maintenance={state.maintenance} onUpsert={(task) => setState(prev => ({ ...prev, maintenance: prev.maintenance.find(m => m.id === task.id) ? prev.maintenance.map(m => m.id === task.id ? task : m) : [...prev.maintenance, task] }))} onUpdateMaintCost={(cost) => setState(prev => ({...prev, user: prev.user ? {...prev.user, maintenanceCostPerKm: cost} : null}))} ai={ai} /> : null;
              default: return null;
            }
          })()
        ) : <div className="min-h-screen flex items-center justify-center text-white font-black italic animate-pulse">Drivers Friend</div>}
      </div>
      
      {state.user && view !== 'ONBOARDING' && view !== 'LANDING' && (
        <nav className="fixed bottom-4 left-4 right-4 max-w-[calc(448px-2rem)] mx-auto bg-white border border-black p-2 rounded-2xl flex justify-around items-center safe-area-bottom z-50 shadow-2xl transition-all">
          <button onClick={() => setView('HOME')} className={`p-2 transition-all ${view === 'HOME' ? 'text-black scale-110' : 'text-zinc-300'}`}><LayoutDashboard size={22} /></button>
          <button onClick={() => setView('POSTOS')} className={`p-2 transition-all ${view === 'POSTOS' ? 'text-black scale-110' : 'text-zinc-300'}`}><Fuel size={22} /></button>
          <button onClick={() => setView('CUSTOS')} className={`p-2 transition-all ${view === 'CUSTOS' ? 'text-black scale-110' : 'text-zinc-300'}`}><Receipt size={22} /></button>
          <button onClick={() => setView('VEICULO')} className={`p-2 transition-all ${view === 'VEICULO' ? 'text-black scale-110' : 'text-zinc-300'}`}><Car size={22} /></button>
          <button onClick={() => setView('FINANCEIRO')} className={`p-2 transition-all ${view === 'FINANCEIRO' ? 'text-black scale-110' : 'text-zinc-300'}`}><Wallet size={22} /></button>
        </nav>
      )}
    </div>
  );
};

export default App;
