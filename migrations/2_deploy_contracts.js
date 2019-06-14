var SafeMath = artifacts.require("./SafeMath.sol");
var ERC20d = artifacts.require("./ERC20d.sol");

module.exports = function(deployer) {
  deployer.deploy(SafeMath);
  deployer.link(SafeMath, ERC20d);
  deployer.deploy(ERC20d);
};
