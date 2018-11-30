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

    uint256 internal _totalSupply =uint(48070000000).mul(10**uint(18));
    uint256 private _maxSupply = uint(50600000000).mul(10**uint(18));
    
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

    bytes32 constant POS = 0x506f736974697665000000000000000000000000000000000000000000000000;
    bytes32 constant NEG = 0x4e65676174697665000000000000000000000000000000000000000000000000;
    bytes32 constant NA = 0x0000000000000000000000000000000000000000000000000000000000000000;
    address public founder = msg.sender;
    address public admin = address(0x0);

    modifier only_founder(){ if(msg.sender != founder){revert();} _; }
    modifier only_admin(){ if(msg.sender != admin){revert();} _; }

    mapping(address => bytes32[25]) public previous;
    mapping(address => bytes32[6]) public delegate;

    uint public totalSupply;
    uint public decimals;
    string public name;
    string public symbol;
    
    constructor() public
    {
        _mint(founder, _totalSupply);
        totalSupply = _totalSupply;
        symbol = "VLDY";
        name = "Validity";
        decimals = 18;
    }

    function adminControl(address _entity) public only_founder { admin = _entity; }

    function registerVoter(bytes32 user) public
    {
        bytes32[6] storage x = delegate[msg.sender];
        require(x[0] == NA);
        x[0] = user;
    }

    function viewStats(address target) public view returns (bytes32, bytes32[25] memory, uint256, uint256, uint256, uint256, bytes32)
    {
        bytes32[6] storage x = delegate[target];
        bytes32[25] storage y = previous[target];
        return (x[0], y, uint(x[1]), uint(x[2]), uint(x[3]), uint(x[4]), x[5]);
    }

    function delegationEvent(address voter, uint256 weight, bytes32 choice, bytes32 project) public only_admin
    {
        uint256 c = 0;
        bytes32[25] memory prv;
        bytes32[6] storage x = delegate[voter];
        bytes32[25] storage y = previous[voter];

	    for(uint v = 0; v < y.length ; v++)
	    {
            prv[v] = y[v];
            if(project == y[v]){revert();}
		    else if(prv[v] == NA){c++;
                                  prv[v] = project;
                                  if(v == y.length-1){c++;} break;}
	    }

        require(c > 0);
        previous[voter] = prv;
        x[1] = bytes32(uint256(x[1]).add(1));

        if(choice == POS){ x[3] = bytes32(uint256(x[3]).add(weight)); }
        else if(choice == NEG){ x[2] = bytes32(uint256(x[2]).add(weight)); }

        x[4] = bytes32(uint256(x[4]).add(weight));

        if(c == 1){ x[5] = bytes32("false"); }
        else if(c == 2){ x[5] = bytes32("true"); }
    }

    function delegationBonus(address voter) public only_admin
    {
        bytes32[6] storage x = delegate[voter];
        x[5] = bytes32("false");
        delete previous[voter];
    }

}
