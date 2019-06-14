const { toValidityID, fromValidityID } = require('../utils/validity-id.js');
const ERC20d = artifacts.require("ERC20d");

const POS = "0x506f736974697665000000000000000000000000000000000000000000000000";
const NEU = "0x4e65757472616c00000000000000000000000000000000000000000000000000";
const NEG = "0x4e65676174697665000000000000000000000000000000000000000000000000";
const zeroId = "0x0000000000000000000000000000000000000000000000000000000000000000"
const zeroAddress = "0x0000000000000000000000000000000000000000";
const oneVote = web3.utils.toBN(10000).mul(web3.utils.toBN(1e18));
const genesisValue = 48070000000000000000000000000;
const maxValue = 50600000000000000000000000000;

function subtractValues(_a, _b) {
  var valueDelta = web3.utils.toBN(_a).sub(web3.utils.toBN(_b));
  return web3.utils.hexToNumberString(valueDelta);
}

function convertHex(_input) {
  return web3.utils.hexToNumberString(_input);
}

function convertString(_input) {
  return web3.utils.hexToAscii(_input).replace(/\s/g,'');
}

function checkSum(_address){
  return web3.utils.toChecksumAddress(_address)
}

contract("ERC20d", async accounts => {

  it("Genesis ::: constructor()", () =>
    ERC20d.deployed()
      .then(_instance => _instance.balanceOf.call(accounts[0]))
      .then(_balance => {
        assert.equal(_balance.valueOf(), genesisValue,
          "Genesis transaction was not successfully transacted"
        );
     })
  );
  it("Tokeneconomics ::: name() ", () =>
     ERC20d.deployed()
       .then(_instance => _instance.name.call()
       .then(_name => {
         assert.equal(_name, "Validity",
           "Incorrect asset name"
       );
    })
  ));
  it("Tokeneconomics ::: symbol() ", () =>
     ERC20d.deployed()
       .then(_instance => _instance.symbol.call()
       .then(_symbol => {
         assert.equal(_symbol, "VLDY",
           "Incorrect asset ticker"
       );
    })
  ));
  it("Tokeneconomics ::: decimals() ", () =>
     ERC20d.deployed()
       .then(_instance => _instance.decimals.call()
       .then(_decimals => {
         assert.equal(_decimals, 18,
           "Incorrect decimals"
       );
    })
  ));
  it("Tokeneconomics ::: totalSupply() ", () =>
     ERC20d.deployed()
       .then(_instance => _instance.totalSupply.call()
       .then(_supply => {
         assert.equal(convertHex(_supply), genesisValue,
           "Illogical mint affecting validation supply"
       );
    })
  ));
  it("Tokeneconomics ::: maxSupply() ", () =>
     ERC20d.deployed()
       .then(_instance => _instance.maxSupply.call()
       .then(_supply => {
         assert.equal(convertHex(_supply), maxValue,
           "Illogical mint affecting validation supply"
       );
    })
  ));
  it("Ownership ::: _onlyFounder()", () =>
       ERC20d.deployed()
         .then(async _instance => {
           var genesisId = await _instance.validityId.call(accounts[0]);

           try {
             await _instance.adminControl(accounts[0], { from: accounts[1] });
           } catch(error) {}

           await _instance.adminControl(accounts[1], { from: accounts[0] });
           await _instance.adminControl(zeroAddress, { from: accounts[0] });
         })
   );
  it("Ownership ::: _onlyAdmin()", () =>
       ERC20d.deployed()
         .then(async _instance => {
           var genesisId = await _instance.validityId.call(accounts[0]);

           try {
             await _instance.increaseTrust(genesisId, { from: accounts[1] });
           } catch(error) {}

           await _instance.adminControl(accounts[1], { from: accounts[0] });
           await _instance.increaseTrust(genesisId, { from: accounts[1] });
           await _instance.adminControl(zeroAddress, { from: accounts[0] });
         })
   );
   it("Identity ::: validtyID()", () =>
     ERC20d.deployed()
       .then(_instance => _instance.validityId.call(accounts[0]))
       .then(async _id => {
         var encodedData = fromValidityID(_id);
         var latestBlock = await web3.eth.getBlock("latest");
         assert.ok(latestBlock.number > encodedData.blockNumber
            && accounts[0] === checkSum(encodedData.address),
           "ValidityID generation failure"
         );
      })
   );
   it("Identity ::: setIdentity()", () =>
     ERC20d.deployed()
       .then(async _instance => {
         var genesisId = await _instance.validityId.call(accounts[0]);
         var subjectId = await _instance.validityId.call(accounts[1]);
         var subjectInput = web3.utils.asciiToHex("Gozzy", 32);

         assert.equal(subjectId, zeroId,
           "Subject already has a ValdityID"
         );

         try {
           await _instance.setIdentity(subjectInput, { from: accounts[1] });
         } catch(error) {}

         await _instance.setIdentity(subjectInput, { from: accounts[0] });

         var genesisIdentity = await _instance.getIdentity.call(genesisId);
         genesisIdentity = convertString(genesisIdentity).substring(0,5);

         assert.equal(genesisIdentity, convertString(subjectInput),
           "Identity assignment failure"
         );
      })
   );
   it("Identity ::: getAddress()", () =>
     ERC20d.deployed()
       .then(async _instance => {
         var subjectId = await _instance.validityId.call(accounts[0]);
         var internalData = await _instance.getAddress.call(subjectId);
         var encodedData = fromValidityID(subjectId);

         assert.equal(internalData, checkSum(encodedData.address),
           "ValidityID address mapping failure"
         );
      })
   );
  it("Transactional ::: !isStaking()", () =>
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
   it("Transactional ::: isStaking()", () =>
        ERC20d.deployed()
          .then(async _instance => {
             var preBalance = convertHex(await _instance.balanceOf.call(accounts[0]));

             await _instance.toggleStake({ from: accounts[0] });

             var isStaking = await _instance.isStaking.call(accounts[0]);

             assert.equal(isStaking, true,
               "Subject is not staking"
             );

             try {
                await _instance.transfer(accounts[1], oneVote, { from: accounts[0] });
             } catch(error) {}

             var postBalance = convertHex(await _instance.balanceOf.call(accounts[0]));

             await _instance.toggleStake({ from: accounts[0] });

             assert.equal(preBalance, postBalance,
               "Transaction was successful whilst staking"
             );
          })
    );
    it("Transactional ::: approve()", () =>
          ERC20d.deployed()
            .then(async _instance => {
              await _instance.approve(accounts[1], oneVote, {from: accounts[0] });

              try {
                await _instance.approve(accounts[1], oneVote, {from: accounts[0] });
              } catch(error) {}

              await _instance.decreaseAllowance(accounts[1], oneVote, {from: accounts[0] });
              await _instance.approve(accounts[1], oneVote, {from: accounts[0] });
              await _instance.decreaseAllowance(accounts[1], oneVote, {from: accounts[0] });
            })
      );
      it("Transactional ::: transferFrom()", () =>
           ERC20d.deployed()
             .then(async _instance => {
               var preBalance = convertHex(await _instance.balanceOf.call(accounts[0]));

               await _instance.approve(accounts[1], oneVote, {from: accounts[0] });
               await _instance.transferFrom(accounts[0], accounts[1], oneVote, { from: accounts[1] });

               var postBalance = convertHex(await _instance.balanceOf.call(accounts[0]));

               try {
                 await _instance.transferFrom(accounts[0], accounts[1], oneVote, { from: accounts[1] });
               } catch(error) {}

               assert.equal(subtractValues(preBalance, postBalance), oneVote,
                 "Approval was not successful"
               );
             })
      );
})
