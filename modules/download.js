const Downloader = require("nodejs-file-downloader");

module.exports = async function download(url, fileName, directory) {
  const downloader = new Downloader({
    url: url,
    directory: directory,
    fileName: fileName,
    cloneFiles: false,
  });
  try {
    const { filePath, downloadStatus } = await downloader.download();

    console.log("download complete");
    return 1;
  } catch (error) {
    return -1;
  }
};
