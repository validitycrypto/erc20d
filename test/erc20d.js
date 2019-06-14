const { toValidityID, fromValidityID } = require('../utils/validity-id.js');
const ERC20d = artifacts.require("ERC20d");

const oneVote = web3.utils.toBN(10000).mul(web3.utils.toBN(1e18));
const genesisValue = 48070000000000000000000000000;

function subtractValues(_a, _b) {
  var valueDelta = web3.utils.toBN(_a).sub(web3.utils.toBN(_b));
  return web3.utils.hexToNumberString(valueDelta);
}

function convertHex(_input) {
  return web3.utils.hexToNumberString(_input);
}

function checkSum(_address){
  return web3.utils.toChecksumAddress(_address)
}

contract("ERC20d", async accounts => {

  it("Verify genesis ValidityID", () =>
    ERC20d.deployed()
      .then(_instance => _instance.getvID.call(accounts[0]))
      .then(async _id => {
        var encodedData = fromValidityID(_id);
        var latestBlock = await web3.eth.getBlock("latest");
        assert.ok(
          latestBlock.number > encodedData.blockNumber
           && accounts[0] === checkSum(encodedData.address),
          "ValidityID generation failure"
        );
     })
  );
  it("Genesis transaction", () =>
    ERC20d.deployed()
      .then(_instance => _instance.balanceOf.call(accounts[0]))
      .then(_balance => {
        assert.equal(_balance.valueOf(), genesisValue,
          "Genesis transaction was not successfully transacted"
        );
     })
  );
  it("Total supply @ 48,070,000,000 ", () =>
     ERC20d.deployed()
       .then(_instance => _instance.totalSupply.call()
       .then(async _supply => {
         assert.equal(convertHex(_supply), genesisValue,
           "Illogical mint affecting validation supply"
       );
    })
  ));
  it("Ownership functionality; adminControl()", () =>
       ERC20d.deployed()
         .then(async _instance => {

           await _instance.transfer(accounts[1], oneVote, {from: accounts[0]});

           var genesisId = await _instance.getvID.call(accounts[0]);
           var subjectId = await _instance.getvID.call(accounts[1]);

           try {
             await _instance.adminControl(accounts[0], { from: accounts[1] });
           } catch(error) {}

           await _instance.adminControl(accounts[1], { from: accounts[0] });
           await _instance.increaseTrust(genesisId, { from: accounts[1] });

           try {
             await _instance.increaseTrust(subjectId, { from: accounts[0] });
           } catch(error) { }

           await _instance.adminControl(accounts[0], { from: accounts[1] });
           await _instance.increaseTrust(subjectId, { from: accounts[0] });
         })
   );
  it("Transfer functionality; !isStaking()", () =>
       ERC20d.deployed()
         .then(async _instance => {
            var oneVote = web3.utils.toBN(10000).mul(web3.utils.toBN(1e18));
            var preBalance = convertHex(await _instance.balanceOf.call(accounts[0]));

            await _instance.transfer(accounts[1], oneVote, {from: accounts[0]});

            var postBalance = convertHex(await _instance.balanceOf.call(accounts[0]));
            var recipentBalance = convertHex(await _instance.balanceOf.call(accounts[1]));

            assert.equal(subtractValues(preBalance, postBalance), oneVote,
              "Keymapping exploit"
            );
            assert.equal(recipentBalance, oneVote,
              "Transfer was not successful"
            );
         })
   );
   it("Transfer functionality; isStaking()", () =>
        ERC20d.deployed()
          .then(async _instance => {
             var postBalance = convertHex(await _instance.balanceOf.call(accounts[0]));
             await _instance.toggleStake({ from: accounts[0] });
             var isStaking = await _instance.isStaking.call(accounts[0]);

             assert.equal(isStaking, true,
               "Subject is not staking"
             );

             try {
                await _instance.transfer(accounts[1], oneVote, { from: accounts[0] });
             } catch(error) {}

             var preBalance = convertHex(await _instance.balanceOf.call(accounts[0]));
             await _instance.toggleStake({ from: accounts[0] });

             assert.equal(preBalance, postBalance,
               "Transaction was successful whilst staking"
             );
          })
    );
    it("Approval functionality; transferFrom()", () =>
         ERC20d.deployed()
           .then(async _instance => {
             var preBalance = convertHex(await _instance.balanceOf.call(accounts[0]));
             await _instance.approve(accounts[1], oneVote, {from: accounts[0] });
             await _instance.transferFrom(accounts[0], accounts[1], oneVote, { from: accounts[1] });
             var postBalance = convertHex(await _instance.balanceOf.call(accounts[0]));
             assert.equal(subtractValues(preBalance, postBalance), oneVote,
               "Approval was not successful"
             );
           })
     );
     it("Approval functionality; approve()", () =>
          ERC20d.deployed()
            .then(async _instance => {
              await _instance.approve(accounts[1], oneVote, {from: accounts[0] });
              try {
                await _instance.approve(accounts[1], oneVote, {from: accounts[0] });
              } catch(error) {}
              await _instance.decreaseAllowance(accounts[1], oneVote, {from: accounts[0] });
              await _instance.approve(accounts[1], oneVote, {from: accounts[0] });
            })
      );
})
