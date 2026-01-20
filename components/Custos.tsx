import React, { useState } from 'react';
import { Expense, ExpenseCategory } from '../types';
import { Plus, Coffee, Droplets, Zap, Phone, MoreHorizontal, ShoppingCart } from 'lucide-react';

interface Props {
  expenses: Expense[];
  onAdd: (expense: Expense) => void;
  isWorking: boolean;
}

const Custos: React.FC<Props> = ({ expenses, onAdd, isWorking }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [data, setData] = useState({
    category: 'ALIMENTAÇÃO' as ExpenseCategory,
    description: '',
    amount: '',
    isWorkExpense: true
  });

  const categories = [
    { label: 'ALIMENTAÇÃO' as ExpenseCategory, icon: Coffee },
    { label: 'ÁGUA' as ExpenseCategory, icon: Droplets },
    { label: 'LUZ' as ExpenseCategory, icon: Zap },
    { label: 'TELEFONE' as ExpenseCategory, icon: Phone },
    { label: 'OUTROS' as ExpenseCategory, icon: MoreHorizontal }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (data.amount) {
      onAdd({
        id: Date.now().toString(),
        date: Date.now(),
        category: data.category,
        description: data.description,
        amount: parseFloat(data.amount),
        isWorkExpense: isWorking ? data.isWorkExpense : false
      });
      setShowAdd(false);
      setData({ category: 'ALIMENTAÇÃO', description: '', amount: '', isWorkExpense: true });
    }
  };

  return (
    <div className="p-6 space-y-6">
      <header className="py-4 flex justify-between items-center">
        <div>
          <p className="text-zinc-600 text-[10px] font-black uppercase tracking-widest">Controle de Saídas</p>
          <h1 className="text-2xl font-black text-zinc-900">Despesas Extras</h1>
        </div>
        <button onClick={() => setShowAdd(true)} className="bg-black text-white p-4 rounded-2xl shadow-xl active:scale-95 transition-transform">
          <Plus size={24} />
        </button>
      </header>

      {isWorking && (
        <div className="bg-zinc-900 text-white p-6 rounded-[2.5rem] flex items-center gap-5 border border-zinc-800 shadow-xl">
          <ShoppingCart className="text-zinc-500 shrink-0" size={24} />
          <p className="text-[10px] font-black uppercase leading-tight tracking-widest">
            Turno em andamento. Gastos marcados como "Trabalho" serão abatidos do lucro de hoje.
          </p>
        </div>
      )}

      <div className="space-y-4 pb-24">
        {expenses.length === 0 ? (
          <div className="text-center py-20 bg-zinc-200/50 backdrop-blur-md border-2 border-dashed border-zinc-400 rounded-[2.5rem]">
            <p className="text-zinc-600 text-[10px] font-black uppercase tracking-widest">Nenhuma despesa registrada</p>
          </div>
        ) : (
          expenses.slice().reverse().map(exp => {
            const cat = categories.find(c => c.label === exp.category);
            const CategoryIcon = cat ? cat.icon : MoreHorizontal;
            return (
              <div key={exp.id} className="bg-zinc-900 border border-zinc-800 p-6 rounded-[2.5rem] flex items-center justify-between shadow-xl">
                <div className="flex items-center gap-5">
                  <div className={`p-4 rounded-2xl ${exp.isWorkExpense ? 'bg-white text-black' : 'bg-zinc-800 text-zinc-500'}`}>
                    <CategoryIcon size={22} />
                  </div>
                  <div>
                    <p className="font-black text-white uppercase text-sm tracking-tight">{exp.category}</p>
                    <p className="text-[9px] text-zinc-500 font-black uppercase tracking-widest">{exp.isWorkExpense ? 'Custo Operacional' : 'Custo Pessoal'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-black text-white text-md italic">R$ {exp.amount.toFixed(2)}</p>
                  <p className="text-[8px] text-zinc-600 uppercase font-black">{new Date(exp.date).toLocaleDateString()}</p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-[100] flex items-center justify-center p-8">
          <div className="bg-white w-full rounded-[3rem] p-10 space-y-8 border border-zinc-200 shadow-2xl animate-in zoom-in-95 duration-200">
            <h2 className="text-2xl font-black text-black text-center uppercase tracking-tighter">Registrar Gasto</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-3 gap-2">
                {categories.map(cat => {
                  const CatIcon = cat.icon;
                  return (
                    <button 
                      key={cat.label} type="button"
                      onClick={() => setData({ ...data, category: cat.label })}
                      className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-1 transition-all ${data.category === cat.label ? 'border-black bg-black text-white shadow-lg' : 'border-zinc-200 bg-zinc-100 text-zinc-500'}`}
                    >
                      <CatIcon size={18} />
                      <span className="text-[8px] font-black uppercase tracking-tighter">{cat.label}</span>
                    </button>
                  );
                })}
              </div>
              <div className="space-y-2 text-left">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1 block">Valor Gasto (R$)</label>
                <input required type="number" step="0.01" className="w-full bg-zinc-100 border-2 border-zinc-200 rounded-2xl px-6 py-5 font-black text-black outline-none focus:border-black" placeholder="Ex: 25.50" value={data.amount} onChange={e => setData({...data, amount: e.target.value})} />
              </div>
              
              <div className="space-y-2 text-left">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1 block">Descrição Simples (Ex: Almoço)</label>
                <input className="w-full bg-zinc-100 border-2 border-zinc-200 rounded-2xl px-6 py-5 font-black text-black outline-none focus:border-black" placeholder="O que você comprou?" value={data.description} onChange={e => setData({...data, description: e.target.value})} />
              </div>
              
              {isWorking && (
                <label className="flex items-center gap-4 p-5 bg-zinc-100 rounded-2xl cursor-pointer border-2 border-transparent hover:border-zinc-200 transition-colors">
                  <input type="checkbox" className="w-5 h-5 accent-black" checked={data.isWorkExpense} onChange={e => setData({...data, isWorkExpense: e.target.checked})} />
                  <div>
                    <span className="text-[10px] font-black text-black uppercase tracking-widest block">Custo de Trabalho</span>
                    <span className="text-[8px] text-zinc-400 font-bold uppercase block">Abater do lucro líquido de hoje</span>
                  </div>
                </label>
              )}

              <div className="flex flex-col gap-3 pt-4">
                <button type="submit" className="w-full bg-black text-white py-6 rounded-[2rem] font-black uppercase tracking-widest shadow-2xl active:scale-95 transition-all">Confirmar Gasto</button>
                <button type="button" onClick={() => setShowAdd(false)} className="w-full py-2 text-zinc-400 font-black text-[10px] uppercase tracking-widest text-center">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Custos;