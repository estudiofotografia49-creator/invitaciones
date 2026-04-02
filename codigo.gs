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
const SPREADSHEET_ID = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID')
                       || '1UntGGT4Nt3YiSU9V_esnH_8jc9eFpHMwebCpf6Bm2UQ';
const CARPETA_RAIZ   = 'Festali Clientes';
const NOMBRE_HOJA    = 'Solicitudes';

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
  'Hora Evento',                  // 10
  'Festejados',                   // 11
  '¿Hay Ceremonia?',              // 12
  'Lugar Ceremonia',              // 13
  'Enlace Ubicación Ceremonia',   // 14
  '¿Hay Recepción?',              // 15
  'Lugar Recepción',              // 16
  'Enlace Ubicación Recepción',   // 17
  'Medio Confirmaciones',         // 18
  'Contacto Confirmaciones',      // 19
  'Paleta Colores',               // 20
  'Estilo Invitación',            // 21
  'Tipo Diseño',                  // 22
  'Fotos (cantidad)',             // 23
  'Carpeta Fotos',                // 24
  'Dress Code',                   // 25
  'Ejemplos Vestimenta',          // 26
  'Mensaje Especial',             // 27
  '¿Festali escribe el mensaje?', // 28
  'Datos Asistencia',             // 29
  'Solo Adultos',                 // 30
  'Mesa de Regalos',              // 31
  'Música',                       // 32
  'Agenda',                       // 33
  'Ideas',                        // 34
  'Referencias',                  // 35
  'Nombre Enlace',                // 36
  'Timestamp Servidor'            // 37
];

// ============================================================
// PUNTO DE ENTRADA — POST
// ============================================================

function doPost(e) {
  try {
    const datos = JSON.parse(e.postData.contents);

    // ── Webhook de MercadoPago ──
    // MP envía { type: 'payment', data: { id: '...' } }
    if (datos.type === 'payment' && datos.data && datos.data.id) {
      return procesarWebhookMP(datos);
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
    const linksRefs      = guardarFotosEnSub(datos.referencias       || [], subcarpeta, 'Referencias visuales');
    const linksDressCode = guardarFotosEnSub(datos.dressCodeImagenes || [], subcarpeta, 'Ejemplos vestimenta');
    const linksAgenda    = guardarFotosEnSub(datos.agendaImagenes    || [], subcarpeta, 'Agenda');

    // 4. Guardar fila en Sheets con estado "Pendiente de Pago"
    const ss   = SpreadsheetApp.openById(SPREADSHEET_ID);
    const hoja = prepararHoja(ss);
    escribirFila(hoja, datos, linksFotos, subcarpeta.getUrl(), linksRefs, linksAgenda, linksDressCode);

    // 5. Crear preferencia de pago en MercadoPago
    const initPoint = crearPreferenciaMercadoPago(folio, datos.paquete);

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

function doGet() {
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

  // Formato básico de correo
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.correo)) return 'Correo con formato inválido';

  // Paquete debe ser uno de los tres permitidos
  const paquetesValidos = ['digital essence', 'smart interactive', 'premium experience',
                           'essence', 'smart', 'premium'];
  const paqueteLower = String(d.paquete).toLowerCase();
  if (!paquetesValidos.some(p => paqueteLower.includes(p.split(' ')[0]))) {
    return 'Paquete no reconocido: ' + d.paquete;
  }

  // Límites de tamaño por campo de texto
  const limites = {
    nombreCompleto: 200, whatsapp: 50, correo: 254,
    nombresFestejados: 300, paletaColores: 500, mensajeEspecial: 2000,
    datosAsistencia: 1000, ideasExtra: 2000, nombreEnlace: 100
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
  hoja.setColumnWidth(11, 180);  // Festejados
  hoja.setColumnWidth(14, 210);  // Enlace Ubicación Ceremonia
  hoja.setColumnWidth(17, 210);  // Enlace Ubicación Recepción
  hoja.setColumnWidth(19, 180);  // Contacto Confirmaciones
  hoja.setColumnWidth(20, 160);  // Paleta Colores
  hoja.setColumnWidth(24, 210);  // Carpeta Fotos
  hoja.setColumnWidth(27, 200);  // Mensaje Especial
  hoja.setColumnWidth(29, 200);  // Datos Asistencia
  hoja.setColumnWidth(31, 200);  // Mesa de Regalos
  hoja.setColumnWidth(33, 200);  // Agenda
  hoja.setColumnWidth(36, 160);  // Nombre Enlace
}

// ============================================================
// SHEETS — escribir fila
// ============================================================

function escribirFila(hoja, d, linksFotos, urlCarpeta, linksRefs, linksAgenda, linksDressCode) {
  const ahora = new Date();

  // ── Derivar campos compuestos ──

  // ¿Hay ceremonia? — campo explícito del payload o inferido del lugar
  const hayCeremonia = d.hayCeremonia || (d.lugarCeremonia ? 'Sí' : 'No');
  const hayRecepcion = d.hayRecepcion || (d.lugarRecepcion ? 'Sí' : 'No');

  // Enlace de ubicación — soporta nombre de campo antiguo y nuevo
  const enlaceCeremonia = d.enlaceCeremonia || d.ubicacionCeremonia || '';
  const enlaceRecepcion = d.enlaceRecepcion || d.ubicacionRecepcion || '';

  // Medio y contacto de confirmaciones
  const medioConf = d.medioConfirmaciones ||
                    (d.whatsappConfirmaciones ? 'WhatsApp' :
                     d.correoConfirmaciones   ? 'Correo'   : '');
  const contactoConf = d.contactoConfirmaciones ||
                       d.whatsappConfirmaciones ||
                       d.correoConfirmaciones   || '';

  // ¿Festali escribe el mensaje? — Sí si es smart/premium y no vino texto propio
  const paqueteKey   = (d.paquete || '').toLowerCase();
  const esSmartOPlus = paqueteKey.includes('smart') || paqueteKey.includes('premium');
  const mensajeFestali = d.mensajeFestali ||
                         (esSmartOPlus && !d.mensajeEspecial ? 'Sí' : 'No');

  // Mesa de regalos — consolidar tipo + link/datos bancarios en una celda
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

  // Agenda — texto si describió, o cantidad de imágenes si subió imagen
  let agenda = d.agendaEvento || '';
  if (!agenda && linksAgenda.length > 0) {
    agenda = linksAgenda.length + ' imagen' + (linksAgenda.length > 1 ? 'es' : '') + ' (ver carpeta)';
  }

  const s = sanitizar; // alias corto

  const fila = [
    s(d.folio                  || ''),  // 1  Folio
    s(d.fechaSolicitud         || ''),  // 2  Fecha Solicitud
    s(d.paquete                || ''),  // 3  Paquete
    'Pendiente de Pago',                // 4  Estado — se actualiza automáticamente al pagar
    s(d.nombreCompleto         || ''),  // 5  Nombre
    s(d.whatsapp               || ''),  // 6  WhatsApp
    s(d.correo                 || ''),  // 7  Correo
    s(d.tipoEvento             || ''),  // 8  Tipo Evento
    s(d.fechaEvento            || ''),  // 9  Fecha Evento
    s(d.horaEvento             || ''),  // 10 Hora Evento
    s(d.nombresFestejados      || ''),  // 11 Festejados
    hayCeremonia,                       // 12 ¿Hay Ceremonia? (Sí/No)
    s(d.lugarCeremonia         || ''),  // 13 Lugar Ceremonia
    s(enlaceCeremonia),                 // 14 Enlace Ubicación Ceremonia
    hayRecepcion,                       // 15 ¿Hay Recepción? (Sí/No)
    s(d.lugarRecepcion         || ''),  // 16 Lugar Recepción
    s(enlaceRecepcion),                 // 17 Enlace Ubicación Recepción
    medioConf,                          // 18 Medio Confirmaciones (WhatsApp/Correo)
    s(contactoConf),                    // 19 Contacto Confirmaciones
    s(d.paletaColores          || ''),  // 20 Paleta Colores
    s(d.estiloInvitacion       || ''),  // 21 Estilo Invitación
    s(d.tipoDiseno             || ''),  // 22 Tipo Diseño
    linksFotos.length,                  // 23 Fotos (cantidad) — número
    urlCarpeta               || '',     // 24 Carpeta Fotos — URL generada por Drive
    s(d.dressCode              || ''),  // 25 Dress Code
    (linksDressCode || []).length,      // 26 Ejemplos Vestimenta — número
    s(d.mensajeEspecial        || ''),  // 27 Mensaje Especial
    mensajeFestali,                     // 28 ¿Festali escribe el mensaje? (Sí/No)
    s(d.datosAsistencia        || ''),  // 29 Datos Asistencia
    s(d.soloAdultos            || ''),  // 30 Solo Adultos
    s(mesaRegalos),                     // 31 Mesa de Regalos
    s(d.musica                 || ''),  // 32 Música
    s(agenda),                          // 33 Agenda
    s(d.ideasExtra             || ''),  // 34 Ideas
    (linksRefs || []).length,           // 35 Referencias — número
    s(d.nombreEnlace           || ''),  // 36 Nombre Enlace
    Utilities.formatDate(ahora, Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm:ss')  // 37
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

  const precios = { essence: 850, smart: 1450, premium: 2100 };
  const paqueteLower = (paquete || '').toLowerCase();
  let precio       = precios.essence;
  let nombrePaq    = 'Digital Essence';
  if (paqueteLower.includes('smart'))   { precio = precios.smart;   nombrePaq = 'Smart Interactive';   }
  if (paqueteLower.includes('premium')) { precio = precios.premium; nombrePaq = 'Premium Experience';  }

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
      payload:     JSON.stringify(preferencia)
    });

    const resultado = JSON.parse(response.getContentText());
    Logger.log('✅ Preferencia MP creada — folio: ' + folio + ' | init_point: ' + resultado.init_point);
    return resultado.init_point || null;

  } catch (err) {
    Logger.log('❌ Error creando preferencia MP: ' + err.message);
    Logger.log('❌ Respuesta HTTP: ' + (err.response ? err.response.getContentText() : 'sin respuesta'));
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

    if (!folio) {
      Logger.log('⚠️ Webhook MP sin external_reference — se ignora');
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

      // Notificar al admin solo cuando el pago es aprobado
      if (nuevoEstado === 'Pagado ✓') {
        try {
          const adminEmail = PropertiesService.getScriptProperties().getProperty('ADMIN_EMAIL');
          if (adminEmail) {
            const nombre  = datos[i][4];  // columna 5 — Nombre
            const paquete = datos[i][2];  // columna 3 — Paquete
            MailApp.sendEmail(
              adminEmail,
              '✅ FESTALI — Pago confirmado: ' + folio,
              'El pedido ' + folio + ' ha sido pagado.\n\n' +
              'Cliente: ' + nombre + '\n' +
              'Paquete: ' + paquete + '\n\n' +
              'Ver Sheets: https://docs.google.com/spreadsheets/d/' + SPREADSHEET_ID
            );
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

// ============================================================
// TEST — verificar conexión con Sheets
// ============================================================

function testConexion() {
  const ss   = SpreadsheetApp.openById(SPREADSHEET_ID);
  const hoja = prepararHoja(ss);
  Logger.log('✅ Conexión exitosa: ' + hoja.getName());
}
