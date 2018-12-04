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
    bytes32 constant NA = 0x0000000000000000000000000000000000000000000000000000000000000000;
    
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

    modifier _onlyFounder(){ if(msg.sender != founder){revert();} _; }
    modifier _onlyAdmin(){ if(msg.sender != admin){revert();} _; }

    constructor() public { 
        _totalSupply = uint(48070000000).mul(10**uint(18));
        _maxSupply = uint(50600000000).mul(10**uint(18));
        _mint(founder, _totalSupply); 
        name = "Validity";
        symbol = "VLDY";
        decimals = 18;
    }
    
    function adminControl(address _entity) public _onlyFounder { admin = _entity; }
    
    function totalSupply() public pure returns (uint _totalSupply) { }
    
    function maxSupply() public pure returns (uint _maxSupply) { }
    
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
    
    function balanceOf(address owner) public view returns (uint256) {
        return _balances[owner];
    }

    function allowance(address owner, address spender) public view returns (uint256) {
        return _allowed[owner][spender];
    }

    function transfer(address to, uint value) public returns (bool) {
        _transfer(msg.sender, to, value);
        return true;
    }

    function approve(address spender, uint value) public returns (bool) {
        require(spender != address(0));

        _allowed[msg.sender][spender] = value;
        emit Approval(msg.sender, spender, value);
        return true;
    }

    function transferFrom(address from, address to, uint value) public returns (bool) {
        _allowed[from][msg.sender] = _allowed[from][msg.sender].sub(value);
        _transfer(from, to, value);
        emit Approval(from, msg.sender, _allowed[from][msg.sender]);
        return true;
    }

    function increaseAllowance(address spender, uint addedValue) public returns (bool) {
        require(spender != address(0));

        _allowed[msg.sender][spender] = _allowed[msg.sender][spender].add(addedValue);
        emit Approval(msg.sender, spender, _allowed[msg.sender][spender]);
        return true;
    }

    function decreaseAllowance(address spender, uint256 subtractedValue) public returns (bool) {
        require(spender != address(0));

        _allowed[msg.sender][spender] = _allowed[msg.sender][spender].sub(subtractedValue);
        emit Approval(msg.sender, spender, _allowed[msg.sender][spender]);
        return true;
    }
    
     function _transfer(address from, address to, uint value) internal {
        require(to != address(0x0));

        if(!vActive[to]) createvID(to);

        _balances[from] = _balances[from].sub(value);
        _balances[to] = _balances[to].add(value);
        emit Transfer(from, to, value);
    }

    function _mint(address account, uint value) internal {
        require(_maxSupply != _totalSupply.add(value));
        require(account != address(0));

        if(!vActive[account]) createvID(account);

        _totalSupply = _totalSupply.add(value);
        _balances[account] = _balances[account].add(value);
        emit Transfer(address(0), account, value);
    }

    function delegationEvent(address _voter, uint _weight, bytes32 _choice, uint _reward) public _onlyAdmin {   
        _delegate storage x = vStats[vID[_voter]];
        x._totalVotes = bytes32(uint(x._totalVotes).add(_weight)); 
        x._totalValidations = bytes32(uint(x._totalValidations).add(1));
        if(_choice == POS) { 
            x._positiveVotes = bytes32(uint(x._positiveVotes).add(_weight)); 
        } else if(_choice == NEG) { 
            x._negativeVotes = bytes32(uint(x._negativeVotes).add(_weight)); 
        } else if(_choice == NEU) {
            x._negativeVotes = bytes32(uint(x._neutralVotes).add(_weight)); 
        }
        emit Reward(vID[_voter], _reward);
        _mint(_voter, _reward);
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
    
    function bytesStamp(uint x) internal pure returns (bytes b) {
        b = new bytes(32);
        assembly { 
            mstore(add(b, 32), x) 
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
    
    event Reward(bytes indexed vID, uint reward);

}
