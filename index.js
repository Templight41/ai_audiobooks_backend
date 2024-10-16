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

const upload = multer({ dest: "uploads/" })

const downloader = require("./modules/download");
const generateAudio = require("./modules/generateAudio");
const uploadFile = require("./modules/upload");
const readPdf = require("./modules/readPdf");
const getBooks = require("./modules/getBooks");
const findAll = require("./modules/findAll");
const findOne = require("./modules/findOne");

const Books = require("./schema/books");
const Audios = require("./schema/audios");
const audioParts = require("./schema/audioParts");

const sanitizeFileName = (fileName) => {
  // Remove leading/trailing spaces and ensure no control characters
  return fileName.trim();
};

app.post("/generate/audio", async (req, res) => {
  await mongoose.connect(mongoUrl);

  console.log(req.body);
  const pdfName = req.body.bookId + ".pdf";
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
  
  const texts = await readPdf(pdfFile, pageStart, pageEnd);
  if (texts === -1) {
    console.log("Error reading file");
    return res.status(500).send("Failed to read pdf file (server error)");
  }
  // console.log(text)
  const audioFiles = [];
  const audioFilePaths = [];
  for (const text of texts) {
    const tempAudioFile = uuidv4();
    audioFiles.push(tempAudioFile);
    audioFilePaths.push(path.join(__dirname, "audioOutput", `${tempAudioFile}.mp3`));
  }

  const audioProcess = await Promise.all(
    texts.map(async (text, index) => {
      const audioGenRes = await generateAudio(audioFilePaths[index], text);
      const audioUploadRes = await uploadFile(`${audioFiles[index]}.mp3`, audioFilePaths[index], "audio");
      if(audioGenRes === -1 || audioUploadRes === -1) {
        return -1;
      }
    })
  );
  if(audioProcess.includes(-1)) {
    return res.status(500).send("Failed to generate audio (server error)");
  }

  console.log("audio generated");

  //delete pdf
  fs.unlinkSync(pdfFile);

  // const audioUrl = `https://aiaudiobooks.blob.core.windows.net/audio/${audioFile}`;

  try {
    const audioId = uuidv4();

    const audio = new Audios({
      audioId: audioId,
      pageStart: pageStart,
      pageEnd: pageEnd,
      bookId: req.body.bookId,
      audioParts: audioFiles
    });
    
    
    audioFiles.forEach(async (audioFile, index) => {
      const audioPart = new audioParts({
        audioPartId: audioFile,
        part: index + 1,
        audioId: audioId,
        audioPartUrl: `https://aiaudiobooks.blob.core.windows.net/audio/${audioFile}.mp3`
      });
      await audioPart.save();
    });

    await audio.save();

    return res.status(200).json({audioUrl: `https://aiaudiobooks.blob.core.windows.net/audio/${audioFiles[0]}.mp3`});
  } catch (error) {
    console.log(error);
    return res.status(500).send("Failed to save audio to database");
  }
});

app.get("/books", async (req, res) => {
  const books = await getBooks();
  if(books === -1) {
    return res.status(500).send("Failed to get books from database");
  };
  res.status(200).json(books);
});

app.get("/books/:bookId", async (req, res) => {
  const bookId = req.params.bookId;
  
  const book = await findOne("books", "bookId", bookId);
  if (book === -1) {
    return res.status(500).send("Failed to get book from database");
  }
  res.status(200).json(book);
});

app.post("/books/:bookId", (req, res) => {
  const bookId = req.params.bookId;
  const book = req.body;
  book.bookId = bookId;

  // const result =
  Books.create(book, (err, book) => {
    if (err) {
      console.log(err);
      return res.status(500).send("Failed to save book to database");
    }
    res.status(200).json(book);
  });
});

app.delete("/books/:bookId", async (req, res) => {
  
  await mongoose.connect(mongoUrl);

  console.log("deleting book")

  const bookId = req.params.bookId;

  const book = await findOne("books", "bookId", bookId);
  if (book === -1) {
    return res.status(500).send("Failed to get book from database");
  }

  const audios = await findAll("audios", "bookId", bookId);
  if (audios === -1) {
    return res.status(500).send("Failed to get audio from database");
  }

  try {
    await Books.deleteOne({
      bookId: bookId
    });
    await Audios.deleteMany({
      bookId: bookId
    });
    audios.map(async (audio) => {
      await audioParts.deleteMany({
        audioId: audio.audioId
      });
    })
    await mongoose.connection.close();
    res.status(200).send("Book deleted successfully");
  } catch (error) {
    console.log(error);
    return res.status(500).send("Failed to delete book from database");
  }
});

app.get("/audios", async (req, res) => {
  const audios = await findAll("audios");

  const audioParts = await findAll("audioParts");

  audios.map(async (audio) => {
    audio.audioParts = audioParts.filter((audioPart) => audioPart.audioId === audio.audioId);
  });
  
  if (audios === -1) {
    return res.status(500).send("Failed to get audios from database");
  }
  res.status(200).json(audios);
})

app.get("/audios/:audioId", async (req, res) => {
  const audioId = req.params.audioId;
  
  const audio = await findOne("audios", "audioId", audioId);
  if (audio === -1) {
    return res.status(500).send("Failed to get audio from database");
  }
  audio.audioParts = await findAll("audioParts", "audioId", audioId);
  res.status(200).json(audio);
});

// app.get("/audioParts", async (req, res) => {
//   const audioParts = await findAll("audioParts");
  
//   if (audioParts === -1) {
//     return res.status(500).send("Failed to get audio parts from database");
//   }
//   res.status(200).json(audioParts);
// })

app.get("/audioParts/:audioPartId", async (req, res) => {
  const audioPartId = req.params.audioPartId;
  
  const audioPart = await findOne("audioParts", "audioPartId", audioPartId);
  if (audioPart === -1) {
    return res.status(500).send("Failed to get audio part from database");
  }
  res.status(200).json(audioPart);
});

app.post("/upload/books", upload.single("file"), async (req, res) => {
  
  console.log(req.body.title)
  if (!req.file) {
    return res.status(400).send("No file uploaded.");
  }

  const bookName = req.body.title;
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

  const result = await uploadFile(
    sanitizedFileName,
    filePath,
    "books",
    uploadFilePath
  );
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
    await mongoose.connection.close();

    res.status(200).send("File uploaded successfully");
  } catch (error) {
    console.log(error);
    return res.status(500).send("Failed to save book to database");
  }
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
