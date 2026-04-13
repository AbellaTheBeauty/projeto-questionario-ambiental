'use client';

import { useState } from 'react';
import { Question } from '../../types/diagnosis';

interface QuestionnaireProps {
  questions: Question[];
  onComplete: (answers: Record<string, string>) => void;
}

export function Questionnaire({ questions, onComplete }: QuestionnaireProps) {
  const [currentQuestionId, setCurrentQuestionId] = useState(questions[0]?.id);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  
  // NOVO: Histórico para o botão voltar (guarda os IDs das perguntas anteriores)
  const [history, setHistory] = useState<string[]>([]);
  
  // NOVO: Estado para controlar a exibição da tela de revisão final
  const [isReviewing, setIsReviewing] = useState(false);

  const currentQuestion = questions.find((q) => q.id === currentQuestionId);

  const handleAnswer = (answerText: string, fallbackNextId: string) => {
    const specificOption = currentQuestion?.options?.find(
      (opt) => opt.text.toLowerCase() === answerText.toLowerCase()
    );
    
    const nextId = specificOption?.nextId || fallbackNextId;

    const newAnswers = { ...answers, [currentQuestionId]: answerText };
    setAnswers(newAnswers);

    if (nextId === 'FIM') {
      // Em vez de finalizar direto, ativa a tela de revisão
      setIsReviewing(true);
    } else {
      // Guarda a pergunta atual no histórico antes de ir para a próxima
      setHistory([...history, currentQuestionId]);
      setCurrentQuestionId(nextId);
    }
  };

  // NOVO: Função para voltar atrás
  const handleGoBack = () => {
    if (history.length === 0) return; // Se não houver histórico, não faz nada
    
    // Tira o último ID do histórico e volta para ele
    const newHistory = [...history];
    const previousQuestionId = newHistory.pop();
    
    if (previousQuestionId) {
      setHistory(newHistory);
      setCurrentQuestionId(previousQuestionId);
    }
  };

  // ============================================================================
  // TELA DE REVISÃO FINAL (Intercepta o fim do questionário)
  // ============================================================================
  if (isReviewing) {
    return (
      <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 max-w-2xl mx-auto w-full animate-in fade-in zoom-in-95 duration-500 text-center">
        <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
          </svg>
        </div>
        
        <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-4">
          Você concluiu o preenchimento do formulário de avaliação!
        </h3>
        
        <p className="text-slate-600 dark:text-slate-300 mb-8 leading-relaxed text-left bg-slate-50 dark:bg-slate-800/50 p-6 rounded-xl border border-slate-100 dark:border-slate-700">
          Deseja voltar para revisar alguma resposta ou deseja finalizar a avaliação e emitir o relatório?
          <br /><br />
          <strong>Atenção:</strong> Após finalizar, o relatório será gerado na tela e também será enviado para o endereço de e-mail informado no cadastramento inicial. Não será possível reemitir ou acessar o formulário novamente.
          <br /><br />
          Deseja finalizar agora?
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => setIsReviewing(false)} // Esconde a revisão e volta para a última pergunta
            className="py-3 px-6 rounded-xl border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex-1"
          >
            Voltar para revisar
          </button>
          <button
            onClick={() => onComplete(answers)} // Agora sim, emite o relatório!
            className="py-3 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-lg hover:shadow-emerald-500/20 transition-all flex-1"
          >
            Sim, finalizar
          </button>
        </div>
      </div>
    );
  }

  // REDE DE SEGURANÇA (Se a pergunta falhar)
  if (!currentQuestion) {
    return (
      <div className="bg-red-950/30 p-8 rounded-2xl border border-red-900 text-center max-w-2xl mx-auto mt-8">
        <h3 className="text-xl font-bold text-red-500 mb-2">⚠️ Ops! Caminho Quebrado</h3>
        <p className="text-slate-300">
          O sistema tentou ir para a pergunta <strong className="text-white text-lg px-2 py-1 bg-red-900 rounded mx-1">"{currentQuestionId}"</strong>, mas ela não foi encontrada no ficheiro JSON.
        </p>
      </div>
    );
  }

  const isYesNoVisual = 
    currentQuestion.responseType === 'Sim/Não' || 
    (currentQuestion.options?.length === 2 && 
     currentQuestion.options.some(o => o.text === 'Sim') && 
     currentQuestion.options.some(o => o.text === 'Não'));

  return (
    <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 max-w-2xl mx-auto w-full transition-all duration-300">
      
      {/* HEADER DO CARD: Mostra o Tópico e o Botão Voltar */}
      <div className="mb-6 flex items-center justify-between">
        <span className="inline-block bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-100 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
          {currentQuestion.topic}
        </span>
        
        {/* Só mostra o botão Voltar se o utilizador já respondeu a pelo menos uma pergunta */}
        {history.length > 0 && (
          <button 
            onClick={handleGoBack}
            className="text-sm font-medium text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 flex items-center gap-1 transition-colors px-2 py-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <span>←</span> Voltar
          </button>
        )}
      </div>

      <h3 className="text-2xl font-semibold text-slate-800 dark:text-slate-100 mb-8 leading-snug">
        {currentQuestion.text}
      </h3>

      <div className="flex flex-col gap-3">
        {isYesNoVisual ? (
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => handleAnswer('Sim', currentQuestion.nextId || 'FIM')}
              className="py-4 px-6 rounded-xl border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-medium hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 hover:text-emerald-700 dark:hover:text-emerald-400 transition-all duration-200 active:scale-95"
            >
              Sim
            </button>
            <button
              onClick={() => handleAnswer('Não', currentQuestion.nextId || 'FIM')}
              className="py-4 px-6 rounded-xl border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-medium hover:border-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-700 dark:hover:text-red-400 transition-all duration-200 active:scale-95"
            >
              Não
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {currentQuestion.options?.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswer(option.text, option.nextId)}
                className="w-full text-left py-4 px-6 rounded-xl border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-medium hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 hover:text-emerald-700 dark:hover:text-emerald-400 transition-all duration-200 flex items-center justify-between group active:scale-[0.98]"
              >
                <span>{option.text}</span>
                <span className="text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity">
                  →
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}