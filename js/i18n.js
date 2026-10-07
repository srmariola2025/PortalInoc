// ==========================================================================
// JS/I18N.JS — MOTOR DE MULTI-IDIOMA (INGLÊS DEFAULT, PORTUGUÊS E ESPANHOL)
// ==========================================================================

export const IDIOMAS_SUPORTADOS = ['en', 'pt', 'es'];
export const IDIOMA_PADRAO = 'en';

export const TRADUCOES = {
  // =========================================================================
  // ENGLISH (EN) — DEFAULT / PREFERRED FOR INTERNATIONAL CLIENTS
  // =========================================================================
  en: {
    // Header & Brand
    portal_name: 'INOC Portal',
    portal_subtitle: 'MEO International',
    portal_fullname: 'International Network Operations Center',
    portal_tagline: 'Connecting the world with excellence',
    portal_title_full: 'Incident Ticket Management Portal',
    noc_master_badge: 'NOC Master Operations',
    session_timer_title: 'Security session remaining time (15 min)',
    session_expiring_warning: 'Session expiring in less than 2 minutes!',
    btn_noc_panel: 'NOC Panel',
    btn_client_portal: 'Client Portal',
    btn_logout: 'Sign Out',
    btn_logout_title: 'End session securely',

    // Language Selector
    lang_select: 'Language',
    lang_en: 'English',
    lang_pt: 'Português',
    lang_es: 'Español',

    // Common Actions & Labels
    loading: 'Loading...',
    processing: 'Processing request...',
    confirm: 'Confirm',
    cancel: 'Cancel',
    save: 'Save',
    back: 'Back',
    close: 'Close',
    actions: 'Actions',
    search: 'Search',
    all: 'All',
    view: 'View',
    view_details: 'View Details',
    view_ticket: 'View Ticket',
    drive_folder: 'Drive Attachments',
    view_on_drive: 'Open attachments on Google Drive',
    required_field: 'Required field',
    status: 'Status',
    date: 'Date',
    client: 'Client',
    circuit: 'Circuit',
    technical_id: 'Technical ID / VLAN / IP',
    link_type: 'Link Type',
    description: 'Description',
    created_at: 'Created at',
    updated_at: 'Last update',
    pending_until: 'Pending until',
    comments: 'Comments',
    timeline: 'Timeline & History',

    // Status Badges
    status_aberto: 'Open',
    status_em_resolucao: 'In Resolution',
    status_pendente: 'Pending',
    status_resolvido: 'Resolved',
    status_todos: 'All Statuses',

    // Incident Types
    type_corte_total: 'Total Outage',
    type_corte_parcial: 'Partial Outage / Degradation',
    type_ensaio: 'Joint Testing / Loopback',
    type_corte_total_desc: 'Complete loss of link, LOS alarms, zero traffic on primary/backup circuit.',
    type_corte_parcial_desc: 'Packet loss, high latency, intermittent drops or jitter on international link.',
    type_ensaio_desc: 'Scheduled loop testing, BERT test, route validation or joint NOC-client tests.',

    // Login Page
    login_meta_title: 'Login | INOC — MEO International',
    login_card_subtitle: 'Incident Portal — MEO International',
    login_label_email: 'Corporate Email',
    login_placeholder_email: 'client@company.com',
    login_label_password: 'Password',
    login_placeholder_password: '••••••••',
    login_btn_submit: 'Sign In',
    login_forgot_password: 'Forgot my password',
    login_badge_2fa: 'Secure 2FA Access',
    login_otp_title: 'Two-Factor Authentication (2FA)',
    login_otp_msg: 'A 6-digit security OTP code was sent to your email. Enter the code below to complete sign in.',
    login_otp_validity: 'Code is valid for 10 minutes. Single-use.',
    login_otp_label: '6-Digit OTP Code',
    login_otp_placeholder: '000000',
    login_otp_btn_verify: 'Verify OTP & Continue',
    login_otp_resend: 'Resend code',
    login_otp_wait_resend: 'Resend available in {sec}s',
    login_otp_back_login: 'Back to login',
    login_recup_title: 'Password Recovery',
    login_recup_desc: 'Enter your registered corporate email to receive a temporary access password.',
    login_recup_btn_submit: 'Send Temporary Password',
    login_recup_back: 'Back to sign in',

    // Change Password Page
    pwchange_title: 'New Password Required',
    pwchange_subtitle: 'Temporary password detected. For your security, define a new password before continuing.',
    pwchange_label_email: 'Corporate Email',
    pwchange_label_current: 'Temporary / Current Password',
    pwchange_label_new: 'New Password',
    pwchange_placeholder_new: 'Minimum 8 characters (letters, numbers)',
    pwchange_label_confirm: 'Confirm New Password',
    pwchange_placeholder_confirm: 'Repeat new password',
    pwchange_btn_submit: 'Update Password & Access Portal',
    pwchange_btn_cancel: 'Cancel & Sign Out',
    pwchange_rules: 'Password must have at least 8 characters, combining uppercase/lowercase letters and numbers.',

    // Dashboard Page
    dash_meta_title: 'My Tickets | INOC — MEO International',
    dash_title: 'My Incident Tickets',
    dash_subtitle: 'Monitor active status and technical progress of your international telecom circuits.',
    dash_btn_new_ticket: '+ Open New Ticket',
    dash_filter_label: 'Filter by Status:',
    dash_realtime_badge: 'Real-time updates from INOC 24x7 Operations',
    dash_empty_title: 'No tickets found',
    dash_empty_desc: 'You have no tickets matching the current filter.',
    dash_card_circuit: 'Circuit:',
    dash_card_type: 'Incident Type:',
    dash_card_opened: 'Opened:',
    dash_card_updated: 'Updated:',
    dash_card_pending_sla: 'Pending until:',

    // New Ticket Page
    new_ticket_meta_title: 'Open Ticket | INOC — MEO International',
    new_ticket_title: 'Open Incident Ticket',
    new_ticket_subtitle: 'Report a link failure, degradation, or request joint testing on your telecom circuit.',
    new_ticket_step_circuit: '1. Select Affected Circuit',
    new_ticket_circuit_select_placeholder: 'Choose a circuit...',
    new_ticket_circuit_no_circuits: 'No circuits found for this account.',
    new_ticket_step_type: '2. Incident Classification',
    new_ticket_step_desc: '3. Technical Description',
    new_ticket_desc_placeholder: 'Describe observed symptoms, timestamp of outage, interface alarms (LOS, CRC), local troubleshooting performed...',
    new_ticket_char_counter: '{count}/200 characters (minimum 20)',
    new_ticket_desc_warning: 'Minimum 20 characters required for technical triage.',
    new_ticket_step_files: '4. Attachments (Optional)',
    new_ticket_dropzone_text: 'Drag & drop logs, traceroutes or alarm screenshots here, or click to browse',
    new_ticket_dropzone_hint: 'Supported: PDF, PNG, JPG, TXT, LOG (Max 10MB each)',
    new_ticket_btn_submit: 'Submit Incident Ticket',
    new_ticket_btn_cancel: 'Cancel & Return to Dashboard',

    // Ticket View Page
    ticket_meta_title: 'Ticket {id} | INOC — MEO International',
    ticket_breadcrumb_dash: 'Dashboard',
    ticket_section_specs: 'Circuit Technical Specifications',
    ticket_info_circuit_name: 'Circuit Name',
    ticket_info_link_type: 'Link Technology',
    ticket_info_tech_id: 'Technical Identifier',
    ticket_info_client: 'Client Entity',
    ticket_info_opened: 'Opened at',
    ticket_info_last_update: 'Last Technical Update',
    ticket_info_drive: 'Google Drive Repository',
    ticket_section_desc: 'Initial Incident Report',
    ticket_section_timeline: 'Technical Resolution Timeline & Communications',
    ticket_timeline_empty: 'No technical updates recorded yet.',
    ticket_comment_box_title: 'Send Technical Update / Information',
    ticket_comment_placeholder: 'Add technical remarks, loop test results, or feedback for INOC engineers...',
    ticket_comment_attach_btn: 'Attach file',
    ticket_comment_submit_btn: 'Send Update',
    ticket_resolved_banner_title: 'Ticket Resolved',
    ticket_resolved_banner_desc: 'This ticket has been marked as RESOLVED by the INOC team. Comments and additions are now closed.',
    ticket_badge_noc: '🛡️ INOC Engineer',
    ticket_badge_client: '👤 Client Representative',

    // NOC Master Panel
    noc_meta_title: 'NOC Master Console | INOC — MEO International',
    noc_title: 'INOC Master Operations Console',
    noc_subtitle: 'Global management of international telecom incidents, SLA monitoring, and technical dispatches.',
    noc_btn_import_csv: '📂 Bulk CSV Import',
    noc_btn_refresh: '🔄 Refresh Data',
    noc_kpi_total: 'Total Tickets',
    noc_kpi_open: 'Open / Triage',
    noc_kpi_in_res: 'In Resolution',
    noc_kpi_pending: 'Pending SLA',
    noc_kpi_resolved: 'Resolved',
    noc_filter_client: 'Filter by Client:',
    noc_filter_all_clients: 'All Clients',
    noc_filter_type: 'Incident Type:',
    noc_filter_all_types: 'All Types',
    noc_search_placeholder: 'Search by Ticket ID, circuit name, client, tech ID...',
    noc_table_id: 'Ticket ID',
    noc_table_client: 'Client',
    noc_table_circuit: 'Circuit & Tech ID',
    noc_table_type: 'Incident',
    noc_table_status: 'Status',
    noc_table_dates: 'Timestamps',
    noc_table_actions: 'Action',
    noc_btn_manage: 'Manage',

    // NOC Master Ticket Management
    noc_ticket_meta_title: 'NOC Master: {id} | INOC — MEO International',
    noc_ticket_status_box_title: 'Incident Status & SLA Management',
    noc_ticket_change_status_label: 'Update Incident Status:',
    noc_ticket_btn_update_status: 'Apply Status Change',
    noc_ticket_sla_label: 'SLA Expiration Date/Time (Mandatory for Pending):',
    noc_ticket_sla_helper: 'Set the deadline for client response or carrier joint intervention.',
    noc_ticket_comment_title: 'Publish INOC Official Update',
    noc_ticket_comment_placeholder: 'Technical report, RFO (Reason For Outage), fiber splice coordinates, carrier dispatch info...',
    noc_ticket_comment_submit: 'Publish & Notify Client via Email',

    // NOC CSV Import
    import_meta_title: 'CSV Import | INOC — MEO International',
    import_title: 'Bulk Import: Clients & Circuits',
    import_subtitle: 'Populate the Google Sheets database in batches using standard CSV templates.',
    import_tab_clients: '👥 Import Clients',
    import_tab_circuits: '🌐 Import Circuits',
    import_clients_desc: 'Upload CSV with columns: nome_empresa, email_login, senha, status.',
    import_circuits_desc: 'Upload CSV with columns: id_cliente, nome_circuito, tipo_link, identificador_tecnico, status.',
    import_btn_download_template: '📥 Download CSV Template',
    import_dropzone_text: 'Drop CSV file here or click to browse',
    import_btn_process: '🚀 Process and Upload to Google Sheets',
    import_results_title: 'Import Execution Summary',

    // Footer
    footer_brand: 'MEO International — INOC (International Network Operations Center)',
    footer_support: '24x7 NOC Hotline:',
    footer_copyright: '© 2026 MEO International. All rights reserved.',

    // Notifications & Messages
    msg_login_otp_sent: 'Credentials validated! A 6-digit OTP code has been sent to your email.',
    msg_login_success: 'Authentication successful. Welcome to INOC Portal!',
    msg_otp_invalid: 'Invalid or expired OTP code. Please try again.',
    msg_fill_all_fields: 'Please fill in all required fields.',
    msg_password_mismatch: 'Passwords do not match.',
    msg_password_too_short: 'Password must have at least 8 characters.',
    msg_password_changed: 'Password updated successfully! Redirecting...',
    msg_recovery_sent: 'If the email is registered, temporary password instructions have been sent.',
    msg_ticket_created: 'Ticket {id} opened successfully! Folder created on Google Drive.',
    msg_comment_added: 'Technical update sent successfully.',
    msg_status_updated: 'Ticket status updated to {status}.',
    msg_session_expired: 'Your session has expired. Please sign in again.',
    msg_confirm_resolve: 'Are you sure you want to resolve ticket {id}? This action marks the incident as finished.',
    msg_confirm_logout: 'Do you want to sign out from the portal?',
    msg_file_too_large: 'File exceeds 10MB limit: {name}',
    msg_error_generic: 'An unexpected error occurred. Please contact the INOC team.'
  },

  // =========================================================================
  // PORTUGUÊS (PT)
  // =========================================================================
  pt: {
    // Header & Brand
    portal_name: 'INOC Portal',
    portal_subtitle: 'MEO Internacional',
    portal_fullname: 'International Network Operations Center',
    portal_tagline: 'Conectando o mundo com excelência',
    portal_title_full: 'Portal de Gestão de Tickets de Incidentes',
    noc_master_badge: 'Operações NOC Master',
    session_timer_title: 'Tempo restante da sessão de segurança (15 min)',
    session_expiring_warning: 'Sessão expirando em menos de 2 minutos!',
    btn_noc_panel: 'Painel NOC',
    btn_client_portal: 'Portal do Cliente',
    btn_logout: 'Sair',
    btn_logout_title: 'Encerrar sessão de forma segura',

    // Language Selector
    lang_select: 'Idioma',
    lang_en: 'English',
    lang_pt: 'Português',
    lang_es: 'Español',

    // Common Actions & Labels
    loading: 'Carregando...',
    processing: 'Processando requisição...',
    confirm: 'Confirmar',
    cancel: 'Cancelar',
    save: 'Salvar',
    back: 'Voltar',
    close: 'Fechar',
    actions: 'Ações',
    search: 'Buscar',
    all: 'Todos',
    view: 'Visualizar',
    view_details: 'Ver Detalhes',
    view_ticket: 'Ver Ticket',
    drive_folder: 'Anexos no Drive',
    view_on_drive: 'Abrir pasta no Google Drive',
    required_field: 'Campo obrigatório',
    status: 'Status',
    date: 'Data',
    client: 'Cliente',
    circuit: 'Circuito',
    technical_id: 'Identificador Técnico / VLAN / IP',
    link_type: 'Tipo de Link',
    description: 'Descrição',
    created_at: 'Criado em',
    updated_at: 'Última atualização',
    pending_until: 'Pendente até',
    comments: 'Comentários',
    timeline: 'Linha do Tempo e Histórico',

    // Status Badges
    status_aberto: 'Aberto',
    status_em_resolucao: 'Em Resolução',
    status_pendente: 'Pendente',
    status_resolvido: 'Resolvido',
    status_todos: 'Todos os Status',

    // Incident Types
    type_corte_total: 'Corte Total',
    type_corte_parcial: 'Corte Parcial / Degradação',
    type_ensaio: 'Ensaio Técnico / Loopback',
    type_corte_total_desc: 'Perda total do enlace, alarmes de LOS, tráfego zerado no circuito primário/backup.',
    type_corte_parcial_desc: 'Perda de pacotes, alta latência, quedas intermitentes ou jitter no circuito internacional.',
    type_ensaio_desc: 'Testes de loop agendados, teste BERT, validação de rota ou ensaios conjuntos NOC-cliente.',

    // Login Page
    login_meta_title: 'Login | INOC — MEO Internacional',
    login_card_subtitle: 'Portal de Incidentes — MEO Internacional',
    login_label_email: 'E-mail Corporativo',
    login_placeholder_email: 'cliente@empresa.com',
    login_label_password: 'Senha de Acesso',
    login_placeholder_password: '••••••••',
    login_btn_submit: 'Entrar',
    login_forgot_password: 'Esqueci minha senha',
    login_badge_2fa: 'Acesso Seguro 2FA',
    login_otp_title: 'Autenticação em Dois Fatores (2FA)',
    login_otp_msg: 'Um código OTP de segurança de 6 dígitos foi enviado ao seu e-mail corporativo. Digite abaixo para autenticar.',
    login_otp_validity: 'Código válido por 10 minutos. Uso único.',
    login_otp_label: 'Código OTP (6 Dígitos)',
    login_otp_placeholder: '000000',
    login_otp_btn_verify: 'Validar Código OTP',
    login_otp_resend: 'Reenviar código',
    login_otp_wait_resend: 'Reenvio disponível em {sec}s',
    login_otp_back_login: 'Voltar ao login',
    login_recup_title: 'Recuperação de Senha',
    login_recup_desc: 'Informe o e-mail corporativo cadastrado para receber uma senha de acesso temporária.',
    login_recup_btn_submit: 'Enviar Senha Temporária',
    login_recup_back: 'Voltar para a tela de login',

    // Change Password Page
    pwchange_title: 'Troca de Senha Obrigatória',
    pwchange_subtitle: 'Senha temporária identificada. Por segurança, redefina sua senha corporativa antes de prosseguir.',
    pwchange_label_email: 'E-mail Cadastrado',
    pwchange_label_current: 'Senha Temporária / Atual',
    pwchange_label_new: 'Nova Senha',
    pwchange_placeholder_new: 'Mínimo de 8 caracteres (letras, números)',
    pwchange_label_confirm: 'Confirmar Nova Senha',
    pwchange_placeholder_confirm: 'Repita a nova senha',
    pwchange_btn_submit: 'Atualizar Senha e Continuar',
    pwchange_btn_cancel: 'Cancelar e Sair',
    pwchange_rules: 'A nova senha deve ter no mínimo 8 caracteres, combinando letras maiúsculas/minúsculas e números.',

    // Dashboard Page
    dash_meta_title: 'Meus Tickets | INOC — MEO Internacional',
    dash_title: 'Meus Tickets de Incidentes',
    dash_subtitle: 'Acompanhe o status e posicionamento técnico dos seus circuitos de telecomunicações.',
    dash_btn_new_ticket: '+ Abrir Novo Ticket',
    dash_filter_label: 'Filtrar por Status:',
    dash_realtime_badge: 'Atualizado em tempo real pelo INOC Operations 24x7',
    dash_empty_title: 'Nenhum ticket encontrado',
    dash_empty_desc: 'Não há registros de tickets para o filtro selecionado.',
    dash_card_circuit: 'Circuito:',
    dash_card_type: 'Tipo de Incidente:',
    dash_card_opened: 'Abertura:',
    dash_card_updated: 'Atualização:',
    dash_card_pending_sla: 'Pendente até:',

    // New Ticket Page
    new_ticket_meta_title: 'Abrir Ticket | INOC — MEO Internacional',
    new_ticket_title: 'Abertura de Ticket de Incidente',
    new_ticket_subtitle: 'Notifique falhas, degradação ou solicite ensaios conjuntos em seu circuito de telecomunicações.',
    new_ticket_step_circuit: '1. Selecione o Circuito Afetado',
    new_ticket_circuit_select_placeholder: 'Selecione um circuito...',
    new_ticket_circuit_no_circuits: 'Nenhum circuito cadastrado para esta conta.',
    new_ticket_step_type: '2. Tipo de Incidente',
    new_ticket_step_desc: '3. Descrição Detalhada',
    new_ticket_desc_placeholder: 'Descreva os sintomas observados, horário do corte/degradação, alarmes nas portas (LOS, CRC), testes locais efetuados...',
    new_ticket_char_counter: '{count}/200 caracteres (mínimo 20)',
    new_ticket_desc_warning: 'Mínimo de 20 caracteres obrigatórios para triagem técnica.',
    new_ticket_step_files: '4. Anexos Técnicos (Opcional)',
    new_ticket_dropzone_text: 'Arraste arquivos de log, traceroute ou print de alarmes aqui, ou clique para selecionar',
    new_ticket_dropzone_hint: 'Formatos aceitos: PDF, PNG, JPG, TXT, LOG (máx. 10MB por arquivo)',
    new_ticket_btn_submit: 'Abrir Ticket de Incidente',
    new_ticket_btn_cancel: 'Cancelar e Voltar ao Dashboard',

    // Ticket View Page
    ticket_meta_title: 'Ticket {id} | INOC — MEO Internacional',
    ticket_breadcrumb_dash: 'Dashboard',
    ticket_section_specs: 'Dados Técnicos do Circuito',
    ticket_info_circuit_name: 'Nome do Circuito',
    ticket_info_link_type: 'Tecnologia do Link',
    ticket_info_tech_id: 'Identificador Técnico',
    ticket_info_client: 'Cliente Solicitante',
    ticket_info_opened: 'Data de Abertura',
    ticket_info_last_update: 'Última Atualização',
    ticket_info_drive: 'Pasta de Arquivos no Google Drive',
    ticket_section_desc: 'Descrição Inicial do Incidente',
    ticket_section_timeline: 'Linha do Tempo e Comunicação Técnica',
    ticket_timeline_empty: 'Ainda não há posicionamentos técnicos registrados.',
    ticket_comment_box_title: 'Enviar Posicionamento Técnico / Informações',
    ticket_comment_placeholder: 'Adicione observações técnicas, resultados de testes ou retorno aos engenheiros do INOC...',
    ticket_comment_attach_btn: 'Anexar arquivo',
    ticket_comment_submit_btn: 'Enviar Posicionamento',
    ticket_resolved_banner_title: 'Ticket Resolvido',
    ticket_resolved_banner_desc: 'Este ticket foi finalizado pela equipe técnica do INOC. Comentários e novos anexos foram encerrados.',
    ticket_badge_noc: '🛡️ Engenharia INOC',
    ticket_badge_client: '👤 Representante do Cliente',

    // NOC Master Panel
    noc_meta_title: 'Painel Master NOC | INOC — MEO Internacional',
    noc_title: 'Painel Master — Operações INOC',
    noc_subtitle: 'Visão unificada de incidentes globais, monitoramento de SLA e despacho técnico.',
    noc_btn_import_csv: '📂 Importar Dados (CSV)',
    noc_btn_refresh: '🔄 Atualizar Dados',
    noc_kpi_total: 'Total de Tickets',
    noc_kpi_open: 'Abertos / Triagem',
    noc_kpi_in_res: 'Em Resolução',
    noc_kpi_pending: 'Pendentes SLA',
    noc_kpi_resolved: 'Resolvidos',
    noc_filter_client: 'Filtrar por Cliente:',
    noc_filter_all_clients: 'Todos os Clientes',
    noc_filter_type: 'Tipo de Incidente:',
    noc_filter_all_types: 'Todos os Tipos',
    noc_search_placeholder: 'Buscar por ID do Ticket, circuito, cliente, ID técnico...',
    noc_table_id: 'ID Ticket',
    noc_table_client: 'Cliente',
    noc_table_circuit: 'Circuito & ID Técnico',
    noc_table_type: 'Incidente',
    noc_table_status: 'Status',
    noc_table_dates: 'Datas',
    noc_table_actions: 'Ação',
    noc_btn_manage: 'Gerenciar',

    // NOC Master Ticket Management
    noc_ticket_meta_title: 'NOC Master: {id} | INOC — MEO Internacional',
    noc_ticket_status_box_title: 'Gestão de Status e SLA do Incidente',
    noc_ticket_change_status_label: 'Alterar Status do Ticket:',
    noc_ticket_btn_update_status: 'Atualizar Status',
    noc_ticket_sla_label: 'Data/Hora Limite da Pendência (Obrigatória para Pendente):',
    noc_ticket_sla_helper: 'Define o prazo de tolerância para retorno do cliente ou concessionária.',
    noc_ticket_comment_title: 'Publicar Posicionamento Técnico Oficial INOC',
    noc_ticket_comment_placeholder: 'Relatório técnico, RFO, coordenadas de fusão óptica, dados de despacho de campo...',
    noc_ticket_comment_submit: 'Publicar e Notificar Cliente via E-mail',

    // NOC CSV Import
    import_meta_title: 'Importação CSV | INOC — MEO Internacional',
    import_title: 'Importação em Lote de Dados (CSV)',
    import_subtitle: 'Alimente o banco de dados Google Sheets com clientes e circuitos em massa.',
    import_tab_clients: '👥 Importar Clientes',
    import_tab_circuits: '🌐 Importar Circuitos',
    import_clients_desc: 'Envie um arquivo CSV com as colunas: nome_empresa, email_login, senha, status.',
    import_circuits_desc: 'Envie um arquivo CSV com as colunas: id_cliente, nome_circuito, tipo_link, identificador_tecnico, status.',
    import_btn_download_template: '📥 Baixar Modelo CSV',
    import_dropzone_text: 'Arraste o arquivo CSV aqui ou clique para selecionar',
    import_btn_process: '🚀 Processar e Gravar no Google Sheets',
    import_results_title: 'Resumo da Importação',

    // Footer
    footer_brand: 'MEO Internacional — INOC (International Network Operations Center)',
    footer_support: 'Central NOC 24x7:',
    footer_copyright: '© 2026 MEO Internacional. Todos os direitos reservados.',

    // Notifications & Messages
    msg_login_otp_sent: 'Credenciais válidas! Código OTP de 6 dígitos enviado para seu e-mail.',
    msg_login_success: 'Autenticação realizada com sucesso. Bem-vindo ao INOC!',
    msg_otp_invalid: 'Código OTP inválido ou expirado. Verifique e tente novamente.',
    msg_fill_all_fields: 'Por favor, preencha todos os campos obrigatórios.',
    msg_password_mismatch: 'As senhas não coincidem.',
    msg_password_too_short: 'A senha deve conter no mínimo 8 caracteres.',
    msg_password_changed: 'Senha alterada com sucesso! Redirecionando...',
    msg_recovery_sent: 'Se o e-mail estiver cadastrado, a nova senha temporária foi enviada.',
    msg_ticket_created: 'Ticket {id} aberto com sucesso! Pasta criada no Google Drive.',
    msg_comment_added: 'Comentário técnico registrado com sucesso.',
    msg_status_updated: 'Status do ticket atualizado para {status}.',
    msg_session_expired: 'Sua sessão expirou por inatividade. Faça login novamente.',
    msg_confirm_resolve: 'Deseja realmente marcar o ticket {id} como RESOLVIDO? Esta ação finaliza o incidente.',
    msg_confirm_logout: 'Deseja realmente encerrar a sessão no portal?',
    msg_file_too_large: 'Arquivo excede o limite de 10MB: {name}',
    msg_error_generic: 'Ocorreu um erro inesperado. Entre em contato com a equipe INOC.'
  },

  // =========================================================================
  // ESPAÑOL (ES)
  // =========================================================================
  es: {
    // Header & Brand
    portal_name: 'INOC Portal',
    portal_subtitle: 'MEO Internacional',
    portal_fullname: 'International Network Operations Center',
    portal_tagline: 'Conectando el mundo con excelencia',
    portal_title_full: 'Portal de Gestión de Tickets de Incidentes',
    noc_master_badge: 'Operaciones NOC Master',
    session_timer_title: 'Tiempo restante de la sesión segura (15 min)',
    session_expiring_warning: '¡Sesión a punto de expirar en menos de 2 minutos!',
    btn_noc_panel: 'Panel NOC',
    btn_client_portal: 'Portal del Cliente',
    btn_logout: 'Cerrar Sesión',
    btn_logout_title: 'Cerrar sesión de forma segura',

    // Language Selector
    lang_select: 'Idioma',
    lang_en: 'English',
    lang_pt: 'Português',
    lang_es: 'Español',

    // Common Actions & Labels
    loading: 'Cargando...',
    processing: 'Procesando solicitud...',
    confirm: 'Confirmar',
    cancel: 'Cancelar',
    save: 'Guardar',
    back: 'Volver',
    close: 'Cerrar',
    actions: 'Acciones',
    search: 'Buscar',
    all: 'Todos',
    view: 'Ver',
    view_details: 'Ver Detalles',
    view_ticket: 'Ver Ticket',
    drive_folder: 'Adjuntos en Drive',
    view_on_drive: 'Abrir carpeta en Google Drive',
    required_field: 'Campo obligatorio',
    status: 'Estado',
    date: 'Fecha',
    client: 'Cliente',
    circuit: 'Circuito',
    technical_id: 'Identificador Técnico / VLAN / IP',
    link_type: 'Tipo de Enlace',
    description: 'Descripción',
    created_at: 'Creado el',
    updated_at: 'Última actualización',
    pending_until: 'Pendiente hasta',
    comments: 'Comentarios',
    timeline: 'Línea de Tiempo e Historial',

    // Status Badges
    status_aberto: 'Abierto',
    status_em_resolucao: 'En Resolución',
    status_pendente: 'Pendiente',
    status_resolvido: 'Resuelto',
    status_todos: 'Todos los Estados',

    // Incident Types
    type_corte_total: 'Corte Total',
    type_corte_parcial: 'Corte Parcial / Degradación',
    type_ensaio: 'Ensayo Técnico / Loopback',
    type_corte_total_desc: 'Pérdida total del enlace, alarmas LOS, tráfico nulo en circuito principal/respaldo.',
    type_corte_parcial_desc: 'Pérdida de paquetes, latencia elevada, cortes intermitentes o jitter en enlace internacional.',
    type_ensaio_desc: 'Pruebas de bucle programadas, prueba BERT, validación de ruta o ensayos conjuntos NOC-cliente.',

    // Login Page
    login_meta_title: 'Iniciar Sesión | INOC — MEO Internacional',
    login_card_subtitle: 'Portal de Incidentes — MEO Internacional',
    login_label_email: 'Correo Electrónico Corporativo',
    login_placeholder_email: 'cliente@empresa.com',
    login_label_password: 'Contraseña de Acceso',
    login_placeholder_password: '••••••••',
    login_btn_submit: 'Iniciar Sesión',
    login_forgot_password: 'Olvidé mi contraseña',
    login_badge_2fa: 'Acceso Seguro 2FA',
    login_otp_title: 'Autenticación en Dos Pasos (2FA)',
    login_otp_msg: 'Se ha enviado un código de seguridad OTP de 6 dígitos a su correo electrónico. Ingréselo para continuar.',
    login_otp_validity: 'Código válido durante 10 minutos. Uso único.',
    login_otp_label: 'Código OTP (6 Dígitos)',
    login_otp_placeholder: '000000',
    login_otp_btn_verify: 'Validar Código OTP',
    login_otp_resend: 'Reenviar código',
    login_otp_wait_resend: 'Reenvío disponible en {sec}s',
    login_otp_back_login: 'Volver al inicio',
    login_recup_title: 'Recuperación de Contraseña',
    login_recup_desc: 'Ingrese su correo corporativo registrado para recibir una contraseña temporal de acceso.',
    login_recup_btn_submit: 'Enviar Contraseña Temporal',
    login_recup_back: 'Volver al inicio de sesión',

    // Change Password Page
    pwchange_title: 'Cambio de Contraseña Obligatorio',
    pwchange_subtitle: 'Contraseña temporal detectada. Por seguridad, establezca una nueva contraseña antes de continuar.',
    pwchange_label_email: 'Correo Electrónico',
    pwchange_label_current: 'Contraseña Temporal / Actual',
    pwchange_label_new: 'Nueva Contraseña',
    pwchange_placeholder_new: 'Mínimo 8 caracteres (letras, números)',
    pwchange_label_confirm: 'Confirmar Nueva Contraseña',
    pwchange_placeholder_confirm: 'Repita la nueva contraseña',
    pwchange_btn_submit: 'Actualizar Contraseña y Continuar',
    pwchange_btn_cancel: 'Cancelar y Salir',
    pwchange_rules: 'La contraseña debe contener al menos 8 caracteres, combinando mayúsculas, minúsculas y números.',

    // Dashboard Page
    dash_meta_title: 'Mis Tickets | INOC — MEO Internacional',
    dash_title: 'Mis Tickets de Incidentes',
    dash_subtitle: 'Consulte el estado activo y los avances técnicos de sus circuitos internacionales de telecomunicaciones.',
    dash_btn_new_ticket: '+ Abrir Nuevo Ticket',
    dash_filter_label: 'Filtrar por Estado:',
    dash_realtime_badge: 'Actualizado en tiempo real por el equipo INOC 24x7',
    dash_empty_title: 'No se encontraron tickets',
    dash_empty_desc: 'No existen registros que coincidan con el filtro seleccionado.',
    dash_card_circuit: 'Circuito:',
    dash_card_type: 'Tipo de Incidente:',
    dash_card_opened: 'Apertura:',
    dash_card_updated: 'Actualización:',
    dash_card_pending_sla: 'Pendiente hasta:',

    // New Ticket Page
    new_ticket_meta_title: 'Abrir Ticket | INOC — MEO Internacional',
    new_ticket_title: 'Apertura de Ticket de Incidente',
    new_ticket_subtitle: 'Notifique caídas de enlace, degradación o solicite ensayos conjuntos en su circuito.',
    new_ticket_step_circuit: '1. Seleccione el Circuito Afectado',
    new_ticket_circuit_select_placeholder: 'Seleccione un circuito...',
    new_ticket_circuit_no_circuits: 'No hay circuitos registrados para esta cuenta.',
    new_ticket_step_type: '2. Clasificación del Incidente',
    new_ticket_step_desc: '3. Descripción Detallada',
    new_ticket_desc_placeholder: 'Describa síntomas observados, hora de inicio del corte, alarmas de interfaz (LOS, CRC), pruebas locales realizadas...',
    new_ticket_char_counter: '{count}/200 caracteres (mínimo 20)',
    new_ticket_desc_warning: 'Se requiere un mínimo de 20 caracteres para la evaluación técnica.',
    new_ticket_step_files: '4. Archivos Adjuntos (Opcional)',
    new_ticket_dropzone_text: 'Arrastre archivos de logs, traceroute o capturas de alarmas aquí, o haga clic para seleccionar',
    new_ticket_dropzone_hint: 'Formatos admitidos: PDF, PNG, JPG, TXT, LOG (máx. 10MB por archivo)',
    new_ticket_btn_submit: 'Enviar Ticket de Incidente',
    new_ticket_btn_cancel: 'Cancelar y Volver al Dashboard',

    // Ticket View Page
    ticket_meta_title: 'Ticket {id} | INOC — MEO Internacional',
    ticket_breadcrumb_dash: 'Dashboard',
    ticket_section_specs: 'Especificaciones Técnicas del Circuito',
    ticket_info_circuit_name: 'Nombre del Circuito',
    ticket_info_link_type: 'Tecnología de Enlace',
    ticket_info_tech_id: 'Identificador Técnico',
    ticket_info_client: 'Cliente Solicitante',
    ticket_info_opened: 'Fecha de Apertura',
    ticket_info_last_update: 'Última Actualización',
    ticket_info_drive: 'Repositorio en Google Drive',
    ticket_section_desc: 'Descripción Inicial del Incidente',
    ticket_section_timeline: 'Línea de Tiempo y Comunicación Técnica',
    ticket_timeline_empty: 'Aún no se han registrado actualizaciones técnicas.',
    ticket_comment_box_title: 'Enviar Actualización Técnica / Comentarios',
    ticket_comment_placeholder: 'Agregue observaciones técnicas, resultados de pruebas o respuestas para el equipo INOC...',
    ticket_comment_attach_btn: 'Adjuntar archivo',
    ticket_comment_submit_btn: 'Enviar Actualización',
    ticket_resolved_banner_title: 'Ticket Resuelto',
    ticket_resolved_banner_desc: 'Este ticket ha sido cerrado por el equipo de ingeniería INOC. El ingreso de comentarios ha concluido.',
    ticket_badge_noc: '🛡️ Ingeniería INOC',
    ticket_badge_client: '👤 Representante del Cliente',

    // NOC Master Panel
    noc_meta_title: 'Consola Master NOC | INOC — MEO Internacional',
    noc_title: 'Consola Master — Operaciones INOC',
    noc_subtitle: 'Gestión unificada de incidentes internacionales, control de SLA y despacho técnico 24x7.',
    noc_btn_import_csv: '📂 Importación Masiva (CSV)',
    noc_btn_refresh: '🔄 Actualizar Datos',
    noc_kpi_total: 'Total de Tickets',
    noc_kpi_open: 'Abiertos / Triaje',
    noc_kpi_in_res: 'En Resolución',
    noc_kpi_pending: 'Pendientes SLA',
    noc_kpi_resolved: 'Resueltos',
    noc_filter_client: 'Filtrar por Cliente:',
    noc_filter_all_clients: 'Todos los Clientes',
    noc_filter_type: 'Tipo de Incidente:',
    noc_filter_all_types: 'Todos los Tipos',
    noc_search_placeholder: 'Buscar por ID de Ticket, circuito, cliente, ID técnico...',
    noc_table_id: 'ID Ticket',
    noc_table_client: 'Cliente',
    noc_table_circuit: 'Circuito e ID Técnico',
    noc_table_type: 'Incidente',
    noc_table_status: 'Estado',
    noc_table_dates: 'Fechas',
    noc_table_actions: 'Acción',
    noc_btn_manage: 'Gestionar',

    // NOC Master Ticket Management
    noc_ticket_meta_title: 'NOC Master: {id} | INOC — MEO Internacional',
    noc_ticket_status_box_title: 'Gestión de Estado y SLA del Incidente',
    noc_ticket_change_status_label: 'Modificar Estado del Ticket:',
    noc_ticket_btn_update_status: 'Aplicar Cambio de Estado',
    noc_ticket_sla_label: 'Fecha/Hora Límite de Pendencia (Obligatoria para Pendiente):',
    noc_ticket_sla_helper: 'Establece el plazo máximo para la respuesta del cliente o intervención del carrier.',
    noc_ticket_comment_title: 'Publicar Actualización Técnica Oficial INOC',
    noc_ticket_comment_placeholder: 'Informe técnico, RFO, coordenadas de empalme de fibra, datos de despacho de campo...',
    noc_ticket_comment_submit: 'Publicar y Notificar al Cliente por Correo',

    // NOC CSV Import
    import_meta_title: 'Importación CSV | INOC — MEO Internacional',
    import_title: 'Importación Masiva de Datos (CSV)',
    import_subtitle: 'Cargue clientes y circuitos masivamente en la base de datos de Google Sheets.',
    import_tab_clients: '👥 Importar Clientes',
    import_tab_circuits: '🌐 Importar Circuitos',
    import_clients_desc: 'Cargue un archivo CSV con las columnas: nome_empresa, email_login, senha, status.',
    import_circuits_desc: 'Cargue un archivo CSV con las columnas: id_cliente, nome_circuito, tipo_link, identificador_tecnico, status.',
    import_btn_download_template: '📥 Descargar Plantilla CSV',
    import_dropzone_text: 'Arrastre el archivo CSV aquí o haga clic para seleccionar',
    import_btn_process: '🚀 Procesar y Guardar en Google Sheets',
    import_results_title: 'Resumen de la Importación',

    // Footer
    footer_brand: 'MEO Internacional — INOC (International Network Operations Center)',
    footer_support: 'Línea NOC 24x7:',
    footer_copyright: '© 2026 MEO Internacional. Todos los derechos reservados.',

    // Notifications & Messages
    msg_login_otp_sent: '¡Credenciales validadas! Se envió un código OTP de 6 dígitos a su correo.',
    msg_login_success: 'Autenticación exitosa. ¡Bienvenido al portal INOC!',
    msg_otp_invalid: 'Código OTP no válido o vencido. Verifique e intente nuevamente.',
    msg_fill_all_fields: 'Por favor, complete todos los campos obligatorios.',
    msg_password_mismatch: 'Las contraseñas no coinciden.',
    msg_password_too_short: 'La contraseña debe contener al menos 8 caracteres.',
    msg_password_changed: '¡Contraseña actualizada con éxito! Redirigiendo...',
    msg_recovery_sent: 'Si el correo está registrado, se han enviado las instrucciones de contraseña temporal.',
    msg_ticket_created: '¡Ticket {id} abierto con éxito! Carpeta creada en Google Drive.',
    msg_comment_added: 'Actualización técnica enviada con éxito.',
    msg_status_updated: 'Estado del ticket actualizado a {status}.',
    msg_session_expired: 'Su sesión ha expirado por inactividad. Por favor inicie sesión nuevamente.',
    msg_confirm_resolve: '¿Desea marcar el ticket {id} como RESUELTO? Esta acción finaliza el incidente.',
    msg_confirm_logout: '¿Está seguro de que desea cerrar la sesión?',
    msg_file_too_large: 'El archivo supera el límite de 10MB: {name}',
    msg_error_generic: 'Ocurrió un error inesperado. Comuníquese con el equipo INOC.'
  }
};

/**
 * Obtém o idioma atual configurado (prioriza localStorage, default 'en')
 * @returns {'en'|'pt'|'es'}
 */
export function getIdiomaAtual() {
  const salvo = localStorage.getItem('inoc_lang');
  if (salvo && IDIOMAS_SUPORTADOS.includes(salvo)) {
    return salvo;
  }
  return IDIOMA_PADRAO; // 'en' conforme solicitação do usuário
}

/**
 * Define o novo idioma ativo, salva no localStorage e dispara evento global
 * @param {'en'|'pt'|'es'} lang
 */
export function setIdioma(lang) {
  if (!IDIOMAS_SUPORTADOS.includes(lang)) {
    lang = IDIOMA_PADRAO;
  }
  localStorage.setItem('inoc_lang', lang);
  document.documentElement.lang = lang === 'en' ? 'en' : (lang === 'pt' ? 'pt-BR' : 'es');

  // Atualiza classes dos botões seletores existentes
  document.querySelectorAll('[data-set-lang]').forEach(btn => {
    if (btn.getAttribute('data-set-lang') === lang) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  // Aplica traduções no DOM atual
  aplicarTraducoes();

  // Dispara evento customizado para os controladores de tela
  window.dispatchEvent(new CustomEvent('inoc_language_changed', { detail: { lang } }));
}

/**
 * Traduz uma chave com suporte a interpolação de parâmetros {chave}
 * @param {string} chave
 * @param {Record<string, string|number>} params
 * @returns {string}
 */
export function t(chave, params = {}) {
  const lang = getIdiomaAtual();
  const dict = TRADUCOES[lang] || TRADUCOES[IDIOMA_PADRAO];
  let texto = dict[chave] || TRADUCOES[IDIOMA_PADRAO][chave] || chave;

  if (params && typeof params === 'object') {
    Object.keys(params).forEach(p => {
      texto = texto.replace(new RegExp(`\\{${p}\\}`, 'g'), String(params[p]));
    });
  }

  return texto;
}

/**
 * Aplica traduções em todos os elementos da página com:
 * - data-i18n: texto interno (innerHTML/textContent)
 * - data-i18n-placeholder: atributo placeholder
 * - data-i18n-title: atributo title
 */
export function aplicarTraducoes(root = document) {
  const lang = getIdiomaAtual();
  document.documentElement.lang = lang === 'en' ? 'en' : (lang === 'pt' ? 'pt-BR' : 'es');

  root.querySelectorAll('[data-i18n]').forEach(el => {
    const chave = el.getAttribute('data-i18n');
    if (chave) {
      el.textContent = t(chave);
    }
  });

  root.querySelectorAll('[data-i18n-html]').forEach(el => {
    const chave = el.getAttribute('data-i18n-html');
    if (chave) {
      el.innerHTML = t(chave);
    }
  });

  root.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const chave = el.getAttribute('data-i18n-placeholder');
    if (chave) {
      el.setAttribute('placeholder', t(chave));
    }
  });

  root.querySelectorAll('[data-i18n-title]').forEach(el => {
    const chave = el.getAttribute('data-i18n-title');
    if (chave) {
      el.setAttribute('title', t(chave));
    }
  });

  // Atualiza estado visual de botões de idioma
  document.querySelectorAll('[data-set-lang]').forEach(btn => {
    if (btn.getAttribute('data-set-lang') === lang) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}

/**
 * Cria o HTML do Seletor de Idioma
 * @param {'header'|'card'|'discreet'} estilo
 */
export function gerarHtmlSeletorIdioma(estilo = 'header') {
  const lang = getIdiomaAtual();

  if (estilo === 'card' || estilo === 'discreet') {
    return `
      <div class="lang-switch-discreet" role="group" aria-label="Language Selector">
        <span class="lang-discreet-icon" title="${t('lang_select')}">🌐</span>
        <button type="button" class="lang-link-btn ${lang === 'en' ? 'active' : ''}" data-set-lang="en">English</button>
        <span class="lang-dot">•</span>
        <button type="button" class="lang-link-btn ${lang === 'pt' ? 'active' : ''}" data-set-lang="pt">Português</button>
        <span class="lang-dot">•</span>
        <button type="button" class="lang-link-btn ${lang === 'es' ? 'active' : ''}" data-set-lang="es">Español</button>
      </div>
    `;
  }

  return `
    <div class="lang-switch-wrapper lang-switch-header" role="group" aria-label="Language Selector">
      <span class="lang-switch-label" title="${t('lang_select')}">🌐</span>
      <div class="lang-switch-buttons">
        <button type="button" class="lang-btn ${lang === 'en' ? 'active' : ''}" data-set-lang="en" title="English">
          <span class="flag-icon">🇬🇧</span> <span class="lang-code">EN</span>
        </button>
        <button type="button" class="lang-btn ${lang === 'pt' ? 'active' : ''}" data-set-lang="pt" title="Português">
          <span class="flag-icon">🇵🇹</span> <span class="lang-code">PT</span>
        </button>
        <button type="button" class="lang-btn ${lang === 'es' ? 'active' : ''}" data-set-lang="es" title="Español">
          <span class="flag-icon">🇪🇸</span> <span class="lang-code">ES</span>
        </button>
      </div>
    </div>
  `;
}

/**
 * Inicializa os ouvintes de clique nos seletores de idioma da página
 */
export function inicializarSeletoresIdioma() {
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-set-lang]');
    if (btn) {
      e.preventDefault();
      const novoIdioma = btn.getAttribute('data-set-lang');
      if (novoIdioma) {
        setIdioma(novoIdioma);
      }
    }
  });

  // Executa uma primeira passagem para traduzir o DOM
  aplicarTraducoes();
}

// Auto-inicialização na carga do DOM se o documento estiver pronto
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => inicializarSeletoresIdioma());
  } else {
    inicializarSeletoresIdioma();
  }
}
