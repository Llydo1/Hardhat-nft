const pinataSDK = require("@pinata/sdk");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const pinataApiKey = process.env.PINATA_API_KEY;
const pinataApiSecret = process.env.PINATA_API_SECRET;
const pinata = new pinataSDK(pinataApiKey, pinataApiSecret);

async function storeImages(imagesFilePath) {
    const fullImagesPath = path.resolve(imagesFilePath);
    const files = fs.readdirSync(fullImagesPath);
    let responses = [];
    console.log(fullImagesPath);
    console.log(files);
    console.log("Uploading to Pinata, yahooo");
    for (fileIndex in files) {
        const options = {
            pinataMetadata: {
                name: files[fileIndex],
            },
        };
        const readableStreamForFile = fs.createReadStream(`${fullImagesPath}/${files[fileIndex]}`);
        try {
            const response = await pinata.pinFileToIPFS(readableStreamForFile, options);
            responses.push(response);
        } catch (e) {
            console.log(e);
        }
    }
    return { responses, files };
}

async function storeTokenUriMetadata(metadata) {
    try {
        const response = await pinata.pinJSONToIPFS(metadata);
        return response;
    } catch (error) {
        console.log(error);
    }
}

module.exports = { storeImages, storeTokenUriMetadata };
