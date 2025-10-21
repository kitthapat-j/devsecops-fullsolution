const express = require('express');

const app = express();

const port = 3000;




// 2. [แก้ไขช่องโหว่ Security] ลบฟังก์ชัน 'eval()' ที่อันตราย
app.get('/safe-api', (req, res) => {
  res.send('Hello DevSecOps World!!');
});


app.get('/', (req, res) => {
  res.send('Hello DevSecOps World!!');
});


app.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`);
 
});
