const fs = require("fs");
const pdf = require("pdf-parse");
// const generateAudio = require("./audioSynthesis"); // Assuming this is your speech synthesis function

// Helper function to calculate estimated reading time (characters per minute)
const CHARACTERS_PER_MINUTE = 1400; // You can adjust this value based on your average text size
const MAX_CHARACTERS_PER_AUDIO = CHARACTERS_PER_MINUTE * 10; // Approx. 10 minutes of text

module.exports = async (pdfFile, pageStart, pageEnd) => {
  try {
    const dataBuffer = fs.readFileSync(pdfFile);

    const result = await pdf(dataBuffer).then(function (data) {
      const fullText = data.text;

      // Split the full text by page breaks (adjust for your PDF format)
      const pages = fullText.split("\n\n");

      // Select specific pages, e.g., from pageStart to pageEnd
      const selectedPages = [];
      for (let i = pageStart; i <= pageEnd; i++) {
        selectedPages.push(pages[i]);
      }

      // Join the selected pages into one string
      const selectedText = selectedPages.join("\n\n");

      // Split the text into paragraphs for cleaner processing
      const paragraphs = selectedText.split(/\n(?=[A-Z])/);
      const singleLineParagraphs = paragraphs.map((paragraph) =>
        paragraph.replace(/\n/g, " ").trim()
      );

      // Join paragraphs back without extra spacing
      const cleanText = singleLineParagraphs.join("\n");

      // Split text into 10-minute chunks based on character limit
      const audioChunks = [];
      let currentChunk = "";
      for (const paragraph of singleLineParagraphs) {
        if (currentChunk.length + paragraph.length <= MAX_CHARACTERS_PER_AUDIO) {
          currentChunk += paragraph + " ";
        } else {
          audioChunks.push(currentChunk.trim());
          currentChunk = paragraph + " ";
        }
      }
      if (currentChunk.length > 0) {
        audioChunks.push(currentChunk.trim());
      }

      return audioChunks; // Returns array of text chunks that each fit within 10 minutes
    });

    // Iterate over each chunk and generate a separate audio file for each
    // for (let i = 0; i < result.length; i++) {
    //   const chunk = result[i];
    //   const audioFileName = `audio_part_${i + 1}.mp3`; // Name audio files sequentially
    //   const audioResult = await generateAudio(audioFileName, chunk);
    //   if (audioResult !== 1) {
    //     console.error(`Error generating audio for chunk ${i + 1}`);
    //   }
    // }

    return result; // Return success
  } catch (error) {
    console.error("Error during PDF processing:", error);
    return -1;
  }
};
