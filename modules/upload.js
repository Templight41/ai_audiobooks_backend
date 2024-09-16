const { BlobServiceClient } = require("@azure/storage-blob");
const fs = require("fs"); // Don't forget to include fs for file operations
const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING;

const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);


module.exports = async (sanitizedFileName, filePath, container) => {
    try {
        const containerClient = blobServiceClient.getContainerClient(container);
        const blockBlobClient = containerClient.getBlockBlobClient(sanitizedFileName);

        const fileStream = fs.createReadStream(filePath);
        const uploadBlobResponse = await blockBlobClient.uploadStream(fileStream);
        console.log("File uploaded to Azure successfully", uploadBlobResponse.requestId);

        // fs.unlinkSync(filePath);

        return 1
    } catch (error) {
        console.error("Error uploading file:", error);
        return -1
    }
};
