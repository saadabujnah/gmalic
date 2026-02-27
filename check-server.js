const http = require('http');

// Configuration
const options = {
  host: 'localhost',
  port: 3001,
  path: '/api/health',
  timeout: 2000
};

// Make the request
const request = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  if (res.statusCode === 200) {
    console.log('✅ الخادم يعمل بشكل صحيح!');
  } else {
    console.log('❌ الخادم يرد برمز حالة غير متوقع');
  }

  res.on('data', (chunk) => {
    console.log('Response:', chunk.toString());
  });
});

request.on('error', (err) => {
  console.error('❌ خطأ في الاتصال بالخادم:', err.message);
  console.log('\nتأكد من أن الخادم يعمل على المنفذ 3001');
  console.log('يمكنك تشغيل الخادم باستخدام الأمر: npm start');
});

request.on('timeout', () => {
  console.error('❌ انتهت مهلة الاتصال');
  request.destroy();
});

request.end();