// Import the page's CSS. Webpack will know what to do with it.
import "../stylesheets/app.css";

// Import libraries we need.
import { default as Web3} from 'web3';
import { default as contract } from 'truffle-contract'
import etherBayRequestArtifacts from '../../build/contracts/EtherBayRequest.json'
var EtherBayRequest = contract(etherBayRequestArtifacts);

// The following code is simple to show off interacting with your contracts.
// As your needs grow you will likely need to change its form and structure.
// For application bootstrapping, check out window.addEventListener below.
var accounts;
var account;

// Import IPFS-API
var ipfsApi = require("ipfs-mini");

// EtherBay contract status map from enum to string
const STATUS_STRING_MAP = {
  0: "Requesting Content",
  1: "Content Submitted",
  2: "Request Fulfilled"
};

window.App = {
  ipfs: {},
  requestId: "",

  start: function() {
    var self = this;
    self.requestId = (new URL(window.location)).searchParams.get("id");

    // Bootstrap the MetaCoin abstraction for Use.
    EtherBayRequest.setProvider(web3.currentProvider);

    // Get the initial account balance so it can be displayed.
    web3.eth.getAccounts(function(err, accs) {
      if (err != null) {
        alert("There was an error fetching your accounts.");
        return;
      }

      if (accs.length == 0) {
        alert("Couldn't get any accounts! Make sure your Ethereum client is configured correctly.");
        return;
      }

      accounts = accs;
      account = accounts[0];

      self.setStatus("Connecting to IPFS gateway...");
      // TODO: Allow user to choose IPFS gateway
      self.ipfs = new ipfsApi({host: 'localhost', port: 5001, protocol: 'http'});
      self.renderPage();
    });
  },

  setStatus: function(message) {
    var status = document.getElementById("status");
    status.innerHTML = message;
  },

  setErrorStatus: function(message) {
    var status = document.getElementById("status");
    status.innerHTML = "<b>" + message + "</b>";
    console.error(message);
  },

  renderPage: function() {
    var self = this;
    var submissionsTable = document.getElementById("tableOfSubmissions");
    var creatorsSpan = document.getElementById("creatorsSpan");

    var request = EtherBayRequest.at(self.requestId);
    self.setStatus("Fetching data... (please wait)");

    // Get EtherBay Request info
    request.descriptionHash.call().then(function(descriptionHash) {
      self.ipfs.cat(descriptionHash, function(err, objStr) {
        if(err) {
          self.setStatus("Error accepting content: " + e);
          throw err;
        }

        var requestDesc = JSON.parse(objStr);
        if(typeof(requestDesc.title) === "unknown" ||
          typeof(requestDesc.description) === "unknown") {
          throw "Not a request object";
        }
        document.getElementById("requestTitle").innerHTML = requestDesc.title;
        document.getElementById("requestDescription").innerHTML = requestDesc.description;
	    });
	  }).catch(function(e) {
      self.setErrorStatus("Error fetching request descriptioon hash: " + e.toString());
    });

    // If we created this request, allow to claim tax
    request.creator.call().then(function(requestCreator) {
      if(account == requestCreator) {
        request.totalClaim.call().then(function(currentTotalClaim) {
          creatorsSpan.innerHTML = "Total tax available for claim: " + web3.fromWei(currentTotalClaim) +
            " &Xi;<br/><button onclick=\"App.collectClaim()\">Claim</button><br/>";
        }).catch(function(e) {
          self.setErrorStatus("Error fetching creator's total claim: " + e.toString());
        });
      }
    }).catch(function(e) {
      self.setErrorStatus("Error fetching request's creator: " + e.toString());
    });

    // Get amount this account has backed
    var didWeBackRequest = false;
    request.currentBackingAmount.call({from: account}).then(function(myBackedAmnt) {
      var myBackedAmntLabel = document.getElementById("myBackedAmnt");
      if(myBackedAmnt > 0) {
        didWeBackRequest = true;
      }
      myBackedAmntLabel.innerHTML = web3.fromWei(myBackedAmnt);

      // Get number of submissions
      request.getTotalSubmissions.call().then(function(totalSubmissions) {
        var l = totalSubmissions.toNumber() - 1;
        var maxIter = l >= 50 ? 50 : l+1;
        var submissionPromises = [];
        for(var i = 0; i < maxIter; i++) {
          // Get promises to fill at most 50
          submissionPromises.push(request.getSubmission.call(i, {from: account}));
        }
        Promise.all(submissionPromises).then(function(submissionParams) {
          for(var i = 0; i < maxIter; i++) {
            var submitterId = submissionParams[i][0];
            var contentHash = submissionParams[i][1];
            var backers = submissionParams[i][2];

            var row = submissionsTable.insertRow(1);

            var hashCell = row.insertCell(0);
            var numAcceptsCell = row.insertCell(1);
            var acceptBttnCell = row.insertCell(2);

            hashCell.innerHTML = contentHash;
            numAcceptsCell.innerHTML = backers
            if(didWeBackRequest > 0) {
              acceptBttnCell.innerHTML = "<button onclick=\"App.acceptContent(" +
                i + ")\">Accept</button>";
            }
            self.setStatus("");
          }
        }).catch(function(e) {
          console.log(e);
        });
      }).then(() => {
        self.setStatus("");
      }).catch(function(e) {
        console.log(e);
        self.setStatus("Error retrieving count data: " + e);
      });
    });

    // Get amount that has been backed in total (minus acceptances)
    web3.eth.getBalance(self.requestId, function(err, totalBackingAmnt) {
      if(err) {
        throw err;
      }

      var totalBackingAmntLabel = document.getElementById("totalBackingAmnt");
      totalBackingAmntLabel.innerHTML = web3.fromWei(totalBackingAmnt);
    });
  },

  submitContent: function() {
    var self = this;
    var contentHash = document.getElementById("submissionHash").value;

    var etherBayRequest = EtherBayRequest.at(self.requestId);

    self.setStatus("Adding submission to blockchain...");
    return etherBayRequest.submitContent(contentHash, {from: account}).then(function(txId) {
      self.setStatus("Success! Added hash: " + contentHash + " to the blockchain at transaction: " + txId.tx);
    }).catch(function(e) {
      self.setErrorStatus("Error adding request: " + e);
    });
  },

  backRequest: function() {
    var self = this;
    var backingAmount = document.getElementById("backAmount").value;
    var request = EtherBayRequest.at(self.requestId);

    self.setStatus("Backing request by " + backingAmount + " ETH...");
    var weiAmount = web3.toWei(backingAmount,"ether");
    request.backThisRequest({from: account, value: weiAmount}).then(function(txId) {
      self.setStatus("Success! Backed request: " + self.requestId + " !");
    }).catch(function(e) {
      self.setErrorStatus("Error backing request: " + e);
    });
  },

  acceptContent: function(contentIndex) {
    var self = this;
    var request = EtherBayRequest.at(self.requestId);

    self.setStatus("Validating content...");
    request.validateSubmission(contentIndex, {from: account}).then(function(txId) {
      self.setStatus("Success! Validated content at transaction: " + txId.tx + " !");
    }).catch(function(e) {
      self.setErrorStatus("Error accepting content: " + e);
    });
  },

  collectClaim: function() {
    var self = this;
    var request = EtherBayRequest.at(self.requestId);

    self.setStatus("Collecting claim...");
    request.collectClaim({from: account}).then(function(txId) {
      self.setStatus("Success! Validated content at transaction: " + txId.tx + " !");
    }).catch(function(e) {
      self.setErrorStatus("Error collecting claim: " + e);
    });
  }
};

window.addEventListener('load', function() {
  // Checking if Web3 has been injected by the browser (Mist/MetaMask)
  if (typeof web3 !== 'undefined') {
    console.warn("Using web3 detected from external source. If you find that your accounts don't appear or you have 0 MetaCoin, ensure you've configured that source properly. If using MetaMask, see the following link. Feel free to delete this warning. :) http://truffleframework.com/tutorials/truffle-and-metamask")
    // Use Mist/MetaMask's provider
    window.web3 = new Web3(web3.currentProvider);
  } else {
    console.warn("No web3 detected. Falling back to http://localhost:8545. You should remove this fallback when you deploy live, as it's inherently insecure. Consider switching to Metamask for development. More info here: http://truffleframework.com/tutorials/truffle-and-metamask");
    // fallback - use your fallback strategy (local node / hosted node + in-dapp id mgmt / fail)
    window.web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
  }

  App.start();
});
