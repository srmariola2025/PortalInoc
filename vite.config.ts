import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
 return {
 base: '/PortalInoc/',
 plugins: [react(), tailwindcss()],
 resolve: {
 alias: {
 '@': path.resolve(__dirname, '.'),
 },
 },
 build: {
 rollupOptions: {
 input: {
 main: path.resolve(__dirname, 'index.html'),
 login: path.resolve(__dirname, 'login.html'),
 dashboard: path.resolve(__dirname, 'dashboard.html'),
 novoTicket: path.resolve(__dirname, 'novo-ticket.html'),
 ticket: path.resolve(__dirname, 'ticket.html'),
 trocarSenha: path.resolve(__dirname, 'trocar-senha.html'),
 noc: path.resolve(__dirname, 'noc.html'),
 nocTicket: path.resolve(__dirname, 'noc-ticket.html'),
 nocImportar: path.resolve(__dirname, 'noc-importar.html'),
 },
 },
 },
 server: {
 // HMR is disabled in AI Studio via DISABLE_HMR env var.
 // Do not modify—file watching is disabled to prevent flickering during agent edits.
 hmr: process.env.DISABLE_HMR !== 'true',
 // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
 watch: process.env.DISABLE_HMR === 'true' ? null : {},
 },
 };
});
