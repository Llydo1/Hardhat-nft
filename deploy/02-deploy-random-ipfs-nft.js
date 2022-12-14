const { network, ethers } = require("hardhat");
const { developmentChains, networkConfigs } = require("../helper-hardhat-config");
const { storeTokenURImetadata } = require("../utils/ipfsTokenURI");

const defaultTokenURI = [
    "ipfs://QmQK5CT9BTdJxmNCuGuPYhyfZbnyVy65MHpj7bswz2t7YB",
    "ipfs://QmeRStt7HKSUqSUovpWpMLw4VSmCxfMPi5KAzkgLJg9Bsq",
    "ipfs://QmV7C8ADP6GmkkUXjgvpSgUCr4gr5WrBKX8evK5dgXRTgy",
];

module.exports = async ({ deployments, getNamedAccounts }) => {
    const { deployer } = await getNamedAccounts();
    const { log, deploy } = deployments;
    const chainId = network.config.chainId;

    let vrfCoordinatorV2Address, subscriptionId, vrfCoordinatorV2Mock;

    if (developmentChains.includes(network.name)) {
        vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock");
        vrfCoordinatorV2Address = vrfCoordinatorV2Mock.address;
        const tx = await vrfCoordinatorV2Mock.createSubscription();
        const txReceipt = await tx.wait(1);
        subscriptionId = txReceipt.events[0].args.subId;
        await vrfCoordinatorV2Mock.fundSubscription(subscriptionId, ethers.utils.parseUnits("10"));
    } else {
        vrfCoordinatorV2Address = networkConfigs[chainId].vrfCoordinatorV2;
        subscriptionId = networkConfigs[chainId].subscriptionId;
    }

    // Upload and retrieve token URIs from pintata
    log("Uploading Images and TokenURIs");
    let tokenURIs = defaultTokenURI || (await storeTokenURImetadata("./images/randomNft"));
    log("___________________________________________________");

    // Deploying contracts
    const args = [
        vrfCoordinatorV2Address,
        networkConfigs[chainId].gaslane,
        subscriptionId,
        networkConfigs[chainId].callbackGasLimit,
        tokenURIs,
        networkConfigs[chainId].mintFee,
    ];

    const randomIpfs = await deploy("RandomIpfsNft", {
        from: deployer,
        log: true,
        args: args,
        waitConfirmations: network.config.blockConfirmations || 1,
    });
    log("Random Ipfs Nft contract deployed....");

    // Verifying if not on development chain
    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        log("Verifying...");
        await verify(randomIpfs.address, networkConfigs[chainId]["explorer_url"], args);
        log("___________________________________________________");
    }

    if (chainId == 31337) {
        await vrfCoordinatorV2Mock.addConsumer(subscriptionId, randomIpfs.address);
    }
};

module.exports.tags = ["all", "randomIpfs"];
