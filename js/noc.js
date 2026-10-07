// ==========================================================================
// JS/NOC.JS — PAINEL MASTER DO INOC (INTERNATIONAL NETWORK OPERATIONS CENTER)
// ==========================================================================

import { listarTodosTickets } from './api.js';
import { mostrarToast, mostrarLoading, esconderLoading, renderizarBadgeStatus, renderizarBadgeTipo, formatarData, escaparHtml } from './utils.js';
import { t, aplicarTraducoes } from './i18n.js';

let listaMasterTickets = [];
let paginaAtual = 1;
const ITENS_POR_PAGINA = 50;

document.addEventListener('DOMContentLoaded', async () => {
  const tbodyTickets = document.getElementById('tbody-tickets');
  const filtroStatus = document.getElementById('filtro-status');
  const filtroCliente = document.getElementById('filtro-cliente');
  const filtroTipo = document.getElementById('filtro-tipo');
  const filtroDataDe = document.getElementById('filtro-data-de');
  const filtroDataAte = document.getElementById('filtro-data-ate');
  const btnAtualizar = document.getElementById('btn-atualizar-filtros');
  const totalRegistrosEl = document.getElementById('total-registros-count');
  const paginacaoInfoEl = document.getElementById('paginacao-info');
  const btnPagAnterior = document.getElementById('btn-pag-anterior');
  const btnPagProxima = document.getElementById('btn-pag-proxima');

  async function carregarTodosTickets() {
    mostrarLoading(t('loading'));
    try {
      const payloadFiltro = {};
      if (filtroStatus?.value && filtroStatus.value !== 'TODOS') {
        payloadFiltro.status = filtroStatus.value;
      }
      if (filtroCliente?.value && filtroCliente.value !== 'TODOS') {
        payloadFiltro.id_cliente = filtroCliente.value;
      }
      if (filtroTipo?.value && filtroTipo.value !== 'TODOS') {
        payloadFiltro.tipo_incidente = filtroTipo.value;
      }
      if (filtroDataDe?.value) {
        payloadFiltro.data_de = filtroDataDe.value;
      }
      if (filtroDataAte?.value) {
        payloadFiltro.data_ate = filtroDataAte.value;
      }

      const res = await listarTodosTickets(payloadFiltro);
      listaMasterTickets = res.tickets || [];

      popularSelectClientes(listaMasterTickets);
      paginaAtual = 1;
      renderizarTabela();

    } catch (err) {
      console.error(err);
      mostrarToast(err.message || t('msg_error_generic'), 'erro');
    } finally {
      esconderLoading();
    }
  }

  function popularSelectClientes(tickets) {
    if (!filtroCliente || filtroCliente.children.length > 1) return;

    const mapa = new Map();
    tickets.forEach(tkt => {
      if (tkt.id_cliente && !mapa.has(tkt.id_cliente)) {
        mapa.set(tkt.id_cliente, tkt.nome_empresa || tkt.id_cliente);
      }
    });

    mapa.forEach((nome, id) => {
      const opt = document.createElement('option');
      opt.value = id;
      opt.textContent = `${nome} (${id})`;
      filtroCliente.appendChild(opt);
    });
  }

  function renderizarTabela() {
    if (!tbodyTickets) return;

    if (totalRegistrosEl) {
      totalRegistrosEl.textContent = `${listaMasterTickets.length} ${t('status')}`;
    }

    if (listaMasterTickets.length === 0) {
      tbodyTickets.innerHTML = `
        <tr>
          <td colspan="9" style="text-align: center; padding: 40px; color: var(--cor-texto-claro);">
            ${escaparHtml(t('dash_empty_title'))}
          </td>
        </tr>
      `;
      if (paginacaoInfoEl) paginacaoInfoEl.textContent = '-';
      return;
    }

    const totalPaginas = Math.ceil(listaMasterTickets.length / ITENS_POR_PAGINA) || 1;
    const inicio = (paginaAtual - 1) * ITENS_POR_PAGINA;
    const fim = inicio + ITENS_POR_PAGINA;
    const paginaItens = listaMasterTickets.slice(inicio, fim);

    if (paginacaoInfoEl) {
      paginacaoInfoEl.textContent = `${inicio + 1}–${Math.min(fim, listaMasterTickets.length)} / ${listaMasterTickets.length}`;
    }

    if (btnPagAnterior) btnPagAnterior.disabled = paginaAtual <= 1;
    if (btnPagProxima) btnPagProxima.disabled = paginaAtual >= totalPaginas;

    tbodyTickets.innerHTML = paginaItens.map(ticket => `
      <tr>
        <td style="font-family: var(--fonte-mono); font-weight: 700; color: var(--meo-azul-escuro);">
          ${escaparHtml(ticket.id_ticket)}
        </td>
        <td>
          <div style="font-weight: 600;">${escaparHtml(ticket.nome_empresa || ticket.id_cliente)}</div>
          <div style="font-size: 0.75rem; color: var(--cor-texto-muted);">${escaparHtml(ticket.id_cliente)}</div>
        </td>
        <td>
          <div style="font-weight: 500;">${escaparHtml(ticket.nome_circuito || ticket.id_circuito)}</div>
          <div style="font-size: 0.75rem; font-family: var(--fonte-mono); color: var(--meo-azul-escuro);">
            ${escaparHtml(ticket.identificador_tecnico || 'N/A')}
          </div>
        </td>
        <td>${renderizarBadgeTipo(ticket.tipo_incidente)}</td>
        <td>${renderizarBadgeStatus(ticket.status)}</td>
        <td style="font-size: 0.8125rem;">${formatarData(ticket.data_abertura)}</td>
        <td style="font-size: 0.8125rem;">${formatarData(ticket.data_ultima_atualizacao)}</td>
        <td style="text-align: center; font-weight: 600; color: var(--meo-azul-escuro);">
          💬 ${ticket.total_comentarios || 0}
        </td>
        <td style="text-align: right;">
          <a href="./noc-ticket.html?id=${encodeURIComponent(ticket.id_ticket)}" class="btn btn-sm btn-primary">
            ${escaparHtml(t('noc_btn_manage'))} &rarr;
          </a>
        </td>
      </tr>
    `).join('');
  }

  btnAtualizar?.addEventListener('click', carregarTodosTickets);

  btnPagAnterior?.addEventListener('click', () => {
    if (paginaAtual > 1) {
      paginaAtual--;
      renderizarTabela();
    }
  });

  btnPagProxima?.addEventListener('click', () => {
    const totalPaginas = Math.ceil(listaMasterTickets.length / ITENS_POR_PAGINA);
    if (paginaAtual < totalPaginas) {
      paginaAtual++;
      renderizarTabela();
    }
  });

  window.addEventListener('inoc_language_changed', () => {
    aplicarTraducoes();
    renderizarTabela();
  });

  await carregarTodosTickets();
});
