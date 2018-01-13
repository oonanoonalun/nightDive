//COLORS STUFF
function toHexColor(color) {
	//for changing colors to hex
        // round the numbers first
        for (var i = 0; i < 3; i++) {
                color[i] = Math.round(color[i]);
                color[i] = color[i].toString(16);
                if (color[i].length < 2){
                        color[i] = '0' + color[i];
                }
        }
        return '#' + color[0] + color[1] + color[2];        //this doesn't add their values only because they've already been made into strings?
}

function hexToDec(hexNumber) {
	//for changing hex colors back to dec
        var decColor = [];
        for (var i = 0; i < 3; i++) {
                decColor[i] = hexNumber.substring(((i * 2) + 1), ((i * 2) + 3));	//the "+1" skips the "#" at the beginning of a hex number
                decColor[i] = parseInt(decColor[i], 16);
        }
        return decColor;
}

function capColorBrightness(color, maxColor) {
    for (var i = 0; i < 3; i++) {
        color[i] = Math.min(maxColor[i], color[i]);
    }
    return color;
}
    
//for adding two colors together
function addColors(colorA, colorB) {
        var newColor = [];
        for (var i = 0; i < 3; i++) {
                newColor[i] = colorA[i] + colorB[i];
        }
        return newColor;
}

function divideColors(colorA, colorB) {
        var newColor = [];
        for (var i = 0; i < 3; i++) {
                newColor[i] = colorA[i] / colorB[i];
        }
        return newColor;
}

function addAllColors(colorsArray) {     //colorGroup should be an array of colors
        var newColor = colorsArray[0];
        for (var i = 1; i < colorsArray.length; i++) {
                for (var j = 0; j < 3; j++) {
                        newColor[j] += colorsArray[i][j];
                }
        }
        return newColor;
}

//for subtracting colors from one another. Won't produce anything below zero.
function subtractColors(colorA, colorB) {
        var newColor = [];
        for (var i = 0; i < 3; i++) {
                newColor[i] = Math.max(0, (colorA[i] - colorB[i]));
        }
        return newColor;
}

//for dividing each of the elements of color be a single divisor--mostly for bringing values back under the brightness cap after they've been added together
function divideColorByNumber(color, divisor) {
        var newColor = [];
        for (var i = 0; i < 3; i++) {
                newColor[i] = color[i] / divisor;
        }
        return newColor;
}

//could just divide numbers by a decimal/fraction (i.e. x / 0.25), but implemented this anyway. Maybe avoids some floating-point imprecision.
function multiplyColorByNumber(color, multiplier) {
        var newColor = [];
        for (var i = 0; i < 3; i++) {
                newColor[i] = color[i] * multiplier;
        }
        return newColor;
}

function colorToFixed(color) {
        // what's this for? Probably just looking at logging of colors?
        var abbreviatedColor = [];
        for (var i = 0; i < 3; i++) {
                abbreviatedColor[i] = Math.round(color[i]);     //wanted this to be "color[i].toFixed(2);" but for some reason that wasn't working.
        }
        return abbreviatedColor;
}

//adds up a colors R, G, and B values in order to measure its total brightness for comparison to other colors
function sumColor(color) {
        var totalBrightness = color[0];
        for (var i = 1; i < 3; i++) {
                totalBrightness += color[i];
        }
        return totalBrightness;
}

function averageBrightness(color) {
        return Math.round(sumColor(color) / 3); // the '/ 3' takes summed R, G, and B values and puts the sum back under 256
}

function valueToHue (value) {
        //receives a number between 0 and 1, inclusively and converts it to a hue.
        // if HIGH_EQUALS_BLUE: Value 0 = red, val 0.25 = yellow, val 0.5 = green, val 0.75 = cyan, val 1 = blue
        var hue;
        if (drawingSettings.blueIsHot) {
                if (value <= 0.25) {                            //anywhere from red to yellow
                        hue = [255, (255 * (value * 4)), 0];
                }
                if (value > 0.25 && value <= 0.5) {             //anywhere from yellow to green
                        hue = [Math.abs((255 * (value - 0.5)) * 4), 255, 0];     //the R value should be 0 for input 0.5 and 1 for input 0.25.
                }
                if (value > 0.5 && value <= 0.75) {
                        hue = [0, 255, (255 * ((value - 0.5) * 4))];    //anywhere  from green to cyan
                }
                if (value > 0.75 && value <= 1) {             //anywhere from yellow to green
                        hue = [0, Math.abs((255 * (value - 1) * 4)), 255];    //the G value should be 0 for input 0.5 and 1 for input 0.25.
                }
        } else {
                if (value <= 0.25) {                            //anywhere from blue to cyan
                        hue = [0, (255 * (value * 4)), 255];
                }
                if (value > 0.25 && value <= 0.5) {             //anywhere from cyan to green
                        hue = [0, 255, Math.abs((255 * (value - 0.5)) * 4)];     //the B value should be 0 for input 0.5 and 1 for input 0.25.
                }
                if (value > 0.5 && value <= 0.75) {
                        hue = [(255 * ((value - 0.5) * 4)), 255, 0];    //anywhere from green to yellow
                }
                if (value > 0.75 && value <= 1) {             //anywhere from yellow to red
                        hue = [255, Math.abs((255 * (value - 1) * 4)), 0];    //the G value should be 0 for input 0.5 and 1 for input 0.25.
                }                
        }
        return hue;
}

// WRONG I think the < 0.5 part of this is ok, though
function curveNormalizedValue(value) {
        var newVal;
        if (value < 0.5) {
                newVal = (value / 0.5) * 0.5;
        }
        if (value > 0.5) {
                newVal = (0.5 / value) * 0.5;
        }
        return newVal;
}

function brightnessToSpectrum(darkThreshold, maxBrightness, cell) {  //should send 255 as maxColor to this, probably
        //this function should take a value of 0 through 1, inclusively, and map it to a spectrum of colors from Red to Yellow to Green to Cyan to Blue.
        if (averageBrightness(cell.color) >= darkThreshold) {
                var newBrightness = averageBrightness(capColorBrightness(cell.color, [255, 255, 255])),
                        brightnessRange,
                        currentColorParametricValueOfRange;
                        brightnessRange = maxBrightness - darkThreshold;
                currentColorParametricValueOfRange = (newBrightness - darkThreshold) / brightnessRange;  //should generate a number inclusively between 1 and 0.
                // stretching out the midrange to creature some curvature
                //currentColorParametricValueOfRange = curveNormalizedValue(currentColorParametricValueOfRange);
                newColor = valueToHue(Math.min(1, currentColorParametricValueOfRange));
                //newColor = [currentColorParametricValueOfRange * 255, currentColorParametricValueOfRange * 255, currentColorParametricValueOfRange * 255];
                // WRONG. unnec but shouldn't remove until things are stable
                setCellColorGroup(currentColorParametricValueOfRange, cell);
                //newColor = [64 * currentColorParametricValueOfRange, 64 * currentColorParametricValueOfRange, 64 * currentColorParametricValueOfRange];
                return newColor;
        }
}

function setCellColorGroup(value, cell) {
        // this function is ONLY USED BY brightnessToSpectrum()
        if (value <= 0.2) {
                cell.colorGroup = 0; 
        }
        if (value > 0.2 && value <= 0.4) {
                cell.colorGroup = 1; 
        }
        if (value > 0.4 && value <= 0.6) {
                cell.colorGroup = 2; 
        }
        if (value > 0.6 && value <= 0.8) {
                cell.colorGroup = 3; 
        }
        if (value > 0.8 && value <= 1) {
                cell.colorGroup = 4; 
        }
}
