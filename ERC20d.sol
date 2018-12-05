pragma solidity ^0.4.24;

library SafeMath {

    function mul(uint256 a, uint256 b) internal pure returns (uint256) {
        if (a == 0) { return 0; }
        uint256 c = a * b;
        require(c / a == b);
        return c;
    }

    function div(uint256 a, uint256 b) internal pure returns (uint256) {
        require(b > 0);
        uint256 c = a / b;
        return c;
    }

    function sub(uint256 a, uint256 b) internal pure returns (uint256) {
        require(b <= a);
        uint256 c = a - b;
        return c;
    }

    function add(uint256 a, uint256 b) internal pure returns (uint256) {
        uint256 c = a + b;
        require(c >= a);
        return c;
    }

    function mod(uint256 a, uint256 b) internal pure returns (uint256) {
        require(b != 0);
        return a % b;
    }
    
}

contract ERC20d {
    
    using SafeMath for uint;

    bytes32 constant POS = 0x506f736974697665000000000000000000000000000000000000000000000000;
    bytes32 constant NEG = 0x4e65676174697665000000000000000000000000000000000000000000000000;
    bytes32 constant NEU = 0x6e65757472616c00000000000000000000000000000000000000000000000000;

    struct _delegate {
        bytes32 _totalValidations;
        bytes32 _positiveVotes;
        bytes32 _negativeVotes;
        bytes32 _neutralVotes;
        bytes32 _totalVotes;
    }    
    
    mapping (address => mapping (address => uint)) private _allowed;
    mapping (address => uint) private _balances;
    mapping (bytes => _delegate) private vStats;
    mapping (bytes => address) private vAddress;
    mapping (address => bool) public vActive;
    mapping (address => bytes) private vID;

    address public founder = msg.sender;
    address public admin = address(0x0);
    uint private _totalSupply;
    uint private _maxSupply;
    string public name;
    string public symbol;
    uint public decimals;

    modifier _onlyFounder(){ require(msg.sender == founder); _; }
    
    modifier _onlyAdmin(){ require(msg.sender == admin); _; }

    modifier _verifyID(address _account){ 
        if(!vActive[_account]){
            createvID(_account);
        } 
        _; 
    }

    constructor() public { 
        uint genesis = uint(48070000000).mul(10**uint(18));
        _maxSupply = uint(50600000000).mul(10**uint(18));
        _mint(founder, genesis); 
        name = "Validity";
        symbol = "VLDY";
        decimals = 18;
    }
    
    function adminControl(address _entity) public _onlyFounder { admin = _entity; }
    
    function totalSupply() public view returns (uint total) { 
        total = _totalSupply;
    }
    
    function maxSupply() public view returns (uint max) {
        max = _maxSupply;
    }
    
    function getvID(address _account) public view returns (bytes id) {
        id = vID[_account];
    }
    
    function getvAddress(bytes _id) public view returns (address account) {
        account = vAddress[_id];
    }

    function totalValidations(bytes _id) public view returns (uint count) {
        count = uint(vStats[_id]._totalValidations);
    }
    
    function totalVotes(bytes _id) public view returns (uint total) {
        total = uint(vStats[_id]._totalVotes);
    }
    
    function positiveVotes(bytes _id) public view returns (uint positive) {
        positive = uint(vStats[_id]._positiveVotes);
    }
    
    function negativeVotes(bytes _id) public view returns (uint negative) {
        negative = uint(vStats[_id]._negativeVotes);
    }    
    
     function neutralVotes(bytes _id) public view returns (uint neutral) {
        neutral = uint(vStats[_id]._neutralVotes);
    }    
    
    function balanceOf(address _owner) public view returns (uint256) {
        return _balances[_owner];
    }

    function allowance(address _owner, address _spender) public view returns (uint256) {
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
    
     function _transfer(address _from, address _to, uint _value) _verifyID(_to) internal {
        require(_to != address(0x0));

        _balances[_from] = _balances[_from].sub(_value);
        _balances[_to] = _balances[_to].add(_value);
        emit Transfer(_from, _to, _value);
    }

    function _mint(address _account, uint _value) _verifyID(_account) internal {
        require(_totalSupply.add(_value) <= _maxSupply);
        require(_account != address(0x0));

        _totalSupply = _totalSupply.add(_value);
        _balances[_account] = _balances[_account].add(_value);
        emit Transfer(address(0x0), _account, _value);
    }

    function delegationEvent(bytes _id, uint _weight, bytes32 _choice, uint _reward) _onlyAdmin public {   
        require(_choice != bytes32(0x0));
        
        _delegate storage x = vStats[_id];
        if(_choice == POS) { 
            x._positiveVotes = bytes32(uint(x._positiveVotes).add(_weight)); 
        } else if(_choice == NEG) { 
            x._negativeVotes = bytes32(uint(x._negativeVotes).add(_weight)); 
        } else if(_choice == NEU) {
            x._negativeVotes = bytes32(uint(x._neutralVotes).add(_weight)); 
        }
        x._totalValidations = bytes32(uint(x._totalValidations).add(1));
        x._totalVotes = bytes32(uint(x._totalVotes).add(_weight)); 
        delegationReward(_id, _reward);
    }
    
    function delegationReward(bytes _id, uint _reward) internal {
       _mint(vAddress[_id], _reward);
       emit Reward(_id, _reward);
    }

    function ValidatingIdentifier(address _account) internal view returns (bytes id) {
        bytes memory stamp = bytesStamp(block.timestamp);
        bytes32 prefix = 0x56616c6964697479;
        bytes32 x = bytes32(_account);
        id = new bytes(32);
        for(uint v = 0; v < id.length; v++){
            uint prefixIndex = 24 + v;
            uint timeIndex = 20 + v;
            if(v < 8){ 
                id[v] = prefix[prefixIndex];
            } else if(v < 12){
                id[v] = stamp[timeIndex];
            } else {  
                id[v] = x[v];
            }
        }
    }
    
    function bytesStamp(uint _x) internal pure returns (bytes b) {
        b = new bytes(32);
        assembly { 
            mstore(add(b, 32), _x) 
        }
    }
    
    function createvID(address _account) internal {
         bytes memory id = ValidatingIdentifier(_account);
         vActive[_account] = true;
         vAddress[id] = _account; 
         vID[_account] = id;
    }
    
    event Approval(address indexed owner, address indexed spender, uint value);
    
    event Transfer(address indexed from, address indexed to, uint  value);
    
    event Reward(bytes vID, uint reward);

}
