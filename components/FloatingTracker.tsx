
import React, { useState } from 'react';
import { TrackingPhase, AppView } from '../types';
import { Navigation, Play, Users, Car, CheckCircle, ChevronUp, ChevronDown } from 'lucide-react';

interface Props {
  phase: TrackingPhase;
  netToday: number;
  currentView: AppView;
  onSwitchPhase: (p: TrackingPhase) => void;
  onAddRace: () => void;
}

const FloatingTracker: React.FC<Props> = ({ phase, netToday, currentView, onSwitchPhase, onAddRace }) => {
  const [expanded, setExpanded] = useState(false);

  const getPhaseIcon = () => {
    switch (phase) {
      case 'PARTICULAR': return <Car size={16} />;
      case 'DESLOCAMENTO': return <Navigation size={16} className="animate-pulse" />;
      case 'PASSAGEIRO': return <Users size={16} className="text-white" />;
      default: return <Play size={16} />;
    }
  };

  const getPhaseText = () => {
    switch (phase) {
      case 'PARTICULAR': return 'Modo Particular';
      case 'DESLOCAMENTO': return 'Buscando Pax';
      case 'PASSAGEIRO': return 'Em Corrida';
      default: return 'IDLE';
    }
  };

  return (
    <div className={`fixed left-8 right-8 z-[60] transition-all duration-300 ease-in-out ${expanded ? 'bottom-32' : 'bottom-28'}`}>
      <div className={`bg-black border border-white/20 shadow-[0_15px_40px_rgba(0,0,0,0.8)] rounded-[2rem] overflow-hidden transition-all ${expanded ? 'h-auto py-6' : 'h-14 py-0'}`}>
        
        {/* Compact Bar */}
        <div 
          onClick={() => setExpanded(!expanded)}
          className="h-14 px-6 flex items-center justify-between cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${phase === 'PASSAGEIRO' ? 'bg-white text-black' : 'bg-zinc-900 text-white'}`}>
              {getPhaseIcon()}
            </div>
            <div>
              <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">{getPhaseText()}</p>
              <p className="text-xs font-black text-white italic">R$ {netToday.toFixed(2)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
             <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
             {expanded ? <ChevronDown size={18} className="text-zinc-500" /> : <ChevronUp size={18} className="text-zinc-500" />}
          </div>
        </div>

        {/* Expanded Controls */}
        {expanded && (
          <div className="px-6 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div className="h-px bg-zinc-800 w-full" />
            
            <div className="grid grid-cols-2 gap-3">
              {phase === 'PARTICULAR' && (
                <button onClick={() => { onSwitchPhase('DESLOCAMENTO'); setExpanded(false); }} className="col-span-2 bg-white text-black py-4 rounded-2xl font-black text-[10px] uppercase flex items-center justify-center gap-2">
                  <Play size={14} fill="black" /> Iniciar Corrida
                </button>
              )}
              
              {phase === 'DESLOCAMENTO' && (
                <button onClick={() => { onSwitchPhase('PASSAGEIRO'); setExpanded(false); }} className="col-span-2 bg-white text-black py-4 rounded-2xl font-black text-[10px] uppercase flex items-center justify-center gap-2">
                  <Users size={14} fill="black" /> Embarcar Passageiro
                </button>
              )}

              {phase === 'PASSAGEIRO' && (
                <button onClick={() => { onAddRace(); setExpanded(false); }} className="col-span-2 bg-white text-black py-4 rounded-2xl font-black text-[10px] uppercase flex items-center justify-center gap-2">
                  <CheckCircle size={14} fill="black" /> Finalizar & Cobrar
                </button>
              )}

              {phase !== 'PARTICULAR' && (
                <button onClick={() => { onSwitchPhase('PARTICULAR'); setExpanded(false); }} className="col-span-2 border border-zinc-700 text-zinc-400 py-3 rounded-2xl font-black text-[9px] uppercase">
                  Pausar / Particular
                </button>
              )}
            </div>
            
            <p className="text-center text-[8px] text-zinc-600 font-black uppercase tracking-[0.2em]">GPS Ativo • Rastreando KM</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FloatingTracker;
