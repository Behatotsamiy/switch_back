interface TicketTemplateData {
  fullName: string;
  eventTitle: string;
  eventDate: string;
  eventLocation: string;
  ticketNumber: string;
  qrCodeDataUrl: string;
}

export function getTicketHtml(data: TicketTemplateData): string {
  return `
<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="UTF-8">
<style>
  @page { size: 440px 780px; margin: 0; }
  body {
    margin: 0;
    width: 440px;
    font-family: 'Georgia', serif;
    background: #f3e8ff;
    box-sizing: border-box;
  }
  .card {
    background: white;
    margin: 20px;
    border-radius: 28px;
    overflow: hidden;
    border: 1px solid #e9d5ff;
    box-shadow: 0 20px 40px -20px rgba(109,47,214,0.25);
  }
  .header {
    background: linear-gradient(135deg, #6d2fd6, #c026d3);
    padding: 32px 28px 26px;
    color: white;
    text-align: center;
  }
  .logo { font-size: 13px; letter-spacing: 4px; font-weight: bold; opacity: 0.85; }
  .title {
    font-size: 24px;
    font-weight: bold;
    margin-top: 10px;
    line-height: 1.25;
  }
  .divider {
    height: 1px;
    background: repeating-linear-gradient(90deg, #e9d5ff 0 8px, transparent 8px 16px);
    margin: 0 28px;
  }
  .meta {
    padding: 22px 28px 6px;
    text-align: center;
  }
  .meta-row {
    font-size: 15px;
    color: #374151;
    margin-bottom: 8px;
    font-weight: 600;
  }
  .meta-row .label {
    display: block;
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    color: #a78bfa;
    font-weight: bold;
    margin-bottom: 2px;
  }
  .qr-wrap {
    display: flex;
    justify-content: center;
    padding: 20px 28px;
  }
  .qr-wrap img {
    width: 210px;
    height: 210px;
    border: 10px solid #f5f3ff;
    border-radius: 20px;
  }
  .holder-block {
    text-align: center;
    padding: 0 28px 8px;
  }
  .holder-label {
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 2px;
    color: #a78bfa;
    font-weight: bold;
  }
  .holder-name {
    font-size: 22px;
    font-weight: bold;
    color: #1f2937;
    margin-top: 4px;
  }
  .footer {
    text-align: center;
    padding: 18px 28px 26px;
    font-size: 11px;
    color: #9ca3af;
    letter-spacing: 1px;
    font-family: 'Courier New', monospace;
  }
</style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div class="logo">SWITCH COMMUNITY</div>
      <div class="title">${data.eventTitle}</div>
    </div>

    <div class="meta">
      <div class="meta-row">
        <span class="label">Дата и время</span>
        ${data.eventDate}
      </div>
      <div class="meta-row">
        <span class="label">Место проведения</span>
        ${data.eventLocation}
      </div>
    </div>

    <div class="divider"></div>

    <div class="qr-wrap">
      <img src="${data.qrCodeDataUrl}" alt="QR" />
    </div>

    <div class="holder-block">
      <div class="holder-label">Участник</div>
      <div class="holder-name">${data.fullName}</div>
    </div>

    <div class="footer">БИЛЕТ № ${data.ticketNumber}</div>
  </div>
</body>
</html>
  `;
}