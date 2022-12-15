const { assert, expect } = require("chai");
const { BigNumber } = require("ethers");
const { network, getNamedAccounts, deployments, ethers } = require("hardhat");
const { developmentChains } = require("../../helper-hardhat-config");

developmentChains.includes(network.name) &&
    describe("Random IPFS NFT test", () => {
        let deployer, randomIpfs, vrfCoordinatorV2Mock, user;
        beforeEach(async () => {
            deployer = (await getNamedAccounts()).deployer;
            user = (await getNamedAccounts()).user;
            await deployments.fixture(["randomIpfs"]);
            randomIpfs = await ethers.getContract("RandomIpfsNft", deployer);
            vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock", deployer);
        });

        describe("Constructor", () => {
            it("Initialize mock variables correctly", async () => {
                const gaslane = await randomIpfs.getGasLane();
                const subscriptionId = await randomIpfs.getSubscriptionId();
                const callbackGasLimit = await randomIpfs.getCallbackGasLimit();
                const REQUEST_CONFIRMATIONS = await randomIpfs.getRequestConfirmations();
                const NUM_WORDS = await randomIpfs.getNumWords();
                assert.equal(
                    gaslane,
                    "0x79d3d8832d904592c0bf9818b621522c988bb8b0c05cdc3b15aea1b6e8db0c15"
                );
                assert.equal(subscriptionId.toString(), "1");
                assert.equal(callbackGasLimit.toString(), "500000");
                assert.equal(REQUEST_CONFIRMATIONS, 3);
                assert.equal(NUM_WORDS, 2);
            });

            it("Initialize mint fee correctly", async () => {
                const mintFee = await randomIpfs.getMintFee();
                assert.equal(mintFee.toString(), "10000000000000000");
            });

            it("Initialize token counter correctly", async () => {
                const tokenCounter = await randomIpfs.getTokenCounter();
                assert.equal(tokenCounter.toString(), "0");
            });

            it("Initialize max chance value correctly", async () => {
                const max = await randomIpfs.getMaxChanceValue();
                assert.equal(max.toString(), "100");
            });

            it("Initialize token URIs correctly", async () => {
                const foxy = await randomIpfs.getTokenURI(2);
                const korone = await randomIpfs.getTokenURI(1);
                const rebecca = await randomIpfs.getTokenURI(0);
                assert.equal(foxy, "ipfs://QmV7C8ADP6GmkkUXjgvpSgUCr4gr5WrBKX8evK5dgXRTgy");
                assert.equal(korone, "ipfs://QmeRStt7HKSUqSUovpWpMLw4VSmCxfMPi5KAzkgLJg9Bsq");
                assert.equal(rebecca, "ipfs://QmQK5CT9BTdJxmNCuGuPYhyfZbnyVy65MHpj7bswz2t7YB");
            });

            it("Initizlize request id array should have nothing", async () => {
                await expect(randomIpfs.getRequestId(0)).to.be.reverted;
            });

            it("Balance should be zero", async () => {
                const balance = await ethers.provider.getBalance(randomIpfs.address);
                assert.equal(balance, 0);
            });
        });

        describe("requestNft", () => {
            let mintFee;
            beforeEach(async () => {
                mintFee = await randomIpfs.getMintFee();
                await randomIpfs.requestNft({ value: mintFee });
                await (
                    await ethers.getContract("RandomIpfsNft", user)
                ).requestNft({ value: mintFee });
            });

            it("Should be reverted when there is not enough ETH", async () => {
                await expect(
                    randomIpfs.requestNft({ value: mintFee.sub(BigNumber.from(5)) })
                ).to.be.revertedWith("RandomIpfsNft__NeedMoreEth");
            });

            it("RequestIds should be update with 2", async () => {
                await expect(randomIpfs.getRequestId(0)).not.to.be.reverted;
                await expect(randomIpfs.getRequestId(1)).not.to.be.reverted;
            });

            it("Should emit NftRequested event", async () => {
                await expect(randomIpfs.requestNft({ value: mintFee })).to.emit(
                    randomIpfs,
                    "NftRequested"
                );
            });

            it("Should map correct owner of requestIds", async () => {
                const sender1 = await randomIpfs.getRequestIdOwner(
                    await randomIpfs.getRequestId(0)
                );
                const sender2 = await randomIpfs.getRequestIdOwner(
                    await randomIpfs.getRequestId(1)
                );
                assert.equal(sender1.toString(), deployer);
                assert.equal(sender2.toString(), user);
            });
        });

        describe("Fullfill random words", async () => {
            let mintFee, requestId;
            beforeEach(async () => {
                mintFee = await randomIpfs.getMintFee();
                await randomIpfs.requestNft({ value: mintFee });
                await (
                    await ethers.getContract("RandomIpfsNft", user)
                ).requestNft({ value: mintFee });
                requestId = await randomIpfs.getRequestId(0);
            });

            it("NftMinted must be emited", async () => {
                await expect(
                    vrfCoordinatorV2Mock.fulfillRandomWords(requestId, randomIpfs.address)
                ).to.emit(randomIpfs, "NftMinted");
            });

            it("Token counter must increase by 1", async () => {
                await vrfCoordinatorV2Mock.fulfillRandomWords(requestId, randomIpfs.address);
                const tokenCounter = await randomIpfs.getTokenCounter();
                assert.equal(tokenCounter, "1");
            });

            it("Deployer balance must increase by 1", async () => {
                const initialBalance = await randomIpfs.balanceOf(deployer);
                await vrfCoordinatorV2Mock.fulfillRandomWords(requestId, randomIpfs.address);
                const balance = await randomIpfs.balanceOf(deployer);
                assert.equal(balance, 1);
                assert.equal(initialBalance, 0);
            });

            it("Owner of token must be corrected", async () => {
                await vrfCoordinatorV2Mock.fulfillRandomWords(requestId, randomIpfs.address);
                const onwer = await randomIpfs.ownerOf(0);
                assert.equal(onwer, deployer);
            });

            it("mints NFT after random number is returned", async function () {
                await new Promise(async (resolve, reject) => {
                    randomIpfs.once("NftMinted", async () => {
                        try {
                            const tokenUri = await randomIpfs.tokenURI("0");
                            const tokenCounter = await randomIpfs.getTokenCounter();
                            assert.equal(tokenUri.toString().includes("ipfs://"), true);
                            assert.equal(tokenCounter.toString(), "1");
                            resolve();
                        } catch (e) {
                            console.log(e);
                            reject(e);
                        }
                    });
                    try {
                        const fee = await randomIpfs.getMintFee();
                        const requestNftResponse = await randomIpfs.requestNft({
                            value: fee.toString(),
                        });
                        const requestNftReceipt = await requestNftResponse.wait(1);
                        await vrfCoordinatorV2Mock.fulfillRandomWords(
                            requestNftReceipt.events[1].args.requestId,
                            randomIpfs.address
                        );
                    } catch (e) {
                        console.log(e);
                        reject(e);
                    }
                });
            });
        });

        describe("Withdraw", () => {
            beforeEach(async () => {
                mintFee = await randomIpfs.getMintFee();
                await randomIpfs.requestNft({ value: mintFee });
                await (
                    await ethers.getContract("RandomIpfsNft", user)
                ).requestNft({ value: mintFee });
                requestId = await randomIpfs.getRequestId(0);
            });

            it("balance should be updated correctly", async () => {
                const contractBalance = await ethers.provider.getBalance(randomIpfs.address);
                const balance = ethers.utils.parseEther("0.02");
                assert.equal(contractBalance.toString(), balance.toString());
            });

            it("Reverted when it is not owner", async () => {
                const userRandomIpfs = await ethers.getContract("RandomIpfsNft", user);
                await expect(userRandomIpfs.withdraw()).to.be.reverted;
            });

            it("Owner of contract can withdraw and balance should be updated", async () => {
                const initialBalance = await ethers.provider.getBalance(deployer);
                const tx = await randomIpfs.withdraw();
                const receipt = await tx.wait(1);
                const gasUsed = receipt.cumulativeGasUsed.mul(receipt.effectiveGasPrice);
                const newBalance = await ethers.provider.getBalance(deployer);
                assert.equal(
                    initialBalance.add(ethers.utils.parseEther("0.02")).toString(),
                    newBalance.add(gasUsed).toString()
                );
            });
        });

        describe("Multiple request nft", () => {
            it("lets go", async () => {
                const accounts = await ethers.getSigners();
                for (let i = 0; i < 10; i++) {
                    const minterRandomIpfs = randomIpfs.connect(accounts[i]);
                    (await minterRandomIpfs.requestNft({ value: mintFee })).wait(1);
                    const requestId = await minterRandomIpfs.getRequestId(i);
                    await vrfCoordinatorV2Mock.fulfillRandomWords(requestId, randomIpfs.address);
                    console.log(await minterRandomIpfs.tokenURI(i));
                    console.log((await minterRandomIpfs.getRequestId(i)).toString());

                    assert.equal(1, 1);
                }
            });
        });
    });
