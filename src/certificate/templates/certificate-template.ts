interface CertificateTemplateData {
  fullName: string;
  eventTitle: string;
  eventDate: string;
  certificateNumber: string;
}

export function getCertificateHtml(data: CertificateTemplateData): string {
  return `
<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="UTF-8">
<style>
  @page { size: A4 landscape; margin: 0; }
  body {
    margin: 0;
    width: 1123px;
    height: 794px;
    font-family: 'Georgia', serif;
    background: linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    position: relative;
  }
  .border {
    position: absolute;
    top: 30px; left: 30px; right: 30px; bottom: 30px;
    border: 3px solid #db2777;
    border-radius: 12px;
  }
  .logo {
    font-size: 28px;
    letter-spacing: 4px;
    color: #db2777;
    font-weight: bold;
    margin-bottom: 10px;
  }
  .title {
    font-size: 48px;
    color: #831843;
    margin: 20px 0 10px;
  }
  .subtitle {
    font-size: 18px;
    color: #6b7280;
    margin-bottom: 40px;
  }
  .name {
    font-size: 40px;
    color: #1f2937;
    font-weight: bold;
    border-bottom: 2px solid #db2777;
    padding-bottom: 10px;
    margin-bottom: 30px;
  }
  .event {
    font-size: 20px;
    color: #374151;
    max-width: 700px;
    text-align: center;
    line-height: 1.5;
  }
  .footer {
    position: absolute;
    bottom: 60px;
    display: flex;
    justify-content: space-between;
    width: 800px;
    font-size: 14px;
    color: #9ca3af;
  }
</style>
</head>
<body>
  <div class="border"></div>
  <div class="logo">SWITCH COMMUNITY</div>
  <div class="title">Сертификат участия</div>
  <div class="subtitle">выдан в подтверждение участия в мероприятии</div>
  <div class="name">${data.fullName}</div>
  <div class="event">«${data.eventTitle}»<br>${data.eventDate}</div>
  <div class="footer">
    <span>№ ${data.certificateNumber}</span>
    <span>switch-community.uz</span>
  </div>
</body>
</html>
  `;
}