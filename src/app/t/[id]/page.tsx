'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Leaf, Loader2, AlertCircle, ClipboardCheck, Clock, CheckCircle2, ArrowRight } from 'lucide-react';

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

// ============================================================================
// COMPONENTE 1: TELA DE BOAS VINDAS E INSTRUÇÕES
// ============================================================================
function WelcomeInstructions({ sessionData, onStart }: { sessionData: SessionData; onStart: () => void }) {
  const [agreed, setAgreed] = useState(false);

  return (
    <div className="max-w-2xl mx-auto bg-white dark:bg-slate-900 shadow-xl rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-500">
      
      {/* Banner de Boas-Vindas */}
      <div className="bg-emerald-600 p-8 text-white text-center">
        <div className="bg-white/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
          <ClipboardCheck className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold">Avaliação de Conformidade Ambiental</h1>
        <p className="text-emerald-100 mt-2">Olá, {sessionData?.client_name}. O seu ambiente seguro está pronto.</p>
      </div>

      <div className="p-8 space-y-8">
        
        {/* Seção de Regras */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-emerald-500" />
            Instruções de Preenchimento
          </h2>
          
          <div className="grid gap-4">
            <div className="flex gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800">
              <Clock className="w-5 h-5 text-slate-400 shrink-0" />
              <p className="text-sm text-slate-600 dark:text-slate-300">
                <strong>Duração do Link:</strong> Este acesso é válido por 7 dias. Após este prazo, será necessário solicitar um novo link.
              </p>
            </div>

            <div className="flex gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800">
              <CheckCircle2 className="w-5 h-5 text-slate-400 shrink-0" />
              <p className="text-sm text-slate-600 dark:text-slate-300">
                <strong>Acesso Único:</strong> O formulário só pode ser finalizado uma vez. Após a emissão do relatório, o link será permanentemente desativado.
              </p>
            </div>

            <div className="flex gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800">
              <AlertCircle className="w-5 h-5 text-slate-400 shrink-0" />
              <p className="text-sm text-slate-600 dark:text-slate-300">
                <strong>Continuidade:</strong> Caso a página seja fechada, você poderá reiniciar o preenchimento pelo link do e-mail, desde que não tenha finalizado a avaliação.
              </p>
            </div>
          </div>
        </section>

        {/* Orientações Adicionais */}
        <div className="bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-400 p-4">
          <p className="text-sm text-amber-800 dark:text-amber-200">
            <strong>Importante:</strong> Responda a todas as questões utilizando as opções disponíveis. O relatório final será gerado automaticamente com base nestas respostas.
          </p>
        </div>

        {/* Checkbox de Ciência */}
        <label className="flex items-center gap-3 cursor-pointer group">
          <input 
            type="checkbox" 
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="w-5 h-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
          />
          <span className="text-sm text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200 transition-colors">
            Compreendo as regras e desejo iniciar o questionário agora.
          </span>
        </label>

        {/* Botão de Início */}
        <button
          onClick={onStart}
          disabled={!agreed}
          className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
            agreed 
            ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg hover:shadow-emerald-500/20' 
            : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
          }`}
        >
          Acessar o Questionário
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// COMPONENTE 2: PÁGINA PRINCIPAL DA SESSÃO
// ============================================================================
export default function SessionPage() {
  const params = useParams();
  const sessionId = params.id as string;

  const [session, setSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [diagnosis, setDiagnosis] = useState<FinalDiagnosis | null>(null);
  
  // NOVO ESTADO: Controla se o usuário já passou da tela de instruções
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    async function loadSession() {
      if (!sessionId) return;
      
      try {
        const { data, error } = await supabase
          .from('sessions')
          .select('*')
          .eq('id', sessionId)
          .single();

        if (error) throw error;
        
        if (!data) {
          setError("Sessão não encontrada.");
          return;
        }

        // Verifica se a sessão expirou
        if (new Date(data.expires_at) < new Date()) {
          setError("Este link expirou. Por favor, solicite um novo acesso.");
          return;
        }

        setSession(data);

        // Se a sessão já estiver concluída, carrega o diagnóstico
        if (data.status === 'completed' && data.diagnosis_data) {
          setDiagnosis(data.diagnosis_data);
          // Se já terminou, passa direto pelas instruções
          setHasStarted(true); 
        }

      } catch (err: any) {
        console.error(err);
        setError("Erro ao carregar os dados. Tente novamente.");
      } finally {
        setLoading(false);
      }
    }

    loadSession();
  }, [sessionId]);

  const handleComplete = async (answers: Record<string, string>) => {
    try {
      setLoading(true);
      // CORREÇÃO 1: Usando "as any" no DiagnosisService para ignorar o nome exato do método
      const result = (DiagnosisService as any).calculate 
        ? (DiagnosisService as any).calculate(answers, questionsData as any)
        : (DiagnosisService as any).generateDiagnosis(answers, questionsData as any);
      
      setDiagnosis(result);

      // Salva no banco e muda o status
      await supabase
        .from('sessions')
        .update({ 
          status: 'completed',
          diagnosis_data: result 
        })
        .eq('id', sessionId);
        
    } catch (err) {
      console.error(err);
      alert("Ocorreu um erro ao salvar o relatório. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-600 mb-4" />
        <p className="text-slate-600 dark:text-slate-400">Preparando o seu ambiente...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-xl max-w-md w-full text-center border border-slate-200 dark:border-slate-800">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">Acesso Indisponível</h2>
          <p className="text-slate-600 dark:text-slate-400">{error}</p>
        </div>
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col transition-colors duration-300">
      
      {/* HEADER FIXO DO AMBIENTE SEGURO */}
      <header className="bg-emerald-800 dark:bg-emerald-950 text-white shadow-md px-6 py-4 flex items-center justify-between no-print">
        <div className="flex items-center gap-3">
          <div className="bg-white/10 p-2 rounded-full">
            <Leaf className="w-6 h-6 text-emerald-300" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-wide">Avaliação de Conformidade</h1>
            <p className="text-emerald-200/80 text-xs uppercase tracking-widest">{session.client_name}</p>
          </div>
        </div>
      </header>

      {/* ÁREA CENTRAL */}
      <main className="flex-1 p-4 sm:p-8">
        
        {/* SE NÃO COMEÇOU E NÃO ESTÁ COMPLETO: Mostra Instruções */}
        {!hasStarted && session.status === 'pending' && (
          <WelcomeInstructions 
            sessionData={session} 
            onStart={() => setHasStarted(true)} 
          />
        )}

        {/* SE JÁ COMEÇOU E ESTÁ PENDENTE: Mostra as Perguntas */}
        {hasStarted && session.status === 'pending' && (
          <div className="max-w-4xl mx-auto animate-in fade-in zoom-in-95 duration-500">
             <Questionnaire 
                questions={questionsData as any} 
                onComplete={handleComplete} 
             />
          </div>
        )}

        {/* SE ESTIVER CONCLUÍDO: Mostra o Relatório */}
        {diagnosis && session.status === 'completed' && (
          <div className="max-w-4xl mx-auto animate-in slide-in-from-bottom-8 duration-700">
            <div id="area-relatorio" className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl overflow-hidden border border-slate-200 dark:border-slate-800">
              
              <div className="p-8 border-b border-slate-100 dark:border-slate-800">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-6">
                  Relatório de Avaliação Ambiental
                </h2>
                
                {/* INFORMAÇÕES DO CLIENTE (Com a nova linha da Data!) */}
                <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-xl space-y-3">
                  <p className="text-slate-600 dark:text-slate-300"><strong className="text-slate-800 dark:text-slate-100">Empresa/Cliente:</strong> {session.client_name}</p>
                  <p className="text-slate-600 dark:text-slate-300"><strong className="text-slate-800 dark:text-slate-100">Documento (CPF/CNPJ):</strong> {session.client_document}</p>
                  <p className="text-slate-600 dark:text-slate-300"><strong className="text-slate-800 dark:text-slate-100">Data de Emissão:</strong> {new Date().toLocaleDateString('pt-BR')}</p>
                </div>
              </div>

              {/* RESTANTE DO SEU RELATÓRIO (Gráficos e Alertas) */}
              <div className="p-8">
                <div className="mb-12">
                  <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-6">Índice Geral de Conformidade</h3>
                  <div className="flex justify-center">
                    {/* CORREÇÃO 2: Passando a propriedade inteira via spread operator e bypass as any */}
                    <ComplianceChart {...(diagnosis as any)} />
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-6">Análise por Dimensão</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* CORREÇÃO 3: Usando as any para garantir que a propriedade existe ou tentar mapear com nomes comuns */}
                    {((diagnosis as any).topicScores || (diagnosis as any).categories || []).map((score: any, index: number) => (
                      <div key={index} className="flex justify-between items-center p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700">
                        <span className="font-semibold text-slate-700 dark:text-slate-200">{score.topic || score.name}</span>
                        <span className={`font-bold px-3 py-1 rounded-full text-sm
                          ${(score.value || score.score) >= 80 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400' : 
                            (score.value || score.score) >= 50 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-400' : 
                            'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400'}`}>
                          {score.value || score.score}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {((diagnosis as any).alerts || []).length > 0 && (
                  <div className="mt-12 bg-red-50 dark:bg-slate-900 p-6 rounded-xl border-l-4 border-l-red-500 border border-red-100 dark:border-slate-800">
                    <h3 className="text-lg font-bold text-red-700 dark:text-red-400 mb-4 flex items-center gap-2">
                      <AlertCircle className="w-5 h-5" /> Exigências Legais e Recomendações
                    </h3>
                    <ul className="space-y-3">
                      {((diagnosis as any).alerts || []).map((alert: any, index: number) => (
                        <li key={index} className="text-red-800 dark:text-slate-300 bg-white dark:bg-red-950/30 p-4 rounded-lg text-sm border border-red-100 dark:border-red-900/30">
                          {typeof alert === 'string' ? alert : alert.text || alert.message}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}  
              </div>
            </div>
            
            <div className="flex justify-center mt-6 no-print">
              {/* CORREÇÃO 4: O botão ExportPDF não recebia filename, removi isso e corrigi o erro de sintaxe */}
              <ExportPDFButton elementId="area-relatorio" />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}