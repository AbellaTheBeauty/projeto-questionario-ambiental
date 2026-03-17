import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase'; // A ponte do Supabase que criaste
import { Resend } from 'resend';

// Inicializa o motor de e-mails com a tua chave secreta
const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    // 1. Recebe os dados enviados pelo formulário
    const body = await request.json();
    const { name, document, email } = body;

    // 2. Calcula a data de validade (ex: 7 dias a partir de agora)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // 3. Guarda na base de dados (Supabase)
    const { data, error } = await supabase
      .from('sessions')
      .insert([
        {
          client_name: name,
          client_document: document,
          client_email: email,
          expires_at: expiresAt.toISOString(),
          status: 'pending'
        }
      ])
      .select()
      .single();

    if (error) {
      console.error("Erro no Supabase:", error);
      return NextResponse.json({ error: 'Erro ao gravar na base de dados.' }, { status: 500 });
    }

    const sessionId = data.id;

    // Cria o link único. No futuro, mudamos o localhost para o link da Vercel.
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const magicLink = `${baseUrl}/t/${sessionId}`;

    // 4. Envia o e-mail através do Resend
    await resend.emails.send({
      from: 'EnvCheck <onboarding@resend.dev>', // O Resend usa este e-mail para testes
      to: email,
      subject: 'O seu acesso ao Diagnóstico Ambiental - EnvCheck',
      html: `
        <div style="font-family: sans-serif; max-w: 600px; margin: 0 auto; color: #333;">
          <h2 style="color: #047857;">Bem-vindo(a) ao EnvCheck, ${name}!</h2>
          <p>O seu ambiente de diagnóstico ambiental está pronto e seguro.</p>
          <p>Para iniciar o preenchimento, clique no botão abaixo. Por motivos de segurança e privacidade, <strong>este link irá expirar em 7 dias</strong>.</p>
          <a href="${magicLink}" style="display: inline-block; background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 20px;">
            Aceder ao Questionário
          </a>
          <p style="margin-top: 30px; font-size: 12px; color: #666;">
            Aviso legal: O relatório final será enviado exclusivamente para este e-mail. Os seus dados não serão retidos após a conclusão.
          </p>
        </div>
      `
    });

    // 5. Devolve uma resposta de sucesso ao formulário
    return NextResponse.json({ success: true, sessionId });

  } catch (error) {
    console.error("Erro fatal:", error);
    return NextResponse.json({ error: 'Ocorreu um erro no servidor.' }, { status: 500 });
  }
}