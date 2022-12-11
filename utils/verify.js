const { run } = require("hardhat");
const open = require("open");

const verify = async (contractAddress, url, args) => {
    console.log("Verifying contract...");
    await run("verify:verify", {
        address: contractAddress,
        constructorArguments: args,
    })
        .then(() => console.log(`Verification complete. Navigate to etherscan `))
        .catch((err) => {
            if (err.message.toLowerCase().includes("already verified")) {
                console.log("Already Verified");
            } else console.log(err);
        })
        .finally(async () => await open(`${url}address/${contractAddress}#code`));
};

module.exports = { verify };
