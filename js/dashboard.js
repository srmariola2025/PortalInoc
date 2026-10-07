// ==========================================================================
// JS/DASHBOARD.JS — LÓGICA DO DASHBOARD DO CLIENTE B2B
// ==========================================================================

import { listarMeusTickets } from './api.js';
import { mostrarToast, mostrarLoading, esconderLoading, renderizarBadgeStatus, renderizarBadgeTipo, formatarData, escaparHtml } from './utils.js';
import { t, aplicarTraducoes } from './i18n.js';

let todosOsTickets = [];

document.addEventListener('DOMContentLoaded', async () => {
  const containerTickets = document.getElementById('tickets-container');
  const filtroStatus = document.getElementById('filtro-status');
  const totalCountEl = document.getElementById('total-tickets-count');

  async function carregarTickets() {
    mostrarLoading(t('loading'));
    try {
      const res = await listarMeusTickets();
      todosOsTickets = res.tickets || [];
      renderizarCards();
    } catch (err) {
      console.error(err);
      mostrarToast(err.message || t('msg_error_generic'), 'erro');
      if (containerTickets) {
        containerTickets.innerHTML = `
          <div style="grid-column: 1 / -1; text-align: center; padding: 48px; background: #FFF; border-radius: 12px; border: 1px solid var(--cor-borda);">
            <p style="color: var(--cor-erro); font-weight: 600;">${escaparHtml(t('msg_error_generic'))}</p>
            <button class="btn btn-primary btn-sm" id="btn-recarregar" style="margin-top: 12px;">${escaparHtml(t('noc_btn_refresh'))}</button>
          </div>
        `;
        document.getElementById('btn-recarregar')?.addEventListener('click', carregarTickets);
      }
    } finally {
      esconderLoading();
    }
  }

  function renderizarCards() {
    if (!containerTickets) return;

    const statusSelecionado = filtroStatus ? filtroStatus.value : 'TODOS';
    let ticketsFiltrados = todosOsTickets;

    if (statusSelecionado !== 'TODOS') {
      ticketsFiltrados = todosOsTickets.filter(tkt => tkt.status === statusSelecionado);
    }

    if (totalCountEl) {
      totalCountEl.textContent = `${ticketsFiltrados.length} ${ticketsFiltrados.length === 1 ? 'ticket' : 'tickets'}`;
    }

    if (ticketsFiltrados.length === 0) {
      containerTickets.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 48px 24px; background: #FFFFFF; border-radius: var(--raio-borda-lg); border: 1px dashed var(--cor-borda-escura);">
          <div style="font-size: 2.5rem; margin-bottom: 8px;">📭</div>
          <h3 style="color: var(--cor-texto); font-size: 1.125rem; margin-bottom: 6px;">${escaparHtml(t('dash_empty_title'))}</h3>
          <p style="color: var(--cor-texto-claro); font-size: 0.875rem; margin-bottom: 16px;">
            ${escaparHtml(t('dash_empty_desc'))}
          </p>
          <a href="./novo-ticket.html" class="btn btn-laranja">
            ${escaparHtml(t('dash_btn_new_ticket'))}
          </a>
        </div>
      `;
      return;
    }

    containerTickets.innerHTML = ticketsFiltrados.map(ticket => `
      <div class="card ticket-card" onclick="window.location.href='./ticket.html?id=${ticket.id_ticket}'" role="button" tabindex="0">
        <div class="card-body">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; gap: 8px;">
            <span style="font-family: var(--fonte-mono); font-weight: 700; color: var(--meo-azul-escuro); font-size: 0.9375rem;">
              ${escaparHtml(ticket.id_ticket)}
            </span>
            ${renderizarBadgeStatus(ticket.status)}
          </div>

          <h4 style="font-size: 1rem; font-weight: 700; margin-bottom: 6px; color: var(--cor-texto);">
            ${escaparHtml(ticket.nome_circuito || ticket.id_circuito)}
          </h4>

          <div style="margin-bottom: 12px;">
            ${renderizarBadgeTipo(ticket.tipo_incidente)}
          </div>

          <p style="font-size: 0.8125rem; color: var(--cor-texto-claro); margin-bottom: 16px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; line-height: 1.4;">
            ${escaparHtml(ticket.descricao_inicial)}
          </p>
        </div>

        <div class="card-footer" style="display: flex; justify-content: space-between; align-items: center; font-size: 0.75rem; color: var(--cor-texto-claro);">
          <span>📅 ${escaparHtml(t('dash_card_opened'))} ${formatarData(ticket.data_abertura)}</span>
          <span style="display: flex; align-items: center; gap: 4px; font-weight: 600; color: var(--meo-azul-escuro);">
            💬 ${ticket.total_comentarios || 0}
          </span>
        </div>
      </div>
    `).join('');
  }

  filtroStatus?.addEventListener('change', renderizarCards);

  // Escuta alteração de idioma para re-renderizar cards
  window.addEventListener('inoc_language_changed', () => {
    aplicarTraducoes();
    renderizarCards();
  });

  await carregarTickets();
});
