import React from 'react';
import { TrackingPhase } from '../types';
import { Play, Navigation, Users, Car } from 'lucide-react';

interface Props {
  phase: TrackingPhase;
  netToday: number;
  onOpenHome: () => void;
}

const FloatingBubble: React.FC<Props> = ({ phase, netToday, onOpenHome }) => {
  if (phase === 'IDLE') return null;

  const getIcon = () => {
    switch (phase) {
      case 'PARTICULAR': return <Car size={20} />;
      case 'DESLOCAMENTO': return <Navigation size={20} className="animate-pulse" />;
      case 'PASSAGEIRO': return <Users size={20} />;
      default: return <Play size={20} />;
    }
  };

  return (
    <div 
      onClick={onOpenHome}
      className="fixed bottom-32 right-6 z-[70] cursor-pointer"
    >
      <div className="relative group">
        <div className={`w-16 h-16 rounded-full flex flex-col items-center justify-center shadow-2xl transition-all active:scale-90 border-2 ${phase === 'PASSAGEIRO' ? 'bg-white border-black text-black bubble-glow' : 'bg-black border-white text-white pulse-effect'}`}>
          {getIcon()}
          <span className={`text-[8px] font-black uppercase mt-1 leading-none ${phase === 'PASSAGEIRO' ? 'text-black' : 'text-zinc-400'}`}>R${Math.floor(netToday)}</span>
        </div>
        
        {/* Tooltip informativo */}
        <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-black/90 backdrop-blur-md px-3 py-2 rounded-xl border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
          <p className="text-[10px] font-black text-white uppercase tracking-widest">Lucro: R$ {netToday.toFixed(2)}</p>
        </div>
      </div>
    </div>
  );
};

export default FloatingBubble;