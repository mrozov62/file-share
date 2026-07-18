const express = require('express');
const multer = require('multer');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);

const files = {};

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const id = crypto.randomBytes(4).toString('hex');
    const ext = path.extname(file.originalname);
    const storedName = `${id}${ext}`;
    files[id] = { storedName, originalName: file.originalname };
    req.fileId = id;
    cb(null, storedName);
  }
});

const upload = multer({ storage, limits: { fileSize: 500 * 1024 * 1024 } });

app.use(express.static(path.join(__dirname, 'public')));

app.post('/upload', upload.single('file'), (req, res) => {
  const id = req.fileId;
  const link = `${req.protocol}://${req.get('host')}/download/${id}`;
  res.json({ id, link, name: files[id].originalName });
});

app.get('/download/:id', (req, res) => {
  const entry = files[req.params.id];
  if (!entry) return res.status(404).send('Файл не найден (или сервер перезапускался)');
  const filePath = path.join(uploadsDir, entry.storedName);
  res.download(filePath, entry.originalName);
});

app.listen(PORT, () => console.log(`Сервер работает: http://localhost:${PORT}`));
