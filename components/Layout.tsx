import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center py-10 px-4">
      <div className="w-full max-w-4xl bg-white shadow-xl rounded-2xl overflow-hidden border border-slate-200">
        <header className="bg-slate-900 text-white p-6 border-b-4 border-blue-600">
          <div className="flex items-center space-x-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <div>
              <h1 className="text-xl font-bold uppercase tracking-wide">Setor Social</h1>
              <p className="text-blue-200 text-xs font-medium">Assistente de Processamento de Dados</p>
            </div>
          </div>
        </header>
        <main className="p-8">
          {children}
        </main>
        <footer className="bg-slate-50 p-4 text-center text-xs text-slate-400 border-t border-slate-100">
          Sistema de Apoio Operacional &bull; Unidade Prisional &bull; v1.0
        </footer>
      </div>
    </div>
  );
};