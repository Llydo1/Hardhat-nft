const { ethers, network } = require("hardhat");
const { developmentChains } = require("../helper-hardhat-config");

const DECIMALS = "18";
const INTIAL_ANSWER = ethers.utils.parseUnits("2000", "ether");

module.exports = async ({ deployments, getNamedAccounts }) => {
    const { deployer } = await getNamedAccounts();
    const { log, deploy } = deployments;
    const BASE_FEE = ethers.utils.parseEther("0.25");
    const GAS_PRICE_LINK = 1e9;
    const args = [BASE_FEE, GAS_PRICE_LINK];

    if (developmentChains.includes(network.name)) {
        log("Local network detected, deploying mocks....");
        await deploy("VRFCoordinatorV2Mock", {
            from: deployer,
            log: true,
            args: args,
            waitConfirmations: network.config.blockConfirmations || 1,
        });

        await deploy("MockV3Aggregator", {
            from: deployer,
            log: true,
            args: [DECIMALS, INTIAL_ANSWER],
            waitConfirmations: network.config.blockConfirmations || 1,
        });
        log("VRFCoordinatorV2Mock and MockV3Aggregator deployed");
        log("___________________________________________________");
    }
};

module.exports.tags = ["all", "mocks", "randomIpfs", "dynamicSvg"];
