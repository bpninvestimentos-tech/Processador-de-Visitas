import React, { useState, useRef } from 'react';
import { Layout } from './components/Layout';
import { ProcessingMode } from './types';
import { processData } from './services/csv-processor';
import { generateDataInsights, smartRepairCSV } from './services/gemini-service';

const App: React.FC = () => {
  const [fileContent, setFileContent] = useState<string>('');
  const [processedOutput, setProcessedOutput] = useState<string>('');
  const [selectedMode, setSelectedMode] = useState<ProcessingMode | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [isInsightsLoading, setIsInsightsLoading] = useState(false);
  const [insights, setInsights] = useState<string>('');
  const [isRepairing, setIsRepairing] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        setFileContent(text);
        setProcessedOutput(''); // Clear previous output
        setInsights('');
      };
      reader.readAsText(file);
    }
  };

  const handleProcess = (mode: ProcessingMode) => {
    setSelectedMode(mode);
    try {
      const result = processData(fileContent, mode);
      setProcessedOutput(result);
      setInsights(''); // Clear old insights
    } catch (error) {
      alert("Erro ao processar arquivo. Verifique se o formato está correto.");
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(processedOutput);
    alert('Conteúdo copiado para a área de transferência!');
  };

  const handleGenerateInsights = async () => {
    if (!processedOutput) return;
    setIsInsightsLoading(true);
    const result = await generateDataInsights(processedOutput);
    setInsights(result);
    setIsInsightsLoading(false);
  };

  const handleSmartRepair = async () => {
    if (!fileContent) return;
    setIsRepairing(true);
    try {
      const repaired = await smartRepairCSV(fileContent);
      setFileContent(repaired);
      alert("Arquivo reparado pela IA! Agora tente selecionar uma opção de formatação.");
    } catch (e) {
      alert("Não foi possível reparar o arquivo.");
    } finally {
      setIsRepairing(false);
    }
  };

  const ModeButton = ({ mode, label, icon, desc }: { mode: ProcessingMode, label: string, icon: string, desc: string }) => (
    <button
      onClick={() => handleProcess(mode)}
      className={`relative group flex flex-col items-start p-5 rounded-xl border-2 transition-all duration-200 w-full text-left
        ${selectedMode === mode 
          ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-600 shadow-md' 
          : 'border-slate-200 hover:border-blue-300 hover:bg-white hover:shadow-sm bg-slate-50'}`}
    >
      <div className="flex items-center gap-3 mb-2">
        <span className="text-2xl">{icon}</span>
        <span className={`font-bold ${selectedMode === mode ? 'text-blue-700' : 'text-slate-700'}`}>{label}</span>
      </div>
      <p className="text-sm text-slate-500">{desc}</p>
      
      {selectedMode === mode && (
        <div className="absolute top-4 right-4">
          <span className="flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
          </span>
        </div>
      )}
    </button>
  );

  return (
    <Layout>
      {/* Upload Section */}
      <div className="mb-10">
        <label className="block text-sm font-medium text-slate-700 mb-2">1. Carregar Arquivo de Agendamento (CSV/TXT)</label>
        <div className="flex gap-4">
            <div 
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 cursor-pointer border-2 border-dashed border-slate-300 rounded-lg p-8 flex flex-col items-center justify-center hover:bg-slate-50 hover:border-blue-400 transition-colors bg-white"
            >
            <input 
                type="file" 
                accept=".csv,.txt" 
                ref={fileInputRef}
                onChange={handleFileUpload} 
                className="hidden" 
            />
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-slate-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="text-sm text-slate-500 font-medium">
                {fileName ? <span className="text-blue-600 font-bold">{fileName}</span> : 'Clique para selecionar o arquivo'}
            </p>
            </div>
            
            {fileContent && !processedOutput && (
                 <button
                 onClick={handleSmartRepair}
                 disabled={isRepairing}
                 className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg border border-purple-200 hover:bg-purple-200 flex flex-col items-center justify-center gap-1 transition-colors min-w-[120px]"
               >
                 {isRepairing ? (
                     <div className="w-5 h-5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                 ) : (
                    <>
                     <span className="text-xl">✨</span>
                     <span className="text-xs font-bold">IA Repair</span>
                    </>
                 )}
               </button>
            )}
        </div>
      </div>

      {/* Mode Selection */}
      {fileContent && (
        <div className="mb-10 animate-fade-in">
          <label className="block text-sm font-medium text-slate-700 mb-3">2. Selecione o Modo de Formatação</label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ModeButton 
              mode={ProcessingMode.VIDEOCHAMADA} 
              label="1. Videochamada" 
              icon="📹"
              desc="Gera saída de 6 colunas, limpa nomes de galeria e formata telefones." 
            />
            <ModeButton 
              mode={ProcessingMode.VISITA_INTIMA} 
              label="2. Visita Íntima" 
              icon="💞" 
              desc="Gera 5 colunas, mantém formato original da galeria, sem telefones."
            />
            <ModeButton 
              mode={ProcessingMode.VISITA_PRESENCIAL} 
              label="3. Presencial" 
              icon="👥" 
              desc="Lista completa (8 cols) com até 3 visitantes por interno. Sanitiza IDs."
            />
          </div>
        </div>
      )}

      {/* Output Section */}
      {processedOutput && (
        <div className="animate-fade-in space-y-6">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-slate-700">3. Resultado Processado (CSV)</label>
            <div className="flex gap-2">
                <button
                    onClick={handleGenerateInsights}
                    disabled={isInsightsLoading}
                    className="flex items-center px-3 py-1.5 text-xs font-semibold text-purple-700 bg-purple-50 border border-purple-200 rounded hover:bg-purple-100 transition-colors"
                >
                    {isInsightsLoading ? 'Analisando...' : '✨ Gerar Relatório IA'}
                </button>
                <button 
                onClick={handleCopy}
                className="flex items-center px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors shadow-sm"
                >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                    <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                </svg>
                Copiar para Planilha
                </button>
            </div>
          </div>
          
          <div className="relative">
            <textarea
              readOnly
              value={processedOutput}
              className="w-full h-64 p-4 font-mono text-sm text-slate-800 bg-slate-100 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
            />
             <div className="absolute bottom-2 right-2 text-xs text-slate-400">
                {processedOutput.split('\n').length} registros
             </div>
          </div>

          {/* AI Insights Panel */}
          {insights && (
            <div className="bg-gradient-to-br from-purple-50 to-white border border-purple-100 rounded-xl p-6 shadow-sm animate-fade-in-up">
                <div className="flex items-center gap-2 mb-4 text-purple-800">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <h3 className="font-bold">Análise Inteligente de Dados</h3>
                </div>
                <div className="prose prose-sm prose-purple max-w-none text-slate-700">
                    <div dangerouslySetInnerHTML={{ 
                        __html: insights
                            .replace(/\n/g, '<br/>')
                            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') 
                    }} />
                </div>
            </div>
          )}
        </div>
      )}
    </Layout>
  );
};

export default App;