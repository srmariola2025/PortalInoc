// ==========================================================================
// JS/TICKET.JS — VISUALIZAÇÃO DO TICKET, DETALHES E TIMELINE CRM DO CLIENTE
// ==========================================================================

import { verTicket, comentarTicket } from './api.js';
import { mostrarToast, mostrarLoading, esconderLoading, renderizarBadgeStatus, renderizarBadgeTipo, formatarData, escaparHtml } from './utils.js';
import { t, aplicarTraducoes } from './i18n.js';

let ticketAtual = null;
let comentariosAtuais = [];
let anexoRespostaSelecionado = null;

async function converterArquivoParaBase64(arquivo) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve({
      nome: arquivo.name,
      tipoMime: arquivo.type || 'application/octet-stream',
      base64: reader.result.split(',')[1]
    });
    reader.onerror = reject;
    reader.readAsDataURL(arquivo);
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const idTicket = urlParams.get('id');

  if (!idTicket) {
    mostrarToast('Ticket ID not provided.', 'erro');
    setTimeout(() => window.location.href = './dashboard.html', 1500);
    return;
  }

  const containerDetalhes = document.getElementById('ticket-meta-container');
  const containerTimeline = document.getElementById('timeline-container');
  const bannerEncerrado = document.getElementById('banner-resolvido');
  const replyBox = document.getElementById('reply-box');
  const formComentario = document.getElementById('form-comentario');
  const textareaMensagem = document.getElementById('comentario-mensagem');
  const inputAnexo = document.getElementById('comentario-anexo');
  const labelAnexo = document.getElementById('label-anexo-nome');
  const breadcrumbTicketId = document.getElementById('breadcrumb-ticket-id');

  if (breadcrumbTicketId) breadcrumbTicketId.textContent = idTicket;

  async function carregarDadosTicket() {
    mostrarLoading(t('loading'));
    try {
      const res = await verTicket(idTicket);
      ticketAtual = res.ticket;
      comentariosAtuais = res.comentarios || [];

      renderizarMetadados(ticketAtual);
      renderizarTimeline(comentariosAtuais);

      // Regra de negócio: Se o ticket estiver RESOLVIDO, cliente NUNCA pode comentar
      if (ticketAtual.status === 'RESOLVIDO') {
        if (bannerEncerrado) bannerEncerrado.style.display = 'flex';
        if (replyBox) replyBox.style.display = 'none';
      } else {
        if (bannerEncerrado) bannerEncerrado.style.display = 'none';
        if (replyBox) replyBox.style.display = 'block';
      }

    } catch (err) {
      console.error(err);
      mostrarToast(err.message || t('msg_error_generic'), 'erro');
    } finally {
      esconderLoading();
    }
  }

  function renderizarMetadados(tkt) {
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
        <dt>${escaparHtml(t('ticket_info_circuit_name'))}</dt>
        <dd>${escaparHtml(tkt.nome_circuito || tkt.id_circuito)}</dd>

        <dt>${escaparHtml(t('technical_id'))}</dt>
        <dd style="font-family: var(--fonte-mono); color: var(--meo-azul-escuro);">${escaparHtml(tkt.identificador_tecnico || 'N/A')}</dd>

        <dt>${escaparHtml(t('link_type'))}</dt>
        <dd>${escaparHtml(tkt.tipo_link || 'International Transit / MPLS')}</dd>

        <dt>${escaparHtml(t('created_at'))}</dt>
        <dd>${formatarData(tkt.data_abertura)}</dd>

        <dt>${escaparHtml(t('updated_at'))}</dt>
        <dd>${formatarData(tkt.data_ultima_atualizacao)}</dd>

        ${tkt.data_fechamento ? `
          <dt>${escaparHtml(t('status_resolvido'))}</dt>
          <dd style="color: var(--cor-sucesso); font-weight: 700;">${formatarData(tkt.data_fechamento)}</dd>
        ` : ''}

        ${tkt.data_pendencia_expira ? `
          <dt>${escaparHtml(t('pending_until'))}</dt>
          <dd style="color: var(--cor-aviso); font-weight: 700;">${formatarData(tkt.data_pendencia_expira)}</dd>
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

  function renderizarTimeline(comentarios) {
    if (!containerTimeline) return;

    if (!comentarios || comentarios.length === 0) {
      containerTimeline.innerHTML = `
        <div style="text-align: center; padding: 32px; color: var(--cor-texto-claro); font-size: 0.875rem;">
          ${escaparHtml(t('ticket_timeline_empty'))}
        </div>
      `;
      return;
    }

    containerTimeline.innerHTML = comentarios.map(c => {
      const isCliente = c.autor_tipo === 'CLIENTE';
      const bubbleClass = isCliente ? 'bubble-cliente' : 'bubble-noc';
      const autorBadge = isCliente ? t('ticket_badge_client') : t('ticket_badge_noc');

      return `
        <div class="timeline-bubble ${bubbleClass}">
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

    // Rola para a última mensagem automaticamente
    containerTimeline.scrollTop = containerTimeline.scrollHeight;
  }

  // Gestão de Anexo no Comentário
  inputAnexo?.addEventListener('change', () => {
    if (inputAnexo.files && inputAnexo.files[0]) {
      const f = inputAnexo.files[0];
      if (f.size > 10 * 1024 * 1024) {
        mostrarToast(t('msg_file_too_large', { name: f.name }), 'erro');
        inputAnexo.value = '';
        anexoRespostaSelecionado = null;
        if (labelAnexo) labelAnexo.textContent = '';
        return;
      }
      anexoRespostaSelecionado = f;
      if (labelAnexo) labelAnexo.textContent = `📎 ${f.name} (${Math.round(f.size/1024)} KB)`;
    } else {
      anexoRespostaSelecionado = null;
      if (labelAnexo) labelAnexo.textContent = '';
    }
  });

  // Envio de Comentário
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
      const anexos = [];
      if (anexoRespostaSelecionado) {
        anexos.push(await converterArquivoParaBase64(anexoRespostaSelecionado));
      }

      await comentarTicket(idTicket, mensagem, anexos);

      mostrarToast(t('msg_comment_added'), 'sucesso');
      textareaMensagem.value = '';
      if (inputAnexo) inputAnexo.value = '';
      anexoRespostaSelecionado = null;
      if (labelAnexo) labelAnexo.textContent = '';

      // Recarrega timeline
      await carregarDadosTicket();

    } catch (err) {
      console.error(err);
      mostrarToast(err.message || t('msg_error_generic'), 'erro');
    } finally {
      esconderLoading();
    }
  });

  window.addEventListener('inoc_language_changed', () => {
    aplicarTraducoes();
    if (ticketAtual) renderizarMetadados(ticketAtual);
    if (comentariosAtuais) renderizarTimeline(comentariosAtuais);
  });

  await carregarDadosTicket();
});
