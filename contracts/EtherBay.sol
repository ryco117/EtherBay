pragma solidity ^0.4.17;

import "./EtherBayRequest.sol";
import "./EtherBayFlag.sol";

// Master contract to manage all EtherBay requests and donations
// as well as the creation of ERC-721 compliant EtherBayFlag tokens
contract EtherBay {
    // EtherBay Members / Definitions
    // ==============================

    // Address that initially created this contract
    address public creator;

    // Address of EtherBayFlag contract
    EtherBayFlag public flagContract;

    // Structure defining a donation as a donator and hash of parameters
    struct Freebie {
    	address donator;
    	string donationParamHash;
    }
    // Array of donations (parameters) submitted
    Freebie[] public donationsSubmitted;

    // Array of addresses for EtherBayRequests
    address[] public requestsSubmitted;

    // Inverse lookup of previous array where positions are 1-indexed (0 => empty)
    mapping(address => uint) public requestLookup;


    // EtherBay Events
    // ===============

    // Event for newly created content request
    // (index on address allow to search for all requests created by an address)
    event Requested(address indexed requestingAddr, address request, string paramHash);

    // Event for the backing of a request
    // (two indexed allows creator/content-submitters to watch backings, and backers to search their history)
    event RequestBacked(address indexed request, address indexed backingAddr, uint amount);

    // Event for validation of contents fulfillment of a request
    event ContentValidated(address indexed request, uint contentIndex,
        address indexed validatingAddr);

    // Event for submission of content to fulfill request
    event ContentSubmitted(address indexed submittingAddr, address indexed request,
        uint contentIndex, string contentHash);

    // Event for newly donated content donation
    event Donated(address indexed donatingAddr, string paramHash);


    // Contract's constructor
    // ======================

    function EtherBay() public {
        creator = msg.sender;
        flagContract = new EtherBayFlag();
    }


    // Functions and modifiers
    // =======================

    // Function modifiers
    modifier isRequestIndex(uint i) {
        // Ensure specified request is in range
        require(i < requestsSubmitted.length);
        _;
    }
    modifier isRequestAddress(address request) {
        require(requestLookup[request] > 0);
        _;
    }
    modifier isDonation(uint i) {
        // Ensure specified request is in range
        require(i < donationsSubmitted.length);
        _;
    }

    // Create a new EtherBayRequest smart-contract with the parameters locatable by their hash
    function newRequest(string requestParamHash) public {
        address newRequestAddr = new EtherBayRequest(requestParamHash, msg.sender);
        requestsSubmitted.push(newRequestAddr);

        // 0 is reserved for empty, first request is 1, second 2, etc...
        uint i = requestsSubmitted.length;
        requestLookup[newRequestAddr] = i;

        // Give A Flag!
        flagContract.createFlag(msg.sender);

        // Signal event that a new request was created at the given address
        Requested(msg.sender, newRequestAddr, requestParamHash);
    }

    // Get length of our EtherBayRequests array
    function getTotalRequests() public constant returns (uint requestsCount) {
        return requestsSubmitted.length;
    }

    // Get the address as a string of an EtherBayRequest by its array index
    function getRequest(uint i) public constant isRequestIndex(i) returns (address) {
        return requestsSubmitted[i];
    }

    // Make corresponding signals if called from valid source
    function signalRequestBacked(address backingAddr, uint amount)
        public isRequestAddress(msg.sender) {

        // Give A Flag!
        flagContract.createFlag(backingAddr);

        RequestBacked(msg.sender, backingAddr, amount);
    }
    function signalContentValidated(uint contentIndex, address validatingAddr)
        public isRequestAddress(msg.sender) {
        ContentValidated(msg.sender, contentIndex, validatingAddr);
    }
    function signalContentSubmitted(address submittingAddr, uint contentIndex,
        string contentHash) public isRequestAddress(msg.sender) {

        // Give A Flag!
        flagContract.createFlag(submittingAddr);

        ContentSubmitted(submittingAddr, msg.sender, contentIndex, contentHash);
    }

    // Add a new donation entry to our array of Freebies
    function newDonation(string donationParamHash) public {
    	Freebie memory freebie = Freebie(msg.sender, donationParamHash);
        donationsSubmitted.push(freebie);

        // Give A Flag!
        flagContract.createFlag(msg.sender);

        // Signal event
        Donated(msg.sender, donationParamHash);
    }

    // Get the length of our donations array
    function getTotalDonations() public constant returns (uint donationsCount) {
        return donationsSubmitted.length;
    }

    // Return the parameters of the Freebie at the given index
    function getDonation(uint i) public constant isDonation(i) returns (address, string) {
        Freebie storage d = donationsSubmitted[i];
        return (d.donator, d.donationParamHash);
    }
}
