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
        bool bonus;

    }

    struct Analysed
    {

        bool completed;

    }

    mapping(address => mapping (address => uint256)) internal allowed;
    mapping(address => Delegate) public votelog;
    mapping(bytes32 => Analysed) public electionlog;
    address public founder = msg.sender;
    address public admin;
    bytes32 constant POS = 0x506f736974697665000000000000000000000000000000000000000000000000;
    bytes32 constant NEG = 0x4e65676174697665000000000000000000000000000000000000000000000000;
    string public name;
    string public symbol;
    uint8 public decimals;
    uint256 public totalSupply;
    uint public a;
    uint public b;
    uint public c;

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
            negvote_count: 0,
            bonus: false});
        votelog[msg.sender] = divx;

    }

    function viewStats(address target) public constant returns (bytes32, bytes32[25], uint256, uint256, uint256, uint256)
    {

        Delegate storage x = votelog[target];
        return (x.user_name, x.subject_name, x.posvote_count, x.negvote_count, x.delegation_count, x.vote_count);

    }

    function adminControl(address entity) public only_founder returns (address)
    {

        admin = entity;
        return admin;

    }

    function delegationCreate(bytes32 project) public only_admin
    {

        Analysed memory x = Analysed({completed: false});
        electionlog[project] = x;

    }

    function delegationConclude(bytes32 project) public only_admin
    {

        Analysed storage y = electionlog[project];
        require(y.completed == false);
        Analysed memory x = Analysed({completed: true});
        electionlog[project] = x;

    }

    function delegationEvent(address voter, uint256 weight, bytes32 choice, bytes32 project) public only_admin
    {

        c = 0;
        bool outcome;
        bytes32[25] memory previous;
        Delegate storage x = votelog[voter];
        Analysed storage y = electionlog[project];
        require(y.completed == false);

	      for(uint v = 0; v < x.subject_name.length ; v++)
	      {

              bytes32 na;
              previous[v] = x.subject_name[v];
              if(project == x.subject_name[v]){revert();}
		          else if(previous[v] == na){previous[v] = project;
                                         c++;
                                         if(v == x.subject_name.length){c++;} break;}

	      }

        require(c > 0);

        if(c == 1){outcome = false;}
        else if(c == 2){outcome = true;}

        uint256 option = choice == POS ? x.posvote_count : x.negvote_count;
        x.delegation_count++;
        option = option + weight;
        x.vote_count = x.vote_count + weight;

        if(choice == POS){a = option; b = x.negvote_count;}
        else if(choice == NEG){a = x.posvote_count; b = option;}

        Delegate memory division = Delegate({
            user_name: x.user_name,
            subject_name: previous,
            delegation_count: x.delegation_count,
            vote_count: x.vote_count,
            posvote_count: a,
            negvote_count: b,
            bonus: outcome});
        votelog[voter] = division;

    }


    function delegationBonus(address voter) public only_admin
    {

        Delegate storage x = votelog[voter];
        Delegate memory division = Delegate({
            user_name: x.user_name,
            subject_name: x.subject_name,
            delegation_count: x.delegation_count,
            vote_count: x.vote_count,
            posvote_count: x.posvote_count,
            negvote_count: x.negvote_count,
            bonus: false});
        votelog[voter] = division;

    }

}
