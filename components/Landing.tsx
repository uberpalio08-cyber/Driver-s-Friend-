
import React from 'react';
import { UserCircle, Car, ArrowRight } from 'lucide-react';
import { UserProfile } from '../types';

interface Props {
  user: UserProfile | null;
  onStart: () => void;
  onSelect: () => void;
  onNewRegistration: () => void;
}

const Landing: React.FC<Props> = ({ user, onStart, onSelect, onNewRegistration }) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-10 bg-transparent text-white overflow-hidden relative">
      <div className="z-10 text-center mb-16 space-y-8">
        <div className="w-28 h-28 bg-white rounded-[2.5rem] mx-auto flex items-center justify-center shadow-[0_20px_50px_rgba(255,255,255,0.2)] animate-float border-2 border-black">
          <Car size={56} className="text-black" />
        </div>
        <div className="space-y-2">
          <h1 className="text-5xl font-black tracking-tighter uppercase italic leading-none text-outline drop-shadow-xl">Driver's Friend</h1>
          <p className="text-zinc-400 font-bold uppercase tracking-[0.4em] text-[11px] text-outline-sm">Intelligence System</p>
        </div>
      </div>

      <div className="z-10 w-full space-y-6">
        {!user ? (
          <button 
            onClick={onStart}
            className="w-full group transition-transform active:scale-95"
          >
            <div className="bg-white p-10 rounded-[3rem] shadow-2xl flex flex-col items-center gap-4 border-2 border-black">
              <h2 className="text-2xl font-black text-black uppercase flex items-center gap-3 italic">
                COMEÇAR <ArrowRight className="text-black group-hover:translate-x-1 transition-transform" size={24} />
              </h2>
              <p className="text-zinc-600 text-[10px] font-black uppercase tracking-widest">Controle total do seu lucro</p>
            </div>
          </button>
        ) : (
          <>
            <button 
              onClick={onSelect}
              className="w-full transition-transform active:scale-95"
            >
              <div className="bg-white border-2 border-black p-8 rounded-[3rem] shadow-2xl flex items-center gap-6">
                <div className="bg-black p-4 rounded-2xl text-white">
                  <UserCircle size={32} />
                </div>
                <div className="text-left">
                  <p className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em]">Bem-vindo de volta</p>
                  <h2 className="text-2xl font-black text-black uppercase italic">{user.name}</h2>
                  <p className="text-[10px] font-bold text-zinc-600">{user.car.model}</p>
                </div>
              </div>
            </button>

            <button 
              onClick={onNewRegistration}
              className="w-full py-4 text-white/60 hover:text-white transition-colors text-[10px] font-black uppercase tracking-widest underline underline-offset-4"
            >
              Excluir dados e recomeçar
            </button>
          </>
        )}
      </div>
      
      <p className="absolute bottom-10 text-white/40 text-[8px] uppercase font-black tracking-[0.5em]">Professional Tool v2.2</p>
    </div>
  );
};

export default Landing;
