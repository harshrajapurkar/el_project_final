import io
import time
from typing import Dict, Any, List

def generate_docx(data: Dict[str, Any]) -> io.BytesIO:
    import docx
    from docx.shared import Inches, Pt, RGBColor
    from docx.enum.text import WD_ALIGN_PARAGRAPH

    doc = docx.Document()

    # Header / Title
    title_p = doc.add_paragraph()
    title_run = title_p.add_run("SEMESTER EXPERIENTIAL LEARNING (Sem-EL) PROJECT REPORT")
    title_run.bold = True
    title_run.font.size = Pt(14)
    title_p.alignment = WD_ALIGN_PARAGRAPH.CENTER

    sub_p = doc.add_paragraph()
    sub_run = sub_p.add_run("Local Conversation Processing, Compression, Verification & Knowledge Generation")
    sub_run.bold = True
    sub_run.font.size = Pt(16)
    sub_p.alignment = WD_ALIGN_PARAGRAPH.CENTER

    meta_p = doc.add_paragraph()
    meta_run = meta_p.add_run(f"Target: {data.get('title', 'Sem-EL Conversation')}   |   Generated: {time.strftime('%Y-%m-%d %H:%M:%S')}")
    meta_run.italic = True
    meta_run.font.color.rgb = RGBColor(100, 100, 100)
    meta_p.alignment = WD_ALIGN_PARAGRAPH.CENTER

    # 1. Overview
    doc.add_heading("1. Executive Summary & Overview", level=2)
    doc.add_paragraph(
        "This academic report presents the local, private transformation of conversational dialogue into compact, "
        "traceable knowledge. All operations are executed locally using rule-based classification, exact and near-duplicate "
        "detection, state-update tracking, internal source-statement verification, and external keyword screening without external LLMs."
    )

    # 2. Metrics Table
    doc.add_heading("2. Quantitative Processing & Compression Metrics", level=2)
    m = data.get('metrics', {})
    table = doc.add_table(rows=1, cols=3)
    hdr_cells = table.rows[0].cells
    hdr_cells[0].text = "Metric Description"
    hdr_cells[1].text = "Measured Value"
    hdr_cells[2].text = "Formula / Method"

    metric_rows = [
        ("Original Word Count", f"{m.get('originalWordCount', 0)} words", "Whitespace word tokens"),
        ("Original Character Count", f"{m.get('originalCharCount', 0)} chars", "Raw input character length"),
        ("Cleaned Statements", f"{m.get('cleanedStatementCount', 0)}", "Normalized sentence parsing"),
        ("Exact Duplicates", f"{m.get('exactDuplicatesCount', 0)}", "Identical string normalization"),
        ("Near-Duplicates", f"{m.get('nearDuplicatesCount', 0)}", "Jaccard similarity >= 0.72"),
        ("Important Statements", f"{m.get('importantStatementsCount', 0)}", "Rule-based importance filter"),
        ("Corrections / Updates", f"{m.get('correctionsDetectedCount', 0)}", "State change detection"),
        ("Compressed Word Count", f"{m.get('compressedWordCount', 0)} words", "Retained knowledge size"),
        ("Percentage Reduction", f"{m.get('percentageReduction', 0)}%", "((Original - Output) / Original) * 100"),
        ("Compression Ratio", f"{m.get('compressionRatio', 0)}", "Output words / Original words"),
        ("Estimated Tokens", f"~{m.get('estimatedTokens', 0)} tokens", "Words * 1.33 (approximate estimate)"),
        ("Processing Time", f"{m.get('processingTimeMs', 0)} ms", "Host CPU execution latency"),
    ]

    for desc, val, formula in metric_rows:
        row_cells = table.add_row().cells
        row_cells[0].text = desc
        row_cells[1].text = val
        row_cells[2].text = formula

    # 3. Chunks
    doc.add_heading("3. Topic Segmentation & Manageable Chunks", level=2)
    for chunk in data.get('chunks', []):
        doc.add_heading(f"[{chunk.get('id')}] {chunk.get('title')}", level=3)
        doc.add_paragraph(chunk.get('summary', ''))

    # 4. Corrections
    doc.add_heading("4. Correction Candidates & State History", level=2)
    corrections = data.get('corrections', [])
    if corrections:
        for c in corrections:
            p = doc.add_paragraph()
            r1 = p.add_run(f"[{c.get('id')}] Type: {c.get('correctionType')} | Status: {c.get('reviewStatus')}\n")
            r1.bold = True
            r2 = p.add_run(f"Earlier ({c.get('earlierStatementId')}): {c.get('earlierText')}\n")
            r2.font.color.rgb = RGBColor(180, 0, 0)
            r3 = p.add_run(f"Updated ({c.get('newStatementId')}): {c.get('newText')}")
            r3.font.color.rgb = RGBColor(0, 130, 40)
    else:
        doc.add_paragraph("No corrections or contradictory statements detected.")

    # 5. Internal Verification
    doc.add_heading("5. Internal Factual Verification & Source Traceability", level=2)
    note_p = doc.add_paragraph()
    note_r = note_p.add_run("Verification confirms fidelity to the original conversation statement, not objective real-world truth.")
    note_r.italic = True
    note_r.font.color.rgb = RGBColor(60, 60, 180)

    verifs = data.get('verifications', [])[:15]
    if verifs:
        v_table = doc.add_table(rows=1, cols=4)
        v_hdr = v_table.rows[0].cells
        v_hdr[0].text = "ID"
        v_hdr[1].text = "Source Statement"
        v_hdr[2].text = "Category"
        v_hdr[3].text = "Result"
        for v in verifs:
            row = v_table.add_row().cells
            row[0].text = v.get('statementId', '')
            row[1].text = v.get('extractedInformation', '')
            row[2].text = v.get('category', '')
            row[3].text = v.get('result', '')

    # 6. Compressed Reusable Context
    doc.add_heading("6. Reusable Compact Conversation Context", level=2)
    doc.add_paragraph(data.get('compressedText', ''))

    buffer = io.BytesIO()
    doc.save(buffer)
    buffer.seek(0)
    return buffer

def generate_pdf(data: Dict[str, Any]) -> io.BytesIO:
    from reportlab.lib.pagesizes import letter
    from reportlab.pdfgen import canvas

    buffer = io.BytesIO()
    p = canvas.Canvas(buffer, pagesize=letter)
    width, height = letter
    y = height - 50

    p.setFont("Helvetica-Bold", 14)
    p.drawString(40, y, "SEMESTER EXPERIENTIAL LEARNING (Sem-EL) REPORT")
    y -= 18
    p.setFont("Helvetica-Bold", 11)
    p.drawString(40, y, f"Subject: {data.get('title', 'Sem-EL Conversation')}")
    y -= 15
    p.setFont("Helvetica", 9)
    p.drawString(40, y, f"Generated: {time.strftime('%Y-%m-%d %H:%M:%S')}  |  Local Processing & Traceability Audit")
    y -= 25

    # Section 1
    p.setFont("Helvetica-Bold", 11)
    p.drawString(40, y, "1. Processing Metrics Summary")
    y -= 15
    p.setFont("Helvetica", 8.5)
    m = data.get('metrics', {})
    metrics_lines = [
        f"Original Words: {m.get('originalWordCount', 0)}  |  Original Chars: {m.get('originalCharCount', 0)}  |  Messages: {m.get('originalMessageCount', 0)}",
        f"Cleaned Statements: {m.get('cleanedStatementCount', 0)}  |  Exact Duplicates: {m.get('exactDuplicatesCount', 0)}  |  Near-Duplicates: {m.get('nearDuplicatesCount', 0)}",
        f"Topics: {m.get('topicsCount', 0)}  |  Chunks: {m.get('chunksCount', 0)}  |  Important Items: {m.get('importantStatementsCount', 0)}",
        f"Compressed Words: {m.get('compressedWordCount', 0)}  |  Word Reduction: {m.get('percentageReduction', 0)}%  |  Ratio: {m.get('compressionRatio', 0)}",
        f"Estimated Tokens: ~{m.get('estimatedTokens', 0)}  |  Processing Latency: {m.get('processingTimeMs', 0)} ms",
    ]
    for line in metrics_lines:
        p.drawString(50, y, f"• {line}")
        y -= 12
    y -= 15

    # Section 2
    p.setFont("Helvetica-Bold", 11)
    p.drawString(40, y, "2. Topic Chunks (Sample)")
    y -= 15
    p.setFont("Helvetica", 8.5)
    for c in data.get('chunks', [])[:4]:
        p.drawString(50, y, f"[{c.get('id')}] {c.get('title')}")
        y -= 11
        for s in c.get('summary', '').split('\n')[:2]:
            p.drawString(60, y, s[:90])
            y -= 10
        y -= 4
    y -= 12

    # Section 3: Internal verification
    p.setFont("Helvetica-Bold", 11)
    p.drawString(40, y, "3. Internal Source Traceability (Task 2)")
    y -= 12
    p.setFont("Helvetica-Oblique", 8)
    p.drawString(40, y, "Confirms consistency with original utterance; does not claim objective real-world truth.")
    y -= 14
    p.setFont("Helvetica", 8)
    for v in data.get('verifications', [])[:6]:
        p.drawString(50, y, f"[{v.get('statementId')}] {v.get('result')}: \"{v.get('extractedInformation', '')[:65]}\"")
        y -= 11

    p.showPage()
    p.save()
    buffer.seek(0)
    return buffer
