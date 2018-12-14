# Validity ERC20d Token Contract
Records voting informatics for negative, postive, and total particpation count of every registered voter. 

The VLDY token is ERC20 compliant and all transaction functions are that of a standard token but where the features extend to functions of delegation, so the token type is denoted as ERC20d. 

#### Parameters of communal votes are categorised into three options all of which are encoded to base16 (Hex)

* Postitive > `0x506f736974697665000000000000000000000000000000000000000000000000`
* Negative > `0x4e65676174697665000000000000000000000000000000000000000000000000`
* Neutral > `0x6e65757472616c00000000000000000000000000000000000000000000000000`

#### Each user has a unique delegation identifier 

That is automaticallly generated when they recieve a ERC20d balance for the first time. The id allows access to the delegates voting statistics, credibility and identity. The hexdecimal id is contains a prefix for the asset, the block timestamp and the users calling account.

`Address: 0x267D19a33E10B7E42596096b7C0a3856872E21e1 -> 
vID: 0x56616c69646974795c06b51c267d19a33e10b7e42596096b7c0a3856872e21e1

Address: 0x39b494927F510AD5758907b959048454eC9b0976 -> 
vID:0x56616c69646974795c06b4d139b494927f510ad5758907b959048454ec9b0976

Address: 0xE40EB743300EE880736F47c266187aD63c77EF74 ->
vID: 0x56616c69646974795c06b34be40eb743300ee880736f47c266187ad63c77ef74`

#### Minting supply implementation for delegation rewards

With addition of a internal parameter of `_maxSupply` allows for the supply to be limited in an aprrioriate manner, still baring an essence of central control but yet yields a limit to potential mis-use. The admin control features should be given full control to the verified delegation contract and not any other entity. In order to expierence this digital commoditiy to full of it's capabilities. 

#### Delegation statistics

Each votee has a unique delegation data structure that stores insight regarding a users identity , decision, commitment and accuracy. The following information is stored and is publically accessible to any user upon retrieval of a delegation identifier. 

* Delegation Identity
* Positive Votes
* Negative Votes
* Neutral Votes
* Total Votes
* Total Events
* Trust Level
