const express = require('express');

const app = express();

const port = 3000;


// 2. [แก้ไขช่องโหว่ Security] ลบฟังก์ชัน 'eval()' ที่อันตราย
// ** หมายเหตุ: โค้ดนี้ปลอดภัยแล้ว **
app.get('/safe-api', (req, res) => {
  res.send('Hello DevSecOps World!!');
});


app.get('/', (req, res) => {
  res.send('Hello DevSecOps World!!');
});


// *** สำคัญ: บรรทัดนี้จะอนุญาตให้รัน app.listen() เมื่อรันไฟล์นี้โดยตรงเท่านั้น ***
// *** แต่เมื่อรัน Unit Test จะไม่รัน app.listen() ***
if (require.main === module) {
  app.listen(port, () => {
    console.log(`App listening at http://localhost:${port}`);
  });
}

// *** Export 'app' instance เพื่อให้ Unit Test สามารถ Import ไปใช้ได้ (Supertest) ***
module.exports = app;
