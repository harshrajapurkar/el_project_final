import sqlite3
import json
import os
from datetime import datetime
from typing import List, Dict, Any, Optional

DB_DIR = os.path.join(os.path.dirname(__file__), '..', 'data')
os.makedirs(DB_DIR, exist_ok=True)
DB_PATH = os.path.join(DB_DIR, 'conversations.db')

def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("PRAGMA journal_mode = WAL;")
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS conversations (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            raw_text TEXT NOT NULL,
            message_count INTEGER DEFAULT 0,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );
    """)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS processing_runs (
            conversation_id TEXT PRIMARY KEY,
            compressed_text TEXT NOT NULL,
            metrics_json TEXT NOT NULL,
            chunks_json TEXT NOT NULL,
            statements_json TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
        );
    """)
    cursor.execute("""
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
    """)
    conn.commit()
    conn.close()

def save_conversation(conv_id: str, title: str, raw_text: str, message_count: int):
    now = datetime.utcnow().isoformat()
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO conversations (id, title, raw_text, message_count, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
            title = excluded.title,
            raw_text = excluded.raw_text,
            message_count = excluded.message_count,
            updated_at = excluded.updated_at
    """, (conv_id, title, raw_text, message_count, now, now))
    conn.commit()
    conn.close()

def save_processing_run(conv_id: str, compressed_text: str, metrics: dict, chunks: list, statements: list):
    now = datetime.utcnow().isoformat()
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO processing_runs (conversation_id, compressed_text, metrics_json, chunks_json, statements_json, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(conversation_id) DO UPDATE SET
            compressed_text = excluded.compressed_text,
            metrics_json = excluded.metrics_json,
            chunks_json = excluded.chunks_json,
            statements_json = excluded.statements_json,
            updated_at = excluded.updated_at
    """, (conv_id, compressed_text, json.dumps(metrics), json.dumps(chunks), json.dumps(statements), now))
    conn.commit()
    conn.close()

def save_corrections(conv_id: str, corrections: list):
    now = datetime.utcnow().isoformat()
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM corrections WHERE conversation_id = ?", (conv_id,))
    for c in corrections:
        c_dict = c if isinstance(c, dict) else c.dict()
        cid = c_dict.get('id', '')
        unique_id = cid if '::' in cid else f"{conv_id}::{cid or int(datetime.utcnow().timestamp())}"
        cursor.execute("""
            INSERT OR REPLACE INTO corrections (id, conversation_id, earlier_stmt_id, earlier_text, new_stmt_id, new_text, correction_type, review_status, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            unique_id,
            conv_id,
            c_dict.get('earlierStatementId', 'N/A'),
            c_dict.get('earlierText', ''),
            c_dict.get('newStatementId', ''),
            c_dict.get('newText', ''),
            c_dict.get('correctionType', 'Status change'),
            c_dict.get('reviewStatus', 'Pending review'),
            now
        ))
    conn.commit()
    conn.close()

def resolve_correction(conv_id: str, index_or_id: str, new_status: str) -> bool:
    now = datetime.utcnow().isoformat()
    conn = get_connection()
    cursor = conn.cursor()
    if index_or_id.isdigit():
        cursor.execute("SELECT id FROM corrections WHERE conversation_id = ? ORDER BY id ASC", (conv_id,))
        rows = cursor.fetchall()
        idx = int(index_or_id)
        if 0 <= idx < len(rows):
            target_id = rows[idx]['id']
            cursor.execute("UPDATE corrections SET review_status = ?, updated_at = ? WHERE id = ?", (new_status, now, target_id))
            conn.commit()
            conn.close()
            return True
        conn.close()
        return False
    else:
        target_id = str(index_or_id)
        prefixed_id = target_id if '::' in target_id else f"{conv_id}::{target_id}"
        cursor.execute("UPDATE corrections SET review_status = ?, updated_at = ? WHERE (id = ? OR id = ?) AND conversation_id = ?", (new_status, now, target_id, prefixed_id, conv_id))
        changes = cursor.rowcount
        conn.commit()
        conn.close()
        return changes > 0

def list_conversations():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT c.id, c.title, c.message_count, c.created_at, c.updated_at,
               p.updated_at as processed_at
        FROM conversations c
        LEFT JOIN processing_runs p ON c.id = p.conversation_id
        ORDER BY c.updated_at DESC
    """)
    rows = cursor.fetchall()
    res = [dict(r) for r in rows]
    conn.close()
    return res

def get_conversation(conv_id: str) -> Optional[dict]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM conversations WHERE id = ?", (conv_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        return None
    conv = dict(row)

    cursor.execute("SELECT * FROM processing_runs WHERE conversation_id = ?", (conv_id,))
    run_row = cursor.fetchone()
    if run_row:
        conv['processingRun'] = {
            'compressedText': run_row['compressed_text'],
            'metrics': json.loads(run_row['metrics_json']),
            'chunks': json.loads(run_row['chunks_json']),
            'statements': json.loads(run_row['statements_json']),
            'updatedAt': run_row['updated_at']
        }
    else:
        conv['processingRun'] = None

    cursor.execute("SELECT * FROM corrections WHERE conversation_id = ? ORDER BY id ASC", (conv_id,))
    corr_rows = cursor.fetchall()
    conv['corrections'] = [{
        'id': r['id'].split('::')[1] if '::' in r['id'] else r['id'],
        'earlierStatementId': r['earlier_stmt_id'],
        'earlierText': r['earlier_text'],
        'newStatementId': r['new_stmt_id'],
        'newText': r['new_text'],
        'correctionType': r['correction_type'],
        'reviewStatus': r['review_status'],
        'updatedAt': r['updated_at']
    } for r in corr_rows]

    conn.close()
    return conv

def delete_conversation(conv_id: str) -> bool:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM corrections WHERE conversation_id = ?", (conv_id,))
    cursor.execute("DELETE FROM processing_runs WHERE conversation_id = ?", (conv_id,))
    cursor.execute("DELETE FROM conversations WHERE id = ?", (conv_id,))
    changes = cursor.rowcount
    conn.commit()
    conn.close()
    return changes > 0

init_db()
