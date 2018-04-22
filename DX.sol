pragma solidity ^0.4.18;

import "./BasicToken.sol";
import "./ERC20.sol";

contract Token is ERC20, BasicToken {

  struct Delegate 
  {

        string user_name;
        string[] subject_name;
        uint256 delgation_count;
        uint256 negvote_count;
        uint256 posvote_count;
        uint256 vote_count;

  } 
 
  mapping (address => mapping (address => uint256)) internal allowed;
  mapping(address => Delegate) public votelog; 

  function transferFrom(address _from, address _to, uint256 _value) public returns (bool) {
    require(_to != address(0));
    require(_value <= balances[_from]);
    require(_value <= allowed[_from][msg.sender]);

    balances[_from] = balances[_from].sub(_value);
    balances[_to] = balances[_to].add(_value);
    allowed[_from][msg.sender] = allowed[_from][msg.sender].sub(_value);
    Transfer(_from, _to, _value);
    return true;
  }


  function approve(address _spender, uint256 _value) public returns (bool) {
    allowed[msg.sender][_spender] = _value;
    Approval(msg.sender, _spender, _value);
    return true;
  }

 
  function allowance(address _owner, address _spender) public view returns (uint256) {
    return allowed[_owner][_spender];
  }


  function increaseApproval(address _spender, uint _addedValue) public returns (bool) {
    allowed[msg.sender][_spender] = allowed[msg.sender][_spender].add(_addedValue);
    Approval(msg.sender, _spender, allowed[msg.sender][_spender]);
    return true;
  }


  function decreaseApproval(address _spender, uint _subtractedValue) public returns (bool) {
    uint oldValue = allowed[msg.sender][_spender];
    if (_subtractedValue > oldValue) {
      allowed[msg.sender][_spender] = 0;
    } else {
      allowed[msg.sender][_spender] = oldValue.sub(_subtractedValue);
    }
    Approval(msg.sender, _spender, allowed[msg.sender][_spender]);
    return true;
  }


  function registerVoter(string user) public {

        Delegate storage z = votelog[msg.sender];
        require(z.delegation_count == 0);
        Delegate memory divx = Delegate({user_name: user, subject_name: z.subject_name, delegation_count: 0, vote_count: 0, posvote_count: 0, negvote_count: 0});
        votelog[msg.sender] = divx; 

  }


  function delegationEvent(address voter, uint256 voting_weight, uint256 choice, string project) public dx {
  
        Delegate storage v = votelog[voter];
        uint option = choice == 0 ? v.posvote_count : v.negvote_count;
        uint a; 
        uint b;
        
        voting_weight += option;
        voting_weight += v.vote_count;
        v.subject_name.push(project);
        v.delegation_count++;

        if(option == v.posvote_count){a = option; b = v.posvote_count;}
        else if(option == v.posvote_count){a = v.posvote_count; b = option;}

        Delegate memory division = Delegate({user_name: v.user_name, subject_name: v.subject_name, delegation_count: event, vote_count: total, posvote_count: a, negvote_count: b});
        votelog[voter] = division;

  }

}
