// ==========================================================================
// JS/NOC-TICKET.JS — GESTÃO MASTER DE TICKET NO INOC (SLA, STATUS E RESPOSTAS)
// ==========================================================================

import { verTicketMaster, alterarStatus, comentarMaster, reabrirTicket } from './api.js';
import { mostrarToast, mostrarLoading, esconderLoading, confirmar, renderizarBadgeStatus, renderizarBadgeTipo, formatarData, escaparHtml } from './utils.js';
import { t, aplicarTraducoes } from './i18n.js';

let ticketMasterAtual = null;
let comentariosMasterAtuais = [];

document.addEventListener('DOMContentLoaded', async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const idTicket = urlParams.get('id');

  if (!idTicket) {
    mostrarToast('Ticket ID not provided.', 'erro');
    setTimeout(() => window.location.href = './noc.html', 1500);
    return;
  }

  const containerDetalhes = document.getElementById('ticket-meta-container');
  const containerTimeline = document.getElementById('timeline-container');
  const selectNovoStatus = document.getElementById('select-novo-status');
  const grupoDataPendencia = document.getElementById('grupo-data-pendencia');
  const inputDataPendencia = document.getElementById('input-data-pendencia');
  const btnAplicarStatus = document.getElementById('btn-aplicar-status');
  const btnReabrir = document.getElementById('btn-reabrir-ticket');
  const formComentario = document.getElementById('form-comentario-master');
  const textareaMensagem = document.getElementById('comentario-mensagem-master');
  const breadcrumbTicketId = document.getElementById('breadcrumb-ticket-id');

  if (breadcrumbTicketId) breadcrumbTicketId.textContent = idTicket;

  async function carregarTicketMaster() {
    mostrarLoading(t('loading'));
    try {
      const res = await verTicketMaster(idTicket);
      ticketMasterAtual = res.ticket;
      comentariosMasterAtuais = res.comentarios || [];

      renderizarMetadadosMaster(ticketMasterAtual);
      renderizarTimelineMaster(comentariosMasterAtuais);
      configurarControlesStatus(ticketMasterAtual);

    } catch (err) {
      console.error(err);
      mostrarToast(err.message || t('msg_error_generic'), 'erro');
    } finally {
      esconderLoading();
    }
  }

  function renderizarMetadadosMaster(tkt) {
    if (!containerDetalhes || !tkt) return;

    containerDetalhes.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
        <span style="font-family: var(--fonte-mono); font-size: 1.125rem; font-weight: 800; color: var(--meo-azul-escuro);">
          ${escaparHtml(tkt.id_ticket)}
        </span>
        ${renderizarBadgeStatus(tkt.status)}
      </div>

      <div style="margin-bottom: 16px;">
        ${renderizarBadgeTipo(tkt.tipo_incidente)}
      </div>

      <dl class="ticket-meta-list">
        <dt>${escaparHtml(t('client'))}</dt>
        <dd style="font-weight: 700;">${escaparHtml(tkt.nome_empresa || tkt.id_cliente)}</dd>

        <dt>${escaparHtml(t('login_label_email'))}</dt>
        <dd style="font-size: 0.8125rem;">${escaparHtml(tkt.email_login || 'N/A')}</dd>

        <dt>${escaparHtml(t('ticket_info_circuit_name'))}</dt>
        <dd>${escaparHtml(tkt.nome_circuito || tkt.id_circuito)}</dd>

        <dt>${escaparHtml(t('technical_id'))}</dt>
        <dd style="font-family: var(--fonte-mono); color: var(--meo-azul-escuro); font-weight: 600;">
          ${escaparHtml(tkt.identificador_tecnico || 'N/A')}
        </dd>

        <dt>${escaparHtml(t('created_at'))}</dt>
        <dd>${formatarData(tkt.data_abertura)}</dd>

        <dt>${escaparHtml(t('updated_at'))}</dt>
        <dd>${formatarData(tkt.data_ultima_atualizacao)}</dd>

        ${tkt.data_pendencia_expira ? `
          <dt style="color: var(--cor-roxo);">${escaparHtml(t('pending_until'))}</dt>
          <dd style="color: var(--cor-roxo); font-weight: 700;">${formatarData(tkt.data_pendencia_expira)}</dd>
        ` : ''}

        ${tkt.data_fechamento ? `
          <dt style="color: var(--cor-sucesso);">${escaparHtml(t('status_resolvido'))}</dt>
          <dd style="color: var(--cor-sucesso); font-weight: 700;">${formatarData(tkt.data_fechamento)}</dd>
        ` : ''}

        ${tkt.pasta_drive_anexos ? `
          <dt>${escaparHtml(t('drive_folder'))}</dt>
          <dd>
            <a href="${tkt.pasta_drive_anexos}" target="_blank" rel="noopener noreferrer" 
               class="btn btn-sm btn-outline" style="margin-top: 6px; width: 100%; justify-content: center;">
              📁 ${escaparHtml(t('view_on_drive'))} &rarr;
            </a>
          </dd>
        ` : ''}
      </dl>
    `;
  }

  function renderizarTimelineMaster(comentarios) {
    if (!containerTimeline) return;

    if (!comentarios || comentarios.length === 0) {
      containerTimeline.innerHTML = `<div style="text-align:center; padding:32px; color:var(--cor-texto-claro);">${escaparHtml(t('ticket_timeline_empty'))}</div>`;
      return;
    }

    containerTimeline.innerHTML = comentarios.map(c => {
      const isNoc = c.autor_tipo === 'NOC';
      const autorBadge = isNoc ? t('ticket_badge_noc') : t('ticket_badge_client');

      return `
        <div class="timeline-bubble ${isNoc ? 'bubble-noc' : 'bubble-cliente'}">
          <div class="bubble-author-row">
            <span class="bubble-author">
              ${escaparHtml(c.autor_nome || autorBadge)}
            </span>
            <span class="bubble-time">${formatarData(c.data_hora)}</span>
          </div>
          <div class="bubble-text">${escaparHtml(c.mensagem)}</div>
          ${c.anexo_url ? `
            <div>
              <a href="${c.anexo_url}" target="_blank" rel="noopener noreferrer" class="bubble-attachment">
                📎 ${escaparHtml(t('view'))} &rarr;
              </a>
            </div>
          ` : ''}
        </div>
      `;
    }).join('');

    containerTimeline.scrollTop = containerTimeline.scrollHeight;
  }

  function configurarControlesStatus(tkt) {
    if (selectNovoStatus) {
      selectNovoStatus.value = tkt.status;
    }

    if (btnReabrir) {
      btnReabrir.style.display = tkt.status === 'RESOLVIDO' ? 'inline-flex' : 'none';
    }

    verificarExibicaoDataPendencia();
  }

  function verificarExibicaoDataPendencia() {
    if (grupoDataPendencia && selectNovoStatus) {
      if (selectNovoStatus.value === 'PENDENTE') {
        grupoDataPendencia.style.display = 'block';
        if (inputDataPendencia && !inputDataPendencia.value) {
          const d = new Date(Date.now() + 4 * 3600000);
          inputDataPendencia.value = d.toISOString().slice(0, 16);
        }
      } else {
        grupoDataPendencia.style.display = 'none';
      }
    }
  }

  selectNovoStatus?.addEventListener('change', verificarExibicaoDataPendencia);

  // Aplicar alteração de status
  btnAplicarStatus?.addEventListener('click', async () => {
    const novoStatus = selectNovoStatus.value;
    if (novoStatus === ticketMasterAtual.status) {
      mostrarToast(t('status'), 'aviso');
      return;
    }

    let dataPendencia = null;
    if (novoStatus === 'PENDENTE') {
      if (!inputDataPendencia?.value) {
        mostrarToast(t('required_field'), 'erro');
        inputDataPendencia?.focus();
        return;
      }
      dataPendencia = new Date(inputDataPendencia.value).toISOString();
    }

    const confirmou = await confirmar(
      novoStatus === 'RESOLVIDO'
        ? t('msg_confirm_resolve', { id: idTicket })
        : `Confirm status change to [${novoStatus}]? Client will be notified via email.`,
      t('noc_ticket_status_box_title')
    );
    if (!confirmou) return;

    mostrarLoading(t('processing'));
    try {
      await alterarStatus(idTicket, novoStatus, dataPendencia);
      mostrarToast(t('msg_status_updated', { status: novoStatus }), 'sucesso');
      await carregarTicketMaster();
    } catch (err) {
      console.error(err);
      mostrarToast(err.message || t('msg_error_generic'), 'erro');
    } finally {
      esconderLoading();
    }
  });

  // Reabrir Ticket (Regra: Apenas se fechado hoje)
  btnReabrir?.addEventListener('click', async () => {
    const confirmou = await confirmar(
      'Reopen ticket and set status back to IN RESOLUTION?',
      'Reopen Incident'
    );
    if (!confirmou) return;

    mostrarLoading(t('processing'));
    try {
      await reabrirTicket(idTicket);
      mostrarToast(t('msg_status_updated', { status: 'EM_RESOLUCAO' }), 'sucesso');
      await carregarTicketMaster();
    } catch (err) {
      console.error(err);
      mostrarToast(err.message || t('msg_error_generic'), 'erro');
    } finally {
      esconderLoading();
    }
  });

  // Enviar parecer técnico do NOC
  formComentario?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const mensagem = textareaMensagem.value.trim();

    if (!mensagem) {
      mostrarToast(t('msg_fill_all_fields'), 'aviso');
      textareaMensagem.focus();
      return;
    }

    mostrarLoading(t('processing'));
    try {
      await comentarMaster(idTicket, mensagem);
      mostrarToast(t('msg_comment_added'), 'sucesso');
      textareaMensagem.value = '';
      await carregarTicketMaster();
    } catch (err) {
      console.error(err);
      mostrarToast(err.message || t('msg_error_generic'), 'erro');
    } finally {
      esconderLoading();
    }
  });

  window.addEventListener('inoc_language_changed', () => {
    aplicarTraducoes();
    if (ticketMasterAtual) {
      renderizarMetadadosMaster(ticketMasterAtual);
      renderizarTimelineMaster(comentariosMasterAtuais);
      configurarControlesStatus(ticketMasterAtual);
    }
  });

  await carregarTicketMaster();
});
