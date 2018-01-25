var cells = [],
        resolutionFactor = 4,
        canvasWidth = 800,
        canvasHeight = 600,
        settings = {
                'oscillators': [],
                'entities': {
                        'lights': [],
                        'shadows': [],
                        'lightLines': [],
                        'length': 3 // ok, this means that I can check the length of this just like I could an arary, but I have to UPDATE IT MANUALLY! if I add more entity types with their own arrays
                },
                'minLights': 8, // min and max number of lights in the level/on the screen (depending on where development goes)
                'maxLights': 20,
                'lightPersonalities': [],
                'globalLightPersonality': {},
                'gameStartTime': Date.now(), // WRONG: this is going to pick up some early game time when things are still initializing and the screen is black.
                'reserveOfRandomLights': [],
                'game': {
                        'ambientTemperature': {
                            'current': 0.5,
                            'scale': 10, // Doesn't scale ambient temp, but scales its effect on player temp. If ambTemp is over 0.5, it's multiplied by this. Under, it's divided by this. Other temps are then multiplid by amb temp.
                            'min': 0.25, // keeps other factors from making the ambient temperature too hot or too cold
                            'max': 0.75,
                            'intervalBetweenUpdates': 20, // frames between updates
                            'log': false,
                            'settings.game.ambientTemperature.scale': 1 // how strongly the ambient temperature affects screen brightness
                        },
                        'diurnal': {
                            'on': true, // diurnal cycle will play out
                            'duration': 900, // length of day, midnight to midnight. 3600 is two minutes at 30fps
                            'dayCounter': 0,
                            'logTimeOfDay': false,
                            'clockColor': [0, 0, 255], // starting color at midnight. Putting this here just to make sure there's an initial value before the update code kicks in.
                            'logDayCounter': false
                        },
                        'slipperySlope': {
                                'on': false, // Whether the behavior is active or not. Cycling turns this on and off automatically at intervals.
                                'cycle': false, // turns itself on and off at intervals
                                'framesOn': 150, // when cycling, for how many frames will it be on?
                                'framesOff': 300, // when cycling, for how many frames will it be off?
                                'notOnUntil': 0, // Cycling starts when the frameCounter reaches this initial value, then this property is used by the cycling process
                                'notOffUntil': null
                        },
                        'race': {
                                'on': false,
                                'cycle': false,
                                'framesOn': 90,
                                'framesOff': 300,
                                'notOnUntil': 0,
                                'notOffUntil': null
                        },
                        'individualPersonalities': {
                                'on': false,
                                'cycle': false,
                                'framesOn': 150,
                                'framesOff': 150,
                                'notOnUntil': 0,
                                'notOffUntil': null
                        }
                }
        },
        player = {
                'temperatureNoiseScale': 0.67, // scales how much the global noise level is affected by player temperature
                'centerXY': [canvasWidth * 0.5, canvasHeight * 0.5],
                'logPlayerTemperature': false,  // WRONG should probably just make a logging object with all the logging options in it
                'oscillator': null, // WRONG I'd rather just define these here, but I don't know how to reference player's properties from within itself (i.e. send a oscillator defined here to a light defined here). 'this.oscillator' didn't seem to work.
                'light': null,
                'temperature': 0.5,
                'intervalBetweenTemperatureUpdates': 6, // frames
                'health': 100,
                'maxHealth': 100,
                'intervalBetweenHealthUpdates': 5, // number of frames between possible health losses (or gains? no sure how regen is written)
                'displayHealth': false, // logs in the console
                'emergencyPushBackCooldown': 45,
                'emergencyPushBackDuration': 105,
                'damageWarningDuration': 10, // number of frames after damage has occurred while player is still warned about it (i.e. flashing health bar)
                'damageOscillator': makeOscillator(10, 0, SINE, 'playerDamageOscillator'),
                'regenerateHealth': true,
                'healthRegenerationAmount': 1,  // regenerate this amount of health
                'healthRegenerationInterval': 30,      // every this many frames, player health increases by player.healthRegenerationAmount
                'temperatureChangeRateScale': 0.0005, // affect how quickly the player gains and loses temperature based on center-screen brightnesspl
                'temperatureChangeRateFrameCounterScale': 0.0000005, // this is how much the frame counter value affects the speed at which the player gains and loses heat
                'coolingScale': 1, // not being used // scale the rate at which you heat and cool for balancing purposes (or for special effects)
                'heatingScale': 1, // not being used
                // WRONG so stupid that I can't just have a 'damageZoneWidth' property and base the cold and heat
                //      damage thresholds off of it, but "this.etc" doesn't seem to work in objects. : /
                'coldDamageThreshold': 0.33, // when player temperature falls below this, receive damage
                'heatDamageThreshold': 0.67, // when player temperature rises above this, receive damage
                'maxHeatGainRate': 0.05, // max rate at which heat will be gained
                'maxHeatLossRate': 0.05, // "" ... lost
                'dailyMaxGainLossRateIncreaseScale': 1.2, // each day, max rate of heat gain and loss will be multiplied by this
                'healthBarWidthScale': 1, // how wide the health bar is. At scale 1, it's two cells wide at 800x600
                'healthBarXPositionPolarity': -1, // -1 is on the left, 1 is on the right
                'healthBarMaxLength': 0.5, // max health bar length in screen heights
                'abilities': {
                        'maxPushBackAmount': 80, // in pixels
                        'pushBack': true
                },
                // WRONG, maybe. All this energy stuff should maybe be its own object so that it's easy to look at player.energy...
                'energy': 100,
                'maxEnergy': 100,
                'intervalBetweenEnergyRegenUpdates': 4,
                'delayBeforeEnergyRegenUponDepletion': 15,
                'energyRegenerationAmount': 1, // player regnerates this much energy each intervalBetweenEnergyRegenUpdates
                'energyUseRate': 10, // amount of energy consumed per frame (is that working? It seems slow for that) when player.energyBeingUsed. 20 is a good nummber for the push back ability.
                'energyBarWidthScale': 1, // how wide the health bar is. At scale 1, it's two cells wide at 800x600
                'energyBarXPositionPolarity': 1, // -1 is on the left, 1 is on the right
                'energyBarMaxLength': 0.5, // max health bar length in screen heights
                'temperatureBarWidthScale': 1,
                'temperatureBarMaxLength': 1
        },
        randomLightSettingsDefault = {
                'minBrightness': 0.125,
                'maxBrightness': 1, // WHY DOESN'T 255 create white here?
                'minRadius': 150,
                'maxRadius': 800,
                'minCoreRadius': 5, // in pixels
                'maxCoreRadius': 15,
                'minDiffusion': 1, // lower values make a more-diffuse light, with a less-distinct and -bright core
                'maxDiffusion': 18,
                'minDeathChance': 0.01, // chance that the light will be removed when it goes dark. 1 = will certainly die when it goes dark.
                'maxDeathChance': 0.025,
                'parentCellsArray': cells,
                'minFramesBetweenMovements': 2,
                'maxFramesBetweenMovements': 45
        };
        
// WARNING: setPreferences() SHOULDN'T BE MOVED FROM BETWEEN THESE SETS OF VARS!!!
function setPreferences() {
        // GRAPHICS
        // log framerate in console
        drawingSettings.fpsDisplay.displayFps = true;
        drawingSettings.fpsDisplay.fpsDisplayInterval = 5000;      // display it this frequently (in ms)
        drawingSettings.fpsDisplay.fpsDisplayIntervalLongTerm = 30000;     // and this frequently (for a short-term gist and a long-term average)
        // resolution. Currently, 0-7 are valid values. Smaller is chunkier.
        resolutionFactor = 4; // WARNING not sure this works anymore (?) //Leaps in resolution are pretty big for now due to some current constraints on valid widths and heights.
        // add color noise to the screen
        drawingSettings.noise.addNoise = true;
        // log resolution information in the console once at the beginning of running the program
        drawingSettings.displayResolutionInformation = false;
        // set limit on range of lights
        drawingSettings.numberOfRadiiBeforeLightsHaveNoEffect = 10000;
        // if true, the brightest cell on the screen will be always be white, and the darkest one black
        drawingSettings.normalizeBrightnesses = false;
        drawingSettings.darkStretchScale = 0.7; // affects normalizeBrightness. Values < 1 and >= 0 are valid. Higher values lower contrast and reduce blacks create greys.
        // If 'true', draws the game as rainbow. False is greyscale
        drawingSettings.greyscaleToSpectrum = false;
        drawingSettings.muteSpectralTones = true;
        // draw screen. Turn off to look at errors without the screen being drawn slowing things down
        drawingSettings.drawScreen = true;
        
        // GAMEPLAY INTERFACE
        // show HUD
        hudSettings.displayHUD = true;
        // health bar width and height
        player.healthBarWidthScale = 1; // how wide the health bar is. At scale 1, it's two cells wide at 800x600
        player.healthBarMaxLength = 0.5; // how big a full health bar is, in screen heights
        // health bar position
        player.healthBarXPositionPolarity = -1; // -1 is on the left, 1 is on the right.
        // show health in the console. Useful if HUD is off.
        player.displayHealth = false; // happens whenever your health changes if your health becomes a multiple of 5
        // show temperature in console.
        player.logPlayerTemperature = false;
        player.logPlayerTemperatureChangeRate = false;
        player.intervalBetweenTemperatureUpdates = 6; // ms between logged temperature updates
        settings.game.ambientTemperature.log = false; // won't work. have to uncomment-out the code logging() in main.js
        settings.game.diurnal.logTimeOfDay = false; // won't work. have to uncomment-out the code logging() in main.js
        
        // GAMEPLAY
        // health regen per second (max health is 100)
        player.healthRegenerationAmount = 1;
        // how quickly the player gains and dissipates heat
        player.temperatureChangeRateScale = 0.0005; // WRONG not being used
        // how much time passed since the start of the game increases the rate at which heat is gained and lost
        player.temperatureChangeRateFrameCounterScale = 0;//0.0000002;
        // how quickly the player cools and heats, specifically
        player.heatingScale = 1; // WRONG not being used
        player.coolingScale = 1; // WRONG not being used
        // how cold or hot the player has to get before taking damage (0-1);
        player.heatDamageThreshold = 1; // max 1
        player.coldDamageThreshold = 0; // min 0
        // how fast the player can gain and lose heat
        player.maxHeatGainRate = 0.03;
        player.maxHeatLossRate = 0.03;
        // how much faster the player can change temperature each day
        player.dailyMaxGainLossRateIncreaseScale = 1.33; // WRONG Doesn't do anything right now.
        // how strongly the ambient temperature affects the screen (cell brightness is multiplied by ambient temp and then again by this numebr)
        settings.game.ambientTemperature.scale = 1;
        // number of cells per player move (one move per frame)
        interfaceSettings.cellsPerMove = 2;
        // minimum and maximum number of lights on the map at any one time
        settings.minLights = 5;
        settings.maxLights = 12;
        // lights parameter ranges
        randomLightSettingsDefault.minBrightness = 0.25;
        randomLightSettingsDefault.maxBrightness = 4;
        randomLightSettingsDefault.minRadius = canvasWidth / 6;
        randomLightSettingsDefault.maxRadius = canvasWidth;
        randomLightSettingsDefault.minCoreRadius = 10;
        randomLightSettingsDefault.maxCoreRadius = 15;
        randomLightSettingsDefault.minDiffusion = 1; // lower values make a more-diffuse light, with a less-distinct and -bright core
        randomLightSettingsDefault.maxDiffusion = 18;
        // how fast the lights chase and flee from you in the Icarus game type. Smaller is fast.
        settings.icarusLightMovementSpeedScale = 0.25; // WRONG doesn't do anything anymore
        settings.game.diurnal.duration = 1800; // how long a full day/night cycle lasts. 3600 is two minutes, 1800 is 1, 900 is 30 seconds
}

// WARNING setPrefences NEEDS TO BE CALLED HERE, before the following declarations of vars.
setPreferences();
var //current coordinate system needs even number of cells in rows and columns. Either update findValidCellsPerRowForCanvas so that an option is to lock it even numbers in both directions (DONE), or update assignCoordinatesToCells. coordinatesToIndex won't work with odd numbers, either
        arrayOfValidCellsPerRow = findValidCellsPerRowForCanvas(canvasWidth, canvasHeight, false, true),
        cellsPerRow = 80,
        //cellsPerRow = arrayOfValidCellsPerRow[resolutionFactor], // Smaller is chunkier.
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
var frameCounter = 0, // using this to avoid Date.now() calls as part of optimizing via function call elimination (except during initialization)
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
        allDirections = [],
        deathAphorisms = [],
        arrayOfRandomNumbers = [], // this is to avoid having to call the Math.radnom() function, as part of optimization.
        randomNumberIndex = 0, // this will be incremented each time an random number from arrayOfRandomNumbers is accessed so that we're always getting new random numbers.
        arrayOfRandomNumbersLength = 1000000, // one million
        excludedNamesFromRandomOscillatorSelection = [
                'playerDamageOscillator'
        ],
        siphon = {
            'targets': [
                Math.round(totalNumberOfCells / 2 + cellsPerRow)
            ],
            'transferRateBase': 10          
        };
        
settings.oscillators.push(player.damageOscillator);
initializeLightPersonalities(10000);
//makeRandomOscillators(10, 150, 600, settings.oscillators);
//makeRandomLights(settings.minLights, randomLightSettingsDefault, settings.entities.lights, settings.oscillators);
assignDistanceLookupTables();
initializeCenterCells();
initializeAllDirections();
initializeArrayOfRandomNumbers(arrayOfRandomNumbersLength);
initializeDeathAphorisms();
//initializeClockCells();

////////////////////////
////////////////////////
// ENERGY DISTRIBUTION TESTING/EXPERIMENTING
distributeInitialEnergy();
initializeNeighbors();

//var imageData = context.createImageData(cellsPerColumn, cellsPerRow); // only do this once per page
var imageData = context.createImageData(cellsPerRow, cellsPerColumn);
var pixelArray  = imageData.data;                        // only do this once per page

// Every .033 seconds run the code in function mainLoop. 40(ms) is 25fps, 33.33etc.ms is 30.
setInterval(newMainLoop, 33.3333333333); // locking this to 30fps for consistency of gameplay
//setInterval(newMainLoop, (33.333333333333 * 0.01)); // high framerate is just to see how efficient things are by seeing how fast they can possibly go
function newMainLoop() {
    // change the location of the target cell
    targetCellControls();
    for (var i = 0; i < cells.length; i++) {
        var cell = cells[i];
        // affect the cells with input
        //cellControls(cell, 1);
        // categorize relationships of a cell to its neighbors
        sortNeighbors(cell);
        // move energy around
        distributeEnergy(cell, 1);
        // give the target cell a different color
        //if (cell.index === siphon.targets[0]) cell.color = [255, 0, 0];
        pixelArray[i * 4 + 0] = cell.energy;
        if (frameCounter % 90 < 45) pixelArray[i * 4 + 0] -= Math.round(255 * cell.coordinates[1] % 20);
        if (frameCounter % 90 < 45) pixelArray[i * 4 + 1] = 0;
        else pixelArray[i * 4 + 1] = cell.energy - 40 - cell.coordinates[0];
        pixelArray[i * 4 + 2] = cell.energy * 0.25 - cell.energy * 0.25 % 1;
        pixelArray[i * 4 + 3] = 255; // use 255 here to make opaque
    }
    context.putImageData(imageData, 0, 0);
    context.drawImage(canvas, 0, 0, cellsPerRow, cellsPerColumn, 0, 0, canvas.width, canvas.height);
    countFps(drawingSettings.fpsDisplay.fpsDisplayInterval, drawingSettings.fpsDisplay.fpsDisplayIntervalLongTerm);    
    frameCounter++;
}

function distributeEnergy(cell, siphonRateScale) {
    if (Math.abs(cell.coordinates[0]) % 15 < 7) siphonEnergy(cell, cell.neighborDown, Math.round(Math.abs(cell.coordinates[1])));
    else {
        if (frameCounter % 100 < 30) siphonEnergy(cell, cell.closestToTargetNeighbor, siphon.transferRateBase);
        else siphonEnergy(cell, cell.farthestFromTargetNeighbor, siphon.transferRateBase);
        if (cell.index % 9 === 0 && cell.neighborUp) siphonEnergy(cell, cell.neighborUp, siphon.transferRateBase * Math.round(Math.random() * 5));
        if (cell.index % 2 === 0 && cell.neighborDownLeft) siphonEnergy(cell, cell.neighborDownLeft, siphon.transferRateBase * Math.round(Math.random() * 5));
        if (cell.index % 5 === 0 && cell.neighborRigh) siphonEnergy(cell, cell.neighborRight, siphon.transferRateBase * Math.round(Math.random() * 5));
        if (frameCounter % 4 === 0) siphonEnergy(cell, cell.neighbors[Math.round(Math.random() * (cell.neighbors.length - 1))], siphon.transferRateBase * Math.round(Math.random() * 5));
        siphon.targets[0] = Math.round(Math.random() * (cells.length - 1));
        siphonEnergy(cell, cells[Math.round(Math.random() * (cells.length - 1))], 10);
    }
    //siphonEnergy(cell, cell.neighbors[Math.round(Math.random() * (cell.neighbors.length - 1))], siphon.transferRateBase * 50);//siphonRateScale);
    //siphonEnergy(cell, cell.neighborDownRight, siphon.transferRateBase * siphonRateScale);
    //siphonEnergy(cell, cell.neighborRight, siphon.transferRateBase * siphonRateScale);
    //siphonEnergy(cell, cells[totalNumberOfCells % frameCounter], siphon.transferRateBase * siphonRateScale);
    //siphonEnergy(cell, cell.dimmestNeighbor, siphon.transferRateBase * siphonRateScale);
    //siphonEnergy(cell, cell.farthestFromTargetNeighbor, siphon.transferRateBase);
}

function siphonEnergy(originCell, targetCell, amountOfEnergy) {
    if (!targetCell) return;
    var e = amountOfEnergy;
    if (originCell.energy - e < 0) e = originCell.energy; // if the donor would go below zero, the amount to transfer reduces to whatever the donor has left
    if (targetCell.energy + e > 255) e = 255 - targetCell.energy; // if the recipient would go over 255, the amount to transfer reduces to whatever it would take to top off the receipient
    originCell.energy -= e; // donor loses the amount to transfer
    targetCell.energy += e; // recepient gains the amount to transfer
}

function targetCellControls() {
    // reminder: siphon.targets[0] is just an index, not a cell.
    // move target cell up
    if (keysDown[KEY_W] && siphon.targets[0] - cellsPerRow >= 0) {
        siphon.targets[0] -= cellsPerRow;
    }
    // down
    if (keysDown[KEY_S] && siphon.targets[0] + cellsPerRow <= totalNumberOfCells - 1) {
        siphon.targets[0] += cellsPerRow;
    }
    // left
    if (keysDown[KEY_A] && siphon.targets[0] - 1 >= 0 && (siphon.targets[0] + cellsPerRow) % cellsPerRow !== 0) {
        siphon.targets[0] -= 1;
    }
    // right
    if (keysDown[KEY_D] && siphon.targets[0] + 1 <= totalNumberOfCells - 1 && (siphon.targets[0] + 1) % cellsPerRow !== 0) {
        siphon.targets[0] += 1;
    }
}

function cellControls(cell, inputScale) {
    // move target cell up
    if (keysDown[KEY_W]) {
        siphonEnergy(cell, cell.neighborUp, siphon.transferRateBase * inputScale);
    }
    // down
    if (keysDown[KEY_S]) {
        siphonEnergy(cell, cell.neighborDown, siphon.transferRateBase * inputScale);
    }
    // left
    if (keysDown[KEY_A]) {
        siphonEnergy(cell, cell.neighborLeft, siphon.transferRateBase * inputScale);
    }
    // right
    if (keysDown[KEY_D]) {
        siphonEnergy(cell, cell.neighborRight, siphon.transferRateBase * inputScale);
    }
}

function distributeInitialEnergy() {
    /*var energyReserve = totalNumberOfCells * 63; // half the possible brightness of the whole cell matrix
    while (energyReserve > 0) {
        var randomEnergyAmount = Math.round(Math.random() * 127),
            randomCell = cells[Math.round(Math.random() * (cells.length - 1))];
        // if reserve would be more than depleted this iteration, just use the rest of it up
        if (energyReserve - randomEnergyAmount < 0) randomEnergyAmount = energyReserve;
        // saturate a cell's brightness, but don't push it over max--use that energy elsewhere.
        if (randomCell.energy + randomEnergyAmount > 255) {
            randomEnergyAmount = 255 - randomCell.energy;
        }
        randomCell.energy += randomEnergyAmount;
        energyReserve -= randomEnergyAmount;
    }*/
    for (var i = 0; i < cells.length; i++) {
        cells[i].energy = 63;
    }
}

function initializeNeighbors() {
    for (var i = 0; i < totalNumberOfCells; i++) {
        var cell = cells[i];
        cell.neighbors = [];
        if (cells[cell.index + cellsPerRow]) {
            cell.neighbors.push(cells[cell.index + cellsPerRow]); // below
            cell.neighborDown = cells[cell.index + cellsPerRow];
        }
        if (cells[cell.index - cellsPerRow]) {
            cell.neighbors.push(cells[cell.index - cellsPerRow]); // above
            cell.neighborUp = cells[cell.index - cellsPerRow];
        }
        if ((cell.index + 1) % cellsPerRow !== 0) { // i.e. if cell is not on the right edge
            cell.neighbors.push(cells[cell.index + 1]); // right
            cell.neighborRight = cells[cell.index + 1];
        }
        if (cell.index % cellsPerRow !== 0) { // i.e. if cell is not on the left edge
            cell.neighbors.push(cells[cell.index - 1]); // left
            cell.neighborLeft = cells[cell.index - 1];
        }
        if (cells[cell.index + cellsPerRow + 1] && (cell.index + 1) % cellsPerRow !== 0) {
            cell.neighbors.push(cells[cell.index + cellsPerRow + 1]); // below-right
            cell.neighborDownRight = cells[cell.index + cellsPerRow + 1];
        }
        if (cells[cell.index + cellsPerRow - 1] && cell.index % cellsPerRow !== 0) {
            cell.neighbors.push(cells[cell.index + cellsPerRow - 1]); // below-left
            cell.neighborDownLeft = cells[cell.index + cellsPerRow - 1];
        }
        if (cells[cell.index - cellsPerRow + 1] && (cell.index + 1) % cellsPerRow !== 0) {
            cell.neighbors.push(cells[cell.index - cellsPerRow + 1]); // above-right
            cell.neighborUpRight = cells[cell.index - cellsPerRow + 1];
        }
        if (cells[cell.index - cellsPerRow - 1] && cell.index % cellsPerRow !== 0) {
            cell.neighbors.push(cells[cell.index - cellsPerRow - 1]); // above-left
            cell.neighborUpLeft = cells[cell.index - cellsPerRow - 1];
        }
        // just giving the cell some arbitrary associations as a starting place for later organization
        if (cell.neighborUp) cell.brightestNeighbor = cell.neighborUp;
        else cell.brightestNeighbor = cell.neighborDown;
        if (cell.neighborUp) cell.dimmestNeighbor = cell.neighborUp;
        else cell.dimmestNeighbor = cell.neighborDown;
        if (cell.neighborUp) cell.mostSimilarBrightnessNeighbor = cell.neighborUp;
        else cell.mostSimilarBrightnessNeighbor = cell.neighborDown;
        if (cell.neighborUp) cell.closestToTargetNeighbor = cell.neighborUp;
        else cell.closestToTargetNeighbor = cell.neighborDown;
        if (cell.neighborUp) cell.farthestFromTargetNeighbor = cell.neighborUp;
        else cell.farthestFromTargetNeighbor = cell.neighborDown;
        if (cell.neighborUp) cell.middleDistanceFromTargetNeighbor = cell.neighborUp;
        else cell.middleDistanceFromTargetNeighbor = cell.neighborDown;
    }
}

function sortNeighbors(cell) {
    cell.smallestEnergyDifferenceWithANeighbor = 255;
    var dimmestNeighborEnergy = 255;
    for (var i = 0; i < cell.neighbors.length; i++) {
        var n = cell.neighbors[i],
            ce = cell.energy,
            ne = n.energy,
            nd2t = n.distanceToIndex[siphon.targets[0]],
            cd2t = cell.distanceToIndex[siphon.targets[0]],
            largerOfCellOrNeighborEnergy = ce,
            smallerOfCellOrNeighborEnergy = ne;
        // figuring out which of two numbers is smaller for some substraction later, to find out the difference between two numbers. Avoiding Math.abs() function call.
        if (ne > ce) {
            largerOfCellOrNeighborEnergy = ne;
            smallerOfCellOrNeighborEnergy = ce;
        }
        // finding the neighbor closest to the target
        if (nd2t < cell.closestToTargetNeighbor.distanceToIndex[siphon.targets[0]]) {
            cell.closestToTargetNeighbor = n;
        }
        // finding the neighbor farthest from the target
        if (nd2t > cell.farthestFromTargetNeighbor.distanceToIndex[siphon.targets[0]]) {
            cell.farthestFromTargetNeighbor = n;
        }
        // finding the neighbor with the most moderate distance from the target
        // ??
        // finding the brightest neighbor
        if (ne > cell.brightestNeighbor.energy) cell.brightestNeighbor = n;
        // finding the dimmest neighbor
        // THIS SEEMS TO BE WORKING CORRECTLY, FROM THE LOGGING, but as the frameCounter progresses, cell.neighborLeft increasingly registers
        //      as cell.dimmestNeighbor, even though the upper left part of the screen is getting brighter and brighter
        //      when siphoning is moving energy toward dimmest neighbors.
        if (ne < dimmestNeighborEnergy) {
            dimmestNeighborEnergy = ne;
            cell.dimmestNeighbor = n;
        }
        //if (frameCounter === 100 && cell.index === 420) console.log(cell.dimmestNeighbor === cell.neighborLeft, cell.dimmestNeighbor.energy, ne);
        // finding the neighbor with the nearest energy level to the cell
        if (largerOfCellOrNeighborEnergy - smallerOfCellOrNeighborEnergy < cell.smallestEnergyDifferenceWithANeighbor) {
            cell.smallestEnergyDifferenceWithANeighbor = largerOfCellOrNeighborEnergy - smallerOfCellOrNeighborEnergy;
            cell.mostSimilarBrightnessNeighbor = n;
        }
    }
}

/////////////////
/////////////////

//////////////////////////
//////////////////////////
// TESTING/EXPERIMENTING
var testLightOscillator = makeOscillator(120, 0, SINE, 'testLightOscillator');
settings.oscillators.push(testLightOscillator);
//makeLightLine([-40, -10], 40, canvasHeight);
//settings.entities.lights.push(makeLight(0.5, canvasWidth / 4, [-15, -15], testLightOscillator, 10, 18, 0, 0, 0, 0, cells, settings.entities.lights));
//makeLineOfLights([-20, -15], 35);
//makeLineOfLights([-40, 10], 60);
function makeLightLine(startCoordsXYArray, length, range) {
    var line = {
        'range': range,
        'brightness': 260,
        'trapezoidSlope': 1, // 0 is rectalinear, 1 is 45° (i.e. 1:1 slope), 2 is 2:1 slope // doesn't really work
        'noiseFactor': 10,
        'oscillator': testLightOscillator,
        'length': length,
        'coordinates': startCoordsXYArray,
        'cell': cells[coordinatesToIndex(startCoordsXYArray)],
        'cellIndex': coordinatesToIndex(startCoordsXYArray), // WRONG, maybe. Should just be '.index' ?
        'parentCellsArray': cells,
        'entityType': 'shadow',
        'state': {
            'sleeping': false,
            'chasing': false,
            'fleeing': false,
            'wandering': false
        },
        'personality': {
            'dieChance': 0,
            'directionChangeChance': 0,
            'sleepChance': 0
        }
    };
    settings.entities.lightLines.push(line);
}

function initializeClockCells() {
        hudSettings.clockCells.push(
                cells[coordinatesToIndex([1, 26])], // center
                cells[coordinatesToIndex([2, 26])], // four points around center
                cells[coordinatesToIndex([-1, 26])], // four points around center
                cells[coordinatesToIndex([1, 27])],// four points around center
                cells[coordinatesToIndex([1, 25])], // four points around center
                cells[coordinatesToIndex([1, 29])], // noon
                cells[coordinatesToIndex([1, 28])], // noon inner
                cells[coordinatesToIndex([1, 23])], // midnight
                cells[coordinatesToIndex([1, 24])], // midnight inner
                cells[coordinatesToIndex([4, 26])], // 6pm
                cells[coordinatesToIndex([3, 26])], // 6pm inner
                cells[coordinatesToIndex([-3, 26])], // 6am
                cells[coordinatesToIndex([-2, 26])], // 6am inner
                cells[coordinatesToIndex([3, 28])], // 3pm
                cells[coordinatesToIndex([2, 27])], // 3pm inner
                cells[coordinatesToIndex([3, 24])], // 9pm
                cells[coordinatesToIndex([2, 25])], // 9pm inner
                cells[coordinatesToIndex([-2, 24])], // 3am
                cells[coordinatesToIndex([-1, 25])], // 3am inner
                cells[coordinatesToIndex([-2, 28])], // 9am
                cells[coordinatesToIndex([-1, 27])] // 9am inner
        );
        // giving clock cells properties for their times
        cells[coordinatesToIndex([1, 26])].clock = 'center'; // center
        cells[coordinatesToIndex([2, 26])].clock = 'centerCross'; // four points around center
        cells[coordinatesToIndex([-1, 26])].clock = 'centerCross'; // four points around center
        cells[coordinatesToIndex([1, 27])].clock = 'centerCross'; // four points around center
        cells[coordinatesToIndex([1, 25])].clock = 'centerCross'; // four points around center
        cells[coordinatesToIndex([1, 29])].clock = 0.5; // noon
        cells[coordinatesToIndex([1, 28])].clock = 0.5; // noon inner
        cells[coordinatesToIndex([1, 23])].clock = 0; // midnight
        cells[coordinatesToIndex([1, 24])].clock = 0; // midnight inner
        cells[coordinatesToIndex([-3, 26])].clock = 0.25; // 6am
        cells[coordinatesToIndex([-2, 26])].clock = 0.25; // 6am inner
        cells[coordinatesToIndex([4, 26])].clock = 0.75; // 6pm
        cells[coordinatesToIndex([3, 26])].clock = 0.75; // 6pm inner
        cells[coordinatesToIndex([3, 28])].clock = 0.625; // 3pm
        cells[coordinatesToIndex([2, 27])].clock = 0.625; // 3pm inner
        cells[coordinatesToIndex([3, 24])].clock = 0.875; // 9pm
        cells[coordinatesToIndex([2, 25])].clock = 0.875; // 9pm inner
        cells[coordinatesToIndex([-2, 24])].clock = 0.125; // 3am
        cells[coordinatesToIndex([-1, 25])].clock = 0.125; // 3am inner
        cells[coordinatesToIndex([-2, 28])].clock = 0.375; // 9am
        cells[coordinatesToIndex([-1, 27])].clock = 0.375; // 9am inner
}

function makeLineOfLights(startCoordsXYArray, length) {
    for (var i = 0; i < length; i++) {
        var newXCoord = startCoordsXYArray[0] + i,
            newYCoord = startCoordsXYArray[1],
            newCoords = [newXCoord, newYCoord];
        settings.entities.lights.push(makeLight(0.5, canvasWidth / 4, newCoords, testLightOscillator, 10, 18, 0, 0, 0, 0, cells, settings.entities.lights));
    }
}
//////////////////////////
//////////////////////////

function initializeArrayOfRandomNumbers(length) {
        // wow. A million random number and it doesn't take that long to run.
        for (var i = 0; i < length; i++) {
                arrayOfRandomNumbers.push(Math.random());
        }
}
var shadow = {
                'coordinates': [-20, -15],
                'darkness': 0.5,
                'range': 250,
                'cellIndex': coordinatesToIndex([-15, 1]),
                'cell': cells[coordinatesToIndex([-15, 1])],
                'parentCellsArray': cells,
                'movementDirection': 2,
                'entityType': 'shadow',
                'deathChance': 0, // WRONG remove this AFTER the updateEntities area has been update to use entity.personality.dieChance
                'personality': {}
};
settings.entities.shadows.push(shadow);

function initializeLightPersonalities(numberOfPersonalities) {
    for (var i = 0; i < numberOfPersonalities; i++) {
        var personality = {
            'fleeChance': Math.random() * 0.3,
            'chaseChance': Math.random() * 0.3,
            'spawnChance': Math.random() * 0,
            'dieChance': Math.random() * 0.03, // should only die when oscillator value is very small
            'wanderChance': Math.random() * 0.3,
            'flockChance': Math.random() * 0, // will chase changing targets selected from nearby lights?
            'sprintChance': Math.random() * 0.3,
            'directionChangeChance': Math.random() * 0.3,
            'orbitChance': 0,
            'expressGlobalPersonalityChance': 0.3,
            'targetCoords': null, // target could be a non-entity, non-player cell. If target is 'player', might treat player coords as 0, 0
            'siphon.targets[0]': null
        };
        // might want to add a weighting factor for each trait. I.e. when movement vector is being averaged, multiply a traits influence by some number, then at that number - 1 to the number the total is divided by.
        if (personality.targetCoords) personality.siphon.targets[0] = coordinatesToIndex(personality.targetCoords);
        settings.lightPersonalities.push(personality);
    }
    settings.gobalLightPersonality = { // global personality will respond to things like game type, player temperature, number of lights, total screen brightness (often influenced by shadows) etc. in its update.
        'fleeChance': Math.random() * 0.3,
        'chaseChance': Math.random() * 0.3,
        'spawnChance': Math.random() * 0,
        'dieChance': Math.random() * 0.03, // should only die when oscillator value is very small
        'wanderChance': Math.random() * 0.3,
        'flockChance': Math.random() * 0, // will chase changing targets selected from nearby lights?
        'sprintChance': Math.random() * 0.3,
        'orbitChance': 0,
        'directionChangeChance': 0.05,
        'expressGlobalPersonalityChance': 0.3,
        'targetCoords': null, // target could be a non-entity, non-player cell. If target is 'player', might treat player coords as 0, 0
        'siphon.targets[0]': null
    };
}

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

// WRONG THIS ISN'T DOING ANYTHING
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
                                'index': indexCounter,
                                'energy': 0
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