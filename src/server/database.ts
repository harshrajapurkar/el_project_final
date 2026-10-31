/**
 * SQLite Local Storage Manager using Node 22 built-in DatabaseSync
 * Persists conversations, runs, corrections, and verification states locally.
 */

import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';

const DB_DIR = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const DB_FILE = path.join(DB_DIR, 'conversations.db');

export class LocalDatabase {
  private db: DatabaseSync;

  constructor() {
    this.db = new DatabaseSync(DB_FILE);
    this.initializeSchema();
  }

  private initializeSchema() {
    this.db.exec(`
      PRAGMA journal_mode = WAL;

      CREATE TABLE IF NOT EXISTS conversations (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        raw_text TEXT NOT NULL,
        message_count INTEGER DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS processing_runs (
        conversation_id TEXT PRIMARY KEY,
        compressed_text TEXT NOT NULL,
        metrics_json TEXT NOT NULL,
        chunks_json TEXT NOT NULL,
        statements_json TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS corrections (
        id TEXT PRIMARY KEY,
        conversation_id TEXT NOT NULL,
        earlier_stmt_id TEXT,
        earlier_text TEXT,
        new_stmt_id TEXT NOT NULL,
        new_text TEXT NOT NULL,
        correction_type TEXT NOT NULL,
        review_status TEXT NOT NULL DEFAULT 'Pending review',
        updated_at TEXT NOT NULL,
        FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS internal_verifications (
        id TEXT PRIMARY KEY,
        conversation_id TEXT NOT NULL,
        statement_id TEXT NOT NULL,
        extracted_info TEXT NOT NULL,
        category TEXT NOT NULL,
        result TEXT NOT NULL,
        confidence REAL NOT NULL,
        explanation TEXT NOT NULL,
        review_status TEXT NOT NULL DEFAULT 'Pending',
        FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS external_screenings (
        id TEXT PRIMARY KEY,
        conversation_id TEXT NOT NULL,
        claim TEXT NOT NULL,
        source_url TEXT NOT NULL,
        source_domain TEXT NOT NULL,
        source_title TEXT NOT NULL,
        source_excerpt TEXT NOT NULL,
        overlap_score REAL NOT NULL,
        classification TEXT NOT NULL,
        explanation TEXT NOT NULL,
        limitations TEXT NOT NULL,
        human_review_status TEXT NOT NULL DEFAULT 'Unreviewed',
        FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
      );
    `);
  }

  public saveConversation(id: string, title: string, rawText: string, messageCount: number) {
    const now = new Date().toISOString();
    const stmt = this.db.prepare(`
      INSERT INTO conversations (id, title, raw_text, message_count, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        title = excluded.title,
        raw_text = excluded.raw_text,
        message_count = excluded.message_count,
        updated_at = excluded.updated_at
    `);
    stmt.run(id, title, rawText, messageCount, now, now);
  }

  public saveProcessingRun(
    conversationId: string,
    compressedText: string,
    metrics: any,
    chunks: any,
    statements: any
  ) {
    const now = new Date().toISOString();
    const stmt = this.db.prepare(`
      INSERT INTO processing_runs (conversation_id, compressed_text, metrics_json, chunks_json, statements_json, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(conversation_id) DO UPDATE SET
        compressed_text = excluded.compressed_text,
        metrics_json = excluded.metrics_json,
        chunks_json = excluded.chunks_json,
        statements_json = excluded.statements_json,
        updated_at = excluded.updated_at
    `);
    stmt.run(
      conversationId,
      compressedText,
      JSON.stringify(metrics),
      JSON.stringify(chunks),
      JSON.stringify(statements),
      now
    );
  }

  public saveCorrections(conversationId: string, corrections: any[]) {
    // Clear existing for this conversation
    this.db.prepare(`DELETE FROM corrections WHERE conversation_id = ?`).run(conversationId);
    const now = new Date().toISOString();
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO corrections (id, conversation_id, earlier_stmt_id, earlier_text, new_stmt_id, new_text, correction_type, review_status, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const c of corrections) {
      // Ensure unique ID per conversation: e.g. "conv-123::CORR-001"
      const uniqueId = c.id && c.id.includes('::') ? c.id : `${conversationId}::${c.id || Date.now()}`;
      stmt.run(
        uniqueId,
        conversationId,
        c.earlierStatementId || 'N/A',
        c.earlierText || '',
        c.newStatementId || '',
        c.newText || '',
        c.correctionType || 'Status change',
        c.reviewStatus || 'Pending review',
        now
      );
    }
  }

  public resolveCorrection(conversationId: string, correctionIndexOrId: string | number, newStatus: string) {
    const now = new Date().toISOString();
    if (typeof correctionIndexOrId === 'number' || !isNaN(Number(correctionIndexOrId))) {
      // Find correction by offset
      const all = this.getRawCorrections(conversationId);
      const idx = Number(correctionIndexOrId);
      if (all[idx]) {
        this.db.prepare(`UPDATE corrections SET review_status = ?, updated_at = ? WHERE id = ?`).run(
          newStatus,
          now,
          all[idx].id
        );
        return true;
      }
      return false;
    } else {
      const targetId = String(correctionIndexOrId);
      const prefixedId = targetId.includes('::') ? targetId : `${conversationId}::${targetId}`;
      const res = this.db.prepare(`
        UPDATE corrections
        SET review_status = ?, updated_at = ?
        WHERE (id = ? OR id = ?) AND conversation_id = ?
      `).run(newStatus, now, targetId, prefixedId, conversationId);
      return res.changes > 0;
    }
  }

  private getRawCorrections(conversationId: string): any[] {
    return this.db.prepare(`SELECT * FROM corrections WHERE conversation_id = ? ORDER BY id ASC`).all(conversationId) as any[];
  }

  public getCorrections(conversationId: string): any[] {
    const rows = this.getRawCorrections(conversationId);
    return rows.map((r) => {
      // Strip conversationId:: prefix for clean UI display
      const displayId = r.id.includes('::') ? r.id.split('::')[1] : r.id;
      return {
        id: displayId,
        earlierStatementId: r.earlier_stmt_id,
        earlierText: r.earlier_text,
        newStatementId: r.new_stmt_id,
        newText: r.new_text,
        correctionType: r.correction_type,
        reviewStatus: r.review_status,
        updatedAt: r.updated_at,
      };
    });
  }

  public listConversations(): any[] {
    return this.db.prepare(`
      SELECT c.id, c.title, c.message_count, c.created_at, c.updated_at,
             p.updated_at as processed_at
      FROM conversations c
      LEFT JOIN processing_runs p ON c.id = p.conversation_id
      ORDER BY c.updated_at DESC
    `).all() as any[];
  }

  public getConversation(id: string): any | null {
    const conv = this.db.prepare(`SELECT * FROM conversations WHERE id = ?`).get(id) as any;
    if (!conv) return null;

    const run = this.db.prepare(`SELECT * FROM processing_runs WHERE conversation_id = ?`).get(id) as any;
    const corrections = this.getCorrections(id);

    return {
      ...conv,
      processingRun: run
        ? {
            compressedText: run.compressed_text,
            metrics: JSON.parse(run.metrics_json),
            chunks: JSON.parse(run.chunks_json),
            statements: JSON.parse(run.statements_json),
            updatedAt: run.updated_at,
          }
        : null,
      corrections,
    };
  }

  public deleteConversation(id: string): boolean {
    this.db.prepare(`DELETE FROM corrections WHERE conversation_id = ?`).run(id);
    this.db.prepare(`DELETE FROM processing_runs WHERE conversation_id = ?`).run(id);
    this.db.prepare(`DELETE FROM internal_verifications WHERE conversation_id = ?`).run(id);
    this.db.prepare(`DELETE FROM external_screenings WHERE conversation_id = ?`).run(id);
    const res = this.db.prepare(`DELETE FROM conversations WHERE id = ?`).run(id);
    return res.changes > 0;
  }
}

export const localDb = new LocalDatabase();
