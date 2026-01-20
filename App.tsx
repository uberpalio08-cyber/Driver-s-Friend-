
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

  // Solicitar Wake Lock para manter o app vivo
  const requestWakeLock = async () => {
    if ('wakeLock' in navigator) {
      try {
        wakeLock.current = await (navigator as any).wakeLock.request('screen');
      } catch (err) {
        console.error(`${err.name}, ${err.message}`);
      }
    }
  };

  const releaseWakeLock = () => {
    if (wakeLock.current) {
      wakeLock.current.release();
      wakeLock.current = null;
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem('drivers_friend_data_noir_v2');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setState({
          ...INITIAL_STATE,
          ...parsed,
          isLoaded: true
        });
      } catch (e) {
        setState(prev => ({ ...prev, isLoaded: true }));
      }
    } else {
      setState(prev => ({ ...prev, isLoaded: true }));
    }
  }, []);

  useEffect(() => {
    if (state.isLoaded) {
      localStorage.setItem('drivers_friend_data_noir_v2', JSON.stringify(state));
    }
  }, [state]);

  useEffect(() => {
    if (phase !== 'IDLE') {
      requestWakeLock();
      watchId.current = navigator.geolocation.watchPosition(
        (pos) => {
          if (lastPos.current) {
            const dist = getDistance(
              lastPos.current.latitude,
              lastPos.current.longitude,
              pos.coords.latitude,
              pos.coords.longitude
            );
            
            if (dist > 0.005) {
              if (phase === 'PARTICULAR') setKmParticular(prev => prev + dist);
              if (phase === 'DESLOCAMENTO') setKmDeslocamento(prev => prev + dist);
              if (phase === 'PASSAGEIRO') setKmPassageiro(prev => prev + dist);

              setState(prev => {
                if (!prev.user) return prev;
                const fuelSpent = dist / (prev.user.calculatedAvgConsumption || 10);
                return {
                  ...prev,
                  user: {
                    ...prev.user,
                    currentFuelLevel: Math.max(0, prev.user.currentFuelLevel - fuelSpent)
                  }
                };
              });
            }
          }
          lastPos.current = pos.coords;
        },
        (err) => console.warn("Geo:", err),
        { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
      );
    } else {
      releaseWakeLock();
      if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
      lastPos.current = null;
    }
    return () => {
      releaseWakeLock();
      if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
    };
  }, [phase]);

  const addRace = (gross: number) => {
    if (!state.user) return;
    const refuels = state.refuels || [];
    const lastRefuel = refuels[refuels.length - 1];
    const fuelPrice = lastRefuel ? lastRefuel.pricePerLiter : 6.0;

    const fuelCost = ((kmDeslocamento + kmPassageiro) / (state.user.calculatedAvgConsumption || 10)) * fuelPrice;
    const appTaxAmount = gross * (state.user.appPercentage / 100);
    const maintenanceRes = gross * (state.user.maintenanceReservePercent / 100);
    const emergencyRes = gross * (state.user.emergencyReservePercent / 100);
    const netProfit = gross - appTaxAmount - fuelCost - maintenanceRes - emergencyRes;

    const newRace: Race = {
      id: Date.now().toString(),
      date: Date.now(),
      kmDeslocamento,
      kmPassageiro,
      grossEarnings: gross,
      netProfit,
      fuelCost,
      appTax: appTaxAmount,
      maintenanceReserve: maintenanceRes,
      emergencyReserve: emergencyRes
    };

    setState(prev => ({
      ...prev,
      currentRaces: [...(prev.currentRaces || []), newRace]
    }));

    setKmDeslocamento(0);
    setKmPassageiro(0);
    setPhase('PARTICULAR');
  };

  const saveSession = (startOdometer: number, endOdometer: number) => {
    if (!state.user) return;
    const currentRaces = state.currentRaces || [];
    const currentDailyExpenses = state.currentDailyExpenses || [];
    
    const totalGross = currentRaces.reduce((acc, r) => acc + (r.grossEarnings || 0), 0);
    const totalRacesNet = currentRaces.reduce((acc, r) => acc + (r.netProfit || 0), 0);
    const totalDailyExpenses = currentDailyExpenses.reduce((acc, e) => acc + (e.amount || 0), 0);
    const totalNet = totalRacesNet - totalDailyExpenses;

    const newSession: TripSession = {
      id: Date.now().toString(),
      date: Date.now(),
      startOdometer,
      endOdometer,
      kmParticular,
      races: currentRaces,
      dailyExpenses: currentDailyExpenses,
      totalGross,
      totalNet
    };

    setState(prev => ({
      ...prev,
      sessions: [...(prev.sessions || []), newSession],
      currentRaces: [],
      currentDailyExpenses: [],
      user: prev.user ? { ...prev.user, lastOdometer: endOdometer } : null
    }));
    
    setKmParticular(0);
    setPhase('IDLE');
  };

  const totalNetToday = useMemo(() => {
    const races = state.currentRaces || [];
    const expenses = state.currentDailyExpenses || [];
    return races.reduce((acc, r) => acc + (r.netProfit || 0), 0) - 
           expenses.reduce((acc, e) => acc + (e.amount || 0), 0);
  }, [state.currentRaces, state.currentDailyExpenses]);

  const renderView = () => {
    if (!state.isLoaded) return <div className="min-h-screen bg-black flex items-center justify-center text-white font-black uppercase tracking-widest">Iniciando...</div>;

    switch (view) {
      case 'LANDING':
        return <Landing user={state.user} onStart={() => setView('ONBOARDING')} onSelect={() => setView('HOME')} onNewRegistration={() => { localStorage.clear(); window.location.reload(); }} />;
      case 'ONBOARDING':
        return <Onboarding onComplete={(profile) => { setState(prev => ({ ...prev, user: profile })); setView('HOME'); }} />;
      case 'HOME':
        return state.user ? (
          <Home 
            user={state.user} 
            phase={phase} 
            setPhase={setPhase} 
            kms={{ kmParticular, kmDeslocamento, kmPassageiro }} 
            onFinishSession={saveSession}
            onFinishRace={addRace}
            currentRaces={state.currentRaces || []}
            currentDailyExpenses={state.currentDailyExpenses || []}
            maintenance={state.maintenance || []} 
          />
        ) : null;
      case 'FINANCEIRO':
        return state.user ? <Financeiro sessions={state.sessions || []} expenses={state.expenses || []} maintenance={state.maintenance || []} user={state.user} /> : null;
      case 'POSTOS':
        return state.user ? <Postos user={state.user} stations={state.stations || []} onAddStation={(name) => { const s = { id: Date.now().toString(), name }; setState(p => ({ ...p, stations: [...(p.stations || []), s] })); return s; }} onRefuel={(e) => {
          const updatedStations = (state.stations || []).map(s => s.id === e.stationId ? { ...s, lastGasPrice: e.fuelType === 'GASOLINA' ? e.pricePerLiter : s.lastGasPrice, lastEtanolPrice: e.fuelType === 'ETANOL' ? e.pricePerLiter : s.lastEtanolPrice } : s);
          setState(p => ({ ...p, stations: updatedStations, refuels: [...(p.refuels || []), e], user: p.user ? { ...p.user, currentFuelLevel: e.isFullTank ? p.user.car.tankCapacity : Math.min(p.user.car.tankCapacity, p.user.currentFuelLevel + e.liters), lastOdometer: Math.max(p.user.lastOdometer, e.odometerAtRefuel) } : null }));
        }} refuels={state.refuels || []} /> : null;
      case 'CUSTOS':
        return <Custos expenses={state.expenses || []} onAdd={(exp) => setState(p => ({ ...p, expenses: [...(p.expenses || []), exp], currentDailyExpenses: exp.isWorkExpense && phase !== 'IDLE' ? [...(p.currentDailyExpenses || []), exp] : p.currentDailyExpenses }))} isWorking={phase !== 'IDLE'} />;
      case 'VEICULO':
        return state.user ? <Veiculo user={state.user} maintenance={state.maintenance || []} onUpsert={(task) => setState(prev => ({ ...prev, maintenance: prev.maintenance.find(m => m.id === task.id) ? prev.maintenance.map(m => m.id === task.id ? task : m) : [...(prev.maintenance || []), task] }))} sessions={state.sessions || []} /> : null;
      default:
        return <Landing user={state.user} onStart={() => setView('ONBOARDING')} onSelect={() => setView('HOME')} onNewRegistration={() => setView('ONBOARDING')} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col max-w-md mx-auto relative bg-black overflow-hidden">
      <div className="flex-1 overflow-auto">
        {renderView()}
      </div>
      
      {state.user && phase !== 'IDLE' && (
        <FloatingTracker 
          phase={phase} 
          netToday={totalNetToday} 
          currentView={view}
          onSwitchPhase={setPhase}
          onAddRace={() => setView('HOME')} 
        />
      )}

      {state.user && view !== 'ONBOARDING' && view !== 'LANDING' && (
        <nav className="fixed bottom-6 left-6 right-6 max-w-[calc(448px-3rem)] mx-auto bg-black/95 backdrop-blur-xl border border-white/10 px-6 py-5 rounded-[2.5rem] flex justify-around items-center safe-area-bottom z-50 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
          <button onClick={() => setView('HOME')} className={`flex flex-col items-center gap-1 transition-all ${view === 'HOME' ? 'text-white scale-110' : 'text-zinc-600'}`}>
            <LayoutDashboard size={20} />
          </button>
          <button onClick={() => setView('POSTOS')} className={`flex flex-col items-center gap-1 transition-all ${view === 'POSTOS' ? 'text-white scale-110' : 'text-zinc-600'}`}>
            <Fuel size={20} />
          </button>
          <button onClick={() => setView('CUSTOS')} className={`flex flex-col items-center gap-1 transition-all ${view === 'CUSTOS' ? 'text-white scale-110' : 'text-zinc-600'}`}>
            <Receipt size={20} />
          </button>
          <button onClick={() => setView('VEICULO')} className={`flex flex-col items-center gap-1 transition-all ${view === 'VEICULO' ? 'text-white scale-110' : 'text-zinc-600'}`}>
            <Car size={20} />
          </button>
          <button onClick={() => setView('FINANCEIRO')} className={`flex flex-col items-center gap-1 transition-all ${view === 'FINANCEIRO' ? 'text-white scale-110' : 'text-zinc-600'}`}>
            <Wallet size={20} />
          </button>
        </nav>
      )}
    </div>
  );
};

export default App;
