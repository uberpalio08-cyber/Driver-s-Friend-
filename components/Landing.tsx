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
    <div className="min-h-screen flex flex-col items-center justify-center p-10 bg-transparent text-zinc-900 overflow-hidden relative">
      <div className="z-10 text-center mb-16 space-y-6">
        <div className="w-24 h-24 bg-black rounded-[2rem] mx-auto flex items-center justify-center shadow-2xl animate-float">
          <Car size={48} className="text-white" />
        </div>
        <div className="space-y-1">
          <h1 className="text-4xl font-black tracking-tighter uppercase italic leading-none text-zinc-900">Driver's Friend</h1>
          <p className="text-zinc-500 font-bold uppercase tracking-[0.3em] text-[10px]">Intelligence System</p>
        </div>
      </div>

      <div className="z-10 w-full space-y-6">
        {!user ? (
          <button 
            onClick={onStart}
            className="w-full group transition-transform active:scale-95"
          >
            <div className="bg-black p-10 rounded-[3rem] shadow-2xl flex flex-col items-center gap-4">
              <h2 className="text-2xl font-black text-white uppercase flex items-center gap-2">
                COMEÇAR <ArrowRight className="text-white" size={24} />
              </h2>
              <p className="text-zinc-400 text-[10px] font-black uppercase tracking-widest">Acompanhe seus lucros</p>
            </div>
          </button>
        ) : (
          <>
            <button 
              onClick={onSelect}
              className="w-full transition-transform active:scale-95"
            >
              <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-[3rem] shadow-xl flex items-center gap-6">
                <div className="bg-white p-4 rounded-2xl text-black">
                  <UserCircle size={32} />
                </div>
                <div className="text-left">
                  <p className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em]">Bem-vindo de volta</p>
                  <h2 className="text-2xl font-black text-white uppercase">{user.name}</h2>
                  <p className="text-[10px] font-bold text-zinc-400">{user.car.model}</p>
                </div>
              </div>
            </button>

            <button 
              onClick={onNewRegistration}
              className="w-full py-4 text-zinc-600 hover:text-zinc-900 transition-colors text-[10px] font-black uppercase tracking-widest"
            >
              Excluir dados e recomeçar
            </button>
          </>
        )}
      </div>
      
      <p className="absolute bottom-10 text-zinc-400 text-[8px] uppercase font-black tracking-[0.5em]">Professional Tool v2.0</p>
    </div>
  );
};

export default Landing;