
import React, { useState } from 'react';
import { Expense, ExpenseCategory, RefuelEntry } from '../types';
import { Plus, Coffee, Fuel, Clock } from 'lucide-react';

interface Props {
  expenses: Expense[];
  refuels: RefuelEntry[];
  onAdd: (expense: Expense) => void;
  isWorking: boolean;
}

const Custos: React.FC<Props> = ({ expenses, refuels, onAdd }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [data, setData] = useState({ category: 'ALIMENTAÇÃO' as ExpenseCategory, description: '', amount: '', isWork: true });

  const allCosts = [
    ...expenses,
    ...refuels.map(r => ({ id: r.id, date: r.date, category: 'COMBUSTÍVEL', description: 'Abastecimento', amount: r.liters * r.pricePerLiter, isWorkExpense: true }))
  ].sort((a, b) => (b.date as number) - (a.date as number));

  return (
    <div className="p-5 space-y-6 pb-24 animate-up">
      <header className="pt-6 flex justify-between items-center">
        <h1 className="text-3xl font-black italic text-outline">Histórico de Custos</h1>
        <button onClick={() => setShowAdd(true)} className="bg-white text-black p-3 rounded-2xl shadow-xl active:scale-90 transition-all">
          <Plus size={24} />
        </button>
      </header>

      <div className="space-y-3">
        {allCosts.length === 0 ? (
          <div className="py-12 text-center text-zinc-700 text-[10px] font-black uppercase border border-dashed border-zinc-900 rounded-3xl bg-black/10">Nenhum custo registrado</div>
        ) : (
          allCosts.map(item => (
            <div key={item.id} className={`p-5 rounded-[2rem] flex items-center justify-between border glass-card transition-all shadow-xl ${item.isWorkExpense ? 'border-white/10' : 'opacity-60 border-transparent bg-zinc-900'}`}>
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${item.isWorkExpense ? 'bg-white text-black shadow-md' : 'bg-zinc-800 text-zinc-500'}`}>
                  {item.category === 'COMBUSTÍVEL' ? <Fuel size={18} /> : <Coffee size={18} />}
                </div>
                <div>
                  <p className="font-black uppercase text-sm italic text-outline-sm leading-none mb-1">{item.description}</p>
                  <p className="text-[8px] text-zinc-500 font-bold uppercase flex items-center gap-1">
                    <Clock size={8} /> {new Date(item.date).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <p className="font-black text-xl italic text-outline">R$ {item.amount.toFixed(2)}</p>
            </div>
          ))
        )}
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-[110] flex items-center justify-center p-6 text-center">
          <div className="bg-zinc-900 w-full max-w-sm rounded-[2.5rem] p-10 space-y-8 border border-white/10 shadow-2xl">
            <h2 className="text-2xl font-black uppercase italic text-outline">Lançar Custo</h2>
            <div className="grid grid-cols-2 gap-3">
              <button type="button" onClick={() => setData({...data, isWork: true})} className={`py-4 rounded-xl font-black text-[10px] uppercase transition-all ${data.isWork ? 'bg-white text-black shadow-lg' : 'bg-zinc-800 text-zinc-500'}`}>Trabalho</button>
              <button type="button" onClick={() => setData({...data, isWork: false})} className={`py-4 rounded-xl font-black text-[10px] uppercase transition-all ${!data.isWork ? 'bg-white text-black shadow-lg' : 'bg-zinc-800 text-zinc-500'}`}>Pessoal</button>
            </div>
            <div className="space-y-4">
              <input type="number" step="0.01" className="w-full text-center text-3xl font-black italic" placeholder="R$ 0,00" value={data.amount} onChange={e => setData({...data, amount: e.target.value})} />
              <input className="w-full font-black text-center" placeholder="Ex: Manutenção, Troca de Óleo" value={data.description} onChange={e => setData({...data, description: e.target.value})} />
            </div>
            <button onClick={() => { onAdd({ id: Date.now().toString(), date: Date.now(), category: 'OUTROS', description: data.description || 'Gasto', amount: parseFloat(data.amount), isWorkExpense: data.isWork }); setShowAdd(false); setData({category:'ALIMENTAÇÃO', description:'', amount:'', isWork:true}); }} className="w-full bg-white text-black py-5 rounded-2xl font-black uppercase italic text-lg shadow-xl">Confirmar Lançamento</button>
            <button onClick={() => setShowAdd(false)} className="text-[10px] font-black text-zinc-600 uppercase">Fechar</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Custos;
