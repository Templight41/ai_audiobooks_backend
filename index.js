require("dotenv").config();
const express = require("express");
const app = express();
const { v4: uuidv4 } = require("uuid");
const multer = require("multer");
const path = require("path");
const { BlobServiceClient } = require("@azure/storage-blob");
const cors = require("cors");
const fs = require("fs");
const mongoose = require("mongoose");

const mongoUrl = process.env.MONGO_URL;

app.use(cors());

app.use(express.json());

const upload = multer({ dest: "uploads/" });

const downloader = require("./modules/download");
const generateAudio = require("./modules/generateAudio");
const uploadFile = require("./modules/upload");
const readPdf = require("./modules/readPdf");
const getBooks = require("./modules/getBooks");

const Books = require("./schema/books");
const Audios = require("./schema/audios");

const sanitizeFileName = (fileName) => {
  // Remove leading/trailing spaces and ensure no control characters
  return fileName.trim();
};

app.post("/generate/audio", async (req, res) => {
  await mongoose.connect(mongoUrl);

  const audioFile = `${uuidv4()}.mp3`;
  const audioFilePath = path.join(__dirname, "audioOutput", audioFile);
  console.log(audioFile);
  console.log(req.body);
  const pdfName = req.body.pdfName;
  const pdfUrl = "https://aiaudiobooks.blob.core.windows.net/books/" + pdfName;
  let pageStart = req.body.pageStart;
  let pageEnd = req.body.pageEnd;
  if (pageEnd < pageStart || pageEnd == null) {
    pageEnd = pageStart;
  }

  const pdfFilePath = path.join(__dirname, "books");
  const pdfFile = path.join(__dirname, "books", pdfName);

  //Download pdf
  const download = await downloader(pdfUrl, pdfName, pdfFilePath);
  if (download === -1) {
    console.log("Download failed");
    return res.status(500).send("Failed to download pdf (server error)");
  }

  const text = await readPdf(pdfFile, pageStart, pageEnd);
  if (text === -1) {
    console.log("Error reading file");
    return res.status(500).send("Failed to read pdf file (server error");
  }
  // console.log(text)

  const response = await generateAudio(audioFilePath, text);
  if (response === -1) {
    console.log("Error generating audio");
    return res.send("Failed to generate audio");
  }
  console.log(response);
  console.log("audio generated");

  //delete pdf
  await fs.unlinkSync(pdfFile);

  const result = await uploadFile(audioFile, audioFilePath, "audio");
  if (result === -1) return res.send("Failed to upload audio file");

  const audioUrl = `https://aiaudiobooks.blob.core.windows.net/audio/${audioFile}`;

  try {
    const audio = new Audios({
      audioId: uuidv4(),
      url: audioUrl,
      pageStart: pageStart,
      pageEnd: pageEnd,
      bookId: req.body.bookId,
      userId: req.body.userId,
    });
    await audio.save();

    res.status(200).json({ audioUrl });
  } catch (error) {
    console.log(error);
    return res.status(500).send("Failed to save audio to database");
  }
});

app.get("/books", async (req, res) => {
  const books = await getBooks();
  res.status(200).json(books);
});

app.post("/upload/book", upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).send("No file uploaded.");
  }

  const bookName = req.file.originalname;
  const bookId = uuidv4();
  const bookFile = `${bookId}.pdf`;
  // Sanitize file name (just trim spaces)
  const sanitizedFileName = sanitizeFileName(bookFile);

  const filePath = path.join(__dirname, req.file.path);

  await mongoose.connect(mongoUrl);

  const uploadsPath = path.join(__dirname, "uploads");

  const uploadFiles = await fs.readdirSync(uploadsPath);
  const uploadFilePath = [];

  for (const file of uploadFiles) {
    uploadFilePath.push(path.join(uploadsPath, file));
  }

  const result = await uploadFile(sanitizedFileName, filePath, "books", uploadFilePath);
  if (result === -1) return res.send("Failed to upload file");

  try {
    const book = new Books({
      bookId: bookId,
      title: bookName,
      userId: "armaanpasha3@gmail.com",
      fileName: sanitizedFileName,
      url: `https://aiaudiobooks.blob.core.windows.net/books/${sanitizedFileName}`,
    });
    await book.save();
  } catch (error) {
    console.log(error);
    return res.status(500).send("Failed to save book to database");
  }
  res.status(200).send("File uploaded successfully");
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
