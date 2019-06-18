const { toValidityID, fromValidityID } = require('../utils/validity-id.js');
const Transaction = require('ethereumjs-tx').Transaction;
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

function trimAddress(_address){
  return _address.substring(2, _address.length+1)
}

function checkZero(_address){
  return JSON.stringify(_address).substring(41, 43);
}

async function createRawTX(_accountObject, _target, _abi){
  var subjectAccount = _accountObject.address;
  var subjectKey = _accountObject.privateKey;
  var privateKey = new Buffer(trimAddress(subjectKey), 'hex')
  var metaData = { from: subjectAccount, to: _target, data: _abi, gas: 5750000 };
  var transactionObject = new Transaction(metaData);
  transactionObject.sign(privateKey);
  var serializedObject = transactionObject.serialize();
  return serializedObject;
}

async function shortAddress(){
  await web3.eth.accounts.wallet.clear();
  var newAccount = await web3.eth.accounts.wallet.create(1)
  var shortAddress = checkZero(newAccount[0].address);
  while (shortAddress != "00"){
    await web3.eth.accounts.wallet.clear();
    newAccount = await web3.eth.accounts.wallet.create(1);
    shortAddress = checkZero(newAccount[0].address);
  }
  return newAccount[0];
}

const mineOneBlock = async() => (
  await web3.currentProvider.send({
    jsonrpc: '2.0',
    method: 'evm_mine',
    params: 0
  }, () => {})
);

async function timeTravel(){
  for(var x = 0 ; x < 1000 ; x++){
    await mineOneBlock();
  }
}

async function timeMorph(){
    await web3.currentProvider.send({
      jsonrpc: '2.0',
      method: 'evm_increaseTime',
      params: 604860
    }, () => {});
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
  it("Tokeneconomics ::: volume() ", () =>
     ERC20d.deployed()
       .then(async _instance => {
         var preVolume = await _instance.volume.call();

         await _instance.transfer(accounts[6], oneVote);

         var postVolume = await _instance.volume.call();

         assert.equal(convertHex(preVolume[0]), convertHex(postVolume[0]),
          "Failure maintaining timestamp limit for volume mapping"
         );

         assert.equal(subtractValues(postVolume[1], preVolume[1]), convertHex(oneVote),
          "Failure computing values for volume storage"
        );

        var oldBlock = await web3.eth.getBlock("latest");

        await timeMorph();
        await mineOneBlock();

        await _instance.transfer(accounts[6], oneVote);

        var newVolume = await _instance.volume.call();

        assert.ok(convertHex(postVolume[0]) < convertHex(newVolume[0]),
         "Failure redirecting timestamp limit for volume mapping"
        );

        assert.equal(convertHex(newVolume[1]), oneVote,
         "Failure redirecting timestamp keys for volume mapping"
        );

       })
  );
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
  it("Transactional ::: isStaking() ::: PRE", () =>
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
   it("Transactional ::: isStaking() ::: POST", () =>
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

              await _instance.decreaseAllowance(accounts[1], convertHex(oneVote), {from: accounts[0] });

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
      it("Delegation ::: delegationEvent() ::: NORM", () =>
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
    it("Delegation ::: delegationEvent() ::: SHORT", () =>
         ERC20d.deployed()
           .then(async _instance => {
              var adversaryObject = web3.eth.accounts.wallet[0];

              await web3.eth.sendTransaction({
                value: 1000000000000000000,
                to: adversaryObject.address,
                from: accounts[0]
              });

              var stakeSignature = await _instance.contract.methods.toggleStake().encodeABI();
              var adversaryRaw = await createRawTX(adversaryObject, _instance.address, stakeSignature);

              await web3.eth.sendSignedTransaction('0x' + adversaryRaw.toString('hex'))

              var adversaryId = await _instance.validityId.call(adversaryObject.address);
              var rawSignature = await _instance.contract.methods.delegationEvent(adversaryId,
                zeroId, POS, convertHex(oneVote)).encodeABI();

              await web3.eth.sendTransaction({
                from: accounts[0],
                to: _instance.address,
                data: rawSignature,
                gas: 5750000,
              });

              var positiveVotes = await _instance.positiveVotes.call(adversaryId);

              assert.equal(convertHex(positiveVotes), oneVote,
                "Failure updating delegate option meta-data"
              );

              var neutralVotes = await _instance.neutralVotes.call(adversaryId);

              assert.equal(convertHex(neutralVotes), 0,
                "Failure indexing delegate option meta-data"
              );

              var negativeVotes = await _instance.negativeVotes.call(adversaryId);

              assert.equal(convertHex(negativeVotes), 0,
                "Failure indexing delegate option meta-data"
              );

              var totalVotes = await _instance.totalVotes.call(adversaryId);

              assert.equal(convertHex(totalVotes), oneVote,
                "Failure indexing delegate option meta-data"
              );

              var totalEvents = await _instance.totalEvents.call(adversaryId);

              assert.equal(convertHex(totalEvents), 1,
                "Failure indexing delegate option meta-data"
              );

         })
  );
  it("Delegation ::: isActive() ::: PRE", () =>
       ERC20d.deployed()
         .then(async _instance => {
            var validationStatus = await _instance.isActive.call(accounts[4]);
            var subjectId = await _instance.validityId.call(accounts[4]);
            var accountBalance = await _instance.balanceOf(accounts[4]);

            assert.equal(accountBalance, 0,
              "Subject account already has a balance"
            );

            assert.equal(subjectId, zeroId,
              "Failure regarding ValidityID generation"
            );

            assert.equal(validationStatus, false,
              "Failure logging validation activity"
            );
       })
  );
  it("Delegation ::: isActive() ::: POST", () =>
       ERC20d.deployed()
         .then(async _instance => {
           await _instance.transfer(accounts[4], convertHex(oneVote), { from: accounts[0] });

           var validationStatus = await _instance.isActive.call(accounts[4]);
           var subjectId = await _instance.validityId.call(accounts[4]);
           var accountBalance = await _instance.balanceOf(accounts[4]);

           assert.ok(accountBalance > 0,
             "Subject account already has a balance"
           );

           assert.ok(subjectId !== zeroId,
             "Failure regarding ValidityID generation"
           );

           assert.equal(validationStatus, true,
             "Failure logging validation activity"
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
    it("Delegation ::: delegationReward() ::: NORM ", () =>
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
    it("Delegation ::: delegationReward() ::: SHORT ", () =>
         ERC20d.deployed()
           .then(async _instance => {

              var adversaryAddress = web3.eth.accounts.wallet[0].address;

              var adversaryId = await _instance.validityId.call(adversaryAddress);

              var preBalance = await _instance.balanceOf(adversaryAddress);

              await _instance.delegationReward(adversaryId, adversaryAddress, oneVote, { from: accounts[0] });

              try {
                var preAttack = await _instance.balanceOf(adversaryAddress);

                await _instance.delegationReward(adversaryId, adversaryAddress, oneVote, { from: accounts[0] });
              } catch(error){
                var postAttack = await _instance.balanceOf(adversaryAddress);

                assert.equal(convertHex(postAttack), convertHex(preAttack),
                  "Double spend failure for validation rewards"
                );
              }

              var postBalance = await _instance.balanceOf(adversaryAddress);

              assert.equal(subtractValues(postBalance, preBalance), oneVote,
                "Failure minting delegation reward"
              );
         })
    );
    it("Delegation ::: delegationReward() ::: MAX ", () =>
         ERC20d.deployed()
           .then(async _instance => {
             await _instance.transfer(accounts[2], convertHex(oneVote), { from: accounts[0] });
             await _instance.transfer(accounts[3], convertHex(oneVote), { from: accounts[0] });
             await web3.eth.sendTransaction({
               value: 1000000000000000000,
               to: accounts[2],
               from: accounts[0]
             });
             await web3.eth.sendTransaction({
               value: 1000000000000000000,
               to: accounts[3],
               from: accounts[0]
             });

             var subjectOne = await _instance.validityId.call(accounts[2]);
             var subjectTwo = await _instance.validityId.call(accounts[3]);

             var currentSupply = await _instance.totalSupply.call();
             var maxSupply = await _instance.maxSupply.call();
             var remainingSupply = subtractValues(maxSupply, currentSupply);

             await _instance.toggleStake({ from: accounts[2] });
             await _instance.toggleStake({ from: accounts[3] });

             await _instance.delegationEvent(subjectOne, zeroId, POS, oneVote, { from: accounts[0] });
             await _instance.delegationEvent(subjectTwo, zeroId, POS, oneVote, { from: accounts[0] });

             await _instance.delegationReward(subjectOne, accounts[2], remainingSupply, { from: accounts[0] });

             currentSupply = await _instance.totalSupply.call();

             assert.equal(convertHex(currentSupply), maxSupply,
               "Token minting supply limitation failure"
              );

            try {
              var preBalance = await _instance.balanceOf.call(accounts[3])
              await _instance.delegationReward(subjectTwo, accounts[3], remainingSupply, { from: accounts[0] });
            } catch(error) {
              var postBalance = await _instance.balanceOf.call(accounts[3])

              assert.equal(subtractValues(preBalance, postBalance), 0,
                "Overflow detected for token supply"
              );
            }
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
