// Import library
const pinataSDK = require("@pinata/sdk");
const path = require("path");
const fs = require("fs");
const { Description } = require("@ethersproject/properties");
require("dotenv").config();

// Pinata API keys
const pinataApiKey = process.env.PINATA_API_KEY;
const pinataApiSecret = process.env.PINATA_API_SECRET;
const pinata = new pinataSDK(pinataApiKey, pinataApiSecret);

// Metadata template
const metadataTemplate = {
    name: "",
    description: "",
    image: "",
    attributes: {},
};

const storeImages = async (imagesFilePath) => {
    const fullPath = path.resolve(imagesFilePath);
    const files = fs.readdirSync(fullPath);
    let responses = await Promise.all(
        files.map(async (file) => {
            const readableStreamForFile = fs.createReadStream(`${fullPath}/${file}`);
            const options = {
                pinataMetadata: {
                    name: file,
                },
            };
            try {
                const res = await pinata.pinFileToIPFS(readableStreamForFile, options);
                console.log(`Successfully pushing ${file}, the hash is ${res.IpfsHash}`);
                return res.IpfsHash;
            } catch (error) {
                console.log(error);
            }
        })
    );
    return { responses, files };
};

const storeTokenURImetadata = async (imagesFilePath) => {
    const { responses: ipfsHashes, files } = await storeImages(imagesFilePath);
    for (index in ipfsHashes) {
        let name = files[index].replace(".gif", "");
        name = name.split("_").join(" ");
        console.log(ipfsHashes[index]);
        console.log(name);
    }
};

storeTokenURImetadata("./images/randomNft");

module.exports = { storeImages, storeTokenURImetadata };
