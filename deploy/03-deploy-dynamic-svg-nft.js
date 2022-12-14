const { network, ethers } = require("hardhat");
const { developmentChains, networkConfigs } = require("../helper-hardhat-config");
const fs = require("fs");

module.exports = async function ({ deployments, getNamedAccounts }) {
    const { deployer } = await getNamedAccounts();
    const { log, deploy } = deployments;

    const chainId = network.config.chainId;
    let ethUsdPriceFeedAddress;

    if (developmentChains.includes(network.name)) {
        const ethUsdAggregator = await ethers.getContract("MockV3Aggregator");
        ethUsdPriceFeedAddress = ethUsdAggregator.address;
    } else {
        ethUsdPriceFeedAddress = networkConfigs[chainId].ethUsdPriceFeedAddress;
    }

    const lowSvg = await fs.readFileSync("./images/dynamicSvgNft/frown.svg", { encoding: "utf-8" });
    const highSvg = await fs.readFileSync("./images/dynamicSvgNft/happy.svg", {
        encoding: "utf-8",
    });
    const args = [ethUsdPriceFeedAddress, lowSvg, highSvg];

    const dynamicSvgNft = await deploy("DynamicSvgNft", {
        from: deployer,
        log: true,
        args: args,
        waitConfirmations: network.config.blockConfirmations || 1,
    });

    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        log("Verifying...");
        await verify(dynamicSvgNft.address, networkConfigs[chainId]["explorer_url"], args);
        log("___________________________________________________");
    }
};

module.exports.tags = ["all", "dynamicSvg"];
