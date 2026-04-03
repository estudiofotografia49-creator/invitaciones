// ============================================================
// FESTALI — codigo.gs
// Google Apps Script — Receptor de formularios
//
// INSTRUCCIONES DE DESPLIEGUE:
//  1. Abre script.google.com y crea un proyecto nuevo
//  2. Pega todo este código (reemplaza el contenido)
//  3. Menú → Implementar → Nueva implementación
//     · Tipo: Aplicación web
//     · Ejecutar como: Yo
//     · Quién tiene acceso: Cualquier persona
//  4. Copia la URL de implementación
//  5. Pégala en formulario.js → const SCRIPT_URL = 'TU_URL_AQUÍ'
// ============================================================

// SPREADSHEET_ID se lee desde Propiedades del script (Apps Script → Configuración → Propiedades).
// Para configurar: PropertiesService.getScriptProperties().setProperty('SPREADSHEET_ID', 'TU_ID')
// El fallback permite seguir funcionando en instancias ya desplegadas.
const SPREADSHEET_ID = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
const CARPETA_RAIZ   = 'Festali Clientes';
const NOMBRE_HOJA    = 'Solicitudes';

// Tipos MIME permitidos para archivos subidos
const MIME_PERMITIDOS = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif'];

const ENCABEZADOS = [
  'Folio',                        // 1
  'Fecha Solicitud',              // 2
  'Paquete',                      // 3
  'Estado',                       // 4
  'Nombre',                       // 5
  'WhatsApp',                     // 6
  'Correo',                       // 7
  'Tipo Evento',                  // 8
  'Fecha Evento',                 // 9
  'Festejados',                   // 10
  '¿Hay Ceremonia?',              // 11
  'Lugar Ceremonia',              // 12
  'Hora Ceremonia',               // 13
  'Enlace Ubicación Ceremonia',   // 14
  '¿Hay Recepción?',              // 15
  'Lugar Recepción',              // 16
  'Hora Recepción',               // 17
  'Enlace Ubicación Recepción',   // 18
  'Medio Confirmaciones',         // 19
  'Contacto Confirmaciones',      // 20
  'Estilo Invitación',            // 21
  'Descripción Estilo',           // 22
  'Imagen Ref. Estilo',           // 23
  'Tipo Diseño',                  // 24
  'Fotos (cantidad)',             // 25
  'Carpeta Fotos',                // 26
  'Dress Code',                   // 27
  'Ejemplos Vestimenta',          // 28
  'Mensaje Especial',             // 29
  '¿Festali escribe el mensaje?', // 30
  'Datos Asistencia',             // 31
  'Solo Adultos',                 // 32
  'Mesa de Regalos',              // 33
  'Música',                       // 34
  'Hospedaje',                    // 35
  'Referencias Estilo',           // 36
  'Idioma',                       // 37
  'Timestamp Servidor'            // 38
];

// ============================================================
// PUNTO DE ENTRADA — POST
// ============================================================

// Rate limiting — máximo 15 envíos por minuto globalmente
function checkRateLimit() {
  const cache = CacheService.getScriptCache();
  const key   = 'rl_' + Math.floor(Date.now() / 60000);
  const n     = parseInt(cache.get(key) || '0');
  if (n >= 15) return false;
  cache.put(key, String(n + 1), 90);
  return true;
}

function doPost(e) {
  try {
    if (!SPREADSHEET_ID) return respuestaError('SPREADSHEET_ID no configurado');

    const datos = JSON.parse(e.postData.contents);

    // ── Webhook de MercadoPago ──
    if (datos.type === 'payment' && datos.data && datos.data.id) {
      return procesarWebhookMP(datos);
    }

    // ── Rate limiting ──
    if (!checkRateLimit()) return respuestaError('Demasiadas solicitudes, intenta en un momento');

    // ── Verificar token de acceso ──
    const tokenEsperado = PropertiesService.getScriptProperties().getProperty('FESTALI_TOKEN');
    if (tokenEsperado && datos.token !== tokenEsperado) {
      return respuestaError('No autorizado');
    }

    // ── Formulario de solicitud ──
    const errValidacion = validarPayload(datos);
    if (errValidacion) {
      Logger.log('FESTALI doPost — payload rechazado: ' + errValidacion);
      return respuestaError('Solicitud inválida: ' + errValidacion);
    }

    const folio  = datos.folio || 'FEST-???';
    const nombre = datos.nombresFestejados || datos.nombreCompleto || 'Sin nombre';

    // 1. Carpeta raíz (crear si no existe)
    const carpetaRaiz = obtenerOCrearCarpeta(CARPETA_RAIZ, null);

    // 2. Subcarpeta por solicitud — FOLIO — Nombre del evento
    const nombreSub  = folio + ' — ' + nombre;
    const subcarpeta = obtenerOCrearCarpeta(nombreSub, carpetaRaiz);

    // 3. Guardar imágenes en subcarpetas por tipo (solo se crean si hay archivos)
    const linksFotos     = guardarFotosEnSub(datos.fotos             || [], subcarpeta, 'Fotos del evento');
    const linksRefs      = guardarFotosEnSub(datos.referencias       || [], subcarpeta, 'Referencia Estilo');
    const linksDressCode = guardarFotosEnSub(datos.dressCodeImagenes || [], subcarpeta, 'Ejemplos vestimenta');

    // 4. Guardar fila en Sheets con estado "Pendiente de Pago"
    const ss   = SpreadsheetApp.openById(SPREADSHEET_ID);
    const hoja = prepararHoja(ss);
    escribirFila(hoja, datos, linksFotos, subcarpeta.getUrl(), linksRefs, linksDressCode);

    // 5. Crear preferencia de pago en MercadoPago
    const initPoint = crearPreferenciaMercadoPago(folio, datos.paquete);

    // 6. Enviar email de confirmación al cliente
    enviarCorreoConfirmacion(datos, initPoint);

    return respuestaOk({ folio: folio, carpeta: subcarpeta.getUrl(), initPoint: initPoint });

  } catch (err) {
    Logger.log('Error FESTALI doPost: ' + err.message + '\n' + err.stack);
    try {
      const adminEmail = PropertiesService.getScriptProperties().getProperty('ADMIN_EMAIL');
      if (adminEmail) {
        MailApp.sendEmail(adminEmail, '⚠️ Error en FESTALI — doPost', err.message + '\n\n' + err.stack);
      }
    } catch (_) {}
    return respuestaError(err.message);
  }
}

// ============================================================
// GET — prueba de conectividad
// ============================================================

function doGet(e) {
  if (e && e.parameter && e.parameter.action === 'folio') {
    const lock = LockService.getScriptLock();
    try {
      lock.waitLock(10000);
      const props   = PropertiesService.getScriptProperties();
      let counter   = parseInt(props.getProperty('FOLIO_COUNTER') || '0') + 1;
      // Si el contador es menor al número de filas reales, sincronizar
      const ss      = SpreadsheetApp.openById(SPREADSHEET_ID);
      const hoja    = prepararHoja(ss);
      const filas   = Math.max(hoja.getLastRow() - 1, 0); // -1 encabezado
      if (counter <= filas) counter = filas + 1;
      props.setProperty('FOLIO_COUNTER', String(counter));
      const folio   = 'FEST-' + String(counter).padStart(3, '0');
      return ContentService
        .createTextOutput(JSON.stringify({ ok: true, folio: folio }))
        .setMimeType(ContentService.MimeType.JSON);
    } finally {
      lock.releaseLock();
    }
  }

  return ContentService
    .createTextOutput(JSON.stringify({ status: 'FESTALI API activa ✓' }))
    .setMimeType(ContentService.MimeType.JSON);
}

// ============================================================
// SEGURIDAD — validación y sanitización
// ============================================================

// Valida que el payload tenga los campos mínimos requeridos.
// Retorna string con el error, o null si es válido.
function validarPayload(d) {
  if (!d || typeof d !== 'object') return 'Payload no es un objeto JSON';

  const requeridos = ['folio', 'nombreCompleto', 'whatsapp', 'correo', 'tipoEvento', 'fechaEvento', 'paquete'];
  for (const campo of requeridos) {
    if (!d[campo] || String(d[campo]).trim() === '') return 'Campo requerido faltante: ' + campo;
  }

  // Formato de folio — debe ser FEST-NNN
  if (!/^FEST-\d{3,}$/.test(d.folio)) return 'Formato de folio inválido: ' + d.folio;

  // Formato básico de correo
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.correo)) return 'Correo con formato inválido';

  // Paquete debe ser uno de los tres permitidos
  const paquetesValidos = ['digital quick', 'motion impact', 'experience pro',
                           'quick', 'motion', 'pro'];
  const paqueteLower = (d.paquete || '').replace(/[^\w\s]/g, '').toLowerCase().trim();
  if (!paquetesValidos.some(p => paqueteLower.includes(p.split(' ')[0]))) {
    return 'Paquete no reconocido: ' + d.paquete;
  }

  // Límites de tamaño por campo de texto
  const limites = {
    nombreCompleto: 200, whatsapp: 50, correo: 254,
    nombresFestejados: 300, mensajeEspecial: 2000,
    datosAsistencia: 1000, hospedaje: 1000,
    descripcionEstilo: 1000, tipoEventoOtro: 200,
    musica: 300, dressCode: 300, lang: 5
  };
  for (const [campo, max] of Object.entries(limites)) {
    if (d[campo] && String(d[campo]).length > max) {
      return 'Campo "' + campo + '" excede ' + max + ' caracteres';
    }
  }

  return null;
}

// Previene formula injection en Google Sheets.
// Prefija con comilla simple los valores que Sheets podría interpretar como fórmulas.
function sanitizar(valor) {
  if (typeof valor !== 'string') return valor;
  return /^[=+\-@|`]/.test(valor.trim()) ? "'" + valor : valor;
}

// ============================================================
// DRIVE — carpetas
// ============================================================

function obtenerOCrearCarpeta(nombre, padre) {
  const buscador = padre
    ? padre.getFoldersByName(nombre)
    : DriveApp.getFoldersByName(nombre);

  if (buscador.hasNext()) return buscador.next();

  return padre
    ? padre.createFolder(nombre)
    : DriveApp.createFolder(nombre);
}

// ============================================================
// DRIVE — guardar imágenes (base64 → Drive)
// ============================================================

// Guarda archivos en una subcarpeta con nombre específico.
// La subcarpeta solo se crea si hay al menos un archivo que guardar.
function guardarFotosEnSub(fotos, carpetaPadre, nombreSub) {
  if (!fotos || fotos.length === 0) return [];

  const sub = obtenerOCrearCarpeta(nombreSub, carpetaPadre);
  return guardarFotos(fotos, sub);
}

function guardarFotos(fotos, carpeta) {
  const links = [];

  fotos.forEach(function(foto, i) {
    try {
      if (!MIME_PERMITIDOS.includes(foto.mimeType)) {
        Logger.log('Archivo rechazado — MIME no permitido: ' + foto.mimeType);
        links.push('Archivo rechazado');
        return;
      }
      const bytes = Utilities.base64Decode(foto.data);
      const blob  = Utilities.newBlob(bytes, foto.mimeType, foto.nombre || ('archivo_' + (i + 1)));
      const file  = carpeta.createFile(blob);
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      links.push(file.getUrl());
    } catch (err) {
      Logger.log('Error al guardar archivo ' + i + ': ' + err.message);
      links.push('Error al subir');
    }
  });

  return links;
}

// ============================================================
// SHEETS — preparar hoja
// ============================================================

function prepararHoja(ss) {
  // Si existe "Hoja 1" como única hoja, renombrarla a "Solicitudes"
  let hoja = ss.getSheetByName(NOMBRE_HOJA);

  if (!hoja) {
    const hojas = ss.getSheets();
    if (hojas.length === 1 && hojas[0].getName() === 'Hoja 1') {
      hoja = hojas[0];
      hoja.setName(NOMBRE_HOJA);
    } else {
      hoja = ss.insertSheet(NOMBRE_HOJA);
    }
  }

  if (hoja.getLastRow() === 0) {
    aplicarEncabezados(hoja);
  }

  return hoja;
}

function aplicarEncabezados(hoja) {
  const rango = hoja.getRange(1, 1, 1, ENCABEZADOS.length);
  rango.setValues([ENCABEZADOS]);

  // Estilo encabezados
  rango.setBackground('#4b4495')
       .setFontColor('#ffffff')
       .setFontWeight('bold')
       .setHorizontalAlignment('center');

  hoja.setFrozenRows(1);

  // Ancho de columnas clave
  hoja.setColumnWidth(1,  110);  // Folio
  hoja.setColumnWidth(2,  130);  // Fecha Solicitud
  hoja.setColumnWidth(3,  170);  // Paquete
  hoja.setColumnWidth(4,  100);  // Estado
  hoja.setColumnWidth(5,  180);  // Nombre
  hoja.setColumnWidth(6,  140);  // WhatsApp
  hoja.setColumnWidth(7,  190);  // Correo
  hoja.setColumnWidth(10, 180);  // Festejados
  hoja.setColumnWidth(14, 210);  // Enlace Ubicación Ceremonia
  hoja.setColumnWidth(18, 210);  // Enlace Ubicación Recepción
  hoja.setColumnWidth(20, 180);  // Contacto Confirmaciones
  hoja.setColumnWidth(21, 160);  // Paleta Colores
  hoja.setColumnWidth(25, 210);  // Carpeta Fotos
  hoja.setColumnWidth(28, 200);  // Mensaje Especial
  hoja.setColumnWidth(30, 200);  // Datos Asistencia
  hoja.setColumnWidth(32, 200);  // Mesa de Regalos
  hoja.setColumnWidth(34, 200);  // Agenda
  hoja.setColumnWidth(37, 160);  // Nombre Enlace
}

// ============================================================
// SHEETS — escribir fila
// ============================================================

function escribirFila(hoja, d, linksFotos, urlCarpeta, linksRefs, linksDressCode) {
  const ahora = new Date();

  // ── Derivar campos compuestos ──

  const hayCeremonia    = d.hayCeremonia || (d.lugarCeremonia ? 'Sí' : 'No');
  const hayRecepcion    = d.hayRecepcion || (d.lugarRecepcion ? 'Sí' : 'No');
  const enlaceCeremonia = d.enlaceCeremonia || d.ubicacionCeremonia || '';
  const enlaceRecepcion = d.enlaceRecepcion || d.ubicacionRecepcion || '';

  const medioConf = d.medioConfirmaciones ||
                    (d.whatsappConfirmaciones ? 'WhatsApp' :
                     d.correoConfirmaciones   ? 'Correo'   : '');
  const contactoConf = d.contactoConfirmaciones ||
                       d.whatsappConfirmaciones ||
                       d.correoConfirmaciones   || '';

  const paqueteKey    = (d.paquete || '').replace(/[^\w\s]/g, '').toLowerCase().trim();
  const tienesMensaje = paqueteKey.includes('quick') || paqueteKey.includes('pro');
  const mensajeFestali = d.mensajeFestali ||
                         (tienesMensaje && !d.mensajeEspecial ? 'Sí' : 'No');

  let mesaRegalos = d.tipoRegalos || '';
  if (d.tipoRegalos === 'mesa' && d.mesaRegalosLink) {
    mesaRegalos = 'Mesa de regalos: ' + d.mesaRegalosLink;
  } else if (d.tipoRegalos === 'transferencia') {
    const partes = [];
    if (d.bancoCuenta)   partes.push('Banco: '   + d.bancoCuenta);
    if (d.titularCuenta) partes.push('Titular: ' + d.titularCuenta);
    if (d.clabeCuenta)   partes.push('CLABE: '   + d.clabeCuenta);
    mesaRegalos = partes.length ? 'Transferencia — ' + partes.join(' | ') : 'Transferencia';
  } else if (d.tipoRegalos === 'ninguno' || !d.tipoRegalos) {
    mesaRegalos = 'Sin mesa de regalos';
  }

  const s = sanitizar;

  const fila = [
    s(d.folio                  || ''),  // 1  Folio
    s(d.fechaSolicitud         || ''),  // 2  Fecha Solicitud
    s(d.paquete                || ''),  // 3  Paquete
    'Pendiente de Pago',                // 4  Estado
    s(d.nombreCompleto         || ''),  // 5  Nombre
    s(d.whatsapp               || ''),  // 6  WhatsApp
    s(d.correo                 || ''),  // 7  Correo
    s(d.tipoEvento             || ''),  // 8  Tipo Evento
    s(d.fechaEvento            || ''),  // 9  Fecha Evento
    s(d.nombresFestejados      || ''),  // 10 Festejados
    hayCeremonia,                       // 11 ¿Hay Ceremonia?
    s(d.lugarCeremonia         || ''),  // 12 Lugar Ceremonia
    s(d.horaCeremonia          || ''),  // 13 Hora Ceremonia
    s(enlaceCeremonia),                 // 14 Enlace Ubicación Ceremonia
    hayRecepcion,                       // 15 ¿Hay Recepción?
    s(d.lugarRecepcion         || ''),  // 16 Lugar Recepción
    s(d.horaRecepcion          || ''),  // 17 Hora Recepción
    s(enlaceRecepcion),                 // 18 Enlace Ubicación Recepción
    medioConf,                          // 19 Medio Confirmaciones
    s(contactoConf),                    // 20 Contacto Confirmaciones
    s(d.estiloInvitacion       || ''),  // 21 Estilo Invitación
    s(d.descripcionEstilo      || ''),  // 22 Descripción Estilo
    (linksRefs || []).length,           // 23 Imagen Ref. Estilo — número
    s(d.tipoDiseno             || ''),  // 24 Tipo Diseño
    linksFotos.length,                  // 25 Fotos (cantidad)
    urlCarpeta               || '',     // 26 Carpeta Fotos
    s(d.dressCode              || ''),  // 27 Dress Code
    (linksDressCode || []).length,      // 28 Ejemplos Vestimenta
    s(d.mensajeEspecial        || ''),  // 29 Mensaje Especial
    mensajeFestali,                     // 30 ¿Festali escribe el mensaje?
    s(d.datosAsistencia        || ''),  // 31 Datos Asistencia
    s(d.soloAdultos            || ''),  // 32 Solo Adultos
    s(mesaRegalos),                     // 33 Mesa de Regalos
    s(d.musica                 || ''),  // 34 Música
    s(d.hospedaje              || ''),  // 35 Hospedaje
    (linksRefs || []).length,           // 36 Referencias Estilo
    s(d.lang                   || 'es'),// 37 Idioma (es/en)
    Utilities.formatDate(ahora, Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm:ss')  // 38
  ];

  hoja.appendRow(fila);

  // ── Colorear fila según paquete ──
  const ultimaFila = hoja.getLastRow();
  const rangoFila  = hoja.getRange(ultimaFila, 1, 1, ENCABEZADOS.length);

  const colores = {
    essence: '#f0fdf4',
    smart:   '#fdf4ff',
    premium: '#fffbeb'
  };

  let color = '#ffffff';
  if (paqueteKey.includes('essence')) color = colores.essence;
  if (paqueteKey.includes('smart'))   color = colores.smart;
  if (paqueteKey.includes('premium')) color = colores.premium;

  rangoFila.setBackground(color);

  // Columna "Estado" → negrita
  hoja.getRange(ultimaFila, 4).setFontWeight('bold');

  // Columna "Folio" → negrita morada
  hoja.getRange(ultimaFila, 1)
      .setFontWeight('bold')
      .setFontColor('#4b4495');
}

// ============================================================
// HELPERS — respuestas JSON
// ============================================================

function respuestaOk(payload) {
  const body = Object.assign({ ok: true }, payload);
  return ContentService
    .createTextOutput(JSON.stringify(body))
    .setMimeType(ContentService.MimeType.JSON);
}

function respuestaError(mensaje) {
  return ContentService
    .createTextOutput(JSON.stringify({ ok: false, error: mensaje }))
    .setMimeType(ContentService.MimeType.JSON);
}

// ============================================================
// MERCADOPAGO — crear preferencia de pago
// ============================================================

// Requiere en Script Properties:
//   MP_ACCESS_TOKEN  → tu Access Token de MercadoPago (producción o sandbox)
//   MP_URL_EXITO     → URL a la que MP redirige después de pago exitoso
//   MP_URL_FALLA     → URL a la que MP redirige si el pago falla
//   MP_URL_PENDIENTE → URL a la que MP redirige si el pago queda pendiente
//
// Precios configurados: Essence $850 | Smart $1,450 | Premium $2,100 MXN
function crearPreferenciaMercadoPago(folio, paquete) {
  const props       = PropertiesService.getScriptProperties();
  const accessToken = props.getProperty('MP_ACCESS_TOKEN');

  if (!accessToken) {
    Logger.log('⚠️ MP_ACCESS_TOKEN no configurado — se omite creación de preferencia');
    return null;
  }

  const precios = { quick: 650, motion: 950, pro: 2100 };
  const paqueteLower = (paquete || '').replace(/[^\w\s]/g, '').toLowerCase().trim();
  let precio    = precios.quick;
  let nombrePaq = 'Digital Quick';
  if (paqueteLower.includes('motion')) { precio = precios.motion; nombrePaq = 'Motion Impact';    }
  if (paqueteLower.includes('pro'))    { precio = precios.pro;    nombrePaq = 'Experience Pro';   }

  const scriptUrl   = ScriptApp.getService().getUrl();
  const urlExito    = props.getProperty('MP_URL_EXITO')     || scriptUrl;
  const urlFalla    = props.getProperty('MP_URL_FALLA')     || scriptUrl;
  const urlPendiente= props.getProperty('MP_URL_PENDIENTE') || scriptUrl;

  const preferencia = {
    items: [{
      title:      'Invitación FESTALI — ' + nombrePaq,
      quantity:   1,
      unit_price: precio,
      currency_id: 'MXN'
    }],
    external_reference: folio,
    notification_url:   scriptUrl,
    back_urls: {
      success: urlExito,
      failure: urlFalla,
      pending: urlPendiente
    },
    auto_return: 'approved'
  };

  try {
    const response = UrlFetchApp.fetch('https://api.mercadopago.com/checkout/preferences', {
      method:      'post',
      contentType: 'application/json',
      headers:     { 'Authorization': 'Bearer ' + accessToken },
      payload:     JSON.stringify(preferencia),
      muteHttpExceptions: true
    });
    const code = response.getResponseCode();
    const body = response.getContentText();
    PropertiesService.getScriptProperties().setProperty('MP_LAST_CODE', String(code));
    PropertiesService.getScriptProperties().setProperty('MP_LAST_BODY', body.substring(0, 500));
    Logger.log('MP status: ' + code + ' | body: ' + body.substring(0, 200));
    const resultado = JSON.parse(body);
    return resultado.init_point || null;

  } catch (err) {
    PropertiesService.getScriptProperties().setProperty('MP_LAST_ERROR', err.message);
    Logger.log('Error MP: ' + err.message);
    return null;
  }
}

// ============================================================
// MERCADOPAGO — procesar webhook de pago
// ============================================================

function procesarWebhookMP(datos) {
  const accessToken = PropertiesService.getScriptProperties().getProperty('MP_ACCESS_TOKEN');
  if (!accessToken) return respuestaError('MP_ACCESS_TOKEN no configurado');

  try {
    const pagoId   = datos.data.id;
    const response = UrlFetchApp.fetch('https://api.mercadopago.com/v1/payments/' + pagoId, {
      headers: { 'Authorization': 'Bearer ' + accessToken }
    });

    const pago   = JSON.parse(response.getContentText());
    const folio  = pago.external_reference;
    const status = pago.status;

    Logger.log('Webhook MP — folio: ' + folio + ' | status: ' + status);

    if (!folio || !/^FEST-\d{3,}$/.test(folio)) {
      Logger.log('⚠️ Webhook MP con external_reference inválido — se ignora: ' + folio);
      return respuestaOk({ recibido: true });
    }

    if (status === 'approved') {
      actualizarEstadoPago(folio, 'Pagado ✓');
    } else if (status === 'pending' || status === 'in_process') {
      actualizarEstadoPago(folio, 'Pago en proceso');
    } else if (status === 'rejected') {
      actualizarEstadoPago(folio, 'Pago rechazado');
    }

    return respuestaOk({ recibido: true });

  } catch (err) {
    Logger.log('❌ Error procesando webhook MP: ' + err.message);
    return respuestaError(err.message);
  }
}

// ============================================================
// MERCADOPAGO — actualizar estado en Sheets
// ============================================================

function actualizarEstadoPago(folio, nuevoEstado) {
  const ss   = SpreadsheetApp.openById(SPREADSHEET_ID);
  const hoja = ss.getSheetByName(NOMBRE_HOJA);
  if (!hoja) { Logger.log('Hoja no encontrada: ' + NOMBRE_HOJA); return; }

  const datos = hoja.getDataRange().getValues();
  for (let i = 1; i < datos.length; i++) {
    if (datos[i][0] === folio) {
      hoja.getRange(i + 1, 4).setValue(nuevoEstado);
      Logger.log('Estado actualizado: ' + folio + ' → ' + nuevoEstado);

      // Notificar cuando el pago es aprobado
      if (nuevoEstado === 'Pagado ✓' || nuevoEstado === 'Pagado PayPal ✓') {
        try {
          const adminEmail  = PropertiesService.getScriptProperties().getProperty('ADMIN_EMAIL');
          const nombre      = datos[i][4];  // columna 5 — Nombre
          const paquete     = datos[i][2];  // columna 3 — Paquete
          const correoCliente = datos[i][6]; // columna 7 — Correo

          // Email al admin
          if (adminEmail) {
            MailApp.sendEmail(
              adminEmail,
              '✅ FESTALI — Pago confirmado: ' + folio,
              'El pedido ' + folio + ' ha sido pagado.\n\n' +
              'Cliente: ' + nombre + '\n' +
              'Paquete: ' + paquete + '\n' +
              'Método: ' + nuevoEstado + '\n\n' +
              'Ver Sheets: https://docs.google.com/spreadsheets/d/' + SPREADSHEET_ID
            );
          }

          // Email al cliente con idioma guardado en col 37
          if (correoCliente) {
            const langCliente = datos[i][36] === 'en' ? 'en' : 'es'; // col 37 = index 36
            enviarCorreoPagoConfirmado(folio, nombre, correoCliente, paquete, langCliente);
          }
        } catch (_) {}
      }
      return;
    }
  }
  Logger.log('⚠️ Folio no encontrado al actualizar estado: ' + folio);
}

// ============================================================
// TEST — verificar integración con MercadoPago
// ============================================================

function testMP() {
  const resultado = crearPreferenciaMercadoPago('FEST-TEST', 'essence');
  if (resultado) {
    Logger.log('✅ MercadoPago OK — init_point: ' + resultado);
  } else {
    Logger.log('❌ MercadoPago devolvió null — revisa los logs anteriores');
  }
}

function verErrorMP() {
  const error = PropertiesService.getScriptProperties().getProperty('ULTIMO_ERROR_MP');
  Logger.log('Último error MP: ' + error);
}

// ============================================================
// TEST — verificar conexión con Sheets
// ============================================================

function testConexion() {
  const ss   = SpreadsheetApp.openById(SPREADSHEET_ID);
  const hoja = prepararHoja(ss);
  Logger.log('✅ Conexión exitosa: ' + hoja.getName());
}

// Ejecutar UNA vez para actualizar los encabezados del Spreadsheet existente
function actualizarEncabezados() {
  const ss   = SpreadsheetApp.openById(SPREADSHEET_ID);
  const hoja = ss.getSheetByName(NOMBRE_HOJA);
  if (!hoja) { Logger.log('Hoja no encontrada'); return; }
  aplicarEncabezados(hoja);
  Logger.log('✅ Encabezados actualizados correctamente (' + ENCABEZADOS.length + ' columnas)');
}

function autorizarFetch() {
  const r = UrlFetchApp.fetch('https://www.google.com');
  Logger.log('OK: ' + r.getResponseCode());
}

// ============================================================
// EMAILS AL CLIENTE
// ============================================================

function enviarCorreoConfirmacion(datos, initPoint) {
  try {
    if (!datos.correo) return;

    const lang       = (datos.lang === 'en') ? 'en' : 'es';
    const isEN       = lang === 'en';

    const props      = PropertiesService.getScriptProperties();
    const tipoCambio = parseFloat(props.getProperty('TIPO_CAMBIO') || '20');
    const paypalBase = props.getProperty('PAYPAL_LINK') || 'https://paypal.me/estudio49';

    const paqueteLower = (datos.paquete || '').replace(/[^\w\s]/g, '').toLowerCase().trim();
    let precioMXN = 650;
    let nombrePaq = 'Digital Quick';
    if (paqueteLower.includes('motion')) { precioMXN = 950;  nombrePaq = 'Motion Impact';   }
    if (paqueteLower.includes('pro'))    { precioMXN = 2100; nombrePaq = 'Experience Pro';  }

    const precioUSD  = Math.round((precioMXN / tipoCambio) * 100) / 100;
    const paypalLink = paypalBase + '/' + precioUSD;
    const mpLink     = initPoint || _linkFallbackMP(paqueteLower);

    const nombre = datos.nombreCompleto || (isEN ? 'Customer' : 'Cliente');
    const folio  = datos.folio || '';

    const asunto = isEN
      ? 'FESTALI — We received your request ' + folio
      : 'FESTALI — Recibimos tu solicitud ' + folio;

    const lbl = isEN ? {
      slogan:    'Connecting your best moments',
      greeting:  'Hello, ' + nombre + '! 🎉',
      intro:     'We received your request. Review the summary below and complete your payment to start your design.',
      summary:   'Request Summary',
      package:   'Package', event: 'Event type', date: 'Event date', celebrated: 'Celebrated',
      price_how: 'How would you like to pay?',
      mp_sub:    'Mexico — Card, OXXO, SPEI',
      pp_sub:    'USA / International — $' + precioUSD + ' USD',
      mp_btn:    '💳 Pay with MercadoPago',
      pp_btn:    '💰 Pay with PayPal',
      note:      'Once your payment is confirmed, you\'ll receive an automatic notification. Your invitation will be ready in max. <strong>3 business days</strong>.',
      doubt:     'Have questions or want to make a change?'
    } : {
      slogan:    'Conectando tus mejores momentos',
      greeting:  '¡Hola, ' + nombre + '! 🎉',
      intro:     'Recibimos tu solicitud correctamente. Revisa el resumen y realiza tu pago para comenzar con tu diseño.',
      summary:   'Resumen de tu solicitud',
      package:   'Paquete', event: 'Tipo de evento', date: 'Fecha del evento', celebrated: 'Festejados',
      price_how: '¿Cómo deseas pagar?',
      mp_sub:    'México — Tarjeta, OXXO, SPEI',
      pp_sub:    'USA / Internacional — $' + precioUSD + ' USD',
      mp_btn:    '💳 Pagar con MercadoPago',
      pp_btn:    '💰 Pagar con PayPal',
      note:      'Al completar tu pago recibirás una confirmación automática. Tu invitación estará lista en máximo <strong>3 días hábiles</strong>.',
      doubt:     '¿Tienes dudas o quieres hacer un cambio?'
    };
    const precioDisplay = isEN
      ? '$' + precioUSD + ' <span style="font-size:.9rem;color:#e72268;">USD</span>'
      : '$' + precioMXN.toLocaleString() + ' <span style="font-size:.9rem;color:#e72268;">MXN</span>';
    const precioSub = isEN ? '/ $' + precioMXN.toLocaleString() + ' MXN' : '/ $' + precioUSD + ' USD';

    const htmlBody =
      '<!DOCTYPE html><html><head><meta charset="UTF-8"></head>' +
      '<body style="font-family:Arial,sans-serif;background:#f8f6ff;margin:0;padding:20px;">' +
      '<div style="max-width:580px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 8px 32px rgba(75,68,149,.12);">' +
      '<div style="background:linear-gradient(135deg,#e72268,#4b4495);padding:32px;text-align:center;">' +
      '<h1 style="color:#fff;font-size:1.6rem;margin:0;font-weight:700;letter-spacing:2px;">FESTALI</h1>' +
      '<p style="color:rgba(255,255,255,.85);font-size:.85rem;margin:6px 0 0;font-style:italic;">' + lbl.slogan + '</p>' +
      '</div>' +
      '<div style="padding:32px;">' +
      '<h2 style="color:#4b4495;font-size:1.2rem;margin:0 0 10px;">' + lbl.greeting + '</h2>' +
      '<p style="color:#555;font-size:.93rem;line-height:1.6;margin:0 0 22px;">' + lbl.intro + '</p>' +
      '<div style="text-align:center;margin:0 0 22px;">' +
      '<span style="display:inline-block;background:linear-gradient(135deg,#e72268,#4b4495);color:#fff;font-size:1.1rem;font-weight:700;letter-spacing:4px;padding:10px 30px;border-radius:50px;">' + folio + '</span>' +
      '</div>' +
      '<div style="background:#f8f6ff;border-radius:12px;padding:18px;margin:0 0 24px;">' +
      '<p style="color:#4b4495;font-size:.75rem;text-transform:uppercase;letter-spacing:2px;margin:0 0 14px;font-weight:700;">' + lbl.summary + '</p>' +
      '<table style="width:100%;border-collapse:collapse;">' +
      '<tr><td style="color:#999;font-size:.82rem;padding:5px 0;">' + lbl.package + '</td><td style="color:#333;font-size:.82rem;font-weight:700;text-align:right;">' + nombrePaq + '</td></tr>' +
      '<tr style="border-top:1px solid #eee;"><td style="color:#999;font-size:.82rem;padding:5px 0;">' + lbl.event + '</td><td style="color:#333;font-size:.82rem;font-weight:700;text-align:right;">' + (datos.tipoEvento || '') + '</td></tr>' +
      '<tr style="border-top:1px solid #eee;"><td style="color:#999;font-size:.82rem;padding:5px 0;">' + lbl.date + '</td><td style="color:#333;font-size:.82rem;font-weight:700;text-align:right;">' + (datos.fechaEvento || '') + '</td></tr>' +
      '<tr style="border-top:1px solid #eee;"><td style="color:#999;font-size:.82rem;padding:5px 0;">' + lbl.celebrated + '</td><td style="color:#333;font-size:.82rem;font-weight:700;text-align:right;">' + (datos.nombresFestejados || '') + '</td></tr>' +
      '</table></div>' +
      '<div style="text-align:center;margin:0 0 22px;">' +
      '<p style="color:#4b4495;font-size:1.5rem;font-weight:700;margin:0;">' + precioDisplay + '</p>' +
      '<p style="color:#aaa;font-size:.78rem;margin:4px 0 0;">' + precioSub + '</p>' +
      '</div>' +
      '<p style="color:#333;font-size:.88rem;text-align:center;margin:0 0 14px;font-weight:600;">' + lbl.price_how + '</p>' +
      '<div style="text-align:center;margin:0 0 12px;">' +
      '<a href="' + mpLink + '" style="display:inline-block;background:#009ee3;color:#fff;text-decoration:none;padding:12px 26px;border-radius:50px;font-weight:700;font-size:.88rem;">' + lbl.mp_btn + '</a>' +
      '<p style="color:#bbb;font-size:.73rem;margin:5px 0 0;">' + lbl.mp_sub + '</p>' +
      '</div>' +
      '<div style="text-align:center;margin:0 0 24px;">' +
      '<a href="' + paypalLink + '" style="display:inline-block;background:#003087;color:#fff;text-decoration:none;padding:12px 26px;border-radius:50px;font-weight:700;font-size:.88rem;">' + lbl.pp_btn + '</a>' +
      '<p style="color:#bbb;font-size:.73rem;margin:5px 0 0;">' + lbl.pp_sub + '</p>' +
      '</div>' +
      '<div style="background:#fffbeb;border-left:3px solid #f59e0b;padding:12px 14px;border-radius:0 8px 8px 0;margin:0 0 24px;">' +
      '<p style="color:#92400e;font-size:.8rem;margin:0;line-height:1.55;">' + lbl.note + '</p>' +
      '</div>' +
      '<p style="color:#555;font-size:.86rem;text-align:center;margin:0 0 14px;">' + lbl.doubt + '</p>' +
      '<div style="text-align:center;">' +
      '<a href="https://wa.me/526862301280" style="display:inline-block;background:#25d366;color:#fff;text-decoration:none;padding:10px 20px;border-radius:50px;font-weight:700;font-size:.84rem;margin:4px;">💬 WhatsApp</a>' +
      '<a href="mailto:festaliconecta@gmail.com" style="display:inline-block;background:#4b4495;color:#fff;text-decoration:none;padding:10px 20px;border-radius:50px;font-weight:700;font-size:.84rem;margin:4px;">✉ festaliconecta@gmail.com</a>' +
      '</div></div>' +
      '<div style="background:#f8f6ff;padding:18px;text-align:center;border-top:1px solid #eee;">' +
      '<p style="color:#aaa;font-size:.72rem;margin:0;">© 2026 FESTALI · festaliconecta@gmail.com</p>' +
      '<p style="color:#ccc;font-size:.68rem;margin:4px 0 0;">Folio: ' + folio + '</p>' +
      '</div></div></body></html>';

    MailApp.sendEmail({
      to:       datos.correo,
      subject:  asunto,
      htmlBody: htmlBody
    });

    Logger.log('✅ Email confirmación enviado a ' + datos.correo + ' — ' + folio);
  } catch (err) {
    Logger.log('❌ Error enviando email confirmación: ' + err.message);
  }
}

function enviarCorreoPagoConfirmado(folio, nombre, correo, paquete, lang) {
  try {
    if (!correo) return;

    const isEN = (lang === 'en');
    const asunto = isEN
      ? 'FESTALI — Payment confirmed! ' + folio
      : 'FESTALI — ¡Pago confirmado! ' + folio;

    const lbl = isEN ? {
      slogan:    'Connecting your best moments',
      titulo:    'Payment confirmed, ' + nombre + '!',
      intro:     'We received your payment successfully. Our team is already working on your invitation.',
      paid:      'Payment received', paid_sub: 'Your request is confirmed — ' + paquete,
      design:    'In design',        design_sub: 'Your invitation is being created',
      delivery:  'Delivery in max. 3 business days', delivery_sub: "We'll be in touch soon",
      doubt:     'Have questions or want to make a change?'
    } : {
      slogan:    'Conectando tus mejores momentos',
      titulo:    '¡Pago confirmado, ' + nombre + '!',
      intro:     'Recibimos tu pago correctamente. Nuestro equipo ya está trabajando en tu invitación.',
      paid:      'Pago recibido',    paid_sub: 'Tu solicitud está confirmada — ' + paquete,
      design:    'En diseño',        design_sub: 'Tu invitación está siendo creada',
      delivery:  'Entrega en máx. 3 días hábiles', delivery_sub: 'Te contactaremos a la brevedad',
      doubt:     '¿Tienes dudas o quieres hacer algún cambio?'
    };

    const htmlBody =
      '<!DOCTYPE html><html><head><meta charset="UTF-8"></head>' +
      '<body style="font-family:Arial,sans-serif;background:#f8f6ff;margin:0;padding:20px;">' +
      '<div style="max-width:580px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 8px 32px rgba(75,68,149,.12);">' +
      '<div style="background:linear-gradient(135deg,#e72268,#4b4495);padding:32px;text-align:center;">' +
      '<h1 style="color:#fff;font-size:1.6rem;margin:0;font-weight:700;letter-spacing:2px;">FESTALI</h1>' +
      '<p style="color:rgba(255,255,255,.85);font-size:.85rem;margin:6px 0 0;font-style:italic;">' + lbl.slogan + '</p>' +
      '</div>' +
      '<div style="padding:32px;text-align:center;">' +
      '<div style="font-size:3.2rem;margin-bottom:14px;">✅</div>' +
      '<h2 style="color:#4b4495;font-size:1.25rem;margin:0 0 10px;">' + lbl.titulo + '</h2>' +
      '<p style="color:#555;font-size:.93rem;line-height:1.6;max-width:400px;margin:0 auto 22px;">' + lbl.intro + '</p>' +
      '<div style="text-align:center;margin:0 0 22px;">' +
      '<span style="display:inline-block;background:linear-gradient(135deg,#e72268,#4b4495);color:#fff;font-size:1.1rem;font-weight:700;letter-spacing:4px;padding:10px 30px;border-radius:50px;">' + folio + '</span>' +
      '</div>' +
      '<div style="background:#f8f6ff;border-radius:12px;padding:18px;margin:0 0 24px;text-align:left;">' +
      '<div style="display:flex;gap:10px;align-items:flex-start;padding:6px 0;">' +
      '<span style="font-size:1.1rem;">✅</span>' +
      '<div><p style="margin:0;font-weight:700;color:#333;font-size:.86rem;">' + lbl.paid + '</p><p style="margin:2px 0 0;color:#999;font-size:.76rem;">' + lbl.paid_sub + '</p></div></div>' +
      '<div style="display:flex;gap:10px;align-items:flex-start;padding:6px 0;border-top:1px solid #eee;">' +
      '<span style="font-size:1.1rem;">🎨</span>' +
      '<div><p style="margin:0;font-weight:700;color:#333;font-size:.86rem;">' + lbl.design + '</p><p style="margin:2px 0 0;color:#999;font-size:.76rem;">' + lbl.design_sub + '</p></div></div>' +
      '<div style="display:flex;gap:10px;align-items:flex-start;padding:6px 0;border-top:1px solid #eee;">' +
      '<span style="font-size:1.1rem;">🚀</span>' +
      '<div><p style="margin:0;font-weight:700;color:#333;font-size:.86rem;">' + lbl.delivery + '</p><p style="margin:2px 0 0;color:#999;font-size:.76rem;">' + lbl.delivery_sub + '</p></div></div>' +
      '</div>' +
      '<p style="color:#555;font-size:.86rem;margin:0 0 14px;">' + lbl.doubt + '</p>' +
      '<div>' +
      '<a href="https://wa.me/526862301280" style="display:inline-block;background:#25d366;color:#fff;text-decoration:none;padding:10px 20px;border-radius:50px;font-weight:700;font-size:.84rem;margin:4px;">💬 WhatsApp</a>' +
      '<a href="mailto:festaliconecta@gmail.com" style="display:inline-block;background:#4b4495;color:#fff;text-decoration:none;padding:10px 20px;border-radius:50px;font-weight:700;font-size:.84rem;margin:4px;">✉ festaliconecta@gmail.com</a>' +
      '</div></div>' +
      '<div style="background:#f8f6ff;padding:18px;text-align:center;border-top:1px solid #eee;">' +
      '<p style="color:#aaa;font-size:.72rem;margin:0;">© 2026 FESTALI · festaliconecta@gmail.com</p>' +
      '<p style="color:#ccc;font-size:.68rem;margin:4px 0 0;">Folio: ' + folio + '</p>' +
      '</div></div></body></html>';

    MailApp.sendEmail({
      to:       correo,
      subject:  asunto,
      htmlBody: htmlBody
    });

    Logger.log('✅ Email pago confirmado enviado a ' + correo + ' — ' + folio);
  } catch (err) {
    Logger.log('❌ Error enviando email pago confirmado: ' + err.message);
  }
}

function _linkFallbackMP(paqueteLower) {
  // TODO: actualizar estos links con los nuevos precios en MercadoPago
  if (paqueteLower.includes('motion')) return 'https://mpago.la/2TiAHyW';
  if (paqueteLower.includes('pro'))    return 'https://mpago.la/2TLTp3t';
  return 'https://mpago.la/2keQv3Z';
}

// ============================================================
// onEdit TRIGGER — detecta "Pagado PayPal ✓" en columna Estado
// ============================================================
// IMPORTANTE: Este trigger debe instalarse manualmente una vez:
//   Apps Script → Triggers (reloj) → Add Trigger
//   Función: onEdit | Evento: "From spreadsheet" → "On edit"
// ============================================================

function onEdit(e) {
  try {
    if (!e || !e.range) return;
    const hoja = e.range.getSheet();
    if (hoja.getName() !== NOMBRE_HOJA) return;
    if (e.range.getColumn() !== 4) return; // columna 4 = Estado

    const nuevoValor = (e.value || '').trim();
    if (nuevoValor !== 'Pagado PayPal ✓') return;

    const fila    = e.range.getRow();
    if (fila <= 1) return; // ignorar encabezado

    const datos   = hoja.getRange(fila, 1, 1, 38).getValues()[0];
    const folio   = datos[0];   // col 1
    const paquete = datos[2];   // col 3
    const nombre  = datos[4];   // col 5
    const correo  = datos[6];   // col 7
    const lang    = datos[36] === 'en' ? 'en' : 'es'; // col 37

    if (correo) {
      enviarCorreoPagoConfirmado(folio, nombre, correo, paquete, lang);
    }

    Logger.log('onEdit — Email enviado por Pagado PayPal ✓: ' + folio);
  } catch (err) {
    Logger.log('Error en onEdit: ' + err.message);
  }
}
