pragma solidity ^0.4.17;

// A contract representing a request for the upload of specific content to IPFS
// as well as the promise of payment by a set of backers for acceptable content
contract EtherBayRequest {
    // Constants used in class
    uint MINIMUM_BACKING_VALUE = 0.01 ether;
    uint REWARD_FRACTION_NUMERATOR = 3;
    uint REWARD_FRACTION_DENOMINATOR = 5;
    uint RETURN_FRACTION_NUMERATOR = 1;
    uint RETURN_FRACTION_DENOMINATOR = 5;

    // Data for submitting potential content on IPFS
	struct Submission {
		address submitter;  // Donator of IPFS link
		string ipfsHash;    // IPFS link
		uint numBackers;    // The number of backers that accepted this submission
	}
	Submission[] public submissions;
	event NewSubmission(address, string);

    // Data for financially backing this contract
	mapping(address => uint) public backingAmount;
	uint public numberBackers;
	event NewBacking(address, uint);

    // We'll make him special for creating the request for us
    // Receives any ether left in contract at completion
	address public creator;

    // The IPFS hash-link of the content-request description
    string public descriptionHash;

    // Construct contract
	function EtherBayRequest(string descHash, address requester) public {
        creator = requester;
        numberBackers = 0;
        descriptionHash = descHash;
	}

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

    // Get the number of submissions in array
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

        // Update backer's and submission's status
        backingAmount[msg.sender] = 0;
        numberBackers -= 1;
        submissions[submissionIndex].numBackers += 1;

        // Attempt to send reward
        if(!submissions[submissionIndex].submitter.send(rewardAmount)) {
            revert();
        }

        // Attempt to reward validator with a share of their submission
        if(!msg.sender.send(returnAmount)) {
            revert();
        }

        // If all backers are satisfied...
        if(numberBackers == 0) {
            // reward creator for creating this successfull post with marginal
            // ether left
            selfdestruct(creator);
        }
    }

    // Submit an IPFS hash for consideration
    function submitContent(string contentHash) public {
        Submission memory newSubmission = Submission(msg.sender, contentHash, 0);
        submissions.push(newSubmission);
    }
}
