import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface PasswordResetRequest {
  email: string;
  resetLink: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, resetLink }: PasswordResetRequest = await req.json();

    const emailResponse = await resend.emails.send({
      from: "Gera Cardápio <noreply@resend.dev>",
      to: [email],
      subject: "Redefinir sua Senha - Gera Cardápio",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Redefinir Senha</title>
          </head>
          <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                <div style="text-align: center; margin-bottom: 30px;">
                  <h1 style="color: #1e293b; margin: 0; font-size: 28px; font-weight: 700;">Gera Cardápio</h1>
                  <p style="color: #64748b; margin: 8px 0 0 0; font-size: 16px;">Sua plataforma de delivery</p>
                </div>
                
                <div style="margin-bottom: 30px;">
                  <h2 style="color: #334155; margin: 0 0 16px 0; font-size: 24px; font-weight: 600;">Redefinir sua Senha</h2>
                  <p style="color: #475569; margin: 0 0 24px 0; font-size: 16px; line-height: 1.6;">
                    Você solicitou a redefinição da sua senha. Clique no botão abaixo para criar uma nova senha:
                  </p>
                </div>
                
                <div style="text-align: center; margin-bottom: 30px;">
                  <a href="${resetLink}" 
                     style="display: inline-block; background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 14px 0 rgba(59, 130, 246, 0.4);">
                    Redefinir Minha Senha
                  </a>
                </div>
                
                <div style="background: #f1f5f9; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
                  <p style="color: #475569; margin: 0; font-size: 14px; line-height: 1.5;">
                    <strong>Importante:</strong> Este link é válido por apenas algumas horas. Se você não solicitou esta redefinição de senha, pode ignorar este email com segurança.
                  </p>
                </div>
                
                <div style="text-align: center; border-top: 1px solid #e2e8f0; padding-top: 30px;">
                  <p style="color: #94a3b8; margin: 0; font-size: 14px;">
                    Se você não conseguir clicar no botão, copie e cole este link no seu navegador:
                  </p>
                  <p style="color: #3b82f6; margin: 8px 0 0 0; font-size: 14px; word-break: break-all;">
                    ${resetLink}
                  </p>
                </div>
                
                <div style="text-align: center; margin-top: 30px;">
                  <p style="color: #94a3b8; margin: 0; font-size: 12px;">
                    © 2024 Gera Cardápio. Todos os direitos reservados.
                  </p>
                </div>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    console.log("Email de redefinição enviado:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Erro ao enviar email de redefinição:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);