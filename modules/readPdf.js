const fs = require("fs");
const pdf = require("pdf-parse");

module.exports = async (pdfFile, pageStart, pageEnd) => {
  try {
    const dataBuffer = fs.readFileSync(pdfFile);

    const result = await pdf(dataBuffer).then(function (data) {
      // The parsed data includes text from all pages
      const fullText = data.text;

      // Split the full text by page breaks (assuming each page has a \n\n)
      const pages = fullText.split("\n\n"); // This may vary depending on how your PDF uses newlines

      // Select specific pages, e.g., page 1 and page 3
      const selectedPages = [];
      for (let i = pageStart; i <= pageEnd; i++) {
        selectedPages.push(pages[i]);
      }

      // Join the selected pages into one string
      const selectedText = selectedPages.join("\n\n");

      // Split the text into paragraphs (split based on single newlines followed by a capital letter)
      const paragraphs = selectedText.split(/\n(?=[A-Z])/);

      // Remove line breaks within each paragraph
      const singleLineParagraphs = paragraphs.map((paragraph) =>
        paragraph.replace(/\n/g, " ").trim()

      );

      // Join the paragraphs back, keeping them together without adding extra space
      const result = singleLineParagraphs.join("\n");

      return result;
    });
    return result;
  } catch (error) {
    console.log(error);
    return -1;
  }
};
