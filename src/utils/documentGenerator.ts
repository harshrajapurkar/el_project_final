/**
 * Document Generation Service for Task 4
 * Generates:
 * 1. Editable DOCX documents using 'docx' library.
 * 2. Academic PDF reports using 'pdf-lib'.
 */

import {
  Document,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  AlignmentType,
  Packer,
} from 'docx';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import type {
  ProcessingMetrics,
  TopicCategory,
  Statement,
  CorrectionCandidate,
  InternalVerificationItem,
  ExternalScreeningResult,
  Chunk,
} from './pipeline.ts';

export interface ReportData {
  title: string;
  originalText: string;
  compressedText: string;
  metrics: ProcessingMetrics;
  statements: Statement[];
  chunks: Chunk[];
  corrections: CorrectionCandidate[];
  verifications: InternalVerificationItem[];
  externalScreenings: ExternalScreeningResult[];
  timestamp?: string;
}

export async function generateDocxReport(data: ReportData): Promise<Buffer> {
  const {
    title,
    originalText,
    compressedText,
    metrics,
    statements,
    chunks,
    corrections,
    verifications,
    externalScreenings,
    timestamp = new Date().toLocaleString(),
  } = data;

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          // Title Section
          new Paragraph({
            text: 'SEMESTER EXPERIENTIAL LEARNING (Sem-EL) PROJECT REPORT',
            heading: HeadingLevel.HEADING_2,
            alignment: AlignmentType.CENTER,
            spacing: { after: 120 },
          }),
          new Paragraph({
            text: 'Local Conversation Processing, Compression, Verification & Knowledge Generation',
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: `Report Target: ${title}   |   Generated: ${timestamp}`, italics: true, color: '555555' }),
            ],
            spacing: { after: 300 },
          }),

          // Executive Summary
          new Paragraph({
            text: '1. Executive Summary & Overview',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: 'This document presents the complete academic audit and evaluation of the processed AI dialogue. The pipeline operates entirely locally without external LLM dependencies, performing rule-based normalization, duplicate detection, correction history tracking, internal source-statement verification, external evidence screening, and context compression.',
              }),
            ],
            spacing: { after: 200 },
          }),

          // Processing & Compression Metrics Table
          new Paragraph({
            text: '2. Quantitative Processing & Compression Metrics',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 },
          }),
          createMetricsTable(metrics),

          // Topic-wise Organization & Chunks
          new Paragraph({
            text: '3. Topic-wise Segmentation & Manageable Chunks',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 250, after: 100 },
          }),
          ...chunks.flatMap((chunk) => [
            new Paragraph({
              text: `[${chunk.id}] ${chunk.title}`,
              heading: HeadingLevel.HEADING_3,
              spacing: { before: 120, after: 60 },
            }),
            new Paragraph({
              children: [new TextRun({ text: chunk.summary })],
              spacing: { after: 120 },
            }),
          ]),

          // Corrections and Updates Log
          new Paragraph({
            text: '4. Correction Detection & State Update History',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 250, after: 100 },
          }),
          ...(corrections.length > 0
            ? corrections.map(
                (c) =>
                  new Paragraph({
                    children: [
                      new TextRun({ text: `[${c.id}] `, bold: true }),
                      new TextRun({ text: `Type: ${c.correctionType} | Status: ${c.reviewStatus}\n`, italics: true }),
                      new TextRun({ text: `Prior Statement (${c.earlierStatementId}): `, bold: true, color: 'B91C1C' }),
                      new TextRun({ text: `${c.earlierText}\n` }),
                      new TextRun({ text: `Updated Statement (${c.newStatementId}): `, bold: true, color: '047857' }),
                      new TextRun({ text: `${c.newText}` }),
                    ],
                    spacing: { after: 140 },
                  })
              )
            : [
                new Paragraph({
                  children: [new TextRun({ text: 'No explicit correction statements detected in this dialogue.', italics: true })],
                  spacing: { after: 140 },
                }),
              ]),

          // Internal Factual Verification (Task 2)
          new Paragraph({
            text: '5. Internal Factual Verification & Source Traceability',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 250, after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: 'Notice on Epistemological Boundary: Internal verification confirms source consistency and traceability to the cited conversation statement. It does not establish objective external truth.',
                italics: true,
                color: '4338CA',
              }),
            ],
            spacing: { after: 140 },
          }),
          createVerificationTable(verifications.slice(0, 15)),

          // External Evidence Screening (Task 3)
          new Paragraph({
            text: '6. External Fact-Checking & Evidence Screening',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 250, after: 100 },
          }),
          ...(externalScreenings.length > 0
            ? externalScreenings.flatMap((scr) => [
                new Paragraph({
                  children: [
                    new TextRun({ text: `Claim Tested: `, bold: true }),
                    new TextRun({ text: `"${scr.claim}"\n` }),
                    new TextRun({ text: `Classification: `, bold: true }),
                    new TextRun({ text: `${scr.classification} (Keyword Overlap: ${Math.round(scr.overlapScore * 100)}%)\n` }),
                    new TextRun({ text: `Source: `, bold: true }),
                    new TextRun({ text: `${scr.sourceTitle} (${scr.sourceUrl})\n` }),
                    new TextRun({ text: `Retrieved Excerpt: `, bold: true }),
                    new TextRun({ text: `"${scr.sourceExcerpt}"\n`, italics: true }),
                    new TextRun({ text: `Methodology Note: ${scr.limitations}`, color: '6B7280', italics: true }),
                  ],
                  spacing: { after: 180 },
                }),
              ])
            : [
                new Paragraph({
                  children: [new TextRun({ text: 'No external URL screenings performed for this session.', italics: true })],
                  spacing: { after: 140 },
                }),
              ]),

          // Compact Reusable Knowledge Summary
          new Paragraph({
            text: '7. Reusable Compact Conversation Context',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 250, after: 100 },
          }),
          new Paragraph({
            children: [new TextRun({ text: compressedText })],
            spacing: { after: 200 },
          }),

          // Academic Limitations & Disclaimer
          new Paragraph({
            text: '8. Academic Evaluation Limitations & Ethical Notice',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 250, after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: '1. Rule-based heuristic extraction does not substitute for domain expert review.\n2. Internal consistency checks verify speaker fidelity rather than external validity.\n3. External evidence screening is based on lexical keyword overlap, which may fail on subtle semantic nuances.\n4. All processing occurred locally with zero external LLM leakage.',
                color: '4B5563',
              }),
            ],
            spacing: { after: 200 },
          }),
        ],
      },
    ],
  });

  return await Packer.toBuffer(doc);
}

function createMetricsTable(m: ProcessingMetrics): Table {
  const borderNone = { style: BorderStyle.SINGLE, size: 1, color: 'D1D5DB' };
  const rows = [
    ['Metric Description', 'Measured Value', 'Formula / Reference'],
    ['Original Word Count', `${m.originalWordCount} words`, 'Whitespace tokenization of input text'],
    ['Original Character Count', `${m.originalCharCount} chars`, 'Raw character length'],
    ['Cleaned Statements Extracted', `${m.cleanedStatementCount}`, 'Normalized sentence extraction'],
    ['Exact Duplicates Detected', `${m.exactDuplicatesCount}`, 'Identical normalized strings'],
    ['Near-Duplicates Identified', `${m.nearDuplicatesCount}`, 'Jaccard similarity threshold >= 0.72'],
    ['Important Knowledge Items', `${m.importantStatementsCount}`, 'Rule-based importance filter'],
    ['Corrections / State Changes', `${m.correctionsDetectedCount}`, 'Superseded statement tracking'],
    ['Topics Identified', `${m.topicsCount}`, 'Distinct thematic categories'],
    ['Manageable Chunks Created', `${m.chunksCount}`, 'Thematic statement clusters'],
    ['Compressed Word Count', `${m.compressedWordCount} words`, 'Retained knowledge representation'],
    ['Percentage Word Reduction', `${m.percentageReduction}%`, '((Original - Output) / Original) * 100'],
    ['Compression Ratio', `${m.compressionRatio}`, 'Output words / Original words'],
    ['Estimated Token Count', `~${m.estimatedTokens} tokens`, 'Word count * 1.33 (clearly labeled estimate)'],
    ['Processing Latency', `${m.processingTimeMs} ms`, 'Local execution time on host CPU'],
  ];

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: rows.map((r, rowIdx) => {
      const isHeader = rowIdx === 0;
      return new TableRow({
        children: r.map((cellText) => {
          return new TableCell({
            borders: { top: borderNone, bottom: borderNone, left: borderNone, right: borderNone },
            shading: isHeader ? { fill: 'F3F4F6' } : undefined,
            children: [
              new Paragraph({
                children: [new TextRun({ text: cellText, bold: isHeader })],
              }),
            ],
          });
        }),
      });
    }),
  });
}

function createVerificationTable(verifs: InternalVerificationItem[]): Table {
  const borderNone = { style: BorderStyle.SINGLE, size: 1, color: 'D1D5DB' };
  const header = ['ID', 'Original Source Statement', 'Category', 'Internal Verification Result'];

  const rows = [header, ...verifs.map((v) => [v.statementId, v.extractedInformation, v.category, v.result])];

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: rows.map((r, rowIdx) => {
      const isHeader = rowIdx === 0;
      return new TableRow({
        children: r.map((cellText) => {
          return new TableCell({
            borders: { top: borderNone, bottom: borderNone, left: borderNone, right: borderNone },
            shading: isHeader ? { fill: 'EEF2FF' } : undefined,
            children: [
              new Paragraph({
                children: [new TextRun({ text: cellText, bold: isHeader, size: isHeader ? 20 : 18 })],
              }),
            ],
          });
        }),
      });
    }),
  });
}

export async function generatePdfReport(data: ReportData): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontItalic = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  let page = pdfDoc.addPage([595.28, 841.89]); // A4
  const { width, height } = page.getSize();
  let y = height - 50;

  function checkPage(neededSpace: number = 40) {
    if (y < neededSpace) {
      page = pdfDoc.addPage([595.28, 841.89]);
      y = height - 50;
    }
  }

  // Header Banner
  page.drawRectangle({
    x: 40,
    y: y - 10,
    width: width - 80,
    height: 35,
    color: rgb(0.12, 0.16, 0.28),
  });

  page.drawText('SEMESTER EXPERIENTIAL LEARNING (Sem-EL) EVALUATION', {
    x: 50,
    y: y + 8,
    size: 11,
    font: fontBold,
    color: rgb(1, 1, 1),
  });

  page.drawText('Local Conversation Processing, Compression & Verification System', {
    x: 50,
    y: y - 4,
    size: 9,
    font: fontRegular,
    color: rgb(0.85, 0.88, 0.95),
  });

  y -= 45;

  // Title & Metadata
  page.drawText(`Document: ${data.title}`, {
    x: 40,
    y,
    size: 14,
    font: fontBold,
    color: rgb(0.1, 0.1, 0.1),
  });
  y -= 16;

  page.drawText(`Generated: ${new Date().toLocaleString()}  |  Tasks 1, 2, 3 & 4 Integrated Pipeline Report`, {
    x: 40,
    y,
    size: 9,
    font: fontItalic,
    color: rgb(0.35, 0.35, 0.35),
  });
  y -= 25;

  // Section 1: Executive Summary
  page.drawText('1. Executive Overview', { x: 40, y, size: 12, font: fontBold, color: rgb(0.15, 0.2, 0.4) });
  y -= 15;
  const summaryText =
    'This report documents the local end-to-end processing of conversational data. The system extracts statements, detects exact and near duplicates, organizes content into topic chunks, tracks correction history, validates claims against the source utterance, and computes exact compression metrics without external LLMs.';
  y = wrapText(page, summaryText, 40, y, width - 80, 9, fontRegular);
  y -= 15;

  // Section 2: Metrics
  checkPage(150);
  page.drawText('2. Measurable Evaluation Metrics', { x: 40, y, size: 12, font: fontBold, color: rgb(0.15, 0.2, 0.4) });
  y -= 16;

  const m = data.metrics;
  const metricItems = [
    `Original Words: ${m.originalWordCount}  |  Original Chars: ${m.originalCharCount}  |  Messages: ${m.originalMessageCount}`,
    `Cleaned Statements: ${m.cleanedStatementCount}  |  Exact Duplicates: ${m.exactDuplicatesCount}  |  Near-Duplicates: ${m.nearDuplicatesCount}`,
    `Topics: ${m.topicsCount}  |  Chunks: ${m.chunksCount}  |  Important Items: ${m.importantStatementsCount}  |  Corrections: ${m.correctionsDetectedCount}`,
    `Compressed Words: ${m.compressedWordCount}  |  Word Reduction: ${m.percentageReduction}%  |  Compression Ratio: ${m.compressionRatio}`,
    `Estimated Tokens (words * 1.33): ~${m.estimatedTokens}  |  Approx Subwords: ~${m.actualTokensApprox}  |  Latency: ${m.processingTimeMs} ms`,
  ];

  for (const item of metricItems) {
    page.drawText(`• ${item}`, { x: 50, y, size: 8.5, font: fontRegular, color: rgb(0.15, 0.15, 0.15) });
    y -= 13;
  }
  y -= 15;

  // Section 3: Topic Chunks
  checkPage(120);
  page.drawText('3. Topic Segmentation & Manageable Chunks', { x: 40, y, size: 12, font: fontBold, color: rgb(0.15, 0.2, 0.4) });
  y -= 15;

  for (const chunk of data.chunks.slice(0, 6)) {
    checkPage(40);
    page.drawText(`[${chunk.id}] ${chunk.title}`, { x: 45, y, size: 9.5, font: fontBold, color: rgb(0.1, 0.3, 0.5) });
    y -= 12;
    const lines = chunk.summary.split('\n').slice(0, 3);
    for (const l of lines) {
      y = wrapText(page, l, 55, y, width - 95, 8, fontRegular);
    }
    y -= 6;
  }
  y -= 12;

  // Section 4: Corrections
  checkPage(90);
  page.drawText('4. Correction Candidates & State Tracking', { x: 40, y, size: 12, font: fontBold, color: rgb(0.15, 0.2, 0.4) });
  y -= 15;
  if (data.corrections.length > 0) {
    for (const corr of data.corrections) {
      checkPage(35);
      page.drawText(`[${corr.id}] ${corr.correctionType} (${corr.reviewStatus})`, { x: 50, y, size: 8.5, font: fontBold, color: rgb(0.7, 0.1, 0.1) });
      y -= 11;
      page.drawText(`Earlier (${corr.earlierStatementId}): ${corr.earlierText.slice(0, 75)}`, { x: 60, y, size: 8, font: fontItalic, color: rgb(0.4, 0.4, 0.4) });
      y -= 11;
      page.drawText(`Updated (${corr.newStatementId}): ${corr.newText.slice(0, 75)}`, { x: 60, y, size: 8, font: fontRegular, color: rgb(0.05, 0.5, 0.2) });
      y -= 12;
    }
  } else {
    page.drawText('No conflicting or corrected statements detected.', { x: 50, y, size: 8.5, font: fontItalic, color: rgb(0.4, 0.4, 0.4) });
    y -= 15;
  }

  // Section 5: Internal Verification
  checkPage(100);
  page.drawText('5. Internal Source Traceability Check (Task 2)', { x: 40, y, size: 12, font: fontBold, color: rgb(0.15, 0.2, 0.4) });
  y -= 12;
  page.drawText('Verification confirms conversation consistency with cited utterance, not external truth.', { x: 40, y, size: 8, font: fontItalic, color: rgb(0.3, 0.3, 0.7) });
  y -= 14;

  for (const v of data.verifications.slice(0, 8)) {
    checkPage(25);
    const color = v.result.includes('Supported') ? rgb(0.05, 0.5, 0.2) : rgb(0.7, 0.4, 0.05);
    page.drawText(`[${v.statementId}] ${v.result}`, { x: 50, y, size: 8, font: fontBold, color });
    y -= 10;
    y = wrapText(page, `"${v.extractedInformation}"`, 60, y, width - 100, 7.5, fontRegular);
    y -= 4;
  }

  // Footer Disclaimer
  checkPage(40);
  y -= 10;
  page.drawLine({ start: { x: 40, y }, end: { x: width - 40, y }, thickness: 0.5, color: rgb(0.7, 0.7, 0.7) });
  y -= 12;
  page.drawText('Academic Disclaimer: Local rule-based processing prototype. External screening uses keyword overlap. Sem-EL Evaluation.', {
    x: 40,
    y,
    size: 7,
    font: fontItalic,
    color: rgb(0.4, 0.4, 0.4),
  });

  return await pdfDoc.save();
}

function wrapText(
  page: any,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  fontSize: number,
  font: any
): number {
  const words = text.split(/\s+/);
  let line = '';
  let currentY = y;

  for (const w of words) {
    const testLine = line ? `${line} ${w}` : w;
    const testWidth = font.widthOfTextAtSize(testLine, fontSize);
    if (testWidth > maxWidth && line) {
      page.drawText(line, { x, y: currentY, size: fontSize, font, color: rgb(0.15, 0.15, 0.15) });
      currentY -= fontSize + 3;
      line = w;
    } else {
      line = testLine;
    }
  }

  if (line) {
    page.drawText(line, { x, y: currentY, size: fontSize, font, color: rgb(0.15, 0.15, 0.15) });
    currentY -= fontSize + 3;
  }

  return currentY;
}
