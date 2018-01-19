pragma solidity ^0.4.17;

import "./EtherBayRequest.sol";

// Master contract to manage all request contracts
contract EtherBay {
    address[] public requestsSubmitted;
    address public creator;

    function EtherBay() public {
        creator = msg.sender;
    }

    function newRequest(string requestDescHash) public {
        requestsSubmitted.push(new EtherBayRequest(requestDescHash, msg.sender));
    }

    function getTotalRequests() public constant returns (uint requestsCount) {
        return requestsSubmitted.length;
    }

    function getRequest(uint i) public constant returns (address) {
        // Ensure specified request is in range
        require(i < requestsSubmitted.length);

        return requestsSubmitted[i];
    }

    function closeTheBay() public {
    	// Ensure only the creator can close the contract
    	// (although without any funds, no reason to do so)
        require(msg.sender == creator);

        selfdestruct(creator);
    }
}
