// server.js
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.static('uploads'));

// Set up multer for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Append the extension
  },
});

const upload = multer({ storage });

// Route to upload a PDF
app.post('/upload', upload.single('file'), (req, res) => {
    console.log(req.file)
  res.json({ message: 'File uploaded successfully', file: req.file });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
