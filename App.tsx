import React, { useState, useEffect, useRef, useMemo } from 'react';
import { UserProfile, AppState, AppView, TrackingPhase, Race, AppProfile } from './types';
import Landing from './components/Landing';
import Onboarding from './components/Onboarding';
import Home from './components/Home';
import Financeiro from './components/Financeiro';
import Postos from './components/Postos';
import Custos from './components/Custos';
import Veiculo from './components/Veiculo';
import { LayoutDashboard, Wallet, Fuel, Receipt, Car } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

const STORAGE_KEY = 'drivers_friend_v2_final';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    user: null, sessions: [], refuels: [], expenses: [], maintenance: [], currentRaces: [], isLoaded: false
  });
  const [view, setView] = useState<AppView>('LANDING');
  const [phase, setPhase] = useState<TrackingPhase>('IDLE');
  
  const [sessionKms, setSessionKms] = useState({ particular: 0, deslocamento: 0, passageiro: 0 });
  const lastPos = useRef<GeolocationCoordinates | null>(null);
  const watchId = useRef<number | null>(null);

  const ai = useMemo(() => {
    return new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  }, []);

  const requestGPSTracking = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        () => console.log("GPS Permitido"),
        (err) => alert("O rastreio de KM não funcionará sem GPS. Por favor, ative nas configurações do celular."),
        { enableHighAccuracy: true }
      );
    }
  };

  useEffect(() => {
    if (phase === 'IDLE') {
      if (watchId.current) navigator.geolocation.clearWatch(watchId.current);
      return;
    }

    watchId.current = navigator.geolocation.watchPosition((pos) => {
      if (lastPos.current) {
        const R = 6371;
        const dLat = (pos.coords.latitude - lastPos.current.latitude) * Math.PI / 180;
        const dLon = (pos.coords.longitude - lastPos.current.longitude) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lastPos.current.latitude * Math.PI/180) * Math.cos(pos.coords.latitude * Math.PI/180) * Math.sin(dLon/2) * Math.sin(dLon/2);
        const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        
        if (dist > 0.005) { // 5 metros
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
      } catch (e) { setState(prev => ({ ...prev, isLoaded: true })); }
    } else setState(prev => ({ ...prev, isLoaded: true }));
  }, []);

  useEffect(() => {
    if (state.isLoaded) localStorage.setItem(STORAGE_KEY, JSON.stringify({ state, phase }));
  }, [state, phase]);

  const handleFinishRace = (gross: number) => {
    if (!state.user) return;
    const profile = state.user.appProfiles.find(p => p.id === state.user?.selectedAppProfileId);
    if (!profile) return;

    const raceKm = sessionKms.deslocamento + sessionKms.passageiro;
    const appTax = gross * (profile.taxPercentage / 100);
    const fuelPrice = state.refuels.length > 0 ? state.refuels[state.refuels.length-1].pricePerLiter : 5.80;
    const fuelCost = (raceKm / state.user.calculatedAvgConsumption) * fuelPrice;
    
    // Cálculo de reservas baseado em metas
    const dailyMaint = 0.12 * raceKm; // Reserva mecânica fixa sugerida por KM
    const netProfit = gross - appTax - fuelCost - dailyMaint;

    setState(prev => ({
      ...prev,
      currentRaces: [...prev.currentRaces, {
        id: Date.now().toString(), date: Date.now(), appName: profile.name,
        startTime: Date.now(), boardingTime: Date.now(), endTime: Date.now(),
        kmDeslocamento: sessionKms.deslocamento, kmPassageiro: sessionKms.passageiro,
        grossEarnings: gross, appTax, fuelCost, maintReserve: dailyMaint, personalReserve: 0, netProfit
      }],
      user: prev.user ? { ...prev.user, lastOdometer: prev.user.lastOdometer + raceKm } : null
    }));
    setSessionKms({ particular: 0, deslocamento: 0, passageiro: 0 });
    setPhase('ON_SHIFT');
  };

  if (!state.isLoaded) return <div className="h-screen bg-slate-950 flex items-center justify-center text-white font-black italic">CARREGANDO...</div>;

  return (
    <div id="root" className="flex flex-col h-screen bg-slate-950 text-slate-100 overflow-hidden">
      <div className="flex-1 overflow-y-auto px-4 safe-scroll pt-2">
        {view === 'LANDING' && <Landing user={state.user} onStart={() => { requestGPSTracking(); setView('ONBOARDING'); }} onSelect={() => { requestGPSTracking(); setView('HOME'); }} onNewRegistration={() => { localStorage.clear(); window.location.reload(); }} />}
        {view === 'ONBOARDING' && <Onboarding ai={ai} onComplete={(u) => { setState(p => ({ ...p, user: u })); setView('HOME'); }} />}
        {view === 'HOME' && state.user && <Home user={state.user} phase={phase} setPhase={setPhase} kms={sessionKms} currentRaces={state.currentRaces} maintenance={state.maintenance} onFinishRace={handleFinishRace} onRemoveRace={(id) => setState(p => ({ ...p, currentRaces: p.currentRaces.filter(r => r.id !== id) }))} onFinishShift={(odo) => { setPhase('IDLE'); setState(p => ({...p, user: p.user ? {...p.user, lastOdometer: odo} : null, currentRaces: []})); }} onUpdateUser={(u) => setState(p => ({ ...p, user: u }))} />}
        {view === 'FINANCEIRO' && state.user && <Financeiro user={state.user} sessions={state.sessions} expenses={state.expenses} refuels={state.refuels} currentRaces={state.currentRaces} />}
        {view === 'POSTOS' && state.user && <Postos user={state.user} refuels={state.refuels} onRefuel={(r) => setState(p => ({ ...p, refuels: [...p.refuels, r] }))} />}
        {view === 'CUSTOS' && <Custos expenses={state.expenses} refuels={state.refuels} onAdd={(e) => setState(p => ({ ...p, expenses: [...p.expenses, e] }))} onRemoveExpense={(id) => setState(p => ({ ...p, expenses: p.expenses.filter(x => x.id !== id) }))} onRemoveRefuel={(id) => setState(p => ({ ...p, refuels: p.refuels.filter(x => x.id !== id) }))} isWorking={phase !== 'IDLE'} />}
        {view === 'VEICULO' && state.user && <Veiculo user={state.user} maintenance={state.maintenance} onUpsert={(m) => setState(p => ({ ...p, maintenance: [...p.maintenance.filter(item => item.id !== m.id), m] }))} onDelete={(id) => setState(p => ({ ...p, maintenance: p.maintenance.filter(item => item.id !== id) }))} maintCostPerKm={0.12} currentRaces={state.currentRaces} sessions={state.sessions} />}
      </div>
      {state.user && view !== 'LANDING' && view !== 'ONBOARDING' && (
        <nav className="fixed bottom-6 left-6 right-6 h-16 bg-slate-900/90 backdrop-blur-xl border border-white/5 rounded-3xl flex justify-around items-center shadow-2xl z-50">
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