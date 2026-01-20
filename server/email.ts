/**
 * Módulo para envio de emails usando Resend API
 */

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_API_URL = "https://api.resend.com/emails";
const FROM_EMAIL = "noreply@seu-verso.com";

export interface EmailData {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}

/**
 * Envia um email usando Resend API
 */
export async function sendEmail(data: EmailData): Promise<boolean> {
  // In test environment without API key, mock success
  if (!RESEND_API_KEY) {
    if (process.env.NODE_ENV === "test") {
      console.log("[Email] Mock send (test environment):", { to: data.to });
      return true;
    }
    console.error("[Email] RESEND_API_KEY not configured");
    return false;
  }

  try {
    const response = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: data.to,
        subject: data.subject,
        html: data.html,
        reply_to: data.replyTo || FROM_EMAIL,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("[Email] Failed to send email", {
        status: response.status,
        error,
      });
      return false;
    }

    const result = await response.json();
    console.log("[Email] Email sent successfully", {
      to: data.to,
      messageId: result.id,
    });

    return true;
  } catch (error) {
    console.error("[Email] Error sending email:", error);
    return false;
  }
}

/**
 * Envia email de notificação quando a música está pronta
 */
export async function sendMusicReadyEmail(
  email: string,
  musicTitle: string,
  downloadUrl: string,
  shareUrl: string,
  recipientName?: string
): Promise<boolean> {
  const recipientDisplay = recipientName || "Amigo";

  const html = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <style>
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        background-color: #f5f5f5;
        margin: 0;
        padding: 0;
      }
      .container {
        max-width: 600px;
        margin: 40px auto;
        background-color: #ffffff;
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }
      .header {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 40px 20px;
        text-align: center;
      }
      .header h1 {
        margin: 0;
        font-size: 28px;
        font-weight: 700;
      }
      .content {
        padding: 40px 20px;
        color: #333;
      }
      .content p {
        margin: 0 0 16px 0;
        line-height: 1.6;
        font-size: 16px;
      }
      .music-title {
        font-size: 20px;
        font-weight: 600;
        color: #667eea;
        margin: 24px 0;
      }
      .cta-button {
        display: inline-block;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 14px 32px;
        border-radius: 6px;
        text-decoration: none;
        font-weight: 600;
        margin: 24px 0;
        transition: transform 0.2s;
      }
      .cta-button:hover {
        transform: translateY(-2px);
      }
      .footer {
        background-color: #f9f9f9;
        padding: 20px;
        text-align: center;
        font-size: 12px;
        color: #666;
        border-top: 1px solid #eee;
      }
      .footer a {
        color: #667eea;
        text-decoration: none;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>🎵 Sua Música Está Pronta!</h1>
      </div>
      <div class="content">
        <p>Olá <strong>${recipientDisplay}</strong>,</p>
        <p>Que alegria! Sua música personalizada foi criada com sucesso! 🎉</p>
        <div class="music-title">${musicTitle}</div>
        <p>Clique no botão abaixo para ouvir, ver a letra e fazer o download:</p>
        <a href="${downloadUrl}" class="cta-button">Ouvir Minha Música</a>
        <p>Você também pode compartilhar este link com amigos e familiares:</p>
        <p style="word-break: break-all; background-color: #f5f5f5; padding: 12px; border-radius: 4px; font-family: monospace; font-size: 12px;">
          ${shareUrl}
        </p>
        <p>Obrigado por usar o Seu Verso! Se tiver dúvidas, estamos aqui para ajudar.</p>
      </div>
      <div class="footer">
        <p>© 2024 Seu Verso - Músicas Personalizadas com IA</p>
        <p>
          <a href="https://seu-verso.com/privacidade">Privacidade</a> | 
          <a href="https://seu-verso.com/termos">Termos de Uso</a>
        </p>
      </div>
    </div>
  </body>
</html>
  `;

  return sendEmail({
    to: email,
    subject: `🎵 Sua música "${musicTitle}" está pronta!`,
    html,
  });
}

/**
 * Envia email de confirmação de pedido
 */
export async function sendOrderConfirmationEmail(
  email: string,
  jobId: string,
  recipientName: string
): Promise<boolean> {
  const appUrl = process.env.APP_URL || "http://localhost:3000";
  const statusUrl = `${appUrl}/status/${jobId}`;

  const html = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <style>
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        background-color: #f5f5f5;
        margin: 0;
        padding: 0;
      }
      .container {
        max-width: 600px;
        margin: 40px auto;
        background-color: #ffffff;
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }
      .header {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 40px 20px;
        text-align: center;
      }
      .header h1 {
        margin: 0;
        font-size: 28px;
        font-weight: 700;
      }
      .content {
        padding: 40px 20px;
        color: #333;
      }
      .content p {
        margin: 0 0 16px 0;
        line-height: 1.6;
        font-size: 16px;
      }
      .status-link {
        display: inline-block;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 14px 32px;
        border-radius: 6px;
        text-decoration: none;
        font-weight: 600;
        margin: 24px 0;
        transition: transform 0.2s;
      }
      .status-link:hover {
        transform: translateY(-2px);
      }
      .steps {
        background-color: #f9f9f9;
        padding: 20px;
        border-radius: 6px;
        margin: 24px 0;
      }
      .step {
        margin-bottom: 12px;
        padding-bottom: 12px;
        border-bottom: 1px solid #eee;
      }
      .step:last-child {
        border-bottom: none;
        margin-bottom: 0;
        padding-bottom: 0;
      }
      .step-number {
        display: inline-block;
        background: #667eea;
        color: white;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        text-align: center;
        line-height: 24px;
        font-weight: 600;
        margin-right: 8px;
      }
      .footer {
        background-color: #f9f9f9;
        padding: 20px;
        text-align: center;
        font-size: 12px;
        color: #666;
        border-top: 1px solid #eee;
      }
      .footer a {
        color: #667eea;
        text-decoration: none;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>🎵 Sua Música Está Sendo Criada!</h1>
      </div>
      <div class="content">
        <p>Olá,</p>
        <p>Recebemos sua solicitação para criar uma música personalizada para <strong>${recipientName}</strong>! 🎉</p>
        <p>Estamos trabalhando para criar uma música única e memorável. O processo leva alguns minutos.</p>
        
        <div class="steps">
          <div class="step">
            <span class="step-number">1</span>
            <strong>Roteirizando história</strong>
          </div>
          <div class="step">
            <span class="step-number">2</span>
            <strong>Compondo letra</strong>
          </div>
          <div class="step">
            <span class="step-number">3</span>
            <strong>Produzindo melodia</strong>
          </div>
          <div class="step">
            <span class="step-number">4</span>
            <strong>Mixando e finalizando</strong>
          </div>
        </div>

        <p>Você pode acompanhar o progresso clicando no botão abaixo:</p>
        <a href="${statusUrl}" class="status-link">Ver Status da Música</a>
        
        <p>Quando sua música estiver pronta, você receberá um email com o link para ouvir, ver a letra e fazer o download.</p>
        <p>Obrigado por usar o Seu Verso!</p>
      </div>
      <div class="footer">
        <p>© 2024 Seu Verso - Músicas Personalizadas com IA</p>
        <p>
          <a href="https://seu-verso.com/privacidade">Privacidade</a> | 
          <a href="https://seu-verso.com/termos">Termos de Uso</a>
        </p>
      </div>
    </div>
  </body>
</html>
  `;

  return sendEmail({
    to: email,
    subject: "🎵 Sua música está sendo criada - Seu Verso",
    html,
  });
}
