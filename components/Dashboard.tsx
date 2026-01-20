
import React, { useState } from 'react';
// Corrected import: Trip does not exist in types.ts, TripSession is the correct interface
import { UserProfile, TripSession } from '../types';
import { Play, Square, MapPin, Users, Wallet, Car, Info } from 'lucide-react';
import { CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis } from 'recharts';

interface Props {
  user: UserProfile;
  trips: TripSession[];
  onStartTrip: () => void;
  onEndTrip: (data: { gross: number; totalKm: number; passengerKm: number }) => void;
  activeTrip: TripSession | null;
}

const Dashboard: React.FC<Props> = ({ user, trips, onStartTrip, onEndTrip, activeTrip }) => {
  const [showEndDialog, setShowEndDialog] = useState(false);
  const [endData, setEndData] = useState({ gross: '', totalKm: '', passengerKm: '' });

  // Calculate stats for each trip as TripSession stores raw data, not calculated earnings/costs
  const tripStats = trips.map(t => {
    const appNet = t.grossEarnings * (1 - user.appPercentage / 100);
    const workFuel = ((t.kmDeslocamento + t.kmPassageiro) / t.consumptionAtTime) * t.fuelPriceAtTime;
    return {
      id: t.id,
      netEarnings: appNet - workFuel,
      fuelCost: workFuel,
      totalKm: t.endOdometer - t.startOdometer,
      passengerKm: t.kmPassageiro
    };
  });

  const totalNet = tripStats.reduce((acc, t) => acc + t.netEarnings, 0);
  const totalKm = tripStats.reduce((acc, t) => acc + t.totalKm, 0);

  const chartData = tripStats.slice(-7).map((t, i) => ({
    name: `Corrida ${i + 1}`,
    net: t.netEarnings,
    fuel: t.fuelCost
  }));

  const handleEndSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onEndTrip({
      gross: parseFloat(endData.gross),
      totalKm: parseFloat(endData.totalKm),
      passengerKm: parseFloat(endData.passengerKm)
    });
    setShowEndDialog(false);
    setEndData({ gross: '', totalKm: '', passengerKm: '' });
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Header */}
      <header className="bg-indigo-600 text-white p-6 rounded-b-[2rem] shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <div>
            <p className="text-indigo-100 text-sm">Olá, {user.name} 👋</p>
            <h1 className="text-2xl font-bold">{user.car.brand} {user.car.model}</h1>
          </div>
          <div className="bg-white/20 p-2 rounded-full backdrop-blur-md">
            <Car size={24} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-sm border border-white/10">
            <p className="text-xs text-indigo-100 uppercase tracking-wider font-semibold">Lucro Líquido</p>
            <p className="text-xl font-bold mt-1">R$ {totalNet.toFixed(2)}</p>
          </div>
          <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-sm border border-white/10">
            <p className="text-xs text-indigo-100 uppercase tracking-wider font-semibold">Km Totais</p>
            <p className="text-xl font-bold mt-1">{totalKm.toFixed(1)} km</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6 space-y-6 -mt-4">
        {/* Car Specs Banner */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-50 p-2 rounded-lg text-indigo-600">
              <Info size={20} />
            </div>
            <div>
              <p className="text-xs text-slate-500">Configuração do Veículo</p>
              {/* Corrected: Use user.calculatedAvgConsumption from UserProfile instead of non-existent car.avgConsumption */}
              <p className="font-semibold text-slate-800">{user.car.tankCapacity}L • {user.calculatedAvgConsumption.toFixed(1)} km/l</p>
            </div>
          </div>
        </div>

        {/* Action Button */}
        {!activeTrip ? (
          <button 
            onClick={onStartTrip}
            className="w-full bg-indigo-600 text-white p-6 rounded-3xl shadow-xl shadow-indigo-100 flex items-center justify-between group active:scale-[0.98] transition-all"
          >
            <div className="text-left">
              <p className="text-lg font-bold">Iniciar Nova Corrida</p>
              <p className="text-indigo-100 text-sm">Toque ao aceitar no {user.appName}</p>
            </div>
            <div className="bg-white text-indigo-600 p-3 rounded-2xl group-hover:rotate-12 transition-transform shadow-lg">
              <Play fill="currentColor" size={24} />
            </div>
          </button>
        ) : (
          <button 
            onClick={() => setShowEndDialog(true)}
            className="w-full bg-rose-500 text-white p-6 rounded-3xl shadow-xl shadow-rose-100 flex items-center justify-between animate-pulse"
          >
            <div className="text-left">
              <p className="text-lg font-bold">Corrida em Andamento...</p>
              <p className="text-rose-100 text-sm">Toque para finalizar e calcular custos</p>
            </div>
            <div className="bg-white text-rose-500 p-3 rounded-2xl shadow-lg">
              <Square fill="currentColor" size={24} />
            </div>
          </button>
        )}

        {/* Performance Chart */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Relatório Semanal</h3>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" hide />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  formatter={(val: number) => [`R$ ${val.toFixed(2)}`, '']}
                />
                <Bar dataKey="net" fill="#4f46e5" radius={[4, 4, 0, 0]} name="Lucro" />
                <Bar dataKey="fuel" fill="#f43f5e" radius={[4, 4, 0, 0]} name="Combustível" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 mt-4">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-indigo-600"></div>
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Lucro</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-rose-500"></div>
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Custo Comb.</span>
            </div>
          </div>
        </div>

        {/* History */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-800 px-2">Últimas Atividades</h3>
          {tripStats.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-slate-200">
              <p className="text-slate-400">Inicie sua primeira corrida acima.</p>
            </div>
          ) : (
            tripStats.slice().reverse().map(trip => (
              <div key={trip.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="bg-slate-50 p-3 rounded-xl text-slate-400">
                    <MapPin size={20} />
                  </div>
                  <div>
                    <p className="font-bold text-slate-800">R$ {trip.netEarnings.toFixed(2)}</p>
                    <p className="text-xs text-slate-400">{trip.totalKm.toFixed(1)}km total • {trip.passengerKm.toFixed(1)}km pax</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-rose-500">-R$ {trip.fuelCost.toFixed(2)}</p>
                  <p className="text-[10px] text-slate-400 uppercase font-semibold">Combustível</p>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* End Trip Dialog */}
      {showEndDialog && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-t-[2.5rem] sm:rounded-[2.5rem] p-8 shadow-2xl animate-in slide-in-from-bottom duration-300">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Finalizar Corrida</h2>
            <form onSubmit={handleEndSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1 flex items-center gap-2">
                  <Wallet size={16} /> Valor Bruto do {user.appName} (R$)
                </label>
                <input 
                  required
                  type="number"
                  step="0.01"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="0.00"
                  value={endData.gross}
                  onChange={e => setEndData({...endData, gross: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-600 mb-1 flex items-center gap-2">
                    <MapPin size={16} /> KM Total
                  </label>
                  <input 
                    required
                    type="number"
                    step="0.1"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="Total"
                    value={endData.totalKm}
                    onChange={e => setEndData({...endData, totalKm: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-600 mb-1 flex items-center gap-2">
                    <Users size={16} /> KM c/ Passageiro
                  </label>
                  <input 
                    required
                    type="number"
                    step="0.1"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="No App"
                    value={endData.passengerKm}
                    onChange={e => setEndData({...endData, passengerKm: e.target.value})}
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <button 
                  type="button"
                  onClick={() => setShowEndDialog(false)}
                  className="flex-1 bg-slate-100 text-slate-600 font-bold py-4 rounded-2xl active:scale-95 transition-all"
                >
                  Voltar
                </button>
                <button 
                  type="submit"
                  className="flex-1 bg-indigo-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-indigo-100 active:scale-95 transition-all"
                >
                  Concluir
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
