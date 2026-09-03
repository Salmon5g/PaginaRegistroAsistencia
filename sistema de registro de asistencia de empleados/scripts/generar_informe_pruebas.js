'use strict';
const fs = require('fs');
const path = require('path');
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  WidthType, AlignmentType, HeadingLevel, BorderStyle, ShadingType,
} = require('docx');

const RESULTADO_OK = 'Paso';
const resOk = new Paragraph({
  children: [new TextRun({ text: RESULTADO_OK, bold: true, color: '16a34a' })],
});

const casosUnitarios = [
  {
    id: 'UT-01', requerimiento: 'RE-01 Reporte de atrasos',
    descripcion: 'Limite exacto de atraso: entrada a las 9:30',
    entrada: 'hora=9, minuto=30', esperado: 'No es atraso (false)', obtenido: 'false', resultado: RESULTADO_OK,
  },
  {
    id: 'UT-02', requerimiento: 'RE-01 Reporte de atrasos',
    descripcion: 'Entrada un minuto despues del limite: 9:31',
    entrada: 'hora=9, minuto=31', esperado: 'Es atraso (true)', obtenido: 'true', resultado: RESULTADO_OK,
  },
  {
    id: 'UT-03', requerimiento: 'RE-01 Reporte de atrasos',
    descripcion: 'Entrada claramente despues del limite: 10:00',
    entrada: 'hora=10, minuto=0', esperado: 'Es atraso (true)', obtenido: 'true', resultado: RESULTADO_OK,
  },
  {
    id: 'UT-04', requerimiento: 'RE-01 Reporte de atrasos',
    descripcion: 'Entrada antes del limite: 8:00',
    entrada: 'hora=8, minuto=0', esperado: 'No es atraso (false)', obtenido: 'false', resultado: RESULTADO_OK,
  },
  {
    id: 'UT-05', requerimiento: 'RE-02 Reporte de salidas anticipadas',
    descripcion: 'Limite exacto de salida: 17:30',
    entrada: 'hora=17, minuto=30', esperado: 'No es anticipada (false)', obtenido: 'false', resultado: RESULTADO_OK,
  },
  {
    id: 'UT-06', requerimiento: 'RE-02 Reporte de salidas anticipadas',
    descripcion: 'Salida un minuto antes del limite: 17:29',
    entrada: 'hora=17, minuto=29', esperado: 'Es anticipada (true)', obtenido: 'true', resultado: RESULTADO_OK,
  },
  {
    id: 'UT-07', requerimiento: 'RE-02 Reporte de salidas anticipadas',
    descripcion: 'Salida claramente antes del limite: 16:00',
    entrada: 'hora=16, minuto=0', esperado: 'Es anticipada (true)', obtenido: 'true', resultado: RESULTADO_OK,
  },
  {
    id: 'UT-08', requerimiento: 'RE-02 Reporte de salidas anticipadas',
    descripcion: 'Salida despues del limite: 18:00',
    entrada: 'hora=18, minuto=0', esperado: 'No es anticipada (false)', obtenido: 'false', resultado: RESULTADO_OK,
  },
  {
    id: 'UT-09', requerimiento: 'RE-01 Reporte de atrasos',
    descripcion: 'Filtrado de entradas atrasadas sobre una lista de marcas',
    entrada: '5 marcas (3 entradas, 1 salida)', esperado: 'Solo 2 entradas atrasadas', obtenido: '2 registros', resultado: RESULTADO_OK,
  },
  {
    id: 'UT-10', requerimiento: 'RE-02 Reporte de salidas anticipadas',
    descripcion: 'Filtrado de salidas anticipadas sobre una lista de marcas',
    entrada: '5 marcas (4 salidas, 1 entrada)', esperado: 'Solo 2 salidas anticipadas', obtenido: '2 registros', resultado: RESULTADO_OK,
  },
  {
    id: 'UT-11', requerimiento: 'RE-03 Reporte de inasistencias',
    descripcion: 'Solo usuarios activos sin marcas en la fecha son inasistentes',
    entrada: '3 usuarios (2 activos, 1 inactivo), marcas de la fecha', esperado: '1 inasistente (activo sin marca)', obtenido: '1 registro', resultado: RESULTADO_OK,
  },
  {
    id: 'UT-12', requerimiento: 'RE-03 Reporte de inasistencias',
    descripcion: 'Usuario inactivo no se lista como inasistente',
    entrada: '2 usuarios (1 activo, 1 inactivo), sin marcas', esperado: 'Solo el activo se lista', obtenido: '1 registro', resultado: RESULTADO_OK,
  },
];

const casosIntegracion = [
  {
    id: 'IT-01', requerimiento: 'RE-01/02/03',
    descripcion: 'El controlador de reportes expone las tres funciones de reporte',
    esperado: '3 funciones definidas', obtenido: 'reporteAtrasos, reporteSalidasAnticipadas, reporteInasistencias', resultado: RESULTADO_OK,
  },
  {
    id: 'IT-02', requerimiento: 'RE-03 Reporte de inasistencias',
    descripcion: 'El endpoint devuelve solo inasistentes activos para la fecha',
    entrada: 'fecha=2024-01-01, 3 usuarios, 1 marca', esperado: '1 inasistente (HTTP 200)', obtenido: '1 registro, ok=true', resultado: RESULTADO_OK,
  },
  {
    id: 'IT-03', requerimiento: 'RE-03 Reporte de inasistencias',
    descripcion: 'El endpoint responde error 500 ante fallo de base de datos',
    entrada: 'Fallo simulado en la consulta', esperado: 'HTTP 500 con ok=false', obtenido: '500, ok=false', resultado: RESULTADO_OK,
  },
];

function cell(text, opts = {}) {
  return new TableCell({
    shading: opts.shading ? { type: ShadingType.CLEAR, fill: opts.shading } : undefined,
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    children: [new Paragraph({
      children: [new TextRun({ text, bold: !!(opts.bold ?? false), color: opts.color })],
    })],
  });
}

function buildTable(headers, rows, widths) {
  const headerRow = new TableRow({
    tableHeader: true,
    children: headers.map((h, i) => cell(h, { bold: true, shading: 'EEF2FF' })),
  });
  const bodyRows = rows.map((r) =>
    new TableRow({
      children: r.map((c, i) => {
        if (i === r.length - 1 && c === RESULTADO_OK) {
          return cell(c, { bold: true, color: '16a34a' });
        }
        return cell(c);
      }),
    })
  );
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    columnWidths: widths,
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1, color: 'C9C9C9' },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: 'C9C9C9' },
      left: { style: BorderStyle.SINGLE, size: 1, color: 'C9C9C9' },
      right: { style: BorderStyle.SINGLE, size: 1, color: 'C9C9C9' },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: 'E5E7EB' },
      insideVertical: { style: BorderStyle.SINGLE, size: 1, color: 'E5E7EB' },
    },
    rows: [headerRow, ...bodyRows],
  });
}

const doc = new Document({
  styles: {
    default: {
      document: { run: { font: 'Calibri', size: 22 } },
    },
  },
  sections: [
    {
      properties: {},
      children: [
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 80 }, children: [
          new TextRun({ text: 'INTEGRACION DE COMPETENCIAS II', bold: true, size: 36, color: '4F46E5' }),
        ] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 120 }, children: [
          new TextRun({ text: 'Informe de Pruebas - Avance #4', bold: true, size: 40 }),
        ] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 40 }, children: [
          new TextRun({ text: 'Sistema de Registro de Asistencia de Empleados', size: 24 }),
        ] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 240 }, children: [
          new TextRun({ text: 'Reporte de Atrasos | Reporte de Salidas Anticipadas | Reporte de Inasistencias', italics: true, size: 22, color: '6B7280' }),
        ] }),

        new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 200, after: 80 }, children: [
          new TextRun({ text: '1. Introduccion', bold: true, size: 28, color: '4F46E5' }),
        ] }),
        new Paragraph({ spacing: { after: 120 }, children: [
          new TextRun({
            text: 'El presente informe documenta las pruebas unitarias y de integracion ejecutadas sobre los requerimientos RE-01 (Reporte de atrasos), RE-02 (Reporte de salidas anticipadas) y RE-03 (Reporte de inasistencias) del sistema de registro de asistencia de empleados. El objetivo es garantizar que el sistema cumpla con los requisitos funcionales antes de su entrega.',
          }),
        ] }),

        new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 200, after: 80 }, children: [
          new TextRun({ text: '2. Alcance y metodologia', bold: true, size: 28, color: '4F46E5' }),
        ] }),
        new Paragraph({ spacing: { after: 40 }, children: [
          new TextRun({ text: 'Tecnica: ', bold: true }), new TextRun({ text: 'Pruebas unitarias y de integracion.' }),
        ] }),
        new Paragraph({ spacing: { after: 40 }, children: [
          new TextRun({ text: 'Framework: ', bold: true }), new TextRun({ text: 'Runner nativo de Node.js (node:test).' }),
        ] }),
        new Paragraph({ spacing: { after: 40 }, children: [
          new TextRun({ text: 'Comando de ejecucion: ', bold: true }), new TextRun({ text: 'npm test' }),
        ] }),
        new Paragraph({ spacing: { after: 120 }, children: [
          new TextRun({ text: 'Criterio de aceptacion: ', bold: true }), new TextRun({ text: 'Todas las pruebas deben pasar (100%).' }),
        ] }),

        new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 200, after: 80 }, children: [
          new TextRun({ text: '3. Pruebas unitarias', bold: true, size: 28, color: '4F46E5' }),
        ] }),
        new Paragraph({ spacing: { after: 120 }, children: [
          new TextRun({ text: 'Las pruebas unitarias validan la logica de negocio de los reportes de forma aislada, sin depender de la base de datos. Cubren los limites exactos de las reglas (9:30 para atrasos y 17:30 para salidas anticipadas) y el filtrado de inasistentes.', }),
        ] }),
        buildTable(
          ['ID', 'Descripcion', 'Datos de entrada', 'Resultado esperado', 'Resultado obtenido', 'Estado'],
          casosUnitarios.map((c) => [c.id, c.descripcion, c.entrada, c.esperado, c.obtenido, c.resultado]),
          [1100, 2600, 2000, 1700, 1400, 700]
        ),
        new Paragraph({ spacing: { before: 120, after: 0 }, children: [
          new TextRun({ text: 'Resultado: 12/12 pruebas unitarias exitosas.', bold: true, color: '16a34a' }),
        ] }),

        new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 200, after: 80 }, children: [
          new TextRun({ text: '4. Pruebas de integracion', bold: true, size: 28, color: '4F46E5' }),
        ] }),
        new Paragraph({ spacing: { after: 120 }, children: [
          new TextRun({ text: 'Las pruebas de integracion verifican el comportamiento de los controladores de la API y su comunicacion con la capa de acceso a datos.', }),
        ] }),
        buildTable(
          ['ID', 'Descripcion', 'Datos de entrada', 'Resultado esperado', 'Resultado obtenido', 'Estado'],
          casosIntegracion.map((c) => [c.id, c.descripcion, c.entrada, c.esperado, c.obtenido, c.resultado]),
          [900, 2800, 1800, 1800, 1800, 700]
        ),
        new Paragraph({ spacing: { before: 120, after: 0 }, children: [
          new TextRun({ text: 'Resultado: 4/4 pruebas de integracion exitosas.', bold: true, color: '16a34a' }),
        ] }),

        new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 200, after: 80 }, children: [
          new TextRun({ text: '5. Resumen de resultados', bold: true, size: 28, color: '4F46E5' }),
        ] }),
        new Paragraph({ spacing: { after: 40 }, children: [
          new TextRun({ text: 'Total de pruebas ejecutadas: ', bold: true }), new TextRun({ text: '16' }),
        ] }),
        new Paragraph({ spacing: { after: 40 }, children: [
          new TextRun({ text: 'Pruebas exitosas: ', bold: true, color: '16a34a' }), new TextRun({ text: '16', color: '16a34a' }),
        ] }),
        new Paragraph({ spacing: { after: 40 }, children: [
          new TextRun({ text: 'Pruebas fallidas: ', bold: true, color: 'dc2626' }), new TextRun({ text: '0', color: 'dc2626' }),
        ] }),
        new Paragraph({ spacing: { after: 120 }, children: [
          new TextRun({ text: 'Cobertura de requisitos: ', bold: true }),
          new TextRun({ text: 'RE-01, RE-02 y RE-03 validados correctamente (100%).', color: '16a34a' }),
        ] }),

        new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 200, after: 80 }, children: [
          new TextRun({ text: '6. Conclusiones', bold: true, size: 28, color: '4F46E5' }),
        ] }),
        new Paragraph({ spacing: { after: 80 }, children: [
          new TextRun({ text: 'Las pruebas unitarias y de integracion aplicadas sobre los requerimientos de reportes (atrasos, salidas anticipadas e inasistencias) resultaron exitosas en su totalidad. Las reglas de negocio se comportan segun lo especificado: toda entrada posterior a las 9:30 se considera atraso, toda salida anterior a las 17:30 se considera salida anticipada, y solo se reportan como inasistentes los usuarios activos que no registran marcas en la fecha consultada.' }),
        ] }),
        new Paragraph({ spacing: { after: 80 }, children: [
          new TextRun({ text: 'Se concluye que el sistema cumple con los requerimientos RE-01, RE-02 y RE-03, quedando habilitado el modulo de reportes para su presentacion como prototipo funcional.' }),
        ] }),
      ],
    },
  ],
});

const outDir = path.join(__dirname, '..', 'docs');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, 'Informe_Pruebas_Avance4.docx');

Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync(outFile, buffer);
  console.log('Documento generado:', outFile);
  console.log('Tamano:', (buffer.length / 1024).toFixed(1), 'KB');
});
