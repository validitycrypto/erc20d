# Validity ERC20d Token Contract

Records voting informatics for negative, positive, and total participation count of every registered voter.

The VLDY token is ERC20 compliant and all transaction functions are that of a standard token but where the features extend to functions of delegation, so the token type is denoted as ERC20d.

## Use-cases

* Communal sentiments
* Peer production
* Data integrity

## Stakes

All are encoded to base16 (Hex)

* Postitive (POS): `0x506f736974697665000000000000000000000000000000000000000000000000`
* Negative (NEG): `0x4e65676174697665000000000000000000000000000000000000000000000000`
* Neutral (NEU): `0x6e65757472616c00000000000000000000000000000000000000000000000000`

## ValidityID's

That is automatically generated when they receive an ERC20d balance for the first time. The id allows access to the delegates voting statistics, credibility and identity. The hexadecimal id contains a prefix for the asset, the block timestamp and the users calling account.

```
Address: 0x267D19a33E10B7E42596096b7C0a3856872E21e1 ->
vID: 0x56616c69646974795c06b51c267d19a33e10b7e42596096b7c0a3856872e21e1

Address: 0x39b494927F510AD5758907b959048454eC9b0976 ->
vID: 0x56616c69646974795c06b4d139b494927f510ad5758907b959048454ec9b0976

Address: 0xE40EB743300EE880736F47c266187aD63c77EF74 ->
vID: 0x56616c69646974795c06b34be40eb743300ee880736f47c266187ad63c77ef74
```

## Syibil Immunity

A private keymap structure `_stake` is introduced in order to reduce levels of abnormal activity and delegation exploitation, the user's stake/lock their own tokens by calling the `toggleStake()` function before committing to a delegation event. Users who are staking cannot receive or send tokens until the event ends.

## Validation Supply

With the addition of an internal parameter of `_maxSupply` allows for the supply to be limited in an appropriate manner, still baring an essence of central control but yet yields a limit to potential misuse. The admin control features should be given full control to the verified delegation contract and not any other entity. In order to experience this digital commodity to full of its capabilities.

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
* A mandatory parameter that delegates are allocated to measure their total delegation commitment and accuracy of results, which may impact their voting weight.
