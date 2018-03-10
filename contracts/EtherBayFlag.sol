pragma solidity ^0.4.2;

import "./ERC721.sol";

// This is just a simple example of a coin-like contract.
// It is not standards compatible and cannot be expected to talk to other
// coin/token contracts. If you want to create a standards-compliant
// token, see: https://github.com/ConsenSys/Tokens. Cheers!

contract EtherBayFlag is ERC721 {
    // Structure defining parameters of a Flag in EtherBay
    struct Flag {
        address owner;
        uint ownersIndex;
        address approvedTo;
    }

    // Mapping of all flags in circulation by their unique pseudo-random ID
    mapping (uint256 => Flag) public etherBayFlags;

    // Map people (addresses) to their flags
    mapping (address => uint256[]) public balances;

    // The current number of flags in circulation
    uint256 public totalFlagCount;

    // Address of EtherBay contract
    address public etherBayContract;

    // Mapping of each accounts operators
    mapping(address => mapping(address => bool)) accountOperators;


    // Initialize our intelligent agreement
    // ====================================
    function EtherBayFlag() public {
        etherBayContract = msg.sender;
    }

    // Modifier to only accept valid flag Ids
    modifier isFlag(uint256 flagId) {
        require(ownerOf(flagId) > 0);
        _;
    }

    // Modifier to only accept if sender is owner of specified flag or an operator for owner
    modifier isOwnerOfFlag(uint256 flagId) {
        address flagOwner = ownerOf(flagId);
        require(msg.sender == flagOwner || accountOperators[flagOwner][msg.sender] == true);
        _;
    }

    // Modifier to only accept if the sender is approved to transfer the specified flag
    // (Valid cases are: Being the current flag owner; being an operator for owner;
    // being approved for this flag)
    modifier canTransferFlagFrom(address from, uint256 flagId) {
        require(from == ownerOf(flagId));       // This covers requiring Flag exists since from can't be default address of zero
        require(msg.sender == from ||
            accountOperators[from][msg.sender] == true ||
            msg.sender == etherBayFlags[flagId].approvedTo);
        _;
    }

    // Modifier to only accept index within bounds of message senders wallet
    modifier indexInWallet(address owner, uint i) {
        require(i < balances[owner].length);
        _;
    }

    // Create a new EtherBay Flag with a random ID, and give to the specified address
    function createFlag(address receivingAddr) public {
        // Only EtherBay contract should be able to generate/distribute flags
        require(msg.sender == etherBayContract);

        // Generate a pseudo-random number to use as the flag ID
        // THIS IS NOT PERFECT SECURITY ( see https://github.com/ryco117/EtherBay/issues/6 )
        uint256 flagId = uint256(keccak256(
            block.blockhash(block.number - 1), msg.sender));

        // Get index flag will be pushed to
        uint i = balances[receivingAddr].length;
        balances[receivingAddr].push(flagId);

        // Store ownership properties of the Flag
        Flag memory newFlag = Flag(receivingAddr, i, 0);
        etherBayFlags[flagId] = newFlag;
        totalFlagCount++;

        // Signal the creation of the new token with a transfer event from address 0
        emit Transfer(0, receivingAddr, flagId);
    }

    // Make the given flag index the primary (index 0)
    function makePrimary(uint i) public indexInWallet(msg.sender, i) {
        // Use a temp. int to swap flag IDs
        uint256 tmpId = balances[msg.sender][0];
        balances[msg.sender][0] = balances[msg.sender][i];
        balances[msg.sender][i] = tmpId;
    }

    // Return the unique token at a given 'owner's index
    // Index '0' is the user's primary flag
    function tokenOfOwnerByIndex(address owner, uint256 index)
        external view indexInWallet(owner, index) returns (uint) {
        return balances[owner][index];
    }


    // ERC-20 Functions
    // ================

    // Name of the contract token
    function name() public pure returns (string) {
        return "EtherBay Flag";
    }

    // Shorthand symbol for token
    function symbol() public pure returns (string) {
        return "EBF";
    }

    // Total amount of token in circulation
    function totalSupply() public view returns (uint256) {
        return totalFlagCount;
    }

    // Total number of token held by 'owner'
    function balanceOf(address owner) external view returns (uint256) {
        return balances[owner].length;
    }

    // ERC-721 Ownership
    // =================

    // Get the owning address of a unique token
    function ownerOf(uint256 tokenId) public view isFlag(tokenId) returns (address) {
        return etherBayFlags[tokenId].owner;
    }


    // Perform a 'transferFrom' with additional smart-contract protection by
    // determining if receiving address is a smart contract and if so only having
    // transaction succeed if the contract can appropriately handle the ERC721 token
    function safeTransferFrom(address from, address to, uint256 tokenId, bytes data)
        external payable {
        __safeTransferFrom(from, to, tokenId, data);
    }
    function safeTransferFrom(address from, address to, uint256 tokenId)
        external payable {
        __safeTransferFrom(from, to, tokenId, "");
    }
    bytes4 private constant MAGIC_ONERC721RECEIVED = bytes4(keccak256("onERC721Received(address,uint256,bytes)"));
    function __safeTransferFrom(address from, address to, uint256 tokenId, bytes data)
        private canTransferFlagFrom(from, tokenId) {
        __transferFrom(from, to, tokenId);

        // Do the callback after everything is done to avoid reentrancy attack
        uint256 codeSize;
        assembly { codeSize := extcodesize(to) }
        if(codeSize > 0) {
            bytes4 retval = ERC721TokenReceiver(to).onERC721Received(from, tokenId, data);
            require(retval == MAGIC_ONERC721RECEIVED);
        }
    }

    // Attempt to transfer flag of given ID from account to a non-zero account
    function transferFrom(address from, address to, uint256 flagId) external payable {
        __transferFrom(from, to, flagId);
    }
    function __transferFrom(address from, address to, uint256 flagId)
        private canTransferFlagFrom(from, flagId) {
        require(to != address(0));
        uint oldIndex = etherBayFlags[flagId].ownersIndex;

        // Update flag data
        etherBayFlags[flagId].owner = to;
        etherBayFlags[flagId].approvedTo = 0;

        // Update new owners balance by storing token at index n, incrementing n
        // and tracking owners index
        uint newIndex = balances[to].length;
        balances[to].push(flagId);
        etherBayFlags[flagId].ownersIndex = newIndex;

        // Remove token from previous owner by overwriting old token-index with the last token
        // he owns (by index) and deleting last index of array. Decrement n.
        uint oldLength = balances[from].length;
        balances[from][oldIndex] = balances[from][oldLength - 1];
        delete balances[from][oldLength - 1];
        balances[from].length--;

        emit Transfer(from, to, flagId);
    }

    // Approve specified address to withdraw token
    function approve(address to, uint256 tokenId) external payable isOwnerOfFlag(tokenId) {
        etherBayFlags[tokenId].approvedTo = to;
        emit Approval(msg.sender, to, tokenId);
    }

    // Set or unset a given account as an operator for your flags
    function setApprovalForAll(address operator, bool approved) external {
        accountOperators[msg.sender][operator] = approved;
        emit ApprovalForAll(msg.sender, operator, approved);
    }

    // Given a flag's ID, return the address it is approved for.
    // Zero-address indicates that none are approved
    function getApproved(uint256 flagId) external view returns (address) {
        return etherBayFlags[flagId].approvedTo;
    }

    // Return true if address 'operator' is an approved  operator for the given owner
    function isApprovedForAll(address owner, address operator) external view returns (bool) {
        return accountOperators[owner][operator];
    }

    /* TODO: Consider implementing function to meet interface ERC721Metadata
    // Return the multiaddress (using IPFS in this instance) to the complete data
    function tokenURI(uint256 tokenId) external view returns (string) {
        return etherBayFlags[tokenId].ipfsLink;
    }
    */


    // ERC-721 Events
    // ==============

    // Must be triggered whenever token ownership is transfered
    // (including self to self, and from/to address 0 on creation/deletion)
    event Transfer(address indexed from, address indexed to, uint256 tokenId);

    // Must be triggered on any successful call to approve(...)
    event Approval(address indexed owner, address indexed approved, uint256 tokenId);

    // Event that is signaled when an account is given or removed access to another
    // The approved account can make all Flag-related operations on accounts behalf
    event ApprovalForAll(address indexed account, address indexed approvedAcct, bool setApproved);
}
