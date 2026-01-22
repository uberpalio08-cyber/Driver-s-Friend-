import React, { useState, useEffect, useRef, useMemo } from 'react';
import { UserProfile, AppState, AppView, TrackingPhase, Race } from './types';
import Landing from './components/Landing';
import Onboarding from './components/Onboarding';
import Home from './components/Home';
import Financeiro from './components/Financeiro';
import Postos from './components/Postos';
import Custos from './components/Custos';
import Veiculo from './components/Veiculo';
import { LayoutDashboard, Wallet, Fuel, Receipt, Car } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

const STORAGE_KEY = 'drivers_friend_native_v1';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    user: null, sessions: [], refuels: [], expenses: [], maintenance: [], currentRaces: [], isLoaded: false
  });
  const [view, setView] = useState<AppView>('LANDING');
  const [phase, setPhase] = useState<TrackingPhase>('IDLE');

  const ai = useMemo(() => new GoogleGenAI({ apiKey: process.env.API_KEY || '' }), []);

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

  if (!state.isLoaded) return <div className="h-screen bg-black flex items-center justify-center text-blue-500 font-black italic">CONECTANDO SISTEMA NATIVO...</div>;

  return (
    <div id="root" className="flex flex-col h-screen bg-black text-slate-100 overflow-hidden">
      <div className="flex-1 overflow-y-auto px-4 safe-scroll pt-2">
        {view === 'LANDING' && <Landing user={state.user} onStart={() => setView('ONBOARDING')} onSelect={() => setView('HOME')} onNewRegistration={() => { localStorage.clear(); window.location.reload(); }} />}
        {view === 'ONBOARDING' && <Onboarding ai={ai} onComplete={(u) => { setState(p => ({ ...p, user: u })); setView('HOME'); }} />}
        {view === 'HOME' && state.user && <Home user={state.user} phase={phase} setPhase={setPhase} kms={{particular:0, deslocamento:0, passageiro:0}} currentRaces={state.currentRaces} maintenance={state.maintenance} onFinishRace={(g) => {}} onRemoveRace={(id) => {}} onFinishShift={(odo) => {}} onUpdateUser={(u) => setState(p => ({...p, user: u}))} />}
        {view === 'FINANCEIRO' && state.user && <Financeiro user={state.user} sessions={state.sessions} expenses={state.expenses} refuels={state.refuels} currentRaces={state.currentRaces} />}
        {view === 'POSTOS' && state.user && <Postos user={state.user} refuels={state.refuels} onRefuel={(r) => setState(p => ({ ...p, refuels: [...p.refuels, r] }))} />}
        {view === 'CUSTOS' && <Custos expenses={state.expenses} refuels={state.refuels} onAdd={(e) => setState(p => ({ ...p, expenses: [...p.expenses, e] }))} onRemoveExpense={(id) => setState(p => ({ ...p, expenses: p.expenses.filter(x => x.id !== id) }))} onRemoveRefuel={(id) => setState(p => ({ ...p, refuels: p.refuels.filter(x => x.id !== id) }))} isWorking={phase !== 'IDLE'} />}
        {view === 'VEICULO' && state.user && <Veiculo user={state.user} maintenance={state.maintenance} onUpsert={(m) => setState(p => ({ ...p, maintenance: [...p.maintenance.filter(item => item.id !== m.id), m] }))} onDelete={(id) => setState(p => ({ ...p, maintenance: p.maintenance.filter(item => item.id !== id) }))} maintCostPerKm={0.15} currentRaces={state.currentRaces} sessions={state.sessions} />}
      </div>
      {state.user && view !== 'LANDING' && view !== 'ONBOARDING' && (
        <nav className="fixed bottom-6 left-6 right-6 h-16 bg-slate-900/95 backdrop-blur-2xl border border-white/5 rounded-3xl flex justify-around items-center shadow-2xl z-50">
          {[{ id: 'HOME', icon: LayoutDashboard }, { id: 'POSTOS', icon: Fuel }, { id: 'CUSTOS', icon: Receipt }, { id: 'VEICULO', icon: Car }, { id: 'FINANCEIRO', icon: Wallet }].map(tab => (
            <button key={tab.id} onClick={() => setView(tab.id as AppView)} className={`p-3 rounded-2xl transition-all ${view === tab.id ? 'bg-blue-600 text-white scale-110 shadow-lg' : 'text-slate-500 opacity-40'}`}>
              <tab.icon size={22} />
            </button>
          ))}
        </nav>
      )}
    </div>
  );
};
export default App;