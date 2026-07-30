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
  @page { size: 400px 700px; margin: 0; }
  body {
    margin: 0;
    width: 400px;
    font-family: 'Georgia', serif;
    background: #fdf2f8;
    box-sizing: border-box;
  }
  .card {
    background: white;
    margin: 20px;
    border-radius: 24px;
    overflow: hidden;
    border: 1px solid #f3d9ea;
  }
  .header {
    background: linear-gradient(135deg, #6d2fd6, #e14fc4);
    padding: 28px 24px;
    color: white;
  }
  .logo { font-size: 14px; letter-spacing: 3px; font-weight: bold; opacity: 0.85; }
  .title { font-size: 22px; font-weight: bold; margin-top: 8px; }
  .meta { padding: 20px 24px; font-size: 13px; color: #4b5563; line-height: 1.8; }
  .qr-wrap { display: flex; justify-content: center; padding: 8px 24px 24px; }
  .qr-wrap img { width: 180px; height: 180px; }
  .footer {
    text-align: center;
    padding: 0 24px 24px;
    font-size: 11px;
    color: #9ca3af;
    letter-spacing: 1px;
  }
  .name { font-size: 15px; font-weight: bold; color: #1f2937; text-align: center; margin-top: 4px; }
</style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div class="logo">SWITCH COMMUNITY</div>
      <div class="title">${data.eventTitle}</div>
    </div>
    <div class="meta">
      📅 ${data.eventDate}<br>
      📍 ${data.eventLocation}
    </div>
    <div class="qr-wrap">
      <img src="${data.qrCodeDataUrl}" alt="QR" />
    </div>
    <div class="name">${data.fullName}</div>
    <div class="footer">№ ${data.ticketNumber}</div>
  </div>
</body>
</html>
  `;
}