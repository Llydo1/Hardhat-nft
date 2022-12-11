const { assert } = require("chai");
const { network, getNamedAccounts, deployments, ethers } = require("hardhat");
const { developmentChains } = require("../../helper-hardhat-config");

developmentChains.includes(network.name) &&
    describe("Random Ipfs Nft unit testing", () => {
        let deployer, randomIpfsNft, vrfCoordinatorV2Mock;
        beforeEach(async () => {
            deployer = (await getNamedAccounts()).deployer;
            await deployments.fixture(["randomipfs"]);
            randomIpfsNft = await ethers.getContract("RandomIpfsNft", deployer);
            vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock", deployer);
        });

        describe("Constructor", () => {
            it("Initialize name correctly", async () => {
                const name = await randomIpfsNft.name();
                const symbol = await randomIpfsNft.symbol();
                assert.equal(name, "Random IPFS NFT");
                assert.equal(symbol, "RIN");
            });

            it("Initialize dog URIs correcly", async () => {
                let tokenUris = [
                    "ipfs://QmY95nZoeUC3awQQA1GXwGDFVtQ9YbtXuTsgyVv1Ndp7it",
                    "ipfs://QmX68qbKDnMpgJxChLz2Rw81CpkTG1QNpvAWBk4BBiGjGD",
                    "ipfs://QmQ9oV8mrgHHdk13RKFb7gygqsDBTRWTkNmPQeV4zHRhKD",
                ];
                assert.equal(await randomIpfsNft.getDogTokenUris(0), tokenUris[0]);
                assert.equal(await randomIpfsNft.getDogTokenUris(1), tokenUris[1]);
                assert.equal(await randomIpfsNft.getDogTokenUris(2), tokenUris[2]);
            });

            it("Initialize mint fee correcly", async () => {
                const mintFee = await randomIpfsNft.getMintFee();
                assert.equal(mintFee.toString(), ethers.utils.parseEther("0.01").toString());
            });

            it("Initialize s_tokenCounter correctly", async () => {
                assert.equal((await randomIpfsNft.getTokenCounter()).toString(), 0);
            });

            it("Initialize chances correctly", async () => {
                const chances = (await randomIpfsNft.getChance()).toString();
                console.log((await randomIpfsNft.getChance()).toString());

                assert.equal(chances[0], 10);
                assert.equal(chances[1], 30);
                assert.equal(chances[2], 100);
            });
        });
    });
