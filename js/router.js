// ==========================================================================
// JS/ROUTER.JS — GUARDA DE ROTAS E PROTEÇÃO DE ACESSO
// ==========================================================================

import { iniciarTimerSessao, renderizarHeaderGlobal } from './auth.js';
import { mostrarToast } from './utils.js';

/**
 * Executa a verificação de autorização e inicializa os componentes na tela
 * @param {boolean} exigeMaster - Se a tela requer permissão de NOC Master
 */
export function protegerRota(exigeMaster = false) {
  const token = localStorage.getItem('token');
  const senhaTemp = localStorage.getItem('senha_temporaria') === 'true';
  const isMaster = localStorage.getItem('is_master') === 'true';

  // 1. Sem token -> login
  if (!token) {
    window.location.href = './login.html';
    return;
  }

  // 2. Senha temporária -> forçar troca
  if (senhaTemp && !window.location.pathname.includes('trocar-senha.html')) {
    window.location.href = './trocar-senha.html';
    return;
  }

  // 3. Exige NOC Master e não é master -> dashboard do cliente
  if (exigeMaster && !isMaster) {
    mostrarToast('Acesso restrito ao Network Operations Center (NOC).', 'aviso');
    setTimeout(() => {
      window.location.href = './dashboard.html';
    }, 1200);
    return;
  }

  // 4. Inicializa Header Global e Timer de 15 minutos
  renderizarHeaderGlobal();
  iniciarTimerSessao();
}

/**
 * Usado na tela de login para redirecionar se o usuário já estiver autenticado
 */
export function verificarJaAutenticado() {
  const token = localStorage.getItem('token');
  const isMaster = localStorage.getItem('is_master') === 'true';
  const senhaTemp = localStorage.getItem('senha_temporaria') === 'true';

  if (token) {
    if (senhaTemp) {
      window.location.href = './trocar-senha.html';
    } else if (isMaster) {
      window.location.href = './noc.html';
    } else {
      window.location.href = './dashboard.html';
    }
  }
}
