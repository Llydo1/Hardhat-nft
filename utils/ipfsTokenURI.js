// Import library
const pinataSDK = require("@pinata/sdk");
const path = require("path");
const fs = require("fs");
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

    // Loop through waifus
    let tokenURIs = [];
    for (index in ipfsHashes) {
        const name = files[index].replace(".gif", "").split("_").join(" ");
        const metadata = {
            name: name,
            description: `beautiful ${name} just for you`,
            image: `ipfs://${ipfsHashes[index]}`,
            attributes: [
                {
                    trait_type:
                        index == 0 ? "Nice waifu" : index == 1 ? "Cool waifu" : "Special Waifu",
                    value: index == 0 ? 10 : index == 1 ? 30 : 100,
                },
            ],
        };

        // Upload Json to IPFS
        const options = {
            pinataMetadata: {
                name: metadata.name,
            },
        };
        try {
            const resp = await pinata.pinJSONToIPFS(metadata, options);
            tokenURIs.push(`ipfs://${resp.IpfsHash}`);
        } catch (e) {
            console.log(e);
        }
    }
    console.log(tokenURIs);
    return tokenURIs;
};

module.exports = { storeImages, storeTokenURImetadata };
