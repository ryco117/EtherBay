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
            // Draw the primary flag in higher res
            etherBayFlags.tokenOfOwnerByIndex(account, 0).then(function(flagId) {
              const flagIdStr = flagId.toString(16);
              console.log("Primary Flag ID: 0x" + flagIdStr);
              flagGeneration.drawFlagToCanvas(flagIdStr, "mainCanvas");
            }).catch(function(e) {
              self.setErrorStatus("Error retrieving primary flag: " + e);
            });

            // Draw all owned flags
            var flagPromises = [];
            for(var i = 0; i < flagCount; i++) {
              // Get promises to fetch all flag IDs
              flagPromises.push(etherBayFlags.tokenOfOwnerByIndex(account, i));
            }
            var tableOfFlagsElm = document.getElementById("tableOfFlags");
            Promise.all(flagPromises).then(function(flagIds) {
              for(var i = 0; i < flagCount/2; i++) {
                var newRow = tableOfFlagsElm.insertRow(i+1);
                for(var j = 0; j < Math.min(flagCount - 2*i, 2); j++) {
                  var newCanvasCell = newRow.insertCell(j);
                  var flagId = flagIds[2*i + j].toString(16);
                  var newCanvas = document.createElement('canvas');
                  var newFunc = self.makeSwitchPrimaryFlagFunc(2*i + j);
                  newCanvas.addEventListener('dblclick', newFunc);
                  newCanvas.id = "newCanvas" + flagId;
                  newCanvas.style = "border:1px solid #c3c3c3;";
                  newCanvasCell.appendChild(newCanvas);
                  flagGeneration.drawFlagToCanvas(flagId, newCanvas.id);
                }
              }
            });
          }
        }).catch(function(e) {
          self.setErrorStatus("Error retrieving your flags count: " + e);
        });
      }).catch(function(e) {
        self.setErrorStatus("Error connecting to EtherBayFlags: " + e);
      });
    }).then(() => {
      self.setStatus("");
    }).catch(function(e) {
      self.setErrorStatus("Error connecting to EtherBay: " + e);
    });
  },

  makeSwitchPrimaryFlagFunc(flagIndex) {
    var self = this;
    return function() {
      self.makeFlagPrimary(flagIndex);
    };
  },

  makeFlagPrimary: function(flagWalletIndex) {
    var self = this;

    self.setStatus("Connecting to EtherBay contract...");
    EtherBay.deployed().then(function(etherBay) {
      etherBay.flagContract.call().then(function(flagAddr) {
        var etherBayFlags = EtherBayFlag.at(flagAddr);
        etherBayFlags.makePrimary(parseInt(flagWalletIndex), {from: account}).then(function(txId) {
          self.setStatus("Success! Replaced primary flag at transaction: " + txId.tx);
        }).catch(function(e) {
          self.setErrorStatus("Error switching flags: " + e);
        });
      }).catch(function(e) {
        self.setErrorStatus("Error connecting to EtherBayFlag: " + e);
      });
    }).catch(function(e) {
      self.setErrorStatus("Error connecting to EtherBay: " + e);
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
