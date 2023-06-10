const ComputersRent = artifacts.require("ComputersRent");

module.exports = function (deployer) {
  deployer.deploy(ComputersRent, "ComputersRent", "CR").then((instance) => {
    console.log("Contract address:", instance.address);
  });
};
