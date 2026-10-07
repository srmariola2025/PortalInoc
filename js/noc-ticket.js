// ==========================================================================
// JS/NOC-TICKET.JS — GESTÃO MASTER DE TICKET NO INOC (SLA, STATUS E RESPOSTAS)
// ==========================================================================

import { verTicketMaster, alterarStatus, comentarMaster, reabrirTicket, baixarAnexo } from './api.js';
import { mostrarToast, mostrarLoading, esconderLoading, confirmar, renderizarBadgeStatus, renderizarBadgeTipo, formatarData, escaparHtml } from './utils.js';
import { t, aplicarTraducoes } from './i18n.js';

let ticketMasterAtual = null;
let comentariosMasterAtuais = [];

function baixarArquivoLocal(base64, nome, tipoMime) {
  const byteChars = atob(base64);
  const byteNumbers = new Array(byteChars.length);
  for (let i = 0; i < byteChars.length; i++) {
    byteNumbers[i] = byteChars.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: tipoMime || 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = nome || 'anexo';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

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
            <div style="margin-top: 6px;">
              <button type="button" class="btn-baixar-anexo" data-arquivo="${escaparHtml(c.anexo_url)}" style="background: rgba(0,163,224,0.08); border: 1px solid var(--meo-azul); border-radius: 4px; padding: 4px 10px; color: var(--meo-azul); cursor: pointer; font-size: 0.75rem; font-weight: 600; display: inline-flex; align-items: center; gap: 4px;">
                📎 ${escaparHtml(t('download_attachment') || 'Baixar anexo')}
              </button>
            </div>
          ` : ''}
        </div>
      `;
    }).join('');

    containerTimeline.scrollTop = containerTimeline.scrollHeight;
  }

  // Delegação de evento para download seguro de anexo
  containerTimeline?.addEventListener('click', async (e) => {
    const btn = e.target.closest('.btn-baixar-anexo');
    if (!btn) return;
    const arquivoRef = btn.getAttribute('data-arquivo');
    if (!arquivoRef) return;

    mostrarLoading(t('loading'));
    try {
      const res = await baixarAnexo(idTicket, arquivoRef);
      if (res && res.base64) {
        baixarArquivoLocal(res.base64, res.nome, res.tipo_mime);
        mostrarToast(t('msg_file_downloaded') || 'Download concluído.', 'sucesso');
      } else {
        throw new Error('Anexo vazio ou não encontrado.');
      }
    } catch (err) {
      console.error(err);
      mostrarToast(err.message || 'Erro ao baixar anexo.', 'erro');
    } finally {
      esconderLoading();
    }
  });

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
