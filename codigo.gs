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

const SPREADSHEET_ID  = '13w2V3jfN4iDrIIm6AvVdCrTgoJaQA7kxhgXnFMAUsP0';
const CARPETA_RAIZ    = 'FESTALI — Fotos de Eventos';
const NOMBRE_HOJA     = 'Solicitudes';

const ENCABEZADOS = [
  'Folio',                   // 1
  'Fecha Solicitud',         // 2
  'Paquete',                 // 3
  'Estado',                  // 4
  'Nombre',                  // 5
  'WhatsApp',                // 6
  'Correo',                  // 7
  'Tipo Evento',             // 8
  'Fecha Evento',            // 9
  'Hora Evento',             // 10
  'Festejados',              // 11
  'Hay Ceremonia',           // 12
  'Lugar Ceremonia',         // 13
  'Enlace Ceremonia',        // 14
  'Hay Recepción',           // 15
  'Lugar Recepción',         // 16
  'Enlace Recepción',        // 17
  'Medio Confirmaciones',    // 18
  'Contacto Confirmaciones', // 19
  'Paleta Colores',          // 20
  'Fotos (cantidad)',        // 21
  'Carpeta Fotos',           // 22
  'Dress Code',              // 23
  'Dress Code Imágenes',     // 24
  'Mensaje Especial',        // 25
  'Mensaje Festali',         // 26
  'Datos Asistencia',        // 27
  'Solo Adultos',            // 28
  'Música',                  // 29
  'Agenda (texto)',          // 30
  'Agenda (img cant.)',      // 31
  'Tipo Diseño',             // 32
  'Estilo Invitación',       // 33
  'Ideas',                   // 34
  'Referencias',             // 35
  'Nombre Enlace',           // 36
  'Mesa Regalos Tipo',       // 37
  'Mesa Regalos / Link',     // 38
  'Banco',                   // 39
  'Titular Cuenta',          // 40
  'CLABE',                   // 41
  'Timestamp Servidor'       // 42
];

// ============================================================
// PUNTO DE ENTRADA — POST
// ============================================================

function doPost(e) {
  try {
    const datos  = JSON.parse(e.postData.contents);
    const folio  = datos.folio || 'FEST-???';
    const nombre = datos.nombresFestejados || datos.nombreCompleto || 'Sin nombre';

    // 1. Carpeta raíz FESTALI (crear si no existe)
    const carpetaRaiz = obtenerOCrearCarpeta(CARPETA_RAIZ, null);

    // 2. Subcarpeta individual por solicitud
    const nombreSub = folio + ' — ' + nombre;
    const subcarpeta = obtenerOCrearCarpeta(nombreSub, carpetaRaiz);

    // 3. Guardar archivos en Drive
    const linksFotos     = guardarFotos(datos.fotos             || [], subcarpeta);
    const linksRefs      = guardarFotos(datos.referencias       || [], subcarpeta);
    const linksAgenda    = guardarFotos(datos.agendaImagenes    || [], subcarpeta);
    const linksDressCode = guardarFotos(datos.dressCodeImagenes || [], subcarpeta);

    // 4. Guardar fila en Sheets
    const ss   = SpreadsheetApp.openById(SPREADSHEET_ID);
    const hoja = prepararHoja(ss);
    escribirFila(hoja, datos, linksFotos, subcarpeta.getUrl(), linksRefs, linksAgenda, linksDressCode);

    return respuestaOk({ folio: folio, carpeta: subcarpeta.getUrl() });

  } catch (err) {
    Logger.log('Error FESTALI doPost: ' + err.message);
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
// DRIVE — guardar fotos
// ============================================================

function guardarFotos(fotos, carpeta) {
  const links = [];

  fotos.forEach(function(foto, i) {
    try {
      const bytes = Utilities.base64Decode(foto.data);
      const blob  = Utilities.newBlob(bytes, foto.mimeType, foto.nombre || ('foto_' + (i + 1)));
      const file  = carpeta.createFile(blob);
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      links.push(file.getUrl());
    } catch (err) {
      Logger.log('Error al guardar foto ' + i + ': ' + err.message);
      links.push('Error al subir');
    }
  });

  return links;
}

// ============================================================
// SHEETS — preparar hoja
// ============================================================

function prepararHoja(ss) {
  let hoja = ss.getSheetByName(NOMBRE_HOJA);

  if (!hoja) {
    hoja = ss.insertSheet(NOMBRE_HOJA);
    aplicarEncabezados(hoja);
  } else if (hoja.getLastRow() === 0) {
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

  // Ancho de columnas
  hoja.setColumnWidth(1,  100);  // Folio
  hoja.setColumnWidth(2,  130);  // Fecha Solicitud
  hoja.setColumnWidth(3,  160);  // Paquete
  hoja.setColumnWidth(4,  100);  // Estado
  hoja.setColumnWidth(5,  180);  // Nombre
  hoja.setColumnWidth(6,  140);  // WhatsApp
  hoja.setColumnWidth(7,  180);  // Correo
  hoja.setColumnWidth(11, 180);  // Festejados
  hoja.setColumnWidth(14, 200);  // Enlace Ceremonia
  hoja.setColumnWidth(17, 200);  // Enlace Recepción
  hoja.setColumnWidth(19, 180);  // Contacto Confirmaciones
  hoja.setColumnWidth(22, 200);  // Carpeta Fotos
  hoja.setColumnWidth(36, 160);  // Nombre Enlace
}

// ============================================================
// SHEETS — escribir fila
// ============================================================

function escribirFila(hoja, d, linksFotos, urlCarpeta, linksRefs, linksAgenda, linksDressCode) {
  const ahora = new Date();

  // ── Derivar campos compuestos ──

  // Hay ceremonia / recepción: campo explícito si viene del payload, si no se infiere
  const hayCeremonia = d.hayCeremonia || (d.lugarCeremonia ? 'Sí' : 'No');
  const hayRecepcion = d.hayRecepcion || (d.lugarRecepcion ? 'Sí' : 'No');

  // Enlace (URL) de ubicación — soporta nombre antiguo y nuevo
  const enlaceCeremonia = d.enlaceCeremonia || d.ubicacionCeremonia || '';
  const enlaceRecepcion = d.enlaceRecepcion || d.ubicacionRecepcion || '';

  // Medio y contacto de confirmaciones — consolida los dos campos originales
  const medioConf = d.medioConfirmaciones ||
                    (d.whatsappConfirmaciones ? 'WhatsApp' :
                     d.correoConfirmaciones   ? 'Correo'   : '');
  const contactoConf = d.contactoConfirmaciones ||
                       d.whatsappConfirmaciones ||
                       d.correoConfirmaciones   || '';

  // Mensaje Festali: Sí cuando es smart/premium y el usuario no escribió mensaje propio
  const paqueteKey   = (d.paquete || '').toLowerCase();
  const esSmartOPlus = paqueteKey.includes('smart') || paqueteKey.includes('premium');
  const mensajeFestali = d.mensajeFestali || (esSmartOPlus && !d.mensajeEspecial ? 'Sí' : '');

  const fila = [
    d.folio                  || '',          // 1  Folio
    d.fechaSolicitud         || '',          // 2  Fecha Solicitud
    d.paquete                || '',          // 3  Paquete
    'Pendiente',                             // 4  Estado — editar manualmente
    d.nombreCompleto         || '',          // 5  Nombre
    d.whatsapp               || '',          // 6  WhatsApp
    d.correo                 || '',          // 7  Correo
    d.tipoEvento             || '',          // 8  Tipo Evento
    d.fechaEvento            || '',          // 9  Fecha Evento
    d.horaEvento             || '',          // 10 Hora Evento
    d.nombresFestejados      || '',          // 11 Festejados
    hayCeremonia,                            // 12 Hay Ceremonia
    d.lugarCeremonia         || '',          // 13 Lugar Ceremonia
    enlaceCeremonia,                         // 14 Enlace Ceremonia
    hayRecepcion,                            // 15 Hay Recepción
    d.lugarRecepcion         || '',          // 16 Lugar Recepción
    enlaceRecepcion,                         // 17 Enlace Recepción
    medioConf,                               // 18 Medio Confirmaciones
    contactoConf,                            // 19 Contacto Confirmaciones
    d.paletaColores          || '',          // 20 Paleta Colores
    linksFotos.length,                       // 21 Fotos (cantidad)
    urlCarpeta               || '',          // 22 Carpeta Fotos
    d.dressCode              || '',          // 23 Dress Code
    (linksDressCode || []).length,           // 24 Dress Code Imágenes
    d.mensajeEspecial        || '',          // 25 Mensaje Especial
    mensajeFestali,                          // 26 Mensaje Festali
    d.datosAsistencia        || '',          // 27 Datos Asistencia
    d.soloAdultos            || '',          // 28 Solo Adultos
    d.musica                 || '',          // 29 Música
    d.agendaEvento           || '',          // 30 Agenda (texto)
    (linksAgenda || []).length,              // 31 Agenda (img cant.)
    d.tipoDiseno             || '',          // 32 Tipo Diseño
    d.estiloInvitacion       || '',          // 33 Estilo Invitación
    d.ideasExtra             || '',          // 34 Ideas
    (linksRefs || []).length,               // 35 Referencias
    d.nombreEnlace           || '',          // 36 Nombre Enlace
    d.tipoRegalos            || '',          // 37 Mesa Regalos Tipo
    d.mesaRegalosLink        || '',          // 38 Mesa Regalos / Link
    d.bancoCuenta            || '',          // 39 Banco
    d.titularCuenta          || '',          // 40 Titular Cuenta
    d.clabeCuenta            || '',          // 41 CLABE
    Utilities.formatDate(ahora, Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm:ss')  // 42
  ];

  hoja.appendRow(fila);

  // Colorear fila según paquete
  const ultimaFila = hoja.getLastRow();
  const rangoFila  = hoja.getRange(ultimaFila, 1, 1, ENCABEZADOS.length);

  const colores = {
    'essence': '#f0fdf4',
    'smart':   '#fdf4ff',
    'premium': '#fffbeb'
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
// TEST — verificar conexión con Sheets
// ============================================================

function testConexion() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const hoja = prepararHoja(ss);
  Logger.log('✅ Conexión exitosa: ' + hoja.getName());
}
