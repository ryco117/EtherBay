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
  start: function() {
    var self = this;

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

      self.renderPage();
    });
  },

  setStatus: function(message) {
    var status = document.getElementById("status");
    status.innerHTML = message;
  },

  renderPage: function() {
    var self = this;
    var submissionsTable = document.getElementById("tableOfSubmissions");

    self.setStatus("Connecting to IPFS gateway...");
    var ipfs = new ipfsApi({host: 'localhost', port: 5001, protocol: 'http'});

    var requestId = (new URL(window.location)).searchParams.get("id");
    var request = EtherBayRequest.at(requestId);
    self.setStatus("Fetching data... (please wait)");

    // Get EtherBay Request info
    request.descriptionHash.call().then(function(descriptionHash) {
      ipfs.cat(descriptionHash, function(err, objStr) {
        if(err) {
          self.setStatus("Error accepting content: " + e);
          throw err;
        }

        var requestDesc = JSON.parse(objStr);
        document.getElementById("requestTitle").innerHTML = requestDesc.title;
        document.getElementById("requestDescription").innerHTML = requestDesc.description;
	    });
	  }).catch(function(e) {
      console.log(e);
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
              acceptBttnCell.innerHTML = "<button onclick=\"App.acceptRequest(" +
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
    web3.eth.getBalance(requestId, function(err, totalBackingAmnt) {
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

    var requestId = (new URL(window.location)).searchParams.get("id");
    var etherBayRequest = EtherBayRequest.at(requestId);

    self.setStatus("Adding submission to blockchain...");
    return etherBayRequest.submitContent(contentHash, {from: account}).then(function(txId) {
      self.setStatus("Success! Added hash: " + contentHash + " to the blockchain at transaction: " + txId.tx);
    }).catch(function(e) {
      // There was an error! Handle it.
      console.log(e);
      self.setStatus("Error adding request: " + e);
    });
  },

  backRequest: function() {
    var self = this;
    var backingAmount = document.getElementById("backAmount").value;
    var requestId = (new URL(window.location)).searchParams.get("id");
    var request = EtherBayRequest.at(requestId);

    self.setStatus("Backing request by " + backingAmount + " ETH...");
    var weiAmount = web3.toWei(backingAmount,"ether");
    request.backThisRequest({from: account, value: weiAmount}).then(function(txId) {
      self.setStatus("Success! Backed request: " + requestId + " !");
    }).catch(function(e) {
      // There was an error! Handle it.
      console.log(e);
      self.setStatus("Error backing request: " + e);
    });
  },

  acceptRequest: function(contentIndex) {
    var self = this;
    var requestId = (new URL(window.location)).searchParams.get("id");
    var request = EtherBayRequest.at(requestId);

    self.setStatus("Validating content");
    request.validateSubmission(contentIndex, {from: account}).then(function(txId) {
      self.setStatus("Success! Validated content at transaction: " + txId.tx + " !");
    }).catch(function(e) {
      // There was an error! Handle it.
      console.log(e);
      self.setStatus("Error accepting content: " + e);
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
