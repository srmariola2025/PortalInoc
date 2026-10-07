import React, { useState, useEffect } from 'react';
import {
  Server,
  Database,
  Mail,
  ShieldCheck,
  FileCode,
  Terminal,
  Play,
  Copy,
  Check,
  Download,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  AlertTriangle,
  Clock,
  Key,
  Users,
  Activity,
  Send,
  Layers,
  Settings,
  HelpCircle,
  FileSpreadsheet
} from 'lucide-react';
import { CODE_GS_RAW } from './codeGsSource';
import { comporEmailHtml, DEFAULT_PREVIEW_DATA } from './emailTemplates';
import { mockBackend } from './simulator';

export default function App() {
  const [activeTab, setActiveTab] = useState<'codegs' | 'tester' | 'emails' | 'database' | 'deploy'>('codegs');
  const [copiedCode, setCopiedCode] = useState(false);

  // Parâmetros customizáveis para gerar Code.gs personalizado
  const [customConfig, setCustomConfig] = useState({
    spreadsheetId: '',
    emailNoc: 'inoc@meo.pt',
    nomeEmpresa: 'Telecom NOC Operations',
    logoUrl: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=300&q=80',
    sessaoTimeout: 15,
    otpExpira: 10,
    timezone: 'America/Sao_Paulo',
    driveRootFolder: 'PortalTickets'
  });

  // Código GS gerado com base nas variáveis customizadas
  const getCustomizedCodeGs = () => {
    let code = CODE_GS_RAW;
    if (customConfig.spreadsheetId.trim()) {
      code = code.replace(
        /var SPREADSHEET_ID = '';/,
        `var SPREADSHEET_ID = '${customConfig.spreadsheetId.trim()}';`
      );
    }
    code = code.replace(
      /EMAIL_NOC: 'inoc@meo\.pt',/,
      `EMAIL_NOC: '${customConfig.emailNoc}',`
    );
    code = code.replace(
      /NOME_EMPRESA: 'Telecom NOC Operations',/,
      `NOME_EMPRESA: '${customConfig.nomeEmpresa}',`
    );
    code = code.replace(
      /LOGO_URL: '.*?',/,
      `LOGO_URL: '${customConfig.logoUrl}',`
    );
    code = code.replace(
      /SESSAO_TIMEOUT_MIN: 15,/,
      `SESSAO_TIMEOUT_MIN: ${customConfig.sessaoTimeout},`
    );
    code = code.replace(
      /OTP_EXPIRA_MIN: 10,/,
      `OTP_EXPIRA_MIN: ${customConfig.otpExpira},`
    );
    return code;
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(getCustomizedCodeGs());
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleDownloadCode = () => {
    const blob = new Blob([getCustomizedCodeGs()], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Code.gs';
    a.click();
    URL.revokeObjectURL(url);
  };

  // State para o API Tester
  const [testerMode, setTesterMode] = useState<'simulator' | 'live'>('simulator');
  const [liveWebAppUrl, setLiveWebAppUrl] = useState('');
  const [selectedAction, setSelectedAction] = useState('ping');
  const [activeSessionToken, setActiveSessionToken] = useState('');
  const [currentUserEmail, setCurrentUserEmail] = useState('');
  const [isMasterUser, setIsMasterUser] = useState(false);
  const [requestPayload, setRequestPayload] = useState('{}');
  const [responseResult, setResponseResult] = useState<any>(null);
  const [isLoadingApi, setIsLoadingApi] = useState(false);
  const [lastOtpGenerated, setLastOtpGenerated] = useState<string | null>(null);

  // Ações predefinidas para facilitar testes rápidos
  const sampleActions: Record<string, { desc: string; payload: any; requiresToken?: boolean; requiresMaster?: boolean }> = {
    ping: {
      desc: 'Verifica status da API e timestamp do servidor',
      payload: {}
    },
    solicitar_login: {
      desc: 'Etapa 1: Valida credenciais e gera OTP 6 dígitos por email',
      payload: { email: 'cliente@exemplo.com', senha: 'Cliente@2026' }
    },
    validar_otp: {
      desc: 'Etapa 2: Valida OTP de 6 dígitos e gera token de sessão de 15 min',
      payload: { email: 'cliente@exemplo.com', otp: '123456' }
    },
    recuperar_senha: {
      desc: 'Gera senha temporária de 8 caracteres e força troca no login',
      payload: { email: 'cliente@exemplo.com' }
    },
    trocar_senha_temporaria: {
      desc: 'Substitui senha temporária por nova definitiva',
      payload: { email: 'cliente@exemplo.com', senha_temp: 'TEMP1234', nova_senha: 'MinhaNovaSenha@2026' }
    },
    validar_sessao: {
      desc: 'Checa validade do token de sessão atual e tempo restante',
      payload: {},
      requiresToken: true
    },
    listar_meus_circuitos: {
      desc: 'Lista circuitos ativos do cliente B2B autenticado',
      payload: {},
      requiresToken: true
    },
    listar_meus_tickets: {
      desc: 'Lista tickets do cliente ordenados com contagem de respostas',
      payload: {},
      requiresToken: true
    },
    abrir_ticket: {
      desc: 'Abre ticket de incidente com validação de circuito e pasta Drive',
      payload: {
        id_circuito: 'CIRC-SP-001',
        tipo_incidente: 'CORTE_TOTAL',
        descricao: 'Link principal de fibra fora de operação. Alarme de perda ótica no DIO matriz.',
        anexos_base64: []
      },
      requiresToken: true
    },
    ver_ticket: {
      desc: 'Visualiza detalhes e histórico CRM do chamado',
      payload: { id_ticket: 'TK-20261007-0001' },
      requiresToken: true
    },
    comentar_ticket: {
      desc: 'Cliente adiciona comentário técnico no ticket',
      payload: { id_ticket: 'TK-20261007-0001', mensagem: 'Testamos a ponta B e permanece sem luz. Aguardando chegada do técnico.' },
      requiresToken: true
    },
    listar_todos_tickets: {
      desc: 'NOC Master: Lista todos os tickets da operadora com filtros',
      payload: { status: 'EM_RESOLUCAO' },
      requiresToken: true,
      requiresMaster: true
    },
    alterar_status: {
      desc: 'NOC Master: Altera status (PENDENTE exige data_pendencia_expira)',
      payload: {
        id_ticket: 'TK-20261007-0001',
        novo_status: 'PENDENTE',
        data_pendencia_expira: new Date(Date.now() + 4 * 3600000).toISOString()
      },
      requiresToken: true,
      requiresMaster: true
    },
    comentar_master: {
      desc: 'NOC Master: Comentário técnico com disparo de e-mail ao cliente',
      payload: {
        id_ticket: 'TK-20261007-0001',
        mensagem: 'Técnico realizou fusão no km 14. Níveis óticos normalizados em -18dBm. Favor testar.'
      },
      requiresToken: true,
      requiresMaster: true
    },
    reabrir_ticket: {
      desc: 'NOC Master: Reabre ticket RESOLVIDO se fechado no mesmo dia civil',
      payload: { id_ticket: 'TK-20261007-0002' },
      requiresToken: true,
      requiresMaster: true
    },
    importar_base_csv: {
      desc: 'NOC Master: Importação em lote (UPSERT delimitado por ;)',
      payload: {
        tipo: 'clientes',
        csv_texto: 'id_cliente;nome_empresa;email_login;senha_inicial;status\nCLI-002;Tech Logistica SA;suporte@techlog.com;Tech@2026;ATIVO'
      },
      requiresToken: true,
      requiresMaster: true
    }
  };

  const handleSelectAction = (actKey: string) => {
    setSelectedAction(actKey);
    const defaultPayload = sampleActions[actKey]?.payload || {};
    // Se for validar_otp e tivermos um OTP capturado, preenche automaticamente
    if (actKey === 'validar_otp' && lastOtpGenerated) {
      defaultPayload.otp = lastOtpGenerated;
      defaultPayload.email = currentUserEmail || 'cliente@exemplo.com';
    }
    setRequestPayload(JSON.stringify(defaultPayload, null, 2));
  };

  const handleExecuteApi = async () => {
    setIsLoadingApi(true);
    setResponseResult(null);

    let parsedPayload = {};
    try {
      parsedPayload = JSON.parse(requestPayload);
    } catch (e: any) {
      setResponseResult({ sucesso: false, erro: 'Payload JSON inválido: ' + e.message });
      setIsLoadingApi(false);
      return;
    }

    try {
      if (testerMode === 'simulator') {
        // Executa no simulador local em memória
        const res = await mockBackend.execute(selectedAction, parsedPayload, activeSessionToken);
        setResponseResult(res);

        if (res.otp_simulado) {
          setLastOtpGenerated(res.otp_simulado);
        }
        if (res.token) {
          setActiveSessionToken(res.token);
          setCurrentUserEmail(res.cliente?.email || '');
          setIsMasterUser(!!res.cliente?.is_master);
        }
      } else {
        // Executa via requisição real para o Google Apps Script Web App
        if (!liveWebAppUrl.trim()) {
          setResponseResult({ sucesso: false, erro: 'Informe a URL do Web App do Google Apps Script publicado.' });
          setIsLoadingApi(false);
          return;
        }

        const bodyData = {
          action: selectedAction,
          payload: parsedPayload,
          token: activeSessionToken
        };

        const response = await fetch(liveWebAppUrl.trim(), {
          method: 'POST',
          headers: {
            'Content-Type': 'text/plain;charset=utf-8' // Content-Type recomendado para evitar CORS preflight no Apps Script
          },
          body: JSON.stringify(bodyData)
        });

        const json = await response.json();
        setResponseResult(json);

        if (json.token) {
          setActiveSessionToken(json.token);
          setCurrentUserEmail(json.cliente?.email || '');
          setIsMasterUser(!!json.cliente?.is_master);
        }
      }
    } catch (err: any) {
      setResponseResult({
        sucesso: false,
        erro: 'Erro de comunicação: ' + (err.message || String(err)),
        dica: 'Lembre-se de configurar o Web App com permissão "Qualquer pessoa" e permitir redirecionamentos.'
      });
    } finally {
      setIsLoadingApi(false);
    }
  };

  // State para o Email Template Inspector
  const [selectedEmailType, setSelectedEmailType] = useState('otp');
  const [emailPreviewData, setEmailPreviewData] = useState(DEFAULT_PREVIEW_DATA);
  const [emailViewport, setEmailViewport] = useState<'desktop' | 'mobile'>('desktop');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-50 px-6 py-3.5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/20 text-white font-bold">
            <Server className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-lg text-white tracking-tight">NOC Telecom Operations</h1>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 font-medium">
                Backend Google Apps Script
              </span>
            </div>
            <p className="text-xs text-slate-400">
              API RESTful • Google Sheets 7 Abas • Autenticação 2FA OTP • SLA Crítico Automático
            </p>
          </div>
        </div>

        {/* Quick action buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleCopyCode}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow transition cursor-pointer"
          >
            {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
            {copiedCode ? 'Copiado!' : 'Copiar Code.gs'}
          </button>
          <button
            onClick={handleDownloadCode}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Baixar Code.gs
          </button>
        </div>
      </header>

      {/* Main Navigation Tabs */}
      <div className="bg-slate-900 border-b border-slate-800 px-6">
        <div className="flex space-x-1 sm:space-x-4 overflow-x-auto">
          <button
            onClick={() => setActiveTab('codegs')}
            className={`py-3 px-3 text-xs sm:text-sm font-semibold border-b-2 flex items-center gap-2 transition cursor-pointer whitespace-nowrap ${
              activeTab === 'codegs'
                ? 'border-sky-500 text-sky-400 bg-sky-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileCode className="w-4 h-4" />
            Código Code.gs & Customizador
          </button>
          <button
            onClick={() => setActiveTab('tester')}
            className={`py-3 px-3 text-xs sm:text-sm font-semibold border-b-2 flex items-center gap-2 transition cursor-pointer whitespace-nowrap ${
              activeTab === 'tester'
                ? 'border-sky-500 text-sky-400 bg-sky-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="w-4 h-4" />
            Sandbox & Testador da API REST
          </button>
          <button
            onClick={() => setActiveTab('emails')}
            className={`py-3 px-3 text-xs sm:text-sm font-semibold border-b-2 flex items-center gap-2 transition cursor-pointer whitespace-nowrap ${
              activeTab === 'emails'
                ? 'border-sky-500 text-sky-400 bg-sky-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Mail className="w-4 h-4" />
            Templates de E-mail HTML (7)
          </button>
          <button
            onClick={() => setActiveTab('database')}
            className={`py-3 px-3 text-xs sm:text-sm font-semibold border-b-2 flex items-center gap-2 transition cursor-pointer whitespace-nowrap ${
              activeTab === 'database'
                ? 'border-sky-500 text-sky-400 bg-sky-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Database className="w-4 h-4" />
            Arquitetura Google Sheets (7 Abas)
          </button>
          <button
            onClick={() => setActiveTab('deploy')}
            className={`py-3 px-3 text-xs sm:text-sm font-semibold border-b-2 flex items-center gap-2 transition cursor-pointer whitespace-nowrap ${
              activeTab === 'deploy'
                ? 'border-sky-500 text-sky-400 bg-sky-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            Guia de Deploy & Triggers SLA
          </button>
        </div>
      </div>

      {/* Content Body */}
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
        {/* ================= TAB 1: CODE.GS & CUSTOMIZADOR ================= */}
        {activeTab === 'codegs' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <Settings className="w-4 h-4 text-sky-400" />
                    Gerador e Customizador Dinâmico do Code.gs
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Preencha os dados da sua operação para injetar automaticamente no topo do código antes de copiar para o Apps Script.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                    Linhas: ~900 • 100% Funcional
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2 border-t border-slate-800/80">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    SPREADSHEET_ID
                  </label>
                  <input
                    type="text"
                    value={customConfig.spreadsheetId}
                    onChange={(e) => setCustomConfig({ ...customConfig, spreadsheetId: e.target.value })}
                    placeholder="Deixe em branco p/ planilha ativa"
                    className="w-full bg-slate-950 border border-slate-750 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                  />
                  <span className="text-[10px] text-slate-400">ID da URL da planilha</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    EMAIL_NOC (Operador Master)
                  </label>
                  <input
                    type="email"
                    value={customConfig.emailNoc}
                    onChange={(e) => setCustomConfig({ ...customConfig, emailNoc: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-750 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500"
                  />
                  <span className="text-[10px] text-slate-400">Receberá alertas críticos e SLA</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    NOME_EMPRESA
                  </label>
                  <input
                    type="text"
                    value={customConfig.nomeEmpresa}
                    onChange={(e) => setCustomConfig({ ...customConfig, nomeEmpresa: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-750 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500"
                  />
                  <span className="text-[10px] text-slate-400">Exibido nos cabeçalhos de e-mail</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Timeout da Sessão / OTP (min)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={customConfig.sessaoTimeout}
                      onChange={(e) => setCustomConfig({ ...customConfig, sessaoTimeout: parseInt(e.target.value) || 15 })}
                      className="w-1/2 bg-slate-950 border border-slate-750 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500"
                    />
                    <input
                      type="number"
                      value={customConfig.otpExpira}
                      onChange={(e) => setCustomConfig({ ...customConfig, otpExpira: parseInt(e.target.value) || 10 })}
                      className="w-1/2 bg-slate-950 border border-slate-750 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400">Sessão: 15 min | OTP: 10 min</span>
                </div>
              </div>
            </div>

            {/* Code Box */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
              <div className="bg-slate-950/70 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500/80" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                  <span className="text-xs font-mono text-slate-400 ml-2">Code.gs (Google Apps Script)</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyCode}
                    className="flex items-center gap-1.5 text-xs text-sky-400 hover:text-sky-300 transition px-2.5 py-1 rounded bg-sky-500/10 cursor-pointer"
                  >
                    {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedCode ? 'Copiado para Área de Transferência!' : 'Copiar Tudo'}
                  </button>
                </div>
              </div>

              <div className="relative">
                <pre className="p-4 text-xs font-mono text-slate-300 overflow-x-auto max-h-[640px] leading-relaxed selection:bg-sky-900 selection:text-white">
                  <code>{getCustomizedCodeGs()}</code>
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 2: API SANDBOX & LIVE TESTER ================= */}
        {activeTab === 'tester' && (
          <div className="space-y-6">
            {/* Modo de Execução */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-sky-400" />
                    Ambiente de Execução das Requisições
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Você pode rodar no simulador em memória local ou apontar diretamente para seu Web App no Google Apps Script.
                  </p>
                </div>

                <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-lg border border-slate-800">
                  <button
                    onClick={() => setTesterMode('simulator')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-md transition cursor-pointer ${
                      testerMode === 'simulator'
                        ? 'bg-sky-600 text-white shadow'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    ⚡ Simulador Local (Sem Deploy)
                  </button>
                  <button
                    onClick={() => setTesterMode('live')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-md transition cursor-pointer ${
                      testerMode === 'live'
                        ? 'bg-emerald-600 text-white shadow'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    🌐 Web App Google Publicado (Live)
                  </button>
                </div>
              </div>

              {testerMode === 'live' && (
                <div className="mt-4 pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center gap-3">
                  <label className="text-xs font-medium text-slate-300 shrink-0">URL do Web App:</label>
                  <input
                    type="url"
                    value={liveWebAppUrl}
                    onChange={(e) => setLiveWebAppUrl(e.target.value)}
                    placeholder="https://script.google.com/macros/s/AKfycbx.../exec"
                    className="flex-1 w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              )}
            </div>

            {/* Sessão ativa e atalhos rápidos */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <Key className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-200 flex items-center gap-2">
                    <span>Sessão Atual:</span>
                    {activeSessionToken ? (
                      <span className="font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded text-[11px] border border-emerald-500/20">
                        {currentUserEmail} {isMasterUser && '👑 (NOC Master)'}
                      </span>
                    ) : (
                      <span className="text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded text-[11px]">
                        Não Autenticado (Apenas ações públicas liberadas)
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] font-mono text-slate-500 truncate max-w-md">
                    Token: {activeSessionToken || 'nenhum'}
                  </div>
                </div>
              </div>

              {/* Botões rápidos de login demo */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    handleSelectAction('solicitar_login');
                    setRequestPayload(JSON.stringify({ email: 'cliente@exemplo.com', senha: 'Cliente@2026' }, null, 2));
                  }}
                  className="px-2.5 py-1 text-xs font-medium rounded bg-slate-800 hover:bg-slate-700 text-sky-400 border border-slate-700 cursor-pointer"
                >
                  Credencial Demo Cliente
                </button>
                <button
                  onClick={() => {
                    handleSelectAction('solicitar_login');
                    setRequestPayload(JSON.stringify({ email: 'inoc@meo.pt', senha: 'NocAdmin@2026' }, null, 2));
                  }}
                  className="px-2.5 py-1 text-xs font-medium rounded bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 cursor-pointer"
                >
                  Credencial Demo NOC Master
                </button>
                {activeSessionToken && (
                  <button
                    onClick={() => {
                      setActiveSessionToken('');
                      setCurrentUserEmail('');
                      setIsMasterUser(false);
                    }}
                    className="px-2 py-1 text-xs font-medium rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 cursor-pointer"
                  >
                    Limpar Sessão
                  </button>
                )}
              </div>
            </div>

            {/* Duas Colunas: Seleção de Endpoint & Payload e Resposta */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Esquerda: Catálogo de Endpoints e Requisição */}
              <div className="lg:col-span-6 space-y-4">
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                  <label className="block text-xs font-bold text-slate-300 mb-2 uppercase tracking-wider">
                    Selecione a Ação REST (action):
                  </label>
                  <select
                    value={selectedAction}
                    onChange={(e) => handleSelectAction(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500 font-mono"
                  >
                    <optgroup label="Ações Públicas (Sem Token)">
                      <option value="ping">ping - Teste de conectividade</option>
                      <option value="solicitar_login">solicitar_login - Login Etapa 1 (Email+Senha & OTP)</option>
                      <option value="validar_otp">validar_otp - Login Etapa 2 (Código 6 dígitos & Token)</option>
                      <option value="recuperar_senha">recuperar_senha - Envio de senha temporária</option>
                      <option value="trocar_senha_temporaria">trocar_senha_temporaria - Troca obrigatória</option>
                    </optgroup>
                    <optgroup label="Ações Privadas B2B (Exigem Token)">
                      <option value="validar_sessao">validar_sessao - Status da sessão e minutos</option>
                      <option value="listar_meus_circuitos">listar_meus_circuitos - Circuitos ativos do cliente</option>
                      <option value="listar_meus_tickets">listar_meus_tickets - Chamados do cliente</option>
                      <option value="abrir_ticket">abrir_ticket - Registro de novo incidente</option>
                      <option value="ver_ticket">ver_ticket - Detalhes e linha do tempo</option>
                      <option value="comentar_ticket">comentar_ticket - Adicionar comentário cliente</option>
                    </optgroup>
                    <optgroup label="Ações NOC Master (Exigem is_master=true)">
                      <option value="listar_todos_tickets">listar_todos_tickets - Todos os tickets c/ filtros</option>
                      <option value="alterar_status">alterar_status - Alteração de status e SLA</option>
                      <option value="comentar_master">comentar_master - Parecer técnico NOC</option>
                      <option value="reabrir_ticket">reabrir_ticket - Reabertura no mesmo dia</option>
                      <option value="importar_base_csv">importar_base_csv - Carga em lote (UPSERT)</option>
                    </optgroup>
                  </select>

                  <p className="text-xs text-sky-400 mt-2 font-medium">
                    {sampleActions[selectedAction]?.desc}
                  </p>
                </div>

                {/* Editor do Payload */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Payload JSON da Requisição:
                    </label>
                    <span className="text-[11px] text-slate-500 font-mono">
                      POST body: &#123; action, payload, token &#125;
                    </span>
                  </div>
                  <textarea
                    rows={8}
                    value={requestPayload}
                    onChange={(e) => setRequestPayload(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-750 rounded-lg p-3 text-xs font-mono text-slate-200 focus:outline-none focus:border-sky-500 leading-relaxed"
                  />

                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {sampleActions[selectedAction]?.requiresToken && (
                        <span className="text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded">
                          Requer Token
                        </span>
                      )}
                      {sampleActions[selectedAction]?.requiresMaster && (
                        <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded">
                          Requer NOC Master
                        </span>
                      )}
                    </div>
                    <button
                      onClick={handleExecuteApi}
                      disabled={isLoadingApi}
                      className="flex items-center gap-2 px-5 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-semibold text-xs shadow-md shadow-sky-600/30 transition cursor-pointer"
                    >
                      {isLoadingApi ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                      Executar Requisição
                    </button>
                  </div>
                </div>

                {/* Teste dos Triggers no Simulador */}
                {testerMode === 'simulator' && (
                  <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
                    <span className="text-xs font-bold text-slate-300 block mb-2">
                      Testar Triggers Automáticos do Sistema no Simulador:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => {
                          const r = mockBackend.triggerVerificarSLA();
                          setResponseResult({
                            sucesso: true,
                            mensagem: `Trigger verificarSLAPendentes executado. Tickets com SLA expirado revertidos para ABERTO: ${r.revertidos}`,
                            tickets_afetados: r.tickets
                          });
                        }}
                        className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs border border-slate-700 cursor-pointer"
                      >
                        ⏱️ Executar verificarSLAPendentes()
                      </button>
                      <button
                        onClick={() => {
                          const r = mockBackend.triggerLimparExpirados();
                          setResponseResult({
                            sucesso: true,
                            mensagem: `Trigger limparSessoesExpiradas executado. Sessões removidas: ${r.sessoesLimpas}, OTPs removidos: ${r.otpsLimpos}`
                          });
                        }}
                        className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs border border-slate-700 cursor-pointer"
                      >
                        🧹 Executar limparSessoesExpiradas()
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Direita: Resposta do Servidor */}
              <div className="lg:col-span-6">
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 h-full flex flex-col">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                      Resposta JSON (Response)
                      {responseResult && (
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded font-mono ${
                            responseResult.sucesso
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-red-500/10 text-red-400 border border-red-500/20'
                          }`}
                        >
                          {responseResult.sucesso ? 'STATUS 200 OK' : 'ERRO / REJEITADO'}
                        </span>
                      )}
                    </label>
                    {responseResult && (
                      <button
                        onClick={() => navigator.clipboard.writeText(JSON.stringify(responseResult, null, 2))}
                        className="text-[11px] text-sky-400 hover:text-sky-300 cursor-pointer"
                      >
                        Copiar JSON
                      </button>
                    )}
                  </div>

                  <div className="flex-1 bg-slate-950 border border-slate-750 rounded-lg p-3 overflow-auto min-h-[340px]">
                    {responseResult ? (
                      <pre className="text-xs font-mono text-emerald-300 leading-relaxed whitespace-pre-wrap">
                        {JSON.stringify(responseResult, null, 2)}
                      </pre>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs text-center p-6">
                        <Terminal className="w-8 h-8 mb-2 opacity-30 text-slate-400" />
                        Selecione uma ação à esquerda e clique em <strong>Executar Requisição</strong>.
                        <br />
                        O JSON de retorno do Google Apps Script ou do Simulador será exibido aqui.
                      </div>
                    )}
                  </div>

                  {/* Dica de OTP capturado */}
                  {lastOtpGenerated && (
                    <div className="mt-3 p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-xs text-emerald-300 flex items-center justify-between">
                      <div>
                        <strong>Código OTP Capturado:</strong>{' '}
                        <span className="font-mono text-white bg-emerald-800/60 px-2 py-0.5 rounded ml-1 tracking-widest font-bold">
                          {lastOtpGenerated}
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          handleSelectAction('validar_otp');
                          setRequestPayload(
                            JSON.stringify(
                              { email: currentUserEmail || 'cliente@exemplo.com', otp: lastOtpGenerated },
                              null,
                              2
                            )
                          );
                        }}
                        className="text-[11px] text-emerald-200 underline font-semibold cursor-pointer"
                      >
                        Auto-preencher em validar_otp &rarr;
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 3: TEMPLATES DE E-MAIL HTML ================= */}
        {activeTab === 'emails' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Mail className="w-4 h-4 text-sky-400" />
                  Visualizador Interativo dos 7 Templates HTML Responsivos
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Templates com design institucional navy/slate, mobile-friendly, tabelas estilizadas e rodapé 24x7.
                </p>
              </div>

              {/* Seletor de template e viewport */}
              <div className="flex items-center gap-3">
                <select
                  value={selectedEmailType}
                  onChange={(e) => setSelectedEmailType(e.target.value)}
                  className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500"
                >
                  <option value="otp">1. Código de Autenticação OTP (2FA)</option>
                  <option value="recuperacao_senha">2. Senha Temporária / Redefinição</option>
                  <option value="novo_ticket_noc">3. Alerta Novo Ticket (NOC)</option>
                  <option value="confirmacao_cliente">4. Confirmação de Abertura (Cliente)</option>
                  <option value="comentario_noc">5. Posicionamento Técnico NOC (Cliente)</option>
                  <option value="comentario_cliente">6. Resposta do Cliente B2B (NOC)</option>
                  <option value="alerta_sla">7. Alerta Crítico SLA Expirado (NOC)</option>
                </select>

                <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
                  <button
                    onClick={() => setEmailViewport('desktop')}
                    className={`px-2.5 py-1 rounded transition cursor-pointer ${
                      emailViewport === 'desktop' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Desktop
                  </button>
                  <button
                    onClick={() => setEmailViewport('mobile')}
                    className={`px-2.5 py-1 rounded transition cursor-pointer ${
                      emailViewport === 'mobile' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Mobile (380px)
                  </button>
                </div>
              </div>
            </div>

            {/* Container do Preview do Email */}
            <div className="flex justify-center bg-slate-950 p-6 rounded-2xl border border-slate-800 shadow-inner">
              <div
                className={`transition-all duration-300 overflow-hidden rounded-xl border border-slate-700 shadow-2xl bg-white ${
                  emailViewport === 'mobile' ? 'w-[390px]' : 'w-full max-w-[680px]'
                }`}
              >
                <div className="bg-slate-800 px-4 py-2 flex items-center justify-between text-xs text-slate-300 border-b border-slate-700">
                  <span className="font-mono text-[11px] truncate">
                    Assunto simulado: [NOC Telecom] Notificação Automática
                  </span>
                  <span className="text-[10px] bg-slate-700 px-2 py-0.5 rounded text-slate-300">
                    Render HTML nativo
                  </span>
                </div>
                <iframe
                  title="Email Preview"
                  srcDoc={comporEmailHtml(selectedEmailType, emailPreviewData)}
                  className="w-full h-[620px] border-none bg-[#f1f5f9]"
                />
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 4: ARQUITETURA GOOGLE SHEETS ================= */}
        {activeTab === 'database' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Database className="w-4 h-4 text-sky-400" />
                Estrutura Relacional do Banco de Dados no Google Sheets (7 Abas)
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Todas as 7 abas são provisionadas com formatação de cabeçalho corporativo (#0F172A), linha 1 congelada e integridade de chaves.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {/* ABA 1: CONFIG */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
                  <span className="font-bold text-xs text-sky-400 font-mono">1. ABA CONFIG</span>
                  <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded">Chave-Valor</span>
                </div>
                <ul className="text-xs space-y-1.5 text-slate-300 font-mono">
                  <li><strong className="text-white">A: CHAVE</strong> (SPREADSHEET_ID, EMAIL_NOC, etc)</li>
                  <li><strong className="text-white">B: VALOR</strong> (Configurações operacionais)</li>
                </ul>
              </div>

              {/* ABA 2: CLIENTES */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
                  <span className="font-bold text-xs text-sky-400 font-mono">2. ABA CLIENTES</span>
                  <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded">8 Colunas</span>
                </div>
                <ul className="text-xs space-y-1.5 text-slate-300 font-mono">
                  <li><strong>A: id_cliente</strong> (PK - CLI-001, NOC-ADMIN)</li>
                  <li><strong>B: nome_empresa</strong> (Razão Social)</li>
                  <li><strong>C: email_login</strong> (Chave única de login)</li>
                  <li><strong>D: senha_hash</strong> (SHA-256)</li>
                  <li><strong>E: senha_temporaria</strong> (boolean - força troca)</li>
                  <li><strong>F: status</strong> (ATIVO / INATIVO)</li>
                  <li><strong>G: data_criacao</strong> | <strong>H: ultimo_login</strong></li>
                </ul>
              </div>

              {/* ABA 3: CIRCUITOS */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
                  <span className="font-bold text-xs text-sky-400 font-mono">3. ABA CIRCUITOS</span>
                  <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded">6 Colunas</span>
                </div>
                <ul className="text-xs space-y-1.5 text-slate-300 font-mono">
                  <li><strong>A: id_circuito</strong> (PK única)</li>
                  <li><strong>B: id_cliente</strong> (FK para CLIENTES)</li>
                  <li><strong>C: nome_circuito</strong> (Nome amigável)</li>
                  <li><strong>D: tipo_link</strong> (Fibra, Radio, DSL)</li>
                  <li><strong>E: identificador_tecnico</strong> (IP/VLAN)</li>
                  <li><strong>F: status</strong> (ATIVO / INATIVO)</li>
                </ul>
              </div>

              {/* ABA 4: TICKETS */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
                  <span className="font-bold text-xs text-sky-400 font-mono">4. ABA TICKETS</span>
                  <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded">11 Colunas</span>
                </div>
                <ul className="text-xs space-y-1 text-slate-300 font-mono text-[11px]">
                  <li><strong>A: id_ticket</strong> (TK-AAAAMMDD-NNNN diário)</li>
                  <li><strong>B: id_cliente</strong> | <strong>C: id_circuito</strong> (FKs)</li>
                  <li><strong>D: tipo_incidente</strong> (CORTE_TOTAL, etc)</li>
                  <li><strong>E: descricao_inicial</strong> (min 20 chars)</li>
                  <li><strong>F: status</strong> (ABERTO, EM_RESOLUCAO, PENDENTE, RESOLVIDO)</li>
                  <li><strong>G: data_abertura</strong> | <strong>H: data_ultima_atualizacao</strong></li>
                  <li><strong>I: data_pendencia_expira</strong> (SLA)</li>
                  <li><strong>J: data_fechamento</strong> | <strong>K: pasta_drive_anexos</strong></li>
                </ul>
              </div>

              {/* ABA 5: COMENTARIOS */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
                  <span className="font-bold text-xs text-sky-400 font-mono">5. ABA COMENTARIOS</span>
                  <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded">7 Colunas</span>
                </div>
                <ul className="text-xs space-y-1.5 text-slate-300 font-mono">
                  <li><strong>A: id_comentario</strong> (UUID v4)</li>
                  <li><strong>B: id_ticket</strong> (FK para TICKETS)</li>
                  <li><strong>C: autor_tipo</strong> (CLIENTE / NOC)</li>
                  <li><strong>D: autor_nome</strong></li>
                  <li><strong>E: mensagem</strong> (Trilha CRM de auditoria)</li>
                  <li><strong>F: anexo_url</strong> | <strong>G: data_hora</strong></li>
                </ul>
              </div>

              {/* ABA 6 e 7: SESSOES & OTPS */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
                  <span className="font-bold text-xs text-sky-400 font-mono">6 & 7. SESSOES & OTPS</span>
                  <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded">Segurança</span>
                </div>
                <div className="space-y-3 text-xs text-slate-300 font-mono">
                  <div>
                    <span className="text-amber-400 font-bold block mb-1">SESSOES:</span>
                    token_sessao (UUID), email_cliente, data_criacao, data_expiracao (15m)
                  </div>
                  <div>
                    <span className="text-emerald-400 font-bold block mb-1">OTPS:</span>
                    email, codigo_otp (6 dígitos), data_criacao, data_expiracao (10m), utilizado (bool)
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 5: GUIA DE DEPLOY & TRIGGERS ================= */}
        {activeTab === 'deploy' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <h2 className="text-base font-bold text-white mb-2 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-sky-400" />
                Manual Completo de Instalação e Deploy no Google Workspace
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                Siga os 5 passos abaixo para colocar o backend 100% no ar em menos de 3 minutos.
              </p>

              <div className="mt-6 space-y-6">
                {/* Passo 1 */}
                <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="w-7 h-7 rounded-full bg-sky-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                    1
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-white">Criar a Planilha Google Sheets</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Crie uma planilha em branco no Google Drive (<code className="text-sky-300 font-mono">sheets.new</code>) com o nome desejado (ex: <em>DB - Portal Incidentes Telecom</em>). Copie o ID da URL da planilha (a sequência entre <code>/d/</code> e <code>/edit</code>).
                    </p>
                  </div>
                </div>

                {/* Passo 2 */}
                <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="w-7 h-7 rounded-full bg-sky-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                    2
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-white">Abrir o Apps Script e Colar o Código</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Na planilha criada, acesse o menu superior: <strong>Extensões &rarr; Apps Script</strong>.
                      Substitua todo o conteúdo do arquivo <code>Code.gs</code> pelo código gerado na aba <strong>Código Code.gs</strong> desta plataforma.
                    </p>
                  </div>
                </div>

                {/* Passo 3 */}
                <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="w-7 h-7 rounded-full bg-sky-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                    3
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-white">Executar criarEstruturaPlanilha()</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      No topo do editor do Apps Script, selecione a função <code>criarEstruturaPlanilha</code> no dropdown e clique em <strong>Executar</strong>.
                      O Google solicitará autorização de permissões para Drive, Gmail e Planilhas (clique em <em>Avançado &rarr; Acessar projeto</em>). A função criará as 7 abas formatadas e os usuários demo imediatamente!
                    </p>
                  </div>
                </div>

                {/* Passo 4 */}
                <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="w-7 h-7 rounded-full bg-sky-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                    4
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-white">Executar instalarTriggers()</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Selecione a função <code>instalarTriggers</code> e clique em <strong>Executar</strong>. Isso ativará:
                    </p>
                    <ul className="text-xs text-slate-300 list-disc list-inside mt-1 font-mono">
                      <li><code>verificarSLAPendentes</code>: Executa a cada 30 minutos varrendo tickets pendentes e disparando alerta crítico por e-mail.</li>
                      <li><code>limparSessoesExpiradas</code>: Executa diariamente às 23:55 expurgando sessões e códigos OTP obsoletos.</li>
                    </ul>
                  </div>
                </div>

                {/* Passo 5 */}
                <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="w-7 h-7 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                    5
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-white">Implantar como Web App (Deploy)</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      No canto superior direito, clique em <strong>Implantar &rarr; Nova implantação</strong>.
                    </p>
                    <ul className="text-xs text-slate-300 space-y-1 mt-1 font-mono">
                      <li>• Tipo: <strong>App da Web</strong></li>
                      <li>• Executar como: <strong>Eu (seu-email@dominio.com)</strong></li>
                      <li>• Quem pode acessar: <strong className="text-emerald-400">Qualquer pessoa</strong> (imprescindível para consumo do frontend sem tela de login Google)</li>
                    </ul>
                    <p className="text-xs text-slate-400 mt-2">
                      Copie a <strong>URL do app da Web</strong> gerada (<code className="text-emerald-300">https://script.google.com/macros/s/.../exec</code>) e cole no seu frontend GitHub Pages ou no nosso Sandbox!
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Testes cURL prontos */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <h3 className="text-sm font-bold text-white mb-2">
                Exemplos de Teste via cURL / Postman / Fetch
              </h3>
              <div className="space-y-4">
                <div>
                  <span className="text-xs font-semibold text-slate-400 block mb-1">1. Teste de Ping (GET ou POST):</span>
                  <pre className="bg-slate-950 p-3 rounded-lg text-xs font-mono text-sky-300 overflow-x-auto">
                    curl -L "https://script.google.com/macros/s/SEU_DEPLOY_ID/exec?action=ping"
                  </pre>
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-400 block mb-1">2. Solicitar Login (Gera OTP):</span>
                  <pre className="bg-slate-950 p-3 rounded-lg text-xs font-mono text-sky-300 overflow-x-auto">
{`curl -L -X POST "https://script.google.com/macros/s/SEU_DEPLOY_ID/exec" \\
  -H "Content-Type: text/plain" \\
  -d '{"action":"solicitar_login","payload":{"email":"cliente@exemplo.com","senha":"Cliente@2026"}}'`}
                  </pre>
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-400 block mb-1">3. Abrir Chamado com Token:</span>
                  <pre className="bg-slate-950 p-3 rounded-lg text-xs font-mono text-sky-300 overflow-x-auto">
{`curl -L -X POST "https://script.google.com/macros/s/SEU_DEPLOY_ID/exec" \\
  -H "Content-Type: text/plain" \\
  -d '{"action":"abrir_ticket","token":"SEU_TOKEN_UUID","payload":{"id_circuito":"CIRC-SP-001","tipo_incidente":"CORTE_TOTAL","descricao":"Perda de enlace de fibra optica na sede principal"}}'`}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
