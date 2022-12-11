const { assert } = require("chai");
const { network, getNamedAccounts, ethers, deployments } = require("hardhat");
const { developmentChains } = require("../../helper-hardhat-config");

developmentChains.includes(network.name) &&
    describe("Basic NFT unit test", () => {
        let deployer, basicNFT;
        beforeEach(async () => {
            deployer = (await getNamedAccounts()).deployer;
            await deployments.fixture(["basic"]);
            basicNFT = await ethers.getContract("BasicNFT", deployer);
        });

        describe("Constructor", () => {
            it("Initialize name and symbol of the NFT correctly", async () => {
                const name = await basicNFT.name();
                const symbol = await basicNFT.symbol();
                assert.equal(name, "Dogie");
                assert.equal(symbol, "Dog");
            });

            it("Initialize counter of the NFT correctly", async () => {
                const counter = await basicNFT.getTokenCounter();
                assert.equal(counter, 0);
            });

            it("Initialize TOKEN_URI of the NFT correctly", async () => {
                const TOKEN_URI = await basicNFT.tokenURI(ethers.utils.parseUnits("0", 18));
                assert.equal(
                    TOKEN_URI.toString(),
                    "ipfs://bafybeig37ioir76s7mg5oobetncojcm3c3hxasyd4rvid4jqhy4gkaheg4/?filename=0-PUG.json"
                );
            });
        });

        describe("Minting NFT", () => {
            let minter, tokenId;
            beforeEach(async () => {
                const txResponse = await basicNFT.mintNTF();
                const txReceipt = await txResponse.wait(1);
                minter = txReceipt.events[0].args.to;
                tokenId = txReceipt.events[0].args.tokenId;
            });

            it("Update token counter and emit events", async () => {
                const tokenCounter = await basicNFT.getTokenCounter();
                assert.equal(tokenId, 0);
                assert.equal(minter, deployer);
                assert.equal(tokenCounter, 1);
            });
        });
    });
