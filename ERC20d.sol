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

interface IERC20 {
    
    function totalSupply() external view returns (uint256);

    function balanceOf(address who) external view returns (uint256);

    function allowance(address owner, address spender) external view returns (uint256);

    function transfer(address to, uint256 value) external returns (bool);

    function approve(address spender, uint256 value) external returns (bool);

    function transferFrom(address from, address to, uint256 value) external returns (bool);

    event Transfer(address indexed from, address indexed to, uint256 value);

    event Approval(address indexed owner, address indexed spender, uint256 value);
    
}

contract ERC20 is IERC20 {
    
    using SafeMath for uint256;

    mapping (address => uint256) private _balances;
    mapping (address => mapping (address => uint256)) private _allowed;

    uint private _totalSupply =uint(48070000000).mul(10**uint(18));
    uint private _maxSupply = uint(50600000000).mul(10**uint(18));
    uint public totalSupply = _totalSupply;
    
    function totalSupply() public pure returns (uint256 _totalSupply) {}
    
    function maxSupply() public pure returns (uint256 _maxSupply) {}

    function balanceOf(address owner) public view returns (uint256) {
        return _balances[owner];
    }

    function allowance(address owner, address spender) public view returns (uint256) {
        return _allowed[owner][spender];
    }

    function transfer(address to, uint256 value) public returns (bool) {
        _transfer(msg.sender, to, value);
        return true;
    }

    function approve(address spender, uint256 value) public returns (bool) {
        require(spender != address(0));

        _allowed[msg.sender][spender] = value;
        emit Approval(msg.sender, spender, value);
        return true;
    }

    function transferFrom(address from, address to, uint256 value) public returns (bool) {
        _allowed[from][msg.sender] = _allowed[from][msg.sender].sub(value);
        _transfer(from, to, value);
        emit Approval(from, msg.sender, _allowed[from][msg.sender]);
        return true;
    }

    function increaseAllowance(address spender, uint256 addedValue) public returns (bool) {
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

    function _transfer(address from, address to, uint256 value) internal {
        require(to != address(0));

        _balances[from] = _balances[from].sub(value);
        _balances[to] = _balances[to].add(value);
        emit Transfer(from, to, value);
    }

    function _mint(address account, uint256 value) internal {
        require(_maxSupply != _totalSupply.add(value));
        require(account != address(0));
        
        _totalSupply = _totalSupply.add(value);
        _balances[account] = _balances[account].add(value);
        emit Transfer(address(0), account, value);
    }

}

contract ERC20d is ERC20
{

    struct _delegate {
        bytes32 _totalValidations;
        bytes32 _positiveVotes;
        bytes32 _negativeVotes;
        bytes32 _neutralVotes;
        bytes32 _totalVotes;
    }

    bytes32 constant POS = 0x506f736974697665000000000000000000000000000000000000000000000000;
    bytes32 constant NEG = 0x4e65676174697665000000000000000000000000000000000000000000000000;
    bytes32 constant NA = 0x0000000000000000000000000000000000000000000000000000000000000000;
    address public founder = msg.sender;
    address public admin = address(0x0);

    modifier _onlyFounder(){ if(msg.sender != founder){revert();} _; }
    modifier _onlyAdmin(){ if(msg.sender != admin){revert();} _; }

    mapping(address => bytes32) public vID;
    mapping(bytes32 => _delegate) public votingStats;
    
    uint public decimals;
    string public name;
    string public symbol;
    
    constructor() public
    {
        _mint(founder, totalSupply);
        symbol = "VLDY";
        name = "Validity";
        decimals = 18;
    }

    function adminControl(address _entity) public _onlyFounder { admin = _entity; }

    function totalValidations(bytes32 _id) public view returns (uint validations) {
        validations = uint(votingStats[_id]._totalValidations);
    }
    
    function totalVotes(bytes32 _id) public view returns (uint total) {
        total = uint(votingStats[_id]._totalVotes);
    }
    
    function positiveVotes(bytes32 _id) public view returns (uint positive) {
        positive = uint(votingStats[_id]._positiveVotes);
    }
    
    function negativeVotes(bytes32 _id) public view returns (uint negative) {
        negative = uint(votingStats[_id]._negativeVotes);
    }    
    
     function neutralVotes(bytes32 _id) public view returns (uint neutral) {
        neutral = uint(votingStats[_id]._negativeVotes);
    }    
    
    function ValidatingIdentifier(address _user) public returns (bytes32) {
        bytes32 sig = keccak256(abi.encodePacked(_user));
        vID[_user] = sig;
        return sig;
    }

    function delegationEvent(address voter, uint256 weight, bytes32 choice, bytes32 project) public _onlyAdmin
    {   
        bytes32 id = ValidatingIdentifier(voter);
        _delegate storage x = votingStats[id];
        x._totalValidations = bytes32(uint(x._totalValidations).add(1));
        if(choice == POS){ x._positiveVotes = bytes32(uint(x._positiveVotes).add(weight)); }
        else if(choice == NEG){ x._negativeVotes = bytes32(uint(x._negativeVotes).add(weight)); }
        x._totalVotes = bytes32(uint(x._totalVotes).add(weight));
    }

}
