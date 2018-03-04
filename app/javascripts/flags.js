import "../stylesheets/app.css";

// Import libraries we need.
import { default as Web3} from 'web3';
import { default as contract } from 'truffle-contract'

// Import our contract artifacts and turn them into usable abstractions.
import etherBayArtifacts from '../../build/contracts/EtherBay.json'
import etherBayFlagArtifacts from '../../build/contracts/EtherBayFlag.json'

// EtherBay is our usable abstraction, which we'll use through the code below.
var EtherBay = contract(etherBayArtifacts);
var EtherBayFlag = contract(etherBayFlagArtifacts);

// The following code is simple to show off interacting with your contracts.
// As your needs grow you will likely need to change its form and structure.
// For application bootstrapping, check out window.addEventListener below.
var accounts;
var account;

// Import IPFS-API
var ipfsApi = require("ipfs-mini");

// Import Flag Generation
var flagGeneration = require("./flag-generation");
var BigNumber = require('bignumber.js');


window.App = {
  ipfs: {},

  start: function() {
    var self = this;

    // Bootstrap the abstraction for use.
    EtherBay.setProvider(web3.currentProvider);
    EtherBayFlag.setProvider(web3.currentProvider);

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

    // TEST RENDERING
    // Generate Fake Flags
    const all256Bits = new BigNumber("FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF", 16);
    var tableOfFakeFlagsElm = document.getElementById("tableOfFakeFlags");
    for(var i = 0; i < 10; i++) {
      var newRow = tableOfFakeFlagsElm.insertRow(i+1);
      var newCanvasCell0 = newRow.insertCell(0);
      const flagId0 = BigNumber.random().multipliedBy(all256Bits).dividedToIntegerBy(1);
      const newCanvasId0 = "newCanvas" + flagId0.toString(16);
      var newCanvas0 = document.createElement('canvas');
      newCanvas0.id = newCanvasId0;
      newCanvasCell0.appendChild(newCanvas0);
      flagGeneration.drawFlagToCanvas(flagId0, newCanvasId0);

      var newCanvasCell1 = newRow.insertCell(1);
      const flagId1 = BigNumber.random().multipliedBy(all256Bits).dividedToIntegerBy(1);
      const newCanvasId1 = "newCanvas" + flagId1.toString(16);
      var newCanvas1 = document.createElement('canvas');
      newCanvas1.id = newCanvasId1;
      newCanvasCell1.appendChild(newCanvas1);
      flagGeneration.drawFlagToCanvas(flagId1, newCanvasId1);
    }
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
    var myFlagAmntElm = document.getElementById("myFlagAmnt");
    var totalFlagAmntElm = document.getElementById("totalFlagAmnt");

    self.setStatus("Connecting to EtherBay contract...");
    EtherBay.deployed().then(function(etherBay) {
      etherBay.flagContract.call().then(function(flagAddr) {
        var etherBayFlags = EtherBayFlag.at(flagAddr);

        // Get number of flags in circulation
        etherBayFlags.totalSupply().then(function(totalFlagCount) {
          totalFlagAmntElm.innerHTML = totalFlagCount.toNumber();
        }).catch(function(e) {
          self.setErrorStatus("Error retrieving total flags count: " + e);
        });

        // Get flag balance of main account
        etherBayFlags.balanceOf(account).then(function(flagCount) {
          flagCount = flagCount.toNumber();
          myFlagAmntElm.innerHTML = flagCount;
          if(flagCount) {
            etherBayFlags.tokenOfOwnerByIndex(account, 0).then(function(flagId) {
              console.log("Primary Flag ID: 0x" + flagId.toString(16));
              drawFlagToCanvas(flagId, "testCanvas");
            }).catch(function(e) {
              self.setErrorStatus("Error retrieving primary flag: " + e);
            });
          }
        }).catch(function(e) {
          self.setErrorStatus("Error retrieving your flags count: " + e);
        });
      }).catch(function(e) {
        self.setErrorStatus("Error connecting to EtherBay: " + e);
      });
    }).then(() => {
      self.setStatus("");
    }).catch(function(e) {
      self.setErrorStatus("Error connecting to EtherBay: " + e);
    });
  },

  generateFakeToken: function() {
    var flagId = document.getElementById("fakeToken").value;
    flagGeneration.drawFlagToCanvas(flagId, "testCanvas");
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
