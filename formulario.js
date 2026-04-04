// v2.3 - compatibilidad navegadores antiguos (sin optional chaining)
// ============================================================
// FESTALI — formulario.js
// Lógica del formulario de contratación
// ============================================================

// Dejar vacío hasta configurar Google Apps Script.
// En modo vacío, los datos se imprimen en consola y se simula éxito.
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzayrl3JFCEzBldqiQW81af_KoTcz73N3iLfxv6wydwBUn0a3s8bWZwitsBDUxkL9Ky/exec';

// Token de acceso — debe coincidir con FESTALI_TOKEN en Script Properties de Apps Script
const FESTALI_TOKEN = 'festali-2026-xK9mP';

// Tipos de archivo permitidos para subir
const TIPOS_VALIDOS = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif'];

// Peso máximo por imagen (en MB)
const MAX_MB_IMAGEN = 8;

// ==================== IDIOMA ====================

const TRANSLATIONS = {
  es: {
    lang_btn: '🇺🇸 EN',
    nav_inicio: 'Inicio', nav_inv: 'Invitaciones',
    form_titulo: 'Cuéntanos sobre tu evento',
    paquete_banner: 'Completando formulario para el paquete',
    btn_siguiente: 'Siguiente →', btn_anterior: '← Anterior', btn_enviar: '✨ Enviar mi solicitud',
    // Paso títulos
    step_nombre: '¿Cuál es tu nombre?',
    step_whatsapp: 'Tu número de WhatsApp',
    step_correo: 'Tu correo electrónico',
    step_evento: '¿Qué tipo de evento es?',
    step_fecha: '¿Cuándo es el evento?',
    step_festejados: '¿Quién o quiénes son los festejados?',
    step_ubicacion: '¿Dónde será el evento?',
    step_estilo: '¿Qué estilo te gusta?',
    step_diseno: '¿Cómo quieres el diseño?',
    step_fotos: 'Tus fotos',
    step_mensaje: 'Mensaje especial para tus invitados',
    step_dresscode: '¿Hay dress code?',
    step_confirmacion: '¿Cómo confirmarán asistencia?',
    step_asistencia: '¿Qué quieres saber de tus invitados?',
    step_regalos: 'Mesa de regalos',
    step_musica: '¿Canción para el video/invitación?',
    step_hospedaje: 'Información de hospedaje',
    // Placeholders
    ph_nombre: 'Tu nombre completo',
    ph_correo: 'ejemplo@correo.com',
    ph_festejados: 'Ej: Ana y Luis',
    ph_wsp_hint: 'Solo dígitos, sin espacios ni guiones.',
    ph_lugar_cer: 'Nombre del lugar', ph_lugar_rec: 'Nombre del lugar',
    ph_enlace_cer: 'https://maps.google.com/...', ph_enlace_rec: 'https://maps.google.com/...',
    ph_otro_evento: 'Describe tu tipo de evento...',
    ph_estilo_desc: 'Describe tu idea...',
    ph_dresscode: 'Ej: Formal, Blanco y dorado, Casual...',
    ph_wsp_conf: '+52 686 000 0000', ph_correo_conf: 'ejemplo@correo.com',
    ph_asistencia: 'Ej: ¿Vas con acompañante? / ¿Tienes alguna alergia?...',
    ph_mesa: 'Ej: Liverpool mesa #12345 o https://mesaderegalos...',
    ph_banco: 'Banco (ej: BBVA, Banamex...)', ph_titular: 'Nombre del titular', ph_clabe: 'CLABE interbancaria (18 dígitos)',
    ph_musica: 'Artista - Canción o enlace de YouTube / Spotify',
    ph_hospedaje: 'Ej: Hotel Misión a 5 min de la iglesia...', hint_hospedaje: 'Información útil para invitados que vengan de fuera (opcional).',
    ph_mensaje: 'Un mensaje para tus invitados...',
    // Ubicación labels
    lbl_hay_cer: '¿Hay ceremonia?', lbl_lugar_cer: 'Lugar de la ceremonia', lbl_hora_cer: 'Hora de la ceremonia', lbl_enlace_cer: 'Enlace de ubicación (opcional)',
    lbl_hay_rec: '¿Hay recepción?', lbl_lugar_rec: 'Lugar de la recepción', lbl_hora_rec: 'Hora de la recepción', lbl_enlace_rec: 'Enlace de ubicación (opcional)',
    // Estilo
    est_select: '— Selecciona un estilo —', est_elegante: 'Elegante / Clásico', est_moderno: 'Moderno / Minimalista', est_floral: 'Floral / Romántico', est_tematico: 'Temático',
    est_vision_lbl: 'Cuéntanos tu visión', est_vision_opt: '(opcional)',
    est_img_lbl: 'Imagen de referencia', est_img_opt: '(opcional, máx. 1)',
    est_img_click: 'Haz clic para subir una imagen', est_img_max: 'Máximo 1 imagen', est_img_none: 'Ninguna imagen seleccionada',
    est_ph: { 'Elegante / Clásico': 'Ej: Tonos dorados con blanco, tipografía cursiva fina, flores de peonías o rosas...', 'Moderno / Minimalista': 'Ej: Algo muy limpio, blanco y negro o con un color de acento, sin muchos adornos...', 'Floral / Romántico': 'Ej: Colores pastel como rosa o lila, muchas flores, algo delicado y femenino...', 'Temático': '¿Cuál es tu tema? Ej: Vintage, Disney, deportivo, jardín encantado...' },
    // Tipo de evento
    ev_select: '— Selecciona —', ev_boda: 'Boda', ev_xv: 'XV Años', ev_bautizo: 'Bautizo', ev_cumple: 'Cumpleaños', ev_grad: 'Graduación', ev_otro: 'Otro',
    // Tipo diseño
    dis_fotos_lbl: '📸 Mis fotos', dis_fotos_desc: 'Subir mis fotos para que sean parte del diseño',
    dis_grafico_lbl: '🎨 Diseño gráfico', dis_grafico_desc: 'Ilustraciones creadas por Festali (sin fotos)',
    // Fotos
    fotos_si_lbl: '📸 Tengo mis fotos', fotos_si_desc: 'Las subo ahora',
    fotos_no_lbl: '⏳ Aún no las tengo', fotos_no_desc: 'Las enviaré después por WhatsApp',
    fotos_click: 'Haz clic para seleccionar tus fotos', fotos_none: 'Ninguna foto seleccionada',
    // Mensaje
    msg_propio_lbl: '✍️ Yo escribo el mensaje', msg_propio_desc: 'Redacta el mensaje para tus invitados',
    msg_festali_lbl: '✨ Que Festali me escriba algo bonito', msg_festali_desc: 'Nuestro equipo redactará algo especial',
    // Dress code
    dc_img_cb: 'Quiero subir ejemplos de vestimenta', dc_img_click: 'Haz clic para subir ejemplos', dc_img_hint: 'Imágenes de referencia', dc_img_none: 'Ninguna imagen seleccionada',
    // Confirmación
    conf_wsp_lbl: '📱 WhatsApp', conf_wsp_desc: 'Los invitados confirman por WhatsApp',
    conf_email_lbl: '✉️ Correo electrónico', conf_email_desc: 'Los invitados confirman por email',
    // Asistencia
    asist_adultos: 'Evento solo para adultos (no se permiten niños)',
    // Regalos
    reg_ninguno: 'No incluir', reg_mesa: 'Mesa de regalos', reg_transf: 'Transferencia bancaria',
    // Confirmación pantalla
    confirm_titulo: '¡Tu solicitud fue recibida!', confirm_folio: 'Número de folio:',
    confirm_instruccion: 'Te enviamos un correo con el resumen de tu solicitud y los links de pago.',
    confirm_spam: 'Revisa tu bandeja de entrada — <strong>¡no olvides checar tu carpeta de SPAM!</strong>',
    confirm_nota: 'Al completar tu pago recibirás una confirmación automática.',
    confirm_dias: 'Tu invitación estará lista en máximo <strong>3 días hábiles</strong>.',
    confirm_wsp: 'WhatsApp', confirm_correo_btn: '✉ Correo',
  },
  en: {
    lang_btn: '🇲🇽 ES',
    nav_inicio: 'Home', nav_inv: 'Invitations',
    form_titulo: 'Tell us about your event',
    paquete_banner: 'Completing form for package',
    btn_siguiente: 'Next →', btn_anterior: '← Back', btn_enviar: '✨ Submit my request',
    step_nombre: "What's your name?",
    step_whatsapp: 'Your WhatsApp number',
    step_correo: 'Your email address',
    step_evento: 'What type of event is it?',
    step_fecha: 'When is the event?',
    step_festejados: 'Who is being celebrated?',
    step_ubicacion: 'Where will the event take place?',
    step_estilo: 'What style do you like?',
    step_diseno: 'How do you want the design?',
    step_fotos: 'Your photos',
    step_mensaje: 'Special message for your guests',
    step_dresscode: 'Is there a dress code?',
    step_confirmacion: 'How will guests confirm attendance?',
    step_asistencia: 'What do you want to know from your guests?',
    step_regalos: 'Gift registry',
    step_musica: 'Song for your video/invitation?',
    step_hospedaje: 'Accommodation information',
    ph_nombre: 'Your full name',
    ph_correo: 'example@email.com',
    ph_festejados: 'E.g.: Ana and Luis',
    ph_wsp_hint: 'Digits only, no spaces or dashes.',
    ph_lugar_cer: 'Venue name', ph_lugar_rec: 'Venue name',
    ph_enlace_cer: 'https://maps.google.com/...', ph_enlace_rec: 'https://maps.google.com/...',
    ph_otro_evento: 'Describe your event type...',
    ph_estilo_desc: 'Describe your vision...',
    ph_dresscode: 'E.g.: Black tie, White and gold, Casual...',
    ph_wsp_conf: '+1 686 000 0000', ph_correo_conf: 'example@email.com',
    ph_asistencia: 'E.g.: Are you bringing a plus one? / Any allergies?...',
    ph_mesa: 'E.g.: Amazon registry or https://giftregistry...',
    ph_banco: 'Bank (e.g.: Chase, Wells Fargo...)', ph_titular: 'Account holder name', ph_clabe: 'Account / routing number',
    ph_musica: 'Artist - Song or YouTube / Spotify link',
    ph_hospedaje: 'E.g.: Hotel Mission 5 min from the church...', hint_hospedaje: 'Useful info for out-of-town guests (optional).',
    ph_mensaje: 'A message for your guests...',
    lbl_hay_cer: 'Is there a ceremony?', lbl_lugar_cer: 'Ceremony venue', lbl_hora_cer: 'Ceremony time', lbl_enlace_cer: 'Location link (optional)',
    lbl_hay_rec: 'Is there a reception?', lbl_lugar_rec: 'Reception venue', lbl_hora_rec: 'Reception time', lbl_enlace_rec: 'Location link (optional)',
    est_select: '— Select a style —', est_elegante: 'Elegant / Classic', est_moderno: 'Modern / Minimalist', est_floral: 'Floral / Romantic', est_tematico: 'Themed',
    est_vision_lbl: 'Tell us your vision', est_vision_opt: '(optional)',
    est_img_lbl: 'Reference image', est_img_opt: '(optional, max. 1)',
    est_img_click: 'Click to upload an image', est_img_max: 'Maximum 1 image', est_img_none: 'No image selected',
    est_ph: { 'Elegant / Classic': 'E.g.: Gold and ivory tones, script typography, peonies or roses...', 'Modern / Minimalist': 'E.g.: Very clean, black and white with an accent color, minimal...', 'Floral / Romantic': 'E.g.: Pastel colors like pink or lilac, lots of flowers, delicate...', 'Themed': 'What is your theme? E.g.: Vintage, Disney, sports, enchanted garden...' },
    ev_select: '— Select —', ev_boda: 'Wedding', ev_xv: 'Quinceañera', ev_bautizo: 'Baptism', ev_cumple: 'Birthday', ev_grad: 'Graduation', ev_otro: 'Other',
    dis_fotos_lbl: '📸 My photos', dis_fotos_desc: 'Upload my photos to be part of the design',
    dis_grafico_lbl: '🎨 Graphic design', dis_grafico_desc: 'Illustrations created by Festali (no photos)',
    fotos_si_lbl: '📸 I have my photos', fotos_si_desc: "I'll upload them now",
    fotos_no_lbl: "⏳ I don't have them yet", fotos_no_desc: "I'll send them later via WhatsApp",
    fotos_click: 'Click to select your photos', fotos_none: 'No photos selected',
    msg_propio_lbl: '✍️ I\'ll write the message', msg_propio_desc: 'Write the message for your guests',
    msg_festali_lbl: '✨ Let Festali write something beautiful', msg_festali_desc: 'Our team will write something special',
    dc_img_cb: 'I want to upload outfit examples', dc_img_click: 'Click to upload examples', dc_img_hint: 'Reference images', dc_img_none: 'No image selected',
    conf_wsp_lbl: '📱 WhatsApp', conf_wsp_desc: 'Guests confirm via WhatsApp',
    conf_email_lbl: '✉️ Email', conf_email_desc: 'Guests confirm via email',
    asist_adultos: 'Adults only event (no children allowed)',
    reg_ninguno: 'Do not include', reg_mesa: 'Gift registry', reg_transf: 'Bank transfer',
    confirm_titulo: 'Your request was received!', confirm_folio: 'Reference number:',
    confirm_instruccion: 'We sent you an email with your request summary and payment links.',
    confirm_spam: 'Check your inbox — <strong>don\'t forget to check your SPAM folder!</strong>',
    confirm_nota: 'Once your payment is confirmed, you\'ll receive an automatic notification.',
    confirm_dias: 'Your invitation will be ready in max. <strong>3 business days</strong>.',
    confirm_wsp: 'WhatsApp', confirm_correo_btn: '✉ Email',
  }
};

function getLang() {
  var saved = localStorage.getItem('festali_lang');
  if (saved === 'en' || saved === 'es') return saved;
  return navigator.language.startsWith('en') ? 'en' : 'es';
}

function t(key) {
  var lang = getLang();
  return (TRANSLATIONS[lang] && TRANSLATIONS[lang][key] !== undefined)
    ? TRANSLATIONS[lang][key]
    : (TRANSLATIONS['es'][key] !== undefined ? TRANSLATIONS['es'][key] : key);
}

function setLangAndApply(lang) {
  localStorage.setItem('festali_lang', lang);
  applyLang();
}

function toggleLang() {
  setLangAndApply(getLang() === 'es' ? 'en' : 'es');
}

function _setText(id, text) { var el = document.getElementById(id); if (el) el.textContent = text; }
function _setHTML(id, html) { var el = document.getElementById(id); if (el) el.innerHTML = html; }
function _setPH(id, ph)     { var el = document.getElementById(id); if (el) el.placeholder = ph; }
function _setSelectOpts(id, opts) {
  var sel = document.getElementById(id);
  if (!sel) return;
  opts.forEach(function(o, i) { if (sel.options[i]) { sel.options[i].value = o.v; sel.options[i].text = o.t; } });
}
function _setRadioOption(inputId, labelKey, descKey) {
  var inp = document.getElementById(inputId);
  if (!inp) return;
  var opt = inp.closest('.radio-option');
  if (!opt) return;
  var lbl = opt.querySelector('.radio-label');
  var dsc = opt.querySelector('.radio-desc');
  if (lbl) lbl.textContent = t(labelKey);
  if (dsc) dsc.textContent = t(descKey);
}
function _setCBSpan(inputId, textKey) {
  var inp = document.getElementById(inputId);
  if (!inp) return;
  var span = inp.closest('.checkbox-option') ? inp.closest('.checkbox-option').querySelector('span') : null;
  if (span) span.textContent = t(textKey);
}

function applyLang() {
  // Banderas activas
  var lang = getLang();
  var fES  = document.getElementById('flagES');
  var fEN  = document.getElementById('flagEN');
  if (fES) fES.classList.toggle('active-flag', lang === 'es');
  if (fEN) fEN.classList.toggle('active-flag', lang === 'en');

  // Nav links
  _setText('navInicio', t('nav_inicio'));
  _setText('navInvitaciones', t('nav_inv'));

  // Form title + banner
  var formTit = document.querySelector('.form-titulo');
  if (formTit) formTit.textContent = t('form_titulo');
  var bannerTxt = document.querySelector('.paquete-banner');
  if (bannerTxt) {
    var paqEl = document.getElementById('paqueteNombre');
    var paqNombre = paqEl ? paqEl.textContent : '';
    bannerTxt.innerHTML = t('paquete_banner') + ' <span class="paquete-nombre" id="paqueteNombre">' + paqNombre + '</span>';
  }

  // Botones
  _setText('btnSiguiente', t('btn_siguiente'));
  _setText('btnAnterior',  t('btn_anterior'));
  _setText('btnEnviar',    t('btn_enviar'));

  // Placeholders inputs
  _setPH('nombreCompleto', t('ph_nombre'));
  _setPH('correo',         t('ph_correo'));
  _setPH('nombresFestejados', t('ph_festejados'));
  _setPH('tipoEventoOtro', t('ph_otro_evento'));
  _setPH('lugarCeremonia', t('ph_lugar_cer'));
  _setPH('lugarRecepcion', t('ph_lugar_rec'));
  _setPH('ubicacionCeremonia', t('ph_enlace_cer'));
  _setPH('ubicacionRecepcion', t('ph_enlace_rec'));
  _setPH('descripcionEstilo', t('ph_estilo_desc'));
  _setPH('dressCode',      t('ph_dresscode'));
  _setPH('whatsappConfirmaciones', t('ph_wsp_conf'));
  _setPH('correoConfirmaciones',   t('ph_correo_conf'));
  _setPH('datosAsistencia', t('ph_asistencia'));
  _setPH('mesaRegalosLink', t('ph_mesa'));
  _setPH('bancoCuenta',    t('ph_banco'));
  _setPH('titularCuenta',  t('ph_titular'));
  _setPH('clabeCuenta',    t('ph_clabe'));
  _setPH('musica',         t('ph_musica'));
  _setPH('hospedaje',      t('ph_hospedaje'));
  _setPH('mensajeEspecial', t('ph_mensaje'));

  // WhatsApp hint
  var wspHint = document.querySelector('#q-whatsapp .form-hint');
  if (wspHint) wspHint.textContent = t('ph_wsp_hint');

  // Hospedaje hint
  var hospHint = document.querySelector('#q-hospedaje .form-hint');
  if (hospHint) hospHint.textContent = t('hint_hospedaje');

  // Select: tipo evento
  _setSelectOpts('tipoEvento', [
    { v: '',              t: t('ev_select') },
    { v: t('ev_boda'),   t: t('ev_boda')   },
    { v: t('ev_xv'),     t: t('ev_xv')     },
    { v: t('ev_bautizo'),t: t('ev_bautizo') },
    { v: t('ev_cumple'), t: t('ev_cumple') },
    { v: t('ev_grad'),   t: t('ev_grad')   },
    { v: t('ev_otro'),   t: t('ev_otro')   }
  ]);

  // Select: estilo
  _setSelectOpts('estiloInvitacion', [
    { v: '',                  t: t('est_select')   },
    { v: t('est_elegante'),   t: t('est_elegante') },
    { v: t('est_moderno'),    t: t('est_moderno')  },
    { v: t('est_floral'),     t: t('est_floral')   },
    { v: t('est_tematico'),   t: t('est_tematico') }
  ]);

  // Ubicacion labels
  _setCBSpan('hayCeremonia', 'lbl_hay_cer');
  _setCBSpan('hayRecepcion', 'lbl_hay_rec');
  var lugarCerLabel = document.querySelector('label[for="lugarCeremonia"]');
  var horaCerLabel  = document.querySelector('label[for="horaCeremonia"]');
  var enlaceCerLabel= document.querySelector('label[for="ubicacionCeremonia"]');
  var lugarRecLabel = document.querySelector('label[for="lugarRecepcion"]');
  var horaRecLabel  = document.querySelector('label[for="horaRecepcion"]');
  var enlaceRecLabel= document.querySelector('label[for="ubicacionRecepcion"]');
  if (lugarCerLabel) lugarCerLabel.childNodes[0].nodeValue = t('lbl_lugar_cer') + ' ';
  if (horaCerLabel)  horaCerLabel.childNodes[0].nodeValue  = t('lbl_hora_cer')  + ' ';
  if (enlaceCerLabel)enlaceCerLabel.textContent            = t('lbl_enlace_cer');
  if (lugarRecLabel) lugarRecLabel.childNodes[0].nodeValue = t('lbl_lugar_rec') + ' ';
  if (horaRecLabel)  horaRecLabel.childNodes[0].nodeValue  = t('lbl_hora_rec')  + ' ';
  if (enlaceRecLabel)enlaceRecLabel.textContent            = t('lbl_enlace_rec');

  // Estilo labels
  var estVisionLbl = document.querySelector('#grupoEstiloDesc label:first-of-type');
  if (estVisionLbl) estVisionLbl.innerHTML = t('est_vision_lbl') + ' <span style="color:#aaa;font-weight:400">' + t('est_vision_opt') + '</span>';

  // Tipo diseño
  _setRadioOption('tipoDisenoFotos',   'dis_fotos_lbl',   'dis_fotos_desc');
  _setRadioOption('tipoDisenoGrafico', 'dis_grafico_lbl', 'dis_grafico_desc');

  // Fotos
  _setRadioOption('fotosDisponibles', 'fotos_si_lbl', 'fotos_si_desc');
  _setRadioOption('fotosPendientes',  'fotos_no_lbl', 'fotos_no_desc');
  var fotosClick = document.querySelector('#grupoSubirFotos .file-texto');
  if (fotosClick) fotosClick.textContent = t('fotos_click');
  var fotosNone = document.getElementById('fotosSeleccionadas');
  if (fotosNone && (fotosNone.textContent === TRANSLATIONS['es'].fotos_none || fotosNone.textContent === TRANSLATIONS['en'].fotos_none)) {
    fotosNone.textContent = t('fotos_none');
  }

  // Mensaje
  _setRadioOption('mensajePropio',   'msg_propio_lbl',   'msg_propio_desc');
  _setRadioOption('mensajeFestali',  'msg_festali_lbl',  'msg_festali_desc');

  // Dress code img
  _setCBSpan('cbDressCodeImg', 'dc_img_cb');
  var dcClick = document.querySelector('#grupoDressCodeImg .file-texto');
  var dcHint  = document.querySelector('#grupoDressCodeImg .file-min');
  if (dcClick) dcClick.textContent = t('dc_img_click');
  if (dcHint)  dcHint.textContent  = t('dc_img_hint');

  // Confirmaciones
  _setRadioOption('confWsp',    'conf_wsp_lbl',   'conf_wsp_desc');
  _setRadioOption('confCorreo', 'conf_email_lbl', 'conf_email_desc');

  // Asistencia
  _setCBSpan('soloAdultos', 'asist_adultos');

  // Regalos
  _setRadioOption('regalosNinguno',     'reg_ninguno', 'reg_ninguno');
  _setRadioOption('regalosMesa',        'reg_mesa',    'reg_mesa');
  _setRadioOption('regalosTransferencia','reg_transf', 'reg_transf');

  // Confirmación pantalla
  var confirmTit = document.querySelector('.confirmacion h2');
  var folioLbl   = document.querySelector('.folio-label');
  var instrEl    = document.querySelector('.confirmacion-pago-instruccion');
  var spamEl     = document.getElementById('spamAviso');
  var notaEl     = document.querySelector('.confirmacion-pago-nota');
  var correoBtn  = document.querySelector('.btn-email');
  if (confirmTit) confirmTit.textContent = t('confirm_titulo');
  if (folioLbl)   folioLbl.textContent   = t('confirm_folio');
  if (instrEl)    instrEl.textContent    = t('confirm_instruccion');
  if (spamEl)     spamEl.innerHTML       = '📧 ' + t('confirm_spam');
  if (notaEl)     notaEl.innerHTML       = t('confirm_nota') + '<br>' + t('confirm_dias');
  if (correoBtn)  correoBtn.textContent  = t('confirm_correo_btn');

  // Wizard title (si está activo)
  var wizTitle = document.getElementById('wizardStepTitle');
  if (wizTitle && wizTitle._i18nKey) wizTitle.textContent = t(wizTitle._i18nKey);
}

// ==================== CONFIGURACIÓN DE PAQUETES ====================

const PAQUETES = {
  quick: {
    nombre: 'Digital Quick',
    maxFotos: 3,
    extras: ['quick']
  },
  motion: {
    nombre: 'Motion Impact',
    maxFotos: 3,
    extras: ['motion']
  },
  pro: {
    nombre: 'Experience Pro',
    maxFotos: 10,
    extras: ['quick', 'pro']
  }
};

// ==================== INICIO ====================

document.addEventListener('DOMContentLoaded', () => {
  const paqueteKey = detectarPaquete();

  applyLang();
  setFechaAutomatica();
  setFolio();
  configurarPaquete(paqueteKey);
  initUbicaciones(paqueteKey);
  initConfirmacionToggle();
  initFileInput(paqueteKey);
  initTipoDiseño(paqueteKey);
  initEstiloToggle();
  initEventoOtro();
  initPhonePrefix();
  initMesaRegalos();
  initDressCodeImg();
  initMensajeToggle();
  initWizard(paqueteKey);
  initSubmit(paqueteKey);
});

// ==================== DETECTAR PAQUETE ====================

function detectarPaquete() {
  const params = new URLSearchParams(window.location.search);
  const valor = (params.get('paquete') || '').toLowerCase();
  return PAQUETES[valor] ? valor : 'quick';
}

// ==================== FECHA AUTOMÁTICA ====================

function setFechaAutomatica() {
  const hoy = new Date();
  const opciones = { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'America/Mexico_City' };
  document.getElementById('fechaSolicitud').value = hoy.toLocaleDateString('es-MX', opciones);

  // Fecha mínima del evento — hoy (evita fechas pasadas)
  const yyyy = hoy.getFullYear();
  const mm   = String(hoy.getMonth() + 1).padStart(2, '0');
  const dd   = String(hoy.getDate()).padStart(2, '0');
  const inputFecha = document.getElementById('fechaEvento');
  if (inputFecha) inputFecha.min = `${yyyy}-${mm}-${dd}`;
}

// ==================== FOLIO ====================

async function setFolio() {
  const input = document.getElementById('numeroFolio');
  input.value = 'Cargando...';
  try {
    const res  = await fetch(SCRIPT_URL + '?action=folio');
    const data = await res.json();
    input.value = data.folio || 'FEST-???';
  } catch (_) {
    input.value = 'FEST-???';
  }
}

// ==================== CONFIGURAR PAQUETE ====================

function configurarPaquete(paqueteKey) {
  const config = PAQUETES[paqueteKey];
  document.getElementById('paqueteNombre').textContent = config.nombre;
}

// ==================== CONFIRMACIÓN TOGGLE ====================

function initConfirmacionToggle() {
  const radios      = document.querySelectorAll('input[name="tipoConfirmacion"]');
  const grupoWsp    = document.getElementById('grupoConfWsp');
  const grupoCorreo = document.getElementById('grupoConfCorreo');

  if (!radios.length || !grupoWsp || !grupoCorreo) return;

  function actualizar() {
    var _chk = document.querySelector('input[name="tipoConfirmacion"]:checked');
    const val = _chk ? _chk.value : undefined;
    grupoWsp.style.display    = val === 'wsp'    ? 'block' : 'none';
    grupoCorreo.style.display = val === 'correo' ? 'block' : 'none';

    // Pre-llenar con el contacto ingresado al inicio (editable)
    if (val === 'wsp') {
      const inputConf = document.getElementById('whatsappConfirmaciones');
      if (inputConf && !inputConf.value) {
        inputConf.value = (document.getElementById('whatsapp') || {value: ''}).value || '';
      }
    } else if (val === 'correo') {
      const inputConf = document.getElementById('correoConfirmaciones');
      if (inputConf && !inputConf.value) {
        inputConf.value = (document.getElementById('correo') || {value: ''}).value || '';
      }
    }
  }

  radios.forEach(r => r.addEventListener('change', actualizar));
}

// ==================== UBICACIONES ====================

function initUbicaciones(paqueteKey) {
  const cbCeremonia    = document.getElementById('hayCeremonia');
  const cbRecepcion    = document.getElementById('hayRecepcion');
  const grupoCeremonia = document.getElementById('grupoCeremonia');
  const grupoRecepcion = document.getElementById('grupoRecepcion');

  // Motion Impact: no necesita enlaces GPS, solo lugar y hora
  if (paqueteKey === 'motion') {
    const gEnlCer = document.getElementById('grupoEnlaceCeremonia');
    const gEnlRec = document.getElementById('grupoEnlaceRecepcion');
    if (gEnlCer) gEnlCer.style.display = 'none';
    if (gEnlRec) gEnlRec.style.display = 'none';
  }

  cbCeremonia.addEventListener('change', () => {
    grupoCeremonia.style.display = cbCeremonia.checked ? 'block' : 'none';
  });

  cbRecepcion.addEventListener('change', () => {
    grupoRecepcion.style.display = cbRecepcion.checked ? 'block' : 'none';
  });
}

// ==================== FILE INPUT ====================

// Hace que un input acumule archivos en lugar de reemplazarlos.
// onUpdate(n) se llama cada vez que cambia la cantidad total.
function initAcumulador(input, onUpdate) {
  const dt = new DataTransfer();
  input.addEventListener('change', () => {
    Array.from(input.files).forEach(f => {
      // Evitar duplicados por nombre
      if (!Array.from(dt.files).some(e => e.name === f.name && e.size === f.size)) {
        dt.items.add(f);
      }
    });
    input.files = dt.files;
    onUpdate(dt.files.length);
  });
}

// ==================== PREVIEW DE IMÁGENES ====================

// Inicializa un campo de archivo con vista previa y botón de eliminar por imagen.
// inputEl     — el <input type="file">
// previewId   — id del div .foto-preview-grid donde se renderizan las miniaturas
// maxFiles    — límite de archivos permitidos (solo muestra error en hint, no bloquea avance)
// hintEl      — el <p class="form-hint"> donde se muestra el conteo
// labelSingular / labelPlural — palabra para el tipo de archivo (ej. 'foto'/'fotos')
function crearPreviewPanel(inputEl, previewId, maxFiles, hintEl, labelSingular, labelPlural) {
  var sing = labelSingular || 'imagen';
  var plur = labelPlural   || 'imágenes';
  const MAX_BYTES = MAX_MB_IMAGEN * 1024 * 1024;
  const container = document.getElementById(previewId);
  const dt = new DataTransfer();

  function actualizarHint() {
    if (!hintEl) return;
    const n = dt.files.length;
    if (n === 0) {
      hintEl.textContent = 'Ninguna ' + sing + ' seleccionada';
      hintEl.style.color = '';
    } else if (n > maxFiles) {
      hintEl.textContent = n + ' ' + plur + ' — máximo ' + maxFiles + ' permitida' + (maxFiles > 1 ? 's' : '');
      hintEl.style.color = '#e72268';
    } else {
      hintEl.textContent = n + ' ' + (n > 1 ? plur : sing) + ' seleccionada' + (n > 1 ? 's' : '');
      hintEl.style.color = '#4b4495';
    }
  }

  function renderPreviews() {
    if (!container) return;
    container.innerHTML = '';
    Array.from(dt.files).forEach(function(file, idx) {
      var url = URL.createObjectURL(file);
      var item = document.createElement('div');
      item.className = 'foto-preview-item';
      var img = document.createElement('img');
      img.src = url;
      img.alt = file.name;
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'foto-preview-remove';
      btn.title = 'Eliminar';
      btn.textContent = '✕';
      btn.addEventListener('click', function() {
        var newDt = new DataTransfer();
        Array.from(dt.files).forEach(function(f, i) { if (i !== idx) newDt.items.add(f); });
        while (dt.items.length) dt.items.remove(0);
        Array.from(newDt.files).forEach(function(f) { dt.items.add(f); });
        inputEl.files = dt.files;
        renderPreviews();
        actualizarHint();
      });
      item.appendChild(img);
      item.appendChild(btn);
      container.appendChild(item);
    });
  }

  inputEl.addEventListener('change', function() {
    var tooLarge = [];
    Array.from(inputEl.files).forEach(function(f) {
      if (f.size > MAX_BYTES) {
        tooLarge.push(f.name + ' (' + (f.size / 1024 / 1024).toFixed(1) + 'MB)');
        return;
      }
      if (!Array.from(dt.files).some(function(e) { return e.name === f.name && e.size === f.size; })) {
        dt.items.add(f);
      }
    });
    inputEl.files = dt.files;
    renderPreviews();
    actualizarHint();
    if (tooLarge.length) {
      alert('Las siguientes imágenes superan el límite de ' + MAX_MB_IMAGEN + 'MB y no fueron agregadas:\n\n' + tooLarge.join('\n'));
    }
  });

  // Exponer dt para que la validación del wizard pueda acceder a .files
  return dt;
}

function initFileInput(paqueteKey) {
  const config        = PAQUETES[paqueteKey];
  const input         = document.getElementById('fotos');
  const hint          = document.getElementById('fotosHint');
  const seleccionadas = document.getElementById('fotosSeleccionadas');
  const grupoSubir    = document.getElementById('grupoSubirFotos');

  hint.textContent = 'Máximo ' + config.maxFotos + ' foto' + (config.maxFotos > 1 ? 's' : '');

  // Toggle mostrar/ocultar el input de fotos según la selección
  document.querySelectorAll('input[name="tienesFotos"]').forEach(function(r) {
    r.addEventListener('change', function() {
      grupoSubir.style.display = r.value === 'si' ? 'block' : 'none';
    });
  });

  crearPreviewPanel(input, 'fotosPreview', config.maxFotos, seleccionadas, 'foto', 'fotos');
}

// ==================== TIPO DE DISEÑO ====================

function initTipoDiseño(paqueteKey) {
  const radios     = document.querySelectorAll('input[name="tipoDiseno"]');
  const grupoFotos = document.getElementById('grupoFotos');

  radios.forEach(radio => {
    radio.addEventListener('change', () => {
      grupoFotos.style.display = radio.value === 'fotos' ? 'block' : 'none';
    });
  });
}

// ==================== DRESS CODE IMÁGENES ====================

function initDressCodeImg() {
  const cb    = document.getElementById('cbDressCodeImg');
  const grupo = document.getElementById('grupoDressCodeImg');
  const input = document.getElementById('dressCodeImgFile');
  const hint  = document.getElementById('dressCodeImgHint');

  if (!cb || !grupo) return;

  cb.addEventListener('change', function() {
    grupo.style.display = cb.checked ? 'block' : 'none';
  });

  if (input && hint) {
    crearPreviewPanel(input, 'dressCodePreview', 3, hint);
  }
}

// ==================== MENSAJE TOGGLE ====================

function initMensajeToggle() {
  const radios       = document.querySelectorAll('input[name="tipoMensaje"]');
  const grupoMensaje = document.getElementById('grupoMensajeTexto');

  if (!radios.length || !grupoMensaje) return;

  function actualizar() {
    var _chk = document.querySelector('input[name="tipoMensaje"]:checked');
    const val = _chk ? _chk.value : undefined;
    grupoMensaje.style.display = val === 'propio' ? 'block' : 'none';
  }

  radios.forEach(r => r.addEventListener('change', actualizar));
}

// ==================== ESTILO TOGGLE ====================

function initEstiloToggle() {
  const select    = document.getElementById('estiloInvitacion');
  const grupoDesc = document.getElementById('grupoEstiloDesc');
  const textarea  = document.getElementById('descripcionEstilo');

  if (!select || !grupoDesc) return;

  select.addEventListener('change', function() {
    const val = select.value;
    if (val) {
      grupoDesc.style.display = 'block';
      const estPh = t('est_ph');
      if (textarea && estPh && estPh[val]) textarea.placeholder = estPh[val];
    } else {
      grupoDesc.style.display = 'none';
    }
  });
}

// ==================== EVENTO OTRO ====================

function initEventoOtro() {
  const select = document.getElementById('tipoEvento');
  const grupo  = document.getElementById('grupoEventoOtro');
  if (!select || !grupo) return;

  select.addEventListener('change', () => {
    grupo.style.display = select.value === 'Otro' ? 'block' : 'none';
  });
}

// ==================== PHONE PREFIX ====================

function initPhonePrefix() {
  const input = document.getElementById('whatsapp');
  if (!input) return;

  // Solo permitir dígitos
  input.addEventListener('input', () => {
    input.value = input.value.replace(/\D/g, '');
  });
}

// ==================== MESA DE REGALOS ====================

function initMesaRegalos() {
  const radios      = document.querySelectorAll('input[name="tipoRegalos"]');
  const grupoMesa   = document.getElementById('grupoMesaRegalos');
  const grupoTransf = document.getElementById('grupoTransferencia');

  if (!radios.length || !grupoMesa || !grupoTransf) return;

  function actualizarVistaMesa() {
    var _chk = document.querySelector('input[name="tipoRegalos"]:checked');
    const val = (_chk ? _chk.value : '') || 'ninguno';
    grupoMesa.style.display   = val === 'mesa'          ? 'block' : 'none';
    grupoTransf.style.display = val === 'transferencia' ? 'block' : 'none';
  }

  radios.forEach(radio => radio.addEventListener('change', actualizarVistaMesa));
}

// ==================== VALIDACIÓN ====================

function validar(paqueteKey) {
  const camposRequeridos = [
    { id: 'nombreCompleto',    label: 'Nombre completo' },
    { id: 'correo',            label: 'Correo electrónico' },
    { id: 'tipoEvento',        label: 'Tipo de evento' },
    { id: 'fechaEvento',       label: 'Fecha del evento' },
    { id: 'nombresFestejados', label: 'Nombres de los festejados' },
    { id: 'estiloInvitacion',  label: 'Estilo de invitación' },
  ];

  document.querySelectorAll('.form-control.error').forEach(el => el.classList.remove('error'));

  const errores = [];

  camposRequeridos.forEach(({ id, label }) => {
    const el = document.getElementById(id);
    if (!el || !el.value.trim()) {
      errores.push(label);
      if (el) el.classList.add('error');
    }
  });

  // Tipo de evento "Otro" — requiere descripción
  const tipoEventoEl = document.getElementById('tipoEvento');
  if (tipoEventoEl && tipoEventoEl.value === 'Otro') {
    const otroEl = document.getElementById('tipoEventoOtro');
    if (!otroEl || !otroEl.value.trim()) { errores.push('Describe tu tipo de evento'); if (otroEl) otroEl.classList.add('error'); }
  }

  // WhatsApp — solo dígitos, 10 caracteres
  const wspEl     = document.getElementById('whatsapp');
  const wspDigits = ((wspEl ? wspEl.value : '') || '').replace(/\D/g, '');
  if (!wspDigits) {
    errores.push('WhatsApp (número requerido)');
    if (wspEl) wspEl.classList.add('error');
  } else if (wspDigits.length !== 10) {
    errores.push('WhatsApp (debe tener exactamente 10 dígitos)');
    if (wspEl) wspEl.classList.add('error');
  }

  // Correo — formato
  const correoEl = document.getElementById('correo');
  if (correoEl && correoEl.value.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correoEl.value.trim())) {
    if (!errores.includes('Correo electrónico')) errores.push('Correo electrónico (formato inválido)');
    correoEl.classList.add('error');
  }

  // Fecha no pasada
  const fechaEl = document.getElementById('fechaEvento');
  if (fechaEl && fechaEl.value) {
    const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
    if (new Date(fechaEl.value + 'T00:00:00') < hoy) {
      errores.push('Fecha del evento (no puede ser en el pasado)');
      fechaEl.classList.add('error');
    }
  }

  // Ubicación — mínimo una (ceremonia o recepción)
  const cbCeremonia = document.getElementById('hayCeremonia');
  const cbRecepcion = document.getElementById('hayRecepcion');
  const tieneCeremonia = cbCeremonia && cbCeremonia.checked;
  const tieneRecepcion = cbRecepcion && cbRecepcion.checked;
  if (!tieneCeremonia && !tieneRecepcion) {
    errores.push('Selecciona al menos una ubicación (ceremonia o recepción)');
  }
  if (tieneCeremonia) {
    const el = document.getElementById('lugarCeremonia');
    if (!el || !el.value.trim()) { errores.push('Lugar de la ceremonia'); if (el) el.classList.add('error'); }
  }
  if (tieneRecepcion) {
    const el = document.getElementById('lugarRecepcion');
    if (!el || !el.value.trim()) { errores.push('Lugar de la recepción'); if (el) el.classList.add('error'); }
  }

  // Mensaje — obligatorio seleccionar opción (Quick y Pro)
  if (paqueteKey !== 'motion') {
    if (!document.querySelector('input[name="tipoMensaje"]:checked')) {
      errores.push('Selecciona una opción para el mensaje de invitados');
    }
  }

  // Tipo de diseño — Quick y Pro
  if (paqueteKey !== 'motion') {
    if (!document.querySelector('input[name="tipoDiseno"]:checked')) {
      errores.push('Selecciona el tipo de diseño (Mis fotos / Diseño gráfico)');
    }
  }

  // Fotos — validar cantidad máxima
  const maxFotos   = PAQUETES[paqueteKey].maxFotos;
  const fotosInput = document.getElementById('fotos');
  var _chkFotos    = document.querySelector('input[name="tienesFotos"]:checked');
  const tieneFotosDisp = (_chkFotos ? _chkFotos.value : '') !== 'no';
  const tipoDisenoChecked = document.querySelector('input[name="tipoDiseno"]:checked');
  if (tieneFotosDisp && (paqueteKey === 'motion' || !tipoDisenoChecked || tipoDisenoChecked.value === 'fotos')) {
    if (fotosInput && fotosInput.files.length > maxFotos) {
      errores.push(`Fotos (máximo ${maxFotos} permitidas)`);
    }
  }
  Array.from((fotosInput ? fotosInput.files : []) || []).forEach(f => {
    if (!TIPOS_VALIDOS.includes(f.type)) errores.push(`"${f.name}" no es una imagen válida`);
  });

  // Confirmaciones — Quick (solo WSP), Pro (WSP o Correo)
  if (paqueteKey === 'quick' || paqueteKey === 'pro') {
    var _chkConf = document.querySelector('input[name="tipoConfirmacion"]:checked');
    const tipoConf = _chkConf ? _chkConf.value : undefined;
    if (!tipoConf) {
      errores.push('Selecciona el método de confirmación de asistencia');
    } else if (tipoConf === 'wsp') {
      const el = document.getElementById('whatsappConfirmaciones');
      if (!el || !el.value.trim()) { errores.push('WhatsApp para confirmaciones'); if (el) el.classList.add('error'); }
    } else if (tipoConf === 'correo') {
      const el = document.getElementById('correoConfirmaciones');
      if (!el || !el.value.trim()) { errores.push('Correo para confirmaciones'); if (el) el.classList.add('error'); }
    }
  }

  // Folio listo
  const folioVal = (document.getElementById('numeroFolio') || {value: ''}).value || '';
  if (!folioVal || folioVal === 'Cargando...' || !/^FEST-\d+$/.test(folioVal)) {
    errores.push('El folio no está listo, espera un momento y recarga la página');
  }

  return errores;
}

// ==================== RECOPILAR DATOS ====================

function recopilarDatos(paqueteKey) {
  const val = function(id) { var _e = document.getElementById(id); return _e ? (_e.value || '').trim() : ''; };

  // WhatsApp: prefijo + dígitos
  const prefijo  = (document.getElementById('whatsappPrefijo') ? document.getElementById('whatsappPrefijo').value : '+52') || '+52';
  const wspNum   = val('whatsapp').replace(/\D/g, '');
  const whatsapp = prefijo + wspNum;

  // Tipo evento: si es "Otro", usar la descripción
  const tipoEvento = val('tipoEvento') === 'Otro'
    ? ('Otro: ' + val('tipoEventoOtro'))
    : val('tipoEvento');

  const hayCeremonia = document.getElementById('hayCeremonia') && document.getElementById('hayCeremonia').checked;
  const hayRecepcion = document.getElementById('hayRecepcion')  && document.getElementById('hayRecepcion').checked;

  const datos = {
    folio:               val('numeroFolio'),
    fechaSolicitud:      val('fechaSolicitud'),
    paquete:             PAQUETES[paqueteKey].nombre,
    nombreCompleto:      val('nombreCompleto'),
    whatsapp:            whatsapp,
    correo:              val('correo'),
    tipoEvento:          tipoEvento,
    fechaEvento:         val('fechaEvento'),
    nombresFestejados:   val('nombresFestejados'),
    hayCeremonia:        hayCeremonia ? 'Sí' : 'No',
    lugarCeremonia:      hayCeremonia ? val('lugarCeremonia')     : '',
    horaCeremonia:       hayCeremonia ? val('horaCeremonia')      : '',
    ubicacionCeremonia:  (hayCeremonia && paqueteKey !== 'motion') ? val('ubicacionCeremonia') : '',
    hayRecepcion:        hayRecepcion ? 'Sí' : 'No',
    lugarRecepcion:      hayRecepcion ? val('lugarRecepcion')     : '',
    horaRecepcion:       hayRecepcion ? val('horaRecepcion')      : '',
    ubicacionRecepcion:  (hayRecepcion && paqueteKey !== 'motion') ? val('ubicacionRecepcion') : '',
    estiloInvitacion:    val('estiloInvitacion'),
    descripcionEstilo:   val('descripcionEstilo'),
    dressCode:           val('dressCode'),
    token:               FESTALI_TOKEN,
    lang:                getLang(),
  };

  const extras = PAQUETES[paqueteKey].extras;

  // Quick y Pro: tienen tipo diseño, mensaje y confirmaciones
  if (extras.includes('quick')) {
    datos.tipoDiseno   = ((function(){ var _e = document.querySelector('input[name="tipoDiseno"]:checked'); return _e ? _e.value : ''; })() || '');
    datos.mensajeEspecial = (function(){ var _e = document.querySelector('input[name="tipoMensaje"]:checked'); return _e && _e.value === 'propio'; })()
                            ? val('mensajeEspecial') : '';
    datos.mensajeFestali  = (function(){ var _e = document.querySelector('input[name="tipoMensaje"]:checked'); return _e && _e.value === 'festali'; })() ? 'Sí' : '';
    datos.whatsappConfirmaciones = (function(){ var _e = document.querySelector('input[name="tipoConfirmacion"]:checked'); return _e && _e.value === 'wsp'; })()
                                   ? val('whatsappConfirmaciones') : '';
    datos.correoConfirmaciones   = (function(){ var _e = document.querySelector('input[name="tipoConfirmacion"]:checked'); return _e && _e.value === 'correo'; })()
                                   ? val('correoConfirmaciones') : '';
    datos.tipoRegalos     = ((function(){ var _e = document.querySelector('input[name="tipoRegalos"]:checked'); return _e ? _e.value : ''; })() || '');
    datos.mesaRegalosLink = val('mesaRegalosLink');
    datos.bancoCuenta     = val('bancoCuenta');
    datos.titularCuenta   = val('titularCuenta');
    datos.clabeCuenta     = val('clabeCuenta');
  }

  // Motion: solo música (no confirmaciones ni regalos)
  if (extras.includes('motion') && !extras.includes('quick')) {
    datos.musica = val('musica');
  }

  // Pro: todo + música + asistencia + hospedaje
  if (extras.includes('pro')) {
    datos.musica          = val('musica');
    datos.datosAsistencia = val('datosAsistencia');
    datos.soloAdultos     = (document.getElementById('soloAdultos') && document.getElementById('soloAdultos').checked) ? 'Sí' : 'No';
    datos.hospedaje       = val('hospedaje');
  }

  return datos;
}

// ==================== FOTOS A BASE64 ====================

function archivoABase64(archivo) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      // reader.result = "data:image/jpeg;base64,/9j/..."
      const base64 = reader.result.split(',')[1];
      resolve({ data: base64, mimeType: archivo.type, nombre: archivo.name });
    };
    reader.onerror = () => reject(new Error(`No se pudo leer: ${archivo.name}`));
    reader.readAsDataURL(archivo);
  });
}

// ==================== ENVÍO ====================

async function enviar(datos, archivos, imagenRefEstilo, dressCodeImgs) {
  // Convertir archivos a base64
  const fotosBase64      = await Promise.all(Array.from(archivos          || []).map(archivoABase64));
  const refsBase64       = await Promise.all(Array.from(imagenRefEstilo   || []).map(archivoABase64));
  const dressCodeBase64  = await Promise.all(Array.from(dressCodeImgs     || []).map(archivoABase64));
  const payload = Object.assign({}, datos, {
    fotos: fotosBase64,
    referencias: refsBase64,
    dressCodeImagenes: dressCodeBase64,
  });

  if (!SCRIPT_URL) {
    // ── MODO PRUEBA ──
    console.log('═══════════════════════════════════════════');
    console.log('  FESTALI — Modo prueba (SCRIPT_URL vacío)');
    console.log('═══════════════════════════════════════════');
    console.table(datos);
    console.log(`Archivos adjuntos: ${fotosBase64.length} foto(s), ${refsBase64.length} referencia(s)`);
    fotosBase64.forEach((f, i) =>
      console.log(`  [${i + 1}] ${f.nombre} — ${f.mimeType}`)
    );
    await new Promise(resolve => setTimeout(resolve, 2000));
    return { ok: true };
  }

  // ── MODO PRODUCCIÓN ── Enviar JSON a Google Apps Script
  // Content-Type: text/plain evita el preflight CORS que bloquea Apps Script.
  console.log(`📎 Archivos: ${fotosBase64.length} foto(s), ${refsBase64.length} ref estilo, ${dressCodeBase64.length} dressCode`);

  let resultado;
  try {
    const response = await fetch(SCRIPT_URL, {
      method: 'POST',
      mode: 'cors',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(payload)
    });
    resultado = await response.json();
    console.log('✅ Respuesta del servidor:', resultado);
  } catch (fetchErr) {
    console.error('❌ Fetch falló antes de llegar al servidor:', fetchErr);
    throw fetchErr;
  }

  return resultado;
}

// ==================== MOSTRAR CONFIRMACIÓN ====================

function mostrarConfirmacion(folio) {
  const wrapper = document.getElementById('formWrapper');
  const banner  = document.getElementById('paqueteBanner');
  if (wrapper) wrapper.style.display = 'none';
  if (banner)  banner.style.display  = 'none';

  document.getElementById('folioConfirmacion').textContent = folio;
  document.getElementById('confirmacion').classList.add('active');

  window.scrollTo({ top: 0, behavior: 'smooth' });

  // Confeti desde ambos lados durante 3 segundos
  if (typeof confetti === 'function') {
    var fin = Date.now() + 3000;
    (function frame() {
      confetti({ particleCount: 6, angle: 60, spread: 55, origin: { x: 0 } });
      confetti({ particleCount: 6, angle: 120, spread: 55, origin: { x: 1 } });
      if (Date.now() < fin) requestAnimationFrame(frame);
    })();
  }
}

// ==================== MOSTRAR ERRORES ====================

function mostrarErrores(errores) {
  // Scroll al primer campo con error
  const primerError = document.querySelector('.form-control.error');
  if (primerError) {
    primerError.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(() => primerError.focus(), 400);
  }

  const lista = errores.map(e => `• ${e}`).join('\n');
  alert(`Por favor completa los siguientes campos obligatorios:\n\n${lista}`);
}

// ==================== SPINNER — ROTACIÓN DE MENSAJES ====================

// ==================== WIZARD ====================

function initWizard(paqueteKey) {
  const A  = ['quick','motion','pro'];
  const QP = ['quick','pro'];
  const MP = ['motion','pro'];
  const P  = ['pro'];

  const todosLosPasos = [
    { id: 'q-nombre',      tituloKey: 'step_nombre',       paquetes: A  },
    { id: 'q-whatsapp',    tituloKey: 'step_whatsapp',     paquetes: A  },
    { id: 'q-correo',      tituloKey: 'step_correo',       paquetes: A  },
    { id: 'q-evento',      tituloKey: 'step_evento',       paquetes: A  },
    { id: 'q-fecha',       tituloKey: 'step_fecha',        paquetes: A  },
    { id: 'q-festejados',  tituloKey: 'step_festejados',   paquetes: A  },
    { id: 'q-ubicacion',   tituloKey: 'step_ubicacion',    paquetes: A  },
    { id: 'q-estilo',      tituloKey: 'step_estilo',       paquetes: A  },
    { id: 'q-diseno',      tituloKey: 'step_diseno',       paquetes: QP },
    { id: 'q-fotos',       tituloKey: 'step_fotos',        paquetes: A  },
    { id: 'q-mensaje',     tituloKey: 'step_mensaje',      paquetes: QP },
    { id: 'q-dresscode',   tituloKey: 'step_dresscode',    paquetes: A  },
    { id: 'q-confirmacion',tituloKey: 'step_confirmacion', paquetes: QP },
    { id: 'q-asistencia',  tituloKey: 'step_asistencia',   paquetes: P  },
    { id: 'q-regalos',     tituloKey: 'step_regalos',      paquetes: QP },
    { id: 'q-musica',      tituloKey: 'step_musica',       paquetes: MP },
    { id: 'q-hospedaje',   tituloKey: 'step_hospedaje',    paquetes: P  },
  ];

  const pasos = todosLosPasos.filter(p => p.paquetes.includes(paqueteKey));
  let actual  = 0;

  function irA(n) {
    document.querySelectorAll('.form-step').forEach(s => s.style.display = 'none');
    actual = n;
    document.getElementById(pasos[n].id).style.display = 'block';
    const titleEl = document.getElementById('wizardStepTitle');
    titleEl.textContent  = t(pasos[n].tituloKey);
    titleEl._i18nKey     = pasos[n].tituloKey;
    // Progreso
    const pct = Math.round(((n + 1) / pasos.length) * 100);
    document.getElementById('wizardProgressBar').style.width = pct + '%';
    document.getElementById('wizardStepCounter').textContent = `Paso ${n + 1} de ${pasos.length}`;
    // Botones
    document.getElementById('btnAnterior').style.display = n === 0 ? 'none' : '';
    document.getElementById('btnSiguiente').style.display = n < pasos.length - 1 ? '' : 'none';
    document.getElementById('btnEnviar').style.display    = n === pasos.length - 1 ? '' : 'none';
    document.getElementById('formWrapper').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function validarPasoActual() {
    const id      = pasos[actual].id;
    const errores = [];
    const marcar  = function(fieldId) { var _e = document.getElementById(fieldId); if (_e) _e.classList.add('error'); };

    if (id === 'q-nombre') {
      const el = document.getElementById('nombreCompleto');
      if (!el || !el.value.trim()) { errores.push('Escribe tu nombre completo'); marcar('nombreCompleto'); }
    }
    if (id === 'q-correo') {
      const el = document.getElementById('correo');
      if (!el || !el.value.trim()) { errores.push('Escribe tu correo'); marcar('correo'); }
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(el.value.trim())) { errores.push('Formato de correo inválido'); marcar('correo'); }
    }
    if (id === 'q-fecha') {
      const el = document.getElementById('fechaEvento');
      if (!el || !el.value) { errores.push('Selecciona la fecha del evento'); marcar('fechaEvento'); }
      else {
        const hoy = new Date(); hoy.setHours(0,0,0,0);
        if (new Date(el.value + 'T00:00:00') < hoy) { errores.push('La fecha no puede ser en el pasado'); marcar('fechaEvento'); }
      }
    }
    if (id === 'q-festejados') {
      const el = document.getElementById('nombresFestejados');
      if (!el || !el.value.trim()) { errores.push('Escribe los nombres de los festejados'); marcar('nombresFestejados'); }
    }
    if (id === 'q-ubicacion') {
      const cbCer = document.getElementById('hayCeremonia');
      const cbRec = document.getElementById('hayRecepcion');
      if (!cbCer.checked && !cbRec.checked) {
        errores.push('Selecciona al menos una ubicación (ceremonia o recepción)');
      }
      if (cbCer && cbCer.checked) {
        const el = document.getElementById('lugarCeremonia');
        if (!el || !el.value.trim()) { errores.push('Escribe el lugar de la ceremonia'); marcar('lugarCeremonia'); }
        const elHora = document.getElementById('horaCeremonia');
        if (!elHora || !elHora.value) { errores.push('Escribe la hora de la ceremonia'); marcar('horaCeremonia'); }
      }
      if (cbRec && cbRec.checked) {
        const el = document.getElementById('lugarRecepcion');
        if (!el || !el.value.trim()) { errores.push('Escribe el lugar de la recepción'); marcar('lugarRecepcion'); }
        const elHora = document.getElementById('horaRecepcion');
        if (!elHora || !elHora.value) { errores.push('Escribe la hora de la recepción'); marcar('horaRecepcion'); }
      }
    }
    if (id === 'q-estilo') {
      const el = document.getElementById('estiloInvitacion');
      if (!el || !el.value) { errores.push('Selecciona un estilo de invitación'); marcar('estiloInvitacion'); }
    }
    if (id === 'q-diseno') {
      if (!document.querySelector('input[name="tipoDiseno"]:checked')) errores.push('Selecciona el tipo de diseño');
    }
    if (id === 'q-evento') {
      const el = document.getElementById('tipoEvento');
      if (!el || !el.value) { errores.push('Selecciona el tipo de evento'); marcar('tipoEvento'); }
      else if (el.value === 'Otro') {
        const otroEl = document.getElementById('tipoEventoOtro');
        if (!otroEl || !otroEl.value.trim()) { errores.push('Describe tu tipo de evento'); marcar('tipoEventoOtro'); }
      }
    }
    if (id === 'q-whatsapp') {
      const el     = document.getElementById('whatsapp');
      const digits = ((el ? el.value : '') || '').replace(/\D/g, '');
      if (!digits) { errores.push('Escribe tu número de WhatsApp'); marcar('whatsapp'); }
      else if (digits.length !== 10) { errores.push('El número debe tener 10 dígitos'); marcar('whatsapp'); }
    }
    if (id === 'q-mensaje') {
      if (!document.querySelector('input[name="tipoMensaje"]:checked')) {
        errores.push('Selecciona una opción para el mensaje');
      }
    }
    if (id === 'q-fotos') {
      var _chkTieneFotos = document.querySelector('input[name="tienesFotos"]:checked');
      const tieneFotos   = (_chkTieneFotos ? _chkTieneFotos.value : '') !== 'no';
      const tipoDis      = document.querySelector('input[name="tipoDiseno"]:checked');
      const maxFotos     = PAQUETES[paqueteKey].maxFotos;
      const fotosFiles   = document.getElementById('fotos').files;
      if (tieneFotos && (paqueteKey === 'motion' || !tipoDis || tipoDis.value === 'fotos')) {
        if (fotosFiles.length > maxFotos) errores.push(`Máximo ${maxFotos} foto${maxFotos > 1 ? 's' : ''} permitidas`);
      }
      Array.from(fotosFiles || []).forEach(f => {
        if (!TIPOS_VALIDOS.includes(f.type)) errores.push(`"${f.name}" no es una imagen válida`);
      });
    }
    if (id === 'q-confirmacion') {
      var _chkTipoConf = document.querySelector('input[name="tipoConfirmacion"]:checked');
      const tipoConf = _chkTipoConf ? _chkTipoConf.value : undefined;
      if (!tipoConf) { errores.push('Selecciona el método de confirmación'); }
      else if (tipoConf === 'wsp') {
        const el = document.getElementById('whatsappConfirmaciones');
        if (!el || !el.value.trim()) { errores.push('Escribe el WhatsApp para confirmaciones'); marcar('whatsappConfirmaciones'); }
      } else if (tipoConf === 'correo') {
        const el = document.getElementById('correoConfirmaciones');
        if (!el || !el.value.trim()) { errores.push('Escribe el correo para confirmaciones'); marcar('correoConfirmaciones'); }
      }
    }
    return errores;
  }

  function esGrafico() {
    var _chk = document.querySelector('input[name="tipoDiseno"]:checked');
    return _chk && _chk.value === 'grafico';
  }

  function siguientePaso(desde) {
    var n = desde + 1;
    if (n < pasos.length && pasos[n].id === 'q-fotos' && esGrafico()) n++;
    return n;
  }

  function anteriorPaso(desde) {
    var n = desde - 1;
    if (n >= 0 && pasos[n].id === 'q-fotos' && esGrafico()) n--;
    return n;
  }

  document.getElementById('btnSiguiente').addEventListener('click', () => {
    document.querySelectorAll('.form-control.error').forEach(el => el.classList.remove('error'));
    const errores = validarPasoActual();
    if (errores.length > 0) { mostrarErrores(errores); return; }
    const sig = siguientePaso(actual);
    if (sig < pasos.length) irA(sig);
  });

  document.getElementById('btnAnterior').addEventListener('click', () => {
    const ant = anteriorPaso(actual);
    if (ant >= 0) irA(ant);
  });

  irA(0);
}

const SPINNER_MENSAJES = [
  'Enviando tu información... 📤',
  'No cierres ni actualices la página 🙏',
  'Ya casi... 💫',
  'Un poquitito más... 🎉',
  'La magia tarda un momento... 🪄',
  'Casi lista, prometemos que vale la pena ⭐',
  'Guardando tus fotos con cuidado... 📸',
  'Un segundo, estamos trabajando en ello 🛠️',
  '¡Gracias por tu paciencia, ya mero! 🙌',
  'Un diseñador profesional recibirá tu pedido en breve 🖌️',
  'Esto es más rápido que la fila del banco, te lo prometemos 😂'
];

let _spinnerInterval = null;

function iniciarMensajesSpinner() {
  const texto = document.querySelector('.spinner-texto');
  if (!texto) return;

  let i = 0;
  texto.textContent = SPINNER_MENSAJES[0];

  _spinnerInterval = setInterval(() => {
    i = (i + 1) % SPINNER_MENSAJES.length;
    texto.textContent = SPINNER_MENSAJES[i];
  }, 3000);
}

function detenerMensajesSpinner() {
  if (_spinnerInterval) {
    clearInterval(_spinnerInterval);
    _spinnerInterval = null;
  }
}

// ==================== INICIALIZAR SUBMIT ====================

function initSubmit(paqueteKey) {
  const form    = document.getElementById('festaliForm');
  const spinner = document.getElementById('spinnerOverlay');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const errores = validar(paqueteKey);
    if (errores.length > 0) {
      mostrarErrores(errores);
      return;
    }

    spinner.classList.add('active');
    iniciarMensajesSpinner();

    try {
      const datos    = recopilarDatos(paqueteKey);
      const archivos = document.getElementById('fotos').files;

      const imgRefEstiloInput = document.getElementById('imagenRefEstilo');
      const imagenRefEstilo   = imgRefEstiloInput ? imgRefEstiloInput.files : [];

      var _cbDressCode      = document.getElementById('cbDressCodeImg');
      const usaDressCodeImg = _cbDressCode && _cbDressCode.checked;
      const dressCodeImgs   = usaDressCodeImg ? document.getElementById('dressCodeImgFile').files : [];

      const folio = datos.folio;

      console.log('🚀 Llamando a enviar()...');
      await enviar(datos, archivos, imagenRefEstilo, dressCodeImgs);

      detenerMensajesSpinner();
      spinner.classList.remove('active');
      mostrarConfirmacion(folio);

    } catch (err) {
      detenerMensajesSpinner();
      spinner.classList.remove('active');
      console.error('Error al enviar formulario FESTALI:', err);
      alert(
        'Error al enviar tu solicitud:\n' + err.message + '\n\n' +
        'Revisa la consola (F12) para más detalles o contáctanos:\n' +
        '📱 WhatsApp: +52 686 230 1280\n' +
        '✉ festaliconecta@gmail.com'
      );
    }
  });
}
