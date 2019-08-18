# ERC20d
### A unique delegation token for the Validity eco-system

Deployed live at [0x904da022abcf44eba68d4255914141298a7f7307](https://etherscan.io/token/0x904da022abcf44eba68d4255914141298a7f7307)

The VLDY token is ERC20 compliant and all transaction functions are that of a standard token but where the features extend to functions of delegation, so the token type is denoted as ERC20d. One could call this new approach towards on-chain governance as an aspect of a **DAO**, of which is incomplete without the symbiotic [Communal Validation](https://github.com/validitycrypto/commaunal-validation) infrastructure, which will embed all validation topics and distribute rewards to participants in events, whereas the token is the asset of user metadata and ability to represent votes.

## Use-cases

* Communal sentiments
* Peer production
* Data integrity

## Stakes

Voting options are all encoded to bytes32 from their stringed forms, whereas delegates reflect their certainties or in the case of neutral stakes uncertainties regarding the validation topic.

* Postitive (POS): `0x506f736974697665000000000000000000000000000000000000000000000000`
* Negative (NEG): `0x4e65676174697665000000000000000000000000000000000000000000000000`
* Neutral (NEU): `0x6e65757472616c00000000000000000000000000000000000000000000000000`

## ValidityID's

The hexadecimal self-sovereign identity declares it's general donation with a starting prefix of 0xffcc, this is the core element of delegate representation in the Validity eco-system, one has to be wary that their ***binding address is the only form of access to representing this declaration and if lost means the ultimate inhibit to validation under that said identity***.  With periodic and accurate usage of one's identity increases one's viability within the infrastructure allowing higher validation staking power with proactive engagements.

**Example of ValidityID conformity**
```
{ address: '0x627306090abab3a6e1400e9345bc60c78a8bef57', block: 13 } ::: 0xffcc96b27a27d472340c3de9627d95192a96b27a2141f752df20eff97ffda338

```

## Syibil Immunity

A private keymap structure `_stake` is introduced to reduce levels of abnormal activity and delegation exploitation, the user's stake/lock their tokens by calling the `toggleStake()` function before committing to a delegation event. Users who are staking cannot receive or send tokens until the event ends which is defined by `delegationReward()` being triggered for the said participant.

## Validation Supply

With the addition of an internal parameter of `_maxSupply` allows for the supply to be limited appropriately, still baring an essence of central control but yet yields a limit to potential misuse. The admin control features should be given full control to the verified delegation contract and not any other entity. To experience this digital commodity to full of its capabilities.

## Validation Metadata

Each voter has a unique delegation data structure that stores insight regarding a users identity, decision, commitment and accuracy. The following information is stored and is publically accessible to any user upon retrieval of a delegation identifier.

***Delegation Identity***
* A parameter that to add a sense personal preference to their delegation identifier.

***Positive Votes***
* A parameter to measure the delegates total positive vote count.

***Negative Votes***
* A parameter to measure the delegates total negative vote count.

***Neutral Votes***
* A parameter to measure the delegates total neutral vote count.

***Total Votes***   
* A parameter to measure the delegates total vote count (`NEG` + `NEU` + `POS`)

***Total Events***
* A parameter to measure the delegates total event count

***Viability***
* A mandatory parameter that delegates are allocated to measure their total delegation commitment and accuracy of results, which will impact their voting weight.
