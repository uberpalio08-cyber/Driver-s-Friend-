
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
    if (phase === 'PARTICULAR') return <Car size={20} />;
    if (phase === 'DESLOCAMENTO') return <Navigation size={20} className="animate-pulse" />;
    if (phase === 'PASSAGEIRO') return <Users size={20} />;
    return <Play size={20} />;
  };

  return (
    <div 
      onClick={onOpenHome}
      className="fixed bottom-32 right-6 z-[70] cursor-pointer"
    >
      <div className="relative group">
        <div className={`w-16 h-16 rounded-full flex flex-col items-center justify-center shadow-2xl transition-all active:scale-90 border-2 ${phase === 'PASSAGEIRO' ? 'bg-white border-black text-black' : 'bg-black border-white text-white'}`}>
          {getIcon()}
          <span className={`text-[8px] font-black uppercase mt-1 leading-none ${phase === 'PASSAGEIRO' ? 'text-black' : 'text-zinc-400'}`}>R${Math.floor(netToday)}</span>
        </div>
      </div>
    </div>
  );
};

export default FloatingBubble;
