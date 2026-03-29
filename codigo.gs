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
  'Folio',
  'Fecha Solicitud',
  'Paquete',
  'Estado',
  'Nombre',
  'WhatsApp',
  'Correo',
  'Tipo Evento',
  'Fecha Evento',
  'Hora Evento',
  'Festejados',
  'Lugar Ceremonia',
  'Ubic. Ceremonia',
  'Lugar Recepción',
  'Ubic. Recepción',
  'WA Confirmaciones',
  'Correo Confirmaciones',
  'Paleta Colores',
  'Fotos (cantidad)',
  'Carpeta Fotos',
  'Dress Code',
  'Mensaje Especial',
  'Datos Asistencia',
  'Solo Adultos',
  'Música',
  'Agenda (texto)',
  'Agenda (img cant.)',
  'Nombre Enlace',
  'Tipo Diseño',
  'Estilo Invitación',
  'Ideas Extra',
  'Refs (cantidad)',
  'Mesa Regalos Tipo',
  'Mesa Regalos / Link',
  'Banco',
  'Titular Cuenta',
  'CLABE',
  'Timestamp Servidor'
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

    // 3. Guardar fotos en Drive
    const linksFotos    = guardarFotos(datos.fotos          || [], subcarpeta);
    const linksRefs     = guardarFotos(datos.referencias    || [], subcarpeta);
    const linksAgenda   = guardarFotos(datos.agendaImagenes || [], subcarpeta);

    // 4. Guardar fila en Sheets
    const ss   = SpreadsheetApp.openById(SPREADSHEET_ID);
    const hoja = prepararHoja(ss);
    escribirFila(hoja, datos, linksFotos, subcarpeta.getUrl(), linksRefs, linksAgenda);

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
  hoja.setColumnWidth(1, 100);   // Folio
  hoja.setColumnWidth(2, 130);   // Fecha solicitud
  hoja.setColumnWidth(3, 160);   // Paquete
  hoja.setColumnWidth(4, 100);   // Estado
  hoja.setColumnWidth(5, 180);   // Nombre
  hoja.setColumnWidth(6, 140);   // WhatsApp
  hoja.setColumnWidth(7, 180);   // Correo
  hoja.setColumnWidth(11, 180);  // Festejados
  hoja.setColumnWidth(19, 200);  // Carpeta fotos
}

// ============================================================
// SHEETS — escribir fila
// ============================================================

function escribirFila(hoja, d, linksFotos, urlCarpeta, linksRefs, linksAgenda) {
  const ahora = new Date();

  const fila = [
    d.folio                  || '',
    d.fechaSolicitud         || '',
    d.paquete                || '',
    'Pendiente',                          // Estado — editar manualmente
    d.nombreCompleto         || '',
    d.whatsapp               || '',
    d.correo                 || '',
    d.tipoEvento             || '',
    d.fechaEvento            || '',
    d.horaEvento             || '',
    d.nombresFestejados      || '',
    d.lugarCeremonia         || '',
    d.ubicacionCeremonia     || '',
    d.lugarRecepcion         || '',
    d.ubicacionRecepcion     || '',
    d.whatsappConfirmaciones || '',
    d.correoConfirmaciones   || '',
    d.paletaColores          || '',
    linksFotos.length,
    urlCarpeta               || '',
    d.dressCode              || '',
    d.mensajeEspecial        || '',
    d.datosAsistencia        || '',
    d.soloAdultos            || '',
    d.musica                 || '',
    d.agendaEvento           || '',
    (linksAgenda || []).length,
    d.nombreEnlace           || '',
    d.tipoDiseno             || '',
    d.estiloInvitacion       || '',
    d.ideasExtra             || '',
    (linksRefs || []).length,
    d.tipoRegalos            || '',
    d.mesaRegalosLink        || '',
    d.bancoCuenta            || '',
    d.titularCuenta          || '',
    d.clabeCuenta            || '',
    Utilities.formatDate(ahora, Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm:ss')
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

  const paqueteKey = (d.paquete || '').toLowerCase();
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
