// v2.1 - botón MP confirmación
// ============================================================
// FESTALI — formulario.js
// Lógica del formulario de contratación
// ============================================================

// Dejar vacío hasta configurar Google Apps Script.
// En modo vacío, los datos se imprimen en consola y se simula éxito.
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzd7cHYsGMOFZ1HOyQrFvM52NkyXe6fsqUmTIGs1LDi6K7VkLgJhWL6XYCAag4i9tGC/exec';

// Token de acceso — debe coincidir con FESTALI_TOKEN en Script Properties de Apps Script
const FESTALI_TOKEN = 'festali-2026-xK9mP';

// Tipos de archivo permitidos para subir
const TIPOS_VALIDOS = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif'];

// ==================== CONFIGURACIÓN DE PAQUETES ====================

const PAQUETES = {
  essence: {
    nombre: 'Digital Essence',
    minFotos: 3,
    extras: []
  },
  smart: {
    nombre: 'Smart Interactive',
    minFotos: 3,
    extras: ['smart']
  },
  premium: {
    nombre: 'Premium Experience',
    minFotos: 15,
    extras: ['smart', 'premium']
  }
};

// ==================== INICIO ====================

document.addEventListener('DOMContentLoaded', () => {
  const paqueteKey = detectarPaquete();

  setFechaAutomatica();
  setFolio();
  configurarPaquete(paqueteKey);
  initUbicaciones();
  initConfirmacionToggle();
  initFileInput(paqueteKey);
  initTipoDiseño(paqueteKey);
  initIdeasToggle();
  initAgendaToggle();
  initRefInput();
  initMesaRegalos();
  initDressCodeImg();
  initMensajeToggle();
  initPreviewEnlace();
  initWizard(paqueteKey);
  initSubmit(paqueteKey);
});

// ==================== DETECTAR PAQUETE ====================

function detectarPaquete() {
  const params = new URLSearchParams(window.location.search);
  const valor = (params.get('paquete') || '').toLowerCase();
  return PAQUETES[valor] ? valor : 'essence';
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
    const val = document.querySelector('input[name="tipoConfirmacion"]:checked')?.value;
    grupoWsp.style.display    = val === 'wsp'    ? 'block' : 'none';
    grupoCorreo.style.display = val === 'correo' ? 'block' : 'none';

    // Pre-llenar con el contacto ingresado al inicio (editable)
    if (val === 'wsp') {
      const inputConf = document.getElementById('whatsappConfirmaciones');
      if (inputConf && !inputConf.value) {
        inputConf.value = document.getElementById('whatsapp')?.value || '';
      }
    } else if (val === 'correo') {
      const inputConf = document.getElementById('correoConfirmaciones');
      if (inputConf && !inputConf.value) {
        inputConf.value = document.getElementById('correo')?.value || '';
      }
    }
  }

  radios.forEach(r => r.addEventListener('change', actualizar));
}

// ==================== UBICACIONES ====================

function initUbicaciones() {
  const cbCeremonia    = document.getElementById('hayCeremonia');
  const cbRecepcion    = document.getElementById('hayRecepcion');
  const grupoCeremonia = document.getElementById('grupoCeremonia');
  const grupoRecepcion = document.getElementById('grupoRecepcion');

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
  const config      = PAQUETES[paqueteKey];
  const input       = document.getElementById('fotos');
  const hint        = document.getElementById('fotosHint');
  const seleccionadas = document.getElementById('fotosSeleccionadas');

  hint.textContent = `Mínimo ${config.minFotos} foto${config.minFotos > 1 ? 's' : ''}`;

  initAcumulador(input, n => {
    if (n === 0) {
      seleccionadas.textContent = 'Ninguna foto seleccionada';
    } else {
      seleccionadas.textContent = `${n} foto${n > 1 ? 's' : ''} seleccionada${n > 1 ? 's' : ''}`;
      seleccionadas.style.color = n >= config.minFotos ? '#4b4495' : '#e72268';
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
    const val = document.querySelector('input[name="tipoMensaje"]:checked')?.value;
    grupoMensaje.style.display = val === 'propio' ? 'block' : 'none';
  }

  radios.forEach(r => r.addEventListener('change', actualizar));
}

// ==================== AGENDA TOGGLE ====================

function initAgendaToggle() {
  const radios          = document.querySelectorAll('input[name="tipoAgenda"]');
  const grupoTexto      = document.getElementById('grupoAgendaTexto');
  const grupoImagen     = document.getElementById('grupoAgendaImagen');
  const agendaImgInput  = document.getElementById('agendaImagenFile');
  const agendaImgHint   = document.getElementById('agendaImgSeleccionada');

  if (!radios.length || !grupoTexto || !grupoImagen) return;

  function actualizar() {
    const val = document.querySelector('input[name="tipoAgenda"]:checked')?.value;
    grupoTexto.style.display   = val === 'texto'  ? 'block' : 'none';
    grupoImagen.style.display  = val === 'imagen' ? 'block' : 'none';
  }

  radios.forEach(r => r.addEventListener('change', actualizar));

  if (agendaImgInput && agendaImgHint) {
    initAcumulador(agendaImgInput, n => {
      agendaImgHint.textContent = n
        ? `${n} imagen${n > 1 ? 'es' : ''} seleccionada${n > 1 ? 's' : ''}`
        : 'Ninguna imagen seleccionada';
    });
  }
}

// ==================== IDEAS TOGGLE ====================

function initIdeasToggle() {
  const radios     = document.querySelectorAll('input[name="tieneIdeas"]');
  const grupoIdeas = document.getElementById('grupoIdeas');

  function actualizar() {
    const val = document.querySelector('input[name="tieneIdeas"]:checked')?.value;
    grupoIdeas.style.display = val === 'tengoIdea' ? 'block' : 'none';
  }

  radios.forEach(r => r.addEventListener('change', actualizar));
}

// ==================== REFERENCIAS ====================

function initRefInput() {
  const input         = document.getElementById('referenciaVisual');
  const seleccionadas = document.getElementById('refsSeleccionadas');

  initAcumulador(input, n => {
    if (n === 0) {
      seleccionadas.textContent = 'Ninguna referencia seleccionada';
      seleccionadas.style.color = '';
    } else if (n > 3) {
      seleccionadas.textContent = `${n} imágenes — máximo 3 permitidas`;
      seleccionadas.style.color = '#e72268';
    } else {
      seleccionadas.textContent = `${n} imagen${n > 1 ? 'es' : ''} seleccionada${n > 1 ? 's' : ''}`;
      seleccionadas.style.color = '#4b4495';
    }
  });
}

// ==================== MESA DE REGALOS ====================

function initMesaRegalos() {
  const radios      = document.querySelectorAll('input[name="tipoRegalos"]');
  const grupoMesa   = document.getElementById('grupoMesaRegalos');
  const grupoTransf = document.getElementById('grupoTransferencia');

  if (!radios.length || !grupoMesa || !grupoTransf) return;

  function actualizarVistaMesa() {
    const val = document.querySelector('input[name="tipoRegalos"]:checked')?.value || 'ninguno';
    grupoMesa.style.display   = val === 'mesa'          ? 'block' : 'none';
    grupoTransf.style.display = val === 'transferencia' ? 'block' : 'none';
  }

  radios.forEach(radio => radio.addEventListener('change', actualizarVistaMesa));
}

// ==================== PREVIEW ENLACE ====================

function initPreviewEnlace() {
  const input = document.getElementById('nombreEnlace');
  if (!input) return;

  const preview = document.getElementById('previewEnlace');

  input.addEventListener('input', () => {
    const limpio = input.value
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // quitar acentos
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    input.value = limpio;
    preview.textContent = limpio || 'nombre-del-evento';
  });
}

// ==================== VALIDACIÓN ====================

function validar(paqueteKey) {
  const camposRequeridos = [
    { id: 'nombreCompleto',       label: 'Nombre completo' },
    { id: 'whatsapp',             label: 'WhatsApp' },
    { id: 'correo',               label: 'Correo electrónico' },
    { id: 'tipoEvento',           label: 'Tipo de evento' },
    { id: 'fechaEvento',          label: 'Fecha del evento' },
    { id: 'horaEvento',           label: 'Hora del evento' },
    { id: 'nombresFestejados',    label: 'Nombres de los festejados' },
    { id: 'paletaColores',        label: 'Paleta de colores' },
    { id: 'estiloInvitacion',     label: 'Estilo de invitación' },
  ];

  // Limpiar errores previos
  document.querySelectorAll('.form-control.error').forEach(el => el.classList.remove('error'));

  const errores = [];

  camposRequeridos.forEach(({ id, label }) => {
    const el = document.getElementById(id);
    if (!el || !el.value.trim()) {
      errores.push(label);
      if (el) el.classList.add('error');
    }
  });

  // Validar contacto para confirmaciones — solo Smart y Premium
  if (paqueteKey !== 'essence') {
    const tipoConf = document.querySelector('input[name="tipoConfirmacion"]:checked')?.value;
    if (!tipoConf) {
      errores.push('Método de confirmación de asistencia (WhatsApp o Correo)');
    } else if (tipoConf === 'wsp') {
      const el = document.getElementById('whatsappConfirmaciones');
      if (!el?.value.trim()) { errores.push('WhatsApp para confirmaciones'); el?.classList.add('error'); }
    } else if (tipoConf === 'correo') {
      const el = document.getElementById('correoConfirmaciones');
      if (!el?.value.trim()) { errores.push('Correo para confirmaciones'); el?.classList.add('error'); }
    }
  }

  // Validar ubicaciones solo si el checkbox está marcado
  const cbCeremonia = document.getElementById('hayCeremonia');
  const cbRecepcion = document.getElementById('hayRecepcion');
  if (cbCeremonia?.checked) {
    const el = document.getElementById('lugarCeremonia');
    if (!el?.value.trim()) { errores.push('Lugar de la ceremonia'); el?.classList.add('error'); }
  }
  if (cbRecepcion?.checked) {
    const el = document.getElementById('lugarRecepcion');
    if (!el?.value.trim()) { errores.push('Lugar de la recepción'); el?.classList.add('error'); }
  }

  // Validar formato de correo
  const correoEl = document.getElementById('correo');
  if (correoEl.value.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correoEl.value.trim())) {
    if (!errores.includes('Correo electrónico')) errores.push('Correo electrónico (formato inválido)');
    correoEl.classList.add('error');
  }

  // Validar WhatsApp — solo dígitos y +, entre 7 y 15 caracteres
  const wspEl = document.getElementById('whatsapp');
  const wspVal = (wspEl?.value || '').replace(/\s/g, '');
  if (wspVal && !/^\+?\d{7,15}$/.test(wspVal)) {
    errores.push('WhatsApp (formato inválido, ej: +52 686 000 0000)');
    wspEl?.classList.add('error');
  }

  // Validar que la fecha del evento no sea en el pasado
  const fechaEl = document.getElementById('fechaEvento');
  if (fechaEl?.value) {
    const hoy      = new Date(); hoy.setHours(0, 0, 0, 0);
    const fechaSel = new Date(fechaEl.value + 'T00:00:00');
    if (fechaSel < hoy) {
      errores.push('Fecha del evento (no puede ser una fecha pasada)');
      fechaEl.classList.add('error');
    }
  }

  // Validar tipo de diseño (radio obligatorio)
  const tipoDisenoChecked = document.querySelector('input[name="tipoDiseno"]:checked');
  if (!tipoDisenoChecked) {
    errores.push('Tipo de diseño (Mis fotos / Diseño gráfico)');
  }

  // Validar fotos solo si seleccionó "Mis fotos"
  const minFotos = PAQUETES[paqueteKey].minFotos;
  const fotosInput = document.getElementById('fotos');
  if (!tipoDisenoChecked || tipoDisenoChecked.value === 'fotos') {
    if (fotosInput.files.length < minFotos) {
      errores.push(`Fotos (mínimo ${minFotos})`);
    }
  }

  // Validar referencias máximo 3 (solo si eligió "Tengo una idea")
  const tieneIdeasVal = document.querySelector('input[name="tieneIdeas"]:checked')?.value;
  const refsInput = document.getElementById('referenciaVisual');
  if (tieneIdeasVal === 'tengoIdea' && refsInput.files.length > 3) {
    errores.push('Referencias visuales (máximo 3 imágenes)');
  }

  // Validar que el folio esté listo y tenga formato correcto
  const folioVal = document.getElementById('numeroFolio')?.value || '';
  if (!folioVal || folioVal === 'Cargando...' || !/^FEST-\d+$/.test(folioVal)) {
    errores.push('El folio no está listo, espera un momento y recarga la página');
  }

  // Validar tipos de archivo en fotos
  Array.from(document.getElementById('fotos').files || []).forEach(f => {
    if (!TIPOS_VALIDOS.includes(f.type)) errores.push(`Archivo "${f.name}" no es una imagen válida (usa JPG, PNG o WEBP)`);
  });

  return errores;
}

// ==================== RECOPILAR DATOS ====================

function recopilarDatos(paqueteKey) {
  const val = id => (document.getElementById(id)?.value || '').trim();

  const datos = {
    folio:                  val('numeroFolio'),
    fechaSolicitud:         val('fechaSolicitud'),
    paquete:                PAQUETES[paqueteKey].nombre,
    nombreCompleto:         val('nombreCompleto'),
    whatsapp:               val('whatsapp'),
    correo:                 val('correo'),
    tipoEvento:             val('tipoEvento'),
    fechaEvento:            val('fechaEvento'),
    horaEvento:             val('horaEvento'),
    nombresFestejados:      val('nombresFestejados'),
    lugarCeremonia:         document.getElementById('hayCeremonia')?.checked ? val('lugarCeremonia')     : '',
    ubicacionCeremonia:     document.getElementById('hayCeremonia')?.checked ? val('ubicacionCeremonia') : '',
    lugarRecepcion:         document.getElementById('hayRecepcion')?.checked  ? val('lugarRecepcion')     : '',
    ubicacionRecepcion:     document.getElementById('hayRecepcion')?.checked  ? val('ubicacionRecepcion') : '',
    whatsappConfirmaciones: document.querySelector('input[name="tipoConfirmacion"]:checked')?.value === 'wsp'
                            ? val('whatsappConfirmaciones') : '',
    correoConfirmaciones:   document.querySelector('input[name="tipoConfirmacion"]:checked')?.value === 'correo'
                            ? val('correoConfirmaciones') : '',
    paletaColores:          val('paletaColores'),
    tipoDiseno:             (document.querySelector('input[name="tipoDiseno"]:checked')?.value || ''),
    estiloInvitacion:       val('estiloInvitacion'),
    ideasExtra:             document.querySelector('input[name="tieneIdeas"]:checked')?.value === 'tengoIdea' ? val('ideasExtra') : '',
    nombreEnlace:           val('nombreEnlace'),
    mensajeEspecial:        document.querySelector('input[name="tipoMensaje"]:checked')?.value === 'propio'
                            ? val('mensajeEspecial') : '',
    token:                  FESTALI_TOKEN,
  };

  const extras = PAQUETES[paqueteKey].extras;

  if (extras.includes('smart')) {
    datos.dressCode       = val('dressCode');
    datos.datosAsistencia = val('datosAsistencia');
    datos.soloAdultos     = document.getElementById('soloAdultos')?.checked ? 'Sí' : 'No';
    datos.tipoRegalos     = (document.querySelector('input[name="tipoRegalos"]:checked')?.value || '');
    datos.mesaRegalosLink = val('mesaRegalosLink');
    datos.bancoCuenta     = val('bancoCuenta');
    datos.titularCuenta   = val('titularCuenta');
    datos.clabeCuenta     = val('clabeCuenta');
  }

  if (extras.includes('premium')) {
    datos.musica        = val('musica');
    datos.agendaEvento  = document.querySelector('input[name="tipoAgenda"]:checked')?.value === 'texto'
                          ? val('agendaEvento') : '';
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

async function enviar(datos, archivos, referencias, agendaImg, dressCodeImgs) {
  // Convertir archivos a base64
  const fotosBase64      = await Promise.all(Array.from(archivos).map(archivoABase64));
  const refsBase64       = await Promise.all(Array.from(referencias    || []).map(archivoABase64));
  const agendaBase64     = await Promise.all(Array.from(agendaImg      || []).map(archivoABase64));
  const dressCodeBase64  = await Promise.all(Array.from(dressCodeImgs  || []).map(archivoABase64));
  const payload = Object.assign({}, datos, {
    fotos: fotosBase64,
    referencias: refsBase64,
    agendaImagenes: agendaBase64,
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

function mostrarConfirmacion(folio, initPoint) {
  // Ocultar formulario y banner
  const wrapper = document.getElementById('formWrapper');
  const banner  = document.getElementById('paqueteBanner');
  if (wrapper) wrapper.style.display = 'none';
  if (banner)  banner.style.display  = 'none';

  // Mostrar pantalla de éxito
  const confirmacion = document.getElementById('confirmacion');
  document.getElementById('folioConfirmacion').textContent = folio;

  // Botón de pago MP — usar link dinámico si está disponible, si no usar el link estático
  const linksPago = {
    essence: 'https://mpago.la/2keQv3Z',
    smart:   'https://mpago.la/2TiAHyW',
    premium: 'https://mpago.la/2TLTp3t',
  };
  const params  = new URLSearchParams(window.location.search);
  const paquete = (params.get('paquete') || '').toLowerCase();
  const btnMP   = document.getElementById('btnPagoMP');
  if (btnMP) {
    btnMP.href = initPoint || linksPago[paquete] || linksPago.essence;
  }

  // Actualizar folio en la nota de pago
  const folioNota = document.getElementById('folioNotaPago');
  if (folioNota) folioNota.textContent = folio;

  confirmacion.classList.add('active');

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
  const todosLosPasos = [
    { id: 'step-1', titulo: 'Tus datos de contacto',   paquetes: ['essence','smart','premium'] },
    { id: 'step-2', titulo: 'Sobre el evento',          paquetes: ['essence','smart','premium'] },
    { id: 'step-3', titulo: 'Ubicaciones',              paquetes: ['essence','smart','premium'] },
    { id: 'step-4', titulo: 'Detalles del diseño',      paquetes: ['essence','smart','premium'] },
    { id: 'step-5', titulo: 'Fotos e ideas',            paquetes: ['essence','smart','premium'] },
    { id: 'step-6', titulo: 'Mensaje especial',         paquetes: ['essence','smart','premium'] },
    { id: 'step-7', titulo: 'Detalles adicionales',     paquetes: ['smart','premium'] },
    { id: 'step-8', titulo: 'Música y agenda',          paquetes: ['premium'] },
  ];

  const pasos = todosLosPasos.filter(p => p.paquetes.includes(paqueteKey));
  let actual  = 0;

  function irA(n) {
    document.querySelectorAll('.form-step').forEach(s => s.style.display = 'none');
    actual = n;
    document.getElementById(pasos[n].id).style.display = 'block';
    document.getElementById('wizardStepTitle').textContent = pasos[n].titulo;
    actualizarProgreso();
    const btnAnt = document.getElementById('btnAnterior');
    const btnSig = document.getElementById('btnSiguiente');
    const btnEnv = document.getElementById('btnEnviar');
    btnAnt.style.display = n === 0 ? 'none' : '';
    btnSig.style.display = n < pasos.length - 1 ? '' : 'none';
    btnEnv.style.display = n === pasos.length - 1 ? '' : 'none';
    document.getElementById('formWrapper').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function actualizarProgreso() {
    document.getElementById('wizardProgress').innerHTML = pasos.map((p, i) =>
      `<div class="wizard-dot ${i < actual ? 'done' : i === actual ? 'active' : ''}"></div>`
    ).join('');
  }

  function validarPasoActual() {
    const stepId = pasos[actual].id;
    const errores = [];
    const marcar  = id => { document.getElementById(id)?.classList.add('error'); };

    if (stepId === 'step-1') {
      ['nombreCompleto','whatsapp','correo'].forEach(id => {
        const el = document.getElementById(id);
        if (!el?.value.trim()) { errores.push(id === 'nombreCompleto' ? 'Nombre completo' : id === 'whatsapp' ? 'WhatsApp' : 'Correo'); marcar(id); }
      });
      const correoEl = document.getElementById('correo');
      if (correoEl?.value.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correoEl.value.trim())) {
        errores.push('Correo (formato inválido)'); marcar('correo');
      }
      const wspVal = (document.getElementById('whatsapp')?.value || '').replace(/\s/g,'');
      if (wspVal && !/^\+?\d{7,15}$/.test(wspVal)) {
        errores.push('WhatsApp (formato inválido, ej: +52 686 000 0000)'); marcar('whatsapp');
      }
    }

    if (stepId === 'step-2') {
      ['tipoEvento','fechaEvento','horaEvento','nombresFestejados'].forEach(id => {
        const el = document.getElementById(id);
        if (!el?.value.trim()) { errores.push(el?.labels?.[0]?.textContent?.replace('*','').trim() || id); marcar(id); }
      });
      const fechaEl = document.getElementById('fechaEvento');
      if (fechaEl?.value) {
        const hoy = new Date(); hoy.setHours(0,0,0,0);
        if (new Date(fechaEl.value + 'T00:00:00') < hoy) {
          errores.push('Fecha del evento (no puede ser una fecha pasada)'); marcar('fechaEvento');
        }
      }
    }

    if (stepId === 'step-3') {
      if (document.getElementById('hayCeremonia')?.checked) {
        const el = document.getElementById('lugarCeremonia');
        if (!el?.value.trim()) { errores.push('Lugar de la ceremonia'); marcar('lugarCeremonia'); }
      }
      if (document.getElementById('hayRecepcion')?.checked) {
        const el = document.getElementById('lugarRecepcion');
        if (!el?.value.trim()) { errores.push('Lugar de la recepción'); marcar('lugarRecepcion'); }
      }
    }

    if (stepId === 'step-4') {
      ['paletaColores','estiloInvitacion'].forEach(id => {
        const el = document.getElementById(id);
        if (!el?.value.trim()) { errores.push(id === 'paletaColores' ? 'Paleta de colores' : 'Estilo de invitación'); marcar(id); }
      });
      if (!document.querySelector('input[name="tipoDiseno"]:checked')) {
        errores.push('Tipo de diseño (Mis fotos / Diseño gráfico)');
      }
    }

    if (stepId === 'step-5') {
      const tipoDis = document.querySelector('input[name="tipoDiseno"]:checked');
      const minFotos = PAQUETES[paqueteKey].minFotos;
      if (!tipoDis || tipoDis.value === 'fotos') {
        if (document.getElementById('fotos').files.length < minFotos) {
          errores.push(`Fotos (mínimo ${minFotos})`);
        }
      }
      const tieneIdeas = document.querySelector('input[name="tieneIdeas"]:checked')?.value;
      if (tieneIdeas === 'tengoIdea' && document.getElementById('referenciaVisual').files.length > 3) {
        errores.push('Referencias visuales (máximo 3 imágenes)');
      }
      Array.from(document.getElementById('fotos').files || []).forEach(f => {
        if (!TIPOS_VALIDOS.includes(f.type)) errores.push(`Archivo "${f.name}" no es una imagen válida`);
      });
    }

    if (stepId === 'step-7') {
      const tipoConf = document.querySelector('input[name="tipoConfirmacion"]:checked')?.value;
      if (!tipoConf) {
        errores.push('Método de confirmación de asistencia');
      } else if (tipoConf === 'wsp') {
        const el = document.getElementById('whatsappConfirmaciones');
        if (!el?.value.trim()) { errores.push('WhatsApp para confirmaciones'); marcar('whatsappConfirmaciones'); }
      } else if (tipoConf === 'correo') {
        const el = document.getElementById('correoConfirmaciones');
        if (!el?.value.trim()) { errores.push('Correo para confirmaciones'); marcar('correoConfirmaciones'); }
      }
    }

    return errores;
  }

  document.getElementById('btnSiguiente').addEventListener('click', () => {
    document.querySelectorAll('.form-control.error').forEach(el => el.classList.remove('error'));
    const errores = validarPasoActual();
    if (errores.length > 0) { mostrarErrores(errores); return; }
    if (actual < pasos.length - 1) irA(actual + 1);
  });

  document.getElementById('btnAnterior').addEventListener('click', () => {
    if (actual > 0) irA(actual - 1);
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
      const datos       = recopilarDatos(paqueteKey);
      const archivos    = document.getElementById('fotos').files;
      const usaIdeas      = document.querySelector('input[name="tieneIdeas"]:checked')?.value === 'tengoIdea';
      const referencias   = usaIdeas ? document.getElementById('referenciaVisual').files : [];
      const usaImgAgenda    = document.querySelector('input[name="tipoAgenda"]:checked')?.value === 'imagen';
      const agendaImg       = usaImgAgenda ? document.getElementById('agendaImagenFile').files : [];
      const usaDressCodeImg = document.getElementById('cbDressCodeImg')?.checked;
      const dressCodeImgs   = usaDressCodeImg ? document.getElementById('dressCodeImgFile').files : [];
      const folio       = datos.folio;

      console.log('🚀 Llamando a enviar()...');
      const resultado = await enviar(datos, archivos, referencias, agendaImg, dressCodeImgs);

      detenerMensajesSpinner();
      spinner.classList.remove('active');
      mostrarConfirmacion(folio, resultado?.initPoint);

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
