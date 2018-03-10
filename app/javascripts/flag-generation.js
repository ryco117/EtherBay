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
  while(bigNumber.isGreaterThan(1)) {
    bigNumber = bigNumber.dividedToIntegerBy(2);
    i++;
  }

  return i;
};


// Draw To Background
// =============================================================================

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
  // Retrieve bars count from ID. Exponential declines from 2-bar flags as most probable
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


// Draw To Foreground
// =============================================================================

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

  ctx.translate((0.5 + xOffset)*w, (0.5 + yOffset)*h);

  // Draw square
  ctx.fillRect(-0.5*sideLength, -0.5*sideLength, sideLength, sideLength);
  ctx.strokeRect(-0.5*sideLength, -0.5*sideLength, sideLength, sideLength);
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

  ctx.translate((0.5 + xOffset)*w, (0.5 + yOffset)*h);

  // Draw circle
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0 , 2*Math.PI);
  ctx.fill();
  ctx.stroke();
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

  ctx.translate((0.5 + xOffset)*w, (0.5 + yOffset)*h);

  // Draw crosses
  ctx.beginPath();
  ctx.moveTo(-sideLength/6, -sideLength/2);
  ctx.lineTo(sideLength/6, -sideLength/2);
  ctx.lineTo(sideLength/6, -sideLength/6);
  ctx.lineTo(sideLength/2, -sideLength/6);
  ctx.lineTo(sideLength/2, sideLength/6);
  ctx.lineTo(sideLength/6, sideLength/6);
  ctx.lineTo(sideLength/6, sideLength/2);
  ctx.lineTo(-sideLength/6, sideLength/2);
  ctx.lineTo(-sideLength/6, sideLength/6);
  ctx.lineTo(-sideLength/2, sideLength/6);
  ctx.lineTo(-sideLength/2, -sideLength/6);
  ctx.lineTo(-sideLength/6, -sideLength/6);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}
// Draw a Ethereum-logo as the symbol
function drawEthereumToSymbol(flagId, ctx, w, h, symPrimary, symSecondary) {
  ctx.fillStyle = "#12100B";
  ctx.strokeStyle = "#000005";

  // Retrieve positional parameters from ID
  var xOffset = flagId.modulo(bitNum8).dividedBy(bitNum8).toNumber()/2 - 0.25;
  flagId = flagId.dividedToIntegerBy(bitNum8);
  var yOffset = flagId.modulo(bitNum8).dividedBy(bitNum8).toNumber()/2 - 0.25;
  flagId = flagId.dividedToIntegerBy(bitNum8);
  var radius = (flagId.modulo(bitNum16).dividedBy(bitNum16).toNumber()**1.5) * h;
  flagId = flagId.dividedToIntegerBy(bitNum16);

  ctx.translate((0.5 + xOffset)*w, (0.5 + yOffset)*h);

  // Ethereum Top-Half
  // Perimeter
  ctx.beginPath();
  ctx.moveTo(0, -0.9*radius);
  ctx.lineTo(-0.5*radius,0);
  ctx.lineTo(0, 0.289*radius);
  ctx.lineTo(0.5*radius,0);
  ctx.closePath();
  ctx.stroke();
  // Top-Left
  ctx.fillStyle = "#93928f";
  ctx.beginPath();
  ctx.moveTo(0, -0.9*radius);
  ctx.lineTo(-0.5*radius,0);
  ctx.lineTo(0, -0.289*radius);
  ctx.closePath();
  ctx.fill();
  // Top-Right
  ctx.fillStyle = "#43413e";
  ctx.beginPath();
  ctx.moveTo(0, -0.9*radius);
  ctx.lineTo(0.5*radius, 0);
  ctx.lineTo(0, -0.289*radius);
  ctx.closePath();
  ctx.fill();
  //Bottom-Left
  ctx.fillStyle = "#706e6c";
  ctx.beginPath();
  ctx.moveTo(0, 0.289*radius);
  ctx.lineTo(-0.5*radius,0);
  ctx.lineTo(0, -0.289*radius);
  ctx.closePath();
  ctx.fill();
  //Bottom-Right
  ctx.fillStyle = "#2d2b27";
  ctx.beginPath();
  ctx.moveTo(0, 0.289*radius);
  ctx.lineTo(0.5*radius,0);
  ctx.lineTo(0, -0.289*radius);
  ctx.closePath();
  ctx.fill();

  ctx.translate(0, 0.1*radius);
  // Ethereum Bottom-Half
  // Perimeter
  ctx.beginPath();
  ctx.moveTo(0, 0.7*radius);
  ctx.lineTo(-0.5*radius,0);
  ctx.lineTo(0, 0.289*radius);
  ctx.lineTo(0.5*radius,0);
  ctx.closePath();
  ctx.stroke();
  // Left
  ctx.fillStyle = "#949390";
  ctx.beginPath();
  ctx.moveTo(0, 0.7*radius);
  ctx.lineTo(-0.5*radius, 0);
  ctx.lineTo(0, 0.289*radius);
  ctx.closePath();
  ctx.fill();
  // Right
  ctx.fillStyle = "#43413e";
  ctx.beginPath();
  ctx.moveTo(0, 0.7*radius);
  ctx.lineTo(0.5*radius, 0);
  ctx.lineTo(0, 0.289*radius);
  ctx.closePath();
  ctx.fill();
}

// Draw a Jolly Roger as the symbol
function drawJollyRogerToSymbol(flagId, ctx, w, h, symPrimary, symSecondary) {
  ctx.fillStyle = symPrimary;
  ctx.strokeStyle = symSecondary;

  // Retrieve positional parameters from ID
  var xOffset = flagId.modulo(bitNum8).dividedBy(bitNum8).toNumber()/2 - 0.25;
  flagId = flagId.dividedToIntegerBy(bitNum8);
  var yOffset = flagId.modulo(bitNum8).dividedBy(bitNum8).toNumber()/2 - 0.25;
  flagId = flagId.dividedToIntegerBy(bitNum8);
  var sideLength = (flagId.modulo(bitNum16).dividedBy(bitNum16).toNumber()**1.5) * h;
  flagId = flagId.dividedToIntegerBy(bitNum16);

  ctx.translate((0.5 + xOffset)*w, (0.5 + yOffset)*h);

  // Cross Bones
  for (var i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.moveTo(0, 0.1*h);
    ctx.lineTo(-0.4*h, 0.5*h);
    ctx.bezierCurveTo(-0.3*h, 0.6*h, -0.575*h, 0.65*h, -0.5*h, 0.5*h);
    ctx.bezierCurveTo(-0.65*h, 0.575*h, -0.6*h, 0.3*h, -0.5*h, 0.4*h);
    ctx.lineTo(-0.1*h, 0);
    ctx.closePath();
    ctx.stroke();
    ctx.fill();

    ctx.rotate(Math.PI/2);
  }

  // Skull Mouth
  ctx.translate(0, 0.125*h);
  ctx.beginPath();
  ctx.moveTo(-0.3*h, 0);
  ctx.bezierCurveTo(-0.3*h, 0.4*h, 0.3*h, 0.4*h, 0.3*h, 0);
  ctx.bezierCurveTo(0.3*h, 0.15*h, -0.3*h, 0.15*h, -0.3*h, 0);
  ctx.bezierCurveTo(-0.3*h, 0.275*h, 0.3*h, 0.275*h, 0.3*h, 0);
  ctx.bezierCurveTo(0.3*h, 0.15*h, -0.3*h, 0.15*h, -0.3*h, 0);
  ctx.bezierCurveTo(-0.3*h, 0.475*h, 0.3*h, 0.475*h, 0.3*h, 0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  //Teeth
  ctx.beginPath();
  ctx.moveTo(0, 0.3*h);
  ctx.lineTo(0, 0.1*h);
  ctx.moveTo(-0.15*h, 0.265*h);
  ctx.lineTo(-0.15*h, 0.075*h);
  ctx.moveTo(0.15*h, 0.265*h);
  ctx.lineTo(0.15*h, 0.075*h);
  ctx.stroke();

  // Skull Head
  ctx.beginPath();
  ctx.moveTo(-0.3*h, 0);
  ctx.bezierCurveTo(-0.6*h, -0.75*h, 0.6*h, -0.75*h, 0.3*h, 0);
  ctx.bezierCurveTo(0.3*h, 0.15*h, -0.3*h, 0.15*h, -0.3*h, 0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // Eyes
  ctx.fillStyle = ctx.strokeStyle;
  ctx.beginPath();
  ctx.ellipse(-0.175*h, -0.175*h, 0.1*h, 0.075*h, Math.PI/10, 0, 2*Math.PI);
  ctx.ellipse(0.175*h, -0.175*h, 0.1*h, 0.075*h, -Math.PI/10, 0, 2*Math.PI);
  ctx.fill();
  ctx.beginPath();
  //Nose
  ctx.ellipse(0, -0.02*h, 0.05*h, 0.07*h, 0, 0, 2*Math.PI);
  ctx.fill();
}

// Draw a Heart as the symbol
function drawHeartToSymbol(flagId, ctx, w, h, symPrimary, symSecondary) {
  ctx.fillStyle = symPrimary;
  ctx.strokeStyle = symSecondary;

  // Retrieve positional parameters from ID
  var xOffset = flagId.modulo(bitNum8).dividedBy(bitNum8).toNumber()/2 - 0.25;
  flagId = flagId.dividedToIntegerBy(bitNum8);
  var yOffset = flagId.modulo(bitNum8).dividedBy(bitNum8).toNumber()/2 - 0.25;
  flagId = flagId.dividedToIntegerBy(bitNum8);
  var sideLength = (flagId.modulo(bitNum16).dividedBy(bitNum16).toNumber()**1.5) * h;
  flagId = flagId.dividedToIntegerBy(bitNum16);

  ctx.translate((0.5 + xOffset)*w, (0.5 + yOffset)*h);

  // Heart
  ctx.moveTo(0, 0.25*h);
  ctx.bezierCurveTo(-0.05*h, 0.1*h, -0.2*h, 0.175*h, -0.225*h, 0);
  ctx.bezierCurveTo(-0.275*h, -0.175*h, 0, -0.25*h, 0, -0.05*h);
  ctx.bezierCurveTo(0, -0.25*h, 0.275*h, -0.175*h, 0.225*h, 0);
  ctx.bezierCurveTo(0.2*h, 0.175*h, 0.05*h, 0.1*h, 0, 0.25*h);
  ctx.fill();
  ctx.stroke();
}

// Draw a Peace Sign as the symbol
function drawPeaceToSymbol(flagId, ctx, w, h, symPrimary, symSecondary) {
  ctx.fillStyle = symPrimary;
  ctx.strokeStyle = symSecondary;

  // Retrieve positional parameters from ID
  var xOffset = flagId.modulo(bitNum8).dividedBy(bitNum8).toNumber()/2 - 0.25;
  flagId = flagId.dividedToIntegerBy(bitNum8);
  var yOffset = flagId.modulo(bitNum8).dividedBy(bitNum8).toNumber()/2 - 0.25;
  flagId = flagId.dividedToIntegerBy(bitNum8);
  var radius = (flagId.modulo(bitNum16).dividedBy(bitNum16).toNumber()**1.5) * h;
  flagId = flagId.dividedToIntegerBy(bitNum16);

  ctx.translate((0.5 + xOffset)*w, (0.5 + yOffset)*h);

  // Peace
  ctx.beginPath();
  ctx.lineWidth = radius*0.15;
  ctx.arc(0, 0, radius, 0, 2*Math.PI);
  ctx.closePath();
  ctx.stroke();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(0, radius);
  ctx.lineTo(0, -radius);
  ctx.moveTo(0, 0);
  ctx.lineTo(0.707*radius, 0.707*radius);
  ctx.moveTo(0, 0);
  ctx.lineTo(-0.707*radius, 0.707*radius);
  ctx.stroke();
}

// Draw a Peace Sign as the symbol
function drawYingYangToSymbol(flagId, ctx, w, h, symPrimary, symSecondary) {
  ctx.fillStyle = symPrimary;
  ctx.strokeStyle = symSecondary;

  // Retrieve positional parameters from ID
  var xOffset = flagId.modulo(bitNum8).dividedBy(bitNum8).toNumber()/2 - 0.25;
  flagId = flagId.dividedToIntegerBy(bitNum8);
  var yOffset = flagId.modulo(bitNum8).dividedBy(bitNum8).toNumber()/2 - 0.25;
  flagId = flagId.dividedToIntegerBy(bitNum8);
  var radius = (flagId.modulo(bitNum16).dividedBy(bitNum16).toNumber()**1.5) * h;
  flagId = flagId.dividedToIntegerBy(bitNum16);

  ctx.translate((0.5 + xOffset)*w, (0.5 + yOffset)*h);

  // Ying
  ctx.beginPath();
  ctx.moveTo(0, -radius);
  ctx.arcTo(25*radius, 0, 0, radius, radius);
  ctx.arcTo(3*radius, radius/2, 0, 0, radius/2);
  ctx.arcTo(-10*radius, -radius/2, 0, -radius, radius/2);
  ctx.closePath();
  ctx.stroke();
  ctx.fill();

  // Yang
  const tempColour = ctx.fillStyle;
  ctx.fillStyle = ctx.strokeStyle;
  ctx.strokeStyle = tempColour;
  ctx.beginPath();
  ctx.moveTo(0, -radius);
  ctx.arcTo(-25*radius, 0, 0, radius, radius);
  ctx.arcTo(20*radius, radius/2, 0, 0, radius/2);
  ctx.arcTo(-10*radius, -radius/2, 0, -radius, radius/2);
  ctx.closePath();
  ctx.stroke();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(0, -radius/2);
  ctx.arc(0, -radius/2, radius/4, 0, 2*Math.PI);
  ctx.fill();
  ctx.fillStyle = tempColour;
  ctx.beginPath();
  ctx.moveTo(0, radius/2);
  ctx.arc(0, radius/2, radius/4, 0, 2*Math.PI);
  ctx.fill();
}


// Generate Flag
// =============================================================================

// Use array to map ranges to foreground/background generation functions
const foregroundMap = [
  [0.005, drawEthereumToSymbol],
  [0.01, drawJollyRogerToSymbol],
  [0.02, drawPeaceToSymbol],
  [0.03, drawYingYangToSymbol],
  [0.05, drawHeartToSymbol],
  [0.3, drawTriangleToSymbol],
  [0.5, drawCrossToSymbol],
  [0.7, drawCircleToSymbol],
  [1, drawSquareToSymbol]
];

const backgroundMap = [
  [0.05, drawLinearGradientToBackground],
  [0.65, drawBarsToBackground],
  [1, drawSolidToBackground]
];

// Generate an image using HTML Canvas given a Flag ID (ethereum uint256)
exports.drawFlagToCanvas = function (flagIdStr, canvasId) {
  // Convert hexadecimal flag-ID string to number
  var flagId = BigNumber.isBigNumber(flagIdStr) ?
    flagIdStr : new BigNumber(flagIdStr, 16);

  // Find the flag-canvas we are drawing to
  var canvas = document.getElementById(canvasId);
  var ctx = canvas.getContext("2d");
  const h = canvas.height
  const w = canvas.width;
  ctx.clearRect(0, 0, w, h);

  // Flag ID BIT BREAKDOWN
  // Total - 256 Bits
  // - 96 bits for 4 x RGB colours
  // - 32 bits to allow rare background types
  // - up to 32 bits for background
  // - 32 bits to allow rare symbols
  // - up to 64 bits for symbol parameters

  // Disassemble flagId Colours
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

  ctx.save();
  for(var i = 0; i < backgroundMap.length; i++) {
    if(bgType.isLessThan(backgroundMap[i][0])) {
      flagId = backgroundMap[i][1](flagId, ctx, w, h, bgPrimary, bgSecondary);
      break;
    }
  }
  ctx.restore();

  // Determine foreground/symbol type
  var fgType = flagId.modulo(bitNum32).dividedBy(bitNum32);
  flagId = flagId.dividedToIntegerBy(bitNum32);

  ctx.save();
  for(var i = 0; i < foregroundMap.length; i++) {
    if(fgType.isLessThan(foregroundMap[i][0])) {
      foregroundMap[i][1](flagId, ctx, w, h, symPrimary, symSecondary);
      break;
    }
  }
  ctx.restore();

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
};
