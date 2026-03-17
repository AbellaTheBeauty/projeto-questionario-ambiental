'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Leaf, Loader2, AlertCircle } from 'lucide-react';

import { Questionnaire } from '../../../components/shared/Questionnaire';
import { ComplianceChart } from '../../../components/shared/ComplianceChart';
import { ExportPDFButton } from '../../../components/shared/ExportPDFButton';
import { supabase } from '../../../lib/supabase';
import { DiagnosisService } from '../../../services/diagnosis';
import { FinalDiagnosis } from '../../../types/diagnosis';

import questionsData from '../../../data/questions.json';

interface SessionData {
  id: string;
  client_name: string;
  client_document: string;
  client_email: string;
  status: string;
  expires_at: string;
}

export default function SessionPage() {
  const params = useParams();
  const sessionId = params.id as string;

  const [session, setSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [diagnosis, setDiagnosis] = useState<FinalDiagnosis | null>(null);

  useEffect(() => {
    async function loadSession() {
      if (!sessionId) return;
      
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (error || !data) {
        setError('Sessão não encontrada ou inválida.');
        setLoading(false);
        return;
      }

      // Verifica se a data de validade já passou
      if (new Date(data.expires_at) < new Date()) {
        setError('Este link expirou por motivos de segurança.');
        setLoading(false);
        return;
      }

      // Verifica se já foi respondido
      if (data.status === 'completed') {
        setError('Este questionário já foi finalizado e o laudo enviado.');
        setLoading(false);
        return;
      }

      setSession(data);
      setLoading(false);
    }

    loadSession();
  }, [sessionId]);

  const handleComplete = async (answers: Record<string, string>) => {
    // 1. Calcula a nota
    const result = DiagnosisService.calculate(questionsData as any, answers);
    setDiagnosis(result);

    // 2. Tranca a sessão na base de dados para não ser usada de novo
    await supabase
      .from('sessions')
      .update({ status: 'completed' })
      .eq('id', sessionId);
  };

  // Ecrã de carregamento
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-emerald-500">
        <Loader2 className="w-12 h-12 animate-spin mb-4" />
        <p>A validar o seu acesso seguro...</p>
      </div>
    );
  }

  // Ecrã de Erro (Link inválido ou expirado)
  if (error || !session) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl max-w-md w-full text-center shadow-2xl">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Acesso Negado</h2>
          <p className="text-slate-400">{error}</p>
        </div>
      </div>
    );
  }

  // O Questionário Real
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col transition-colors duration-300">
      <header className="bg-emerald-700 dark:bg-emerald-900 text-white shadow-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-white dark:bg-slate-800 p-2 rounded-full">
            <Leaf className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-wide">EnvCheck</h1>
            <p className="text-emerald-100 dark:text-emerald-200 text-xs uppercase tracking-widest">Acesso Restrito</p>
          </div>
        </div>
        <div className="hidden md:block text-right">
          <p className="text-xs text-emerald-200 uppercase font-semibold">Avaliando agora:</p>
          <p className="text-sm font-medium">{session.client_name}</p>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-4xl">
          {!diagnosis ? (
            <div className="space-y-6 animate-in fade-in duration-500">
              <Questionnaire questions={questionsData as any} onComplete={handleComplete} />
            </div>
          ) : (
            <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-700">
              <div id="area-relatorio" className="p-8 md:p-12 rounded-2xl bg-slate-950 text-slate-100 border border-slate-800 shadow-2xl">
                
                <div className="border-b border-slate-800 pb-6 mb-8">
                  <h2 className="text-3xl font-bold mb-4">Laudo de Diagnóstico</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-400 bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                    <div>
                      <p><span className="text-slate-500">Adquirente:</span> <span className="text-white font-medium">{session.client_name}</span></p>
                      <p><span className="text-slate-500">Documento:</span> <span className="text-white font-medium">{session.client_document}</span></p>
                    </div>
                  </div>
                </div>
                
                <ComplianceChart data={diagnosis.scores} />
                {/* Desempenho por Categoria */}
                <div className="mt-12">
                  <h3 className="text-xl font-bold mb-4 border-b border-slate-800 pb-2">Desempenho por Categoria</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {diagnosis.scores.map((score, idx) => (
                      <div key={idx} className="bg-slate-900 p-4 rounded-lg border border-slate-800 flex justify-between items-center">
                        <span className="font-medium text-slate-300">{score.name}</span>
                        <span className={`font-bold px-3 py-1 rounded-full text-sm 
                          ${score.value >= 80 ? 'bg-emerald-900/50 text-emerald-400' : 
                            score.value >= 50 ? 'bg-yellow-900/50 text-yellow-400' : 
                            'bg-red-900/50 text-red-400'}`}>
                          {score.value}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Alertas Críticos (Triggers Acionados) */}
                {diagnosis.alerts.length > 0 && (
                  <div className="mt-12 bg-slate-900 p-6 rounded-xl border-l-4 border-l-red-500 border border-slate-800">
                    <h3 className="text-lg font-bold text-red-400 mb-4 flex items-center gap-2">
                      <span>⚠️</span> Exigências Legais e Recomendações
                    </h3>
                    <ul className="space-y-3">
                      {diagnosis.alerts.map((alert, index) => (
                        <li key={index} className="text-slate-300 bg-red-950/30 p-4 rounded-lg text-sm border border-red-900/30">
                          {alert}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              <div className="flex justify-center no-print">
                <ExportPDFButton elementId="area-relatorio" />
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}