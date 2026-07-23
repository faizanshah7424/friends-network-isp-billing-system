import io
from reportlab.lib.pagesizes import A4, A5, landscape
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

def number_to_words_pk(num: int) -> str:
    if num <= 0:
        return "ZERO RUPEES ONLY"
    
    units = ["", "ONE", "TWO", "THREE", "FOUR", "FIVE", "SIX", "SEVEN", "EIGHT", "NINE", "TEN",
             "ELEVEN", "TWELVE", "THIRTEEN", "FOURTEEN", "FIFTEEN", "SIXTEEN", "SEVENTEEN", "EIGHTEEN", "NINETEEN"]
    tens = ["", "", "TWENTY", "THIRTY", "FORTY", "FIFTY", "SIXTY", "SEVENTY", "EIGHTY", "NINETY"]

    def _convert_below_thousand(n):
        if n == 0:
            return ""
        elif n < 20:
            return units[n]
        elif n < 100:
            return tens[n // 10] + (" " + units[n % 10] if n % 10 != 0 else "")
        else:
            return units[n // 100] + " HUNDRED" + (" AND " + _convert_below_thousand(n % 100) if n % 100 != 0 else "")

    def _convert(n):
        if n == 0:
            return ""
        parts = []
        if n >= 10000000:
            crore = n // 10000000
            parts.append(_convert(crore) + " CRORE")
            n %= 10000000
        if n >= 100000:
            lakh = n // 100000
            parts.append(_convert_below_thousand(lakh) + " LAKH")
            n %= 100000
        if n >= 1000:
            thousand = n // 1000
            parts.append(_convert_below_thousand(thousand) + " THOUSAND")
            n %= 1000
        if n > 0:
            parts.append(_convert_below_thousand(n))
        return " ".join(parts)

    words = _convert(num).strip()
    return f"{words} RUPEE ONLY" if num == 1 else f"{words} RUPEES ONLY"

def generate_invoice_pdf(invoice_dict: dict, customer_dict: dict = None) -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )
    styles = getSampleStyleSheet()

    # Custom styles
    title_style = ParagraphStyle(
        'InvoiceTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=colors.HexColor('#1e293b')
    )
    subtitle_style = ParagraphStyle(
        'InvoiceSubTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=13,
        textColor=colors.HexColor('#64748b')
    )
    body_style = ParagraphStyle(
        'InvoiceBody',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=colors.HexColor('#334155')
    )
    header_col_style = ParagraphStyle(
        'HeaderColStyle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=12,
        textColor=colors.HexColor('#1e293b')
    )

    elements = []

    # 1. Title Header
    elements.append(Paragraph("Friends Network", title_style))
    elements.append(Paragraph("INTERNET SERVICE PROVIDER", subtitle_style))
    elements.append(Spacer(1, 15))

    # 2. Metadata & Address Info
    inv_num = invoice_dict.get("invoice_number", invoice_dict.get("id", "00529"))
    if "-" in str(inv_num):
        inv_num_clean = str(inv_num).split("-")[-1]
    else:
        inv_num_clean = str(inv_num)

    inv_date = invoice_dict.get("billing_date", "Jul 01, 2026")
    due_date = invoice_dict.get("due_date", "Jul 10, 2026")
    cust_name = customer_dict.get("name", invoice_dict.get("customer_name", "Valued Customer")) if customer_dict else invoice_dict.get("customer_name", "Valued Customer")
    cust_address = customer_dict.get("address", "Karachi, Pakistan") if customer_dict else "Karachi, Pakistan"

    billed_by_html = "<b>Billed By</b><br/>Friends Network<br/>Pakistan<br/>Phone: +92 346 2523505"
    billed_to_html = f"<b>Bill No#</b> {inv_num_clean}<br/><b>Invoice Date:</b> {inv_date}<br/><b>Due Date:</b> {due_date}<br/><br/><b>Billed To:</b><br/>{cust_name}<br/>{cust_address}"

    data_header = [
        [Paragraph(billed_by_html, body_style), Paragraph(billed_to_html, body_style)]
    ]
    t_head = Table(data_header, colWidths=[260, 260])
    t_head.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
    ]))
    elements.append(t_head)
    elements.append(Spacer(1, 20))

    # 3. Line Items Table
    pkg_name = customer_dict.get("package_name", "Internet Package") if customer_dict else "Internet Package"
    charges = int(invoice_dict.get("monthly_charges", invoice_dict.get("grand_total", 5000)))
    
    speed_info = customer_dict.get("speed", "High Speed") if customer_dict else "High Speed"
    item_desc = f"Monthly Subscription of Internet {speed_info} with {pkg_name}"

    items_data = [
        [
            Paragraph("Service's", header_col_style),
            Paragraph("Quantity", header_col_style),
            Paragraph("Rate", header_col_style),
            Paragraph("Amount", header_col_style)
        ],
        [
            Paragraph(item_desc, body_style),
            Paragraph("1", body_style),
            Paragraph(f"PKR {charges:,}", body_style),
            Paragraph(f"PKR {charges:,.2f}", body_style)
        ]
    ]
    t_items = Table(items_data, colWidths=[260, 60, 100, 100])
    t_items.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#f1f5f9')),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
        ('ALIGN', (1,0), (-1,-1), 'RIGHT'),
    ]))
    elements.append(t_items)
    elements.append(Spacer(1, 15))

    # 4. Totals & Bank Details Table
    grand_total = int(invoice_dict.get("grand_total", charges))
    discount = int(invoice_dict.get("discount", 0))
    total_in_words = number_to_words_pk(grand_total)

    left_totals_html = f"<b>Total (in words) :</b> {total_in_words}<br/><br/><b>Bank Details</b><br/>Account Name: Muhammad Shahid<br/>Account Number: PK45BAHL5011008100779001<br/>Bank: Bank Al Habib"
    right_totals_html = f"Discount: PKR {discount:,.2f}<br/><br/><b>Total (PKR): PKR {grand_total:,.2f}</b>"

    totals_data = [
        [Paragraph(left_totals_html, body_style), Paragraph(right_totals_html, body_style)]
    ]
    t_totals = Table(totals_data, colWidths=[320, 200])
    t_totals.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('ALIGN', (1,0), (1,0), 'RIGHT'),
    ]))
    elements.append(t_totals)
    elements.append(Spacer(1, 20))

    # 5. Terms & Conditions
    terms_html = """<b>Terms and Conditions</b><br/>
1. Internet subscription period is from the 10th of each month to the 10th of the following month.<br/>
2. Billing cycle is from the 1st to the 10th of every month.<br/>
3. Subscription charges must be paid in advance to avoid service interruption.<br/>
4. If a new client joins mid-month, subscription charges will still be payable in advance for the full cycle (10th to 10th).<br/>
5. One-time charges (OTC) apply at the time of installation and are non-refundable."""

    elements.append(Paragraph(terms_html, body_style))

    doc.build(elements)
    buffer.seek(0)
    return buffer.getvalue()

def generate_receipt_pdf(payment_dict: dict, customer_dict: dict = None) -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A5,
        rightMargin=24,
        leftMargin=24,
        topMargin=24,
        bottomMargin=24
    )
    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        'ReceiptTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=16,
        leading=20,
        textColor=colors.HexColor('#065f46')
    )
    subtitle_style = ParagraphStyle(
        'ReceiptSubTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=12,
        textColor=colors.HexColor('#047857')
    )
    body_style = ParagraphStyle(
        'ReceiptBody',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=colors.HexColor('#1f2937')
    )

    elements = []
    elements.append(Paragraph("Friends Network", title_style))
    elements.append(Paragraph("OFFICIAL PAYMENT RECEIPT", subtitle_style))
    elements.append(Spacer(1, 10))

    rec_num = payment_dict.get("receipt_number", payment_dict.get("id", "REC-001"))
    rec_date = payment_dict.get("payment_date", "Jul 23, 2026")
    cust_name = customer_dict.get("name", payment_dict.get("customer_name", "Subscriber")) if customer_dict else payment_dict.get("customer_name", "Subscriber")
    cust_id = payment_dict.get("customer_id", "")
    amount = int(payment_dict.get("amount_received", 0))
    method = payment_dict.get("payment_method", "Cash")
    ref_num = payment_dict.get("reference_number", "N/A") or "N/A"
    received_by = payment_dict.get("received_by", "Admin")

    receipt_info_html = f"<b>Receipt No:</b> {rec_num}<br/><b>Date:</b> {rec_date}<br/><b>Customer ID:</b> {cust_id}<br/><b>Customer Name:</b> {cust_name}"
    elements.append(Paragraph(receipt_info_html, body_style))
    elements.append(Spacer(1, 12))

    table_data = [
        [Paragraph("<b>Payment Details</b>", body_style), Paragraph("<b>Value</b>", body_style)],
        [Paragraph("Amount Paid", body_style), Paragraph(f"<b>PKR {amount:,}</b>", body_style)],
        [Paragraph("Payment Method", body_style), Paragraph(method, body_style)],
        [Paragraph("Reference No", body_style), Paragraph(ref_num, body_style)],
        [Paragraph("Received By", body_style), Paragraph(received_by, body_style)],
    ]

    t_rec = Table(table_data, colWidths=[200, 170])
    t_rec.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#ecfdf5')),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#a7f3d0')),
    ]))
    elements.append(t_rec)
    elements.append(Spacer(1, 15))

    words = number_to_words_pk(amount)
    elements.append(Paragraph(f"<b>Amount in Words:</b> {words}", body_style))
    elements.append(Spacer(1, 15))
    elements.append(Paragraph("Thank you for your payment. This receipt is computer-generated.", subtitle_style))

    doc.build(elements)
    buffer.seek(0)
    return buffer.getvalue()

def generate_report_pdf(report_title: str, summary_rows: list, headers: list, data_rows: list) -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=landscape(A4),
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )
    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        'ReportTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=18,
        leading=22,
        textColor=colors.HexColor('#1e293b')
    )
    body_style = ParagraphStyle(
        'ReportBody',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=11,
        textColor=colors.HexColor('#334155')
    )
    header_style = ParagraphStyle(
        'ReportHeaderCol',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=11,
        textColor=colors.HexColor('#0f172a')
    )

    elements = []
    elements.append(Paragraph("Friends Network — " + report_title, title_style))
    elements.append(Spacer(1, 10))

    if summary_rows:
        sum_html = "<br/>".join([f"<b>{k}:</b> {v}" for k, v in summary_rows])
        elements.append(Paragraph(sum_html, body_style))
        elements.append(Spacer(1, 12))

    # Construct main table
    table_content = [[Paragraph(h, header_style) for h in headers]]
    for row in data_rows:
        table_content.append([Paragraph(str(cell), body_style) for cell in row])

    col_count = len(headers)
    avail_width = 770
    col_w = avail_width / max(col_count, 1)

    t_report = Table(table_content, colWidths=[col_w] * col_count)
    t_report.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#f1f5f9')),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
    ]))
    elements.append(t_report)

    doc.build(elements)
    buffer.seek(0)
    return buffer.getvalue()
