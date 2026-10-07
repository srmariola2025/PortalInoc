// ==========================================================================
// JS/AUTH.JS — GESTÃO DE SESSÃO, AUTENTICAÇÃO, TIMER DE 15 MIN E LOGOUT
// ==========================================================================

import { mostrarToast, confirmar } from './utils.js';
import { t, gerarHtmlSeletorIdioma, aplicarTraducoes } from './i18n.js';

const TEMPO_SESSAO_MS = 15 * 60 * 1000; // 15 minutos
let timerIntervaloId = null;

/**
 * Salva os dados do login validado e inicializa contagem de sessão
 */
export function salvarSessao(dados) {
  localStorage.setItem('token', dados.token);
  localStorage.setItem('email', dados.cliente.email);
  localStorage.setItem('nome', dados.cliente.nome);
  localStorage.setItem('id_cliente', dados.cliente.id);
  localStorage.setItem('is_master', String(dados.cliente.is_master === true));
  localStorage.setItem('senha_temporaria', String(dados.cliente.senha_temporaria === true));
  localStorage.setItem('loginTimestamp', String(Date.now()));

  if (dados.cliente.senha_temporaria) {
    window.location.href = './trocar-senha.html';
  } else if (dados.cliente.is_master) {
    window.location.href = './noc.html';
  } else {
    window.location.href = './dashboard.html';
  }
}

/**
 * Inicializa o timer regressivo de 15 minutos e atualiza o badge no header
 */
export function iniciarTimerSessao() {
  const loginTimestamp = parseInt(localStorage.getItem('loginTimestamp'), 10);
  if (!loginTimestamp) {
    logoutForcado(t('msg_session_expired'));
    return;
  }

  const tempoExpiracao = loginTimestamp + TEMPO_SESSAO_MS;

  if (timerIntervaloId) {
    clearInterval(timerIntervaloId);
  }

  function atualizar() {
    const restante = tempoExpiracao - Date.now();
    if (restante <= 0) {
      clearInterval(timerIntervaloId);
      logoutForcado(t('msg_session_expired'));
    } else {
      atualizarBadgeTimer(restante);
    }
  }

  atualizar();
  timerIntervaloId = setInterval(atualizar, 1000);
}

/**
 * Atualiza o elemento de timer na tela com formato MM:SS
 */
function atualizarBadgeTimer(restanteMs) {
  const el = document.getElementById('session-timer-badge');
  if (!el) return;

  const totalSegundos = Math.floor(restanteMs / 1000);
  const minutos = Math.floor(totalSegundos / 60);
  const segundos = totalSegundos % 60;

  const texto = `${String(minutos).padStart(2, '0')}:${String(segundos).padStart(2, '0')}`;
  el.innerHTML = `⏱️ ${texto}`;

  // Se restar menos de 2 minutos, destaca em vermelho piscante
  if (minutos < 2) {
    el.classList.add('expirando');
    el.title = t('session_expiring_warning');
  } else {
    el.classList.remove('expirando');
    el.title = t('session_timer_title');
  }
}

/**
 * Realiza o logout voluntário do usuário com confirmação
 */
export async function logout() {
  const confirmado = await confirmar(t('msg_confirm_logout'), t('btn_logout'));
  if (!confirmado) return;

  if (timerIntervaloId) clearInterval(timerIntervaloId);
  const idiomaSalvo = localStorage.getItem('inoc_lang');
  localStorage.clear();
  if (idiomaSalvo) localStorage.setItem('inoc_lang', idiomaSalvo);
  window.location.href = './login.html';
}

/**
 * Realiza logout forçado por expiração ou token inválido
 */
export function logoutForcado(motivo = '') {
  if (timerIntervaloId) clearInterval(timerIntervaloId);
  const motivoTexto = motivo || t('msg_session_expired');
  const idiomaSalvo = localStorage.getItem('inoc_lang');
  localStorage.clear();
  if (idiomaSalvo) localStorage.setItem('inoc_lang', idiomaSalvo);
  sessionStorage.setItem('msg_expirada', motivoTexto);
  window.location.href = './login.html';
}

/**
 * Renderiza o Header Oficial MEO Internacional em qualquer tela protegida
 */
export function renderizarHeaderGlobal(containerId = 'header-container') {
  const container = document.getElementById(containerId);
  if (!container) return;

  const nome = localStorage.getItem('nome') || 'Usuário';
  const isMaster = localStorage.getItem('is_master') === 'true';
  const email = localStorage.getItem('email') || '';
  const isNoCPage = window.location.pathname.includes('noc');

  container.innerHTML = `
    <header class="portal-header">
      <div class="portal-header-inner">
        <a href="${isMaster ? './noc.html' : './dashboard.html'}" class="portal-brand" title="${t('portal_fullname')}">
          <img src="./assets/meo-logo-white.svg" 
               alt="MEO Internacional" 
               class="meo-logo-img" 
               onerror="this.src='./assets/meo-logo.svg'" />
          <div class="portal-title-group">
            <span class="portal-brand-title">${t('portal_name')}</span>
            <span class="portal-brand-subtitle">${t('portal_subtitle')}</span>
          </div>
        </a>

        <div class="portal-user-controls">
          <!-- Seletor de Idioma no Header -->
          ${gerarHtmlSeletorIdioma('header')}

          <!-- Badge do Timer de Segurança -->
          <div id="session-timer-badge" class="session-timer-badge" title="${t('session_timer_title')}">
            ⏱️ 15:00
          </div>

          <!-- Perfil do Usuário -->
          <div class="user-profile-badge">
            <span class="user-profile-name">
              ${isMaster ? '🛡️ ' : ''}${nome}
            </span>
            <span class="user-profile-type">
              ${isMaster ? t('noc_master_badge') : email}
            </span>
          </div>

          ${isMaster ? (
            isNoCPage ? `
              <a href="./dashboard.html" class="btn btn-sm btn-outline-white" style="font-size:0.75rem;">
                ${t('btn_client_portal')}
              </a>
            ` : `
              <a href="./noc.html" class="btn btn-sm btn-outline-white" style="font-size:0.75rem;">
                ${t('btn_noc_panel')}
              </a>
            `
          ) : ''}

          <button id="btn-logout" class="btn btn-sm btn-outline-white" title="${t('btn_logout_title')}">
            ${t('btn_logout')}
          </button>
        </div>
      </div>
    </header>
  `;

  document.getElementById('btn-logout')?.addEventListener('click', (e) => {
    e.preventDefault();
    logout();
  });
}

// Listener para quando o idioma mudar dinamicamente, atualizar o header se ele existir
if (typeof window !== 'undefined') {
  window.addEventListener('inoc_language_changed', () => {
    const container = document.getElementById('header-container');
    if (container && container.innerHTML.trim() !== '') {
      renderizarHeaderGlobal('header-container');
    }
  });
}
