import test from 'node:test';
import assert from 'node:assert/strict';
import { generateDocxReport, generatePdfReport } from './documentGenerator';
import { calculateMetrics, compressContext } from './pipeline';

test('generateDocxReport and generatePdfReport successfully generate binary buffers', async () => {
  const sampleStatements = [
    { id: 'S-001', messageId: 'M-1', role: 'user' as const, text: 'We agreed to use SQLite for persistence.', topic: 'Decisions and Plans' as const, isImportant: true },
    { id: 'S-002', messageId: 'M-2', role: 'user' as const, text: 'Correction: The database port is 5432 instead of 3306.', topic: 'Corrections and Updates' as const, isImportant: true },
  ];

  const { compressedText, chunks } = compressContext(sampleStatements, 'balanced');
  const metrics = calculateMetrics('Sample raw text', [], sampleStatements, [], [], compressedText, chunks, 12);

  const reportData = {
    title: 'Test Sem-EL Report',
    originalText: 'Sample raw conversation text',
    compressedText,
    metrics,
    statements: sampleStatements,
    chunks,
    corrections: [
      {
        id: 'CORR-001',
        earlierStatementId: 'S-001',
        earlierText: 'Initial setup',
        newStatementId: 'S-002',
        newText: 'Correction: The database port is 5432',
        correctionType: 'Requirement modification' as const,
        reviewStatus: 'Pending review' as const,
      },
    ],
    verifications: [
      {
        id: 'VER-001',
        statementId: 'S-001',
        extractedInformation: 'SQLite persistence',
        category: 'Decisions and Plans' as const,
        originalSourceText: 'We agreed to use SQLite',
        speakerRole: 'user' as const,
        result: 'Supported by original conversation' as const,
        confidence: 0.95,
        explanation: 'Direct match',
        reviewStatus: 'Verified' as const,
      },
    ],
    externalScreenings: [
      {
        claim: 'SQLite is serverless',
        sourceUrl: 'https://sqlite.org',
        sourceDomain: 'sqlite.org',
        sourceTitle: 'About SQLite',
        sourceExcerpt: 'SQLite is an in-process library that implements a self-contained, serverless, zero-configuration, transactional SQL database engine.',
        overlapScore: 0.75,
        classification: 'Supported' as const,
        explanation: 'High keyword match',
        limitations: 'Prototype screening rule',
        humanReviewStatus: 'Validated' as const,
      },
    ],
  };

  const docxBuf = await generateDocxReport(reportData);
  assert.ok(docxBuf.length > 500);

  const pdfBytes = await generatePdfReport(reportData);
  assert.ok(pdfBytes.length > 500);
});
