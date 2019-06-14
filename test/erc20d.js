const { toValidityID, fromValidityID } = require('../utils/validity-id.js');
const ERC20d = artifacts.require("ERC20d");

const nullHex = 0x0000000000000000000000000000000000000000000000000000000000000000;
const genesisValue = 48070000000000000000000000000;

async function subtractValues(_a, _b) {
  var valueDelta = await web3.utils.toBN(_a).sub(web3.utils.toBN(_b));
  return await web3.utils.hexToNumberString(valueDelta);
}

async function convertHex(_input) {
  return await web3.utils.hexToNumberString(_input);
}


contract("ERC20d", async accounts => {

  it("Verify vID of founder for genesis transaction", () =>
    ERC20d.deployed()
      .then(_instance => _instance.getvID.call(accounts[0]))
      .then(async _id => {
        var latestBlock = await web3.eth.getBlock("latest");
        var encodedData = fromValidityID(_id);
        var checkSummed = await web3.utils.toChecksumAddress(encodedData.address);
        assert.ok(
          latestBlock.number > encodedData.blockNumber
          && accounts[0] === checkSummed,
          "vID generation failure"
        );
     })
  );
  it("Genesis transaction to founder executed", () =>
    ERC20d.deployed()
      .then(_instance => _instance.balanceOf.call(accounts[0]))
      .then(_balance => {
        assert.equal(
          _balance.valueOf(),
          genesisValue,
          "Genesis transaction was not successfully transacted"
        );
     })
  );
  it("Verify the 5% of the supply is unminted", () =>
    ERC20d.deployed()
      .then(_instance => _instance.totalSupply.call()
      .then(async _supply => {
        var convertedSupply = await web3.utils.hexToNumberString(_supply);
        assert.equal(
          convertedSupply,
          genesisValue,
          "Illogical mint affecting validation supply"
        );
      })
   ));
  it("Verify the 5% of the supply is unminted", () =>
     ERC20d.deployed()
       .then(_instance => _instance.totalSupply.call()
       .then(async _supply => {
         var convertedSupply = await web3.utils.hexToNumberString(_supply);
         assert.equal(
           convertedSupply,
           genesisValue,
           "Illogical mint affecting validation supply"
       );
    })
  ))
  it("Transfer functionality; not staking", () =>
       ERC20d.deployed()
         .then(async _instance => {
            var oneVote = web3.utils.toBN(10000).mul(web3.utils.toBN(1e18));
            var preBalance = await _instance.balanceOf.call(accounts[0]);

            await _instance.transfer(accounts[1], oneVote, {from: accounts[0]});

            var postBalance = await _instance.balanceOf.call(accounts[0]);
            var recipentBalance = await _instance.balanceOf.call(accounts[1]);

            recipentBalance = await convertHex(recipentBalance);
            postBalance = await convertHex(postBalance);
            preBalance = await convertHex(preBalance);

            var balanceDifference = await subtractValues(preBalance, postBalance);

            assert.equal(
              balanceDifference,
              oneVote,
              "Keymapping exploit"
            );
            assert.equal(
              recipentBalance,
              oneVote,
              "Transfer was not successful"
            );
         })
   );
   it("Transfer functionality; staking", () =>
        ERC20d.deployed()
          .then(async _instance => {
            var postBalance = await _instance.balanceOf.call(accounts[0]);
             var oneVote = web3.utils.toBN(10000).mul(web3.utils.toBN(1e18));
             await _instance.toggleStake({ from: accounts[0] });
             try {
                await _instance.transfer(accounts[1], oneVote, { from: accounts[0] });
             } catch(error) { }
             var preBalance = await _instance.balanceOf.call(accounts[0]);
             preBalance = await convertHex(preBalance);
             postBalance = await convertHex(postBalance);
             assert.equal(
               preBalance,
               postBalance,
               "Transaction was successful whilst staking"
             );
          })
    );
})
