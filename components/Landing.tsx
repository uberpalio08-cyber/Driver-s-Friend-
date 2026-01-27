
import React, { useEffect, useState } from 'react';
import { UserCircle, Car, ArrowRight, Download, Loader2, Sparkles } from 'lucide-react';
import { UserProfile } from '../types';
import { GeminiService } from '../services/geminiService';

interface Props {
  user: UserProfile | null;
  onStart: () => void;
  onSelect: () => void;
  onNewRegistration: () => void;
  onInstall: () => void;
  canInstall: boolean;
}

const LOGO_CACHE_KEY = 'drivers_friend_generated_logo';

const Landing: React.FC<Props> = ({ user, onStart, onSelect, onNewRegistration, onInstall, canInstall }) => {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;

  useEffect(() => {
    const cachedLogo = localStorage.getItem(LOGO_CACHE_KEY);
    if (cachedLogo) {
      setLogoUrl(cachedLogo);
    } else {
      generateLogo();
    }
  }, []);

  const generateLogo = async () => {
    setIsGenerating(true);
    const url = await GeminiService.generateAppLogo();
    if (url) {
      setLogoUrl(url);
      localStorage.setItem(LOGO_CACHE_KEY, url);
    }
    setIsGenerating(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-10 bg-transparent text-white overflow-hidden relative">
      <div className="z-10 text-center mb-10 space-y-8 animate-entrance">
        <div className="w-36 h-36 bg-white rounded-[3.5rem] mx-auto flex items-center justify-center shadow-[0_20px_60px_rgba(59,130,246,0.3)] border-2 border-black relative overflow-hidden group">
          <div className="absolute inset-0 bg-blue-500/10 rounded-[3rem] animate-pulse"></div>
          
          {isGenerating ? (
            <div className="flex flex-col items-center gap-2 relative z-10 text-blue-600">
              <Loader2 className="animate-spin" size={40} />
              <span className="text-[8px] font-black uppercase tracking-tighter">Criando Logo...</span>
            </div>
          ) : logoUrl ? (
            <img src={logoUrl} alt="App Logo" className="w-full h-full object-cover relative z-10 animate-fade-in" />
          ) : (
            <Car size={64} className="text-black relative z-10" />
          )}

          <button 
            onClick={generateLogo}
            className="absolute bottom-2 right-2 bg-blue-600 text-white p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-20"
            title="Regerar Logo"
          >
            <Sparkles size={12} />
          </button>
        </div>

        <div className="space-y-2">
          <h1 className="text-5xl font-black tracking-tighter uppercase italic leading-none drop-shadow-2xl">
            Driver's <span className="text-blue-500">Friend</span>
          </h1>
          <div className="flex items-center justify-center gap-2">
            <Sparkles size={10} className="text-blue-500" />
            <p className="text-zinc-500 font-black uppercase tracking-[0.4em] text-[10px]">Intelligence System</p>
          </div>
        </div>
      </div>

      <div className="z-10 w-full space-y-4 animate-entrance" style={{ animationDelay: '0.2s' }}>
        {canInstall && !isStandalone && (
          <button 
            onClick={onInstall}
            className="w-full bg-blue-600 text-white p-6 rounded-[2.5rem] flex items-center justify-center gap-3 font-black uppercase italic shadow-2xl border-b-4 border-blue-800 active:scale-95 transition-all mb-4"
          >
            <Download size={20} /> INSTALAR APP NO CELULAR
          </button>
        )}

        {!user ? (
          <button 
            onClick={onStart}
            className="w-full group transition-all active:scale-95"
          >
            <div className="bg-white p-10 rounded-[3.5rem] shadow-2xl flex flex-col items-center gap-4 border-2 border-black hover:bg-zinc-50">
              <h2 className="text-2xl font-black text-black uppercase flex items-center gap-3 italic">
                COMEÇAR <ArrowRight className="text-black group-hover:translate-x-2 transition-transform" size={28} />
              </h2>
              <p className="text-zinc-600 text-[10px] font-black uppercase tracking-widest">Gestão Profissional de Custos</p>
            </div>
          </button>
        ) : (
          <>
            <button 
              onClick={onSelect}
              className="w-full transition-all active:scale-95"
            >
              <div className="bg-white border-2 border-black p-8 rounded-[3.5rem] shadow-2xl flex items-center gap-6">
                <div className="bg-blue-600 p-4 rounded-2xl text-white shadow-lg shrink-0">
                  <UserCircle size={36} />
                </div>
                <div className="text-left overflow-hidden">
                  <p className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em]">Bem-vindo de volta</p>
                  <h2 className="text-2xl font-black text-black uppercase italic leading-none truncate">{user.name}</h2>
                  <p className="text-[10px] font-bold text-zinc-600 mt-1">{user.car.model}</p>
                </div>
              </div>
            </button>

            <button 
              onClick={onNewRegistration}
              className="w-full py-4 text-white/40 hover:text-white transition-colors text-[10px] font-black uppercase tracking-widest underline underline-offset-4"
            >
              Excluir dados e recomeçar
            </button>
          </>
        )}
      </div>
      
      <p className="absolute bottom-10 text-white/20 text-[8px] uppercase font-black tracking-[0.6em]">Professional Tool v3.0 • AI-Generated Identity</p>
    </div>
  );
};

export default Landing;
