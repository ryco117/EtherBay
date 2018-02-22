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

// Import BigNumber library for manipulating Flag ID
var BigNumber = require('bignumber.js');
// Store constants for common bit lengths
const bitNum32 = new BigNumber("100000000", 16);
const bitNum24 = new BigNumber("1000000", 16);
const bitNum16 = new BigNumber("10000", 16);
const bitNum8  = new BigNumber("100", 16);
function toColour(bigNumber) {
  const str = bigNumber.toString(16);
  return "#" + '0'.repeat(6 - str.length) + str;
};
function base2Log(bigNumber) {
  var i = 0;
  while(bigNumber.greaterThan(1)) {
    bigNumber = bigNumber.dividedToIntegerBy(2);
    i++;
  }

  return i;
};


// Draw a solid colour as the background
function drawSolidToBackground(flagId, ctx, w, h, bgPrimary, bgSecondary) {
  ctx.fillStyle = bgPrimary;
  ctx.strokeStyle = bgSecondary;
  ctx.fillRect(0,0,w,h);
  ctx.strokeRect(0,0,w,h);

  return flagId;
}
// Draw a linear gradient background
function drawLinearGradientToBackground(flagId, ctx, w, h, bgPrimary, bgSecondary) {
  // Retrieve gradient parameters from ID
  var xStart = flagId.modulo(bitNum8).dividedBy(bitNum8).toNumber() * w;
  flagId = flagId.dividedToIntegerBy(bitNum8);
  var yStart = flagId.modulo(bitNum8).dividedBy(bitNum8).toNumber() * h;
  flagId = flagId.dividedToIntegerBy(bitNum8);
  var xEnd= flagId.modulo(bitNum8).dividedBy(bitNum8).toNumber() * w;
  flagId = flagId.dividedToIntegerBy(bitNum8);
  var yEnd = flagId.modulo(bitNum8).dividedBy(bitNum8).toNumber() * h;
  flagId = flagId.dividedToIntegerBy(bitNum8);

  // Create gradient
  var grd = ctx.createLinearGradient(xStart, yStart, xEnd, yEnd);
  grd.addColorStop(0, bgPrimary);
  grd.addColorStop(1, bgSecondary);

  ctx.fillStyle = grd;
  ctx.fillRect(0,0,w,h);
  ctx.strokeRect(0,0,w,h);

  return flagId;
}
// Draw horizontal/vertical bars to the background
function drawBarsToBackground(flagId, ctx, w, h, bgPrimary, bgSecondary) {
  // Retrieve bars count from ID
  var n = 17 - base2Log(flagId.modulo(bitNum16));
  flagId = flagId.dividedToIntegerBy(bitNum16);
  var parity = flagId.modulo(bitNum16).dividedBy(bitNum16).toNumber() > 0.5;
  flagId = flagId.dividedToIntegerBy(bitNum16);

  // Create bars
  for(var i = 0; i < n; i++) {
    if(i % 2 == 0) {
      ctx.fillStyle = bgPrimary;
    } else {
      ctx.fillStyle = bgSecondary;
    }

    if(parity) {
      ctx.fillRect((i/n) * w, 0, w/n, h);
    } else {
      ctx.fillRect(0, (i/n)*h, w, h/n);
    }
  }

  return flagId;
}
// Draw a square as the symbol
function drawSquareToSymbol(flagId, ctx, w, h, symPrimary, symSecondary) {
  ctx.fillStyle = symPrimary;
  ctx.strokeStyle = symSecondary;

  // Retrieve square parameters from ID
  var xOffset = flagId.modulo(bitNum8).dividedBy(bitNum8).toNumber()/2 - 0.25;
  flagId = flagId.dividedToIntegerBy(bitNum8);
  var yOffset = flagId.modulo(bitNum8).dividedBy(bitNum8).toNumber()/2 - 0.25;
  flagId = flagId.dividedToIntegerBy(bitNum8);
  var sideLength = (flagId.modulo(bitNum16).dividedBy(bitNum16).toNumber()**1.5) * h;
  flagId = flagId.dividedToIntegerBy(bitNum16);

  const xPos = (0.5 - sideLength/(2*w) + xOffset) * w;
  const yPos = (0.5 - sideLength/(2*h) + yOffset) * h;

  // Draw square
  ctx.fillRect(xPos, yPos, sideLength, sideLength);
  ctx.strokeRect(xPos, yPos, sideLength, sideLength);
}
// Draw a circle as the symbol
function drawCircleToSymbol(flagId, ctx, w, h, symPrimary, symSecondary) {
  ctx.fillStyle = symPrimary;
  ctx.strokeStyle = symSecondary;

  // Retrieve square parameters from ID
  var xOffset = flagId.modulo(bitNum8).dividedBy(bitNum8).toNumber()/2 - 0.25;
  flagId = flagId.dividedToIntegerBy(bitNum8);
  var yOffset = flagId.modulo(bitNum8).dividedBy(bitNum8).toNumber()/2 - 0.25;
  flagId = flagId.dividedToIntegerBy(bitNum8);
  var radius = (flagId.modulo(bitNum16).dividedBy(bitNum16).toNumber()**1.5) * h/2;
  flagId = flagId.dividedToIntegerBy(bitNum16);

  const xPos = (0.5 - radius/(2*w) + xOffset) * w;
  const yPos = (0.5 - radius/(2*h) + yOffset) * h;

  // Draw circle
  ctx.arc(xPos, yPos, radius, 0 , 2*Math.PI);
  ctx.fill();
}
// Draw a triangle as the symbol
function drawTriangleToSymbol(flagId, ctx, w, h, symPrimary, symSecondary) {
  // Retrieve triangle parameters from ID
  var xPosA = flagId.modulo(bitNum8).dividedBy(bitNum8).toNumber() * w;
  flagId = flagId.dividedToIntegerBy(bitNum8);
  var yPosA = flagId.modulo(bitNum8).dividedBy(bitNum8).toNumber() * h;
  flagId = flagId.dividedToIntegerBy(bitNum8);
  var xPosB = flagId.modulo(bitNum8).dividedBy(bitNum8).toNumber() * w;
  flagId = flagId.dividedToIntegerBy(bitNum8);
  var yPosB = flagId.modulo(bitNum8).dividedBy(bitNum8).toNumber() * h;
  flagId = flagId.dividedToIntegerBy(bitNum8);
  var xPosC = flagId.modulo(bitNum8).dividedBy(bitNum8).toNumber() * w;
  flagId = flagId.dividedToIntegerBy(bitNum8);
  var yPosC = flagId.modulo(bitNum8).dividedBy(bitNum8).toNumber() * h;
  flagId = flagId.dividedToIntegerBy(bitNum8);

  // Define triangle
  ctx.beginPath();
  ctx.moveTo(xPosA, yPosA);
  ctx.lineTo(xPosB, yPosB);
  ctx.lineTo(xPosC, yPosC);
  ctx.closePath();

  // Colour
  ctx.fillStyle = symPrimary;
  ctx.strokeStyle = symSecondary;
  ctx.fill();
  ctx.stroke();
}
// Draw a cross as the symbol
function drawCrossToSymbol(flagId, ctx, w, h, symPrimary, symSecondary) {
  ctx.fillStyle = symPrimary;
  ctx.strokeStyle = symSecondary;

  // Retrieve square parameters from ID
  var xOffset = flagId.modulo(bitNum8).dividedBy(bitNum8).toNumber()/2 - 0.25;
  flagId = flagId.dividedToIntegerBy(bitNum8);
  var yOffset = flagId.modulo(bitNum8).dividedBy(bitNum8).toNumber()/2 - 0.25;
  flagId = flagId.dividedToIntegerBy(bitNum8);
  var sideLength = (flagId.modulo(bitNum16).dividedBy(bitNum16).toNumber()**1.5) * h/2;
  flagId = flagId.dividedToIntegerBy(bitNum16);

  const xPos = (0.5 - sideLength/(2*w) + xOffset) * w;
  const yPos = (0.5 - sideLength/(2*h) + yOffset) * h;

  // Draw crosses
  ctx.beginPath();
  ctx.moveTo(xPos - sideLength/6, yPos - sideLength/2);
  ctx.lineTo(xPos + sideLength/6, yPos - sideLength/2);
  ctx.lineTo(xPos + sideLength/6, yPos - sideLength/6);
  ctx.lineTo(xPos + sideLength/2, yPos - sideLength/6);
  ctx.lineTo(xPos + sideLength/2, yPos + sideLength/6);
  ctx.lineTo(xPos + sideLength/6, yPos + sideLength/6);
  ctx.lineTo(xPos + sideLength/6, yPos + sideLength/2);
  ctx.lineTo(xPos - sideLength/6, yPos + sideLength/2);
  ctx.lineTo(xPos - sideLength/6, yPos + sideLength/6);
  ctx.lineTo(xPos - sideLength/2, yPos + sideLength/6);
  ctx.lineTo(xPos - sideLength/2, yPos - sideLength/6);
  ctx.lineTo(xPos - sideLength/6, yPos - sideLength/6);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}
// Generate an image using HTML Canvas given a Flag ID (ethereum uint256)
function drawFlagToCanvas(flagId, canvasId) {
  // Find the flag-canvas we are drawing to
  var canvas = document.getElementById(canvasId);
  var ctx = canvas.getContext("2d");
  const h = canvas.height
  const w = canvas.width;

  // Flag ID BIT BREAKDOWN
  // Total - 256 Bits
  // - 96 bits for 4 x RGB colours
  // - 32 bits to allow rare background types
  // - up to 32 bits for background
  // - 32 bits to allow rare symbols
  // - up to 64 bits for symbol parameters

  // Disassemble flagId
  const bgPrimary = toColour(flagId.modulo(bitNum24));
  flagId = flagId.dividedToIntegerBy(bitNum24);
  const bgSecondary = toColour(flagId.modulo(bitNum24));
  flagId = flagId.dividedToIntegerBy(bitNum24);
  const symPrimary = toColour(flagId.modulo(bitNum24));
  flagId = flagId.dividedToIntegerBy(bitNum24);
  const symSecondary = toColour(flagId.modulo(bitNum24));
  flagId = flagId.dividedToIntegerBy(bitNum24);

  // Logging Colours
  console.log("Flag: BG Primary Colour: " + bgPrimary);
  console.log("Flag: BG Secondary Colour: " + bgSecondary);
  console.log("Flag: FG Primary Colour: " + symPrimary);
  console.log("Flag: FG Secondary Colour: " + symSecondary);

  // Determine background type
  var bgType = flagId.modulo(bitNum32).dividedBy(bitNum32);
  flagId = flagId.dividedToIntegerBy(bitNum32);
  if(bgType.lessThan(new BigNumber("0.0000001", 10))) {
    // TODO: Special fractal
    console.log("Flag: Fractal BG");
  } else if(bgType.lessThan(0.15)) {
    console.log("Flag: Linear Gradient BG");
    flagId = drawLinearGradientToBackground(flagId, ctx, w, h, bgPrimary, bgSecondary);
  } else if(bgType.lessThan(0.5)) {
    console.log("Flag: Bars BG");
    flagId = drawBarsToBackground(flagId, ctx, w, h, bgPrimary, bgSecondary);
  } else {
    console.log("Flag: Solid Colour BG");
    flagId = drawSolidToBackground(flagId, ctx, w, h, bgPrimary, bgSecondary);
  }
  ctx.moveTo(0, 0);

  // Determine foreground/symbol type
  var fgType = flagId.modulo(bitNum32).dividedBy(bitNum32);
  flagId = flagId.dividedToIntegerBy(bitNum32);
  if(fgType.lessThan(new BigNumber("0.0000001", 10))) {
    // TODO: Ethereum symbol
    console.log("Flag: Ethereum Symbol FG");
  } else if(fgType.lessThan(0.15)) {
    console.log("Flag: Triangle Symbol FG");
    drawTriangleToSymbol(flagId, ctx, w, h, symPrimary, symSecondary);
  } else if(fgType.lessThan(0.40)) {
    console.log("Flag: Circle Symbol FG");
    drawCircleToSymbol(flagId, ctx, w, h, symPrimary, symSecondary);
  } else if(fgType.lessThan(0.55)) {
    console.log("Flag: Cross Symbol FG");
    drawCrossToSymbol(flagId, ctx, w, h, symPrimary, symSecondary);
  } else {
    console.log("Flag: Square Symbol FG");
    drawSquareToSymbol(flagId, ctx, w, h, symPrimary, symSecondary);
  }
  // var xStrtPos = flagId.modulo(bitNum8).dividedBy(bitNum8).toNumber();
  // flagId = flagId.dividedToIntegerBy(bitNum8);
  // var yStrtPos = flagId.modulo(bitNum8).dividedBy(bitNum8).toNumber();
  // flagId = flagId.dividedToIntegerBy(bitNum8);
  // for(var i = 0; i < 9; i++) {
  //   var xEndPos = flagId.modulo(bitNum8).dividedBy(bitNum8).toNumber();
  //   flagId = flagId.dividedToIntegerBy(bitNum8);
  //   var yEndPos = flagId.modulo(bitNum8).dividedBy(bitNum8).toNumber();
  //   flagId = flagId.dividedToIntegerBy(bitNum8);
  //   ctx.moveTo(xStrtPos * w, yStrtPos * h);
  //   ctx.lineTo(xEndPos * w, yEndPos * h);
  //   ctx.stroke();
  //   xStrtPos = xEndPos;
  //   yStrtPos = yEndPos;
  // }
}

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
