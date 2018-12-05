pragma solidity ^0.4.24;

import "./ERC721/ERC721XToken.sol";

// Popmint pre-alpha MVP vendor ERC721 NFT structure

contract vendorPopMint is ERC721XToken {

    mapping(address => mapping (bytes32 => bool)) internal userRedeems;
    mapping(bytes32 => bool) internal vendorRedeems;
    mapping(uint256 => string) private _tokenURIs;

    address public distributor;
    string private _name;
    string private _symbol;

    event redeemPopmint(address indexed _claim, uint indexed _tokenId);

      constructor(string name, string symbol) public {
        distributor = msg.sender;
        _name = name;
        _symbol = symbol;
      }

      function name() external view returns (string _name) {}

      function symbol() external view returns (string _symbol) {}

      modifier _onlyDistributor() {
        require(msg.sender == distributor);
        _;
      }

       modifier _onlyRedeem(uint _tokenId) {
        require(
          vendorRedeems[redeemIdentifier(_tokenId)] == false
          && getApproved(_tokenId) == address(this)
          && ownerOf(_tokenId) == msg.sender
          );
        _;
      }

      function createNFT(string _tokenName, uint _tokenId, string _tokenURI, address _target, uint _supply) public
      _onlyDistributor {
        _mint(_tokenId, _target, _supply);
        _setTokenURI(_tokenId, _tokenURI);
      }

      function tokenURI(uint256 _tokenId) public view returns (string tokenUri) {
          require(exists(_tokenId), "Token doesn't exist");
          tokenUri = _tokenURIs[_tokenId];

          bytes memory _uriBytes = bytes(tokenUri);
          _uriBytes[38] = byte(48+(_tokenId / 100000) % 10);
          _uriBytes[39] = byte(48+(_tokenId / 10000) % 10);
          _uriBytes[40] = byte(48+(_tokenId / 1000) % 10);
          _uriBytes[41] = byte(48+(_tokenId / 100) % 10);
          _uriBytes[42] = byte(48+(_tokenId / 10) % 10);
          _uriBytes[43] = byte(48+(_tokenId / 1) % 10);

          return tokenUri;
      }

      function _setTokenURI(uint256 _tokenId, string _uri) internal {
          require(_exists(_tokenId));
          _tokenURIs[_tokenId] = _uri;
      }

      function redeemAward(uint _tokenId) _onlyRedeem(_tokenId) public {
        emit redeemPopmint(msg.sender, _tokenId);
        setClaim(redeemIdentifier(_tokenId));
        transferFrom(msg.sender, address(this), _tokenId);
        _burn(address(this), _tokenId);
      }

      function redeemIdentifier(uint _tokenId) internal pure returns (bytes32 cipher) {
        cipher = keccak256(abi.encodePacked(_tokenId));
      }

      function setClaim(bytes32 _hash) internal {
        userRedeems[msg.sender][_hash] = true;
        vendorRedeems[_hash] = true;
      }

}
