// ==========================================================================
// JS/CONFIG.JS — CONFIGURAÇÃO DA API GOOGLE APPS SCRIPT E CONSTANTES
// ==========================================================================

/**
 * URL do Google Apps Script publicado como Web App (termina em /exec).
 * Substitua pelo seu deploy real ou configure dinamicamente via localStorage.
 */
export const DEFAULT_API_URL = 'COLE_AQUI_A_URL_DO_APPS_SCRIPT';

// Permite customização dinâmica sem editar código caso o usuário queira testar
export const API_URL = localStorage.getItem('MEO_API_URL') || DEFAULT_API_URL;

// Constantes institucionais MEO Internacional
export const MEO_CONFIG = {
  EMPRESA: 'MEO Internacional',
  PORTAL: 'INOC — International Network Operations Center',
  EMAIL_NOC: 'inoc@meo.pt',
  SLOGAN: 'Conectando o mundo com excelência',
  TIMEOUT_SESSAO_MIN: 15,
  TIMEOUT_OTP_MIN: 10,
  LOGO_URL: './assets/meo-logo.svg',
  LOGO_WHITE_URL: './assets/meo-logo-white.svg'
};
