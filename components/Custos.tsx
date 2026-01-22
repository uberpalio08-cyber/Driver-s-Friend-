
import React, { useState, useMemo } from 'react';
import { Expense, ExpenseCategory, RefuelEntry } from '../types';
import { Plus, Coffee, Fuel, Clock, Receipt, Wrench, Trash2 } from 'lucide-react';

interface Props {
  expenses: Expense[];
  refuels: RefuelEntry[];
  onAdd: (expense: Expense) => void;
  onRemoveExpense: (id: string) => void;
  onRemoveRefuel: (id: string) => void;
  isWorking: boolean;
}

const Custos: React.FC<Props> = ({ expenses = [], refuels = [], onAdd, onRemoveExpense, onRemoveRefuel }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [data, setData] = useState({ category: 'OUTROS' as ExpenseCategory, description: '', amount: '', isWork: true });

  const allCosts = useMemo(() => {
    const combined = [
      ...expenses.map(e => ({ ...e, type: 'EXPENSE' as const })),
      ...refuels.map(r => ({ 
        id: r.id, 
        date: r.date, 
        category: 'COMBUSTÍVEL' as ExpenseCategory, 
        description: `Abastecimento: ${r.stationName}`, 
        amount: r.amountMoney, 
        isWorkExpense: true,
        type: 'REFUEL' as const
      }))
    ];
    return combined.sort((a, b) => b.date - a.date);
  }, [expenses, refuels]);

  const getIcon = (cat: string, desc: string) => {
    const d = desc.toLowerCase();
    if (cat === 'COMBUSTÍVEL') return <Fuel size={18} />;
    if (d.includes('óleo') || d.includes('mecan')) return <Wrench size={18} />;
    if (cat === 'ALIMENTAÇÃO' || d.includes('café') || d.includes('lanche')) return <Coffee size={18} />;
    return <Receipt size={18} />;
  };

  const handleDelete = (e: React.MouseEvent, item: any) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm("Deseja realmente excluir este lançamento financeiro?")) {
      if (item.type === 'EXPENSE') {
        onRemoveExpense(item.id);
      } else {
        onRemoveRefuel(item.id);
      }
    }
  };

  return (
    <div className="p-5 space-y-6 pb-40 animate-up bg-[#0f172a] min-h-full font-sans">
      <header className="pt-6 flex justify-between items-center">
        <div>
          <p className="text-[10px] font-black uppercase text-blue-500 tracking-widest leading-none">Fluxo de</p>
          <h1 className="text-3xl font-black italic text-white tracking-tighter">Saídas</h1>
        </div>
        <button onClick={() => setShowAdd(true)} className="bg-blue-600 text-white p-4 rounded-2xl shadow-xl active:scale-90 transition-all border border-blue-400/20">
          <Plus size={24} />
        </button>
      </header>

      <div className="space-y-3">
        {allCosts.length === 0 ? (
          <div className="py-20 text-center bento-card border-dashed border-slate-800">
             <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Nenhum custo registrado</p>
          </div>
        ) : (
          allCosts.map(item => (
            <div key={item.id} className={`bento-card p-4 flex items-center justify-between border-l-4 transition-all shadow-xl relative ${item.isWorkExpense ? 'border-l-blue-500 bg-slate-800/60' : 'border-l-slate-700 bg-slate-900/40 opacity-70'}`}>
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${item.category === 'COMBUSTÍVEL' ? 'bg-blue-600/10 text-blue-500' : 'bg-slate-700/50 text-slate-400'}`}>
                  {getIcon(item.category, item.description)}
                </div>
                <div className="min-w-0">
                  <p className="font-black uppercase text-[11px] italic text-white leading-none mb-1 truncate max-w-[120px]">{item.description}</p>
                  <p className="text-[8px] text-slate-500 font-bold uppercase flex items-center gap-1 tracking-widest">
                    <Clock size={8} /> {new Date(item.date).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="font-black text-lg italic text-white leading-none">R$ {item.amount.toFixed(2)}</p>
                  <p className="text-[7px] font-black text-slate-600 uppercase mt-1">{item.isWorkExpense ? 'Trabalho' : 'Pessoal'}</p>
                </div>
                <button 
                  onClick={(e) => handleDelete(e, item)}
                  className="p-3 bg-rose-500/10 text-rose-500 rounded-xl active:scale-90 transition-all cursor-pointer z-10 hover:bg-rose-500 hover:text-white"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-slate-950/98 backdrop-blur-md z-[200] flex items-center justify-center p-6 text-center">
          <div className="w-full max-w-sm rounded-[2.5rem] p-8 space-y-6 shadow-2xl bg-slate-900 border border-white/5 animate-up">
            <h2 className="text-2xl font-black uppercase italic text-white tracking-tighter">Lançar Saída</h2>
            
            <div className="flex bg-slate-950 p-1 rounded-2xl border border-white/5">
              <button onClick={() => setData({...data, isWork: true})} className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase transition-all ${data.isWork ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-600'}`}>Trabalho</button>
              <button onClick={() => setData({...data, isWork: false})} className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase transition-all ${!data.isWork ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-600'}`}>Pessoal</button>
            </div>

            <div className="space-y-4">
              <input type="number" step="0.01" className="w-full text-center text-4xl font-black italic !bg-slate-950" placeholder="R$ 0,00" value={data.amount} onChange={e => setData({...data, amount: e.target.value})} />
              <input className="w-full font-black text-center !bg-slate-950" placeholder="Descrição (Ex: Almoço)" value={data.description} onChange={e => setData({...data, description: e.target.value})} />
            </div>

            <button onClick={() => { 
              if (!data.amount || !data.description) return;
              onAdd({ 
                id: Date.now().toString(), 
                date: Date.now(), 
                category: data.description.toLowerCase().includes('óleo') ? 'MANUTENÇÃO' : 'OUTROS', 
                description: data.description, 
                amount: parseFloat(data.amount), 
                isWorkExpense: data.isWork 
              }); 
              setShowAdd(false); 
              setData({category:'OUTROS', description:'', amount:'', isWork:true}); 
            }} className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black uppercase italic text-lg shadow-xl border-b-4 border-blue-800 active:scale-95">
              Confirmar Gasto
            </button>
            <button onClick={() => setShowAdd(false)} className="text-[10px] font-black text-slate-600 uppercase tracking-widest mt-2">Fechar</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Custos;
