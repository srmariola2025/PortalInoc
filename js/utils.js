// ==========================================================================
// JS/UTILS.JS — HELPERS: TOAST, LOADING, MODAL DE CONFIRMAÇÃO, BADGES E DATAS
// ==========================================================================

import { t, getIdiomaAtual } from './i18n.js';

/**
 * Toast flutuante empilhável no canto superior direito
 * @param {string} mensagem - Texto da notificação
 * @param {'sucesso'|'erro'|'aviso'|'info'} tipo - Estilo do toast
 */
export function mostrarToast(mensagem, tipo = 'sucesso') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${tipo}`;
  toast.setAttribute('role', 'alert');
  toast.setAttribute('aria-live', 'assertive');

  const icones = {
    sucesso: '✅',
    erro: '❌',
    aviso: '⚠️',
    info: 'ℹ️'
  };

  toast.innerHTML = `
    <span style="font-size: 1.1rem; line-height: 1;">${icones[tipo] || 'ℹ️'}</span>
    <div style="flex: 1;">${escaparHtml(mensagem)}</div>
    <button class="toast-fechar" aria-label="Fechar notificação">&times;</button>
  `;

  const btnFechar = toast.querySelector('.toast-fechar');
  btnFechar.addEventListener('click', () => {
    toast.remove();
  });

  container.appendChild(toast);

  // Auto-remove após 4 segundos
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(20px)';
    setTimeout(() => toast.remove(), 250);
  }, 4000);
}

/**
 * Loading Overlay global com spinner
 * @param {string} mensagem - Texto exibido abaixo do spinner
 */
export function mostrarLoading(mensagem = 'Processando...') {
  esconderLoading(); // Remove anterior se existir

  const overlay = document.createElement('div');
  overlay.id = 'app-loading-overlay';
  overlay.className = 'loading-overlay';
  overlay.innerHTML = `
    <div class="spinner"></div>
    <div style="font-weight: 600; font-size: 0.95rem; letter-spacing: 0.02em;">${escaparHtml(mensagem)}</div>
  `;
  document.body.appendChild(overlay);
}

/**
 * Remove o Loading Overlay ativo
 */
export function esconderLoading() {
  const overlay = document.getElementById('app-loading-overlay');
  if (overlay) {
    overlay.remove();
  }
}

/**
 * Modal de Confirmação acessível
 * @param {string} mensagem - Pergunta ou mensagem
 * @param {string} titulo - Título do modal
 * @returns {Promise<boolean>} - Resolve true se Confirmar, false se Cancelar
 */
export async function confirmar(mensagem, titulo = '') {
  const tituloFinal = titulo || t('confirm');
  return new Promise((resolve) => {
    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop';

    backdrop.innerHTML = `
      <div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-confirm-title">
        <div class="modal-header">
          <h3 id="modal-confirm-title">${escaparHtml(tituloFinal)}</h3>
          <button class="toast-fechar btn-fechar-modal" aria-label="${escaparHtml(t('close'))}">&times;</button>
        </div>
        <div class="modal-body">
          <p>${escaparHtml(mensagem)}</p>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline btn-cancelar" type="button">${escaparHtml(t('cancel'))}</button>
          <button class="btn btn-primary btn-confirmar" type="button">${escaparHtml(t('confirm'))}</button>
        </div>
      </div>
    `;

    function fechar(resultado) {
      backdrop.remove();
      resolve(resultado);
    }

    backdrop.querySelector('.btn-cancelar').addEventListener('click', () => fechar(false));
    backdrop.querySelector('.btn-fechar-modal').addEventListener('click', () => fechar(false));
    backdrop.querySelector('.btn-confirmar').addEventListener('click', () => fechar(true));

    // Fechar ao clicar fora do modal
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) fechar(false);
    });

    // Fechar com ESC
    const escHandler = (e) => {
      if (e.key === 'Escape') {
        window.removeEventListener('keydown', escHandler);
        fechar(false);
      }
    };
    window.addEventListener('keydown', escHandler);

    document.body.appendChild(backdrop);
    backdrop.querySelector('.btn-confirmar').focus();
  });
}

/**
 * Renderiza Badge de Status estilizado e traduzido
 * @param {string} status - ABERTO, EM_RESOLUCAO, PENDENTE, RESOLVIDO
 */
export function renderizarBadgeStatus(status) {
  const chave = (status || '').toLowerCase();
  const labelTraduzido = t(`status_${chave}`) || status || '—';

  const classeCorMap = {
    'ABERTO': 'aberto',
    'EM_RESOLUCAO': 'em-resolucao',
    'PENDENTE': 'pendente',
    'RESOLVIDO': 'resolvido'
  };
  const classeCor = classeCorMap[status] || 'cinza';
  return `<span class="badge badge-${classeCor}">${escaparHtml(labelTraduzido)}</span>`;
}

/**
 * Renderiza Badge de Tipo de Incidente estilizado e traduzido
 * @param {string} tipo - CORTE_TOTAL, CORTE_PARCIAL, ENSAIO
 */
export function renderizarBadgeTipo(tipo) {
  const chave = (tipo || '').toLowerCase();
  const labelTraduzido = t(`type_${chave}`) || tipo || '—';

  const classeCorMap = {
    'CORTE_TOTAL': 'corte-total',
    'CORTE_PARCIAL': 'corte-parcial',
    'ENSAIO': 'ensaio'
  };
  const classeCor = classeCorMap[tipo] || 'cinza';
  return `<span class="badge badge-${classeCor}">${escaparHtml(labelTraduzido)}</span>`;
}

/**
 * Formata strings de data/hora de acordo com o idioma ativo
 * @param {string|Date} dataStr
 */
export function formatarData(dataStr) {
  if (!dataStr) return '—';
  const d = new Date(dataStr);
  if (isNaN(d.getTime())) return String(dataStr);

  const lang = getIdiomaAtual();
  const localeMap = {
    en: 'en-US',
    pt: 'pt-BR',
    es: 'es-ES'
  };
  const locale = localeMap[lang] || 'en-US';

  return d.toLocaleString(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Escapa strings contra XSS ao inserir no HTML
 */
export function escaparHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
