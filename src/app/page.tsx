'use client';

import { Leaf } from 'lucide-react';
import IdentificationForm from '../components/shared/IdentificationForm';

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col transition-colors duration-300">
      
      {/* HEADER FIXO */}
      <header className="bg-emerald-700 dark:bg-emerald-900 text-white shadow-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-white dark:bg-slate-800 p-2 rounded-full">
            <Leaf className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-wide">EnvCheck</h1>
            <p className="text-emerald-100 dark:text-emerald-200 text-xs uppercase tracking-widest">Portal de Acesso</p>
          </div>
        </div>
      </header>

      {/* ÁREA CENTRAL - APENAS O FORMULÁRIO */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-4xl animate-in fade-in zoom-in-95 duration-500">
          <IdentificationForm onComplete={() => {}} />
        </div>
      </main>

    </div>
  );
}