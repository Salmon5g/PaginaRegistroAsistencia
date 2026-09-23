'use strict';
const PDFDocument = require('pdfkit');

const CONFIG = {
  atrasos: {
    titulo: 'Reporte de Atrasos',
    headers: ['Empleado', 'Email', 'Total atrasos', 'Fechas de atraso'],
    widths: [22, 28, 16, 34],
    totalKey: 'total_atrasos',
    fechasKey: 'fechas_atraso',
  },
  salidas: {
    titulo: 'Reporte de Salidas Anticipadas',
    headers: ['Empleado', 'Email', 'Total salidas anticipadas', 'Fechas de salida'],
    widths: [18, 26, 24, 32],
    totalKey: 'total_salidas_anticipadas',
    fechasKey: 'fechas_salida',
  },
  inasistencias: {
    titulo: 'Reporte de Inasistencias',
    headers: ['Empleado', 'Email'],
    widths: [40, 60],
  },
};

function formatearPeriodo(meta) {
  if (!meta) return 'Todos los registros';
  const partes = [];
  if (meta.desde) partes.push(`desde ${meta.desde}`);
  if (meta.hasta) partes.push(`hasta ${meta.hasta}`);
  if (meta.fecha) partes.push(`Fecha evaluada: ${meta.fecha}`);
  if (partes.length) return `Periodo: ${partes.join(' ')}`;
  return 'Todos los registros';
}

function dibujarFooter(doc) {
  const { left, right, bottom } = doc.page.margins;
  const y = doc.page.height - bottom + 14;
  doc.fontSize(8).fillColor('#9ca3af');
  doc.text(
    `Sistema de Asistencia - Generado el ${new Date().toLocaleString('es-CL', { timeZone: 'America/Santiago' })}`,
    left,
    y,
    { width: doc.page.width - left - right, align: 'center' }
  );
}

function filasDe(tipo, data) {
  const cfg = CONFIG[tipo];
  if (tipo === 'inasistencias') {
    return data.map((d) => [d.nombre || '-', d.email || '-']);
  }
  const total = (d) => String(d[cfg.totalKey] ?? 0);
  const fechas = (d) => (d[cfg.fechasKey] ? String(d[cfg.fechasKey]) : '-');
  return data.map((d) => [d.nombre || '-', d.email || '-', total(d), fechas(d)]);
}

function alturaTexto(doc, texto, ancho) {
  return doc.heightOfString(String(texto), { width: ancho });
}

function dibujarEncabezadoTabla(doc, y0, colWidths, colX, headers) {
  const PAD = 4;
  doc.font('Helvetica-Bold').fontSize(8.5);
  let rowH = 14;
  headers.forEach((h, i) => {
    const hh = alturaTexto(doc, h, colWidths[i] - PAD * 2);
    if (hh + PAD * 2 > rowH) rowH = hh + PAD * 2;
  });
  doc.fillColor('#eef2ff');
  for (let i = 0; i < colWidths.length; i += 1) {
    doc.rect(colX[i] + 1, y0 + 1, colWidths[i] - 2, rowH - 2).fill();
  }
  doc.fillColor('#111827');
  headers.forEach((h, i) => {
    doc.text(h, colX[i] + PAD, y0 + PAD, { width: colWidths[i] - PAD * 2 });
  });
  doc.font('Helvetica');
  return y0 + rowH;
}

function dibujarFilaDatos(doc, y0, datos, colWidths, colX) {
  const PAD = 4;
  doc.font('Helvetica').fontSize(8.5);
  let rowH = 14;
  const alturas = datos.map((d, i) => alturaTexto(doc, d, colWidths[i] - PAD * 2));
  datos.forEach((d, i) => {
    if (alturas[i] + PAD * 2 > rowH) rowH = alturas[i] + PAD * 2;
  });
  doc.fillColor('#111827');
  datos.forEach((d, i) => {
    doc.text(String(d), colX[i] + PAD, y0 + PAD, { width: colWidths[i] - PAD * 2 });
  });
  return y0 + rowH;
}

function generarPdf(tipo, data, meta) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 46, bottom: 62, left: 44, right: 44 },
    });
    const chunks = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.on('pageAdded', () => dibujarFooter(doc));

    doc.fontSize(15).fillColor('#4f46e5').text('SISTEMA DE REGISTRO DE ASISTENCIA DE EMPLEADOS', {
      align: 'center',
    });
    doc.moveDown(0.25);
    doc.fontSize(13).fillColor('#111827').text(CONFIG[tipo].titulo, { align: 'center' });
    doc.fontSize(9).fillColor('#6b7280').text(formatearPeriodo(meta), { align: 'center' });
    doc.moveDown(0.6);

    const cfg = CONFIG[tipo];
    if (data.length === 0) {
      doc.fontSize(10).fillColor('#374151').text(
        'No se encontraron registros para el periodo consultado.',
        { align: 'center' }
      );
    } else {
      const { left, right } = doc.page.margins;
      const usable = doc.page.width - left - right;
      const totalRel = cfg.widths.reduce((a, b) => a + b, 0);
      const colWidths = cfg.widths.map((w) => (w / totalRel) * usable);
      const colX = [];
      let x = left;
      colWidths.forEach((w) => {
        colX.push(x);
        x += w;
      });

      const pageBottom = doc.page.height - doc.page.margins.bottom;
      const filas = filasDe(tipo, data);

      doc.fontSize(9).fillColor('#374151').text(`Total de empleados con registros: ${data.length}`);
      doc.moveDown(0.4);

      let y = doc.y;
      y = dibujarEncabezadoTabla(doc, y, colWidths, colX, cfg.headers);

      for (const fila of filas) {
        doc.font('Helvetica').fontSize(8.5);
        let estH = 14;
        fila.forEach((d, i) => {
          const h = alturaTexto(doc, d, colWidths[i] - 8);
          if (h + 8 > estH) estH = h + 8;
        });
        if (y + estH > pageBottom) {
          doc.addPage();
          y = dibujarEncabezadoTabla(doc, doc.page.margins.top, colWidths, colX, cfg.headers);
        }
        y = dibujarFilaDatos(doc, y, fila, colWidths, colX);
      }
    }

    if (doc.page.pageNumber === 1) dibujarFooter(doc);
    doc.end();
  });
}

module.exports = { generarPdf };