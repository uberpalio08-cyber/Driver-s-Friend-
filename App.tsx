
import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, TripSession, AppState, AppView, TrackingPhase, GasStation, RefuelEntry, Expense, MaintenanceTask, Race } from './types';
import Landing from './components/Landing';
import Onboarding from './components/Onboarding';
import Home from './components/Home';
import Financeiro from './components/Financeiro';
import Postos from './components/Postos';
import Custos from './components/Custos';
import Veiculo from './components/Veiculo';
import { LayoutDashboard, Wallet, Fuel, Receipt, Car } from 'lucide-react';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    user: null,
    sessions: [],
    stations: [],
    refuels: [],
    expenses: [],
    maintenance: [],
    currentRaces: [],
    currentDailyExpenses: [],
    isLoaded: false
  });
  const [view, setView] = useState<AppView>('LANDING');
  const [phase, setPhase] = useState<TrackingPhase>('IDLE');
  
  const [kmParticular, setKmParticular] = useState(0);
  const [kmDeslocamento, setKmDeslocamento] = useState(0);
  const [kmPassageiro, setKmPassageiro] = useState(0);
  
  const lastPos = useRef<GeolocationCoordinates | null>(null);
  const watchId = useRef<number | null>(null);

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
    const saved = localStorage.getItem('drivers_friend_data_noir_v1');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setState({ ...parsed, isLoaded: true });
      } catch (e) {
        setState(prev => ({ ...prev, isLoaded: true }));
      }
    } else {
      setState(prev => ({ ...prev, isLoaded: true }));
    }
  }, []);

  useEffect(() => {
    if (state.isLoaded) {
      localStorage.setItem('drivers_friend_data_noir_v1', JSON.stringify(state));
    }
  }, [state]);

  useEffect(() => {
    if (phase !== 'IDLE') {
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
                const fuelSpent = dist / prev.user.calculatedAvgConsumption;
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
        (err) => console.error(err),
        { enableHighAccuracy: true }
      );
    } else {
      if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
      lastPos.current = null;
    }
    return () => {
      if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
    };
  }, [phase]);

  const addRace = (gross: number) => {
    if (!state.user) return;
    const lastRefuel = state.refuels[state.refuels.length - 1];
    const fuelPrice = lastRefuel ? lastRefuel.pricePerLiter : 6.0;

    const fuelCost = ((kmDeslocamento + kmPassageiro) / state.user.calculatedAvgConsumption) * fuelPrice;
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
      currentRaces: [...prev.currentRaces, newRace]
    }));

    setKmDeslocamento(0);
    setKmPassageiro(0);
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

  const handleRefuel = (entry: RefuelEntry) => {
    setState(prev => {
      if (!prev.user) return prev;
      
      const updatedStations = prev.stations.map(s => {
        if (s.id === entry.stationId) {
          return {
            ...s,
            lastGasPrice: entry.fuelType === 'GASOLINA' ? entry.pricePerLiter : s.lastGasPrice,
            lastEtanolPrice: entry.fuelType === 'ETANOL' ? entry.pricePerLiter : s.lastEtanolPrice,
          };
        }
        return s;
      });

      let newLevel = prev.user.currentFuelLevel + entry.liters;
      if (entry.isFullTank) newLevel = prev.user.car.tankCapacity;

      return {
        ...prev,
        stations: updatedStations,
        refuels: [...prev.refuels, entry],
        user: { 
          ...prev.user, 
          currentFuelLevel: Math.min(prev.user.car.tankCapacity, newLevel),
          lastOdometer: Math.max(prev.user.lastOdometer, entry.odometerAtRefuel)
        }
      };
    });
  };

  const renderView = () => {
    switch (view) {
      case 'LANDING':
        return <Landing user={state.user} onStart={() => setView('ONBOARDING')} onSelect={() => setView('HOME')} onNewRegistration={() => setView('ONBOARDING')} />;
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
            currentRaces={state.currentRaces}
            currentDailyExpenses={state.currentDailyExpenses}
            maintenance={state.maintenance} 
          />
        ) : null;
      case 'FINANCEIRO':
        return state.user ? <Financeiro sessions={state.sessions} expenses={state.expenses} maintenance={state.maintenance} user={state.user} /> : null;
      case 'POSTOS':
        return state.user ? <Postos user={state.user} stations={state.stations} onAddStation={(name) => { const s = { id: Date.now().toString(), name }; setState(p => ({ ...p, stations: [...p.stations, s] })); return s; }} onRefuel={handleRefuel} refuels={state.refuels} /> : null;
      case 'CUSTOS':
        return <Custos expenses={state.expenses} onAdd={(exp) => setState(p => ({ ...p, expenses: [...p.expenses, exp], currentDailyExpenses: exp.isWorkExpense && phase !== 'IDLE' ? [...p.currentDailyExpenses, exp] : p.currentDailyExpenses }))} isWorking={phase !== 'IDLE'} />;
      case 'VEICULO':
        return state.user ? <Veiculo user={state.user} maintenance={state.maintenance} onUpsert={(task) => setState(prev => ({ ...prev, maintenance: prev.maintenance.find(m => m.id === task.id) ? prev.maintenance.map(m => m.id === task.id ? task : m) : [...prev.maintenance, task] }))} sessions={state.sessions} /> : null;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col max-w-md mx-auto relative">
      <div className="flex-1 overflow-auto pb-28">{renderView()}</div>
      {state.user && view !== 'ONBOARDING' && view !== 'LANDING' && (
        <nav className="fixed bottom-6 left-6 right-6 max-w-[calc(448px-3rem)] mx-auto bg-black/95 backdrop-blur-xl border border-white/20 px-6 py-5 rounded-[2.5rem] flex justify-around items-center safe-area-bottom z-50 shadow-2xl">
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
