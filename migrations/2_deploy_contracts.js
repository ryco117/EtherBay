var EtherBay = artifacts.require("./EtherBay.sol");

module.exports = function(deployer) {
  deployer.deploy(EtherBay);
};
