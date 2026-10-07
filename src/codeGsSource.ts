/**
 * Código fonte completo do Google Apps Script (Code.gs)
 */
export const CODE_GS_RAW = `/**
 * =========================================================================================
 * PORTAL DE GESTÃO DE INCIDENTES TELECOM (B2B & NOC) - BACKEND GOOGLE APPS SCRIPT
 * =========================================================================================
 * Arquitetura: RESTful API (doPost / doGet) publicada como Google Apps Script Web App
 * Banco de Dados: Google Sheets (7 abas relacionais com chaves e integridade)
 * Armazenamento: Google Drive (pastas automáticas por ticket e arquivos em Base64)
 * Notificações: GmailApp com 7 templates HTML responsivos corporativos
 * Segurança: Autenticação em 2 etapas (OTP 6 dígitos), SHA-256 password hash, tokens UUID
 * =========================================================================================
 */

// ========= SEÇÃO 1: CONSTANTES E CONFIGURAÇÕES GLOBAIS =========

/**
 * ID da planilha Google Sheets que atua como Banco de Dados.
 * Se deixado vazio (''), o script tentará SpreadsheetApp.getActiveSpreadsheet().
 * Em Web App autônomo, substitua pelo ID extraído da URL da sua planilha.
 */
var SPREADSHEET_ID = '1cRHEFNH19FcymqEu54FcU09h_LYJO31v4j0m5IfRUHo';

/**
 * Nomes padronizados das 7 abas do sistema
 */
var SHEETS = {
  CONFIG: 'CONFIG',
  CLIENTES: 'CLIENTES',
  CIRCUITOS: 'CIRCUITOS',
  TICKETS: 'TICKETS',
  COMENTARIOS: 'COMENTARIOS',
  SESSOES: 'SESSOES',
  OTPS: 'OTPS'
};

/**
 * Configurações padrão caso não estejam preenchidas na aba CONFIG
 */
var DEFAULT_CONFIG = {
  EMAIL_NOC: 'inoc@meo.pt',
  NOME_EMPRESA: 'Telecom NOC Operations',
  LOGO_URL: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=300&q=80',
  SESSAO_TIMEOUT_MIN: 15,
  OTP_EXPIRA_MIN: 10,
  TIMEZONE: 'America/Sao_Paulo',
  DRIVE_ROOT_FOLDER: 'PortalTickets'
};

// ========= SEÇÃO 2: ROTEADOR PRINCIPAL (doGet, doPost e HtmlService) =========

/**
 * Handler para requisições HTTP GET.
 * Roteia as páginas do portal servidas via HtmlService com proxy seguro do GitHub Pages,
 * ou responde ao ping de monitoramento de saúde.
 */
function doGet(e) {
  try {
    var action = (e && e.parameter && e.parameter.action) ? e.parameter.action : '';
    if (action === 'ping') {
      return criarRespostaJson({
        sucesso: true,
        mensagem: 'Serviço NOC Telecom Web App ativo e operacional',
        hora: Utilities.formatDate(new Date(), DEFAULT_CONFIG.TIMEZONE, "yyyy-MM-dd'T'HH:mm:ssXXX")
      });
    }

    // Identifica a página solicitada via e.pathInfo (ou login.html como padrão)
    var path = (e && e.pathInfo) ? e.pathInfo : '';
    path = path.replace(/^\\/+/, '').trim();
    if (!path) {
      path = 'login.html';
    }

    // Allowlist restrita das páginas autorizadas
    var ALLOWLIST = [
      'login.html',
      'dashboard.html',
      'novo-ticket.html',
      'ticket.html',
      'trocar-senha.html',
      'noc.html',
      'noc-ticket.html',
      'noc-importar.html',
      'index.html'
    ];

    if (ALLOWLIST.indexOf(path) === -1) {
      return HtmlService.createHtmlOutput(
        '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>404 Não Encontrado</title>' +
        '<style>body{font-family:Segoe UI,sans-serif;padding:40px;text-align:center;color:#0F172A;}' +
        'h2{color:#E11D48;}</style></head><body>' +
        '<h2>404 — Página Não Autorizada</h2>' +
        '<p>A página solicitada não pertence à allowlist de rotas autorizadas do portal.</p>' +
        '</body></html>'
      ).setTitle('404 — Página Não Encontrada');
    }

    var baseUrl = 'https://srmariola2025.github.io/PortalInoc/';
    var targetUrl = baseUrl + path;

    var response = UrlFetchApp.fetch(targetUrl, {
      muteHttpExceptions: true,
      followRedirects: true
    });

    var statusCode = response.getResponseCode();
    if (statusCode < 200 || statusCode >= 300) {
      return HtmlService.createHtmlOutput(
        '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Erro ao carregar página</title></head><body>' +
        '<h3>Erro ao carregar página do repositório (' + statusCode + ')</h3>' +
        '<p>Não foi possível obter ' + path + ' a partir de ' + baseUrl + '</p>' +
        '</body></html>'
      ).setTitle('Erro ' + statusCode);
    }

    var html = response.getContentText('UTF-8');

    // 1. Reescrever caminhos de assets /PortalInoc/ para https://srmariola2025.github.io/PortalInoc/
    html = html.replace(/\\/PortalInoc\\//g, baseUrl);

    // 2. Reescrever caminhos relativos de assets (./css/, ./js/, ./assets/) para a URL pública
    html = html.replace(/(href|src)=["'](?:\\.\\/)?(css|js|assets)\\//g, '$1="' + baseUrl + '$2/');
    html = html.replace(/from\\s+["'](?:\\.\\/)?(js\\/[^"']+)["']/g, 'from \\'' + baseUrl + '$1\\'');
    html = html.replace(/['"](?:\\.\\/)?assets\\/([^'"]+)['"]/g, '"' + baseUrl + 'assets/$1"');

    // 3. Inserir <base href="<ScriptApp.getService().getUrl()>/" target="_top"> no head
    var serviceUrl = '';
    try {
      serviceUrl = ScriptApp.getService().getUrl();
    } catch (_) {}

    if (serviceUrl) {
      if (serviceUrl.charAt(serviceUrl.length - 1) !== '/') {
        serviceUrl += '/';
      }
      var baseTag = '<base href="' + serviceUrl + '" target="_top">';
      if (/<head[^>]*>/i.test(html)) {
        html = html.replace(/(<head[^>]*>)/i, '$1\\n  ' + baseTag);
      } else {
        html = baseTag + '\\n' + html;
      }
    }

    return HtmlService.createHtmlOutput(html)
      .setTitle('Portal INOC — MEO International');

  } catch (err) {
    console.error('Erro em doGet:', (err && (err.stack || err.message)) || String(err));
    return HtmlService.createHtmlOutput(
      '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Erro</title></head><body>' +
      '<h3>Erro interno. Não foi possível carregar o portal. Tente novamente mais tarde.</h3>' +
      '</body></html>'
    ).setTitle('Erro');
  }
}

/**
 * Handler para requisições HTTP POST.
 * DESABILITADO: O portal é servido via HtmlService com chamadas google.script.run.
 */
function doPost(e) {
  return criarRespostaJson({
    sucesso: false,
    erro: 'Acesso POST HTTP público desabilitado. O portal é servido via HtmlService (google.script.run).'
  });
}

/**
 * Função global chamada a partir do cliente Web App via google.script.run.
 * Despacha para a rotina privada interna processarApiInterno_ e converte a resposta
 * TextOutput em um objeto JSON puro.
 */
function apiCallFromHtmlService(action, payload, token) {
  try {
    var fakeEvent = {
      postData: {
        contents: JSON.stringify({
          action: action,
          payload: payload || {},
          token: token || null
        })
      }
    };
    var textOutput = processarApiInterno_(fakeEvent);
    if (textOutput && typeof textOutput.getContent === 'function') {
      return JSON.parse(textOutput.getContent());
    } else if (typeof textOutput === 'string') {
      return JSON.parse(textOutput);
    } else if (textOutput && typeof textOutput === 'object') {
      return textOutput;
    }
    return { sucesso: false, erro: 'Resposta inválida do processador interno.' };
  } catch (err) {
    console.error('Erro em apiCallFromHtmlService: ' + err.toString());
    return {
      sucesso: false,
      erro: err.message || err.toString()
    };
  }
}

/**
 * Processador REST privado interno do portal.
 * Centraliza validação de sessão, permissões e despacho de ações.
 */
function processarApiInterno_(e) {
  try {
    var corpoRequisicao = {};
    if (e && e.postData && e.postData.contents) {
      try {
        corpoRequisicao = JSON.parse(e.postData.contents);
      } catch (parseErr) {
        return criarRespostaJson({
          sucesso: false,
          erro: 'Payload JSON inválido: ' + parseErr.message
        });
      }
    } else if (e && e.parameter) {
      corpoRequisicao = e.parameter;
      if (typeof corpoRequisicao.payload === 'string') {
        try {
          corpoRequisicao.payload = JSON.parse(corpoRequisicao.payload);
        } catch (_) {}
      }
    }

    var action = sanitizarString(corpoRequisicao.action);
    var payload = corpoRequisicao.payload || {};
    var token = sanitizarString(corpoRequisicao.token);

    if (!action) {
      return criarRespostaJson({
        sucesso: false,
        erro: 'Parâmetro action é obrigatório.'
      });
    }

    console.log('Recebida ação interna: ' + action);

    // ==========================================
    // 1. AÇÕES PÚBLICAS (Não exigem token de sessão)
    // ==========================================
    if (action === 'ping') {
      return criarRespostaJson({
        sucesso: true,
        mensagem: 'pong',
        hora: Utilities.formatDate(new Date(), DEFAULT_CONFIG.TIMEZONE, "yyyy-MM-dd'T'HH:mm:ssXXX")
      });
    }

    if (action === 'solicitar_login') {
      return executarSolicitarLogin(payload);
    }

    if (action === 'validar_otp') {
      return executarValidarOtp(payload);
    }

    if (action === 'recuperar_senha') {
      return executarRecuperarSenha(payload);
    }

    if (action === 'trocar_senha_temporaria') {
      return executarTrocarSenhaTemporaria(payload);
    }

    // ==========================================
    // 2. AÇÕES PRIVADAS (Exigem token válido)
    // ==========================================
    var sessao = validarTokenSessao(token);
    if (!sessao.valida) {
      return criarRespostaJson({
        sucesso: false,
        erro: sessao.motivo || 'Sessão inválida ou expirada. Faça login novamente.'
      });
    }

    var emailUsuario = sessao.email;
    var isMaster = sessao.is_master;

    if (action === 'validar_sessao') {
      return criarRespostaJson({
        sucesso: true,
        valida: true,
        email: emailUsuario,
        is_master: isMaster,
        expira_em_min: sessao.minutos_restantes
      });
    }

    if (action === 'listar_meus_circuitos') {
      return executarListarMeusCircuitos(emailUsuario);
    }

    if (action === 'listar_meus_tickets') {
      return executarListarMeusTickets(emailUsuario);
    }

    if (action === 'abrir_ticket') {
      return executarAbrirTicket(emailUsuario, payload);
    }

    if (action === 'ver_ticket') {
      return executarVerTicket(emailUsuario, isMaster, payload);
    }

    if (action === 'comentar_ticket') {
      return executarComentarTicket(emailUsuario, payload);
    }

    if (action === 'baixar_anexo') {
      return executarBaixarAnexo(emailUsuario, isMaster, payload);
    }

    // ==========================================
    // 3. AÇÕES NOC MASTER (Exigem is_master = true)
    // ==========================================
    if (action === 'listar_todos_tickets') {
      garantirAcessoMaster(isMaster);
      return executarListarTodosTickets(payload);
    }

    if (action === 'ver_ticket_master') {
      garantirAcessoMaster(isMaster);
      return executarVerTicketMaster(payload);
    }

    if (action === 'alterar_status') {
      garantirAcessoMaster(isMaster);
      return executarAlterarStatus(emailUsuario, payload);
    }

    if (action === 'comentar_master') {
      garantirAcessoMaster(isMaster);
      return executarComentarMaster(emailUsuario, payload);
    }

    if (action === 'reabrir_ticket') {
      garantirAcessoMaster(isMaster);
      return executarReabrirTicket(emailUsuario, payload);
    }

    if (action === 'importar_base_csv') {
      garantirAcessoMaster(isMaster);
      return executarImportarBaseCsv(payload);
    }

    return criarRespostaJson({
      sucesso: false,
      erro: 'Ação desconhecida: ' + action
    });

  } catch (erroGeral) {
    console.error('Falha crítica na execução de processarApiInterno_: ' + erroGeral.stack || erroGeral.message);
    return criarRespostaJson({
      sucesso: false,
      erro: erroGeral.message || erroGeral.toString()
    });
  }
}

// ========= SEÇÃO 3: CONTROLADORES DE AÇÕES PÚBLICAS =========

/**
 * Validador e limitador de taxa de requisições por e-mail utilizando CacheService.
 * @param {string} prefixo - Chave de identificação da ação (ex: 'rl_login_')
 * @param {string} email - E-mail alvo
 * @param {number} maxTentativas - Limite máximo de tentativas na janela
 * @param {number} janelaSegundos - Tempo de validade do bloqueio em segundos
 * @returns {{ permitido: boolean, motivo?: string }}
 */
function verificarRateLimitCache_(prefixo, email, maxTentativas, janelaSegundos) {
  try {
    var cache = CacheService.getScriptCache();
    if (!cache) return { permitido: true };
    var chaveEmail = prefixo + sanitizarString(email).toLowerCase();
    var chaveBloqueio = 'lock_' + chaveEmail;

    if (cache.get(chaveBloqueio)) {
      return {
        permitido: false,
        motivo: 'Muitas tentativas para este e-mail. Por segurança, aguarde alguns minutos antes de tentar novamente.'
      };
    }

    var tentativasStr = cache.get(chaveEmail);
    var tentativas = tentativasStr ? parseInt(tentativasStr, 10) : 0;
    tentativas++;

    if (tentativas > maxTentativas) {
      cache.put(chaveBloqueio, '1', janelaSegundos);
      cache.remove(chaveEmail);
      return {
        permitido: false,
        motivo: 'Limite de tentativas excedido para este e-mail. Aguarde alguns minutos.'
      };
    }

    cache.put(chaveEmail, tentativas.toString(), janelaSegundos);
    return { permitido: true };
  } catch (err) {
    console.warn('Falha transitória em verificarRateLimitCache_: ' + err.toString());
    return { permitido: true };
  }
}

/**
 * Limpa o contador de tentativas no CacheService para uma ação bem-sucedida.
 */
function limparRateLimitCache_(prefixo, email) {
  try {
    var cache = CacheService.getScriptCache();
    if (cache) {
      var chaveEmail = prefixo + sanitizarString(email).toLowerCase();
      cache.remove(chaveEmail);
      cache.remove('lock_' + chaveEmail);
    }
  } catch (_) {}
}

/**
 * Etapa 1 do Login: Valida email e senha com SHA-256, gera OTP e envia por e-mail.
 */
function executarSolicitarLogin(payload) {
  var email = sanitizarString(payload.email).toLowerCase();
  var senha = sanitizarString(payload.senha);

  if (!email || !senha) {
    return criarRespostaJson({ sucesso: false, erro: 'Email e senha são obrigatórios.' });
  }

  // Rate limiting no login por e-mail (máx 5 tentativas por 15 min)
  var limite = verificarRateLimitCache_('rl_login_', email, 5, 900);
  if (!limite.permitido) {
    return criarRespostaJson({ sucesso: false, erro: limite.motivo });
  }

  var cliente = obterClientePorEmail(email);
  if (!cliente) {
    return criarRespostaJson({ sucesso: false, erro: 'Credenciais inválidas.' });
  }

  if (cliente.status !== 'ATIVO') {
    return criarRespostaJson({ sucesso: false, erro: 'Acesso bloqueado ou inativo. Contate o NOC.' });
  }

  var hashInformado = hashSenha(senha);
  if (cliente.senha_hash !== hashInformado) {
    return criarRespostaJson({ sucesso: false, erro: 'Credenciais inválidas.' });
  }

  // Credenciais válidas: limpa tentativas de login
  limparRateLimitCache_('rl_login_', email);

  var config = obterConfiguracoes();
  var codigoOtp = gerarCodigoOtpNumerico();
  var agora = new Date();
  var expiraEm = new Date(agora.getTime() + (config.OTP_EXPIRA_MIN * 60 * 1000));

  var sheetOtps = getSheet(SHEETS.OTPS);
  sheetOtps.appendRow([
    email,
    codigoOtp,
    agora,
    expiraEm,
    false // utilizado
  ]);

  // Envia OTP por e-mail profissional
  enviarEmailOtp(email, cliente.nome_empresa, codigoOtp, config.OTP_EXPIRA_MIN);

  console.log('OTP gerado com sucesso para: ' + email);
  return criarRespostaJson({
    sucesso: true,
    mensagem: 'Código de verificação OTP enviado com sucesso para o seu e-mail cadastrado.',
    expira_em_min: config.OTP_EXPIRA_MIN
  });
}

/**
 * Etapa 2 do Login: Valida código OTP de 6 dígitos e emite token UUID de sessão.
 */
function executarValidarOtp(payload) {
  var email = sanitizarString(payload.email).toLowerCase();
  var otpInformado = sanitizarString(payload.otp);

  if (!email || !otpInformado) {
    return criarRespostaJson({ sucesso: false, erro: 'Email e código OTP são obrigatórios.' });
  }

  // Rate limiting nas tentativas de validação de OTP (máx 5 tentativas por 10 min)
  var limiteOtp = verificarRateLimitCache_('rl_otp_', email, 5, 600);
  if (!limiteOtp.permitido) {
    return criarRespostaJson({ sucesso: false, erro: limiteOtp.motivo });
  }

  var sheetOtps = getSheet(SHEETS.OTPS);
  var dadosOtps = sheetOtps.getDataRange().getValues();
  var agora = new Date();
  var linhaEncontrada = -1;

  // Busca do mais recente para o mais antigo
  for (var i = dadosOtps.length - 1; i >= 1; i--) {
    var regEmail = sanitizarString(dadosOtps[i][0]).toLowerCase();
    var regOtp = sanitizarString(dadosOtps[i][1]);
    var regExpira = new Date(dadosOtps[i][3]);
    var regUtilizado = dadosOtps[i][4] === true || String(dadosOtps[i][4]).toUpperCase() === 'TRUE';

    if (regEmail === email && regOtp === otpInformado) {
      if (regUtilizado) {
        return criarRespostaJson({ sucesso: false, erro: 'Este código OTP já foi utilizado.' });
      }
      if (agora.getTime() > regExpira.getTime()) {
        return criarRespostaJson({ sucesso: false, erro: 'O código OTP informado expirou. Solicite um novo login.' });
      }
      linhaEncontrada = i + 1;
      break;
    }
  }

  if (linhaEncontrada === -1) {
    return criarRespostaJson({ sucesso: false, erro: 'Código OTP inválido ou não encontrado.' });
  }

  // OTP validado com sucesso: limpa o contador de tentativas
  limparRateLimitCache_('rl_otp_', email);

  // Marca OTP como utilizado
  sheetOtps.getRange(linhaEncontrada, 5).setValue(true);

  var cliente = obterClientePorEmail(email);
  if (!cliente) {
    return criarRespostaJson({ sucesso: false, erro: 'Cliente não localizado na base cadastral.' });
  }

  var config = obterConfiguracoes();
  var tokenSessao = gerarUUID();
  var expiraSessao = new Date(agora.getTime() + (config.SESSAO_TIMEOUT_MIN * 60 * 1000));

  var sheetSessoes = getSheet(SHEETS.SESSOES);
  sheetSessoes.appendRow([
    tokenSessao,
    email,
    agora,
    expiraSessao
  ]);

  // Atualiza último login na aba CLIENTES
  var sheetClientes = getSheet(SHEETS.CLIENTES);
  var dadosClientes = sheetClientes.getDataRange().getValues();
  for (var c = 1; c < dadosClientes.length; c++) {
    if (sanitizarString(dadosClientes[c][2]).toLowerCase() === email) {
      sheetClientes.getRange(c + 1, 8).setValue(agora);
      break;
    }
  }

  var isMaster = verificarSeMaster(email);

  return criarRespostaJson({
    sucesso: true,
    token: tokenSessao,
    expira_em_min: config.SESSAO_TIMEOUT_MIN,
    cliente: {
      id: cliente.id_cliente,
      nome: cliente.nome_empresa,
      email: cliente.email_login,
      senha_temporaria: cliente.senha_temporaria,
      is_master: isMaster
    }
  });
}

/**
 * Recuperação de senha: gera senha temporária de 8 chars, salva hash e marca flag.
 */
function executarRecuperarSenha(payload) {
  var email = sanitizarString(payload.email).toLowerCase();
  if (!email) {
    return criarRespostaJson({ sucesso: false, erro: 'Informe o e-mail cadastrado.' });
  }

  // Rate limiting em recuperação de senha (máx 3 tentativas por 15 min)
  var limiteRecup = verificarRateLimitCache_('rl_recup_', email, 3, 900);
  if (!limiteRecup.permitido) {
    return criarRespostaJson({ sucesso: false, erro: limiteRecup.motivo });
  }

  var sheetClientes = getSheet(SHEETS.CLIENTES);
  var dados = sheetClientes.getDataRange().getValues();
  var linhaCliente = -1;
  var nomeCliente = '';

  for (var i = 1; i < dados.length; i++) {
    if (sanitizarString(dados[i][2]).toLowerCase() === email) {
      linhaCliente = i + 1;
      nomeCliente = dados[i][1];
      break;
    }
  }

  if (linhaCliente === -1) {
    // Por segurança e padrão corporativo, informa sucesso neutro
    return criarRespostaJson({
      sucesso: true,
      mensagem: 'Se o e-mail estiver cadastrado, as instruções e nova credencial temporária foram enviadas.'
    });
  }

  var senhaTemporaria = gerarStringAleatoria(8);
  var novoHash = hashSenha(senhaTemporaria);

  sheetClientes.getRange(linhaCliente, 4).setValue(novoHash); // senha_hash
  sheetClientes.getRange(linhaCliente, 5).setValue(true);     // senha_temporaria

  enviarEmailRecuperacaoSenha(email, nomeCliente, senhaTemporaria);

  return criarRespostaJson({
    sucesso: true,
    mensagem: 'Uma nova senha temporária foi gerada e enviada para o seu e-mail.'
  });
}

/**
 * Troca obrigatória de senha temporária por nova senha definitiva.
 */
function executarTrocarSenhaTemporaria(payload) {
  var email = sanitizarString(payload.email).toLowerCase();
  var senhaTemp = sanitizarString(payload.senha_temp);
  var novaSenha = sanitizarString(payload.nova_senha);

  if (!email || !senhaTemp || !novaSenha) {
    return criarRespostaJson({ sucesso: false, erro: 'Todos os campos são obrigatórios.' });
  }

  if (novaSenha.length < 6) {
    return criarRespostaJson({ sucesso: false, erro: 'A nova senha deve ter no mínimo 6 caracteres.' });
  }

  var sheetClientes = getSheet(SHEETS.CLIENTES);
  var dados = sheetClientes.getDataRange().getValues();
  var linhaCliente = -1;
  var cliente = null;

  for (var i = 1; i < dados.length; i++) {
    if (sanitizarString(dados[i][2]).toLowerCase() === email) {
      linhaCliente = i + 1;
      cliente = {
        senha_hash: dados[i][3],
        senha_temp_flag: dados[i][4]
      };
      break;
    }
  }

  if (linhaCliente === -1 || !cliente) {
    return criarRespostaJson({ sucesso: false, erro: 'Usuário não encontrado.' });
  }

  var hashTempInformado = hashSenha(senhaTemp);
  if (cliente.senha_hash !== hashTempInformado) {
    return criarRespostaJson({ sucesso: false, erro: 'Senha temporária incorreta.' });
  }

  var novoHashDefinitivo = hashSenha(novaSenha);
  sheetClientes.getRange(linhaCliente, 4).setValue(novoHashDefinitivo);
  sheetClientes.getRange(linhaCliente, 5).setValue(false); // remove a flag

  return criarRespostaJson({
    sucesso: true,
    mensagem: 'Senha alterada com sucesso! Você já pode realizar login com sua nova senha.'
  });
}

// ========= SEÇÃO 4: CONTROLADORES DE CLIENTE B2B =========

/**
 * Lista circuitos ATIVOS associados ao cliente autenticado.
 */
function executarListarMeusCircuitos(emailUsuario) {
  var cliente = obterClientePorEmail(emailUsuario);
  if (!cliente) {
    return criarRespostaJson({ sucesso: false, erro: 'Cadastro do cliente não localizado.' });
  }

  var sheetCircuitos = getSheet(SHEETS.CIRCUITOS);
  var dados = sheetCircuitos.getDataRange().getValues();
  var circuitos = [];

  for (var i = 1; i < dados.length; i++) {
    var idCli = sanitizarString(dados[i][1]);
    var status = sanitizarString(dados[i][5]).toUpperCase();

    if (idCli === cliente.id_cliente && status === 'ATIVO') {
      circuitos.push({
        id_circuito: dados[i][0],
        id_cliente: dados[i][1],
        nome_circuito: dados[i][2],
        tipo_link: dados[i][3],
        identificador_tecnico: dados[i][4],
        status: status
      });
    }
  }

  return criarRespostaJson({
    sucesso: true,
    circuitos: circuitos
  });
}

/**
 * Lista tickets do cliente logado com contagem de comentários e ordenados por abertura descrescente.
 */
function executarListarMeusTickets(emailUsuario) {
  var cliente = obterClientePorEmail(emailUsuario);
  if (!cliente) {
    return criarRespostaJson({ sucesso: false, erro: 'Cadastro do cliente não localizado.' });
  }

  var sheetTickets = getSheet(SHEETS.TICKETS);
  var dadosTickets = sheetTickets.getDataRange().getValues();
  var mapaComentarios = obterContagemComentarios();
  var mapaCircuitos = obterMapaCircuitos();
  var config = obterConfiguracoes();

  var tickets = [];

  for (var i = 1; i < dadosTickets.length; i++) {
    var idCli = sanitizarString(dadosTickets[i][1]);
    if (idCli === cliente.id_cliente) {
      var idTicket = sanitizarString(dadosTickets[i][0]);
      var idCircuito = sanitizarString(dadosTickets[i][2]);
      var circInfo = mapaCircuitos[idCircuito] || { nome: idCircuito, tipo: 'Desconhecido' };

      tickets.push({
        id_ticket: idTicket,
        id_cliente: idCli,
        id_circuito: idCircuito,
        nome_circuito: circInfo.nome,
        tipo_link: circInfo.tipo,
        tipo_incidente: dadosTickets[i][3],
        descricao_inicial: dadosTickets[i][4],
        status: dadosTickets[i][5],
        data_abertura: formatarData(dadosTickets[i][6], config.TIMEZONE),
        data_abertura_raw: dadosTickets[i][6] ? new Date(dadosTickets[i][6]).getTime() : 0,
        data_ultima_atualizacao: formatarData(dadosTickets[i][7], config.TIMEZONE),
        data_pendencia_expira: dadosTickets[i][8] ? formatarData(dadosTickets[i][8], config.TIMEZONE) : null,
        data_fechamento: dadosTickets[i][9] ? formatarData(dadosTickets[i][9], config.TIMEZONE) : null,
        pasta_drive_anexos: dadosTickets[i][10] || '',
        total_comentarios: mapaComentarios[idTicket] || 0
      });
    }
  }

  // Ordena por data_abertura mais recente primeiro
  tickets.sort(function(a, b) {
    return b.data_abertura_raw - a.data_abertura_raw;
  });

  return criarRespostaJson({
    sucesso: true,
    tickets: tickets
  });
}

/**
 * Abertura de ticket: valida circuito, gera ID TK-AAAAMMDD-NNNN, pasta no Drive,
 * salva anexos em Base64 e envia notificações automáticas.
 */
function executarAbrirTicket(emailUsuario, payload) {
  var cliente = obterClientePorEmail(emailUsuario);
  if (!cliente) {
    return criarRespostaJson({ sucesso: false, erro: 'Cliente não identificado.' });
  }

  var idCircuito = sanitizarString(payload.id_circuito);
  var tipoIncidente = sanitizarString(payload.tipo_incidente).toUpperCase();
  var descricao = sanitizarString(payload.descricao);
  var anexosBase64 = Array.isArray(payload.anexos_base64) ? payload.anexos_base64 : [];

  if (!idCircuito || !tipoIncidente || !descricao) {
    return criarRespostaJson({ sucesso: false, erro: 'Circuito, tipo de incidente e descrição são obrigatórios.' });
  }

  if (['CORTE_TOTAL', 'CORTE_PARCIAL', 'ENSAIO'].indexOf(tipoIncidente) === -1) {
    return criarRespostaJson({
      sucesso: false,
      erro: 'Tipo de incidente inválido. Deve ser CORTE_TOTAL, CORTE_PARCIAL ou ENSAIO.'
    });
  }

  if (descricao.length < 20) {
    return criarRespostaJson({
      sucesso: false,
      erro: 'A descrição inicial do incidente deve conter no mínimo 20 caracteres.'
    });
  }

  // Valida se o circuito pertence ao cliente
  var circuito = obterCircuitoPorId(idCircuito);
  if (!circuito || circuito.id_cliente !== cliente.id_cliente) {
    return criarRespostaJson({
      sucesso: false,
      erro: 'O circuito informado não pertence à sua conta ou não está ativo.'
    });
  }

  var idTicket = gerarIdTicketSequencial();
  var pastaDrive = obterOuCriarPastaTicket(idTicket);
  var pastaDriveUrl = pastaDrive ? pastaDrive.getUrl() : '';

  // Processa anexos iniciais se existirem
  var urlsAnexos = [];
  if (pastaDrive && anexosBase64.length > 0) {
    for (var a = 0; a < anexosBase64.length; a++) {
      var urlArquivo = salvarAnexoEmDrive(anexosBase64[a], pastaDrive);
      if (urlArquivo) {
        urlsAnexos.push(urlArquivo);
      }
    }
  }

  var agora = new Date();
  var config = obterConfiguracoes();

  var sheetTickets = getSheet(SHEETS.TICKETS);
  sheetTickets.appendRow([
    idTicket,
    cliente.id_cliente,
    idCircuito,
    tipoIncidente,
    descricao,
    'ABERTO',
    agora,
    agora,
    '', // data_pendencia_expira
    '', // data_fechamento
    pastaDriveUrl
  ]);

  // Se houver anexos, registra primeiro comentário com links
  if (urlsAnexos.length > 0) {
    var sheetComentarios = getSheet(SHEETS.COMENTARIOS);
    sheetComentarios.appendRow([
      gerarUUID(),
      idTicket,
      'CLIENTE',
      cliente.nome_empresa,
      'Anexos enviados na abertura do ticket: ' + urlsAnexos.join(', '),
      urlsAnexos[0],
      agora
    ]);
  }

  // Dispara emails de abertura
  try {
    enviarEmailNovoTicketNoc(cliente, circuito, idTicket, tipoIncidente, descricao, pastaDriveUrl);
    enviarEmailConfirmacaoCliente(cliente, circuito, idTicket, tipoIncidente, descricao);
  } catch (errEmail) {
    console.error('Aviso ao enviar e-mails de abertura: ' + errEmail.toString());
  }

  return criarRespostaJson({
    sucesso: true,
    id_ticket: idTicket,
    pasta_drive: pastaDriveUrl,
    mensagem: 'Ticket ' + idTicket + ' aberto com sucesso.'
  });
}

/**
 * Consulta detalhes de um ticket e sua linha do tempo (CRM).
 * Valida se o cliente logado é proprietário do ticket (ou se é NOC).
 */
function executarVerTicket(emailUsuario, isMaster, payload) {
  var idTicket = sanitizarString(payload.id_ticket);
  if (!idTicket) {
    return criarRespostaJson({ sucesso: false, erro: 'ID do ticket não informado.' });
  }

  var ticket = obterTicketPorId(idTicket);
  if (!ticket) {
    return criarRespostaJson({ sucesso: false, erro: 'Ticket não encontrado.' });
  }

  var cliente = obterClientePorEmail(emailUsuario);
  if (!isMaster && (!cliente || ticket.id_cliente !== cliente.id_cliente)) {
    return criarRespostaJson({ sucesso: false, erro: 'Permissão negada. Este ticket pertence a outro cliente.' });
  }

  var comentarios = obterComentariosPorTicket(idTicket);
  var circuito = obterCircuitoPorId(ticket.id_circuito) || { nome_circuito: 'N/A', identificador_tecnico: 'N/A' };
  var config = obterConfiguracoes();

  return criarRespostaJson({
    sucesso: true,
    ticket: {
      id_ticket: ticket.id_ticket,
      id_cliente: ticket.id_cliente,
      id_circuito: ticket.id_circuito,
      nome_circuito: circuito.nome_circuito,
      identificador_tecnico: circuito.identificador_tecnico,
      tipo_incidente: ticket.tipo_incidente,
      descricao_inicial: ticket.descricao_inicial,
      status: ticket.status,
      data_abertura: formatarData(ticket.data_abertura, config.TIMEZONE),
      data_ultima_atualizacao: formatarData(ticket.data_ultima_atualizacao, config.TIMEZONE),
      data_pendencia_expira: ticket.data_pendencia_expira ? formatarData(ticket.data_pendencia_expira, config.TIMEZONE) : null,
      data_fechamento: ticket.data_fechamento ? formatarData(ticket.data_fechamento, config.TIMEZONE) : null,
      pasta_drive_anexos: ticket.pasta_drive_anexos
    },
    comentarios: comentarios
  });
}

/**
 * Comentário adicionado pelo cliente no ticket.
 * Regra: Cliente NUNCA pode comentar em ticket com status RESOLVIDO.
 */
function executarComentarTicket(emailUsuario, payload) {
  var idTicket = sanitizarString(payload.id_ticket);
  var mensagem = sanitizarString(payload.mensagem);
  var anexosBase64 = Array.isArray(payload.anexos_base64) ? payload.anexos_base64 : [];

  if (!idTicket || !mensagem) {
    return criarRespostaJson({ sucesso: false, erro: 'ID do ticket e mensagem são obrigatórios.' });
  }

  var cliente = obterClientePorEmail(emailUsuario);
  var ticket = obterTicketPorId(idTicket);

  if (!ticket) {
    return criarRespostaJson({ sucesso: false, erro: 'Ticket não encontrado.' });
  }

  if (!cliente || ticket.id_cliente !== cliente.id_cliente) {
    return criarRespostaJson({ sucesso: false, erro: 'Acesso negado para este ticket.' });
  }

  if (ticket.status === 'RESOLVIDO') {
    return criarRespostaJson({
      sucesso: false,
      erro: 'Não é permitido adicionar comentários a um ticket já RESOLVIDO. Solicite reabertura ao NOC se necessário.'
    });
  }

  var pastaDrive = obterOuCriarPastaTicket(idTicket);
  var anexoUrl = '';
  if (pastaDrive && anexosBase64.length > 0) {
    anexoUrl = salvarAnexoEmDrive(anexosBase64[0], pastaDrive) || '';
  }

  var idComentario = gerarUUID();
  var agora = new Date();

  var sheetComentarios = getSheet(SHEETS.COMENTARIOS);
  sheetComentarios.appendRow([
    idComentario,
    idTicket,
    'CLIENTE',
    cliente.nome_empresa,
    mensagem,
    anexoUrl,
    agora
  ]);

  // Atualiza data_ultima_atualizacao no ticket
  atualizarDataModificacaoTicket(idTicket, agora);

  // Notifica o NOC por e-mail
  try {
    enviarEmailComentarioClienteParaNoc(cliente, ticket, mensagem, anexoUrl);
  } catch (errEmail) {
    console.error('Aviso ao enviar notificação de comentário ao NOC: ' + errEmail.toString());
  }

  return criarRespostaJson({
    sucesso: true,
    id_comentario: idComentario,
    anexo_url: anexoUrl,
    mensagem: 'Comentário registrado com sucesso.'
  });
}

/**
 * Extrai o ID limpo de um arquivo do Google Drive a partir de ID ou URL.
 */
function extrairFileId_(ref) {
  if (!ref) return '';
  var str = ref.toString().trim();
  var match = str.match(/\\/d\\/([a-zA-Z0-9_-]{15,})/);
  if (match && match[1]) return match[1];
  var matchId = str.match(/[?&]id=([a-zA-Z0-9_-]{15,})/);
  if (matchId && matchId[1]) return matchId[1];
  if (/^[a-zA-Z0-9_-]{15,}$/.test(str)) return str;
  return str;
}

/**
 * Ação autenticada para download seguro de anexo do ticket.
 * Valida sessão, ticket, propriedade (cliente dono vs NOC Master),
 * restringe estritamente aos fileIds referenciados nos comentários do ticket,
 * rejeita arquivos maiores que 10 MB e devolve { sucesso: true, nome, tipo_mime, base64 }.
 */
function executarBaixarAnexo(emailUsuario, isMaster, payload) {
  var idTicket = sanitizarString(payload.id_ticket);
  var idArquivoRef = sanitizarString(payload.id_arquivo);

  if (!idTicket || !idArquivoRef) {
    return criarRespostaJson({
      sucesso: false,
      erro: 'Parâmetros id_ticket e id_arquivo são obrigatórios.'
    });
  }

  var targetFileId = extrairFileId_(idArquivoRef);
  if (!targetFileId) {
    return criarRespostaJson({
      sucesso: false,
      erro: 'Identificador de anexo inválido.'
    });
  }

  // 1. Validar ticket e permissão de acesso
  var ticket = obterTicketPorId(idTicket);
  if (!ticket) {
    return criarRespostaJson({
      sucesso: false,
      erro: 'Ticket ' + idTicket + ' não encontrado.'
    });
  }

  if (!isMaster) {
    var cliente = obterClientePorEmail(emailUsuario);
    if (!cliente || cliente.id_cliente !== ticket.id_cliente) {
      return criarRespostaJson({
        sucesso: false,
        erro: 'Acesso negado: você não tem permissão para acessar os anexos deste ticket.'
      });
    }
  }

  // 2. Verificar se o fileId está efetivamente referenciado nos comentários do ticket
  var sheetComentarios = getSheet(SHEETS.COMENTARIOS);
  var dadosComentarios = sheetComentarios.getDataRange().getValues();
  var arquivoAutorizado = false;

  for (var i = 1; i < dadosComentarios.length; i++) {
    var rowTicket = sanitizarString(dadosComentarios[i][1]);
    if (rowTicket === idTicket) {
      var anexoCol = sanitizarString(dadosComentarios[i][5]);
      var msgCol = sanitizarString(dadosComentarios[i][4]);
      if (anexoCol && (extrairFileId_(anexoCol) === targetFileId || anexoCol.indexOf(targetFileId) > -1)) {
        arquivoAutorizado = true;
        break;
      }
      if (msgCol && (msgCol.indexOf(targetFileId) > -1 || extrairFileId_(msgCol) === targetFileId)) {
        arquivoAutorizado = true;
        break;
      }
    }
  }

  if (!arquivoAutorizado) {
    return criarRespostaJson({
      sucesso: false,
      erro: 'Arquivo não autorizado ou não pertence aos comentários deste ticket.'
    });
  }

  // 3. Obter arquivo do Google Drive, verificar limite de 10 MB e retornar base64
  try {
    var arquivoDrive = DriveApp.getFileById(targetFileId);
    var tamanhoBytes = arquivoDrive.getSize();
    var limiteMaximoBytes = 10 * 1024 * 1024; // 10 MB

    if (tamanhoBytes > limiteMaximoBytes) {
      return criarRespostaJson({
        sucesso: false,
        erro: 'Arquivo excede o limite máximo permitido de 10 MB.'
      });
    }

    var blob = arquivoDrive.getBlob();
    var base64 = Utilities.base64Encode(blob.getBytes());
    var nome = arquivoDrive.getName();
    var mime = arquivoDrive.getMimeType() || blob.getContentType() || 'application/octet-stream';

    return criarRespostaJson({
      sucesso: true,
      nome: nome,
      tipo_mime: mime,
      base64: base64
    });
  } catch (errDrive) {
    console.error('Erro ao acessar arquivo no Drive: ' + errDrive.toString());
    return criarRespostaJson({
      sucesso: false,
      erro: 'Não foi possível acessar o arquivo no Drive: ' + errDrive.message
    });
  }
}

// ========= SEÇÃO 5: CONTROLADORES NOC MASTER =========

/**
 * Lista todos os tickets da operadora com múltiplos filtros opcionais.
 */
function executarListarTodosTickets(payload) {
  var filtroStatus = sanitizarString(payload.status);
  var filtroCliente = sanitizarString(payload.id_cliente);
  var filtroTipo = sanitizarString(payload.tipo_incidente);
  var dataDe = payload.data_de ? new Date(payload.data_de) : null;
  var dataAte = payload.data_ate ? new Date(payload.data_ate) : null;

  var sheetTickets = getSheet(SHEETS.TICKETS);
  var dados = sheetTickets.getDataRange().getValues();
  var mapaComentarios = obterContagemComentarios();
  var mapaClientes = obterMapaClientes();
  var mapaCircuitos = obterMapaCircuitos();
  var config = obterConfiguracoes();

  var lista = [];

  for (var i = 1; i < dados.length; i++) {
    var idTicket = sanitizarString(dados[i][0]);
    var idCliente = sanitizarString(dados[i][1]);
    var idCircuito = sanitizarString(dados[i][2]);
    var tipoIncidente = sanitizarString(dados[i][3]);
    var status = sanitizarString(dados[i][5]);
    var dataAberturaObj = dados[i][6] ? new Date(dados[i][6]) : null;

    if (filtroStatus && status.toUpperCase() !== filtroStatus.toUpperCase()) continue;
    if (filtroCliente && idCliente.toUpperCase() !== filtroCliente.toUpperCase()) continue;
    if (filtroTipo && tipoIncidente.toUpperCase() !== filtroTipo.toUpperCase()) continue;

    if (dataDe && dataAberturaObj && dataAberturaObj < dataDe) continue;
    if (dataAte && dataAberturaObj && dataAberturaObj > dataAte) continue;

    var cliInfo = mapaClientes[idCliente] || { nome: idCliente, email: '' };
    var circInfo = mapaCircuitos[idCircuito] || { nome: idCircuito, tipo: '' };

    lista.push({
      id_ticket: idTicket,
      id_cliente: idCliente,
      nome_empresa: cliInfo.nome,
      email_cliente: cliInfo.email,
      id_circuito: idCircuito,
      nome_circuito: circInfo.nome,
      tipo_link: circInfo.tipo,
      tipo_incidente: tipoIncidente,
      descricao_inicial: dados[i][4],
      status: status,
      data_abertura: formatarData(dados[i][6], config.TIMEZONE),
      data_abertura_raw: dataAberturaObj ? dataAberturaObj.getTime() : 0,
      data_ultima_atualizacao: formatarData(dados[i][7], config.TIMEZONE),
      data_pendencia_expira: dados[i][8] ? formatarData(dados[i][8], config.TIMEZONE) : null,
      data_fechamento: dados[i][9] ? formatarData(dados[i][9], config.TIMEZONE) : null,
      pasta_drive_anexos: dados[i][10] || '',
      total_comentarios: mapaComentarios[idTicket] || 0
    });
  }

  // Ordena por data mais recente
  lista.sort(function(a, b) {
    return b.data_abertura_raw - a.data_abertura_raw;
  });

  return criarRespostaJson({
    sucesso: true,
    total: lista.length,
    tickets: lista
  });
}

/**
 * Consulta de ticket para NOC Master (sem filtro de propriedade).
 */
function executarVerTicketMaster(payload) {
  var idTicket = sanitizarString(payload.id_ticket);
  if (!idTicket) {
    return criarRespostaJson({ sucesso: false, erro: 'ID do ticket não fornecido.' });
  }

  var ticket = obterTicketPorId(idTicket);
  if (!ticket) {
    return criarRespostaJson({ sucesso: false, erro: 'Ticket não encontrado.' });
  }

  var cliente = obterClientePorId(ticket.id_cliente) || { nome_empresa: 'Cliente Desconhecido', email_login: '' };
  var circuito = obterCircuitoPorId(ticket.id_circuito) || { nome_circuito: 'N/A', identificador_tecnico: 'N/A' };
  var comentarios = obterComentariosPorTicket(idTicket);
  var config = obterConfiguracoes();

  return criarRespostaJson({
    sucesso: true,
    ticket: {
      id_ticket: ticket.id_ticket,
      id_cliente: ticket.id_cliente,
      nome_empresa: cliente.nome_empresa,
      email_login: cliente.email_login,
      id_circuito: ticket.id_circuito,
      nome_circuito: circuito.nome_circuito,
      identificador_tecnico: circuito.identificador_tecnico,
      tipo_incidente: ticket.tipo_incidente,
      descricao_inicial: ticket.descricao_inicial,
      status: ticket.status,
      data_abertura: formatarData(ticket.data_abertura, config.TIMEZONE),
      data_ultima_atualizacao: formatarData(ticket.data_ultima_atualizacao, config.TIMEZONE),
      data_pendencia_expira: ticket.data_pendencia_expira ? formatarData(ticket.data_pendencia_expira, config.TIMEZONE) : null,
      data_fechamento: ticket.data_fechamento ? formatarData(ticket.data_fechamento, config.TIMEZONE) : null,
      pasta_drive_anexos: ticket.pasta_drive_anexos
    },
    comentarios: comentarios
  });
}

/**
 * NOC altera status do ticket.
 * Regras:
 * - Status aceitos: ABERTO, EM_RESOLUCAO, PENDENTE, RESOLVIDO.
 * - Se PENDENTE -> data_pendencia_expira é OBRIGATÓRIA.
 * - Se RESOLVIDO -> preenche data_fechamento com agora.
 * - Registra comentário de auditoria automática.
 * - Dispara e-mail para o cliente.
 */
function executarAlterarStatus(emailOperadorNoc, payload) {
  var idTicket = sanitizarString(payload.id_ticket);
  var novoStatus = sanitizarString(payload.novo_status).toUpperCase();
  var dataPendenciaExpiraStr = sanitizarString(payload.data_pendencia_expira);

  var statusValidos = ['ABERTO', 'EM_RESOLUCAO', 'PENDENTE', 'RESOLVIDO'];
  if (statusValidos.indexOf(novoStatus) === -1) {
    return criarRespostaJson({
      sucesso: false,
      erro: 'Status inválido. Permitidos: ABERTO, EM_RESOLUCAO, PENDENTE, RESOLVIDO.'
    });
  }

  if (novoStatus === 'PENDENTE' && !dataPendenciaExpiraStr) {
    return criarRespostaJson({
      sucesso: false,
      erro: 'A data limite de expiração da pendência (data_pendencia_expira) é OBRIGATÓRIA para o status PENDENTE.'
    });
  }

  var sheetTickets = getSheet(SHEETS.TICKETS);
  var dados = sheetTickets.getDataRange().getValues();
  var linhaTicket = -1;
  var statusAnterior = '';
  var idCliente = '';

  for (var i = 1; i < dados.length; i++) {
    if (sanitizarString(dados[i][0]) === idTicket) {
      linhaTicket = i + 1;
      statusAnterior = dados[i][5];
      idCliente = dados[i][1];
      break;
    }
  }

  if (linhaTicket === -1) {
    return criarRespostaJson({ sucesso: false, erro: 'Ticket não encontrado.' });
  }

  var agora = new Date();
  var dataPendenciaVal = '';
  var dataFechamentoVal = '';

  if (novoStatus === 'PENDENTE') {
    dataPendenciaVal = new Date(dataPendenciaExpiraStr);
    if (isNaN(dataPendenciaVal.getTime())) {
      return criarRespostaJson({ sucesso: false, erro: 'Data de pendência em formato inválido. Use ISO 8601 ou YYYY-MM-DD HH:mm.' });
    }
  }

  if (novoStatus === 'RESOLVIDO') {
    dataFechamentoVal = agora;
  }

  // Atualiza colunas: F(status), H(data_ultima_atualizacao), I(data_pendencia_expira), J(data_fechamento)
  sheetTickets.getRange(linhaTicket, 6).setValue(novoStatus);
  sheetTickets.getRange(linhaTicket, 8).setValue(agora);
  sheetTickets.getRange(linhaTicket, 9).setValue(dataPendenciaVal);
  sheetTickets.getRange(linhaTicket, 10).setValue(dataFechamentoVal);

  // Registro automático de auditoria na aba COMENTARIOS
  var msgAuditoria = 'Status alterado de [' + statusAnterior + '] para [' + novoStatus + '] pelo operador NOC (' + emailOperadorNoc + ').';
  if (novoStatus === 'PENDENTE') {
    msgAuditoria += ' Prazo de retorno do cliente fixado até: ' + formatarData(dataPendenciaVal, DEFAULT_CONFIG.TIMEZONE);
  }

  var sheetComentarios = getSheet(SHEETS.COMENTARIOS);
  sheetComentarios.appendRow([
    gerarUUID(),
    idTicket,
    'NOC',
    'NOC Operações',
    msgAuditoria,
    '',
    agora
  ]);

  // Notifica o cliente por e-mail
  var cliente = obterClientePorId(idCliente);
  if (cliente && cliente.email_login) {
    try {
      enviarEmailAtualizacaoStatus(cliente, idTicket, statusAnterior, novoStatus, msgAuditoria);
    } catch (errEmail) {
      console.error('Aviso ao enviar notificação de status para cliente: ' + errEmail.toString());
    }
  }

  return criarRespostaJson({
    sucesso: true,
    mensagem: 'Status do ticket ' + idTicket + ' atualizado com sucesso para ' + novoStatus + '.'
  });
}

/**
 * NOC adiciona comentário técnico e anexo com notificação imediata ao cliente.
 */
function executarComentarMaster(emailOperadorNoc, payload) {
  var idTicket = sanitizarString(payload.id_ticket);
  var mensagem = sanitizarString(payload.mensagem);
  var anexosBase64 = Array.isArray(payload.anexos_base64) ? payload.anexos_base64 : [];

  if (!idTicket || !mensagem) {
    return criarRespostaJson({ sucesso: false, erro: 'ID do ticket e mensagem são obrigatórios.' });
  }

  var ticket = obterTicketPorId(idTicket);
  if (!ticket) {
    return criarRespostaJson({ sucesso: false, erro: 'Ticket não encontrado.' });
  }

  var pastaDrive = obterOuCriarPastaTicket(idTicket);
  var anexoUrl = '';
  if (pastaDrive && anexosBase64.length > 0) {
    anexoUrl = salvarAnexoEmDrive(anexosBase64[0], pastaDrive) || '';
  }

  var agora = new Date();
  var idComentario = gerarUUID();

  var sheetComentarios = getSheet(SHEETS.COMENTARIOS);
  sheetComentarios.appendRow([
    idComentario,
    idTicket,
    'NOC',
    'NOC Operações (' + emailOperadorNoc + ')',
    mensagem,
    anexoUrl,
    agora
  ]);

  atualizarDataModificacaoTicket(idTicket, agora);

  // Notifica o cliente
  var cliente = obterClientePorId(ticket.id_cliente);
  if (cliente && cliente.email_login) {
    try {
      enviarEmailComentarioNocParaCliente(cliente, ticket, mensagem, anexoUrl);
    } catch (errEmail) {
      console.error('Aviso ao enviar comentário do NOC para cliente: ' + errEmail.toString());
    }
  }

  return criarRespostaJson({
    sucesso: true,
    id_comentario: idComentario,
    anexo_url: anexoUrl,
    mensagem: 'Comentário técnico registrado com sucesso e notificação enviada ao cliente.'
  });
}

/**
 * Reabertura de ticket pelo NOC.
 * Regra CRÍTICA: Só permite reabrir se status=RESOLVIDO E data_fechamento for HOJE (mesmo dia civil).
 * Compara utilizando Utilities.formatDate com timezone America/Sao_Paulo.
 */
function executarReabrirTicket(emailOperadorNoc, payload) {
  var idTicket = sanitizarString(payload.id_ticket);
  if (!idTicket) {
    return criarRespostaJson({ sucesso: false, erro: 'ID do ticket é obrigatório.' });
  }

  var ticket = obterTicketPorId(idTicket);
  if (!ticket) {
    return criarRespostaJson({ sucesso: false, erro: 'Ticket não encontrado.' });
  }

  if (ticket.status !== 'RESOLVIDO') {
    return criarRespostaJson({
      sucesso: false,
      erro: 'Apenas tickets com status RESOLVIDO podem ser reabertos. Status atual: ' + ticket.status
    });
  }

  if (!ticket.data_fechamento) {
    return criarRespostaJson({
      sucesso: false,
      erro: 'Ticket com inconsistência de dados: status é RESOLVIDO mas não possui data de fechamento registrada.'
    });
  }

  var config = obterConfiguracoes();
  var dataFechamentoStr = Utilities.formatDate(new Date(ticket.data_fechamento), config.TIMEZONE, 'yyyy-MM-dd');
  var dataHojeStr = Utilities.formatDate(new Date(), config.TIMEZONE, 'yyyy-MM-dd');

  if (dataFechamentoStr !== dataHojeStr) {
    return criarRespostaJson({
      sucesso: false,
      erro: 'Regra de negócio violada: Reabertura permitida APENAS se o encerramento ocorreu hoje (' +
            dataHojeStr + '). Data de fechamento do ticket: ' + dataFechamentoStr + '. Abra um novo ticket.'
    });
  }

  var sheetTickets = getSheet(SHEETS.TICKETS);
  var dados = sheetTickets.getDataRange().getValues();
  var linhaTicket = -1;

  for (var i = 1; i < dados.length; i++) {
    if (sanitizarString(dados[i][0]) === idTicket) {
      linhaTicket = i + 1;
      break;
    }
  }

  var agora = new Date();
  sheetTickets.getRange(linhaTicket, 6).setValue('EM_RESOLUCAO');
  sheetTickets.getRange(linhaTicket, 8).setValue(agora);
  sheetTickets.getRange(linhaTicket, 9).setValue(''); // limpa pendência
  sheetTickets.getRange(linhaTicket, 10).setValue(''); // limpa fechamento

  var msgAuditoria = 'Ticket reaberto para [EM_RESOLUCAO] no mesmo dia do fechamento pelo operador NOC (' + emailOperadorNoc + ').';
  var sheetComentarios = getSheet(SHEETS.COMENTARIOS);
  sheetComentarios.appendRow([
    gerarUUID(),
    idTicket,
    'NOC',
    'NOC Operações',
    msgAuditoria,
    '',
    agora
  ]);

  var cliente = obterClientePorId(ticket.id_cliente);
  if (cliente && cliente.email_login) {
    try {
      enviarEmailAtualizacaoStatus(cliente, idTicket, 'RESOLVIDO', 'EM_RESOLUCAO', msgAuditoria);
    } catch (_) {}
  }

  return criarRespostaJson({
    sucesso: true,
    mensagem: 'Ticket ' + idTicket + ' reaberto com sucesso para EM_RESOLUCAO.'
  });
}

/**
 * Importação em lote via CSV (UPSERT com delimitador ';').
 * Suporta tipo "clientes" e "circuitos".
 * Para clientes: aplica automaticamente hash SHA-256 se for senha nova.
 */
function executarImportarBaseCsv(payload) {
  var tipo = sanitizarString(payload.tipo).toLowerCase();
  var csvTexto = payload.csv_texto;

  if (tipo !== 'clientes' && tipo !== 'circuitos') {
    return criarRespostaJson({ sucesso: false, erro: 'Tipo de importação deve ser "clientes" ou "circuitos".' });
  }

  if (!csvTexto || typeof csvTexto !== 'string') {
    return criarRespostaJson({ sucesso: false, erro: 'Conteúdo csv_texto não fornecido.' });
  }

  var linhas = csvTexto.split(/\\r?\\n/).filter(function(linha) {
    return linha.trim().length > 0;
  });

  if (linhas.length < 2) {
    return criarRespostaJson({ sucesso: false, erro: 'CSV deve conter ao menos o cabeçalho e uma linha de dados.' });
  }

  var inseridos = 0;
  var atualizados = 0;
  var erros = [];
  var agora = new Date();

  if (tipo === 'clientes') {
    var sheetClientes = getSheet(SHEETS.CLIENTES);
    var dadosExistentes = sheetClientes.getDataRange().getValues();
    var mapaLinhasEmail = {};

    for (var i = 1; i < dadosExistentes.length; i++) {
      var emailEx = sanitizarString(dadosExistentes[i][2]).toLowerCase();
      if (emailEx) {
        mapaLinhasEmail[emailEx] = i + 1;
      }
    }

    // Formato esperado de linha: id_cliente;nome_empresa;email_login;senha_inicial;status
    for (var l = 1; l < linhas.length; l++) {
      try {
        var colunas = linhas[l].split(';').map(function(c) { return sanitizarString(c); });
        if (colunas.length < 3) {
          erros.push('Linha ' + (l + 1) + ': colunas insuficientes.');
          continue;
        }

        var idCliente = colunas[0] || ('CLI-' + (100 + l));
        var nomeEmpresa = colunas[1];
        var emailLogin = colunas[2].toLowerCase();
        var senhaPura = colunas[3] || 'SenhaPadrao@2026';
        var status = (colunas[4] || 'ATIVO').toUpperCase();

        var senhaHash = hashSenha(senhaPura);

        if (mapaLinhasEmail[emailLogin]) {
          var rowNum = mapaLinhasEmail[emailLogin];
          sheetClientes.getRange(rowNum, 1).setValue(idCliente);
          sheetClientes.getRange(rowNum, 2).setValue(nomeEmpresa);
          if (colunas[3]) {
            sheetClientes.getRange(rowNum, 4).setValue(senhaHash);
            sheetClientes.getRange(rowNum, 5).setValue(true);
          }
          sheetClientes.getRange(rowNum, 6).setValue(status);
          atualizados++;
        } else {
          sheetClientes.appendRow([
            idCliente,
            nomeEmpresa,
            emailLogin,
            senhaHash,
            true, // senha_temporaria = true para primeiro login
            status,
            agora,
            ''
          ]);
          mapaLinhasEmail[emailLogin] = sheetClientes.getLastRow();
          inseridos++;
        }
      } catch (errL) {
        erros.push('Linha ' + (l + 1) + ': ' + errL.message);
      }
    }

  } else if (tipo === 'circuitos') {
    var sheetCircuitos = getSheet(SHEETS.CIRCUITOS);
    var dadosCircExistentes = sheetCircuitos.getDataRange().getValues();
    var mapaLinhasCircuito = {};

    for (var j = 1; j < dadosCircExistentes.length; j++) {
      var idCircEx = sanitizarString(dadosCircExistentes[j][0]).toUpperCase();
      if (idCircEx) {
        mapaLinhasCircuito[idCircEx] = j + 1;
      }
    }

    // Formato esperado: id_circuito;id_cliente;nome_circuito;tipo_link;identificador_tecnico;status
    for (var m = 1; m < linhas.length; m++) {
      try {
        var cols = linhas[m].split(';').map(function(c) { return sanitizarString(c); });
        if (cols.length < 5) {
          erros.push('Linha ' + (m + 1) + ': colunas insuficientes.');
          continue;
        }

        var idCircuito = cols[0].toUpperCase();
        var idCli = cols[1];
        var nomeCirc = cols[2];
        var tipoLink = cols[3] || 'Fibra';
        var idTecnico = cols[4];
        var statusCirc = (cols[5] || 'ATIVO').toUpperCase();

        if (mapaLinhasCircuito[idCircuito]) {
          var rNum = mapaLinhasCircuito[idCircuito];
          sheetCircuitos.getRange(rNum, 2).setValue(idCli);
          sheetCircuitos.getRange(rNum, 3).setValue(nomeCirc);
          sheetCircuitos.getRange(rNum, 4).setValue(tipoLink);
          sheetCircuitos.getRange(rNum, 5).setValue(idTecnico);
          sheetCircuitos.getRange(rNum, 6).setValue(statusCirc);
          atualizados++;
        } else {
          sheetCircuitos.appendRow([
            idCircuito,
            idCli,
            nomeCirc,
            tipoLink,
            idTecnico,
            statusCirc
          ]);
          mapaLinhasCircuito[idCircuito] = sheetCircuitos.getLastRow();
          inseridos++;
        }
      } catch (errM) {
        erros.push('Linha ' + (m + 1) + ': ' + errM.message);
      }
    }
  }

  return criarRespostaJson({
    sucesso: true,
    tipo: tipo,
    inseridos: inseridos,
    atualizados: atualizados,
    erros: erros
  });
}

// ========= SEÇÃO 6: TRIGGERS AUTOMÁTICOS DE SISTEMA =========

/**
 * Trigger Automático 1: verificarSLAPendentes (executado a cada 30 minutos).
 * Varre todos os tickets com status = PENDENTE.
 * Se agora > data_pendencia_expira:
 *  - Reverte status para ABERTO
 *  - Limpa data_pendencia_expira
 *  - Registra comentário automático de violação de SLA
 *  - Dispara e-mail de ALERTA CRÍTICO para o NOC
 */
function verificarSLAPendentes() {
  console.log('Iniciando rotina de verificação de SLA Pendente...');
  try {
    var sheetTickets = getSheet(SHEETS.TICKETS);
    var dados = sheetTickets.getDataRange().getValues();
    var agora = new Date();
    var mapaClientes = obterMapaClientes();
    var expiradosCount = 0;

    for (var i = 1; i < dados.length; i++) {
      var status = sanitizarString(dados[i][5]);
      var dataExpiraRaw = dados[i][8];

      if (status === 'PENDENTE' && dataExpiraRaw) {
        var dataExpira = new Date(dataExpiraRaw);
        if (!isNaN(dataExpira.getTime()) && agora.getTime() > dataExpira.getTime()) {
          var idTicket = dados[i][0];
          var idCliente = dados[i][1];
          var cliInfo = mapaClientes[idCliente] || { nome: idCliente, email: '' };

          // Reverte status para ABERTO e limpa prazo
          sheetTickets.getRange(i + 1, 6).setValue('ABERTO');
          sheetTickets.getRange(i + 1, 8).setValue(agora);
          sheetTickets.getRange(i + 1, 9).setValue('');

          // Comentário automático no histórico
          var msgAlerta = 'ALERTA DE SLA: O prazo de pendência com o cliente expirou em ' +
                          formatarData(dataExpira, DEFAULT_CONFIG.TIMEZONE) +
                          '. O ticket foi reaberto automaticamente como [ABERTO] para atuação do NOC.';

          var sheetComentarios = getSheet(SHEETS.COMENTARIOS);
          sheetComentarios.appendRow([
            gerarUUID(),
            idTicket,
            'NOC',
            'SISTEMA SLA AUTOMATIZADO',
            msgAlerta,
            '',
            agora
          ]);

          // E-mail de alerta crítico para NOC
          enviarEmailAlertaSlaNoc(idTicket, cliInfo.nome, dados[i][2], dataExpira);
          expiradosCount++;
        }
      }
    }

    console.log('Rotina de SLA concluída. Total de tickets reabertos por SLA: ' + expiradosCount);
  } catch (err) {
    console.error('Falha na execução de verificarSLAPendentes: ' + err.toString());
  }
}

/**
 * Trigger Automático 2: limparSessoesExpiradas (executado diariamente às 23:55).
 * Remove linhas da aba SESSOES onde data_expiracao < agora.
 * Remove linhas da aba OTPS onde data_expiracao < agora OU utilizado = true.
 */
function limparSessoesExpiradas() {
  console.log('Iniciando rotina de limpeza de sessões e OTPs expirados...');
  var agora = new Date();

  // 1. Limpeza de SESSOES
  try {
    var sheetSessoes = getSheet(SHEETS.SESSOES);
    var dadosSess = sheetSessoes.getDataRange().getValues();
    // Itera de baixo para cima para deleção segura de linhas
    for (var s = dadosSess.length - 1; s >= 1; s--) {
      var expiraSess = dadosSess[s][3] ? new Date(dadosSess[s][3]) : null;
      if (expiraSess && agora.getTime() > expiraSess.getTime()) {
        sheetSessoes.deleteRow(s + 1);
      }
    }
  } catch (errSess) {
    console.error('Erro ao limpar sessões: ' + errSess.toString());
  }

  // 2. Limpeza de OTPS
  try {
    var sheetOtps = getSheet(SHEETS.OTPS);
    var dadosOtps = sheetOtps.getDataRange().getValues();
    for (var o = dadosOtps.length - 1; o >= 1; o--) {
      var expiraOtp = dadosOtps[o][3] ? new Date(dadosOtps[o][3]) : null;
      var utilizado = dadosOtps[o][4] === true || String(dadosOtps[o][4]).toUpperCase() === 'TRUE';

      if (utilizado || (expiraOtp && agora.getTime() > expiraOtp.getTime())) {
        sheetOtps.deleteRow(o + 1);
      }
    }
  } catch (errOtp) {
    console.error('Erro ao limpar OTPs: ' + errOtp.toString());
  }

  console.log('Rotina de limpeza de sessões finalizada com sucesso.');
}

/**
 * Função utilitária para instalar os dois triggers programáticos no projeto Apps Script.
 */
function instalarTriggers() {
  removerTriggers();

  // Trigger 1: SLA a cada 30 minutos
  ScriptApp.newTrigger('verificarSLAPendentes')
    .timeBased()
    .everyMinutes(30)
    .create();

  // Trigger 2: Limpeza diária às 23:55
  ScriptApp.newTrigger('limparSessoesExpiradas')
    .timeBased()
    .atHour(23)
    .nearMinute(55)
    .everyDays(1)
    .inTimezone(DEFAULT_CONFIG.TIMEZONE)
    .create();

  console.log('Triggers automáticos instalados com sucesso!');
}

/**
 * Remove todos os triggers do projeto para evitar duplicações.
 */
function removerTriggers() {
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    ScriptApp.deleteTrigger(triggers[i]);
  }
  console.log('Triggers anteriores removidos.');
}

// ========= SEÇÃO 7: 7 TEMPLATES DE E-MAIL HTML RESPONSIVOS =========

/**
 * Template Base com estilos corporativos (Slate/Navy) e compatibilidade mobile.
 */
function comporEmailBase(titulo, conteudoHtml, rodapeCustom) {
  var config = obterConfiguracoes();
  var anoAtual = new Date().getFullYear();

  return '' +
    '<!DOCTYPE html>' +
    '<html lang="pt-BR">' +
    '<head>' +
    '  <meta charset="utf-8">' +
    '  <meta name="viewport" content="width=device-width, initial-scale=1.0">' +
    '  <title>' + titulo + '</title>' +
    '</head>' +
    '<body style="margin:0; padding:0; background-color:#f1f5f9; font-family:-apple-system, BlinkMacSystemFont, \\'Segoe UI\\', Roboto, Helvetica, Arial, sans-serif; color:#1e293b;">' +
    '  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f1f5f9; padding:24px 12px;">' +
    '    <tr>' +
    '      <td align="center">' +
    '        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:620px; background-color:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 10px 25px -5px rgba(0,0,0,0.08); border:1px solid #e2e8f0;">' +
    '          <!-- HEADER -->' +
    '          <tr>' +
    '            <td style="background-color:#0f172a; padding:24px 32px; border-bottom:3px solid #0284c7;">' +
    '              <table width="100%" cellpadding="0" cellspacing="0" border="0">' +
    '                <tr>' +
    '                  <td>' +
    '                    <span style="font-size:22px; font-weight:700; color:#ffffff; letter-spacing:-0.5px;">' + config.NOME_EMPRESA + '</span>' +
    '                    <div style="font-size:12px; color:#94a3b8; margin-top:4px; font-weight:500;">PORTAL DE INCIDENTES & NOC OPERATIONS</div>' +
    '                  </td>' +
    '                  <td align="right">' +
    '                    <img src="' + config.LOGO_URL + '" alt="Logo" width="48" height="48" style="display:block; border-radius:8px; object-fit:cover;" />' +
    '                  </td>' +
    '                </tr>' +
    '              </table>' +
    '            </td>' +
    '          </tr>' +
    '          <!-- CORPO -->' +
    '          <tr>' +
    '            <td style="padding:32px 32px 28px 32px;">' +
                   conteudoHtml +
    '            </td>' +
    '          </tr>' +
    '          <!-- FOOTER -->' +
    '          <tr>' +
    '            <td style="background-color:#f8fafc; padding:20px 32px; border-top:1px solid #e2e8f0; font-size:12px; color:#64748b; line-height:1.6;">' +
    '              <table width="100%" cellpadding="0" cellspacing="0" border="0">' +
    '                <tr>' +
    '                  <td>' +
    '                    <strong>NOC Telecom Support 24x7:</strong> ' + config.EMAIL_NOC + '<br>' +
                         (rodapeCustom ? rodapeCustom + '<br>' : '') +
    '                    <span style="color:#94a3b8;">Mensagem automática emitida por sistema de telecomunicações. Não responda diretamente a este e-mail.</span>' +
    '                  </td>' +
    '                  <td align="right" valign="top" style="color:#94a3b8; font-size:11px;">' +
    '                    &copy; ' + anoAtual + ' ' + config.NOME_EMPRESA +
    '                  </td>' +
    '                </tr>' +
    '              </table>' +
    '            </td>' +
    '          </tr>' +
    '        </table>' +
    '      </td>' +
    '    </tr>' +
    '  </table>' +
    '</body>' +
    '</html>';
}

/**
 * 1. Template de Email OTP (Autenticação em 2 etapas)
 */
function enviarEmailOtp(destinatario, nomeEmpresa, codigoOtp, minutosValidade) {
  var conteudo = '' +
    '<h2 style="font-size:20px; font-weight:700; color:#0f172a; margin-top:0; margin-bottom:12px;">Autenticação em Duas Etapas (2FA)</h2>' +
    '<p style="font-size:14px; line-height:1.6; color:#334155; margin-bottom:24px;">' +
    '  Olá <strong>' + nomeEmpresa + '</strong>,<br>' +
    '  Foi solicitada uma tentativa de acesso ao Portal de Incidentes Telecom. Utilize o código de uso único abaixo para confirmar sua identidade:' +
    '</p>' +
    '<div style="text-align:center; margin:32px 0;">' +
    '  <div style="display:inline-block; background-color:#f0fdf4; border:2px dashed #16a34a; border-radius:12px; padding:18px 40px;">' +
    '    <span style="font-size:36px; font-weight:800; letter-spacing:8px; color:#15803d; font-family:Courier, monospace;">' + codigoOtp + '</span>' +
    '  </div>' +
    '  <div style="font-size:12px; color:#64748b; margin-top:10px; font-weight:500;">' +
    '    ⏰ Este código expira em <strong>' + minutosValidade + ' minutos</strong> e só pode ser utilizado uma vez.' +
    '  </div>' +
    '</div>' +
    '<p style="font-size:13px; color:#94a3b8; line-height:1.5;">' +
    '  Se você não solicitou este código, recomendamos avisar imediatamente a gerência do NOC ou trocar suas credenciais.' +
    '</p>';

  var htmlFinal = comporEmailBase('Código de Autenticação OTP', conteudo);
  GmailApp.sendEmail(destinatario, '[NOC Telecom] Código de Segurança OTP: ' + codigoOtp, '', {
    htmlBody: htmlFinal,
    name: 'NOC Telecom 2FA'
  });
}

/**
 * 2. Template de Email Recuperação de Senha
 */
function enviarEmailRecuperacaoSenha(destinatario, nomeEmpresa, senhaTemporaria) {
  var conteudo = '' +
    '<h2 style="font-size:20px; font-weight:700; color:#0f172a; margin-top:0; margin-bottom:12px;">Redefinição de Credencial de Acesso</h2>' +
    '<p style="font-size:14px; line-height:1.6; color:#334155; margin-bottom:20px;">' +
    '  Olá <strong>' + nomeEmpresa + '</strong>,<br>' +
    '  Uma nova senha temporária foi gerada para seu acesso B2B ao Portal de Incidentes:' +
    '</p>' +
    '<div style="background-color:#eff6ff; border:1px solid #bfdbfe; border-radius:8px; padding:18px; margin:20px 0; text-align:center;">' +
    '  <div style="font-size:12px; font-weight:600; color:#1e40af; text-transform:uppercase; margin-bottom:6px;">Sua Senha Temporária:</div>' +
    '  <div style="font-size:24px; font-weight:700; letter-spacing:2px; color:#1d4ed8; font-family:Courier, monospace;">' + senhaTemporaria + '</div>' +
    '</div>' +
    '<div style="background-color:#fef2f2; border-left:4px solid #ef4444; padding:12px 16px; border-radius:4px; margin-bottom:20px;">' +
    '  <strong style="color:#b91c1c; font-size:13px;">Atenção Obrigatória:</strong>' +
    '  <p style="margin:4px 0 0 0; font-size:13px; color:#7f1d1d; line-height:1.4;">' +
    '    Por motivos de compliance de segurança, o sistema exigirá que você cadastre uma nova senha pessoal definitiva imediatamente no seu próximo login.' +
    '  </p>' +
    '</div>';

  var htmlFinal = comporEmailBase('Recuperação de Senha', conteudo);
  GmailApp.sendEmail(destinatario, '[NOC Telecom] Nova Senha Temporária', '', {
    htmlBody: htmlFinal,
    name: 'NOC Telecom Suporte'
  });
}

/**
 * 3. Template de Email Novo Ticket (Para o NOC)
 */
function enviarEmailNovoTicketNoc(cliente, circuito, idTicket, tipoIncidente, descricao, driveUrl) {
  var config = obterConfiguracoes();
  var badgeCor = tipoIncidente === 'CORTE_TOTAL' ? '#ef4444' : (tipoIncidente === 'CORTE_PARCIAL' ? '#f59e0b' : '#3b82f6');

  var conteudo = '' +
    '<div style="display:inline-block; background-color:' + badgeCor + '; color:#ffffff; font-size:11px; font-weight:700; padding:4px 10px; border-radius:6px; margin-bottom:12px; text-transform:uppercase;">' +
    '  NOVO INCIDENTE REGISTRADO - ' + tipoIncidente +
    '</div>' +
    '<h2 style="font-size:22px; font-weight:800; color:#0f172a; margin-top:0; margin-bottom:16px;">Protocolo: ' + idTicket + '</h2>' +
    '<table width="100%" cellpadding="10" cellspacing="0" border="0" style="border-collapse:collapse; margin-bottom:20px; font-size:13px; border:1px solid #e2e8f0; border-radius:8px; overflow:hidden;">' +
    '  <tr style="background-color:#f8fafc; border-bottom:1px solid #e2e8f0;">' +
    '    <td width="35%" style="font-weight:600; color:#475569;">Cliente B2B:</td>' +
    '    <td style="color:#0f172a;"><strong>' + cliente.nome_empresa + '</strong> (' + cliente.id_cliente + ')</td>' +
    '  </tr>' +
    '  <tr style="border-bottom:1px solid #e2e8f0;">' +
    '    <td style="font-weight:600; color:#475569;">Circuito Afetado:</td>' +
    '    <td style="color:#0f172a;">' + circuito.nome_circuito + ' (' + circuito.id_circuito + ')</td>' +
    '  </tr>' +
    '  <tr style="background-color:#f8fafc; border-bottom:1px solid #e2e8f0;">' +
    '    <td style="font-weight:600; color:#475569;">Identificador Técnico:</td>' +
    '    <td style="font-family:Courier, monospace; font-weight:600; color:#0284c7;">' + circuito.identificador_tecnico + '</td>' +
    '  </tr>' +
    '  <tr style="border-bottom:1px solid #e2e8f0;">' +
    '    <td style="font-weight:600; color:#475569;">Tipo de Link:</td>' +
    '    <td style="color:#0f172a;">' + circuito.tipo_link + '</td>' +
    '  </tr>' +
    '  <tr style="background-color:#f8fafc;">' +
    '    <td style="font-weight:600; color:#475569;">Contato do Cliente:</td>' +
    '    <td style="color:#0f172a;">' + cliente.email_login + '</td>' +
    '  </tr>' +
    '</table>' +
    '<div style="background-color:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:16px; margin-bottom:20px;">' +
    '  <div style="font-size:12px; font-weight:700; color:#475569; text-transform:uppercase; margin-bottom:8px;">Descrição do Incidente Reportado:</div>' +
    '  <div style="font-size:14px; line-height:1.6; color:#1e293b; white-space:pre-wrap;">' + descricao + '</div>' +
    '</div>' +
    (driveUrl ? '<div style="margin-top:16px;"><a href="' + driveUrl + '" target="_blank" style="display:inline-block; background-color:#0284c7; color:#ffffff; font-size:13px; font-weight:600; padding:10px 20px; text-decoration:none; border-radius:6px;">Acessar Pasta de Anexos no Google Drive &rarr;</a></div>' : '');

  var htmlFinal = comporEmailBase('Novo Ticket NOC: ' + idTicket, conteudo);
  GmailApp.sendEmail(config.EMAIL_NOC, '[ALERTA NOC] Novo Ticket ' + idTicket + ' - ' + cliente.nome_empresa + ' (' + tipoIncidente + ')', '', {
    htmlBody: htmlFinal,
    name: 'NOC Incident Dispatcher'
  });
}

/**
 * 4. Template de Email Confirmação de Abertura (Para o Cliente)
 */
function enviarEmailConfirmacaoCliente(cliente, circuito, idTicket, tipoIncidente, descricao) {
  var conteudo = '' +
    '<h2 style="font-size:20px; font-weight:700; color:#0f172a; margin-top:0; margin-bottom:8px;">Chamado Aberto com Sucesso</h2>' +
    '<p style="font-size:14px; line-height:1.6; color:#334155; margin-bottom:20px;">' +
    '  Prezados da <strong>' + cliente.nome_empresa + '</strong>,<br>' +
    '  Confirmamos o registro do seu chamado de incidente em nossa central de operações de rede. Nossos engenheiros já foram acionados para diagnóstico.' +
    '</p>' +
    '<div style="background-color:#f0f9ff; border:1px solid #bae6fd; border-radius:8px; padding:18px; margin-bottom:20px;">' +
    '  <div style="font-size:12px; color:#0369a1; font-weight:600; text-transform:uppercase;">Protocolo de Atendimento:</div>' +
    '  <div style="font-size:26px; font-weight:800; color:#0284c7; margin:4px 0 10px 0;">' + idTicket + '</div>' +
    '  <div style="font-size:13px; color:#0c4a6e;">' +
    '    <strong>Circuito:</strong> ' + circuito.nome_circuito + ' (' + circuito.identificador_tecnico + ')<br>' +
    '    <strong>Classificação:</strong> ' + tipoIncidente + '<br>' +
    '    <strong>Status Inicial:</strong> ABERTO' +
    '  </div>' +
    '</div>' +
    '<p style="font-size:13px; color:#64748b; line-height:1.6;">' +
    '  Você pode acompanhar as interações em tempo real diretamente pelo Portal B2B. A cada atualização da nossa equipe técnica, você receberá uma notificação.' +
    '</p>';

  var htmlFinal = comporEmailBase('Confirmação de Abertura: ' + idTicket, conteudo);
  GmailApp.sendEmail(cliente.email_login, '[NOC Telecom] Protocolo de Abertura ' + idTicket + ' - ' + circuito.nome_circuito, '', {
    htmlBody: htmlFinal,
    name: 'NOC Telecom Atendimento'
  });
}

/**
 * 5. Template de Email Comentário do NOC (Para o Cliente)
 */
function enviarEmailComentarioNocParaCliente(cliente, ticket, mensagemNoc, anexoUrl) {
  var conteudo = '' +
    '<h2 style="font-size:20px; font-weight:700; color:#0f172a; margin-top:0; margin-bottom:8px;">Atualização Técnica no Ticket ' + ticket.id_ticket + '</h2>' +
    '<p style="font-size:14px; line-height:1.6; color:#334155; margin-bottom:20px;">' +
    '  Olá <strong>' + cliente.nome_empresa + '</strong>,<br>' +
    '  A equipe de engenharia do NOC adicionou um novo posicionamento no seu chamado:' +
    '</p>' +
    '<div style="background-color:#f8fafc; border-left:4px solid #0284c7; border-radius:0 8px 8px 0; padding:16px 20px; margin-bottom:20px;">' +
    '  <div style="font-size:12px; font-weight:700; color:#0284c7; text-transform:uppercase; margin-bottom:6px;">Parecer Técnico NOC:</div>' +
    '  <div style="font-size:14px; line-height:1.6; color:#0f172a; white-space:pre-wrap;">' + mensagemNoc + '</div>' +
    '</div>' +
    (anexoUrl ? '<div style="margin-bottom:20px;"><a href="' + anexoUrl + '" target="_blank" style="color:#0284c7; font-weight:600; font-size:13px;">📎 Visualizar Anexo Técnico Anexado pelo NOC</a></div>' : '') +
    '<p style="font-size:13px; color:#64748b;">' +
    '  Para responder a este posicionamento, acesse o Portal B2B de Incidentes.' +
    '</p>';

  var htmlFinal = comporEmailBase('Atualização Técnica: ' + ticket.id_ticket, conteudo);
  GmailApp.sendEmail(cliente.email_login, '[NOC Telecom] Atualização no Chamado ' + ticket.id_ticket, '', {
    htmlBody: htmlFinal,
    name: 'NOC Telecom Suporte'
  });
}

/**
 * 6. Template de Email Comentário do Cliente (Para o NOC)
 */
function enviarEmailComentarioClienteParaNoc(cliente, ticket, mensagemCliente, anexoUrl) {
  var config = obterConfiguracoes();
  var conteudo = '' +
    '<div style="background-color:#e0f2fe; color:#0369a1; font-size:11px; font-weight:700; padding:4px 8px; border-radius:4px; display:inline-block; margin-bottom:8px;">RESPOSTA DO CLIENTE B2B</div>' +
    '<h2 style="font-size:20px; font-weight:700; color:#0f172a; margin-top:0; margin-bottom:12px;">Ticket ' + ticket.id_ticket + ' - ' + cliente.nome_empresa + '</h2>' +
    '<div style="background-color:#f8fafc; border-left:4px solid #10b981; border-radius:0 8px 8px 0; padding:16px 20px; margin-bottom:20px;">' +
    '  <div style="font-size:12px; font-weight:700; color:#059669; text-transform:uppercase; margin-bottom:6px;">Mensagem Enviada pelo Cliente:</div>' +
    '  <div style="font-size:14px; line-height:1.6; color:#0f172a; white-space:pre-wrap;">' + mensagemCliente + '</div>' +
    '</div>' +
    (anexoUrl ? '<div style="margin-bottom:20px;"><a href="' + anexoUrl + '" target="_blank" style="color:#0284c7; font-weight:600; font-size:13px;">📎 Anexo enviado pelo cliente</a></div>' : '') +
    '<p style="font-size:12px; color:#64748b;">' +
    '  Status atual do ticket: <strong>' + ticket.status + '</strong>' +
    '</p>';

  var htmlFinal = comporEmailBase('Resposta do Cliente: ' + ticket.id_ticket, conteudo);
  GmailApp.sendEmail(config.EMAIL_NOC, '[RESPOSTA CLIENTE] Ticket ' + ticket.id_ticket + ' - ' + cliente.nome_empresa, '', {
    htmlBody: htmlFinal,
    name: 'Portal Incidentes Bot'
  });
}

/**
 * 7. Template de Email Alerta Crítico SLA Expirado (Para o NOC)
 */
function enviarEmailAlertaSlaNoc(idTicket, nomeCliente, idCircuito, dataExpira) {
  var config = obterConfiguracoes();
  var dataFormatada = formatarData(dataExpira, config.TIMEZONE);

  var conteudo = '' +
    '<div style="background-color:#fee2e2; border:2px solid #ef4444; border-radius:10px; padding:20px; margin-bottom:24px; text-align:center;">' +
    '  <div style="font-size:14px; font-weight:800; color:#b91c1c; text-transform:uppercase; letter-spacing:1px;">⚠️ ALERTA CRÍTICO DE VIOLAÇÃO DE SLA ⚠️</div>' +
    '  <div style="font-size:26px; font-weight:900; color:#7f1d1d; margin:8px 0;">TICKET ' + idTicket + '</div>' +
    '  <div style="font-size:13px; color:#991b1b;">O prazo limite para retorno da pendência expirou sem manifestação do cliente.</div>' +
    '</div>' +
    '<p style="font-size:14px; line-height:1.6; color:#334155;">' +
    '  Ação automatizada do sistema: o status deste chamado foi automaticamente revertido para <strong>[ABERTO]</strong> para que a equipe técnica do NOC retome o tratamento imediato.' +
    '</p>' +
    '<table width="100%" cellpadding="8" cellspacing="0" border="0" style="font-size:13px; border:1px solid #fecaca; border-radius:6px; background-color:#fff5f5; margin-bottom:20px;">' +
    '  <tr>' +
    '    <td width="35%"><strong>Cliente B2B:</strong></td>' +
    '    <td>' + nomeCliente + '</td>' +
    '  </tr>' +
    '  <tr>' +
    '    <td><strong>Circuito:</strong></td>' +
    '    <td>' + idCircuito + '</td>' +
    '  </tr>' +
    '  <tr>' +
    '    <td><strong>Prazo Expirado:</strong></td>' +
    '    <td style="color:#b91c1c; font-weight:700;">' + dataFormatada + '</td>' +
    '  </tr>' +
    '</table>';

  var htmlFinal = comporEmailBase('ALERTA CRÍTICO SLA: ' + idTicket, conteudo);
  GmailApp.sendEmail(config.EMAIL_NOC, '🚨 [SLA EXPIRADO] Ticket ' + idTicket + ' revertido para ABERTO', '', {
    htmlBody: htmlFinal,
    name: 'NOC SLA Monitor'
  });
}

/**
 * Template de Notificação de Mudança de Status (Para o Cliente)
 */
function enviarEmailAtualizacaoStatus(cliente, idTicket, statusAntigo, novoStatus, msgAuditoria) {
  var conteudo = '' +
    '<h2 style="font-size:20px; font-weight:700; color:#0f172a; margin-top:0; margin-bottom:12px;">Alteração de Status no Ticket ' + idTicket + '</h2>' +
    '<p style="font-size:14px; line-height:1.6; color:#334155; margin-bottom:20px;">' +
    '  Prezados da <strong>' + cliente.nome_empresa + '</strong>,<br>' +
    '  Informamos que o status do seu chamado foi atualizado pelo nosso NOC:' +
    '</p>' +
    '<div style="text-align:center; margin:24px 0;">' +
    '  <span style="display:inline-block; background-color:#e2e8f0; color:#475569; padding:8px 16px; border-radius:6px; font-weight:600; font-size:13px;">' + statusAntigo + '</span>' +
    '  <span style="font-size:20px; color:#94a3b8; margin:0 12px;">&rarr;</span>' +
    '  <span style="display:inline-block; background-color:#0284c7; color:#ffffff; padding:8px 16px; border-radius:6px; font-weight:700; font-size:14px;">' + novoStatus + '</span>' +
    '</div>' +
    '<div style="background-color:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:14px; font-size:13px; color:#475569;">' +
    '  <strong>Nota do Operador:</strong> ' + msgAuditoria +
    '</div>';

  var htmlFinal = comporEmailBase('Atualização de Status: ' + idTicket, conteudo);
  GmailApp.sendEmail(cliente.email_login, '[NOC Telecom] Status do Ticket ' + idTicket + ': ' + novoStatus, '', {
    htmlBody: htmlFinal,
    name: 'NOC Telecom Operações'
  });
}

// ========= SEÇÃO 8: FUNÇÕES AUXILIARES OBRIGATÓRIAS =========

/**
 * Retorna o objeto Sheet pelo nome ou lança erro explicativo.
 */
function getSheet(nome) {
  var ss;
  if (SPREADSHEET_ID && SPREADSHEET_ID.trim() !== '') {
    ss = SpreadsheetApp.openById(SPREADSHEET_ID.trim());
  } else {
    ss = SpreadsheetApp.getActiveSpreadsheet();
  }

  if (!ss) {
    throw new Error('Não foi possível conectar ao Google Sheets. Configure a constante SPREADSHEET_ID no topo do código.');
  }

  var sheet = ss.getSheetByName(nome);
  if (!sheet) {
    throw new Error('Aba "' + nome + '" não encontrada na planilha. Verifique a existência da aba na planilha vinculada.');
  }
  return sheet;
}

/**
 * Lê chave-valor da aba CONFIG e mescla com DEFAULT_CONFIG.
 */
function obterConfiguracoes() {
  var config = {};
  // Clona defaults
  for (var k in DEFAULT_CONFIG) {
    config[k] = DEFAULT_CONFIG[k];
  }

  try {
    var sheetConfig = getSheet(SHEETS.CONFIG);
    var dados = sheetConfig.getDataRange().getValues();
    for (var i = 1; i < dados.length; i++) {
      var chave = sanitizarString(dados[i][0]).toUpperCase();
      var valor = dados[i][1];
      if (chave && valor !== '') {
        if (chave === 'SESSAO_TIMEOUT_MIN' || chave === 'OTP_EXPIRA_MIN') {
          config[chave] = parseInt(valor, 10) || config[chave];
        } else {
          config[chave] = valor;
        }
      }
    }
  } catch (err) {
    console.warn('Usando configurações padrão (aba CONFIG não inicializada): ' + err.message);
  }

  return config;
}

/**
 * Gera hash SHA-256 da senha usando Utilities.computeDigest.
 */
function hashSenha(texto) {
  if (!texto) return '';
  var rawHash = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(texto), Utilities.Charset.UTF_8);
  var txtHash = '';
  for (var i = 0; i < rawHash.length; i++) {
    var byteVal = rawHash[i];
    if (byteVal < 0) byteVal += 256;
    var byteHex = byteVal.toString(16);
    if (byteHex.length === 1) byteHex = '0' + byteHex;
    txtHash += byteHex;
  }
  return txtHash;
}

/**
 * Gera código OTP numérico aleatório de 6 dígitos (100000 a 999999).
 */
function gerarCodigoOtpNumerico() {
  var num = Math.floor(100000 + Math.random() * 900000);
  return String(num);
}

/**
 * Gera UUID v4 padrão via Utilities.getUuid().
 */
function gerarUUID() {
  return Utilities.getUuid();
}

/**
 * Gera string alfanumérica aleatória do tamanho especificado.
 */
function gerarStringAleatoria(tamanho) {
  var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#';
  var resultado = '';
  for (var i = 0; i < tamanho; i++) {
    resultado += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return resultado;
}

/**
 * Formata objeto Date com Timezone seguro.
 */
function formatarData(data, timezone) {
  if (!data) return '';
  var tz = timezone || DEFAULT_CONFIG.TIMEZONE;
  var d = (data instanceof Date) ? data : new Date(data);
  if (isNaN(d.getTime())) return String(data);
  return Utilities.formatDate(d, tz, "yyyy-MM-dd'T'HH:mm:ssXXX");
}

/**
 * Sanitiza strings e remove espaços espúrios.
 */
function sanitizarString(str) {
  if (str === null || str === undefined) return '';
  return String(str).trim();
}

/**
 * Produz TextOutput JSON com headers amigáveis a CORS.
 */
function criarRespostaJson(objeto) {
  return ContentService.createTextOutput(JSON.stringify(objeto))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Valida token de sessão na aba SESSOES e calcula tempo restante.
 */
function validarTokenSessao(token) {
  if (!token) {
    return { valida: false, motivo: 'Token de autenticação não fornecido.' };
  }

  var sheetSessoes = getSheet(SHEETS.SESSOES);
  var dados = sheetSessoes.getDataRange().getValues();
  var agora = new Date();

  for (var i = 1; i < dados.length; i++) {
    var tk = sanitizarString(dados[i][0]);
    if (tk === token) {
      var emailCliente = sanitizarString(dados[i][1]).toLowerCase();
      var expiraEm = dados[i][3] ? new Date(dados[i][3]) : null;

      if (!expiraEm || agora.getTime() > expiraEm.getTime()) {
        return { valida: false, motivo: 'Sessão expirada. Realize novo login com OTP.' };
      }

      var minutosRestantes = Math.max(0, Math.round((expiraEm.getTime() - agora.getTime()) / 60000));
      var isMaster = verificarSeMaster(emailCliente);

      return {
        valida: true,
        email: emailCliente,
        is_master: isMaster,
        minutos_restantes: minutosRestantes
      };
    }
  }

  return { valida: false, motivo: 'Token de sessão inválido ou inexistente.' };
}

/**
 * Verifica se um e-mail possui privilégios NOC MASTER.
 */
function verificarSeMaster(email) {
  if (!email) return false;
  var cleanEmail = email.toLowerCase().trim();
  var config = obterConfiguracoes();

  if (cleanEmail === config.EMAIL_NOC.toLowerCase().trim()) {
    return true;
  }

  // Verifica se o ID do cliente é NOC-ADMIN ou prefixo NOC-
  var cliente = obterClientePorEmail(cleanEmail);
  if (cliente && (cliente.id_cliente === 'NOC-ADMIN' || cliente.id_cliente.indexOf('NOC-') === 0)) {
    return true;
  }

  return false;
}

/**
 * Lança erro caso o usuário não seja master.
 */
function garantirAcessoMaster(isMaster) {
  if (!isMaster) {
    throw new Error('Acesso restrito ao Network Operations Center (NOC Master).');
  }
}

/**
 * Busca registro de cliente pelo e-mail na aba CLIENTES.
 */
function obterClientePorEmail(email) {
  if (!email) return null;
  var cleanEmail = email.toLowerCase().trim();
  var sheetClientes = getSheet(SHEETS.CLIENTES);
  var dados = sheetClientes.getDataRange().getValues();

  for (var i = 1; i < dados.length; i++) {
    if (sanitizarString(dados[i][2]).toLowerCase() === cleanEmail) {
      return {
        id_cliente: dados[i][0],
        nome_empresa: dados[i][1],
        email_login: dados[i][2],
        senha_hash: dados[i][3],
        senha_temporaria: dados[i][4] === true || String(dados[i][4]).toUpperCase() === 'TRUE',
        status: sanitizarString(dados[i][5]).toUpperCase(),
        data_criacao: dados[i][6],
        ultimo_login: dados[i][7]
      };
    }
  }
  return null;
}

/**
 * Busca registro de cliente pelo ID (ex: CLI-001).
 */
function obterClientePorId(id) {
  if (!id) return null;
  var cleanId = id.toString().trim();
  var sheetClientes = getSheet(SHEETS.CLIENTES);
  var dados = sheetClientes.getDataRange().getValues();

  for (var i = 1; i < dados.length; i++) {
    if (sanitizarString(dados[i][0]) === cleanId) {
      return {
        id_cliente: dados[i][0],
        nome_empresa: dados[i][1],
        email_login: dados[i][2],
        senha_hash: dados[i][3],
        senha_temporaria: dados[i][4] === true || String(dados[i][4]).toUpperCase() === 'TRUE',
        status: sanitizarString(dados[i][5]).toUpperCase()
      };
    }
  }
  return null;
}

/**
 * Busca circuito pelo ID na aba CIRCUITOS.
 */
function obterCircuitoPorId(idCircuito) {
  if (!idCircuito) return null;
  var cleanId = idCircuito.toString().trim().toUpperCase();
  var sheetCircuitos = getSheet(SHEETS.CIRCUITOS);
  var dados = sheetCircuitos.getDataRange().getValues();

  for (var i = 1; i < dados.length; i++) {
    if (sanitizarString(dados[i][0]).toUpperCase() === cleanId) {
      return {
        id_circuito: dados[i][0],
        id_cliente: dados[i][1],
        nome_circuito: dados[i][2],
        tipo_link: dados[i][3],
        identificador_tecnico: dados[i][4],
        status: sanitizarString(dados[i][5]).toUpperCase()
      };
    }
  }
  return null;
}

/**
 * Busca ticket pelo ID na aba TICKETS.
 */
function obterTicketPorId(idTicket) {
  if (!idTicket) return null;
  var cleanId = idTicket.toString().trim();
  var sheetTickets = getSheet(SHEETS.TICKETS);
  var dados = sheetTickets.getDataRange().getValues();

  for (var i = 1; i < dados.length; i++) {
    if (sanitizarString(dados[i][0]) === cleanId) {
      return {
        id_ticket: dados[i][0],
        id_cliente: dados[i][1],
        id_circuito: dados[i][2],
        tipo_incidente: dados[i][3],
        descricao_inicial: dados[i][4],
        status: dados[i][5],
        data_abertura: dados[i][6],
        data_ultima_atualizacao: dados[i][7],
        data_pendencia_expira: dados[i][8],
        data_fechamento: dados[i][9],
        pasta_drive_anexos: dados[i][10]
      };
    }
  }
  return null;
}

/**
 * Retorna todos os comentários de um ticket ordenados cronologicamente.
 */
function obterComentariosPorTicket(idTicket) {
  var sheetComentarios = getSheet(SHEETS.COMENTARIOS);
  var dados = sheetComentarios.getDataRange().getValues();
  var config = obterConfiguracoes();
  var comentarios = [];

  for (var i = 1; i < dados.length; i++) {
    if (sanitizarString(dados[i][1]) === idTicket) {
      comentarios.push({
        id_comentario: dados[i][0],
        id_ticket: dados[i][1],
        autor_tipo: dados[i][2],
        autor_nome: dados[i][3],
        mensagem: dados[i][4],
        anexo_url: dados[i][5] || '',
        data_hora: formatarData(dados[i][6], config.TIMEZONE),
        data_hora_raw: dados[i][6] ? new Date(dados[i][6]).getTime() : 0
      });
    }
  }

  comentarios.sort(function(a, b) {
    return a.data_hora_raw - b.data_hora_raw;
  });

  return comentarios;
}

/**
 * Retorna dicionário { id_ticket: total_comentarios }
 */
function obterContagemComentarios() {
  var mapa = {};
  try {
    var sheetComentarios = getSheet(SHEETS.COMENTARIOS);
    var dados = sheetComentarios.getDataRange().getValues();
    for (var i = 1; i < dados.length; i++) {
      var idT = sanitizarString(dados[i][1]);
      if (idT) {
        mapa[idT] = (mapa[idT] || 0) + 1;
      }
    }
  } catch (_) {}
  return mapa;
}

/**
 * Mapeia todos os clientes em memória { id_cliente: { nome, email } }
 */
function obterMapaClientes() {
  var mapa = {};
  try {
    var sheet = getSheet(SHEETS.CLIENTES);
    var dados = sheet.getDataRange().getValues();
    for (var i = 1; i < dados.length; i++) {
      var id = sanitizarString(dados[i][0]);
      if (id) {
        mapa[id] = {
          nome: dados[i][1],
          email: dados[i][2]
        };
      }
    }
  } catch (_) {}
  return mapa;
}

/**
 * Mapeia circuitos { id_circuito: { nome, tipo } }
 */
function obterMapaCircuitos() {
  var mapa = {};
  try {
    var sheet = getSheet(SHEETS.CIRCUITOS);
    var dados = sheet.getDataRange().getValues();
    for (var i = 1; i < dados.length; i++) {
      var id = sanitizarString(dados[i][0]);
      if (id) {
        mapa[id] = {
          nome: dados[i][2],
          tipo: dados[i][3]
        };
      }
    }
  } catch (_) {}
  return mapa;
}

/**
 * Gera identificador sequencial de ticket diário no padrão: TK-AAAAMMDD-NNNN (maior do dia + 1).
 */
function gerarIdTicketSequencial() {
  var config = obterConfiguracoes();
  var hojePrefixo = 'TK-' + Utilities.formatDate(new Date(), config.TIMEZONE, 'yyyyMMdd') + '-';

  var sheetTickets = getSheet(SHEETS.TICKETS);
  var dados = sheetTickets.getDataRange().getValues();
  var maiorNumeroDoDia = 0;

  for (var i = 1; i < dados.length; i++) {
    var idAtual = sanitizarString(dados[i][0]);
    if (idAtual.indexOf(hojePrefixo) === 0) {
      var parteSequencial = parseInt(idAtual.substring(hojePrefixo.length), 10);
      if (!isNaN(parteSequencial) && parteSequencial > maiorNumeroDoDia) {
        maiorNumeroDoDia = parteSequencial;
      }
    }
  }

  var proximoNumero = maiorNumeroDoDia + 1;
  var strNumero = String(proximoNumero);
  while (strNumero.length < 4) {
    strNumero = '0' + strNumero;
  }

  return hojePrefixo + strNumero;
}

/**
 * Obtém ou cria a pasta no Google Drive: PortalTickets/{id_ticket}/
 */
function obterOuCriarPastaTicket(idTicket) {
  try {
    var config = obterConfiguracoes();
    var nomePastaRaiz = config.DRIVE_ROOT_FOLDER || 'PortalTickets';

    // Pasta Raiz
    var pastasRaiz = DriveApp.getFoldersByName(nomePastaRaiz);
    var pastaRaiz;
    if (pastasRaiz.hasNext()) {
      pastaRaiz = pastasRaiz.next();
    } else {
      pastaRaiz = DriveApp.createFolder(nomePastaRaiz);
    }

    // Subpasta do ticket
    var subPastas = pastaRaiz.getFoldersByName(idTicket);
    if (subPastas.hasNext()) {
      return subPastas.next();
    }

    return pastaRaiz.createFolder(idTicket);
  } catch (err) {
    console.error('Falha ao obter ou criar pasta no Drive para ' + idTicket + ': ' + err.toString());
    return null;
  }
}

/**
 * Converte anexo Base64 em Blob e salva na pasta do Drive correspondente.
 * CRÍTICO: Não expõe os arquivos publicamente (sem ANYONE_WITH_LINK).
 * Ficam estritamente privados na conta do proprietário do Drive.
 */
function salvarAnexoEmDrive(itemBase64, pasta) {
  if (!itemBase64 || !pasta) return null;
  try {
    var nomeArquivo = itemBase64.nome || ('anexo_' + new Date().getTime() + '.bin');
    var mimeType = itemBase64.tipoMime || 'application/octet-stream';
    var dadosBase64 = itemBase64.base64 || '';

    // Remove eventuais prefixos data:image/png;base64,
    if (dadosBase64.indexOf(',') > -1) {
      dadosBase64 = dadosBase64.split(',')[1];
    }

    var bytes = Utilities.base64Decode(dadosBase64);
    var blob = Utilities.newBlob(bytes, mimeType, nomeArquivo);
    var arquivoCriado = pasta.createFile(blob);

    // REMOVIDO: DriveApp.Access.ANYONE_WITH_LINK para manter os arquivos estritamente privados
    // Retorna o ID do arquivo criado
    return arquivoCriado.getId();
  } catch (err) {
    console.error('Erro ao salvar anexo no Drive: ' + err.toString());
    return null;
  }
}

/**
 * Atualiza o timestamp de modificação de um ticket.
 */
function atualizarDataModificacaoTicket(idTicket, dataHora) {
  try {
    var sheetTickets = getSheet(SHEETS.TICKETS);
    var dados = sheetTickets.getDataRange().getValues();
    for (var i = 1; i < dados.length; i++) {
      if (sanitizarString(dados[i][0]) === idTicket) {
        sheetTickets.getRange(i + 1, 8).setValue(dataHora);
        break;
      }
    }
  } catch (err) {
    console.error('Erro ao atualizar data de modificação: ' + err.toString());
  }
}

// ========= SEÇÃO 9: AUDITORIA E SEGURANÇA DA PLANILHA =========

/**
 * DESATIVADA POR SEGURANÇA: Esta rotina foi permanentemente desativada com sufixo _
 * para preservar integralmente a estrutura existente, dados operacionais e contas cadastradas.
 * Nenhuma alteração destrutiva é permitida.
 */
function criarEstruturaPlanilha_() {
  throw new Error('A função criarEstruturaPlanilha foi permanentemente desativada para proteger os dados de produção e contas da planilha.');
}

/**
 * Verificação SOMENTE-LEITURA opcional das abas e cabeçalhos da planilha (não modifica nem apaga nada).
 * @returns {Object} Relatório de inspeção das abas e contagem de linhas
 */
function verificarEstruturaPlanilhaSomenteLeitura_() {
  var ss;
  if (SPREADSHEET_ID && SPREADSHEET_ID.trim() !== '') {
    ss = SpreadsheetApp.openById(SPREADSHEET_ID.trim());
  } else {
    ss = SpreadsheetApp.getActiveSpreadsheet();
  }

  if (!ss) {
    throw new Error('Planilha não encontrada. Verifique o SPREADSHEET_ID.');
  }

  var abasObrigatorias = [
    SHEETS.CONFIG,
    SHEETS.CLIENTES,
    SHEETS.CIRCUITOS,
    SHEETS.TICKETS,
    SHEETS.COMENTARIOS,
    SHEETS.SESSOES,
    SHEETS.OTPS
  ];

  var relatorio = {
    planilhaId: ss.getId(),
    planilhaNome: ss.getName(),
    abasEncontradas: [],
    abasAusentes: []
  };

  for (var i = 0; i < abasObrigatorias.length; i++) {
    var nomeAba = abasObrigatorias[i];
    var sheet = ss.getSheetByName(nomeAba);
    if (sheet) {
      var ultimaLinha = sheet.getLastRow();
      var ultimaColuna = sheet.getLastColumn();
      var cabecalhos = (ultimaLinha > 0 && ultimaColuna > 0)
        ? sheet.getRange(1, 1, 1, ultimaColuna).getValues()[0]
        : [];
      relatorio.abasEncontradas.push({
        aba: nomeAba,
        totalLinhas: ultimaLinha,
        cabecalhos: cabecalhos
      });
    } else {
      relatorio.abasAusentes.push(nomeAba);
    }
  }

  return relatorio;
}
`;
