import http from 'http';
import httpProxy from 'http-proxy';

const proxy = httpProxy.createProxyServer({
  changeOrigin: true,
  secure: false,           // اگر بک‌اندت self-signed هست
  ws: true,                // پشتیبانی از WebSocket اگر لازم شد
  xfwd: true
});

// هندل کردن خطاها
proxy.on('error', (err, req, res) => {
  console.error('Proxy error:', err);
  if (res && !res.headersSent) {
    res.writeHead(502, { 'Content-Type': 'text/plain' });
    res.end('Bad Gateway - Relay Error');
  }
});

// خواندن متغیرهای محیطی
const BACKEND_URL = process.env.BACKEND_URL || 'https://your-real-server.com:443';
const PORT = process.env.PORT || 8080;

if (!BACKEND_URL) {
  console.error('❌ BACKEND_URL environment variable is required!');
  process.exit(1);
}

const server = http.createServer((req, res) => {
  // لاگ ساده برای دیباگ (می‌تونی بعداً حذف کنی)
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url} from ${req.socket.remoteAddress}`);

  // فوروارد درخواست به بک‌اند
  proxy.web(req, res, {
    target: BACKEND_URL,
    xfwd: true
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 XHTTP Relay is running on port ${PORT}`);
  console.log(`Backend target: ${BACKEND_URL}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing server...');
  server.close(() => process.exit(0));
});
