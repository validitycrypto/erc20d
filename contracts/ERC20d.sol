pragma solidity ^0.5.8;

import "./SafeMath.sol";

contract ERC20d {

    using SafeMath for uint;

    bytes32 constant POS = 0x506f736974697665000000000000000000000000000000000000000000000000;
    bytes32 constant NEU = 0x4e65757472616c00000000000000000000000000000000000000000000000000;
    bytes32 constant NEG = 0x4e65676174697665000000000000000000000000000000000000000000000000;

    struct userObject {
        bytes32 _validationIdentifier;
        bool _validationStatus;
        bool _stakingStatus;
    }

    struct delegateObject {
        address _delegateAddress;
        bytes32 _delegateIdentity;
        bytes32 _positiveVotes;
        bytes32 _negativeVotes;
        bytes32 _neutralVotes;
        bytes32 _totalEvents;
        bytes32 _totalVotes;
        bytes32 _trustLimit;
        bytes32 _trustLevel;
        bool _votingStatus;
    }

    mapping (address => mapping (address => uint)) private _allowed;
    mapping (address => uint) private _balances;

    mapping (bytes32 => delegateObject) private validationData;
    mapping (address => userObject) private validationUser;

    address private _founder = msg.sender;
    address private _admin = address(0x0);

    uint private _totalSupply;
    uint private _maxSupply;
    uint private _decimals;

    string private _name;
    string private _symbol;

    modifier _trustLimit(bytes32 _id) {
        require(uint(validationData[_id]._trustLimit) <= block.number);
        _;
    }

    modifier _stakeCheck(address _from , address _to) {
        require(!isStaking(_from) && !isStaking(_to));
        _;
    }

    modifier _verifyId(address _account) {
        if(!isActive(_account)) conformIdentity(_account);
        _;
    }

    modifier _onlyAdmin() {
        require(msg.sender == _admin);
        _;
    }

    modifier _onlyFounder() {
        require(msg.sender == _founder);
        _;
    }

    constructor() public {
        // 50,600,000,000 VLDY - Max supply
        // 48,070,000,000 VLDY - Initial supply
        //  2,530,000,000 VLDY - Delegation supply
        uint genesis = uint(48070000000).mul(10**uint(18));
        _maxSupply = uint(50600000000).mul(10**uint(18));
        _mint(_founder, genesis);
        _name = "Validity";
        _symbol = "VLDY";
        _decimals = 18;
    }

    function toggleStake() public {
        require(!isVoted(validityId(msg.sender)));
        require(isActive(msg.sender));

        bool currentState = validationUser[msg.sender]._stakingStatus;
        validationUser[msg.sender]._stakingStatus = !currentState;
        emit Stake(msg.sender);
    }

    function setIdentity(bytes32 _identity) public {
        require(isActive(msg.sender));

        validationData[validityId(msg.sender)]._delegateIdentity = _identity;
    }

    function name() public view returns (string memory) {
        return _name;
    }

    function symbol() public view returns (string memory) {
        return _symbol;
    }

    function decimals() public view returns (uint) {
        return _decimals;
    }

    function maxSupply() public view returns (uint) {
        return _maxSupply;
    }

    function totalSupply() public view returns (uint) {
        return _totalSupply;
    }

    function isVoted(bytes32 _id)  public view returns (bool) {
        return validationData[_id]._votingStatus;
    }

    function isActive(address _account)  public view returns (bool) {
        return validationUser[_account]._validationStatus;
    }

    function isStaking(address _account)  public view returns (bool) {
        return validationUser[_account]._stakingStatus;
    }

    function balanceOf(address _owner) public view returns (uint) {
        return _balances[_owner];
    }

    function validityId(address _account) public view returns (bytes32) {
        return validationUser[_account]._validationIdentifier;
    }

    function getIdentity(bytes32 _id) public view returns (bytes32) {
         return validationData[_id]._delegateIdentity;
    }

    function getAddress(bytes32 _id) public view returns (address) {
        return validationData[_id]._delegateAddress;
    }

    function trustLevel(bytes32 _id) public view returns (uint) {
        return uint(validationData[_id]._trustLevel);
    }

    function totalEvents(bytes32 _id) public view returns (uint) {
        return uint(validationData[_id]._totalEvents);
    }

    function totalVotes(bytes32 _id) public view returns (uint) {
        return uint(validationData[_id]._totalVotes);
    }

    function positiveVotes(bytes32 _id) public view returns (uint) {
        return uint(validationData[_id]._positiveVotes);
    }

    function negativeVotes(bytes32 _id) public view returns (uint) {
        return uint(validationData[_id]._negativeVotes);
    }

     function neutralVotes(bytes32 _id) public view returns (uint) {
        return uint(validationData[_id]._neutralVotes);
    }

    function allowance(address _owner, address _spender) public view returns (uint) {
        return _allowed[_owner][_spender];
    }

    function transfer(address _to, uint _value) public returns (bool) {
        _transfer(msg.sender, _to, _value);
        return true;
    }

    function approve(address _spender, uint _value) public returns (bool) {
        require(_allowed[msg.sender][_spender] == uint(0));
        require(_spender != address(0x0));

        _allowed[msg.sender][_spender] = _value;
        emit Approval(msg.sender, _spender, _value);
        return true;
    }

    function _mint(address _account, uint _value) _verifyId(_account) private {
        require(_totalSupply.add(_value) <= _maxSupply);
        require(_account != address(0x0));

        _totalSupply = _totalSupply.add(_value);
        _balances[_account] = _balances[_account].add(_value);
        emit Transfer(address(0x0), _account, _value);
    }

    function transferFrom(address _from, address _to, uint _value) public returns (bool) {
        _allowed[_from][msg.sender] = _allowed[_from][msg.sender].sub(_value);
        _transfer(_from, _to, _value);
        emit Approval(_from, msg.sender, _allowed[_from][msg.sender]);
        return true;
    }

    function increaseAllowance(address _spender, uint _addedValue) public returns (bool) {
        require(_spender != address(0x0));

        _allowed[msg.sender][_spender] = _allowed[msg.sender][_spender].add(_addedValue);
        emit Approval(msg.sender, _spender, _allowed[msg.sender][_spender]);
        return true;
    }

    function decreaseAllowance(address _spender, uint _subtractedValue) public returns (bool) {
        require(_spender != address(0x0));

        _allowed[msg.sender][_spender] = _allowed[msg.sender][_spender].sub(_subtractedValue);
        emit Approval(msg.sender, _spender, _allowed[msg.sender][_spender]);
        return true;
    }

     function _transfer(address _from, address _to, uint _value) _stakeCheck(_from, _to) _verifyId(_to) internal {
        require(_to != address(0x0));

        _balances[_from] = _balances[_from].sub(_value);
        _balances[_to] = _balances[_to].add(_value);
        emit Transfer(_from, _to, _value);
    }

    function delegationReward(bytes32 _id, address _account, uint _reward) _onlyAdmin public {
        require(isStaking(_account));
        require(isVoted(_id));

        validationData[_id]._votingStatus = false;
        validationUser[_account]._stakingStatus = false;
        _mint(_account, _reward);
        emit Reward(_id, _reward);
    }

    function delegationEvent(bytes32 _id, bytes32 _subject, bytes32 _choice, uint _weight) _onlyAdmin public {
        require(_choice == POS || _choice == NEU || _choice == NEG);
        require(isStaking(getAddress(_id)));
        require(!isVoted(_id));

        validationData[_id]._votingStatus = true;
        delegateObject storage x = validationData[_id];
        if(_choice == POS) {
            x._positiveVotes = bytes32(positiveVotes(_id).add(_weight));
        } else if(_choice == NEU) {
            x._neutralVotes = bytes32(neutralVotes(_id).add(_weight));
        } else if(_choice == NEG) {
            x._negativeVotes = bytes32(negativeVotes(_id).add(_weight));
        }
        x._totalVotes = bytes32(totalVotes(_id).add(_weight));
        x._totalEvents = bytes32(totalEvents(_id).add(1));
        emit Vote(_id, _subject, _choice, _weight);
    }

    function valdiationGeneration(address _account) private returns (bytes32) {
        bytes32 id = 0xffcc000000000000000000000000000000000000000000000000000000000000;
        assembly {
            let product := mul(or(_account, shl(0xa0, and(number, 0xffffffff))), 0x7dee20b84b88)
            id := or(id, xor(product, shl(0x78, and(product, 0xffffffffffffffffffffffffffffff))))
        }
        emit Neo(_account, id, block.number);
        return id;
     }

    function increaseTrust(bytes32 _id) _trustLimit(_id) _onlyAdmin public {
        validationData[_id]._trustLimit = bytes32(block.number.add(1000));
        validationData[_id]._trustLevel = bytes32(trustLevel(_id).add(1));
        emit Trust(_id, POS);
    }

    function decreaseTrust(bytes32 _id) _trustLimit(_id) _onlyAdmin public {
        validationData[_id]._trustLimit = bytes32(block.number.add(1000));
        validationData[_id]._trustLevel = bytes32(trustLevel(_id).sub(1));
        emit Trust(_id, NEG);
    }

    function conformIdentity(address _account) internal {
         bytes32 neophyteDelegate = valdiationGeneration(_account);
         validationUser[_account]._validationIdentifier = neophyteDelegate;
         validationData[neophyteDelegate]._delegateAddress = _account;
         validationUser[_account]._validationStatus = true;
    }

    function adminControl(address _entity) _onlyFounder public {
        _admin = _entity;
    }

    event Approval(address indexed owner, address indexed spender, uint value);

    event Transfer(address indexed from, address indexed to, uint value);

    event Vote(bytes32 vID, bytes32 subject, bytes32 choice, uint weight);

    event Neo(address indexed subject, bytes32 vID, uint block);

    event Reward(bytes32 vID, uint reward);

    event Trust(bytes32 vID, bytes32 flux);

    event Stake(address indexed staker);

}
