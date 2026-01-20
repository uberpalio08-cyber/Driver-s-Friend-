import React, { useState, useEffect, useRef, useMemo } from 'react';
import { UserProfile, TripSession, AppState, AppView, TrackingPhase, GasStation, RefuelEntry, Expense, MaintenanceTask, Race } from './types';
import Landing from './components/Landing';
import Onboarding from './components/Onboarding';
import Home from './components/Home';
import Financeiro from './components/Financeiro';
import Postos from './components/Postos';
import Custos from './components/Custos';
import Veiculo from './components/Veiculo';
import FloatingTracker from './components/FloatingTracker';
import FloatingBubble from './components/FloatingBubble';
import { LayoutDashboard, Wallet, Fuel, Receipt, Car } from 'lucide-react';

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
  const wakeLock = useRef<any>(null);

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

  const requestWakeLock = async () => {
    try {
      if ('wakeLock' in navigator) {
        wakeLock.current = await (navigator as any).wakeLock.request('screen');
      }
    } catch (err) {
      console.error(`${err.name}, ${err.message}`);
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem('drivers_friend_data_v4');
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
      localStorage.setItem('drivers_friend_data_v4', JSON.stringify(state));
    }
  }, [state]);

  useEffect(() => {
    if (phase !== 'IDLE') {
      requestWakeLock();
      if (phase === 'DESLOCAMENTO' && !raceStartTime) setRaceStartTime(Date.now());
      
      const options = { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 };
      watchId.current = navigator.geolocation.watchPosition(
        (pos) => {
          if (lastPos.current) {
            const dist = getDistance(lastPos.current.latitude, lastPos.current.longitude, pos.coords.latitude, pos.coords.longitude);
            if (dist > 0.005) { // Sensibilidade aumentada para 5 metros
              if (phase === 'PARTICULAR') setKmParticular(p => p + dist);
              if (phase === 'DESLOCAMENTO') setKmDeslocamento(p => p + dist);
              if (phase === 'PASSAGEIRO') setKmPassageiro(p => p + dist);
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
        options
      );
    } else {
      if (wakeLock.current) {
        wakeLock.current.release();
        wakeLock.current = null;
      }
      if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
      lastPos.current = null;
    }
    return () => { 
      if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current); 
      if (wakeLock.current) wakeLock.current.release();
    };
  }, [phase]);

  const addRace = (gross: number) => {
    if (!state.user) return;
    const lastRefuel = state.refuels[state.refuels.length - 1];
    const fuelPrice = lastRefuel ? lastRefuel.pricePerLiter : 6.0;
    const totalRaceKm = kmDeslocamento + kmPassageiro;
    const fuelCost = (totalRaceKm / (state.user.calculatedAvgConsumption || 10)) * fuelPrice;
    const appTaxAmount = gross * (state.user.appPercentage / 100);
    const maintenanceRes = gross * (state.user.maintenanceReservePercent / 100);
    const emergencyRes = gross * (state.user.emergencyReservePercent / 100);
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
      emergencyReserve: emergencyRes
    };

    setState(prev => ({ ...prev, currentRaces: [...prev.currentRaces, newRace] }));
    setKmDeslocamento(0);
    setKmPassageiro(0);
    setRaceStartTime(null);
    setPhase('PARTICULAR');
  };

  const saveSession = (startOdometer: number, endOdometer: number) => {
    if (!state.user) return;
    const totalGross = state.currentRaces.reduce((acc, r) => acc + r.grossEarnings, 0);
    const totalRacesNet = state.currentRaces.reduce((acc, r) => acc + r.netProfit, 0);
    const totalDailyExpenses = state.currentDailyExpenses.reduce((acc, e) => acc + e.amount, 0);
    const totalNet = totalRacesNet - totalDailyExpenses;

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

  const totalNetToday = useMemo(() => {
    return state.currentRaces.reduce((acc, r) => acc + r.netProfit, 0) - 
           state.currentDailyExpenses.reduce((acc, e) => acc + e.amount, 0);
  }, [state.currentRaces, state.currentDailyExpenses]);

  return (
    <div className="min-h-screen flex flex-col max-w-md mx-auto relative bg-transparent overflow-x-hidden">
      <div className="flex-1 overflow-auto pb-32">
        {state.isLoaded ? (
          (() => {
            switch (view) {
              case 'LANDING': return <Landing user={state.user} onStart={() => setView('ONBOARDING')} onSelect={() => setView('HOME')} onNewRegistration={() => { localStorage.clear(); window.location.reload(); }} />;
              case 'ONBOARDING': return <Onboarding onComplete={(profile) => { setState(p => ({ ...p, user: profile })); setView('HOME'); }} />;
              case 'HOME': return state.user ? <Home user={state.user} phase={phase} setPhase={setPhase} kms={{ kmParticular, kmDeslocamento, kmPassageiro }} onFinishSession={saveSession} onFinishRace={addRace} currentRaces={state.currentRaces} currentDailyExpenses={state.currentDailyExpenses} maintenance={state.maintenance} /> : null;
              case 'FINANCEIRO': return state.user ? <Financeiro sessions={state.sessions} expenses={state.expenses} maintenance={state.maintenance} user={state.user} /> : null;
              case 'POSTOS': return state.user ? <Postos user={state.user} stations={state.stations} onAddStation={(name) => { const s = { id: Date.now().toString(), name }; setState(p => ({ ...p, stations: [...p.stations, s] })); return s; }} onRefuel={(e) => {
                const updatedStations = state.stations.map(s => s.id === e.stationId ? { ...s, lastGasPrice: e.fuelType === 'GASOLINA' ? e.pricePerLiter : s.lastGasPrice, lastEtanolPrice: e.fuelType === 'ETANOL' ? e.pricePerLiter : s.lastEtanolPrice } : s);
                setState(p => ({ ...p, stations: updatedStations, refuels: [...p.refuels, e], user: p.user ? { ...p.user, currentFuelLevel: e.isFullTank ? p.user.car.tankCapacity : Math.min(p.user.car.tankCapacity, p.user.currentFuelLevel + e.liters), lastOdometer: Math.max(p.user.lastOdometer, e.odometerAtRefuel) } : null }));
              }} refuels={state.refuels} /> : null;
              case 'CUSTOS': return <Custos expenses={state.expenses} onAdd={(exp) => setState(p => ({ ...p, expenses: [...p.expenses, exp], currentDailyExpenses: exp.isWorkExpense && phase !== 'IDLE' ? [...p.currentDailyExpenses, exp] : p.currentDailyExpenses }))} isWorking={phase !== 'IDLE'} />;
              case 'VEICULO': return state.user ? <Veiculo user={state.user} maintenance={state.maintenance} onUpsert={(task) => setState(prev => ({ ...prev, maintenance: prev.maintenance.find(m => m.id === task.id) ? prev.maintenance.map(m => m.id === task.id ? task : m) : [...prev.maintenance, task] }))} sessions={state.sessions} /> : null;
              default: return null;
            }
          })()
        ) : <div className="min-h-screen bg-transparent flex items-center justify-center text-zinc-900 font-black">CARREGANDO...</div>}
      </div>
      
      {/* Botão Flutuante que aparece apenas durante o expediente */}
      {state.user && phase !== 'IDLE' && (
        <FloatingBubble 
          phase={phase} 
          netToday={totalNetToday} 
          onOpenHome={() => setView('HOME')} 
        />
      )}

      {state.user && phase !== 'IDLE' && <FloatingTracker phase={phase} netToday={totalNetToday} currentView={view} onSwitchPhase={setPhase} onAddRace={() => setView('HOME')} />}

      {state.user && view !== 'ONBOARDING' && view !== 'LANDING' && (
        <nav className="fixed bottom-6 left-6 right-6 max-w-[calc(448px-3rem)] mx-auto bg-black/95 backdrop-blur-xl border border-white/10 px-6 py-5 rounded-[2.5rem] flex justify-around items-center safe-area-bottom z-50">
          <button onClick={() => setView('HOME')} className={`transition-all ${view === 'HOME' ? 'text-white scale-110' : 'text-zinc-600'}`}><LayoutDashboard size={20} /></button>
          <button onClick={() => setView('POSTOS')} className={`transition-all ${view === 'POSTOS' ? 'text-white scale-110' : 'text-zinc-600'}`}><Fuel size={20} /></button>
          <button onClick={() => setView('CUSTOS')} className={`transition-all ${view === 'CUSTOS' ? 'text-white scale-110' : 'text-zinc-600'}`}><Receipt size={20} /></button>
          <button onClick={() => setView('VEICULO')} className={`transition-all ${view === 'VEICULO' ? 'text-white scale-110' : 'text-zinc-600'}`}><Car size={20} /></button>
          <button onClick={() => setView('FINANCEIRO')} className={`transition-all ${view === 'FINANCEIRO' ? 'text-white scale-110' : 'text-zinc-600'}`}><Wallet size={20} /></button>
        </nav>
      )}
    </div>
  );
};

export default App;