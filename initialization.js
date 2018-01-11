var cells = [],
        canvasWidth = 800,
        canvasHeight = 600,
        //current coordinate system needs even number of cells in rows and columns. Either update findValidCellsPerRowForCanvas so that an option is to lock it even numbers in both directions (DONE), or update assignCoordinatesToCells. coordinatesToIndex won't work with odd numbers, either
        arrayOfValidCellsPerRow = findValidCellsPerRowForCanvas(canvasWidth, canvasHeight, false, true),
        cellsPerRow = arrayOfValidCellsPerRow[4], // Smaller is chunkier.
        //cellsPerRow = cellSizeToCellsPerRow(13),
        totalNumberOfCells = cellsPerRow * cellsPerRow * 0.75, // only works for 4:3 ratio
        cellsPerColumn = totalNumberOfCells / cellsPerRow;
if (drawingSettings.displayResolutionInformation) console.log('The current cells size is: ' + (canvasWidth / cellsPerRow));
if (drawingSettings.displayResolutionInformation) console.log('The curent number of cells per row (long dimension) is: ' + cellsPerRow);
makeCells(totalNumberOfCells, cellsPerRow, cells);
assignCoordinatesToCells(cells);
initializeCenterCells();
var SINE = 'sineWaveShape',
        TRI = 'triangularWaveShape',
        SQUARE = 'squareWaveShape',
        SAW = 'sawWaveShape',
        GAME_TYPE_ICARUS = 'icarusGameType',
        UP = 'up', // used for moving things around
        DOWN = 'down',
        LEFT = 'left',
        RIGHT = 'right',
        DOWN_LEFT = 'diagonalDownLeft',
        DOWN_RIGHT = 'diagonalDownRight',
        UP_LEFT = 'diagonalUpLeft',
        UP_RIGHT = 'diagonalUpRight',
        settings = {
                'oscillators': [],
                'entities': {
                        'lights': [],
                        'shadows': []
                },
                'minLights': 4, // min and max number of lights in the level/on the screen (depending on where development goes)
                'maxLights': 20,
                'gameType': GAME_TYPE_ICARUS
        },
        randomLightSettingsDefault = {
                'minBrightness': 64,
                'maxBrightness': 2000, // WHY DOESN'T 255 create white here?
                'minRadius': 30,
                'maxRadius': 100,
                'minDiffusion': cells[0].size,
                'maxDiffusion': cells[0].size * 13,
                'minDeathChance': 0.01, // chance that the light will be removed when it goes dark. 1 = will certainly die when it goes dark.
                'maxDeathChance': 0.025,
                'parentCellsArray': cells,
                'minCellIndex': 0,
                'maxCellIndex': totalNumberOfCells - 1
        },
        player = {
                'temperatureNoiseScale': 1,
                'centerXY': [canvasWidth * 0.5, canvasHeight * 0.5],
                'logPlayerTemperature': false,  // WRONG should probably just make a logging object with all the logging options in it
                'oscillator': null, // WRONG I'd rather just define these here, but I don't know how to reference player's properties from within itself (i.e. send a oscillator defined here to a light defined here). 'this.oscillator' didn't seem to work.
                'light': null,
                'temperature': 0.5,
                'intervalBetweenTemperatureUpdates': 200,
                'temperatureChangeRateScale': 0.0003
        };

makeRandomOscillators(10, 5000, 20000, settings.oscillators);
makeRandomLights(settings.minLights, randomLightSettingsDefault, settings.entities.lights, settings.oscillators);

// player light
// WRONG I'd like to just define these on the player object, but I can't get that to work.
// WRONG player light is centered on the upper right of the four center cells. I don't want to make four lights just to make it symmetrical
player.oscillator = makeOscillator(3000, 0, SINE, 'playerOscillator');
settings.oscillators.push(player.oscillator);
player.light = makeLight(1000, 10, [1, 1], player.oscillator, 10, 0, cells);
// WRONG TEMPORARY REMOVE this (temporary player temperature oscillator);
settings.oscillators.push(makeOscillator(10000, 0, SINE, 'temporaryPlayerTemperatureOscillator'));

function makeCells(numberOfCells, cellsPerRow, cellsList) {
        for (var i = 0; i < (numberOfCells / cellsPerRow); i++) {    //this should happen every time a row is complete
                for (var j = 0; j < cellsPerRow; j++) {     //this should create a single row
                        var newCell = {
                                'color': [0, 0, 0],  //should eventually be hex rgb
                                'size': 800 / cellsPerRow,              //size
                                'left': j * (800 / cellsPerRow),        //left edge coordinate
                                'top': (800 / cellsPerRow) * i,        //should be "size * ...rowCounter" but can't get it to work      //top edge coordinate
                                'centerXY': []
                        };
                        newCell.centerXY = [newCell.left + 0.5 * newCell.size, newCell.top + 0.5 * newCell.size];
                        cellsList.push(newCell);	//adding this cell to the list of all of the "geographical" cells in the level
                }
        }
}

function findValidCellsPerRowForCanvas(canvasWidth, canvasHeight, halfCellsOkTrueOrFalse, mustHaveEvenNumbersOfCellsInBothDimensionsTrueOrFalse) {
        var validNumbersOfCellsPerLongDimensionForLongDimension = [],
                validNumbersOfCellsPerLongDimensionForTotal = [],
                longDimension,
                shortDimension;
        if (canvasWidth > canvasHeight) {
                longDimension = canvasWidth;
                shortDimension = canvasHeight;
        } else {
                longDimension = canvasHeight;
                shortDimension = canvasWidth;
        }
        for (var i = 0; i < longDimension; i++) {
                if (longDimension % i === 0) validNumbersOfCellsPerLongDimensionForLongDimension.push(i);
        }
        if (!halfCellsOkTrueOrFalse) {
                for (var j = 0; j < validNumbersOfCellsPerLongDimensionForLongDimension.length; j++) {
                        if (shortDimension % (longDimension / validNumbersOfCellsPerLongDimensionForLongDimension[j]) === 0) { // i.e. 'longDimension / validNumbersOfCellsPerLongDimensionForLongDimension' = cell width
                                validNumbersOfCellsPerLongDimensionForTotal.push(validNumbersOfCellsPerLongDimensionForLongDimension[j]);
                        }
                }
        } else validNumbersOfCellsPerLongDimensionForTotal = validNumbersOfCellsPerLongDimensionForLongDimension;
        if (mustHaveEvenNumbersOfCellsInBothDimensionsTrueOrFalse) {
                var cellsPerRowThatCreatesEvenNumbersOfCellsInBothDimensions = [];
                for (var m = 0; m < validNumbersOfCellsPerLongDimensionForTotal.length; m++) {
                        var cellsNumber = validNumbersOfCellsPerLongDimensionForTotal;
                        if (cellsNumber[m] % 2 === 0 && (cellsNumber[m] * 0.75) % 2 === 0) { // i.e. 4:3 ratio
                                cellsPerRowThatCreatesEvenNumbersOfCellsInBothDimensions.push(cellsNumber[m]);
                        }
                }
                if (drawingSettings.displayResolutionInformation) console.log('The array of valid numbers of cells per row (per long dimension, actually) (for resolution selection) can be sent values 0-' + (cellsPerRowThatCreatesEvenNumbersOfCellsInBothDimensions.length - 1) + '.');
                // cell sizes per valid selection
                if (drawingSettings.displayResolutionInformation) console.log('Here are the cell sizes (in pixels) and cells per row (long dimension) associated with each index (array index: cell size, cells per row):');
                for (var n = 0; n < cellsPerRowThatCreatesEvenNumbersOfCellsInBothDimensions.length; n++) {
                        var cellSizeForEvenDimensions = longDimension / cellsPerRowThatCreatesEvenNumbersOfCellsInBothDimensions[n];
                        if (drawingSettings.displayResolutionInformation) console.log(n + ': ' + cellSizeForEvenDimensions + ', ' + cellsPerRowThatCreatesEvenNumbersOfCellsInBothDimensions[n]);
                }
                return cellsPerRowThatCreatesEvenNumbersOfCellsInBothDimensions;
        }
        if (drawingSettings.displayResolutionInformation) console.log('The array of valid numbers of cells per row (per long dimension, actually) (for resolution selection) can be sent values 0-' + (validNumbersOfCellsPerLongDimensionForTotal.length - 1) + '.');
        // cell sizes per valid selection
        if (drawingSettings.displayResolutionInformation) console.log('Here are the cell sizes (in pixels) and cells per row (long dimension) associated with each index (array index: cell size, cells per row):');
        for (var k = 0; k < validNumbersOfCellsPerLongDimensionForTotal.length; k++) {
                var cellSize = longDimension / validNumbersOfCellsPerLongDimensionForTotal[k];
                if (drawingSettings.displayResolutionInformation) console.log(k + ': ' + cellSize + ', ' + validNumbersOfCellsPerLongDimensionForTotal[k]);
        }
        return validNumbersOfCellsPerLongDimensionForTotal;
}

// never used this but probably worth keeping?
function reverseOrderOfArray(array) {
        if (!array.length) {
                console.log('reverseOrderOfArray function was sent an empty or invalid array as an argument.');
                return null;
        }
        var reversedArray = [];
        for (var i = (array.length - 1); i >= 0; i--) {
                reversedArray.push(array[i]);
        }
        return array;
}

function randomNumberBetweenNumbers(minPossibleNumber, maxPossibleNumber, roundOrDontRoundTrueOrFalse) {
        var newRandomNumber = minPossibleNumber + Math.random() * (maxPossibleNumber - minPossibleNumber);
        if (roundOrDontRoundTrueOrFalse === true) return Math.round(newRandomNumber);
        if (roundOrDontRoundTrueOrFalse === false) return newRandomNumber;
}


function cellSizeToCellsPerRow(cellSize) {
        var newCellsPerRow = Math.floor(canvasWidth / cellSize);
        return newCellsPerRow;
}

function assignCoordinatesToCells(allCellsArray) {
        // 0, 0 is the center of the screen, but no cell has that coordinate (the cells in the rows and columns need to be even numbers, for now)
        // this assigns coordinates to the cells in the main cell array so that they're (vastly) easier to work with.
        if (cellsPerRow % 2 === 0 && cellsPerColumn % 2 === 0) {
                for (var i = 0; i < allCellsArray.length; i++) {
                        var cell = allCellsArray[i],
                                coordinates = [];
                        if (i % cellsPerRow >= 0.5 * cellsPerRow) coordinates[0] = (i % cellsPerRow) - (0.5 * cellsPerRow) + 1; // if cell is in the RIGHT HALF of the screen
                        else coordinates[0] = -((0.5 * cellsPerRow) - (i % cellsPerRow)); // if cell is in the LEFT HALF of the screen
                        if (i < 0.5 * totalNumberOfCells) coordinates[1] = (0.5 * cellsPerColumn) - (Math.floor(i / cellsPerRow));// if cell is in the TOP HALF of the screen
                        else coordinates[1] = -(Math.floor(i / cellsPerRow) - (0.5 * cellsPerColumn) + 1);// if cell is in the BOTTOM HALF of the screen
                        cell.coordinates = coordinates;
                }
        } else {
                console.log('assignCoordinatesToCells function failed. The canvas has an odd number of cells in at least one dimension.');
                return;
        }
}

function coordinatesToIndex(XYArrayOfCoordinates) {
        var x = XYArrayOfCoordinates[0],
                y = XYArrayOfCoordinates[1],
                index;
        if (x > 0) index = x + cellsPerRow * 0.5 - 1;
        else index = x + cellsPerRow * 0.5;
        if (y > 0) index += cellsPerRow * (cellsPerColumn * 0.5 - y);
        else index += cellsPerRow * (cellsPerColumn * 0.5 - y - 1);
        if (index > totalNumberOfCells - 1) {
                console.log('The function "coordinatesToIndex" returned an invalid index: ' + index);
                return;
        }
        return index;
}

function initializeCenterCells() {
        for (var i = 0; i < cells.length; i++) {
                distanceFromCenter = findDistanceBetweenPoints([canvasWidth * 0.5, canvasHeight * 0.5], cells[i].centerXY);
                if (distanceFromCenter <= interfaceSettings.centerCellsRadius) interfaceSettings.centerCells.push(cells[i]);
        }
}

//FROM CHRIS
//this is from Chris and he adapted it from an online source. I have no idea how it works.
//It can be used for debugging (through viewing a serialized version of) objects that contain circular references.
function serialize(data) {
    var seenObjects = [];
    return JSON.stringify(data, function(key, value) {
        if (typeof value === 'object' && value !== null) {
            // Check if we've already seen this object before.
            var oldIndex = seenObjects.indexOf(value);
            if (oldIndex !== -1) {
                // Show an indicator that this object was serialized.
                return '[object ' + oldIndex +']';
            }
            // Record that this value has been serialized already.
            seenObjects.push(value);
        }
        return value;
    });
}