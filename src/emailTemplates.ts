/**
 * Utilitários para renderização dos 7 templates HTML de e-mail responsivos
 */

export interface EmailPreviewData {
  nomeEmpresa: string;
  logoUrl: string;
  emailNoc: string;
  clienteNome: string;
  clienteEmail: string;
  codigoOtp: string;
  minutosOtp: number;
  senhaTemporaria: string;
  idTicket: string;
  idCircuito: string;
  nomeCircuito: string;
  tipoIncidente: string;
  identificadorTecnico: string;
  descricao: string;
  driveUrl: string;
  mensagemComentario: string;
  novoStatus: string;
  statusAnterior: string;
  dataExpiracaoSla: string;
}

export const DEFAULT_PREVIEW_DATA: EmailPreviewData = {
  nomeEmpresa: 'Telecom NOC Operations',
  logoUrl: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=300&q=80',
  emailNoc: 'inoc@meo.pt',
  clienteNome: 'Acme Telecom Solutions Ltda',
  clienteEmail: 'cliente@exemplo.com',
  codigoOtp: '849201',
  minutosOtp: 10,
  senhaTemporaria: 'Nx7#k9Wp',
  idTicket: 'TK-20261007-0001',
  idCircuito: 'CIRC-SP-001',
  nomeCircuito: 'Link Fibra Matriz São Paulo (10 Gbps)',
  tipoIncidente: 'CORTE_TOTAL',
  identificadorTecnico: 'VLAN-1004 / IP 200.198.110.45',
  descricao: 'Perda total de tráfego na interface ótica principal desde 02:15. Link redundante assumiu mas com degradação severa de jitter.',
  driveUrl: 'https://drive.google.com/drive/folders/demo-portal-tickets',
  mensagemComentario: 'Nossa equipe de campo identificou atenuação anômala no DIO do POP Consolação. Técnico a caminho com OTDR para medição.',
  novoStatus: 'EM_RESOLUCAO',
  statusAnterior: 'ABERTO',
  dataExpiracaoSla: '2026-10-07 14:00 (UTC-3)'
};

export function comporEmailHtml(tipoTemplate: string, data: EmailPreviewData = DEFAULT_PREVIEW_DATA): string {
  const baseHeader = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Email Notification</title>
    </head>
    <body style="margin:0; padding:0; background-color:#f1f5f9; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color:#1e293b;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f1f5f9; padding:24px 12px;">
        <tr>
          <td align="center">
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:620px; background-color:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 10px 25px -5px rgba(0,0,0,0.08); border:1px solid #e2e8f0;">
              <!-- HEADER -->
              <tr>
                <td style="background-color:#0f172a; padding:24px 32px; border-bottom:3px solid #0284c7;">
                  <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td>
                        <span style="font-size:22px; font-weight:700; color:#ffffff; letter-spacing:-0.5px;">${data.nomeEmpresa}</span>
                        <div style="font-size:12px; color:#94a3b8; margin-top:4px; font-weight:500;">PORTAL DE INCIDENTES & NOC OPERATIONS</div>
                      </td>
                      <td align="right">
                        <img src="${data.logoUrl}" alt="Logo" width="48" height="48" style="display:block; border-radius:8px; object-fit:cover;" />
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <!-- CORPO -->
              <tr>
                <td style="padding:32px 32px 28px 32px;">
  `;

  const baseFooter = `
                </td>
              </tr>
              <!-- FOOTER -->
              <tr>
                <td style="background-color:#f8fafc; padding:20px 32px; border-top:1px solid #e2e8f0; font-size:12px; color:#64748b; line-height:1.6;">
                  <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td>
                        <strong>NOC Telecom Support 24x7:</strong> ${data.emailNoc}<br>
                        <span style="color:#94a3b8;">Mensagem automática emitida por sistema de telecomunicações. Não responda diretamente a este e-mail.</span>
                      </td>
                      <td align="right" valign="top" style="color:#94a3b8; font-size:11px;">
                        &copy; 2026 ${data.nomeEmpresa}
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  let corpo = '';

  switch (tipoTemplate) {
    case 'otp':
      corpo = `
        <h2 style="font-size:20px; font-weight:700; color:#0f172a; margin-top:0; margin-bottom:12px;">Autenticação em Duas Etapas (2FA)</h2>
        <p style="font-size:14px; line-height:1.6; color:#334155; margin-bottom:24px;">
          Olá <strong>${data.clienteNome}</strong>,<br>
          Foi solicitada uma tentativa de acesso ao Portal de Incidentes Telecom. Utilize o código de uso único abaixo para confirmar sua identidade:
        </p>
        <div style="text-align:center; margin:32px 0;">
          <div style="display:inline-block; background-color:#f0fdf4; border:2px dashed #16a34a; border-radius:12px; padding:18px 40px;">
            <span style="font-size:36px; font-weight:800; letter-spacing:8px; color:#15803d; font-family:Courier, monospace;">${data.codigoOtp}</span>
          </div>
          <div style="font-size:12px; color:#64748b; margin-top:10px; font-weight:500;">
            ⏰ Este código expira em <strong>${data.minutosOtp} minutos</strong> e só pode ser utilizado uma vez.
          </div>
        </div>
        <p style="font-size:13px; color:#94a3b8; line-height:1.5;">
          Se você não solicitou este código, recomendamos avisar imediatamente a gerência do NOC ou trocar suas credenciais.
        </p>
      `;
      break;

    case 'recuperacao_senha':
      corpo = `
        <h2 style="font-size:20px; font-weight:700; color:#0f172a; margin-top:0; margin-bottom:12px;">Redefinição de Credencial de Acesso</h2>
        <p style="font-size:14px; line-height:1.6; color:#334155; margin-bottom:20px;">
          Olá <strong>${data.clienteNome}</strong>,<br>
          Uma nova senha temporária foi gerada para seu acesso B2B ao Portal de Incidentes:
        </p>
        <div style="background-color:#eff6ff; border:1px solid #bfdbfe; border-radius:8px; padding:18px; margin:20px 0; text-align:center;">
          <div style="font-size:12px; font-weight:600; color:#1e40af; text-transform:uppercase; margin-bottom:6px;">Sua Senha Temporária:</div>
          <div style="font-size:24px; font-weight:700; letter-spacing:2px; color:#1d4ed8; font-family:Courier, monospace;">${data.senhaTemporaria}</div>
        </div>
        <div style="background-color:#fef2f2; border-left:4px solid #ef4444; padding:12px 16px; border-radius:4px; margin-bottom:20px;">
          <strong style="color:#b91c1c; font-size:13px;">Atenção Obrigatória:</strong>
          <p style="margin:4px 0 0 0; font-size:13px; color:#7f1d1d; line-height:1.4;">
            Por motivos de compliance de segurança, o sistema exigirá que você cadastre uma nova senha pessoal definitiva imediatamente no seu próximo login.
          </p>
        </div>
      `;
      break;

    case 'novo_ticket_noc':
      const badgeColor = data.tipoIncidente === 'CORTE_TOTAL' ? '#ef4444' : (data.tipoIncidente === 'CORTE_PARCIAL' ? '#f59e0b' : '#3b82f6');
      corpo = `
        <div style="display:inline-block; background-color:${badgeColor}; color:#ffffff; font-size:11px; font-weight:700; padding:4px 10px; border-radius:6px; margin-bottom:12px; text-transform:uppercase;">
          NOVO INCIDENTE REGISTRADO - ${data.tipoIncidente}
        </div>
        <h2 style="font-size:22px; font-weight:800; color:#0f172a; margin-top:0; margin-bottom:16px;">Protocolo: ${data.idTicket}</h2>
        <table width="100%" cellpadding="10" cellspacing="0" border="0" style="border-collapse:collapse; margin-bottom:20px; font-size:13px; border:1px solid #e2e8f0; border-radius:8px; overflow:hidden;">
          <tr style="background-color:#f8fafc; border-bottom:1px solid #e2e8f0;">
            <td width="35%" style="font-weight:600; color:#475569;">Cliente B2B:</td>
            <td style="color:#0f172a;"><strong>${data.clienteNome}</strong></td>
          </tr>
          <tr style="border-bottom:1px solid #e2e8f0;">
            <td style="font-weight:600; color:#475569;">Circuito Afetado:</td>
            <td style="color:#0f172a;">${data.nomeCircuito} (${data.idCircuito})</td>
          </tr>
          <tr style="background-color:#f8fafc; border-bottom:1px solid #e2e8f0;">
            <td style="font-weight:600; color:#475569;">Identificador Técnico:</td>
            <td style="font-family:Courier, monospace; font-weight:600; color:#0284c7;">${data.identificadorTecnico}</td>
          </tr>
          <tr style="border-bottom:1px solid #e2e8f0;">
            <td style="font-weight:600; color:#475569;">Contato do Cliente:</td>
            <td style="color:#0f172a;">${data.clienteEmail}</td>
          </tr>
        </table>
        <div style="background-color:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:16px; margin-bottom:20px;">
          <div style="font-size:12px; font-weight:700; color:#475569; text-transform:uppercase; margin-bottom:8px;">Descrição do Incidente Reportado:</div>
          <div style="font-size:14px; line-height:1.6; color:#1e293b; white-space:pre-wrap;">${data.descricao}</div>
        </div>
        <div style="margin-top:16px;">
          <a href="${data.driveUrl}" target="_blank" style="display:inline-block; background-color:#0284c7; color:#ffffff; font-size:13px; font-weight:600; padding:10px 20px; text-decoration:none; border-radius:6px;">Acessar Pasta de Anexos no Google Drive &rarr;</a>
        </div>
      `;
      break;

    case 'confirmacao_cliente':
      corpo = `
        <h2 style="font-size:20px; font-weight:700; color:#0f172a; margin-top:0; margin-bottom:8px;">Chamado Aberto com Sucesso</h2>
        <p style="font-size:14px; line-height:1.6; color:#334155; margin-bottom:20px;">
          Prezados da <strong>${data.clienteNome}</strong>,<br>
          Confirmamos o registro do seu chamado de incidente em nossa central de operações de rede. Nossos engenheiros já foram acionados para diagnóstico.
        </p>
        <div style="background-color:#f0f9ff; border:1px solid #bae6fd; border-radius:8px; padding:18px; margin-bottom:20px;">
          <div style="font-size:12px; color:#0369a1; font-weight:600; text-transform:uppercase;">Protocolo de Atendimento:</div>
          <div style="font-size:26px; font-weight:800; color:#0284c7; margin:4px 0 10px 0;">${data.idTicket}</div>
          <div style="font-size:13px; color:#0c4a6e;">
            <strong>Circuito:</strong> ${data.nomeCircuito} (${data.identificadorTecnico})<br>
            <strong>Classificação:</strong> ${data.tipoIncidente}<br>
            <strong>Status Inicial:</strong> ABERTO
          </div>
        </div>
        <p style="font-size:13px; color:#64748b; line-height:1.6;">
          Você pode acompanhar as interações em tempo real diretamente pelo Portal B2B. A cada atualização da nossa equipe técnica, você receberá uma notificação.
        </p>
      `;
      break;

    case 'comentario_noc':
      corpo = `
        <h2 style="font-size:20px; font-weight:700; color:#0f172a; margin-top:0; margin-bottom:8px;">Atualização Técnica no Ticket ${data.idTicket}</h2>
        <p style="font-size:14px; line-height:1.6; color:#334155; margin-bottom:20px;">
          Olá <strong>${data.clienteNome}</strong>,<br>
          A equipe de engenharia do NOC adicionou um novo posicionamento no seu chamado:
        </p>
        <div style="background-color:#f8fafc; border-left:4px solid #0284c7; border-radius:0 8px 8px 0; padding:16px 20px; margin-bottom:20px;">
          <div style="font-size:12px; font-weight:700; color:#0284c7; text-transform:uppercase; margin-bottom:6px;">Parecer Técnico NOC:</div>
          <div style="font-size:14px; line-height:1.6; color:#0f172a; white-space:pre-wrap;">${data.mensagemComentario}</div>
        </div>
        <p style="font-size:13px; color:#64748b;">
          Para responder a este posicionamento, acesse o Portal B2B de Incidentes.
        </p>
      `;
      break;

    case 'comentario_cliente':
      corpo = `
        <div style="background-color:#e0f2fe; color:#0369a1; font-size:11px; font-weight:700; padding:4px 8px; border-radius:4px; display:inline-block; margin-bottom:8px;">RESPOSTA DO CLIENTE B2B</div>
        <h2 style="font-size:20px; font-weight:700; color:#0f172a; margin-top:0; margin-bottom:12px;">Ticket ${data.idTicket} - ${data.clienteNome}</h2>
        <div style="background-color:#f8fafc; border-left:4px solid #10b981; border-radius:0 8px 8px 0; padding:16px 20px; margin-bottom:20px;">
          <div style="font-size:12px; font-weight:700; color:#059669; text-transform:uppercase; margin-bottom:6px;">Mensagem Enviada pelo Cliente:</div>
          <div style="font-size:14px; line-height:1.6; color:#0f172a; white-space:pre-wrap;">${data.mensagemComentario}</div>
        </div>
        <p style="font-size:12px; color:#64748b;">
          Status atual do ticket: <strong>${data.novoStatus}</strong>
        </p>
      `;
      break;

    case 'alerta_sla':
      corpo = `
        <div style="background-color:#fee2e2; border:2px solid #ef4444; border-radius:10px; padding:20px; margin-bottom:24px; text-align:center;">
          <div style="font-size:14px; font-weight:800; color:#b91c1c; text-transform:uppercase; letter-spacing:1px;">⚠️ ALERTA CRÍTICO DE VIOLAÇÃO DE SLA ⚠️</div>
          <div style="font-size:26px; font-weight:900; color:#7f1d1d; margin:8px 0;">TICKET ${data.idTicket}</div>
          <div style="font-size:13px; color:#991b1b;">O prazo limite para retorno da pendência expirou sem manifestação do cliente.</div>
        </div>
        <p style="font-size:14px; line-height:1.6; color:#334155;">
          Ação automatizada do sistema: o status deste chamado foi automaticamente revertido para <strong>[ABERTO]</strong> para que a equipe técnica do NOC retome o tratamento imediato.
        </p>
        <table width="100%" cellpadding="8" cellspacing="0" border="0" style="font-size:13px; border:1px solid #fecaca; border-radius:6px; background-color:#fff5f5; margin-bottom:20px;">
          <tr>
            <td width="35%"><strong>Cliente B2B:</strong></td>
            <td>${data.clienteNome}</td>
          </tr>
          <tr>
            <td><strong>Circuito:</strong></td>
            <td>${data.idCircuito}</td>
          </tr>
          <tr>
            <td><strong>Prazo Expirado:</strong></td>
            <td style="color:#b91c1c; font-weight:700;">${data.dataExpiracaoSla}</td>
          </tr>
        </table>
      `;
      break;

    default:
      corpo = '<p>Selecione um template para visualizar.</p>';
  }

  return baseHeader + corpo + baseFooter;
}
