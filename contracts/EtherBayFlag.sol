pragma solidity ^0.4.2;


// This is just a simple example of a coin-like contract.
// It is not standards compatible and cannot be expected to talk to other
// coin/token contracts. If you want to create a standards-compliant
// token, see: https://github.com/ConsenSys/Tokens. Cheers!

contract EtherBayFlag {
    // Structure defining parameters of a Flag in EtherBay
    struct Flag {
        string ipfsLink;
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

    // Modifier to only accept if sender is owner of specified flag
    modifier isOwnerOfFlag(uint256 flagId) {
        require(msg.sender == ownerOf(flagId));
        _;
    }

    // Modifier to only accept if sender is approved to take specified flag
    modifier isApprovedForFlag(uint256 flagId) {
        require(ownerOf(flagId) > 0);
        require(msg.sender == etherBayFlags[flagId].approvedTo);
        _;
    }

    // Modifier to only accept index within bounds of message senders wallet
    modifier indexInWallet(address owner, uint i) {
        require(i < balanceOf(owner));
        _;
    }


    // PRIVATE function to transfer ownership of a flag
    function transferFlag(address from, address to, uint256 flagId) private isFlag(flagId) {
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

        Transfer(from, to, flagId);
    }

    // Create a new EtherBay Flag with a random ID, and give to the specified address
    function createFlag(address receivingAddr) public {
        // Only EtherBay contract should be able to generate/distribute flags
        require(msg.sender == etherBayContract);

        // Generate a pseudo-random number to use as the flag ID
        // THIS IS NOT PERFECT SECURITY, (BUT SINCE TOKENS ARE IMAGES)
        // NOT TRIVIAL TO PREDICT IF GOOD/BAD
        uint256 flagId = uint256(block.blockhash(
            block.number - 1)) + uint256(msg.sender);

        // Get index flag will be pushed to
        uint i = balances[receivingAddr].length;
        balances[receivingAddr].push(flagId);

        // Store meta-data properties of the FLag
        Flag memory newFlag = Flag("", receivingAddr, i, 0);
        etherBayFlags[flagId] = newFlag;
        totalFlagCount++;

        // Signal the creation of the new token with a transfer event from address 0
        Transfer(0, receivingAddr, flagId);
    }

    // Make the given flag index the primary (index 0)
    function makePrimary(uint i) public indexInWallet(msg.sender, i) {
        // Use a temp. int to swap flag IDs
        uint256 tmpId = balances[msg.sender][0];
        balances[msg.sender][0] = balances[msg.sender][i];
        balances[msg.sender][i] = tmpId;
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
    function totalSupply() public constant returns (uint256) {
        return totalFlagCount;
    }

    // Total number of token held by 'owner'
    function balanceOf(address owner) public constant returns (uint256) {
        return balances[owner].length;
    }


    // ERC-721 Ownership
    // =================

    // Get the owning address of a unique token
    function ownerOf(uint256 tokenId) public constant isFlag(tokenId) returns (address) {
        return etherBayFlags[tokenId].owner;
    }

    // Approve specified address to withdraw token
    function approve(address to, uint256 tokenId) public isOwnerOfFlag(tokenId) {
        // By standard, can't allow approving self
        require(msg.sender != to);

        // By standard, only case that does not trigger Approval event
        if(to == 0 && etherBayFlags[tokenId].approvedTo == 0) {
            return;
        }

        etherBayFlags[tokenId].approvedTo = to;
        Approval(msg.sender, to, tokenId);
    }

    // Attempt to take ownership of specified token, succeeds if approved
    function takeOwnership(uint256 tokenId) public isApprovedForFlag(tokenId) {
        transferFlag(ownerOf(tokenId), msg.sender, tokenId);
    }

    // Transfer specified token to the given address
    function transfer(address to, uint256 tokenId) public isOwnerOfFlag(tokenId) {
        // By standard, can't allow transfer to zero-address
        require(to != 0);

        transferFlag(msg.sender, to, tokenId);
    }

    // Return the unique token at a given 'owner's index
    function tokenOfOwnerByIndex(address owner, uint256 index)
        public constant indexInWallet(owner, index) returns (uint) {
        return balances[owner][index];
    }

    // Return the multiaddress (using IPFS in this instance) to the complete data
    function tokenMetadata(uint256 tokenId) public constant returns (string) {
        return etherBayFlags[tokenId].ipfsLink;
    }


    // ERC-721 Events
    // ==============

    // Must be triggered whenever token ownership is transfered
    // (including self to self, and from/to address 0 on creation/deletion)
    event Transfer(address indexed from, address indexed to, uint256 tokenId);

    // Must be triggered on any successful call to approve(...) (unless clears unset approval)
    event Approval(address indexed owner, address indexed approved, uint256 tokenId);
}
