pragma solidity ^0.4.19;

import "./BasicToken.sol";
import "./ERC20.sol";

contract DX is ERC20, BasicToken {

    bytes32 constant POS = 0x506f736974697665000000000000000000000000000000000000000000000000;
    bytes32 constant NEG = 0x4e65676174697665000000000000000000000000000000000000000000000000;
    address public founder = msg.sender;
    address public admin;

    struct Delegate
    {

        bytes32 usr;
        bytes32[25] subj;
        uint256 e_count;
        uint256 n_count;
        uint256 p_count;
        uint256 v_count;
        bool bonus;

    }

    modifier only_founder() { if(msg.sender != founder){revert();}  _; }
    modifier only_admin(){ if(msg.sender != admin){revert();}   _; }

    mapping(address => mapping (address => uint256)) internal allowed;
    mapping(address => Delegate) public vlog;

    string public name;
    string public symbol;
    uint8 public decimals;
    uint256 public totalSupply;
    uint public a;
    uint public b;
    uint public c;

    function DX() public
    {

        symbol = "DX";
        name = "Ðivision X";
        decimals = 18;
        totalSupply = 50600000000 * 10**uint(decimals);
        balances[founder] = totalSupply;
        emit Transfer(this, founder, totalSupply);

    }

    function transferFrom(  address _from,
                            address _to,
                            uint256 _value ) public returns (bool)
    {

        require(_to != address(0));
        require(_value <= balances[_from]);
        require(_value <= allowed[_from][msg.sender]);

        balances[_from] = balances[_from].sub(_value);
        balances[_to] = balances[_to].add(_value);
        allowed[_from][msg.sender] = allowed[_from][msg.sender].sub(_value);
        emit Transfer(_from, _to, _value);
        return true;

    }

    function approve( address _spender,
                      uint256 _value ) public returns (bool)
    {

        allowed[msg.sender][_spender] = _value;
        emit Approval(msg.sender, _spender, _value);
        return true;

    }

    function allowance( address _owner,
                        address _spender ) public view returns (uint256)
    {

        return allowed[_owner][_spender];

    }

    function increaseApproval( address _spender,
                                uint _addedValue ) public returns (bool)
    {

        allowed[msg.sender][_spender] = allowed[msg.sender][_spender].add(_addedValue);
        emit Approval(msg.sender, _spender, allowed[msg.sender][_spender]);
        return true;

    }

    function decreaseApproval( address _spender,
                              uint _subtractedValue ) public returns (bool)
    {

        uint oldValue = allowed[msg.sender][_spender];
        if (_subtractedValue > oldValue) {
            allowed[msg.sender][_spender] = 0;
        } else {
            allowed[msg.sender][_spender] = oldValue.sub(_subtractedValue);
        }
        emit Approval(msg.sender, _spender, allowed[msg.sender][_spender]);
        return true;

    }

    function registerVoter(bytes32 usr) public
    {

        Delegate storage x = vlog[msg.sender];
        require(x.e_count == 0);
        delegationStorage( msg.sender,
                           usr,x.subj,
                           x.e_count,
                           x.v_count,
                           x.p_count,
                           x.n_count,
                           x.bonus );

    }

    function viewStats(address target) public constant returns (bytes32, bytes32[25], uint256, uint256, uint256, uint256)
    {

        Delegate storage x = vlog[target];
        return ( x.usr, x.subj,
                 x.p_count,
                 x.n_count,
                 x.e_count,
                 x.v_count );

    }

    function adminControl(address entity) public only_founder returns (address)
    {

        admin = entity;
        return admin;

    }

    function delegationEvent( address voter,
                              uint256 weight,
                              bytes32 choice,
                              bytes32 project ) public only_admin
    {

        c = 0;
        bool outcome;
        bytes32[25] memory previous;
        Delegate storage x = vlog[voter];
        Analysed storage y = elog[project];
        require(y.completed == false);

	      for(uint v = 0; v < x.subj.length ; v++)
	      {

              bytes32 na;
              previous[v] = x.subj[v];
              if(project == x.subj[v]){revert();}
		          else if(previous[v] == na){previous[v] = project;
                                         c++;
                                         if(v == x.subj.length){c++;} break;}

	      }

        require(c > 0);

        if(c == 1){outcome = false;}
        else if(c == 2){outcome = true;}

        uint256 option = choice == POS ? x.p_count : x.n_count;
        x.e_count++;
        option = option + weight;
        x.v_count = x.v_count + weight;

        if(choice == POS){a = option; b = x.n_count;}
        else if(choice == NEG){a = x.p_count; b = option;}

        delegationStorage( voter,
                           x.usr,
                           previous,
                           x.e_count,
                           x.v_count,
                           x.p_count,
                           x.n_count,
                           x.bonus );

    }

    function delegationBonus(address voter) public only_admin
    {

        Delegate storage x = vlog[voter];
        bool restart = false;
        delegationStorage( voter,
                           x.usr,
                           x.subj,
                           x.e_count,
                           x.v_count,
                           x.p_count,
                           x.n_count,
                           restart );

    }

    function delegationStorage( address x,
                                bytes32 y,
                                bytes32[25] z,
                                uint256 v,
                                uint256 n,
                                uint256 g,
                                uint256 r,
                                bool w ) internal
    {

        Delegate memory dvx = Delegate({
            usr: y,
            subj: z,
            e_count: v,
            v_count: n,
            p_count: g,
            n_count: r,
            bonus: w});
        vlog[x] = dvx;

    }

}
