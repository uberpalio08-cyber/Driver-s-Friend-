
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
          <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">Controle de Saídas</p>
          <h1 className="text-2xl font-black text-black">Extras</h1>
        </div>
        <button onClick={() => setShowAdd(true)} className="bg-black text-white p-4 rounded-2xl shadow-xl active:scale-95 transition-transform">
          <Plus size={24} />
        </button>
      </header>

      {isWorking && (
        <div className="bg-black text-white p-6 rounded-[2.5rem] flex items-center gap-5 border border-zinc-800">
          <ShoppingCart className="text-zinc-500 shrink-0" size={24} />
          <p className="text-[10px] font-black uppercase leading-tight tracking-widest">
            Trabalho ativo! Novos gastos serão descontados do seu lucro diário.
          </p>
        </div>
      )}

      <div className="space-y-4">
        {expenses.length === 0 ? (
          <div className="text-center py-20 bg-zinc-50 border-2 border-dashed border-zinc-100 rounded-[2.5rem]">
            <p className="text-zinc-300 text-[10px] font-black uppercase tracking-widest">Nenhum gasto lançado</p>
          </div>
        ) : (
          expenses.slice().reverse().map(exp => {
            const cat = categories.find(c => c.label === exp.category);
            const CategoryIcon = cat ? cat.icon : MoreHorizontal;
            return (
              <div key={exp.id} className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-zinc-100 flex items-center justify-between group">
                <div className="flex items-center gap-5">
                  <div className={`p-4 rounded-2xl ${exp.isWorkExpense ? 'bg-black text-white' : 'bg-zinc-50 text-zinc-400'}`}>
                    <CategoryIcon size={22} />
                  </div>
                  <div>
                    <p className="font-black text-black uppercase text-sm tracking-tight">{exp.category}</p>
                    <p className="text-[9px] text-zinc-400 font-black uppercase tracking-widest">{exp.isWorkExpense ? 'Custo de Turno' : 'Custo Pessoal'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-black text-black text-md italic">R$ {exp.amount.toFixed(2)}</p>
                  <p className="text-[8px] text-zinc-300 uppercase font-black">{new Date(exp.date).toLocaleDateString()}</p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-[100] flex items-center justify-center p-8">
          <div className="bg-white w-full rounded-[3rem] p-10 space-y-8 animate-in zoom-in-95 duration-200">
            <h2 className="text-2xl font-black text-black text-center uppercase tracking-tighter">Novo Gasto</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-3 gap-2">
                {categories.map(cat => {
                  const CatIcon = cat.icon;
                  return (
                    <button 
                      key={cat.label} type="button"
                      onClick={() => setData({ ...data, category: cat.label })}
                      className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-1 transition-all ${data.category === cat.label ? 'border-black bg-black text-white' : 'border-zinc-50 text-zinc-400'}`}
                    >
                      <CatIcon size={18} />
                      <span className="text-[8px] font-black uppercase tracking-tighter">{cat.label}</span>
                    </button>
                  );
                })}
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Valor (R$)</label>
                <input required type="number" step="0.01" className="w-full bg-zinc-50 border-2 border-zinc-100 rounded-2xl px-6 py-5 font-black text-black outline-none" placeholder="0.00" value={data.amount} onChange={e => setData({...data, amount: e.target.value})} />
              </div>
              
              {isWorking && (
                <label className="flex items-center gap-4 p-5 bg-zinc-50 rounded-2xl cursor-pointer border-2 border-transparent hover:border-zinc-200 transition-colors">
                  <input type="checkbox" className="w-5 h-5 accent-black" checked={data.isWorkExpense} onChange={e => setData({...data, isWorkExpense: e.target.checked})} />
                  <span className="text-[10px] font-black text-black uppercase tracking-widest">Descontar do Turno</span>
                </label>
              )}

              <div className="flex flex-col gap-3 pt-4">
                <button type="submit" className="w-full bg-black text-white py-6 rounded-[2rem] font-black uppercase tracking-widest shadow-2xl active:scale-95 transition-all">Adicionar</button>
                <button type="button" onClick={() => setShowAdd(false)} className="w-full py-2 text-zinc-400 font-black text-[10px] uppercase tracking-widest">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Custos;
