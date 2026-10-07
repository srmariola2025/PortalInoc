// ==========================================================================
// JS/NOC-IMPORTAR.JS — IMPORTAÇÃO EM LOTE DE CLIENTES E CIRCUITOS VIA CSV
// ==========================================================================

import { importarBaseCSV } from './api.js';
import { mostrarToast, mostrarLoading, esconderLoading, escaparHtml } from './utils.js';
import { t, aplicarTraducoes } from './i18n.js';

let tipoImportacao = 'clientes'; // 'clientes' ou 'circuitos'
let conteudoCsvCarregado = '';

const TEMPLATE_CLIENTES = `id_cliente;nome_empresa;email_login;senha_inicial;status
CLI-002;Vodafone Carrier Services;noc@vodafone-carrier.com;Mudar@2026;ATIVO
CLI-003;Telefonica Global Solutions;ops@telefonica-global.es;Telef@2026;ATIVO`;

const TEMPLATE_CIRCUITOS = `id_circuito;id_cliente;nome_circuito;tipo_link;identificador_tecnico;status
CIRC-LON-FRA-04;CLI-001;Link Londres - Frankfurt (100 Gbps);Fibra DWDM;VLAN-3001 / IP 195.23.8.1;ATIVO
CIRC-SIN-LIS-05;CLI-002;EllaLink Sines - Lisboa;Submarino;PORT-SN-12;ATIVO`;

document.addEventListener('DOMContentLoaded', () => {
  const tabClientes = document.getElementById('tab-clientes');
  const tabCircuitos = document.getElementById('tab-circuitos');
  const dropzone = document.getElementById('csv-dropzone');
  const inputArquivo = document.getElementById('input-csv-file');
  const previewContainer = document.getElementById('csv-preview-container');
  const previewTbody = document.getElementById('csv-preview-tbody');
  const previewThead = document.getElementById('csv-preview-thead');
  const btnConfirmar = document.getElementById('btn-confirmar-importacao');
  const resultadoCard = document.getElementById('import-resultado-card');
  const btnDownloadTemplate = document.getElementById('btn-download-template');
  const nomeTipoLabel = document.getElementById('nome-tipo-label');

  // Alternar abas Clientes / Circuitos
  function alternarAba(tipo) {
    tipoImportacao = tipo;
    tabClientes?.classList.toggle('active', tipo === 'clientes');
    tabCircuitos?.classList.toggle('active', tipo === 'circuitos');
    if (nomeTipoLabel) {
      nomeTipoLabel.textContent = tipo === 'clientes' ? t('import_tab_clients') : t('import_tab_circuits');
    }
    limparSelecao();
  }

  tabClientes?.addEventListener('click', () => alternarAba('clientes'));
  tabCircuitos?.addEventListener('click', () => alternarAba('circuitos'));

  // Download do Template CSV
  btnDownloadTemplate?.addEventListener('click', (e) => {
    e.preventDefault();
    const texto = tipoImportacao === 'clientes' ? TEMPLATE_CLIENTES : TEMPLATE_CIRCUITOS;
    const blob = new Blob([texto], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `template_${tipoImportacao}_meo.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  });

  // Drag and Drop e Input
  dropzone?.addEventListener('click', () => inputArquivo?.click());

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
    if (e.dataTransfer?.files?.[0]) {
      processarArquivo(e.dataTransfer.files[0]);
    }
  });

  inputArquivo?.addEventListener('change', () => {
    if (inputArquivo.files?.[0]) {
      processarArquivo(inputArquivo.files[0]);
    }
  });

  function processarArquivo(arquivo) {
    if (!arquivo.name.endsWith('.csv') && !arquivo.name.endsWith('.txt')) {
      mostrarToast('Please select a valid .csv file.', 'erro');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      conteudoCsvCarregado = e.target.result;
      renderizarPreviewCsv(conteudoCsvCarregado);
    };
    reader.readAsText(arquivo, 'UTF-8');
  }

  function renderizarPreviewCsv(csvTexto) {
    const linhas = csvTexto.split(/\r?\n/).filter(l => l.trim().length > 0);
    if (linhas.length < 2) {
      mostrarToast('CSV must contain a header row and at least 1 data row.', 'aviso');
      limparSelecao();
      return;
    }

    const cabecalho = linhas[0].split(';').map(c => c.trim());
    if (previewThead) {
      previewThead.innerHTML = `<tr>${cabecalho.map(c => `<th>${escaparHtml(c)}</th>`).join('')}</tr>`;
    }

    const amostraLinhas = linhas.slice(1, 6); // primeiras 5 linhas
    if (previewTbody) {
      previewTbody.innerHTML = amostraLinhas.map(linha => {
        const colunas = linha.split(';').map(c => c.trim());
        return `<tr>${colunas.map(c => `<td>${escaparHtml(c)}</td>`).join('')}</tr>`;
      }).join('');
    }

    if (previewContainer) previewContainer.style.display = 'block';
    if (btnConfirmar) btnConfirmar.disabled = false;
    if (resultadoCard) resultadoCard.style.display = 'none';
  }

  function limparSelecao() {
    conteudoCsvCarregado = '';
    if (inputArquivo) inputArquivo.value = '';
    if (previewContainer) previewContainer.style.display = 'none';
    if (btnConfirmar) btnConfirmar.disabled = true;
    if (resultadoCard) resultadoCard.style.display = 'none';
  }

  // Confirmar Importação
  btnConfirmar?.addEventListener('click', async () => {
    if (!conteudoCsvCarregado) {
      mostrarToast('Select a CSV file first.', 'aviso');
      return;
    }

    mostrarLoading(t('processing'));

    try {
      const res = await importarBaseCSV(tipoImportacao, conteudoCsvCarregado);

      if (resultadoCard) {
        resultadoCard.style.display = 'block';
        resultadoCard.innerHTML = `
          <div style="font-size: 1.125rem; font-weight: 700; color: var(--cor-texto); margin-bottom: 8px;">
            ${escaparHtml(t('import_results_title'))} (${tipoImportacao.toUpperCase()})
          </div>
          <div style="display: flex; gap: 16px; margin-bottom: 12px; font-weight: 600;">
            <span style="color: var(--cor-sucesso);">✅ ${res.inseridos || 0} inserted</span>
            <span style="color: var(--cor-info);">🔄 ${res.atualizados || 0} updated</span>
            <span style="color: var(--cor-erro);">❌ ${(res.erros || []).length} errors</span>
          </div>
          ${(res.erros && res.erros.length > 0) ? `
            <div style="background: #FEE2E2; border: 1px solid #FECACA; padding: 10px; border-radius: 6px; font-size: 0.8125rem; color: #991B1B;">
              <strong>Errors list:</strong>
              <ul style="margin: 6px 0 0 16px;">
                ${res.erros.map(e => `<li>${escaparHtml(e)}</li>`).join('')}
              </ul>
            </div>
          ` : ''}
        `;
      }

      mostrarToast('Batch import finished successfully!', 'sucesso');
      limparSelecao();

    } catch (err) {
      console.error(err);
      mostrarToast(err.message || t('msg_error_generic'), 'erro');
    } finally {
      esconderLoading();
    }
  });

  window.addEventListener('inoc_language_changed', () => {
    aplicarTraducoes();
    if (nomeTipoLabel) {
      nomeTipoLabel.textContent = tipoImportacao === 'clientes' ? t('import_tab_clients') : t('import_tab_circuits');
    }
  });
});
