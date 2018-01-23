// Import the page's CSS. Webpack will know what to do with it.
import "../stylesheets/app.css";

// Import libraries we need.
import { default as Web3} from 'web3';
import { default as contract } from 'truffle-contract'

// Import our contract artifacts and turn them into usable abstractions.
import etherBayArtifacts from '../../build/contracts/EtherBay.json'
import etherBayRequestArtifacts from '../../build/contracts/EtherBayRequest.json'

// EtherBay is our usable abstraction, which we'll use through the code below.
var EtherBay = contract(etherBayArtifacts);
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

  start: function() {
    var self = this;

    // Bootstrap the abstraction for use.
    EtherBay.setProvider(web3.currentProvider);
    EtherBayRequest.setProvider(web3.currentProvider);

    // Get the initial account balance so it can be displayed.
    web3.eth.getAccounts(function(err, accs) {
      if (err != null) {
        alert("There was an error fetching your accounts.");
        return;
      }

      if(accs.length == 0) {
        alert("Couldn't get any accounts! Make sure your Ethereum client is configured correctly.");
        return;
      }

      accounts = accs;
      account = accounts[0];

      console.log("Using account: " + account);

      self.setStatus("Connecting to IPFS gateway...");
      self.ipfs = new ipfsApi({host: 'localhost', port: 5001, protocol: 'http'});
      self.renderPage();
    });
  },

  setStatus: function(message) {
    var status = document.getElementById("status");
    status.innerHTML = message;
    console.log(message);
  },

  setErrorStatus: function(message) {
    var status = document.getElementById("status");
    status.innerHTML = "<b>" + message + "</b>";
    console.error(message);
  },

  submitContent: function() {
    var self = this;
    var donTitle = document.getElementById("donTitle").value;
    var donDesc = document.getElementById("donDesc").value;
    var donHash = document.getElementById("donHash").value;
    var donationParamFile = {
      title: donTitle,
      description: donDesc,
      hash: donHash
    };

    self.setStatus("Adding file to IPFS...");
    self.ipfs.add(JSON.stringify(donationParamFile), function (err, hash) {
      EtherBay.deployed().then(function(etherBay) {
        self.setStatus("Adding donation to blockchain...");
        return etherBay.newDonation(hash, {from: account}).then(function(txId) {
          self.setStatus("Success! Added hash: " + hash + " to the blockchain!");
        }).catch(function(e) {
          // There was an error! Handle it.
          console.log(e);
          self.setStatus("Error adding content: " + e);
        });
      }).catch(function(e) {
        console.log(e);
        self.setStatus("Error adding content: " + e);
      });
    });
  },

  submitRequest: function() {
    var self = this;
    var reqTitle = document.getElementById("reqTitle").value;
    var reqDesc = document.getElementById("reqDesc").value;
    var requestParamFile = {
      title: reqTitle,
      description: reqDesc
    };

    self.setStatus("Adding parameters to IPFS...");
    self.ipfs.add(JSON.stringify(requestParamFile), function (err, hash) {
      if(err) {
        self.setErrorStatus("Error adding parameters to IPFS: " + err.toString());
        throw err;
      }

      var etherBay;
      EtherBay.deployed().then(function(instance) {
        etherBay = instance;

        self.setStatus("Adding request to blockchain...");
        return etherBay.newRequest(hash, {from: account}).then(function(txId) {
          self.setStatus("Success! Added hash: " + hash + " to the blockchain!");
        }).catch(function(e) {
          self.setErrorStatus("Error adding request: " + e);
        });
      }).catch(function(e) {
        self.setErrorStatus("Error adding request: " + e);
      });
    });
  },

  addRequestById: function(requestId) {
    var self = this;
    var requestsTable = document.getElementById("tableOfRequests");

    var row = requestsTable.insertRow(1);
	  var descCell = row.insertCell(0);
	  var submissionsCell = row.insertCell(1);
	  var currentBackingCell = row.insertCell(2);
	  var backBttnCell = row.insertCell(3);
	  var myBackedAmntCell = row.insertCell(4);

    var request = EtherBayRequest.at(requestId);
    request.descriptionHash.call().then(function(descriptionHash) {
      self.ipfs.cat(descriptionHash, function(err, objStr) {
        if(err) {
          self.setErrorStatus("Error fetching from IPFS: " + err.toString());
          throw err;
        }

        var requestDesc = JSON.parse(objStr);
        descCell.innerHTML = "<a href=\"request.html?id=" + requestId +
          "\">" + requestDesc.title + "</a>";
        request.getTotalSubmissions.call().then(function(numberSubmissions) {
          submissionsCell.innerHTML = numberSubmissions;
          web3.eth.getBalance(request.address, function(err, requestEthBalance) {
            currentBackingCell.innerHTML = web3.fromWei(requestEthBalance);
            backBttnCell.innerHTML = "<button onclick=\"App.backRequest(\'" + requestId + "\')\">+&Xi;</button>";
          });
        }).catch(function(e) {
          self.setErrorStatus("Error retrieving request submissions: " + e);
        });

        request.currentBackingAmount.call({from: account}).then(function(myBackedAmount) {
          myBackedAmntCell.innerHTML = web3.fromWei(myBackedAmount);
        }).catch(function(e) {
          self.setErrorStatus("Error retrieving request submissions: " + e);
        });
      });
    }).catch(function(e) {
      self.setErrorStatus("Error retrieving description hash: " + e);
    });
  },

  renderPage: function() {
    var self = this;

    self.setStatus("Connecting to EtherBay contract...");
    EtherBay.deployed().then(function(etherBay) {

      // Get number of requests in blockchain
      etherBay.getTotalRequests().then(function(totalRequests) {
      	console.log("Requests count: " + totalRequests);
        const total = totalRequests.toNumber();
        var maxIter = (total > 50) ? 50 : total;

        var requestPromises = [];
        for(var i = 0; i < maxIter; i++) {
	        requestPromises.push(etherBay.getRequest(i, {from: account}));
	      }
	      Promise.all(requestPromises).then(function(requestIds) {
	        for(var i = 0; i < maxIter; i++) {
	          self.addRequestById(requestIds[i]);
          }
        }).catch(function(e) {
          self.setErrorStatus("Error retrieving latest requests: " + e);
        });
      }).catch(function(e) {
        self.setErrorStatus("Error retrieving requests count: " + e);
      });
    }).then(() => {
      self.setStatus("");
    }).catch(function(e) {
      self.setErrorStatus("Error connecting to EtherBay: " + e);
    });
  },

  backRequest: function(requestId) {
    var self = this;
    var backingAmount = document.getElementById("backAmount").value;
    var request = EtherBayRequest.at(requestId);

    self.setStatus("Backing request by " + backingAmount + " ETH...");
    var weiAmount = web3.toWei(backingAmount,"ether");
    request.backThisRequest({from: account, value: weiAmount}).then(function(txId) {
      self.setStatus("Success! Backed request: " + requestId + " !");
    }).catch(function(e) {
      // There was an error! Handle it.
      self.setErrorStatus("Error backing request: " + e);
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
