// v2.1 - botón MP confirmación
// ============================================================
// FESTALI — formulario.js
// Lógica del formulario de contratación
// ============================================================

// Dejar vacío hasta configurar Google Apps Script.
// En modo vacío, los datos se imprimen en consola y se simula éxito.
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwf7buy9TOVQEwv_25c700ba4BDpA2Yoiv_DVwqaGSpyU9W9fK6nUZElJ0CmsySUVd7/exec';

// ==================== CONFIGURACIÓN DE PAQUETES ====================

const PAQUETES = {
  essence: {
    nombre: '🌿 Digital Essence',
    minFotos: 3,
    extras: []
  },
  smart: {
    nombre: '💡 Smart Interactive',
    minFotos: 3,
    extras: ['smart']
  },
  premium: {
    nombre: '💎 Premium Experience',
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
}

// ==================== FOLIO ====================

function getFolioSiguiente() {
  const actual = parseInt(localStorage.getItem('festali_folio_counter') || '0');
  return 'FEST-' + String(actual + 1).padStart(3, '0');
}

function confirmarFolio() {
  const actual = parseInt(localStorage.getItem('festali_folio_counter') || '0');
  localStorage.setItem('festali_folio_counter', String(actual + 1));
}

function setFolio() {
  document.getElementById('numeroFolio').value = getFolioSiguiente();
}

// ==================== CONFIGURAR PAQUETE ====================

function configurarPaquete(paqueteKey) {
  const config = PAQUETES[paqueteKey];

  // Mostrar nombre del paquete en la banda
  document.getElementById('paqueteNombre').textContent = config.nombre;

  // Mostrar campos adicionales según paquete
  if (config.extras.includes('smart')) {
    document.getElementById('camposSmart').style.display = 'block';
  }
  if (config.extras.includes('premium')) {
    document.getElementById('camposPremium').style.display = 'block';
  }
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

function initFileInput(paqueteKey) {
  const config = PAQUETES[paqueteKey];
  const input = document.getElementById('fotos');
  const hint = document.getElementById('fotosHint');
  const seleccionadas = document.getElementById('fotosSeleccionadas');

  hint.textContent = `Mínimo ${config.minFotos} foto${config.minFotos > 1 ? 's' : ''}`;

  input.addEventListener('change', () => {
    const n = input.files.length;
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
    input.addEventListener('change', () => {
      const n = input.files.length;
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
    agendaImgInput.addEventListener('change', () => {
      agendaImgHint.textContent = agendaImgInput.files.length
        ? agendaImgInput.files[0].name
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

  input.addEventListener('change', () => {
    const n = input.files.length;
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

  // Validar contacto para confirmaciones (obligatorio, uno de los dos)
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
  };

  const extras = PAQUETES[paqueteKey].extras;

  if (extras.includes('smart')) {
    datos.dressCode       = val('dressCode');
    datos.mensajeEspecial = document.querySelector('input[name="tipoMensaje"]:checked')?.value === 'propio'
                            ? val('mensajeEspecial') : '';
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
  console.log('datos a enviar:', JSON.stringify(datos));
  console.log('📤 FESTALI — fetch a:', SCRIPT_URL);
  console.log(`📎 Archivos: ${fotosBase64.length} foto(s), ${refsBase64.length} ref(s), ${agendaBase64.length} agenda, ${dressCodeBase64.length} dressCode`);

  try {
    await fetch(SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(payload)
    });
    console.log('✅ Fetch completado (no-cors — respuesta opaca, revisar GAS Ejecuciones para confirmar)');
  } catch (fetchErr) {
    console.error('❌ Fetch falló antes de llegar al servidor:', fetchErr);
    throw fetchErr;
  }

  return { ok: true };
}

// ==================== MOSTRAR CONFIRMACIÓN ====================

function mostrarConfirmacion(folio) {
  // Ocultar formulario y banner
  const wrapper = document.getElementById('formWrapper');
  const banner  = document.getElementById('paqueteBanner');
  if (wrapper) wrapper.style.display = 'none';
  if (banner)  banner.style.display  = 'none';

  // Mostrar pantalla de éxito
  const confirmacion = document.getElementById('confirmacion');
  document.getElementById('folioConfirmacion').textContent = folio;

  // Botón de pago MP según paquete
  const linksPago = {
    essence: 'https://mpago.la/2keQv3Z',
    smart:   'https://mpago.la/2TiAHyW',
    premium: 'https://mpago.la/2TLTp3t',
  };
  const params  = new URLSearchParams(window.location.search);
  const paquete = (params.get('paquete') || '').toLowerCase();
  const btnMP   = document.getElementById('btnPagoMP');
  if (btnMP) btnMP.href = linksPago[paquete] || linksPago.essence;

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
      await enviar(datos, archivos, referencias, agendaImg, dressCodeImgs);

      // Confirmar folio solo después de envío exitoso
      confirmarFolio();

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
