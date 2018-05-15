pragma solidity ^0.4.19;

import "./BasicToken.sol";
import "./ERC20.sol";

contract DX is ERC20, BasicToken {

    struct Delegate
    {

        bytes32 user_name;
        bytes32[25] subject_name;
        uint256 delegation_count;
        uint256 negvote_count;
        uint256 posvote_count;
        uint256 vote_count;

    }

    mapping (address => mapping (address => uint256)) internal allowed;
    mapping(address => Delegate) public votelog;
    address public founder = msg.sender;
    address public admin;
    bytes1 constant POS = 0x01;
    bytes1 constant NEG = 0x02;
    string public name;
    string public symbol;
    uint8 public decimals;
    uint256 public totalSupply;

    modifier only_founder()
    {

        if(msg.sender != founder){revert();}
        _;

    }

    modifier only_admin()
    {

        if(msg.sender != admin){revert();}
        _;

    }

    function DX() public
    {

        symbol = "DX";
        name = "Ðivision X";
        decimals = 18;
        totalSupply = 50600000000 * 10**uint(decimals);
        balances[founder] = totalSupply;
        Transfer(this, founder, totalSupply);

    }

    function transferFrom(address _from, address _to, uint256 _value) public returns (bool)
    {

        require(_to != address(0));
        require(_value <= balances[_from]);
        require(_value <= allowed[_from][msg.sender]);

        balances[_from] = balances[_from].sub(_value);
        balances[_to] = balances[_to].add(_value);
        allowed[_from][msg.sender] = allowed[_from][msg.sender].sub(_value);
        Transfer(_from, _to, _value);
        return true;

    }

    function approve(address _spender, uint256 _value) public returns (bool)
    {

        allowed[msg.sender][_spender] = _value;
        Approval(msg.sender, _spender, _value);
        return true;

    }

    function allowance(address _owner, address _spender) public view returns (uint256)
    {

        return allowed[_owner][_spender];

    }

    function increaseApproval(address _spender, uint _addedValue) public returns (bool)
    {

        allowed[msg.sender][_spender] = allowed[msg.sender][_spender].add(_addedValue);
        Approval(msg.sender, _spender, allowed[msg.sender][_spender]);
        return true;

    }

    function decreaseApproval(address _spender, uint _subtractedValue) public returns (bool)
    {

        uint oldValue = allowed[msg.sender][_spender];
        if (_subtractedValue > oldValue) {
            allowed[msg.sender][_spender] = 0;
        } else {
            allowed[msg.sender][_spender] = oldValue.sub(_subtractedValue);
        }
        Approval(msg.sender, _spender, allowed[msg.sender][_spender]);
        return true;

    }

    function registerVoter(bytes32 user) public
    {

        Delegate storage x = votelog[msg.sender];
        require(x.delegation_count == 0);
        Delegate memory divx = Delegate({
            user_name: user,
            subject_name: x.subject_name,
            delegation_count: 0,
            vote_count: 0,
            posvote_count: 0,
            negvote_count: 0});
        votelog[msg.sender] = divx;

    }

    function viewStats(address target) public constant returns (bytes32, bytes32[25], uint256, uint256)
    {

        Delegate storage x = votelog[target];
        return (x.user_name, x.subject_name, x.delegation_count, x.vote_count);

    }

    function adminControl(address entity) public only_founder returns (address)
    {

        admin = entity;
        return admin;

    }

    function delegationEvent(address voter, uint256 weight, bytes1 choice, bytes32 project) public only_admin
    {

        uint a;
        uint b;
        uint c = 0;
        Delegate storage x = votelog[voter];
        uint256 option = choice == POS ? x.posvote_count : x.negvote_count;
        x.delegation_count++;
        option = option + weight;
        x.vote_count = x.vote_count + weight;
        bytes32[25] memory previous;

	      for(uint v = 0; v < x.subject_name.length ; v++)
	      {

              previous[v] = x.subject_name[v];
              if(project == x.subject_name[v]){revert();}
		          else if(previous[v] == 0){previous[v] = project; c++; break;}

	      }

        require(c == 1);
        if(option == x.posvote_count){a = option; b = x.posvote_count;}
        else if(option == x.posvote_count){a = x.posvote_count; b = option;}
        Delegate memory division = Delegate({
            user_name: x.user_name,
            subject_name: previous,
            delegation_count: x.delegation_count,
            vote_count: x.vote_count,
            posvote_count: a,
            negvote_count: b});
        votelog[voter] = division;

    }

}
