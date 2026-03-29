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

const SPREADSHEET_ID = '1UntGGT4Nt3YiSU9V_esnH_8jc9eFpHMwebCpf6Bm2UQ';
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
    const datos  = JSON.parse(e.postData.contents);
    const folio  = datos.folio || 'FEST-???';
    const nombre = datos.nombresFestejados || datos.nombreCompleto || 'Sin nombre';

    // 1. Carpeta raíz (crear si no existe)
    const carpetaRaiz = obtenerOCrearCarpeta(CARPETA_RAIZ, null);

    // 2. Subcarpeta por solicitud — FOLIO — Nombre del evento
    const nombreSub  = folio + ' — ' + nombre;
    const subcarpeta = obtenerOCrearCarpeta(nombreSub, carpetaRaiz);

    // 3. Guardar todas las imágenes en la misma subcarpeta
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
// DRIVE — guardar imágenes (base64 → Drive)
// ============================================================

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

  const fila = [
    d.folio                  || '',  // 1  Folio
    d.fechaSolicitud         || '',  // 2  Fecha Solicitud
    d.paquete                || '',  // 3  Paquete
    'Pendiente',                     // 4  Estado — editar manualmente
    d.nombreCompleto         || '',  // 5  Nombre
    d.whatsapp               || '',  // 6  WhatsApp
    d.correo                 || '',  // 7  Correo
    d.tipoEvento             || '',  // 8  Tipo Evento
    d.fechaEvento            || '',  // 9  Fecha Evento
    d.horaEvento             || '',  // 10 Hora Evento
    d.nombresFestejados      || '',  // 11 Festejados
    hayCeremonia,                    // 12 ¿Hay Ceremonia?
    d.lugarCeremonia         || '',  // 13 Lugar Ceremonia
    enlaceCeremonia,                 // 14 Enlace Ubicación Ceremonia
    hayRecepcion,                    // 15 ¿Hay Recepción?
    d.lugarRecepcion         || '',  // 16 Lugar Recepción
    enlaceRecepcion,                 // 17 Enlace Ubicación Recepción
    medioConf,                       // 18 Medio Confirmaciones
    contactoConf,                    // 19 Contacto Confirmaciones
    d.paletaColores          || '',  // 20 Paleta Colores
    d.estiloInvitacion       || '',  // 21 Estilo Invitación
    d.tipoDiseno             || '',  // 22 Tipo Diseño
    linksFotos.length,               // 23 Fotos (cantidad)
    urlCarpeta               || '',  // 24 Carpeta Fotos
    d.dressCode              || '',  // 25 Dress Code
    (linksDressCode || []).length,   // 26 Ejemplos Vestimenta
    d.mensajeEspecial        || '',  // 27 Mensaje Especial
    mensajeFestali,                  // 28 ¿Festali escribe el mensaje?
    d.datosAsistencia        || '',  // 29 Datos Asistencia
    d.soloAdultos            || '',  // 30 Solo Adultos
    mesaRegalos,                     // 31 Mesa de Regalos
    d.musica                 || '',  // 32 Música
    agenda,                          // 33 Agenda
    d.ideasExtra             || '',  // 34 Ideas
    (linksRefs || []).length,        // 35 Referencias
    d.nombreEnlace           || '',  // 36 Nombre Enlace
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
// TEST — verificar conexión con Sheets
// ============================================================

function testConexion() {
  const ss   = SpreadsheetApp.openById(SPREADSHEET_ID);
  const hoja = prepararHoja(ss);
  Logger.log('✅ Conexión exitosa: ' + hoja.getName());
}
