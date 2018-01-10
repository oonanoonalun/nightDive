var cells = [],
        canvasWidth = 800,
        canvasHeight = 600,
        arrayOfValidCellsPerRow = findValidCellsPerRowForCanvas(canvasWidth, canvasHeight, true),
        cellsPerRow = arrayOfValidCellsPerRow[12],  // 0-10 valid if last argument to findValid... is 'true,' 0-16 if 'false.' Smaller is chunkier. You can put any number here instead of the array items, but there might be some weird artifacts that show up.
        //cellsPerRow = cellSizeToCellsPerRow(13),
        totalNumberOfCells = cellsPerRow * cellsPerRow * 0.75,
        cellsPerColumn = totalNumberOfCells / cellsPerRow;
console.log('The current cells size is: ' + (canvasWidth / cellsPerRow));
console.log('The curent number of cells per row (long dimension) is: ' + cellsPerRow);
makeCells(totalNumberOfCells, cellsPerRow, cells);
findNeighbors(cells, cellsPerRow);


var SINE = 'sineWaveShape',
        TRI = 'triangularWaveShape',
        SQUARE = 'squareWaveShape',
        SAW = 'sawWaveShape',
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
                'noiseColorBase': []
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
        drawingSettings = {
                'fpsDisplay': {
                        'frameCounter': 0,
                        'fpsDisplayInterval': 2000,
                        'displayFps': true,
                        'framesSinceLastDisplay': 0
                },
                'addNoise': true
        };

//settings.oscillators.push(makeOscillator(5000, 0, SINE, 'firstTestOscillator'));
makeRandomOscillators(10, 5000, 20000, settings.oscillators);
makeRandomLights(settings.minLights, randomLightSettingsDefault, settings.entities.lights, settings.oscillators);
makePlayerLight(800, 5, 00, cells);

initializeReticle();

//these sets of numberOfCells and cellsPerRow work for our 800 x 600 canvas (double the number of cells pers row = 4x the number of cells overall):
//300, 20
//768, 32
//1200, 40
//3072, 64
//4800, 80      //this seems to reduce the framerate significantly, even with just one native oscillator per cell. Is there a way to optimize so that this works?
//12288, 128
//19200, 160
//49152, 256    // with new system, this tanks the framerate
//modifyCells(cells);

//makeHomeOscillators(homeOscillators, 2, 40, 40, [255, 192, 127], [255, 192, 127], 1);
//homeCell = findInitialHomeCell(cells);


//sortCellsIntoRows(cells);
//sortCellsIntoColumns(cells);

////////////////////
//CELLS
////////////////////

//CELLS
//Eventually I'll want cells to be able to retain (with various decay/damping characteristics) oscillations that were imparted
//to them by active oscillators.

function makeCells(numberOfCells, cellsPerRow, cellsList) {
        for (var i = 0; i < (numberOfCells / cellsPerRow); i++) {    //this should happen every time a row is complete
                for (var j = 0; j < cellsPerRow; j++) {     //this should create a single row
                        var newCell = {
                                'color': [],  //should be hex rgb
                                'size': 800 / cellsPerRow,              //size
                                'left': j * (800 / cellsPerRow),        //left edge coordinate
                                'top': (800 / cellsPerRow) * i,        //should be "size * ...rowCounter" but can't get it to work      //top edge coordinate
                                'neighbors': [],        //which cells neighbor this cell, sharing influence of its color with its internal oscillators
                                'neighborDown': null,	//neighbor cell below current cell
                                'neighborUp': null,		//neighbor cell above current cell
                                'neighborRight': null,	//etc.
                                'neighborLeft': null,
                                'neighborDownRight': null,
                                'neighborDownLeft': null,
                                'neighborUpRight': null,
                                'neighborUpLeft': null,
                                'centerXY': []
                        };
                        newCell.centerXY = [newCell.left + 0.5 * newCell.size, newCell.top + 0.5 * newCell.size];
                        cellsList.push(newCell);	//adding this cell to the list of all of the "geographical" cells in the level
                }
        }
}


function findNeighbors(cellsList, cellsPerRow) {
		//finds all the neighbors of a cell and fills in the cell's neighbors list and individual neighbors
		//maybe don't need the "sortCellsIntoRows/Columns" functions? But maybe is simpler, in the end, that way...
        cellsPerColumn = Math.round(cellsList.length / cellsPerRow);
        rows = sortCellsIntoRows(cellsList, cellsPerRow, cellsPerColumn);
        columns = sortCellsIntoColumns(cellsList, cellsPerRow, cellsPerColumn);
        //assigning the cells below and above a cell as its neighbors
        for (var a = 0; a < (cellsPerColumn - 1); a++) {         //all rows but the last one
                for (var b = 0; b < cellsPerRow; b++) {         //each cell in a row
                        rows[a][b].neighbors.push(rows[a + 1][b]);        //assigning the cell directly below a cell as its neighbor
                        rows[a][b].neighborDown = rows[a + 1][b];
                }
        }
        for (var c = 1; c < cellsPerColumn; c++){         //all rows but the first one
                for (var d = 0; d < cellsPerRow; d++) {         //each cell in a row
                        rows[c][d].neighbors.push(rows[c - 1][d]);        //assigning the cell directly above a cell as its neighbor
                        rows[c][d].neighborUp = rows[c - 1][d];                
                }
        }
        //assigning the cells to the right and left of a cell as its neighbors
        for (var e = 0; e < (cellsPerRow - 1); e++){         //all columns but the last one
                for (var f = 0; f < cellsPerColumn; f++) {      //each cell in a column
                        columns[e][f].neighbors.push(columns[e + 1][f]);        //assigning the cell directly to the right of a cell as its neighbor
                        columns[e][f].neighborRight = columns[e + 1][f];
                }
        }
        for (var g = 1; g < cellsPerRow; g++){         //all columns but the first one
                for (var h = 0; h < cellsPerColumn; h++) {      //each cell in a column
                        columns[g][h].neighbors.push(columns[g - 1][h]);        //assigning the cell directly to the left of a cell as its neighbor
                        columns[g][h].neighborLeft = columns[g - 1][h];
                }
        }
        //assigning the cells to the lower-right and lower-left of a cell as its neighbors
        for (var i = 0; i < (cellsPerRow - 1); i++) {         //all columns but the last one
                for (var j = 0; j < (cellsPerColumn - 1); j++) {      //each cell in a column except the last one
                        columns[i][j].neighbors.push(columns[i + 1][j + 1]);        //assigning the cell to the lower-right of a cell as its neighbor
                        columns[i][j].neighborDownRight = columns[i + 1][j + 1];
                }
        }
        for (var k = 1; k < cellsPerRow; k++) {         //all columns but the first one
                for (var l = 0; l < (cellsPerColumn - 1); l++) {      //each cell in a column except the last one
                        columns[k][l].neighbors.push(columns[k - 1][l + 1]);        //assigning the cell to the lower-left of a cell as its neighbor
                        columns[k][l].neighborDownLeft = columns[k - 1][l + 1];
                }
        }        
        //assigning the cells to the upper-right and upper-left of a cell as its neighbors
        for (var m = 0; m < (cellsPerRow - 1); m++) {         //all columns but the last one
                for (var n = 1; n < cellsPerColumn; n++) {      //each cell in a column except the first one
                        columns[m][n].neighbors.push(columns[m + 1][n - 1]);        //assigning the cell to the upper-right of a cell as its neighbor
                        columns[m][n].neighborUpRight = columns[m + 1][n - 1];
                }
        }
        for (var o = 1; o < cellsPerRow; o++) {         //all columns but the first one
                for (var p = 1; p < cellsPerColumn; p++) {      //each cell in a column except the first one
                        columns[o][p].neighbors.push(columns[o - 1][p - 1]);        //assigning the cell directly to the upper-left of a cell as its neighbor
                        columns[o][p].neighborUpLeft = columns[o - 1][p - 1];
                }
        }        
}


function sortCellsIntoRows(cellsList, cellsPerRow, cellsPerColumn) {
        var rows = [];
        for (var i = 0; i < cellsPerColumn; i++) {
            var newRow = [];
            for (var j = 0; j < cellsPerRow; j++) {
                newRow.push(cellsList[j + (i * cellsPerRow)]);
            }
            rows.push(newRow);
        }
        return rows;
}

function sortCellsIntoColumns(cellsList, cellsPerRow, cellsPerColumn) {
        var columns = [];
        for (var i = 0; i < cellsPerRow; i++) {
            var newColumn = [];
            for (var j = 0; j < cellsPerColumn; j++) {
                newColumn.push(cellsList[(j * cellsPerRow) + i]);
            }
            columns.push(newColumn);
        }
        return columns;
}

function findValidCellsPerRowForCanvas(canvasWidth, canvasHeight, halfCellsOkTrueOrFalse) {
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
        console.log('The array of valid numbers of cells per row (per long dimension, actually) (for resolution selection) can be sent values 0-' + (validNumbersOfCellsPerLongDimensionForTotal.length - 1) + '.');
        // cell sizes per valid selection
        console.log('Here are the cell sizes (in pixels) and cells per row (long dimension) associated with each index (array index: cell size, cells per row):');
        for (var k = 0; k < validNumbersOfCellsPerLongDimensionForTotal.length; k++) {
                var cellSize = longDimension / validNumbersOfCellsPerLongDimensionForTotal[k];
                console.log(k + ': ' + cellSize + ', ' + validNumbersOfCellsPerLongDimensionForTotal[k]);
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

////////////////////////
//MISC
////////////////////////

function randomNumberBetweenNumbers(minPossibleNumber, maxPossibleNumber, roundOrDontRoundTrueOrFalse) {
        var newRandomNumber = minPossibleNumber + Math.random() * (maxPossibleNumber - minPossibleNumber);
        if (roundOrDontRoundTrueOrFalse === true) return Math.round(newRandomNumber);
        if (roundOrDontRoundTrueOrFalse === false) return newRandomNumber;
}


function cellSizeToCellsPerRow(cellSize) {
        var newCellsPerRow = Math.floor(canvasWidth / cellSize);
        return newCellsPerRow;
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