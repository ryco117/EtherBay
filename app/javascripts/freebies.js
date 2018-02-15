import "../stylesheets/app.css";

// Import libraries we need.
import { default as Web3} from 'web3';
import { default as contract } from 'truffle-contract'

// Import our contract artifacts and turn them into usable abstractions.
import etherBayArtifacts from '../../build/contracts/EtherBay.json'

// EtherBay is our usable abstraction, which we'll use through the code below.
var EtherBay = contract(etherBayArtifacts);

// The following code is simple to show off interacting with your contracts.
// As your needs grow you will likely need to change its form and structure.
// For application bootstrapping, check out window.addEventListener below.
var accounts;
var account;

// Import IPFS-API
var ipfsApi = require("ipfs-mini");


window.App = {
  ipfs: {},

  start: function() {
    var self = this;

    // Bootstrap the abstraction for use.
    EtherBay.setProvider(web3.currentProvider);

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

  renderPage: function() {
    var self = this;
    var donationsTable = document.getElementById("tableOfDonations");

    self.setStatus("Connecting to EtherBay contract...");
    EtherBay.deployed().then(etherBay => {
      etherBay.getTotalDonations.call().then(totalDonations => {
        const total = totalDonations.toNumber();
        const maxIter = (total > 50) ? 50 : total;
        var donationPromises = [];
        for(var i = 0; i < maxIter; i++) {
          // Get dem up-to-50 donations
          donationPromises.push(etherBay.getDonation.call(i, {from: account}));
        }
        Promise.all(donationPromises).then(donationParams => {
          for(var i = 0; i < maxIter; i++) {
            const donationSrcAddr = donationParams[i][0];
            const donationParamHash = donationParams[i][1];

            var row = donationsTable.insertRow(1);
            var descCell = row.insertCell(0);
            var hashCell = row.insertCell(1);
            var tipsBttnCell = row.insertCell(2);

            self.ipfs.cat(donationParamHash, function(err, objStr) {
              if(err) {
                self.setStatus("Error retrieving content: " + err);
                throw err;
              }

              var donationDesc = JSON.parse(objStr);
              if(typeof(donationDesc.title) === "unknown" ||
                typeof(donationDesc.description) === "unknown" ||
                typeof(donationDesc.hash) === "unknown") {
                throw "Not a donation object";
              }
              descCell.innerHTML = donationDesc.title.toString();
              hashCell.innerHTML = donationDesc.hash.toString();
              tipsBttnCell.innerHTML = "<button onclick=\"App.tipDonator('" +
                donationSrcAddr + "')\">Tip</button>";
            });
          }
          self.setStatus("");
        }).catch(err => {
          self.setErrorStatus("Error fetching donations: " + err.toString());
        });
      }).catch(err => {
        self.setErrorStatus("Error fetching the count of donated links: " + err.toString());
      });
    }).catch(err => {
      self.setErrorStatus("Error connecting to EtherBay contract: " + err.toString());
    });
  },

  tipDonator: function(donatorAddress) {
    var self = this;
    var tipAmount = document.getElementById("tipAmount").value;

    self.setStatus("Tip content donator by " + tipAmount + " ETH...");
    var weiAmount = web3.toWei(tipAmount,"ether");
    web3.eth.sendTransaction({from: account, to: donatorAddress, value: weiAmount}, function(e, txId) {
      if(e) {
        self.setErrorStatus("Error tipping account: " + e);
      }
      else {
        self.setStatus("Success! Tipped account: " + donatorAddress + " !");
      }
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
