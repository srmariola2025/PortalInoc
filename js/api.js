// ==========================================================================
// JS/API.JS — CLIENTE COM O GOOGLE APPS SCRIPT WEB APP (HTMLSERVICE)
// ==========================================================================

import { mostrarToast } from './utils.js';

/**
 * Executa chamada assíncrona ao backend utilizando google.script.run com handlers.
 */
function chamarAppsScriptRun(action, payload, token) {
  return new Promise((resolve, reject) => {
    try {
      window.google.script.run
        .withSuccessHandler((resposta) => {
          if (!resposta || resposta.sucesso === false) {
            reject(new Error((resposta && resposta.erro) || `Erro retornado pelo backend na ação [${action}].`));
          } else {
            resolve(resposta);
          }
        })
        .withFailureHandler((erro) => {
          console.error(`Erro no google.script.run [${action}]:`, erro);
          reject(new Error(erro && erro.message ? erro.message : String(erro)));
        })
        .apiCallFromHtmlService(action, payload, token);
    } catch (errCall) {
      reject(errCall);
    }
  });
}

/**
 * Função central de comunicação com o backend Apps Script.
 * Prioriza estritamente google.script.run quando o portal é servido no Web App.
 * Permite simulador local exclusivamente em localhost ou preview de desenvolvimento.
 * NUNCA cai silenciosamente no simulador para o site publicado (ex: no domínio github.io).
 */
export async function apiRequest(action, payload = {}, requerToken = true) {
  const token = requerToken ? localStorage.getItem('token') : null;

  // Se o token for obrigatório e não existir, redireciona para login
  if (requerToken && !token) {
    localStorage.clear();
    window.location.href = './login.html';
    throw new Error('Sessão expirada ou não autenticada.');
  }

  // 1. Se estiver no ambiente nativo do Apps Script Web App (HtmlService)
  if (typeof window !== 'undefined' && window.google && window.google.script && window.google.script.run) {
    return await chamarAppsScriptRun(action, payload, token);
  }

  // 2. Ambiente de desenvolvimento (apenas localhost / preview de desenvolvimento)
  const isDev = typeof window !== 'undefined' && (
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname.endsWith('.applet.ai') ||
    window.location.hostname.includes('webcontainer') ||
    window.location.port !== ''
  );

  if (isDev) {
    return executarSimuladorLocal(action, payload, token);
  }

  // 3. Produção fora do host Apps Script (ex: direto no github.io)
  const msgErro = 'Acesso direto via GitHub Pages não suportado. Por favor, acesse o portal através da URL oficial do Google Apps Script Web App.';
  mostrarToast(msgErro, 'erro');
  throw new Error(msgErro);
}

// --------------------------------------------------------------------------
// MÉTODOS ESPECÍFICOS DE CADA ENDPOINT
// --------------------------------------------------------------------------

// 1. Públicos (Sem Token)
export async function solicitarLogin(email, senha) {
  return apiRequest('solicitar_login', { email, senha }, false);
}

export async function validarOTP(email, otp) {
  return apiRequest('validar_otp', { email, otp }, false);
}

export async function recuperarSenha(email) {
  return apiRequest('recuperar_senha', { email }, false);
}

export async function trocarSenhaTemporaria(email, senhaTemp, novaSenha) {
  return apiRequest('trocar_senha_temporaria', { email, senha_temp: senhaTemp, nova_senha: novaSenha }, false);
}

// 2. Cliente B2B (Exigem Token)
export async function validarSessao() {
  return apiRequest('validar_sessao', {}, true);
}

export async function listarMeusCircuitos() {
  return apiRequest('listar_meus_circuitos', {}, true);
}

export async function listarMeusTickets() {
  return apiRequest('listar_meus_tickets', {}, true);
}

export async function abrirTicket(dados) {
  return apiRequest('abrir_ticket', dados, true);
}

export async function verTicket(idTicket) {
  return apiRequest('ver_ticket', { id_ticket: idTicket }, true);
}

export async function comentarTicket(idTicket, mensagem, anexos = []) {
  return apiRequest('comentar_ticket', { id_ticket: idTicket, mensagem, anexos_base64: anexos }, true);
}

export async function baixarAnexo(idTicket, idArquivo) {
  return apiRequest('baixar_anexo', { id_ticket: idTicket, id_arquivo: idArquivo }, true);
}

// 3. NOC Master (Exigem Token de Usuário Master)
export async function listarTodosTickets(filtros = {}) {
  return apiRequest('listar_todos_tickets', filtros, true);
}

export async function verTicketMaster(idTicket) {
  return apiRequest('ver_ticket_master', { id_ticket: idTicket }, true);
}

export async function alterarStatus(idTicket, novoStatus, dataPendenciaExpira = null) {
  return apiRequest('alterar_status', {
    id_ticket: idTicket,
    novo_status: novoStatus,
    data_pendencia_expira: dataPendenciaExpira
  }, true);
}

export async function comentarMaster(idTicket, mensagem, anexos = []) {
  return apiRequest('comentar_master', { id_ticket: idTicket, mensagem, anexos_base64: anexos }, true);
}

export async function reabrirTicket(idTicket) {
  return apiRequest('reabrir_ticket', { id_ticket: idTicket }, true);
}

export async function importarBaseCSV(tipo, csvTexto) {
  return apiRequest('importar_base_csv', { tipo, csv_texto: csvTexto }, true);
}

// --------------------------------------------------------------------------
// SIMULADOR LOCAL EM MEMÓRIA (Permite testes imediatos antes do deploy)
// --------------------------------------------------------------------------
function executarSimuladorLocal(action, payload, token) {
  console.info(`[Modo Simulação Local MEO] Executando: ${action}`, payload);

  const agora = new Date();

  // Mock de dados locais
  if (!window._meoMockDb) {
    window._meoMockDb = {
      clientes: [
        { id: 'CLI-001', nome: 'Altice Corporate Solutions', email: 'cliente@exemplo.com', is_master: false },
        { id: 'NOC-ADMIN', nome: 'MEO International NOC Team', email: 'inoc@meo.pt', is_master: true }
      ],
      circuitos: [
        { id_circuito: 'CIRC-LIS-LON-01', nome_circuito: 'EPL Lisboa - Londres (100 Gbps)', tipo_link: 'Fibra DWDM', identificador_tecnico: 'VLAN-2001 / IP 195.23.1.10', status: 'ATIVO' },
        { id_circuito: 'CIRC-MAD-PAR-02', nome_circuito: 'IP Transit Madrid - Paris (40 Gbps)', tipo_link: 'Fibra Terrestre', identificador_tecnico: 'AS3243 / IP 195.23.4.18', status: 'ATIVO' },
        { id_circuito: 'CIRC-SUB-ATL-03', nome_circuito: 'Cabo Submarino EllaLink Sines (10 Gbps)', tipo_link: 'Submarino', identificador_tecnico: 'PORT-SN-04 / STM-64', status: 'ATIVO' }
      ],
      tickets: [
        {
          id_ticket: 'TK-20261007-0001',
          id_cliente: 'CLI-001',
          nome_empresa: 'Altice Corporate Solutions',
          id_circuito: 'CIRC-LIS-LON-01',
          nome_circuito: 'EPL Lisboa - Londres (100 Gbps)',
          tipo_link: 'Fibra DWDM',
          identificador_tecnico: 'VLAN-2001 / IP 195.23.1.10',
          tipo_incidente: 'CORTE_TOTAL',
          descricao_inicial: 'Rompimento ótico total detectado no enlace internacional entre Lisboa e Londres. Alarme de Loss of Signal (LOS) ativo no equipamento Ciena.',
          status: 'EM_RESOLUCAO',
          data_abertura: new Date(Date.now() - 3600000 * 3).toISOString(),
          data_ultima_atualizacao: new Date(Date.now() - 1800000).toISOString(),
          data_pendencia_expira: null,
          data_fechamento: null,
          pasta_drive_anexos: 'https://drive.google.com/drive/folders/PortalTickets-TK-20261007-0001',
          total_comentarios: 2
        },
        {
          id_ticket: 'TK-20261007-0002',
          id_cliente: 'CLI-001',
          nome_empresa: 'Altice Corporate Solutions',
          id_circuito: 'CIRC-MAD-PAR-02',
          nome_circuito: 'IP Transit Madrid - Paris (40 Gbps)',
          tipo_link: 'Fibra Terrestre',
          identificador_tecnico: 'AS3243 / IP 195.23.4.18',
          tipo_incidente: 'CORTE_PARCIAL',
          descricao_inicial: 'Queda de redundância de BGP. Enlace operando em mono-rota com degradação de latência acima de 45ms.',
          status: 'PENDENTE',
          data_abertura: new Date(Date.now() - 3600000 * 8).toISOString(),
          data_ultima_atualizacao: new Date(Date.now() - 3600000 * 2).toISOString(),
          data_pendencia_expira: new Date(Date.now() + 3600000 * 4).toISOString(),
          data_fechamento: null,
          pasta_drive_anexos: '',
          total_comentarios: 1
        },
        {
          id_ticket: 'TK-20261007-0003',
          id_cliente: 'CLI-001',
          nome_empresa: 'Altice Corporate Solutions',
          id_circuito: 'CIRC-SUB-ATL-03',
          nome_circuito: 'Cabo Submarino EllaLink Sines (10 Gbps)',
          tipo_link: 'Submarino',
          identificador_tecnico: 'PORT-SN-04 / STM-64',
          tipo_incidente: 'ENSAIO',
          descricao_inicial: 'Ensaio de comutação automática programado para manutenção preventiva de hardware.',
          status: 'RESOLVIDO',
          data_abertura: new Date(Date.now() - 3600000 * 12).toISOString(),
          data_ultima_atualizacao: agora.toISOString(),
          data_pendencia_expira: null,
          data_fechamento: agora.toISOString(), // Fechado hoje para testar reabertura
          pasta_drive_anexos: '',
          total_comentarios: 3
        }
      ],
      comentarios: [
        {
          id_comentario: 'c-01',
          id_ticket: 'TK-20261007-0001',
          autor_tipo: 'CLIENTE',
          autor_nome: 'Altice Corporate Solutions',
          mensagem: 'Chamado aberto em caráter de emergência. Aguardamos diagnóstico de OTDR.',
          anexo_url: '',
          data_hora: new Date(Date.now() - 3600000 * 3).toISOString()
        },
        {
          id_comentario: 'c-02',
          id_ticket: 'TK-20261007-0001',
          autor_tipo: 'NOC',
          autor_nome: 'INOC Operações (inoc@meo.pt)',
          mensagem: 'Equipe de campo acionada no trecho terrestre de Vilar Formoso. Identificado corte em obra rodoviária. Fusão em andamento.',
          anexo_url: '',
          data_hora: new Date(Date.now() - 1800000).toISOString()
        }
      ]
    };
  }

  const db = window._meoMockDb;

  switch (action) {
    case 'solicitar_login': {
      const email = payload.email?.toLowerCase().trim();
      const senha = payload.senha;
      if (!email || !senha) throw new Error('Email e senha são obrigatórios.');

      const usuario = db.clientes.find(c => c.email === email);
      if (!usuario) throw new Error('Credenciais inválidas.');

      const otp = '123456';
      window._mockOtpValido = { email, otp, expira: Date.now() + 10 * 60 * 1000 };
      mostrarToast(`[Simulação] Código OTP gerado: ${otp}`, 'info');

      return {
        sucesso: true,
        mensagem: `Código OTP enviado para ${email}. (Código de teste: 123456)`,
        expira_em_min: 10
      };
    }

    case 'validar_otp': {
      const email = payload.email?.toLowerCase().trim();
      const otp = payload.otp?.trim();
      if (!otp || otp !== '123456') throw new Error('Código OTP incorreto. Use: 123456');

      const usuario = db.clientes.find(c => c.email === email) || db.clientes[0];
      const token = 'meo-token-sim-' + Date.now();

      return {
        sucesso: true,
        token: token,
        expira_em_min: 15,
        cliente: {
          id: usuario.id,
          nome: usuario.nome,
          email: usuario.email,
          senha_temporaria: false,
          is_master: usuario.is_master
        }
      };
    }

    case 'recuperar_senha':
      return { sucesso: true, mensagem: 'Se o e-mail estiver cadastrado, a nova senha temporária foi enviada.' };

    case 'trocar_senha_temporaria':
      return { sucesso: true, mensagem: 'Senha atualizada com sucesso!' };

    case 'validar_sessao':
      return { sucesso: true, valida: true, email: localStorage.getItem('email'), is_master: localStorage.getItem('is_master') === 'true', expira_em_min: 15 };

    case 'listar_meus_circuitos':
      return { sucesso: true, circuitos: db.circuitos };

    case 'listar_meus_tickets':
      return { sucesso: true, tickets: db.tickets };

    case 'listar_todos_tickets': {
      let lista = [...db.tickets];
      if (payload.status) lista = lista.filter(t => t.status === payload.status);
      if (payload.tipo_incidente) lista = lista.filter(t => t.tipo_incidente === payload.tipo_incidente);
      return { sucesso: true, total: lista.length, tickets: lista };
    }

    case 'abrir_ticket': {
      const circ = db.circuitos.find(c => c.id_circuito === payload.id_circuito) || db.circuitos[0];
      const idTicket = `TK-20261007-000${db.tickets.length + 1}`;
      const novoTicket = {
        id_ticket: idTicket,
        id_cliente: localStorage.getItem('id_cliente') || 'CLI-001',
        nome_empresa: localStorage.getItem('nome') || 'Altice Corporate Solutions',
        id_circuito: circ.id_circuito,
        nome_circuito: circ.nome_circuito,
        tipo_link: circ.tipo_link,
        identificador_tecnico: circ.identificador_tecnico,
        tipo_incidente: payload.tipo_incidente,
        descricao_inicial: payload.descricao,
        status: 'ABERTO',
        data_abertura: agora.toISOString(),
        data_ultima_atualizacao: agora.toISOString(),
        data_pendencia_expira: null,
        data_fechamento: null,
        pasta_drive_anexos: `https://drive.google.com/drive/folders/PortalTickets-${idTicket}`,
        total_comentarios: 1
      };
      db.tickets.unshift(novoTicket);
      db.comentarios.push({
        id_comentario: 'c-' + Date.now(),
        id_ticket: idTicket,
        autor_tipo: 'CLIENTE',
        autor_nome: novoTicket.nome_empresa,
        mensagem: 'Abertura do incidente: ' + payload.descricao,
        anexo_url: '',
        data_hora: agora.toISOString()
      });
      return { sucesso: true, id_ticket: idTicket, pasta_drive: novoTicket.pasta_drive_anexos, mensagem: 'Ticket aberto com sucesso!' };
    }

    case 'ver_ticket':
    case 'ver_ticket_master': {
      const ticket = db.tickets.find(t => t.id_ticket === payload.id_ticket) || db.tickets[0];
      const comentarios = db.comentarios.filter(c => c.id_ticket === ticket.id_ticket);
      return { sucesso: true, ticket, comentarios };
    }

    case 'comentar_ticket':
    case 'comentar_master': {
      const ticket = db.tickets.find(t => t.id_ticket === payload.id_ticket);
      if (!ticket) throw new Error('Ticket não encontrado.');
      const autorTipo = action === 'comentar_master' ? 'NOC' : 'CLIENTE';
      const autorNome = action === 'comentar_master' ? 'INOC Operações' : (localStorage.getItem('nome') || 'Cliente');
      const novoComentario = {
        id_comentario: 'c-' + Date.now(),
        id_ticket: payload.id_ticket,
        autor_tipo: autorTipo,
        autor_nome: autorNome,
        mensagem: payload.mensagem,
        anexo_url: '',
        data_hora: agora.toISOString()
      };
      db.comentarios.push(novoComentario);
      ticket.data_ultima_atualizacao = agora.toISOString();
      return { sucesso: true, id_comentario: novoComentario.id_comentario, mensagem: 'Comentário adicionado.' };
    }

    case 'alterar_status': {
      const ticket = db.tickets.find(t => t.id_ticket === payload.id_ticket);
      if (!ticket) throw new Error('Ticket não encontrado.');
      ticket.status = payload.novo_status;
      ticket.data_ultima_atualizacao = agora.toISOString();
      if (payload.novo_status === 'PENDENTE') {
        ticket.data_pendencia_expira = payload.data_pendencia_expira;
      }
      if (payload.novo_status === 'RESOLVIDO') {
        ticket.data_fechamento = agora.toISOString();
      }
      db.comentarios.push({
        id_comentario: 'c-' + Date.now(),
        id_ticket: payload.id_ticket,
        autor_tipo: 'NOC',
        autor_nome: 'INOC Operações',
        mensagem: `Status atualizado para [${payload.novo_status}] pelo operador NOC.`,
        anexo_url: '',
        data_hora: agora.toISOString()
      });
      return { sucesso: true, mensagem: `Status atualizado para ${payload.novo_status}.` };
    }

    case 'reabrir_ticket': {
      const ticket = db.tickets.find(t => t.id_ticket === payload.id_ticket);
      if (!ticket) throw new Error('Ticket não encontrado.');
      ticket.status = 'EM_RESOLUCAO';
      ticket.data_ultima_atualizacao = agora.toISOString();
      ticket.data_fechamento = null;
      db.comentarios.push({
        id_comentario: 'c-' + Date.now(),
        id_ticket: payload.id_ticket,
        autor_tipo: 'NOC',
        autor_nome: 'INOC Operações',
        mensagem: 'Ticket reaberto para [EM_RESOLUCAO] no mesmo dia do fechamento.',
        anexo_url: '',
        data_hora: agora.toISOString()
      });
      return { sucesso: true, mensagem: 'Ticket reaberto com sucesso.' };
    }

    case 'importar_base_csv':
      return { sucesso: true, tipo: payload.tipo, inseridos: 2, atualizados: 1, erros: [] };

    case 'baixar_anexo': {
      return {
        sucesso: true,
        nome: 'anexo_simulado.txt',
        tipo_mime: 'text/plain',
        base64: btoa('Demonstracao de conteudo de arquivo anexado - Telecom MEO')
      };
    }

    default:
      throw new Error(`Ação [${action}] não reconhecida.`);
  }
}
