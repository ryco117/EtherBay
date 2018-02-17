pragma solidity ^0.4.17;

import "./EtherBay.sol";

// A contract representing a request for the upload of specific content to IPFS
// as well as the promise of payment by a set of backers for acceptable content
contract EtherBayRequest {
    // Constants used in class
    uint MINIMUM_BACKING_VALUE = 0.05 ether;
    uint REWARD_FRACTION_NUMERATOR = 9;
    uint REWARD_FRACTION_DENOMINATOR = 20;      // 45%
    uint RETURN_FRACTION_NUMERATOR = 1;
    uint RETURN_FRACTION_DENOMINATOR = 2;       // 50% (5% to contract creator per accept)

    // Data for submitting potential content on IPFS
    struct Submission {
        address submitter;  // Donator of IPFS link
        string ipfsHash;    // IPFS link
        uint numBackers;    // The number of backers that accepted this submission
    }
    Submission[] public submissions;

    // Data for financially backing this contract
    mapping(address => uint) public backingAmount;
    uint public numberBackers;

    // We'll make him special for creating the request for us (not cheap)
    // Receives a percentage of all accepted submissions, claimable whenever
    address public creator;
    uint public totalClaim;

    // The IPFS hash-link of the content-request description
    string public descriptionHash;

    // Address of EtherBay contract
    address public etherBayContract;


    // Construct contract
    // ==================

    function EtherBayRequest(string descHash, address requester) public {
        creator = requester;
        descriptionHash = descHash;
        etherBayContract = msg.sender;
    }


    // Functions and modifiers
    // =======================

    // Function modifiers
    modifier hasPayment() { // Modifier to only accept valid backing
        require(msg.value >= MINIMUM_BACKING_VALUE);
        _;
    }
    modifier sentFromBacker() { // Modifier to only accept backers
        require(backingAmount[msg.sender] > 0);
        _;
    }
    modifier isSubmission(uint i) { // Modifier to only accept valid submissions
        require(i < submissions.length);
        _;
    }

    // Get the number of submissions in array
    function getTotalSubmissions() public constant returns (uint) {
        return submissions.length;
    }

    // Get a submission from the array specified by its index
    function getSubmission(uint i) public constant returns (address, string, uint) {
        // Ensure specified request is in range
        require(i < submissions.length);

        Submission storage s = submissions[i];
        return (s.submitter, s.ipfsHash, s.numBackers);
    }

    // Donate ether to back this content request
    function backThisRequest() public hasPayment payable {
        if(backingAmount[msg.sender] == 0) {
            numberBackers += 1;
        }
        backingAmount[msg.sender] += msg.value;

        // Signal that the invoking address just added the given amount
        EtherBay(etherBayContract).signalRequestBacked(msg.sender, msg.value);
    }

    // Get the current amount this account has backing this request
    function currentBackingAmount() public constant returns (uint) {
        return backingAmount[msg.sender];
    }

    // Validate an IPFS submission and cashout their reward
    function validateSubmission(uint submissionIndex) public sentFromBacker isSubmission(submissionIndex) {
        // Calculate reward from backer's support
        uint rewardAmount = (REWARD_FRACTION_NUMERATOR * backingAmount[msg.sender]) / REWARD_FRACTION_DENOMINATOR;
        uint returnAmount = (RETURN_FRACTION_NUMERATOR * backingAmount[msg.sender]) / RETURN_FRACTION_DENOMINATOR;

        // Whats left of the ratio goes to the creator of the contract
        totalClaim += backingAmount[msg.sender] - (rewardAmount + returnAmount);

        // Update backer's and submission's status
        backingAmount[msg.sender] = 0;
        numberBackers -= 1;
        submissions[submissionIndex].numBackers += 1;

        // Attempt to send reward to content submitter
        if(!submissions[submissionIndex].submitter.send(rewardAmount)) {
            revert();
        }

        // Attempt to reward validator with a share of their backing
        if(!msg.sender.send(returnAmount)) {
            revert();
        }

        // Signal submission at index was validated by invoker of contract
        EtherBay(etherBayContract).signalContentValidated(submissionIndex, msg.sender);
    }

    // Submit an IPFS hash for consideration
    function submitContent(string contentHash) public {
        Submission memory newSubmission = Submission(msg.sender, contentHash, 0);
        submissions.push(newSubmission);

        // Signal creation of a new submission by sender at index
        EtherBay(etherBayContract).signalContentSubmitted(msg.sender,
            submissions.length-1, contentHash);
    }

    // Allow the original requester to collect a percentage of the accepted ether
    function collectClaim() public {
        require(msg.sender == creator);

        uint send = totalClaim;
        totalClaim = 0;

        // Reward creator with their claim
        if(!msg.sender.send(send)) {
            revert();
        }
    }
}
