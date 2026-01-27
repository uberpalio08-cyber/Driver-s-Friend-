
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { UserProfile, AppState, AppView, TrackingPhase, Race, RefuelEntry, Expense, AppProfile, MaintenanceTask, TripSession } from './types';
import Landing from './components/Landing';
import Onboarding from './components/Onboarding';
import Home from './components/Home';
import Financeiro from './components/Financeiro';
import Postos from './components/Postos';
import Custos from './components/Custos';
import Veiculo from './components/Veiculo';
import FloatingTracker from './components/FloatingTracker';
import { LayoutDashboard, Wallet, Fuel, Receipt, Car } from 'lucide-react';

const STORAGE_KEY = 'drivers_friend_pro_v20_final';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    user: null, sessions: [], refuels: [], expenses: [], maintenance: [], currentRaces: [], isLoaded: false
  });
  const [view, setView] = useState<AppView>('LANDING');
  const [phase, setPhase] = useState<TrackingPhase>('IDLE');
  const [trackedKm, setTrackedKm] = useState(0);
  
  const lastPos = useRef<GeolocationPosition | null>(null);
  const watchId = useRef<number | null>(null);

  useEffect(() => {
    (window as any).AppLogic = {
      setPhase: (p: TrackingPhase) => setPhase(p),
      addRace: () => {
        const event = new CustomEvent('openFinishRaceModal');
        window.dispatchEvent(event);
      }
    };
  }, []);

  // CÁLCULO DE RESERVA: Soma o (Custo Estimado / Intervalo) de TODAS as tarefas da garagem
  const dynamicMaintCostPerKm = useMemo(() => {
    if (state.maintenance.length === 0) return 0; // Se não houver nada na garagem, a reserva é 0
    return state.maintenance.reduce((acc, task) => {
      // Ex: Óleo (285 / 10000 = 0,0285 por km)
      const taskCostPerKm = task.interval > 0 ? (task.lastCost / task.interval) : 0;
      return acc + taskCostPerKm;
    }, 0);
  }, [state.maintenance]);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setState({ ...parsed.state, isLoaded: true });
        setPhase(parsed.phase || 'IDLE');
        if(parsed.state.user) setView('LANDING');
      } catch (e) { setState(prev => ({ ...prev, isLoaded: true })); }
    } else setState(prev => ({ ...prev, isLoaded: true }));
  }, []);

  useEffect(() => {
    if (state.isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ state, phase }));
    }
  }, [state, phase]);

  useEffect(() => {
    if (['DESLOCAMENTO', 'PASSAGEIRO', 'PARTICULAR'].includes(phase)) {
      watchId.current = navigator.geolocation.watchPosition(
        (pos) => {
          if (lastPos.current) {
            const dist = calculateDistance(
              lastPos.current.coords.latitude, lastPos.current.coords.longitude,
              pos.coords.latitude, pos.coords.longitude
            );
            if (dist > 0.005) {
                setTrackedKm(prev => prev + dist);
                if (state.user) {
                  const fuelUsed = dist / state.user.calculatedAvgConsumption;
                  setState(p => p.user ? ({...p, user: {...p.user, currentFuelLevel: Math.max(0, p.user.currentFuelLevel - fuelUsed)}}) : p);
                }
            }
          }
          lastPos.current = pos;
        },
        (err) => console.error("GPS Error:", err),
        { enableHighAccuracy: true, maximumAge: 0 }
      );
    } else {
      if (watchId.current) navigator.geolocation.clearWatch(watchId.current);
      lastPos.current = null;
    }
    return () => { if (watchId.current) navigator.geolocation.clearWatch(watchId.current); };
  }, [phase, state.user?.calculatedAvgConsumption]);

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const handleFinishRace = (gross: number, profile: AppProfile, manualKm?: number) => {
    if (!state.user) return;
    
    const kmOfThisRace = (manualKm !== undefined && manualKm > 0) ? manualKm : trackedKm;
    
    // 1. Taxa do App
    const appTax = gross * (profile.taxValue / 100);
    
    // 2. Combustível
    const fuelPrice = state.refuels[0]?.pricePerLiter || 5.85;
    const fuelCost = kmOfThisRace > 0 ? (kmOfThisRace / state.user.calculatedAvgConsumption) * fuelPrice : 0;
    
    // 3. Reserva de Manutenção (CALCULADA POR KM RODADO)
    // Se dynamicMaintCostPerKm for 0.0285 e rodou 10km, reserva 0.285
    const maintRes = kmOfThisRace > 0 ? kmOfThisRace * dynamicMaintCostPerKm : 0;
    
    // 4. Lucro Líquido Real = Bruto - Taxas - Combustível - Manutenção
    const net = gross - appTax - fuelCost - maintRes;

    const newRace: Race = {
      id: Date.now().toString(), date: Date.now(), appName: profile.name, startTime: Date.now(),
      endTime: Date.now(), grossEarnings: gross, appTax, fuelCost, maintReserve: maintRes,
      personalReserve: 0, netProfit: net, emptyKm: 0, displacementKm: 0, raceKm: kmOfThisRace 
    };

    setState(p => ({ ...p, currentRaces: [newRace, ...p.currentRaces] }));
    setTrackedKm(0);
    setPhase('ON_SHIFT');
  };

  const handleStartShift = (odo: number) => {
    if (!state.user) return;
    const gap = odo - state.user.lastOdometer;
    if (gap > 0 && state.user.lastOdometer !== 0) {
      const fuelPrice = state.refuels[0]?.pricePerLiter || 5.85;
      const fuelUsed = gap / state.user.calculatedAvgConsumption;
      const fuelCost = fuelUsed * fuelPrice;
      const maintCost = gap * dynamicMaintCostPerKm;
      
      const particularExpense: Expense = {
        id: `p-${Date.now()}`,
        date: Date.now(),
        category: 'COMBUSTÍVEL',
        description: `KM Particular (${gap.toFixed(1)}km)`,
        amount: fuelCost + maintCost,
        isWorkExpense: false
      };

      setState(p => ({
        ...p,
        expenses: [particularExpense, ...p.expenses],
        user: p.user ? { ...p.user, lastOdometer: odo, currentFuelLevel: Math.max(0, p.user.currentFuelLevel - fuelUsed) } : null
      }));
    } else {
      setState(p => ({ ...p, user: p.user ? { ...p.user, lastOdometer: odo } : null }));
    }
    setPhase('ON_SHIFT');
    setTrackedKm(0);
  };

  const handleFinishShift = (endOdo: number) => {
    if (!state.user) return;
    const totalGross = state.currentRaces.reduce((acc, r) => acc + r.grossEarnings, 0);
    const totalNet = state.currentRaces.reduce((acc, r) => acc + r.netProfit, 0);
    const session: TripSession = {
      id: Date.now().toString(), date: Date.now(), startOdometer: state.user.lastOdometer,
      endOdometer: endOdo, races: [...state.currentRaces], totalGross, totalNet
    };
    setState(p => ({
      ...p,
      sessions: [session, ...p.sessions],
      currentRaces: [],
      user: p.user ? { ...p.user, lastOdometer: endOdo } : null
    }));
    setPhase('IDLE');
  };

  const handleAddExpense = (exp: Expense) => {
    setState(p => {
      const updatedMaint = p.maintenance.map(task => {
        const descLower = exp.description.toLowerCase();
        const taskLower = task.name.toLowerCase();
        if (descLower.includes(taskLower) || taskLower.includes(descLower)) {
          return { ...task, lastOdo: p.user?.lastOdometer || task.lastOdo, lastCost: exp.amount };
        }
        return task;
      });
      return {
        ...p,
        expenses: [exp, ...p.expenses],
        maintenance: updatedMaint
      };
    });
  };

  const handleRefuel = (entry: RefuelEntry) => {
    setState(p => {
      if (!p.user) return p;
      const newLevel = Math.min(p.user.car.tankCapacity, p.user.currentFuelLevel + entry.liters);
      return {
        ...p,
        refuels: [entry, ...p.refuels],
        user: { ...p.user, currentFuelLevel: entry.isFullTank ? p.user.car.tankCapacity : newLevel }
      };
    });
  };

  const netToday = useMemo(() => state.currentRaces.reduce((acc, r) => acc + r.netProfit, 0), [state.currentRaces]);

  if (!state.isLoaded) return <div className="h-screen bg-[#020617] flex items-center justify-center text-blue-500 font-black animate-pulse text-2xl uppercase tracking-widest italic">Iniciando Auditoria...</div>;

  return (
    <div className="flex flex-col h-screen bg-[#020617] text-slate-100 overflow-hidden no-select">
      <main className="flex-1 overflow-y-auto px-4 safe-scroll">
        {view === 'LANDING' && <Landing user={state.user} onStart={() => setView('ONBOARDING')} onSelect={() => setView('HOME')} onNewRegistration={() => { localStorage.clear(); window.location.reload(); }} onInstall={() => {}} canInstall={false} />}
        {view === 'ONBOARDING' && <Onboarding onComplete={(u) => { setState(p => ({ ...p, user: u })); setView('HOME'); }} />}
        {view === 'HOME' && state.user && (
          <Home 
            user={state.user} phase={phase} setPhase={setPhase} currentRaces={state.currentRaces} sessions={state.sessions} trackedKm={trackedKm} maintCostPerKm={dynamicMaintCostPerKm}
            onFinishRace={handleFinishRace} onFinishShift={handleFinishShift} onStartShift={handleStartShift} 
            onUpdateUser={(u) => setState(p => ({...p, user: u}))} onRemoveRace={(id) => setState(p => ({...p, currentRaces: p.currentRaces.filter(x => x.id !== id)}))}
          />
        )}
        {view === 'FINANCEIRO' && state.user && <Financeiro user={state.user} sessions={state.sessions} expenses={state.expenses} refuels={state.refuels} currentRaces={state.currentRaces} maintCostPerKm={dynamicMaintCostPerKm} />}
        {view === 'POSTOS' && state.user && <Postos user={state.user} refuels={state.refuels} onRefuel={handleRefuel} onUpdateUser={(u) => setState(p => ({...p, user: u}))} />}
        {view === 'CUSTOS' && <Custos expenses={state.expenses} refuels={state.refuels} onAdd={handleAddExpense} onRemoveExpense={(id) => setState(p => ({ ...p, expenses: p.expenses.filter(x => x.id !== id) }))} onRemoveRefuel={(id) => setState(p => ({ ...p, refuels: p.refuels.filter(x => x.id !== id) }))} isWorking={phase !== 'IDLE'} />}
        {view === 'VEICULO' && state.user && <Veiculo user={state.user} maintenance={state.maintenance} onUpsert={(m) => setState(p => ({ ...p, maintenance: [...p.maintenance.filter(item => item.id !== m.id), m] }))} onDelete={(id) => setState(p => ({ ...p, maintenance: p.maintenance.filter(item => item.id !== id) }))} maintCostPerKm={dynamicMaintCostPerKm} currentRaces={state.currentRaces} sessions={state.sessions} />}
      </main>

      {phase !== 'IDLE' && <FloatingTracker phase={phase} netToday={netToday} currentView={view} onSwitchPhase={(p) => setPhase(p)} onAddRace={() => (window as any).AppLogic.addRace()} />}
      
      {state.user && view !== 'LANDING' && view !== 'ONBOARDING' && (
        <nav className="fixed bottom-6 left-6 right-6 h-16 bg-[#0f172a]/95 backdrop-blur-xl border border-white/5 rounded-3xl flex justify-around items-center shadow-2xl z-50">
          {[{ id: 'HOME', icon: LayoutDashboard }, { id: 'POSTOS', icon: Fuel }, { id: 'CUSTOS', icon: Receipt }, { id: 'VEICULO', icon: Car }, { id: 'FINANCEIRO', icon: Wallet }].map(tab => (
            <button key={tab.id} onClick={() => setView(tab.id as AppView)} className={`p-3 rounded-2xl transition-all active:scale-90 ${view === tab.id ? 'bg-blue-600 text-white shadow-xl' : 'text-slate-600'}`}>
              <tab.icon size={22} />
            </button>
          ))}
        </nav>
      )}
    </div>
  );
};
export default App;
