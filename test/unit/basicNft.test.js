const { assert } = require("chai");
const { network, getNamedAccounts, ethers, deployments } = require("hardhat");
const { developmentChains } = require("../../helper-hardhat-config");

developmentChains.includes(network.name) &&
    describe("Basic NFT unit test", () => {
        let deployer, basicNft;

        beforeEach(async () => {
            deployer = (await getNamedAccounts()).deployer;
            await deployments.fixture(["all"]);
            basicNft = await ethers.getContract("BasicNft", deployer);
        });

        describe("Constructor", () => {
            it("Initialize the token Counter correctly", async () => {
                const tokenCounter = await basicNft.getTokenCounter();
                assert.equal(tokenCounter, 0);
            });

            it("Initialize the name of basicNft correctly", async () => {
                const name = await basicNft.name();
                const symbol = await basicNft.symbol();
                assert.equal(name, "Dogie");
                assert.equal(symbol, "Dog");
            });

            it("Initialize the TOKEN_URI of basicNft correctly", async () => {
                const TOKEN_URI = await basicNft.getTokenURI();
                assert.equal(
                    TOKEN_URI,
                    "ipfs://bafybeig37ioir76s7mg5oobetncojcm3c3hxasyd4rvid4jqhy4gkaheg4/?filename=0-PUG.json"
                );
            });
        });

        describe("Minting NFT", () => {
            beforeEach(async () => {
                await basicNft.mintNft();
            });

            it("Token counter have increased", async () => {
                const tokenCount = await basicNft.getTokenCounter();
                assert.equal(tokenCount, 1);
            });

            it("Minter is correct", async () => {
                const owner = await basicNft.ownerOf(0);
                assert.equal(owner.toString(), deployer);
            });
        });
    });
