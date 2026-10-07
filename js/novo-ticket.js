// ==========================================================================
// JS/NOVO-TICKET.JS — ABERTURA DE TICKET DE INCIDENTE COM ANEXOS BASE64
// ==========================================================================

import { listarMeusCircuitos, abrirTicket } from './api.js';
import { mostrarToast, mostrarLoading, esconderLoading, escaparHtml } from './utils.js';
import { t, aplicarTraducoes } from './i18n.js';

let arquivosSelecionados = [];

/**
 * Converte arquivo do input para objeto Base64
 */
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
  const selectCircuito = document.getElementById('select-circuito');
  const textareaDescricao = document.getElementById('textarea-descricao');
  const charCounter = document.getElementById('char-counter');
  const inputArquivos = document.getElementById('input-arquivos');
  const dropzone = document.getElementById('upload-dropzone');
  const listaPreviews = document.getElementById('lista-previews');
  const formNovoTicket = document.getElementById('form-novo-ticket');
  const radioOptions = document.querySelectorAll('.incident-type-option');

  function atualizarContadorCaracteres() {
    if (!textareaDescricao || !charCounter) return;
    const total = textareaDescricao.value.length;
    charCounter.textContent = t('new_ticket_char_counter', { count: total });
    charCounter.style.color = total < 20 ? 'var(--cor-erro)' : 'var(--cor-texto-claro)';
  }

  // 1. Carrega circuitos ativos do cliente
  async function carregarCircuitos() {
    mostrarLoading(t('loading'));
    try {
      const res = await listarMeusCircuitos();
      const circuitos = res.circuitos || [];

      if (circuitos.length === 0) {
        selectCircuito.innerHTML = `<option value="">${escaparHtml(t('new_ticket_circuit_no_circuits'))}</option>`;
        mostrarToast(t('new_ticket_circuit_no_circuits'), 'aviso');
        return;
      }

      selectCircuito.innerHTML = `<option value="">-- ${escaparHtml(t('new_ticket_circuit_select_placeholder'))} --</option>` +
        circuitos.map(c => `
          <option value="${c.id_circuito}">
            ${escaparHtml(c.nome_circuito)} (${escaparHtml(c.identificador_tecnico)} - ${c.tipo_link})
          </option>
        `).join('');
    } catch (err) {
      console.error(err);
      mostrarToast(err.message || t('msg_error_generic'), 'erro');
    } finally {
      esconderLoading();
    }
  }

  // 2. Comportamento dos Radio Buttons de Tipo de Incidente
  radioOptions.forEach(opt => {
    opt.addEventListener('click', () => {
      radioOptions.forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
      const radio = opt.querySelector('input[type="radio"]');
      if (radio) radio.checked = true;
    });
  });

  // 3. Contador de caracteres na descrição
  textareaDescricao?.addEventListener('input', atualizarContadorCaracteres);
  atualizarContadorCaracteres();

  // 4. Gestão de Arquivos (Drag and drop e input)
  dropzone?.addEventListener('click', () => inputArquivos?.click());

  dropzone?.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('drag-over');
  });

  dropzone?.addEventListener('dragleave', () => {
    dropzone.classList.remove('drag-over');
  });

  dropzone?.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('drag-over');
    if (e.dataTransfer?.files) {
      adicionarArquivos(e.dataTransfer.files);
    }
  });

  inputArquivos?.addEventListener('change', () => {
    if (inputArquivos.files) {
      adicionarArquivos(inputArquivos.files);
    }
  });

  function adicionarArquivos(fileList) {
    for (const file of Array.from(fileList)) {
      if (arquivosSelecionados.length >= 5) {
        mostrarToast('Max 5 files limit reached.', 'aviso');
        break;
      }
      if (file.size > 10 * 1024 * 1024) {
        mostrarToast(t('msg_file_too_large', { name: file.name }), 'erro');
        continue;
      }
      if (!arquivosSelecionados.some(f => f.name === file.name)) {
        arquivosSelecionados.push(file);
      }
    }
    renderizarPreviews();
  }

  function renderizarPreviews() {
    if (!listaPreviews) return;
    listaPreviews.innerHTML = '';

    arquivosSelecionados.forEach((file, index) => {
      const item = document.createElement('div');
      item.className = 'preview-item';

      const isImagem = file.type.startsWith('image/');
      const icon = isImagem ? '🖼️' : (file.name.endsWith('.pdf') ? '📄' : '📎');
      const tamanhoKb = Math.round(file.size / 1024);

      item.innerHTML = `
        <span>${icon}</span>
        <span style="font-weight: 600; max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
          ${escaparHtml(file.name)}
        </span>
        <span style="color: var(--cor-texto-muted); font-size: 0.75rem;">(${tamanhoKb} KB)</span>
        <button type="button" class="preview-item-remove" data-index="${index}" title="${escaparHtml(t('close'))}">&times;</button>
      `;

      item.querySelector('.preview-item-remove')?.addEventListener('click', (e) => {
        e.stopPropagation();
        arquivosSelecionados.splice(index, 1);
        renderizarPreviews();
      });

      listaPreviews.appendChild(item);
    });
  }

  // 5. Submit do formulário de abertura
  formNovoTicket?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const idCircuito = selectCircuito.value;
    const tipoRadio = document.querySelector('input[name="tipo_incidente"]:checked');
    const descricao = textareaDescricao.value.trim();

    if (!idCircuito) {
      mostrarToast(t('new_ticket_circuit_select_placeholder'), 'erro');
      selectCircuito.focus();
      return;
    }

    if (!tipoRadio) {
      mostrarToast(t('required_field'), 'erro');
      return;
    }

    if (descricao.length < 20) {
      mostrarToast(t('new_ticket_desc_warning'), 'erro');
      textareaDescricao.focus();
      return;
    }

    mostrarLoading(t('processing'));

    try {
      const anexosBase64 = [];
      for (const arquivo of arquivosSelecionados) {
        anexosBase64.push(await converterArquivoParaBase64(arquivo));
      }

      const payload = {
        id_circuito: idCircuito,
        tipo_incidente: tipoRadio.value,
        descricao: descricao,
        anexos_base64: anexosBase64
      };

      const res = await abrirTicket(payload);

      mostrarToast(t('msg_ticket_created', { id: res.id_ticket }), 'sucesso');
      setTimeout(() => {
        window.location.href = `./ticket.html?id=${encodeURIComponent(res.id_ticket)}`;
      }, 1000);

    } catch (err) {
      console.error(err);
      mostrarToast(err.message || t('msg_error_generic'), 'erro');
    } finally {
      esconderLoading();
    }
  });

  window.addEventListener('inoc_language_changed', () => {
    aplicarTraducoes();
    atualizarContadorCaracteres();
  });

  await carregarCircuitos();
});
