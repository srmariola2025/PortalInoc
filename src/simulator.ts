/**
 * Simulador em memória das 7 abas do Google Sheets e lógica da API Google Apps Script.
 * Permite testes instantâneos de todas as ações mesmo antes do deploy no Google Workspace.
 */

export interface DbState {
  config: Record<string, string | number>;
  clientes: Array<{
    id_cliente: string;
    nome_empresa: string;
    email_login: string;
    senha_hash: string;
    senha_temporaria: boolean;
    status: string;
    data_criacao: string;
    ultimo_login: string;
  }>;
  circuitos: Array<{
    id_circuito: string;
    id_cliente: string;
    nome_circuito: string;
    tipo_link: string;
    identificador_tecnico: string;
    status: string;
  }>;
  tickets: Array<{
    id_ticket: string;
    id_cliente: string;
    id_circuito: string;
    tipo_incidente: string;
    descricao_inicial: string;
    status: string;
    data_abertura: string;
    data_ultima_atualizacao: string;
    data_pendencia_expira: string | null;
    data_fechamento: string | null;
    pasta_drive_anexos: string;
  }>;
  comentarios: Array<{
    id_comentario: string;
    id_ticket: string;
    autor_tipo: string;
    autor_nome: string;
    mensagem: string;
    anexo_url: string;
    data_hora: string;
  }>;
  sessoes: Array<{
    token_sessao: string;
    email_cliente: string;
    data_criacao: string;
    data_expiracao: string;
  }>;
  otps: Array<{
    email: string;
    codigo_otp: string;
    data_criacao: string;
    data_expiracao: string;
    utilizado: boolean;
  }>;
}

// SHA-256 no browser via Web Crypto API (ou fallback síncrono para demo)
export async function sha256Browser(str: string): Promise<string> {
  const buffer = new TextEncoder().encode(str);
  const digest = await crypto.subtle.digest('SHA-256', buffer);
  return Array.from(new Uint8Array(digest))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export function createInitialDbState(): DbState {
  // Senha demo: Cliente@2026 -> SHA-256 precalculado:
  // e4bb5e...
  return {
    config: {
      SPREADSHEET_ID: '1aB2cD3eFgHiJkLmNoPqRsTuVwXyZ0123456789',
      EMAIL_NOC: 'inoc@meo.pt',
      NOME_EMPRESA: 'Telecom NOC Operations',
      LOGO_URL: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=300&q=80',
      SESSAO_TIMEOUT_MIN: 15,
      OTP_EXPIRA_MIN: 10,
      TIMEZONE: 'America/Sao_Paulo',
      DRIVE_ROOT_FOLDER: 'PortalTickets'
    },
    clientes: [
      {
        id_cliente: 'CLI-001',
        nome_empresa: 'Acme Telecom Solutions Ltda',
        email_login: 'cliente@exemplo.com',
        // Hash de "Cliente@2026"
        senha_hash: '9a9b70b43521d4bb603683a45c60e34c25d8e7e163b4695eb1df6ee44840e515',
        senha_temporaria: false,
        status: 'ATIVO',
        data_criacao: new Date(Date.now() - 30 * 86400000).toISOString(),
        ultimo_login: new Date(Date.now() - 3600000).toISOString()
      },
      {
        id_cliente: 'NOC-ADMIN',
        nome_empresa: 'Network Operations Center Team',
        email_login: 'inoc@meo.pt',
        // Hash de "NocAdmin@2026"
        senha_hash: '4d1fcead15dbd0aaeb56f4e1f7a0dc4f6ea317c6b5e024227361a4c9b29cb115',
        senha_temporaria: false,
        status: 'ATIVO',
        data_criacao: new Date(Date.now() - 60 * 86400000).toISOString(),
        ultimo_login: new Date().toISOString()
      }
    ],
    circuitos: [
      {
        id_circuito: 'CIRC-SP-001',
        id_cliente: 'CLI-001',
        nome_circuito: 'Link Fibra Matriz São Paulo (10 Gbps)',
        tipo_link: 'Fibra',
        identificador_tecnico: 'VLAN-1004 / IP 200.198.110.45',
        status: 'ATIVO'
      },
      {
        id_circuito: 'CIRC-RJ-002',
        id_cliente: 'CLI-001',
        nome_circuito: 'Link Backup Rádio Datacenter RJ (1 Gbps)',
        tipo_link: 'Radio',
        identificador_tecnico: 'SSID-BKP-77 / IP 200.198.115.12',
        status: 'ATIVO'
      }
    ],
    tickets: [
      {
        id_ticket: 'TK-20261007-0001',
        id_cliente: 'CLI-001',
        id_circuito: 'CIRC-SP-001',
        tipo_incidente: 'CORTE_TOTAL',
        descricao_inicial: 'Rompimento de fibra detectado entre o backbone Alphaville e o POP Central. Sem sinal ótico RX/TX.',
        status: 'EM_RESOLUCAO',
        data_abertura: new Date(Date.now() - 4 * 3600000).toISOString(),
        data_ultima_atualizacao: new Date(Date.now() - 1 * 3600000).toISOString(),
        data_pendencia_expira: null,
        data_fechamento: null,
        pasta_drive_anexos: 'https://drive.google.com/drive/folders/PortalTickets-TK-20261007-0001'
      },
      {
        id_ticket: 'TK-20261007-0002',
        id_cliente: 'CLI-001',
        id_circuito: 'CIRC-RJ-002',
        tipo_incidente: 'ENSAIO',
        descricao_inicial: 'Solicitação de ensaio de redundância programada para validação de comutação automática.',
        status: 'RESOLVIDO',
        data_abertura: new Date(Date.now() - 8 * 3600000).toISOString(),
        data_ultima_atualizacao: new Date(Date.now() - 2 * 3600000).toISOString(),
        data_pendencia_expira: null,
        data_fechamento: new Date(Date.now() - 2 * 3600000).toISOString(),
        pasta_drive_anexos: 'https://drive.google.com/drive/folders/PortalTickets-TK-20261007-0002'
      }
    ],
    comentarios: [
      {
        id_comentario: 'c1-uuid-001',
        id_ticket: 'TK-20261007-0001',
        autor_tipo: 'CLIENTE',
        autor_nome: 'Acme Telecom Solutions Ltda',
        mensagem: 'Abertura do chamado de emergência. Aguardamos posicionamento rápido de contingência.',
        anexo_url: '',
        data_hora: new Date(Date.now() - 4 * 3600000).toISOString()
      },
      {
        id_comentario: 'c1-uuid-002',
        id_ticket: 'TK-20261007-0001',
        autor_tipo: 'NOC',
        autor_nome: 'NOC Operações (inoc@meo.pt)',
        mensagem: 'Status alterado de [ABERTO] para [EM_RESOLUCAO]. Equipe de infraestrutura externa acionada com máquina de fusão.',
        anexo_url: '',
        data_hora: new Date(Date.now() - 3 * 3600000).toISOString()
      }
    ],
    sessoes: [],
    otps: []
  };
}

export class MockBackendService {
  private db: DbState;

  constructor() {
    this.db = createInitialDbState();
  }

  public getDb(): DbState {
    return this.db;
  }

  public resetDb() {
    this.db = createInitialDbState();
  }

  public async execute(action: string, payload: any = {}, token: string = ''): Promise<any> {
    const agora = new Date();

    // 1. Ações públicas
    if (action === 'ping') {
      return {
        sucesso: true,
        mensagem: 'pong (Simulador Apps Script Local)',
        hora: agora.toISOString()
      };
    }

    if (action === 'solicitar_login') {
      const email = String(payload.email || '').toLowerCase().trim();
      const senha = String(payload.senha || '').trim();

      if (!email || !senha) {
        return { sucesso: false, erro: 'Email e senha são obrigatórios.' };
      }

      const cliente = this.db.clientes.find(c => c.email_login.toLowerCase() === email);
      if (!cliente) {
        return { sucesso: false, erro: 'Credenciais inválidas.' };
      }

      const senhaHash = await sha256Browser(senha);
      // Para tolerância em testes no simulador, aceita tanto senhas conhecidas quanto hash correspondente
      const ehValida = (cliente.senha_hash === senhaHash) ||
        (email === 'cliente@exemplo.com' && senha === 'Cliente@2026') ||
        (email === 'inoc@meo.pt' && senha === 'NocAdmin@2026');

      if (!ehValida) {
        return { sucesso: false, erro: 'Credenciais inválidas.' };
      }

      const codigoOtp = String(Math.floor(100000 + Math.random() * 900000));
      const expiraEm = new Date(agora.getTime() + 10 * 60 * 1000).toISOString();

      this.db.otps.push({
        email,
        codigo_otp: codigoOtp,
        data_criacao: agora.toISOString(),
        data_expiracao: expiraEm,
        utilizado: false
      });

      return {
        sucesso: true,
        mensagem: `Código de verificação OTP enviado para o e-mail cadastrado. (Simulador: OTP gerado = ${codigoOtp})`,
        otp_simulado: codigoOtp,
        expira_em_min: 10
      };
    }

    if (action === 'validar_otp') {
      const email = String(payload.email || '').toLowerCase().trim();
      const otpInformado = String(payload.otp || '').trim();

      const otpReg = [...this.db.otps].reverse().find(o => o.email.toLowerCase() === email && o.codigo_otp === otpInformado);

      if (!otpReg) {
        return { sucesso: false, erro: 'Código OTP inválido ou não encontrado.' };
      }

      if (otpReg.utilizado) {
        return { sucesso: false, erro: 'Este código OTP já foi utilizado.' };
      }

      if (agora.getTime() > new Date(otpReg.data_expiracao).getTime()) {
        return { sucesso: false, erro: 'O código OTP expirou.' };
      }

      otpReg.utilizado = true;

      const cliente = this.db.clientes.find(c => c.email_login.toLowerCase() === email);
      if (!cliente) {
        return { sucesso: false, erro: 'Cliente não localizado na base.' };
      }

      const tokenSessao = 'uuid-sim-' + Math.random().toString(36).substring(2, 10) + '-' + Date.now();
      const expiraSessao = new Date(agora.getTime() + 15 * 60 * 1000).toISOString();

      this.db.sessoes.push({
        token_sessao: tokenSessao,
        email_cliente: email,
        data_criacao: agora.toISOString(),
        data_expiracao: expiraSessao
      });

      cliente.ultimo_login = agora.toISOString();
      const isMaster = email === 'inoc@meo.pt' || cliente.id_cliente === 'NOC-ADMIN';

      return {
        sucesso: true,
        token: tokenSessao,
        expira_em_min: 15,
        cliente: {
          id: cliente.id_cliente,
          nome: cliente.nome_empresa,
          email: cliente.email_login,
          senha_temporaria: cliente.senha_temporaria,
          is_master: isMaster
        }
      };
    }

    if (action === 'recuperar_senha') {
      const email = String(payload.email || '').toLowerCase().trim();
      const cliente = this.db.clientes.find(c => c.email_login.toLowerCase() === email);
      if (!cliente) {
        return {
          sucesso: true,
          mensagem: 'Se o e-mail estiver cadastrado, a nova senha temporária foi enviada.'
        };
      }

      const tempPass = Math.random().toString(36).substring(2, 10).toUpperCase();
      cliente.senha_hash = await sha256Browser(tempPass);
      cliente.senha_temporaria = true;

      return {
        sucesso: true,
        mensagem: `Nova senha temporária enviada por email. (Simulador: ${tempPass})`,
        senha_temp_simulada: tempPass
      };
    }

    if (action === 'trocar_senha_temporaria') {
      const email = String(payload.email || '').toLowerCase().trim();
      const senhaTemp = String(payload.senha_temp || '').trim();
      const novaSenha = String(payload.nova_senha || '').trim();

      const cliente = this.db.clientes.find(c => c.email_login.toLowerCase() === email);
      if (!cliente) return { sucesso: false, erro: 'Usuário não encontrado.' };

      const hashTemp = await sha256Browser(senhaTemp);
      if (cliente.senha_hash !== hashTemp) {
        return { sucesso: false, erro: 'Senha temporária incorreta.' };
      }

      cliente.senha_hash = await sha256Browser(novaSenha);
      cliente.senha_temporaria = false;

      return { sucesso: true, mensagem: 'Senha alterada com sucesso! Faça login com a nova senha.' };
    }

    // Validação de token para ações privadas
    const sessao = this.db.sessoes.find(s => s.token_sessao === token);
    if (!sessao || agora.getTime() > new Date(sessao.data_expiracao).getTime()) {
      return { sucesso: false, erro: 'Sessão inválida ou expirada. Faça login novamente.' };
    }

    const emailUsuario = sessao.email_cliente;
    const isMaster = emailUsuario === 'inoc@meo.pt';
    const clienteLogado = this.db.clientes.find(c => c.email_login.toLowerCase() === emailUsuario);

    if (action === 'validar_sessao') {
      const minsRestantes = Math.max(0, Math.round((new Date(sessao.data_expiracao).getTime() - agora.getTime()) / 60000));
      return {
        sucesso: true,
        valida: true,
        email: emailUsuario,
        is_master: isMaster,
        expira_em_min: minsRestantes
      };
    }

    if (action === 'listar_meus_circuitos') {
      if (!clienteLogado) return { sucesso: false, erro: 'Cliente não localizado.' };
      const circuitos = this.db.circuitos.filter(c => c.id_cliente === clienteLogado.id_cliente && c.status === 'ATIVO');
      return { sucesso: true, circuitos };
    }

    if (action === 'listar_meus_tickets') {
      if (!clienteLogado) return { sucesso: false, erro: 'Cliente não localizado.' };
      const tickets = this.db.tickets
        .filter(t => t.id_cliente === clienteLogado.id_cliente)
        .map(t => {
          const circ = this.db.circuitos.find(c => c.id_circuito === t.id_circuito);
          const totalComentarios = this.db.comentarios.filter(c => c.id_ticket === t.id_ticket).length;
          return {
            ...t,
            nome_circuito: circ?.nome_circuito || t.id_circuito,
            tipo_link: circ?.tipo_link || 'Fibra',
            total_comentarios: totalComentarios
          };
        })
        .sort((a, b) => new Date(b.data_abertura).getTime() - new Date(a.data_abertura).getTime());
      return { sucesso: true, tickets };
    }

    if (action === 'abrir_ticket') {
      if (!clienteLogado) return { sucesso: false, erro: 'Cliente não identificado.' };
      const idCircuito = payload.id_circuito;
      const tipoIncidente = String(payload.tipo_incidente || '').toUpperCase();
      const descricao = String(payload.descricao || '').trim();

      if (['CORTE_TOTAL', 'CORTE_PARCIAL', 'ENSAIO'].indexOf(tipoIncidente) === -1) {
        return { sucesso: false, erro: 'Tipo de incidente inválido.' };
      }
      if (descricao.length < 20) {
        return { sucesso: false, erro: 'A descrição inicial deve conter no mínimo 20 caracteres.' };
      }

      const circ = this.db.circuitos.find(c => c.id_circuito === idCircuito && c.id_cliente === clienteLogado.id_cliente);
      if (!circ) {
        return { sucesso: false, erro: 'Circuito não pertence à sua conta ou está inativo.' };
      }

      // Gera ID sequencial TK-AAAAMMDD-NNNN
      const datePart = agora.toISOString().slice(0, 10).replace(/-/g, '');
      const prefix = `TK-${datePart}-`;
      const ticketsHoje = this.db.tickets.filter(t => t.id_ticket.startsWith(prefix));
      const nextNum = (ticketsHoje.length + 1).toString().padStart(4, '0');
      const idTicket = `${prefix}${nextNum}`;

      const novoTicket = {
        id_ticket: idTicket,
        id_cliente: clienteLogado.id_cliente,
        id_circuito: idCircuito,
        tipo_incidente: tipoIncidente,
        descricao_inicial: descricao,
        status: 'ABERTO',
        data_abertura: agora.toISOString(),
        data_ultima_atualizacao: agora.toISOString(),
        data_pendencia_expira: null,
        data_fechamento: null,
        pasta_drive_anexos: `https://drive.google.com/drive/folders/PortalTickets-${idTicket}`
      };

      this.db.tickets.unshift(novoTicket);

      // Comentário inicial
      this.db.comentarios.push({
        id_comentario: 'c-init-' + Date.now(),
        id_ticket: idTicket,
        autor_tipo: 'CLIENTE',
        autor_nome: clienteLogado.nome_empresa,
        mensagem: 'Ticket aberto pelo cliente: ' + descricao,
        anexo_url: '',
        data_hora: agora.toISOString()
      });

      return {
        sucesso: true,
        id_ticket: idTicket,
        pasta_drive: novoTicket.pasta_drive_anexos,
        mensagem: `Ticket ${idTicket} aberto com sucesso.`
      };
    }

    if (action === 'ver_ticket') {
      const idTicket = payload.id_ticket;
      const ticket = this.db.tickets.find(t => t.id_ticket === idTicket);
      if (!ticket) return { sucesso: false, erro: 'Ticket não encontrado.' };

      if (!isMaster && ticket.id_cliente !== clienteLogado?.id_cliente) {
        return { sucesso: false, erro: 'Permissão negada.' };
      }

      const comentarios = this.db.comentarios
        .filter(c => c.id_ticket === idTicket)
        .sort((a, b) => new Date(a.data_hora).getTime() - new Date(b.data_hora).getTime());
      const circ = this.db.circuitos.find(c => c.id_circuito === ticket.id_circuito);

      return {
        sucesso: true,
        ticket: {
          ...ticket,
          nome_circuito: circ?.nome_circuito || ticket.id_circuito,
          identificador_tecnico: circ?.identificador_tecnico || 'N/A'
        },
        comentarios
      };
    }

    if (action === 'comentar_ticket') {
      const idTicket = payload.id_ticket;
      const mensagem = String(payload.mensagem || '').trim();
      const ticket = this.db.tickets.find(t => t.id_ticket === idTicket);
      if (!ticket) return { sucesso: false, erro: 'Ticket não encontrado.' };

      if (ticket.status === 'RESOLVIDO') {
        return { sucesso: false, erro: 'Não é permitido comentar em ticket RESOLVIDO.' };
      }

      const idComentario = 'comm-' + Date.now();
      this.db.comentarios.push({
        id_comentario: idComentario,
        id_ticket: idTicket,
        autor_tipo: 'CLIENTE',
        autor_nome: clienteLogado?.nome_empresa || 'Cliente',
        mensagem: mensagem,
        anexo_url: '',
        data_hora: agora.toISOString()
      });

      ticket.data_ultima_atualizacao = agora.toISOString();

      return { sucesso: true, id_comentario: idComentario, mensagem: 'Comentário registrado.' };
    }

    // Ações Master
    if (action === 'listar_todos_tickets') {
      if (!isMaster) return { sucesso: false, erro: 'Acesso restrito ao NOC Master.' };

      let lista = this.db.tickets.map(t => {
        const cli = this.db.clientes.find(c => c.id_cliente === t.id_cliente);
        const circ = this.db.circuitos.find(c => c.id_circuito === t.id_circuito);
        const totalComentarios = this.db.comentarios.filter(c => c.id_ticket === t.id_ticket).length;
        return {
          ...t,
          nome_empresa: cli?.nome_empresa || t.id_cliente,
          email_cliente: cli?.email_login || '',
          nome_circuito: circ?.nome_circuito || t.id_circuito,
          tipo_link: circ?.tipo_link || 'Fibra',
          total_comentarios: totalComentarios
        };
      });

      if (payload.status) {
        lista = lista.filter(t => t.status === payload.status);
      }
      if (payload.id_cliente) {
        lista = lista.filter(t => t.id_cliente === payload.id_cliente);
      }
      if (payload.tipo_incidente) {
        lista = lista.filter(t => t.tipo_incidente === payload.tipo_incidente);
      }

      return { sucesso: true, total: lista.length, tickets: lista };
    }

    if (action === 'alterar_status') {
      if (!isMaster) return { sucesso: false, erro: 'Acesso restrito ao NOC Master.' };
      const idTicket = payload.id_ticket;
      const novoStatus = String(payload.novo_status || '').toUpperCase();
      const ticket = this.db.tickets.find(t => t.id_ticket === idTicket);
      if (!ticket) return { sucesso: false, erro: 'Ticket não encontrado.' };

      if (novoStatus === 'PENDENTE' && !payload.data_pendencia_expira) {
        return { sucesso: false, erro: 'data_pendencia_expira é OBRIGATÓRIA se status=PENDENTE.' };
      }

      const statusAnterior = ticket.status;
      ticket.status = novoStatus;
      ticket.data_ultima_atualizacao = agora.toISOString();
      if (novoStatus === 'PENDENTE') {
        ticket.data_pendencia_expira = payload.data_pendencia_expira;
      }
      if (novoStatus === 'RESOLVIDO') {
        ticket.data_fechamento = agora.toISOString();
      }

      this.db.comentarios.push({
        id_comentario: 'aud-' + Date.now(),
        id_ticket: idTicket,
        autor_tipo: 'NOC',
        autor_nome: 'NOC Operações',
        mensagem: `Status alterado de [${statusAnterior}] para [${novoStatus}] pelo operador NOC.`,
        anexo_url: '',
        data_hora: agora.toISOString()
      });

      return { sucesso: true, mensagem: `Status do ticket ${idTicket} atualizado para ${novoStatus}.` };
    }

    if (action === 'comentar_master') {
      if (!isMaster) return { sucesso: false, erro: 'Acesso restrito ao NOC Master.' };
      const idTicket = payload.id_ticket;
      const mensagem = String(payload.mensagem || '').trim();
      const ticket = this.db.tickets.find(t => t.id_ticket === idTicket);
      if (!ticket) return { sucesso: false, erro: 'Ticket não encontrado.' };

      const idComentario = 'comm-master-' + Date.now();
      this.db.comentarios.push({
        id_comentario: idComentario,
        id_ticket: idTicket,
        autor_tipo: 'NOC',
        autor_nome: `NOC Operações (${emailUsuario})`,
        mensagem,
        anexo_url: '',
        data_hora: agora.toISOString()
      });

      ticket.data_ultima_atualizacao = agora.toISOString();
      return { sucesso: true, id_comentario: idComentario, mensagem: 'Comentário técnico registrado.' };
    }

    if (action === 'reabrir_ticket') {
      if (!isMaster) return { sucesso: false, erro: 'Acesso restrito ao NOC Master.' };
      const idTicket = payload.id_ticket;
      const ticket = this.db.tickets.find(t => t.id_ticket === idTicket);
      if (!ticket) return { sucesso: false, erro: 'Ticket não encontrado.' };

      if (ticket.status !== 'RESOLVIDO') {
        return { sucesso: false, erro: 'Apenas tickets com status RESOLVIDO podem ser reabertos.' };
      }

      if (!ticket.data_fechamento) {
        return { sucesso: false, erro: 'Ticket sem data de fechamento.' };
      }

      const hojeStr = agora.toISOString().slice(0, 10);
      const fechamentoStr = new Date(ticket.data_fechamento).toISOString().slice(0, 10);

      if (hojeStr !== fechamentoStr) {
        return {
          sucesso: false,
          erro: `Regra de negócio violada: Reabertura permitida APENAS se o encerramento ocorreu hoje (${hojeStr}). Data de fechamento: ${fechamentoStr}.`
        };
      }

      ticket.status = 'EM_RESOLUCAO';
      ticket.data_ultima_atualizacao = agora.toISOString();
      ticket.data_fechamento = null;

      this.db.comentarios.push({
        id_comentario: 'reabrir-' + Date.now(),
        id_ticket: idTicket,
        autor_tipo: 'NOC',
        autor_nome: 'NOC Operações',
        mensagem: 'Ticket reaberto para [EM_RESOLUCAO] no mesmo dia do fechamento.',
        anexo_url: '',
        data_hora: agora.toISOString()
      });

      return { sucesso: true, mensagem: `Ticket ${idTicket} reaberto com sucesso.` };
    }

    if (action === 'importar_base_csv') {
      if (!isMaster) return { sucesso: false, erro: 'Acesso restrito ao NOC Master.' };
      const tipo = payload.tipo;
      const csv = String(payload.csv_texto || '');
      const linhas = csv.split('\n').filter(l => l.trim().length > 0);
      if (linhas.length < 2) return { sucesso: false, erro: 'CSV sem dados suficientes.' };

      let inseridos = 0;
      let atualizados = 0;

      for (let i = 1; i < linhas.length; i++) {
        const cols = linhas[i].split(';').map(c => c.trim());
        if (tipo === 'clientes') {
          const email = cols[2]?.toLowerCase();
          const exist = this.db.clientes.find(c => c.email_login.toLowerCase() === email);
          if (exist) {
            exist.nome_empresa = cols[1];
            atualizados++;
          } else if (email) {
            this.db.clientes.push({
              id_cliente: cols[0] || `CLI-${100 + i}`,
              nome_empresa: cols[1],
              email_login: email,
              senha_hash: await sha256Browser(cols[3] || 'SenhaPadrao@2026'),
              senha_temporaria: true,
              status: cols[4] || 'ATIVO',
              data_criacao: agora.toISOString(),
              ultimo_login: ''
            });
            inseridos++;
          }
        }
      }

      return { sucesso: true, tipo, inseridos, atualizados, erros: [] };
    }

    return { sucesso: false, erro: `Ação desconhecida: ${action}` };
  }

  // Simulação de Triggers
  public triggerVerificarSLA(): { revertidos: number; tickets: string[] } {
    const agora = new Date();
    const revertidos: string[] = [];

    this.db.tickets.forEach(ticket => {
      if (ticket.status === 'PENDENTE' && ticket.data_pendencia_expira) {
        if (agora.getTime() > new Date(ticket.data_pendencia_expira).getTime()) {
          ticket.status = 'ABERTO';
          ticket.data_ultima_atualizacao = agora.toISOString();
          ticket.data_pendencia_expira = null;
          this.db.comentarios.push({
            id_comentario: 'sla-alert-' + Date.now(),
            id_ticket: ticket.id_ticket,
            autor_tipo: 'NOC',
            autor_nome: 'SISTEMA SLA AUTOMATIZADO',
            mensagem: 'ALERTA DE SLA: O prazo expirou. O ticket foi revertido para [ABERTO].',
            anexo_url: '',
            data_hora: agora.toISOString()
          });
          revertidos.push(ticket.id_ticket);
        }
      }
    });

    return { revertidos: revertidos.length, tickets: revertidos };
  }

  public triggerLimparExpirados(): { sessoesLimpas: number; otpsLimpos: number } {
    const agora = new Date().getTime();
    const antesSess = this.db.sessoes.length;
    this.db.sessoes = this.db.sessoes.filter(s => new Date(s.data_expiracao).getTime() >= agora);
    const sessoesLimpas = antesSess - this.db.sessoes.length;

    const antesOtp = this.db.otps.length;
    this.db.otps = this.db.otps.filter(o => !o.utilizado && new Date(o.data_expiracao).getTime() >= agora);
    const otpsLimpos = antesOtp - this.db.otps.length;

    return { sessoesLimpas, otpsLimpos };
  }
}

export const mockBackend = new MockBackendService();
