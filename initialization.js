var cells = [],
        resolutionFactor = 4,
        canvasWidth = 800,
        canvasHeight = 600,
        GAME_TYPE_ICARUS = 'icarusGameType',
        settings = {
                'oscillators': [],
                'entities': {
                        'lights': [],
                        'rectangles': []
                },
                'minLights': 8, // min and max number of lights in the level/on the screen (depending on where development goes)
                'maxLights': 20,
                'gameType': GAME_TYPE_ICARUS,
                'gameStartTime': Date.now(),
                'icarusLightMovementSpeedScale': 0.25 // smaller is faster, i.e. time between movements is multiplied by this
        },
        player = {
                'temperatureNoiseScale': 0.67, // scales how much the global noise level is affected by player temperature
                'centerXY': [canvasWidth * 0.5, canvasHeight * 0.5],
                'logPlayerTemperature': false,  // WRONG should probably just make a logging object with all the logging options in it
                'oscillator': null, // WRONG I'd rather just define these here, but I don't know how to reference player's properties from within itself (i.e. send a oscillator defined here to a light defined here). 'this.oscillator' didn't seem to work.
                'light': null,
                'temperature': 0.5,
                'intervalBetweenTemperatureUpdates': 200,
                'health': 100,
                'maxHealth': 100,
                'intervalBetweenHealthUpdates': 133, // number of ms between possible health losses
                'displayHealth': false, // logs in the console
                'emergencyPushBackCooldown': 10000,
                'emergencyPushBackDuration': 3500,
                'damageWarningDuration': 350,
                'damageOscillator': makeOscillator(150, 0, SINE, 'playerDamageOscillator'),
                'regenerateHealth': true,
                'healthRegenerationAmount': 1,  // regenerate this amount of health
                'healthRegenerationInterval': 1000,      // every this many milliseconds. Don't it too small (i.e. <200ms) because there's a little cooldown (150ms) to make sure you don't accidentally get two health bumps in one iteration. You can always just give more health at longer intervals.
                'temperatureChangeRateScale': 0.01, // affect how quickly the player gains and loses temperature based on center-screen brightnesspl
                'coolingScale': 1, // scale the rate at which you heat and cool for balancing purposes (or for special effects)
                'heatingScale': 1,
                // WRONG so stupid that I can't just have a 'damageZoneWidth' property and base the cold and heat
                //      damage thresholds off of it, but "this.etc" doesn't seem to work in objects. : /
                'coldDamageThreshold': 0.33, // when player temperature falls below this, receive damage
                'heatDamageThreshold': 0.67 // when player temperature rises above this, receive damage
        },
        randomLightSettingsDefault = {
                'minBrightness': 64,
                'maxBrightness': 2000, // WHY DOESN'T 255 create white here?
                'minRadius': 30,
                'maxRadius': 200,
                'minDiffusion': 10, // in pixels
                'maxDiffusion': 60,
                'minDeathChance': 0.01, // chance that the light will be removed when it goes dark. 1 = will certainly die when it goes dark.
                'maxDeathChance': 0.025,
                'parentCellsArray': cells,
                'minMsBetweenMovements': 50,
                'maxMsBetweenMovements': 1500
        };
        
// WARNING: setPreferences() SHOULDN'T BE MOVED FROM BETWEEN THESE SETS OF VARS!!!
function setPreferences() {
        // GRAPHICS
        // log framerate in console
        drawingSettings.fpsDisplay.displayFps = true;
        drawingSettings.fpsDisplay.fpsDisplayInterval = 3000;      // display it this frequently (in ms)
        drawingSettings.fpsDisplay.fpsDisplayIntervalLongTerm = 100000;     // and this frequently (for a short-term gist and a long-term average)
        // resolution. Currently, 0-7 are valid values. Smaller is chunkier.
        resolutionFactor = 4; //Leaps in resolution are pretty big for now due to some current constraints on valid widths and heights.
        // add color noise to the screen
        drawingSettings.noise.addNoise = true;
        // log resolution information in the console once at the beginning of running the program
        drawingSettings.displayResolutionInformation = false;
        // set limit on range of lights
        drawingSettings.numberOfRadiiBeforeLightsHaveNoEffect = 10000;
        // show HUD
        HUDSettings.displayHUD = false;
        // If 'true', draws the game as shades of grey or rainbow.
        drawingSettings.greyscaleToSpectrum = false;
        // draw screen. Turn off to look at errors without the screen being drawn slowing things down
        drawingSettings.drawScreen = true;
        
        // GAMEPLAY INTERFACE (except for HUD)
        // show health in the console. Useful if HUD is off.
        player.displayHealth = true; // happens whenever your health changes if your health becomes a multiple of 5
        // show temperature in console.
        player.logPlayerTemperature = false;
        player.intervalBetweenTemperatureUpdates = 500; // ms between logged temperature updates
        
        // GAMEPLAY
        // health regen per second (max health is 100)
        player.healthRegenerationAmount = 1;
        // how quickly the player gains and dissipates heat
        player.temperatureChangeRateScale = 0.0045;
        // how quickly the player cools and heats, specifically
        player.heatingScale = 1;
        player.coolingScale = 1;
        // how cold or hot the player has to get before taking damage (0-1);
        player.heatDamageThreshold = 0.85;
        player.coldDamageThreshold = 0.43;
        // how many ms between player movements if you hold a key down and the framerate allows
        interfaceSettings.moveRepeatDelay = 25;
        // minimum and maximum number of lights on the map at any one time
        settings.minLights = 12;
        settings.maxLights = 25;
        // lights parameter ranges
        randomLightSettingsDefault.minBrightness = 64;
        randomLightSettingsDefault.maxBrightness = 1200;
        randomLightSettingsDefault.minRadius = 80;
        randomLightSettingsDefault.maxRadius = 175;
        // how fast the lights chase and flee from you in the Icarus game type. Smaller is fast.
        settings.icarusLightMovementSpeedScale = 0.25;
}

// WARNING setPrefences NEEDS TO BE CALLED HERE, before the following declarations of vars.
setPreferences();

var //current coordinate system needs even number of cells in rows and columns. Either update findValidCellsPerRowForCanvas so that an option is to lock it even numbers in both directions (DONE), or update assignCoordinatesToCells. coordinatesToIndex won't work with odd numbers, either
        arrayOfValidCellsPerRow = findValidCellsPerRowForCanvas(canvasWidth, canvasHeight, false, true),
        cellsPerRow = arrayOfValidCellsPerRow[resolutionFactor], // Smaller is chunkier.
        //cellsPerRow = cellSizeToCellsPerRow(13),
        totalNumberOfCells = cellsPerRow * cellsPerRow * 0.75, // only works for 4:3 ratio
        cellsPerColumn = totalNumberOfCells / cellsPerRow,
        cellSize = canvasWidth / cellsPerRow;
if (drawingSettings.displayResolutionInformation) console.log('The current cells size is: ' + (canvasWidth / cellsPerRow));
if (drawingSettings.displayResolutionInformation) console.log('The curent number of cells per row (long dimension) is: ' + cellsPerRow);
makeCells(totalNumberOfCells, cellsPerRow, cells);
assignCoordinatesToCells(cells);

// WRONG doesn't work
//assignDistanceLookupTables();
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
        allDirections = [],
        deathAphorisms = [],
        excludedNamesFromRandomOscillatorSelection = [
                'playerDamageOscillator'
        ];
        
settings.oscillators.push(player.damageOscillator);
makeRandomOscillators(10, 5000, 20000, settings.oscillators);
makeRandomLights(settings.minLights, randomLightSettingsDefault, settings.entities.lights, settings.oscillators);
assignDistanceLookupTables();
initializeCenterCells();
initializeAllDirections();
initializeDeathAphorisms();

function initializeDeathAphorisms() {
        deathAphorisms.push(
                'Every ending is a new beginning.',
                'Death is only part of the journey.',
                'Death is the greatest adventure.',
                'Without death, can life really be meaningful?',
                'Today is a good day to die. - Chief Crazy Horse',
                'If life is only a dream, perhaps death is waking up.',
                'Farewell, mortal coil!',
                'Game over, man!'
        );
}

function assignDistanceLookupTables() {
        for (var i = 0; i < cells.length; i++) {
                var cell = cells[i];
                cell.distanceToIndex = [];
                for (var j = 0; j < cells.length; j++) {
                        distantCell = cells[j];
                        cell.distanceToIndex[j] = findDistanceBetweenPoints(cell.centerXY, distantCell.centerXY);
                }
        }
}

function initializeAllDirections() {
        allDirections.push(UP, DOWN, LEFT, RIGHT, UP_LEFT, UP_RIGHT, DOWN_LEFT, DOWN_RIGHT);
}

function makeCells(numberOfCells, cellsPerRow, cellsList) {
        var indexCounter = -1;
        for (var i = 0; i < (numberOfCells / cellsPerRow); i++) {    //this should happen every time a row is complete
                for (var j = 0; j < cellsPerRow; j++) {     //this should create a single row
                        indexCounter++;
                        var newCell = {
                                'color': [0, 0, 0],  //should eventually be hex rgb
                                'size': 800 / cellsPerRow,              //size
                                'left': j * (800 / cellsPerRow),        //left edge coordinate
                                'top': (800 / cellsPerRow) * i,        //should be "size * ...rowCounter" but can't get it to work      //top edge coordinate
                                'centerXY': [],
                                'index': indexCounter
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
        // looking at all cells
        for (var i = 0; i < cells.length; i++) {
                // finding their distance from center screen
                distanceFromCenter = findDistanceBetweenPoints([canvasWidth * 0.5, canvasHeight * 0.5], cells[i].centerXY);
                // if that distance is inside the radius defined for center cells
                if (distanceFromCenter <= interfaceSettings.centerCellsRadiusInPixels) {
                        interfaceSettings.centerCells.push(cells[i]);
                        cells[i].centerCellParametricLocationOnCenterCellsRadius = distanceFromCenter / interfaceSettings.centerCellsRadiusInPixels;
                }
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