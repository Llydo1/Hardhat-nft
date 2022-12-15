const { ethers, network } = require("hardhat");
const { developmentChains } = require("../helper-hardhat-config");

module.exports = async function ({ getNamedAccounts }) {
    const { deployer } = await getNamedAccounts();

    const basicNft = await ethers.getContract("BasicNft", deployer);
    const basicMintNft = await basicNft.mintNft();
    await basicMintNft.wait(1);
    console.log(`Basic NFT index 0 has token URI: ${await basicNft.tokenURI(0)}`);

    // RandomIPFSNFT
    const randomIpfsNft = await ethers.getContract("RandomIpfsNft", deployer);
    const mintFee = await randomIpfsNft.getMintFee();

    await new Promise(async (resolve, reject) => {
        setTimeout(resolve, 30000);
        randomIpfsNft.once("NftMinted", async () => resolve());

        const randomIpfsNftMintTx = await randomIpfsNft.requestNft({ value: mintFee.toString() });
        const randomIpfsNftMintTxReceipt = await randomIpfsNftMintTx.wait(1);
        if (developmentChains.includes(network.name)) {
            const requestId = randomIpfsNftMintTxReceipt.events[1].args.requestId.toString();
            const vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock");
            await vrfCoordinatorV2Mock.fulfillRandomWords(requestId, randomIpfsNft.address);
        }
    });
    console.log(`Random IPFS NFT index 0 token URI: ${await randomIpfsNft.getTokenURI(0)}`);

    // Dynamic SVG NFT
    const highValue = ethers.utils.parseEther("4000");
    const dynamicSvgNft = await ethers.getContract("DynamicSvgNft", deployer);
    const dynamicSvgNftMintTx = await dynamicSvgNft.mintNft(highValue.toString());
    await dynamicSvgNftMintTx.wait(1);
    console.log(`Dynamic SVG NFT index 0 tokenURI: ${await dynamicSvgNft.tokenURI(0)}`);
};

module.exports.tags = ["all", "mint"];
