// v2.3 - compatibilidad navegadores antiguos (sin optional chaining)
// ============================================================
// FESTALI — formulario.js
// Lógica del formulario de contratación
// ============================================================

// Dejar vacío hasta configurar Google Apps Script.
// En modo vacío, los datos se imprimen en consola y se simula éxito.
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz957yBhCCOLfEIQSwN-uczZ3j1W49sZbQxgDjmaROBGHPtmPky_GoGb5Ewh0koFOvt/exec';

// Token de acceso — debe coincidir con FESTALI_TOKEN en Script Properties de Apps Script
const FESTALI_TOKEN = 'festali-2026-xK9mP';

// Tipos de archivo permitidos para subir
const TIPOS_VALIDOS = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif'];

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

function initFileInput(paqueteKey) {
  const config        = PAQUETES[paqueteKey];
  const input         = document.getElementById('fotos');
  const hint          = document.getElementById('fotosHint');
  const seleccionadas = document.getElementById('fotosSeleccionadas');
  const grupoSubir    = document.getElementById('grupoSubirFotos');

  hint.textContent = `Máximo ${config.maxFotos} foto${config.maxFotos > 1 ? 's' : ''}`;

  // Toggle mostrar/ocultar el input de fotos según la selección
  document.querySelectorAll('input[name="tienesFotos"]').forEach(r => {
    r.addEventListener('change', () => {
      grupoSubir.style.display = r.value === 'si' ? 'block' : 'none';
    });
  });

  initAcumulador(input, n => {
    if (n === 0) {
      seleccionadas.textContent = 'Ninguna foto seleccionada';
      seleccionadas.style.color = '';
    } else if (n > config.maxFotos) {
      seleccionadas.textContent = `${n} fotos — máximo ${config.maxFotos} permitidas`;
      seleccionadas.style.color = '#e72268';
    } else {
      seleccionadas.textContent = `${n} foto${n > 1 ? 's' : ''} seleccionada${n > 1 ? 's' : ''}`;
      seleccionadas.style.color = '#4b4495';
    }
  });
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

  cb.addEventListener('change', () => {
    grupo.style.display = cb.checked ? 'block' : 'none';
  });

  if (input && hint) {
    initAcumulador(input, n => {
      hint.textContent = n
        ? `${n} imagen${n > 1 ? 'es' : ''} seleccionada${n > 1 ? 's' : ''}`
        : 'Ninguna imagen seleccionada';
    });
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
  const input     = document.getElementById('imagenRefEstilo');
  const hint      = document.getElementById('refEstiloSeleccionada');

  const placeholders = {
    'Elegante / Clásico':    'Ej: Tonos dorados con blanco, tipografía cursiva fina, flores de peonías o rosas...',
    'Moderno / Minimalista': 'Ej: Algo muy limpio, blanco y negro o con un color de acento, sin muchos adornos...',
    'Floral / Romántico':    'Ej: Colores pastel como rosa o lila, muchas flores, algo delicado y femenino...',
    'Temático':              '¿Cuál es tu tema? Ej: Vintage, Disney, deportivo, jardín encantado, mexicano...'
  };

  if (!select || !grupoDesc) return;

  select.addEventListener('change', () => {
    const val = select.value;
    if (val) {
      grupoDesc.style.display = 'block';
      if (textarea && placeholders[val]) textarea.placeholder = placeholders[val];
    } else {
      grupoDesc.style.display = 'none';
    }
  });

  if (input && hint) {
    input.addEventListener('change', () => {
      const n = input.files.length;
      if (n === 0) {
        hint.textContent = 'Ninguna imagen seleccionada';
        hint.style.color = '';
      } else if (n > 1) {
        // Si selecciona más de 1, conservar solo la primera
        const dt = new DataTransfer();
        dt.items.add(input.files[0]);
        input.files = dt.files;
        hint.textContent = '1 imagen seleccionada';
        hint.style.color = '#4b4495';
      } else {
        hint.textContent = '1 imagen seleccionada';
        hint.style.color = '#4b4495';
      }
    });
  }
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
  console.log(`📎 Archivos: ${fotosBase64.length} foto(s), ${refsBase64.length} ref(s), ${agendaBase64.length} agenda, ${dressCodeBase64.length} dressCode`);

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
    { id: 'q-nombre',      titulo: '¿Cuál es tu nombre?',                    paquetes: A  },
    { id: 'q-whatsapp',    titulo: 'Tu número de WhatsApp',                   paquetes: A  },
    { id: 'q-correo',      titulo: 'Tu correo electrónico',                   paquetes: A  },
    { id: 'q-evento',      titulo: '¿Qué tipo de evento es?',                 paquetes: A  },
    { id: 'q-fecha',       titulo: '¿Cuándo es el evento?',                   paquetes: A  },
    { id: 'q-festejados',  titulo: '¿Quién o quiénes son los festejados?',    paquetes: A  },
    { id: 'q-ubicacion',   titulo: '¿Dónde será el evento?',                  paquetes: A  },
    { id: 'q-estilo',      titulo: '¿Qué estilo te gusta?',                   paquetes: A  },
    { id: 'q-diseno',      titulo: '¿Cómo quieres el diseño?',                paquetes: QP },
    { id: 'q-fotos',       titulo: 'Tus fotos',                               paquetes: A  },
    { id: 'q-mensaje',     titulo: 'Mensaje especial para tus invitados',     paquetes: QP },
    { id: 'q-dresscode',   titulo: '¿Hay dress code?',                        paquetes: A  },
    { id: 'q-confirmacion',titulo: '¿Cómo confirmarán asistencia?',           paquetes: QP },
    { id: 'q-asistencia',  titulo: '¿Qué quieres saber de tus invitados?',   paquetes: P  },
    { id: 'q-regalos',     titulo: 'Mesa de regalos',                         paquetes: QP },
    { id: 'q-musica',      titulo: '¿Canción para el video/invitación?',      paquetes: MP },
    { id: 'q-hospedaje',   titulo: 'Información de hospedaje',                paquetes: P  },
  ];

  const pasos = todosLosPasos.filter(p => p.paquetes.includes(paqueteKey));
  let actual  = 0;

  function irA(n) {
    document.querySelectorAll('.form-step').forEach(s => s.style.display = 'none');
    actual = n;
    document.getElementById(pasos[n].id).style.display = 'block';
    document.getElementById('wizardStepTitle').textContent = pasos[n].titulo;
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
