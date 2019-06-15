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
  var valueDelta = web3.utils.toBN(convertHex(_a)).sub(web3.utils.toBN(convertHex(_b)));
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

async function shortAddress(){
  await web3.eth.accounts.wallet.clear();
  var newAccount = await web3.eth.accounts.wallet.create(1)
  var startIndex = newAccount[0].address.length-2;
  var endIndex = newAccount[0].address.length+1;
  var shortAddress = JSON.stringify(newAccount[0].address).substring(startIndex, endIndex);
  while (shortAddress != "000"){
    await web3.eth.accounts.wallet.remove(newAccount);
    newAccount = await web3.eth.accounts.wallet.create(1);
    shortAddress = JSON.stringify(newAccount[0].address).substring(startIndex, endIndex);
  }
  return newAccount[0];
}

async function timeTravel(){
  for(var x = 0 ; x < 1000 ; x++){
    await web3.currentProvider.send({
      jsonrpc: '2.0',
      method: 'evm_mine',
      params: 0
    }, () => {});
  }
}

contract("ERC20d", async accounts => {

  it("Genesis ::: constructor()", () =>
    ERC20d.deployed()
      .then(_instance => _instance.balanceOf.call(accounts[0]))
      .then(_balance => {
        assert.equal(_balance.valueOf(), genesisValue,
          "Genesis transaction failure"
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
           "Illogical maximum supply"
       );
    })
  ));
  it("Ownership ::: _onlyFounder()", () =>
       ERC20d.deployed()
         .then(async _instance => {
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
             var preAttack = await _instance.trustLevel.call(genesisId);
             await _instance.increaseTrust(genesisId, { from: accounts[1] });
           } catch(error) {
             var postAttack = await _instance.trustLevel.call(genesisId);
             assert.equal(convertHex(preAttack), convertHex(preAttack),
               "Admin ownership failure by non-authorised user"
             );
           }

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
         } catch(error) {
           subjectId = await _instance.validityId.call(accounts[1]);

           assert.equal(subjectId, zeroId,
             "Identity exploit w/ non-active validators"
           );
         }

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
            var preBalance = await _instance.balanceOf.call(accounts[0]);

            await _instance.transfer(accounts[1], oneVote, {from: accounts[0]});

            var postBalance = await _instance.balanceOf.call(accounts[0]);

            assert.equal(subtractValues(preBalance, postBalance), oneVote,
              "Balance keymapping exploit"
            );

            var recipentBalance = await _instance.balanceOf.call(accounts[1]);

            assert.equal(convertHex(recipentBalance), oneVote,
              "Transfer was not successful"
            );
         })
   );
   it("Transactional ::: isStaking()", () =>
        ERC20d.deployed()
          .then(async _instance => {
             var preBalance = await _instance.balanceOf.call(accounts[0]);

             await _instance.toggleStake({ from: accounts[0] });

             var isStaking = await _instance.isStaking.call(accounts[0]);

             assert.equal(isStaking, true,
               "Subject is not staking"
             );

             try {
                var preAttack = await _instance.balanceOf.call(accounts[0]);
                await _instance.transfer(accounts[1], oneVote, { from: accounts[0] });
             } catch(error) {
               var postAttack = await _instance.balanceOf.call(accounts[0]);

               assert.equal(convertHex(preAttack), convertHex(postAttack),
                   "Staking transactional inhibition failure"
               );
             }

             var postBalance = await _instance.balanceOf.call(accounts[0]);

             await _instance.toggleStake({ from: accounts[0] });

             assert.equal(convertHex(preBalance), convertHex(postBalance),
               "Transaction was successful whilst staking"
             );
          })
    );
    it("Transactional ::: allowance()", () =>
          ERC20d.deployed()
            .then(async _instance => {
              try{
                var preAttack = await _instance.allowance.call(accounts[0], accounts[1]);

                await _instance.increaseAllowance(accounts[1], -oneVote, {from: accounts[0] });
              } catch(error){
                var postAttack = await _instance.allowance.call(accounts[0], accounts[1]);

                assert.equal(convertHex(preAttack), convertHex(postAttack),
                    "Underflow failure within allowance mapping"
                );
              }

              await _instance.increaseAllowance(accounts[1], oneVote, {from: accounts[0] });

              var preAllowance = await _instance.allowance.call(accounts[0], accounts[1]);

              assert.equal(convertHex(preAllowance), oneVote,
                "Allowance was not successfully updated ::: ++"
              );

              await _instance.decreaseAllowance(accounts[1], oneVote, {from: accounts[0] });

              var postAllowance = await _instance.allowance.call(accounts[0], accounts[1]);

              assert.equal(convertHex(postAllowance), 0,
                "Allowance was not successfully updated ::: --"
              );

            })
      );
    it("Transactional ::: approve()", () =>
          ERC20d.deployed()
            .then(async _instance => {

              await _instance.approve(accounts[1], oneVote, {from: accounts[0] });

              try {
                var preAllowance = await _instance.allowance.call(accounts[0], accounts[1]);
                await _instance.approve(accounts[1], oneVote, {from: accounts[0] });
              } catch(error) {
                var postAllowance = await _instance.allowance.call(accounts[0], accounts[1]);

                assert.equal(convertHex(preAllowance), convertHex(postAllowance),
                  "Allowance limitation failure"
                );
              }

              await _instance.decreaseAllowance(accounts[1], oneVote, {from: accounts[0] });
              await _instance.approve(accounts[1], oneVote, {from: accounts[0] });
              await _instance.decreaseAllowance(accounts[1], oneVote, {from: accounts[0] });
            })
      );
      it("Transactional ::: transferFrom() ::: NORM", () =>
           ERC20d.deployed()
             .then(async _instance => {
               var preBalance = await _instance.balanceOf.call(accounts[0]);

               await _instance.approve(accounts[1], oneVote, {from: accounts[0] });
               await _instance.transferFrom(accounts[0], accounts[1], oneVote, { from: accounts[1] });

               var postBalance = await _instance.balanceOf.call(accounts[0]);

               assert.equal(subtractValues(preBalance, postBalance), oneVote,
                 "Approval was not successful"
               );

               try {
                 await _instance.transferFrom(accounts[0], accounts[1], oneVote, { from: accounts[1] });
               } catch(error) {
                 var postAttack = convertHex(await _instance.balanceOf.call(accounts[0]));

                 assert.equal(convertHex(postBalance), convertHex(postAttack),
                   "Approval attack vector within allowance CEI"
                 );
               }
             })
      );
      it("Transactional ::: transferFrom() ::: SHORT ", () =>
           ERC20d.deployed()
             .then(async _instance => {
                  var adversaryAddress = await shortAddress();
                  var preAttack = await _instance.balanceOf.call(adversaryAddress.address);
                  var rawSignature = await _instance.contract.methods.transfer(
                    checkSum(adversaryAddress.address), convertHex(oneVote)).encodeABI();
                  await web3.eth.sendTransaction({
                    from: accounts[0],
                    to: _instance.address,
                    data: rawSignature,
                    gas: 5750000,
                  });
                  var postAttack = await _instance.balanceOf.call(adversaryAddress.address);
                  assert.equal(subtractValues(oneVote, postAttack), 0,
                  "Short address vulnerability");
              })
      );
      it("Delegation ::: delegationEvent()", () =>
           ERC20d.deployed()
             .then(async _instance => {
                var subjectId = await _instance.validityId.call(accounts[1]);

                await _instance.adminControl(accounts[0], { from: accounts[0] });
                await _instance.toggleStake({ from: accounts[1] });
                await _instance.delegationEvent(subjectId, zeroId, POS, oneVote, { from: accounts[0] });

                var positiveVotes = await _instance.positiveVotes.call(subjectId);

                assert.equal(convertHex(positiveVotes), oneVote,
                  "Failure updating delegate option meta-data"
                );

                var neutralVotes = await _instance.neutralVotes.call(subjectId);

                assert.equal(convertHex(neutralVotes), 0,
                  "Failure indexing delegate option meta-data"
                );

                var negativeVotes = await _instance.negativeVotes.call(subjectId);

                assert.equal(convertHex(negativeVotes), 0,
                  "Failure indexing delegate option meta-data"
                );

                var totalVotes = await _instance.totalVotes.call(subjectId);

                assert.equal(convertHex(totalVotes), oneVote,
                  "Failure indexing delegate option meta-data"
                );

                var totalEvents = await _instance.totalEvents.call(subjectId);

                assert.equal(convertHex(totalEvents), 1,
                  "Failure indexing delegate option meta-data"
                );

           })
    );
    it("Delegation ::: isVoted() ::: PRE", () =>
         ERC20d.deployed()
           .then(async _instance => {
              var subjectId = await _instance.validityId.call(accounts[1]);

              var votingStatus = await _instance.isVoted.call(subjectId);

              assert.equal(votingStatus, true,
                "Failure setting voting status"
              );
         })
    );
    it("Delegation ::: delegationEvent()", () =>
         ERC20d.deployed()
           .then(async _instance => {
              var subjectId = await _instance.validityId.call(accounts[1]);

              var preBalance = await _instance.balanceOf(accounts[1]);

              await _instance.delegationReward(subjectId, accounts[1], oneVote, { from: accounts[0] });

              try {
                var preAttack = await _instance.balanceOf(accounts[1]);
                await _instance.delegationReward(subjectId, accounts[1], oneVote, { from: accounts[0] });
              } catch(error){
                var postAttack = await _instance.balanceOf(accounts[1]);

                assert.equal(convertHex(postAttack), convertHex(preAttack),
                  "Double spend failure for validation rewards"
                );
              }

              var postBalance = await _instance.balanceOf(accounts[1]);

              assert.equal(subtractValues(postBalance, preBalance), oneVote,
                "Failure minting delegation reward"
              );
         })
    );
    it("Delegation ::: isVoted() ::: POST", () =>
         ERC20d.deployed()
           .then(async _instance => {
              var subjectId = await _instance.validityId.call(accounts[1]);

              var votingStatus = await _instance.isVoted.call(subjectId);

              assert.equal(votingStatus, false,
                "Failure resetting voting status"
              );
         })
    );
    it("Delegation ::: trustLevel() ::: INCREASE", () =>
         ERC20d.deployed()
           .then(async _instance => {
             var genesisId = await _instance.validityId.call(accounts[0]);
             var currentTrust = await _instance.trustLevel.call(genesisId);

              assert.equal(convertHex(currentTrust), 1,
                  "Failure in updating trust level"
                );
            })
    );
    it("Delegation ::: _trustLimit()", () =>
         ERC20d.deployed()
           .then(async _instance => {
             var genesisId = await _instance.validityId.call(accounts[0]);
             var preAttack = await _instance.trustLevel.call(genesisId);

              try {
                await _instance.increaseTrust(genesisId, { from: accounts[1] });
              } catch(error){
                var postAttack = await _instance.trustLevel.call(genesisId);

                assert.equal(convertHex(postAttack), convertHex(preAttack),
                  "Failure in trust time constraints"
                );
              }

              await timeTravel();
         })
    );
    it("Delegation ::: trustLevel() ::: DECREASE", () =>
         ERC20d.deployed()
           .then(async _instance => {
             var genesisId = await _instance.validityId.call(accounts[0]);

             await _instance.decreaseTrust(genesisId, { from: accounts[0] });

             var currentTrust = await _instance.trustLevel.call(genesisId);

              assert.equal(convertHex(currentTrust), 0,
                  "Failure in decreasing trust level"
                );
            })
    );
})
