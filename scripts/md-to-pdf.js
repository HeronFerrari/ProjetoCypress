const fs = require('fs');
const path = require('path');
const MarkdownIt = require('markdown-it');
const puppeteer = require('puppeteer');

(async () => {
  try {
    const repoRoot = path.resolve(__dirname, '..');
    const mdPath = path.join(repoRoot, 'CENARIOS_DE_TESTE.md');
    const outPdf = path.join(repoRoot, 'RELATORIO_CCH.pdf');

    if (!fs.existsSync(mdPath)) {
      console.error('Markdown file not found:', mdPath);
      process.exit(1);
    }

    const md = fs.readFileSync(mdPath, 'utf8');
    const mdIt = new MarkdownIt({ html: true });
    let htmlBody = mdIt.render(md);

    // Adjust image paths to be absolute file:// URLs so Puppeteer can load them
    htmlBody = htmlBody.replace(/src="(cypress\/screenshots[^"]+)"/g, (m, p1) => {
      const abs = path.join(repoRoot, p1);
      return `src="file://${abs.replace(/\\/g, '/')}"`;
    });

    const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>Relatório CCH - Testes Cypress</title>
  <style>
    body { font-family: Arial, Helvetica, sans-serif; margin: 24px; color: #222; }
    h1,h2,h3 { color: #0b57a4 }
    pre { background: #f5f5f5; padding: 12px; overflow: auto }
    img { max-width: 100%; height: auto; display: block; margin: 12px 0 }
    table { border-collapse: collapse; }
    td, th { padding: 6px 8px; border: 1px solid #ddd }
  </style>
</head>
<body>
${htmlBody}
</body>
</html>`;

    console.log('Launching headless browser (this may download Chromium on first run)...');
    const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    await page.pdf({ path: outPdf, format: 'A4', printBackground: true, margin: { top: '20mm', bottom: '20mm', left: '12mm', right: '12mm' } });
    await browser.close();

    console.log('PDF gerado em:', outPdf);
  } catch (err) {
    console.error('Erro ao gerar PDF:', err);
    process.exit(1);
  }
})();
