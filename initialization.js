//this block of code, immedialtely before "mainLoop" could all be inside a function called "initialization" or something
//makeCells(numberOfCells, cellsPerRow, cellsList, oscsPerCell, periodMin, periodMax, maxColor, phase, neighborScaling)
//"neighborScaling" is how much the state of a cell is influenced by the oscillators of its neighbors; where 1 is equally to its own oscillators, and 0.5 is half as much as its own.

//GLOBAL VARS. Should there be no global vars? If so, figure out where all these should go.
var cells = [],
modifierCells = [],
DAMPER = 'damperTypeModifierCell',
EMITTER = 'emitterTypeModifierCell',
buttonsGridQWERTY = [Q = 81, W = 87, E = 69, R = 82, A = 65, S = 83, D = 68, F = 70, Z = 90, X = 88, C = 67, V = 86],
BUTTON_SPACE = 32,
frameCounter = 0,
// oscillator wave shapes
SINE = 'sineWaveShape',
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
settings = {'oscillators': [], 'entities': {'lights': [], 'shadows': []}};

settings.oscillators.push(makeOscillator(5000, 0, SINE, 'firstTestOscillator'));


var cellsPerRow = 80,
        totalNumberOfCells = cellsPerRow * cellsPerRow * 0.75,
        cellsPerColumn = totalNumberOfCells / cellsPerRow,
        minCycleLength = 32000,          // ms lowest possible cell oscillation cycle length
        maxCycleLengthRatio = 2,
        maxCycleLength = minCycleLength * maxCycleLengthRatio;        // max possible cycle length is minCycleLenght times this number
makeCells(totalNumberOfCells, cellsPerRow, cells, minCycleLength, maxCycleLength);
findNeighbors(cells, cellsPerRow);
blendCycleLengths(cells);

settings.entities.lights.push(makeLight(255, 50, 1700, settings.oscillators[0], cells));

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

function assignInitialModifierCells(
        allCellsList,
        numberOfEmitters,
        minEmitterRadius,
        maxEmitterRadius,
        minEmitterIntensity,
        maxEmitterIntensity,
        minEmitterBirthDuration,
        maxEmitterBirthDuration,
        minEmitterLifeDuration,
        maxEmitterLifeDuration,
        minEmitterDeathDuration,
        maxEmitterDeathDuration,
        numberOfDampers,
        minDamperRadius,
        maxDamperRadius,
        minDamperIntensity,
        maxDamperIntensity,
        minDamperBirthDuration,
        maxDamperBirthDuration,
        minDamperLifeDuration,
        maxDamperLifeDuration,
        minDamperDeathDuration,
        maxDamperDeathDuration) {
        for (var i = 0; i < numberOfEmitters; i++) {
                assignEmitter(allCellsList,
                        minEmitterRadius,
                        maxEmitterRadius,
                        minEmitterIntensity,
                        maxEmitterIntensity,
                        minEmitterBirthDuration,
                        maxEmitterBirthDuration,
                        minEmitterLifeDuration,
                        maxEmitterLifeDuration,
                        minEmitterDeathDuration,
                        maxEmitterDeathDuration
                );
        }
        for (var j = 0; j < numberOfDampers; j++) {
                assignDamper(allCellsList,
                        minDamperRadius,
                        maxDamperRadius,
                        minDamperIntensity,
                        maxDamperIntensity,
                        minDamperBirthDuration,
                        maxDamperBirthDuration,
                        minDamperLifeDuration,
                        maxDamperLifeDuration,
                        minDamperDeathDuration,
                        maxDamperDeathDuration
                );             
        }
}

function assignEmitter(allCellsList, minRadius, maxRadius, minIntensity, maxIntensity, minBirthDuration, maxBirthDuration, minLifeDuration, maxLifeDuration, minDeathDuration, maxDeathDuration) {
        var randomIndex = randomNumberBetweenNumbers(0, (allCellsList.length - 1), true),
                randomRadius = randomNumberBetweenNumbers(minRadius, maxRadius , true),
                randomIntensity = randomNumberBetweenNumbers(minIntensity, maxIntensity, true),
                randomBirthDuration = randomNumberBetweenNumbers(minBirthDuration, maxBirthDuration, true),
                randomLifeDuration = randomNumberBetweenNumbers(minLifeDuration, maxLifeDuration, true),
                randomDeathDuration = randomNumberBetweenNumbers(minDeathDuration, maxDeathDuration, true);
        // if this cell is current in the modifierCells array, pick a new random cell to turn into a damper
        if (modifierCells.indexOf(allCellsList[randomIndex]) !== -1) randomDamperIndex = randomNumberBetweenNumbers(0, (allCellsList.length - 1), true);
        // if it's not, make it a modifier cell
        else {
                var emitter = allCellsList[randomIndex];
                emitter.modifierType = EMITTER;
                emitter.radius = randomRadius;
                emitter.maxRadius = randomRadius;
                emitter.intensity = randomIntensity;
                emitter.maxIntensity = randomIntensity;
                // life stage changes are predetermined so that they can be passed on when a neighbor 'become' the cell as it moves.
                emitter.createdAt = Date.now();
                emitter.beingBornUntil = Date.now() + randomBirthDuration;
                emitter.notDyingUntil = emitter.beingBornUntil + randomLifeDuration;
                emitter.notDeadUntil = emitter.notDyingUntil + randomDeathDuration;
                modifierCells.push(emitter);
        }
}

function assignDamper(allCellsList, minRadius, maxRadius, minIntensity, maxIntensity, minBirthDuration, maxBirthDuration, minLifeDuration, maxLifeDuration, minDeathDuration, maxDeathDuration) {
        var randomIndex = randomNumberBetweenNumbers(0, (allCellsList.length - 1), true),
                randomRadius = randomNumberBetweenNumbers(minRadius, maxRadius , true),
                randomIntensity = randomNumberBetweenNumbers(minIntensity, maxIntensity, true),
                randomBirthDuration = randomNumberBetweenNumbers(minBirthDuration, maxBirthDuration, true),
                randomLifeDuration = randomNumberBetweenNumbers(minLifeDuration, maxLifeDuration, true),
                randomDeathDuration = randomNumberBetweenNumbers(minDeathDuration, maxDeathDuration, true);
        // if this cell is current in the modifierCells array, pick a new random cell to turn into a damper
        if (modifierCells.indexOf(allCellsList[randomIndex]) !== -1) randomDamperIndex = randomNumberBetweenNumbers(0, (allCellsList.length - 1), true);
        // if it's not, make it a modifier cell
        else {
                var damper = allCellsList[randomIndex];
                damper.modifierType = DAMPER;
                damper.radius = randomRadius;
                damper.maxRadius = randomRadius;
                damper.intensity = randomIntensity;
                damper.maxIntensity = randomIntensity;
                // life stage changes are predetermined so that they can be passed on when a neighbor 'become' the cell as it moves.
                damper.createdAt = Date.now();
                damper.beingBornUntil = Date.now() + randomBirthDuration;
                damper.notDyingUntil = damper.beingBornUntil + randomLifeDuration;
                damper.notDeadUntil = damper.notDyingUntil + randomDeathDuration;
                modifierCells.push(damper);
        }
}


////////////////////
//CELLS
////////////////////

//CELLS
//Eventually I'll want cells to be able to retain (with various decay/damping characteristics) oscillations that were imparted
//to them by active oscillators.

function makeCells(numberOfCells, cellsPerRow, cellsList, minCycleLength, maxCycleLength) {
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
                                'minCycleLength': minCycleLength,
                                'maxCycleLength': maxCycleLength,
                                'cycleLength': null,
                                'centerXY': []
                        };
                        newCell.cycleLength = newCell.minCycleLength + (Math.random() * (newCell.maxCycleLength - newCell.minCycleLength));
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


////////////////////////
//MISC
////////////////////////

// OLD
function randomNumber(minPossibleNumber, maxPossibleNumber) {
        var newRandomNumber = Math.round(minPossibleNumber + (Math.random() * ((maxPossibleNumber - 1) - minPossibleNumber)));
        return newRandomNumber;
}

// NEW
function randomNumberBetweenNumbers(minPossibleNumber, maxPossibleNumber, roundOrDontRoundTrueOrFalse) {
        var newRandomNumber = minPossibleNumber + Math.random() * (maxPossibleNumber - minPossibleNumber);
        if (roundOrDontRoundTrueOrFalse === true) return Math.round(newRandomNumber);
        if (roundOrDontRoundTrueOrFalse === false) return newRandomNumber;
}


function selectRandomNonHomeCell(cellsList) {
        var randomCellIndex = Math.round(randomNumber(0, cellsList.length));
        for (var i = 0; i < cellsList.length; i++) {
                if (cellsList[randomCellIndex].flags[1] !== true) {
                        return cellsList[randomCellIndex];
                } else {
                        randomCellIndex = Math.round(randomNumber(0, cellsList.length));
                }
        }
}

function countFPS() {   //have to turn on time stamps in Chrome inspector for this to work (options menu in upper right of inspect-->console)
    if (frameCounter % 300 === 0) {
        
        //console.log('Frame: ' + (frameCounter + 1));  //should be ten seconds apart at 30fps
    }
    frameCounter++;
}

//FROM STACK OVERFLOW.COM for counteing fps
var lastCalledTime;
var fps;

function requestAnimFrame() {

  if(!lastCalledTime) {
     lastCalledTime = Date.now();
     fps = 0;
     return;
  }
  delta = (Date.now() - lastCalledTime)/1000;
  lastCalledTime = Date.now();
  fps = 1/delta;
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