pragma solidity ^0.4.17;

import "./EtherBayRequest.sol";

// Master contract to manage all EtherBay requests and donations
contract EtherBay {
    // Address that initially created this contract
    address public creator;

    // Structure defining a donation as a donator and hash of parameters
    struct Freebie {
    	address donator;
    	string donationParamHash;
    }
    // Array of donations (parameters) submitted
    Freebie[] public donationsSubmitted;

    // Array of addresses for EtherBayRequests
    address[] public requestsSubmitted;

    // Contract's constructor
    function EtherBay() public {
        creator = msg.sender;
    }

    // Create a new EtherBayRequest smart-contract with the parameters locatable by their hash
    function newRequest(string requestParamHash) public {
        requestsSubmitted.push(new EtherBayRequest(requestParamHash, msg.sender));
    }

    // Get length of our EtherBayRequests array
    function getTotalRequests() public constant returns (uint requestsCount) {
        return requestsSubmitted.length;
    }

    // Get the address as a string of an EtherBayRequest by its array index
    function getRequest(uint i) public constant returns (address) {
        // Ensure specified request is in range
        require(i < requestsSubmitted.length);

        return requestsSubmitted[i];
    }

    // Add a new donation entry to our array of Freebies
    function newDonation(string donationParamHash) public {
    	Freebie memory freebie = Freebie(msg.sender, donationParamHash);
        donationsSubmitted.push(freebie);
    }

    // Get the length of our donations array
    function getTotalDonations() public constant returns (uint donationsCount) {
        return donationsSubmitted.length;
    }

    // Return the parameters of the Freebie at the given index
    function getDonation(uint i) public constant returns (address, string) {
        // Ensure specified donation is in range
        require(i < donationsSubmitted.length);

        Freebie storage d = donationsSubmitted[i];
        return (d.donator, d.donationParamHash);
    }

    // I have mixed feelings about this
    function closeTheBay() public {
    	// Ensure only the creator can close the contract
    	// (although without any funds, no reason to do so)
        require(msg.sender == creator);

        selfdestruct(creator);
    }
}
