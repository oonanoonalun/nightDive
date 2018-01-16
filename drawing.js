var drawingSettings = {
                'fpsDisplay': {
                        'displayFps': false,
                        'fpsDisplayInterval': 2000, // for a regular fps display
                        'fpsDisplayIntervalLongTerm': 10000, // to show an average over a longer period
                        'frameCounter': 0
                },
                'noise': {
                        'addNoise': true,
                        'redNoise': 1,//0.5,
                        'greenNoise': 1,//0.6,
                        'blueNoise': 1,
                        'globalNoiseScale': 0.05,
                        'minFramesBetweenNoiseChanges': 45,
                        'maxFramesBetweenNoiseChanges': 150,
                        'noNoiseUnderThisBrightnessThreshold': 0
                },
                'baseCellColor': [80, 80, 80],
                // WRONG these next two things do nothing right now, though there's the beginning of relevant code in showLights()
                'limitLightEffectRadii': false, // if this is true
                'maxLightRadiusScale': 3, // lights will have no effect past this many times their radius
                'normalizeBrightnesses': false, // BROKEN doesn't work anymore. Would be worth fixing before deciding whether to ditch it or not. // requires a second pass over all the cells, necessarily (as it checks their relative brightnesses after all their brightnesses have been assigned), and so slows things down.
                'displayResolutionInformation': false,
                'drawScreen': true,
                'greyscaleToSpectrum': false, // draws the world as rainbow instead of greyscale. Does a little bit of extra cpu work compared to greyscale.
                'blueIsHot': false // only matters if 'grescaleToSpectrum' is true. If this is true, blue will be hot and red will be cool
};

//Chris recommeded this to make controls significantly less CPU-intensive:
var keysDown = {};
$('body').on('keydown', event => {
   keysDown[event.which] = true;
});
$('body').on('keyup', event => {
   keysDown[event.which] = false;
});
//In your code anywhere then you can just check keysDown[KEY_W]
//to see if W is currently pressed.

function drawAllCells(cellsArray) {
	// ARRRGHGHGH INDENTATION ALL FUCKED UP because of KomodoEdit. Other people have similar problems:
	// https://community.komodoide.com/t/komodo-edit-9-1-0-indentation-problem/1761/20
        context.clearRect(0, 0, 800, 600); // this calls a function, but I don't know how to recreate this function, or where to find its contents
        if (randomNumberIndex > arrayOfRandomNumbers.length - 1) {
            randomNumberIndex = 0;
            console.log('randomNumberIndex is larger than arrayOfRandomNumbers.length, but it is being reset to 0.');
        }
        ///////////////////////////////////////////////////////////////////////////////////////////////////
        // start FUNCTION updateLights(); and FUNCTION moveCameraWithButtons(); !!SHARING A 'FOR' LOOP!!
        ///////////////////////////////////////////////////////////////////////////////////////////////////
        // WARNING FUNCTION CALLS IN THIS FUNCTION-AREA
        for (var f = 0; f < settings.entities.lights.length; f++) {
                // UPDATE LIGHTS
                // possible death
                if (randomNumberIndex + 5 > arrayOfRandomNumbers.length - 1) randomNumberIndex = 0;
                else randomNumberIndex++;
                if (arrayOfRandomNumbers[randomNumberIndex] <= settings.entities.lights[f].deathChance && settings.entities.lights[f].oscillator.value < 0.1) {
                //WRONG .splice FUNCTION call here
                    settings.entities.lights[f].lightParentArray.splice(settings.entities.lights[f].cellIndex, 1);
                }
                // self-movement
                var updateLightRandomMovementAmount = 0;
                randomNumberIndex++;
                if (frameCounter % settings.entities.lights[f].framesBetweenMovements === 0 && (settings.entities.lights[f].noMovementUntil <= frameCounter || !settings.entities.lights[f].noMovementUntil)) {
                    // change direction sometimes by one compass point
                    if (arrayOfRandomNumbers[randomNumberIndex] < settings.entities.lights[f].directionChangeChance) {
                        randomNumberIndex++;
                        if (arrayOfRandomNumbers[randomNumberIndex] < 0.5) {
                                settings.entities.lights[f].movementDirection++;
                        } else settings.entities.lights[f].movementDirection--;
                        if (settings.entities.lights[f].movementDirection < 0) settings.entities.lights[f].movementDirection = 7;
                        if (settings.entities.lights[f].movementDirection > 7) settings.entities.lights[f].movementDirection = 0;
                    }
                    // eliminating a Math.round() and Math.random() function call
                    updateLightRandomMovementAmount = arrayOfRandomNumbers[randomNumberIndex] * 3 - ((arrayOfRandomNumbers[randomNumberIndex] * 3) % 1);
                    randomNumberIndex++;
                    // MOVEMENT KEY: 0 is up, then clockwise
                    // WRONG I have no freaking idea why the allDirections array isn't working in makeRandomLights()
                    // makeRandomLights() should be picking a random item from allDirections (that's code's replaced now with just picking numbers) and we should check for UP... DOWN_LEFT etc. here.
                    if (
                        settings.entities.lights[f].movementDirection === 4 ||
                        settings.entities.lights[f].movementDirection === 5 ||
                        settings.entities.lights[f].movementDirection === 3
                    ) { // DOWN || DOWN_LEFT || DOWN_RIGHT // move down
                        if (settings.entities.lights[f].coordinates[1] > -(0.5 * cellsPerColumn - interfaceSettings.cellsPerMove)) settings.entities.lights[f].coordinates[1] -= updateLightRandomMovementAmount; // if it WON'T CROSS the BOTTOM EDGE next frame
                        else settings.entities.lights[f].coordinates[1] += cellsPerColumn - updateLightRandomMovementAmount - (cellsPerColumn * 0.5 + settings.entities.lights[f].coordinates[1]); 
                    }
                    if (settings.entities.lights[f].movementDirection === 0 ||
                        settings.entities.lights[f].movementDirection === 7 ||
                        settings.entities.lights[f].movementDirection === 1
                    ) { // UP || UP_LEFT || UP_RIGHT // move up
                        if (settings.entities.lights[f].coordinates[1] < 0.5 * cellsPerColumn - interfaceSettings.cellsPerMove) settings.entities.lights[f].coordinates[1] += updateLightRandomMovementAmount; // if it WON'T CROSS the TOP EDGE next frame
                        else settings.entities.lights[f].coordinates[1] -= cellsPerColumn - updateLightRandomMovementAmount - (cellsPerColumn * 0.5 - settings.entities.lights[f].coordinates[1]);
                    }
                    if (settings.entities.lights[f].movementDirection === 2 ||
                        settings.entities.lights[f].movementDirection === 1 ||
                        settings.entities.lights[f].movementDirection === 3
                    ) { // RIGHT || UP_RIGHT || DOWN_RIGHT // move right
                        if (settings.entities.lights[f].coordinates[0] < 0.5 * cellsPerRow - updateLightRandomMovementAmount) settings.entities.lights[f].coordinates[0] += updateLightRandomMovementAmount; // if it WON'T CROSS the RIGHT EDGE next frame
                        else settings.entities.lights[f].coordinates[0] -= cellsPerRow - updateLightRandomMovementAmount - (cellsPerRow * 0.5 - settings.entities.lights[f].coordinates[0]);        
                    }
                    if (settings.entities.lights[f].movementDirection === 6 ||
                        settings.entities.lights[f].movementDirection === 7 ||
                        settings.entities.lights[f].movementDirection === 5
                    ) { // LEFT || UP_LEFT || DOWN_LEFT // move left
                        if (settings.entities.lights[f].coordinates[0] > -(0.5 * cellsPerRow - updateLightRandomMovementAmount)) settings.entities.lights[f].coordinates[0] -= updateLightRandomMovementAmount; // if it WON'T CROSS the LEFT EDGE next frame
                        else settings.entities.lights[f].coordinates[0] += cellsPerRow - updateLightRandomMovementAmount - (cellsPerRow * 0.5 + settings.entities.lights[f].coordinates[0]);
                    }
                    // lights move faster when the player temperature is at extremes
                    settings.entities.lights[f].noMovementUntil = frameCounter + player.temperatureCircular * settings.entities.lights[f].framesBetweenMovements;
                }
                // lights move away from center when player is cooler, toward it when warmer
                // WARNING/WRONG. FUNCTION CALL HERE
                if (settings.gameType === GAME_TYPE_ICARUS) temperatureMovesLightsIcarus(settings.entities.lights[f]);
                // update location & index
                // eliminating coordinatesToIndex function call
                var lightUpdateNewIndex;
                // updating cell location
                // update cell association based on any coordinate changes
                if (settings.entities.lights[f].coordinates[0] > 0) lightUpdateNewIndex = settings.entities.lights[f].coordinates[0] + cellsPerRow * 0.5 - 1;
                else lightUpdateNewIndex = settings.entities.lights[f].coordinates[0] + cellsPerRow * 0.5;
                if (settings.entities.lights[f].coordinates[1] > 0) lightUpdateNewIndex += cellsPerRow * (cellsPerColumn * 0.5 - settings.entities.lights[f].coordinates[1]);
                else lightUpdateNewIndex += cellsPerRow * (cellsPerColumn * 0.5 - settings.entities.lights[f].coordinates[1] - 1);
                settings.entities.lights[f].cell = settings.entities.lights[f].parentCellsArray[lightUpdateNewIndex]; // this light's cell become whatever cell has this light's coordinates
                settings.entities.lights[f].cellIndex = lightUpdateNewIndex;
                // FUNCTION moveCamerWithButtons(); WARNING: Sharing a 'for' loop with updateLights, so don't mess with it's position.
                if (keysDown[KEY_W]) { // move up
                    if (settings.entities.lights[f].coordinates[1] > -(0.5 * cellsPerColumn - interfaceSettings.cellsPerMove)) settings.entities.lights[f].coordinates[1] -= interfaceSettings.cellsPerMove; // if it WON'T CROSS the BOTTOM EDGE next frame
                    else settings.entities.lights[f].coordinates[1] += cellsPerColumn - interfaceSettings.cellsPerMove - (cellsPerColumn * 0.5 + settings.entities.lights[f].coordinates[1]); 
                }
                if (keysDown[KEY_S]) { // move down
                    if (settings.entities.lights[f].coordinates[1] < 0.5 * cellsPerColumn - interfaceSettings.cellsPerMove) settings.entities.lights[f].coordinates[1] += interfaceSettings.cellsPerMove; // if it WON'T CROSS the TOP EDGE next frame
                    else settings.entities.lights[f].coordinates[1] -= cellsPerColumn - interfaceSettings.cellsPerMove - (cellsPerColumn * 0.5 - settings.entities.lights[f].coordinates[1]);
                }
                if (keysDown[KEY_A]) { // move left
                    if (settings.entities.lights[f].coordinates[0] < 0.5 * cellsPerRow - interfaceSettings.cellsPerMove) settings.entities.lights[f].coordinates[0] += interfaceSettings.cellsPerMove; // if it WON'T CROSS the RIGHT EDGE next frame
                    else settings.entities.lights[f].coordinates[0] -= cellsPerRow - interfaceSettings.cellsPerMove - (cellsPerRow * 0.5 - settings.entities.lights[f].coordinates[0]);        
                }
                if (keysDown[KEY_D]) { // move right
                    if (settings.entities.lights[f].coordinates[0] > -(0.5 * cellsPerRow - interfaceSettings.cellsPerMove)) settings.entities.lights[f].coordinates[0] -= interfaceSettings.cellsPerMove; // if it WON'T CROSS the LEFT EDGE next frame
                    else settings.entities.lights[f].coordinates[0] += cellsPerRow - interfaceSettings.cellsPerMove - (cellsPerRow * 0.5 + settings.entities.lights[f].coordinates[0]);
                }
        }
        //////////////////////////////////////////////////////////////////////////////////
        // end FUNCTION updateLights() and FUNCTION moveCameraWithButtons();
        //////////////////////////////////////////////////////////////////////////////////
        //////////////////////////////////////////////////////////////////////////////////
        // start FUNCTION abilityEmergencyPushBack();
        //////////////////////////////////////////////////////////////////////////////////
        
        //////////////////////////////////////////////////////////////////////////////////
        // end FUNCTION abilityEmergencyPushBack();
        //////////////////////////////////////////////////////////////////////////////////
        //////////////////////////////////////////////////////////////////////////////////
        // start FUNCTION updateOscillators(arrayOfOscillators);
        //////////////////////////////////////////////////////////////////////////////////
        for (var c = 0; c < settings.oscillators.length; c++) {
        // WRONG missing decreasing saw wave?
        var osc = settings.oscillators[c];
        if (osc.waveShape !== SAW || SQUARE) {
                if ((frameCounter + osc.phaseShift) % osc.period < osc.halfPeriod) osc.value = ((frameCounter + osc.phaseShift) % osc.halfPeriod) / osc.halfPeriod;
                else osc.value = 1 - (((frameCounter + osc.phaseShift) % osc.halfPeriod) / osc.halfPeriod);
        }
        if (osc.waveShape === SAW) osc.value = ((frameCounter+ osc.phaseShift) % osc.period) / osc.period;
        if (osc.waveShape === SINE) osc.value = Math.sin(osc.value);
        if (osc.waveShape === SQUARE) {
                if (frameCounter + osc.phaseShift % osc.period < osc.halfPeriod) osc.value = 0;
                else osc.value = 1;
        }
        // if osc.waveShape === TRI, do nothing
        }
        //////////////////////////////////////////////////////////////////////////////////
        // end FUNCTION updateOscillators(arrayOfOscillators);
        //////////////////////////////////////////////////////////////////////////////////
        //////////////////////////////////////////////////////////////////////////////////
        // start FUNCTION updatePlayerTemperature();
        //////////////////////////////////////////////////////////////////////////////////
        if (player.noTemperatureChangeUntil <= frameCounter || !player.noTemperatureChangeUntil) {
                player.brightness = player.temperature * 255;
                var heatGainRate = interfaceSettings.centerCellsAverageBrightness * player.heatingScale * player.temperatureChangeRateScale * ((interfaceSettings.centerCellsAverageBrightness - player.brightness) / 255),
                        heatLossRate = interfaceSettings.centerCellsAverageBrightness * player.coolingScale * player.temperatureChangeRateScale * ((player.brightness - interfaceSettings.centerCellsAverageBrightness) / 255);
                if (heatGainRate > player.maxHeatGainRate) heatGainRate = player.maxHeatGainRate;
                if (heatLossRate > player.maxHeatLossRate) heatLossRate = player.maxHeatLossRate;
                // if the center cells are cooler than the player
                if (interfaceSettings.centerCellsAverageBrightness <= player.brightness) {
                    player.temperature -= heatLossRate;
                    player.currentTemperatureChangeRate = -heatLossRate;
                }
                // if the center cells are warmer than the player
                else {
                    player.temperature += heatGainRate;
                    player.currentTemperatureChangeRate = heatGainRate;
                }
                player.noTemperatureChangeUntil = frameCounter + player.intervalBetweenTemperatureUpdates;
                // limit temperature to within 0-1
                if (player.temperature > 1) player.temperature = 1;
                if (player.temperature < 0) player.temperature = 0;
                // eliminating Math.abs function call
                if ((player.temperature - 0.5) * 2 < 0) player.temperatureCircular = -(player.temperature - 0.5) * 2;
                else player.temperatureCircular = (player.temperature - 0.5) * 2;
                //player.temperatureCircular = Math.abs((player.temperature - 0.5) * 2); // i.e. 0 and 1 = 1, 0.5 = 0;
        }
        //////////////////////////////////////////////////////////////////////////////////
        // end FUNCTION updatePlayerTemperature();
        //////////////////////////////////////////////////////////////////////////////////
        //////////////////////////////////////////////////////////////////////////////////
        // start FUNCTION updateNoise(); // updating the screen noise
        //////////////////////////////////////////////////////////////////////////////////
        drawingSettings.noise.globalNoiseScale = player.temperatureCircular * player.temperatureNoiseScale;
        drawingSettings.noise.redNoise = 1 - player.temperature;
        drawingSettings.noise.greenNoise = player.temperatureCircular * 0.5;
        drawingSettings.noise.blueNoise = player.temperature;
        //////////////////////////////////////////////////////////////////////////////////
        // end FUNCTION updateNoise(); // updating the screen noise
        //////////////////////////////////////////////////////////////////////////////////
        //////////////////////////////////////////////////////////////////////////////////
        // start FUNCTION drawAllCells(cell);
        //////////////////////////////////////////////////////////////////////////////////
        for (var i = 0; i < cellsArray.length; i++) {
                var cell = cellsArray[i];
                //////////////////////////////////////////////////////////////////////////////////
                // start FUNCTION getCellColor(cell);
                //////////////////////////////////////////////////////////////////////////////////
                //////////////////////////////////////////////////////////////////////////////////
                // start FUNCTION showLights(cell);
                //////////////////////////////////////////////////////////////////////////////////
                // draw lights
                // FUNCTION showLights(cell) is FUNCTION-FREE!!   |  : D
                var brightness,
                        lightOscillatorValue = 1;
                cell.color = [0, 0, 0];//drawingSettings.baseColor;
                if (settings.entities.lights.length > 0) {
                        for (var h = 0; h < settings.entities.lights.length; h++) {
                                var light = settings.entities.lights[h],
                                        // FUNCTION
                                        //distanceFromLight = findDistanceBetweenPoints(cell.centerXY, light.cell.centerXY),
                                        distanceFromLight = cell.distanceToIndex[light.cellIndex],
                                        // eliminating need for function call to Math.max
                                        diffusionOrDistanceIsGreater;
                                if (distanceFromLight > light.diffusion) diffusionOrDistanceIsGreater = distanceFromLight;
                                else diffusionOrDistanceIsGreater = light.diffusion;
                                if (light.oscillator) lightOscillatorValue = light.oscillator.value;
                                // Math.max is a function
                                //brightness = light.radius / Math.max(light.diffusion, distanceFromLight) * lightOscillatorValue * light.brightness;
                                brightness = light.radius / diffusionOrDistanceIsGreater * lightOscillatorValue * light.brightness;
                                // FUNCTION
                                //cell.color = addColors(cell.color, [brightness, brightness, brightness]);
                                for (var j = 0; j < 3; j++) {
                                        cell.color[j] += brightness;
                                }
                        }
                }
                // FUNCTION
                //cell.color = divideColorByNumber(cell.color, settings.entities.lights.length + 1);
                for (var k = 0; k < 3; k++) {
                        cell.color[k] /= settings.entities.lights.length + 1;
                }
                //////////////////////////////////////////////////////////////////////////////////
                // end FUNCTION showLights(cell);
                //////////////////////////////////////////////////////////////////////////////////
                //////////////////////////////////////////////////////////////////////////////////
                // start FUNCTION showShadows(cell);
                //////////////////////////////////////////////////////////////////////////////////
                // showShadows(cell)
                /*var darkness;
                if (settings.entities.shadows.length > 0) {
                    for (var g = 0; g < settings.entities.shadows.length; g++) {
                        var shadow = settings.entities.shadows[g];
                        if (cell.coordinates[0] < shadow.coordinates[0]) {
                            var xDistanceFromShadow = cell.coordinates[0] - shadow.coordinates [0];
                            if (xDistanceFromShadow < 0) xDistanceFromShadow = -xDistanceFromShadow;
                            // Math.max is a function
                            //brightness = light.radius / Math.max(light.diffusion, distanceFromLight) * lightOscillatorValue * light.brightness;
                            darkness = xDistanceFromShadow * 10;
                            if (darkness < 0) darkness = 0;
                            for (var aa = 0; aa < 3; aa++) {
                                cell.color[aa] -= darkness;
                                if (cell.color[aa] < 0) cell.color[aa] = 0;
                            }
                        }
                    }
                }
                for (var ab = 0; ab < 3; ab++) {
                        cell.color[ab] /= settings.entities.shadows.length + 1;
                }*/
                //////////////////////////////////////////////////////////////////////////////////
                // end FUNCTION showShadows(cell);
                //////////////////////////////////////////////////////////////////////////////////                
                //////////////////////////////////////////////////////////////////////////////////
                // start FUNCTION findAverageBrightnessOfCenterCells(cell);
                //////////////////////////////////////////////////////////////////////////////////
                // FUNCTION-FREE!
                // this resets interfaceSettings.centerCellsAverageBrightness to 0 at the beginng of each pass through all the cells
                // eliminating two calls of FUNCTION .indexOf
                //if (cells.indexOf(cell) === 0) interfaceSettings.centerCellsAverageBrightness = 0;
                if (cell.index === 0) interfaceSettings.centerCellsAverageBrightness = 0;
                // if the current cell is one of the center cells
                var isCellACenterCell = false;
                // checking if this cell is a center cell
                for (var m = 0; m < interfaceSettings.centerCells.length; m++) {
                        if (cell.index === interfaceSettings.centerCells[m].index) isCellACenterCell = true;
                }
                //if (interfaceSettings.centerCells.indexOf(cell) !== -1) {
                if (isCellACenterCell) {
                        //showCenterCells(cell);
                        // eliminating showCenterCells() FUNCTION call
                        // eliminating addColors() FUNCTION call
                        if (interfaceSettings.showCenterCells) cell.color[0] += 64;
                        // if in greyscale mode
                        // eliminating FUNCTION Math.min
                        var smallerOfTheseTwoCellColor0OrCellColor0OneHalfTimesCellColor1;
                        if (cell.color[0] < cell.color[0] + 0.5 * cell.color[1]) smallerOfTheseTwoCellColor0OrCellColor0OneHalfTimesCellColor1 = cell.color[0];
                        else smallerOfTheseTwoCellColor0OrCellColor0OneHalfTimesCellColor1 = cell.color[0] + 0.5 * cell.color[1];
                        if (!drawingSettings.greyscaleToSpectrum) {
                                // eliminated FUNCTION averageBrightness(cell.color);
                                var cellColorAverageBrightnessForCenterCellsUse = 0;
                                for (var q = 0; q < 3; q++) {
                                        cellColorAverageBrightnessForCenterCellsUse += cell.color[q]; 
                                }
                                cellColorAverageBrightnessForCenterCellsUse /= 3;
                                interfaceSettings.centerCellsAverageBrightness += cellColorAverageBrightnessForCenterCellsUse;
                        }
                        // if in spectrum mode
                        // here's that Math.min
                        //else interfaceSettings.centerCellsAverageBrightness += Math.min(cell.color[0], cell.color[0] + 0.5 * cell.color[1]);
                        else interfaceSettings.centerCellsAverageBrightness += smallerOfTheseTwoCellColor0OrCellColor0OneHalfTimesCellColor1;
                        // draw the center screen representation
                        if (interfaceSettings.showPlayerLight) {
                                var // elimnating two Math.abs() FUNCTION calls
                                        playerLightPossibleCellAbsValOfCoord0 = 0,
                                        playerLightPossibleCellAbsValOfCoord1 = 0;
                                if (cell.coordinates[0] === -1) playerLightPossibleCellAbsValOfCoord0 = 1;
                                if (cell.coordinates[1] === -1) playerLightPossibleCellAbsValOfCoord1 = 1;
                                if ((playerLightPossibleCellAbsValOfCoord0 === 1 && playerLightPossibleCellAbsValOfCoord1 === 1) || cell.centerCellParametricLocationOnCenterCellsRadius <= 0.33) {
                                        // four center cells are always exactly your temperature, no matter the resolution
                                        // inner portion of center area are also exactly your temperature
                                        for (var n = 0; n < 3; n++) cell.color[n] = 255 * player.temperature;                            
                                } else { // non-core portions of center cells are blended with surrounding colors
                                        for (var o = 0; o < 3; o++) {
                                                cell.color[o] = ((cell.color[o] * cell.centerCellParametricLocationOnCenterCellsRadius) + ((255 * player.temperature) * (1 - cell.centerCellParametricLocationOnCenterCellsRadius)));
                                        }
                                }
                        }
                }
                // average color when done looking at all the cells
                // removed an instance of FUNCTION .indexOf
                if (cell.index === totalNumberOfCells - 1) {
                        interfaceSettings.centerCellsAverageBrightness /= interfaceSettings.centerCells.length;
                }
                //////////////////////////////////////////////////////////////////////////////////
                // end FUNCTION findAverageBrightnessOfCenterCells(cell);
                //////////////////////////////////////////////////////////////////////////////////
                //////////////////////////////////////////////////////////////////////////////////
                // start FUNCTION updateHUD(cell);
                //////////////////////////////////////////////////////////////////////////////////
                // NOTE! I'm filling in a new HUD function in-line that actually has nothing to do with the original updateHUD() function
                // draw HUD/UI
                if (hudSettings.displayHUD) {
                    // health bar
                    // if cell is on the left edge, 2 cells wide at 800x600
                    if (
                        cell.coordinates[0] <=
                        player.healthBarXPositionPolarity * (cellsPerRow / 2 - (canvas.width * 0.024 / cellSize) * player.healthBarWidthScale) &&
                        // and its y coordinate is at or under the y location that corresponds to parametric player.health * parametric screen height
	        cell.coordinates[1] <= -(cellsPerColumn / 2) + (player.health / player.maxHealth * player.healthBarMaxLength * cellsPerColumn)
	    ) {
                        if (!drawingSettings.greyscaleToSpectrum) {
                        // if in greyScale
                        // make the cell scale from red to green based on player health
                                if (player.damageWarningUntil > frameCounter) {
                                    for (var b = 0; b < 3; b++) cell.color[b] = 767 * player.damageOscillator.value;
                                } else {
                                    for (var y = 0; y < 3; y++) {
                                        if (y === 0) cell.color[y] = 1024 * (1 - player.health / player.maxHealth);
                                        if (y === 1) cell.color[y] = 384 * (player.health / player.maxHealth);
                                        if (y === 2) cell.color[y] = 0;
                                    }
                               }
                        } else {
                            // if in spectrum mode
                        }
                    }
                    // temperature bar
                    // heat bar: if the player's hot, temp bar goes to the right of mid-screen
                    if (player.temperature >= 0.5) {
                        if (
                            // WARNING 0.018 and 0.024 are only good for 4:3 ratios
                            // main bar
                            (cell.coordinates[1] <=
                            -(cellsPerColumn / 2) + (canvas.height * 0.018 / cellSize) * player.temperatureBarWidthScale &&
                            cell.coordinates[0] < ((player.temperature - 0.5) * 2) * player.temperatureBarMaxLength * (cellsPerRow / 2) &&
                            cell.coordinates[0] > 0) ||
                            // midpoint indicator
                            (cell.coordinates[0] <= canvas.width * 0.024 / cellSize && cell.coordinates[0] >= -(canvas.width * 0.024 / cellSize) &&
                            cell.coordinates[1] <= -((cellsPerColumn / 2) - (0.036 * canvasHeight / cellSize)))
                        ) {
                            if (!drawingSettings.greyscaleToSpectrum) {
                                for (var z = 0; z < 3; z++) {
                                    if (z === 0) cell.color[z] = 1024 * (player.temperature - 0.5);
                                    if (z === 1) cell.color[z] = 1024 * (1 - (player.temperature));
                                    if (z === 2) cell.color[z] = 0;
                                }
                            } else {
                                // if in spectrum mode
                            }
                        }
                    }
                    // cold bar
                    if (player.temperature < 0.5) {
                        if (
                            // WARNING 0.018 and 0.024 are only good for 4:3 ratios
                            // main bar
                            (cell.coordinates[1] <=
                            -(cellsPerColumn / 2) + (canvas.height * 0.018 / cellSize) * player.temperatureBarWidthScale &&
                            cell.coordinates[0] > -(player.temperatureBarMaxLength * (cellsPerRow / 2)) + (cellsPerRow * player.temperature) &&
                            cell.coordinates[0] < 0) ||
                            // midpoint indicator
                            (cell.coordinates[0] <= canvas.width * 0.024 / cellSize && cell.coordinates[0] >= -(canvas.width * 0.024 / cellSize) &&
                            cell.coordinates[1] <= -((cellsPerColumn / 2) - (0.036 * canvasHeight / cellSize)))
                        ) {
                            if (!drawingSettings.greyscaleToSpectrum) {
                                //cell.color = [0, 0, 255];
                                for (var a = 0; a < 3; a++) {
                                    if (a === 0) cell.color[a] = 0;
                                    if (a === 1) cell.color[a] = 256 * (player.temperature);
                                    if (a === 2) cell.color[a] = 1024 * (1 - player.temperature);
                                }
                            } else {
                                // if in spectrum mode
                            }
                        }
                    }
                    // temperature damage threshold indicators
                    // heat damage threshold indicator
                    if (
                        cell.coordinates[0] >= (canvas.width * player.heatDamageThreshold / 2) / cellSize && cell.coordinates[0] <= (canvas.width * player.heatDamageThreshold / 2) / cellSize + canvas.width * 0.024 / cellSize &&
                        cell.coordinates[1] <= -((cellsPerColumn / 2) - (0.036 * canvasHeight / cellSize))
                    ) cell.color = [255, 64, 24];
                    // cold damage threshold indicator
                    if (
                        cell.coordinates[0] <= -(canvas.width * (0.5 - player.coldDamageThreshold) / cellSize) && cell.coordinates[0] >= -(canvas.width * (0.5 - player.coldDamageThreshold) / cellSize) - (canvas.width * 0.024 / cellSize) &&
                        cell.coordinates[1] <= -((cellsPerColumn / 2) - (0.036 * canvasHeight / cellSize))
                    ) cell.color = [0, 128, 255];
                }
                //////////////////////////////////////////////////////////////////////////////////
                // end FUNCTION updateHUD(cell);
                //////////////////////////////////////////////////////////////////////////////////
                //////////////////////////////////////////////////////////////////////////////////
                // start FUNCTION addNoiseToCellColor(cell);
                //////////////////////////////////////////////////////////////////////////////////
                if (drawingSettings.noise.addNoise) {
                        if (averageBrightness(cell.color) > drawingSettings.noise.noNoiseUnderThisBrightnessThreshold) {
                                if (drawingSettings.noNoiseChangeUntil <= frameCounter || !drawingSettings.noNoiseChangeUntil) {
                                        // addNoiseToColor() is FUNCTION-FREE!    |  : D
                                        // avoiding function calls to Math.random for optimization purposes
                                        if (randomNumberIndex >= arrayOfRandomNumbers.length - 1 - 4) randomNumberIndex = 0; // making sure we don't ask for an invalid index based on how many times we're going to call this var + some before acutally updating it
                                        var rNoiseForAddingScreenNoise = 1 - drawingSettings.noise.redNoise * arrayOfRandomNumbers[randomNumberIndex] * drawingSettings.noise.globalNoiseScale,
                                                gNoiseForAddingScreenNoise = 1 - drawingSettings.noise.greenNoise * arrayOfRandomNumbers[randomNumberIndex + 1] * drawingSettings.noise.globalNoiseScale,
                                                bNoiseForAddingScreenNoise = 1 -drawingSettings.noise.blueNoise * arrayOfRandomNumbers[randomNumberIndex + 2] * drawingSettings.noise.globalNoiseScale,
                                                noiseColorScaleForAddingScreenNoise = [rNoiseForAddingScreenNoise, gNoiseForAddingScreenNoise, bNoiseForAddingScreenNoise],
                                                noiseColorForAddingScreenNoise = [];
                                        for (var r = 0; r < 3; r++) {
                                                noiseColorForAddingScreenNoise[r] = cell.color[r] * noiseColorScaleForAddingScreenNoise[r];
                                        }
                                        drawingSettings.noNoiseChangeUntil = drawingSettings.noise.minFramesBetweenNoiseChanges + arrayOfRandomNumbers[randomNumberIndex + 3] * (drawingSettings.noise.maxFramesBetweenNoiseChanges - drawingSettings.noise.minFramesBetweenNoiseChanges);
                                        randomNumberIndex += 4; // incrementing the randomNumberIndex however many times we used it (plus some) since last actually updating it
                                        cell.color = noiseColorForAddingScreenNoise;
                                }
                        }
                }
                //////////////////////////////////////////////////////////////////////////////////
                // end FUNCTION addNoiseToCellColor(cell);
                //////////////////////////////////////////////////////////////////////////////////
                //greyscale becomes rainbow if drawingSettings.greyScaleToSpectrum is 'true'
                drawCellOnSpectrum(cell);
                //////////////////////////////////////////////////////////////////////////////////
                // start FUNCTION updatePlayerHealth(cell);
                //////////////////////////////////////////////////////////////////////////////////
                // this needs to be here because it impacts cell colors
                // updatePlayerHealth() is FUNCTION FREE! except for on Date.now() call that only happens once, at the moment of death
                // if player is alive
                if (player.health > 0) {
                        // WRONG. There are so many times that whether the player is too hot or too cold is being checked. Should
                        //      lump them under one instance.
                        // extremes negatively impact health
                        // eliminating Date.now() calls
                        if ((player.temperature < player.coldDamageThreshold || player.temperature > player.heatDamageThreshold) && (player.noHealthUpdateUntil <= frameCounter || !player.noHealthUpdateUntil)) {
                                player.health--;
                                player.damageWarningUntil = frameCounter + player.damageWarningDuration;
                                player.noHealthUpdateUntil = frameCounter + player.intervalBetweenHealthUpdates;
                        }
                        // screen color flashes red or blue while taking temperature damage
                        // if in greyscale mode
                        if (!drawingSettings.greyscaleToSpectrum) {
                                // eliminated addColor() function calls
                                if (player.temperature < player.coldDamageThreshold) {
                                        for (var s = 0; s < 3; s++) {
                                                if (s === 1) cell.color[s] += 64;
                                                if (s === 2) cell.color[s] += 128;
                                        }
                                }
                                if (player.temperature > player.heatDamageThreshold) {
                                        for (var t = 0; t < 3; t++) {
                                                if (t === 0) cell.color[t] += 128;
                                                if (t === 1) cell.color[t] += 32;
                                        }
                                }
                        } else {
                        // if in spectrum mode
                                var dimmedColor = [];
                                for (var v = 0; v < 3; v++) {
                                        dimmedColor[v] = Math.max(cell.color[v] - 128, 0);
                                }
                                if (player.temperature < player.coldDamageThreshold) cell.color = dimmedColor;
                                if (player.temperature > player.heatDamageThreshold) {
                                        // eliminating an addColors() function call
                                        for (var u = 0; u < 3; u++) {
                                                cell.color[u] += 160;
                                        }
                                }
                        }
                        // logging health in the console
                        if (player.displayHealth) {
                                if (
                                        (player.temperature < player.coldDamageThreshold || player.temperature > player.heatDamageThreshold) &&
                                        player.health % 5 === 0 && player.health > 0 && player.health < 100 &&
                                        (player.health !== player.lastLoggedHealth || !player.lastLoggedHealth)
                                ) {
                                        console.log('Health: ' + player.health);
                                        player.lastLoggedHealth = player.health;
                                }
                        }
                        // health regeneration
                        if (player.regenerateHealth && frameCounter % player.healthRegenerationInterval === 0 &&
                            (player.noHealthRegenUntil <= frameCounter || !player.noHealthRegenUntil) &&
                            player.health < player.maxHealth
                        ) {
                                player.health += player.healthRegenerationAmount;
                                player.noHealthRegenUntil = frameCounter + player.healthRegenerationInterval; // just to keep you from getting more than one helath bump in the 50ms window that opens up to make sure you don't miss it altogether.
                        }
                } else { // player is dead
                        cell.color = [0, 0, 0];
                        if (!player.died) {
                                // eliminating Math.round() and Math.random()
                                var roundedDeathAphorismIndex = arrayOfRandomNumbers[randomNumberIndex] * (deathAphorisms.length - 1); // unrounded, initially
                                roundedDeathAphorismIndex -= roundedDeathAphorismIndex % 1; // rounding
                                console.log(deathAphorisms[roundedDeathAphorismIndex]);
                                if (randomNumberIndex < arrayOfRandomNumbers.length - 1) randomNumberIndex++;
                                else randomNumberIndex = 0;
                                player.died = true;
                                // FUNCTION call here, but it runs very rarely, at a time when framerate doesn't matter. I can't do this with frames because framerate will vary.
                                console.log('Play time was ' + ((Date.now() - settings.gameStartTime) / 1000).toFixed(2) + ' seconds.');
                        }
                }
                //////////////////////////////////////////////////////////////////////////////////
                // end FUNCTION updatePlayerHealth(cell);
                //////////////////////////////////////////////////////////////////////////////////
                //////////////////////////////////////////////////////////////////////////////////
                // start FUNCTION finalizeCellColorAndDrawCell(cell);
                //////////////////////////////////////////////////////////////////////////////////
                if (!drawingSettings.normalizeBrightnesses) {
// !!!!!!!WRONG INDENTATION!!!!!!!!!!! this indentation is wrong and this doc is spazzing but I could only fix it manually with a bunch of spacing so I'm not going to right now
                                // FUNCTION finalizeCellColorAndDrawCell() is FUNCTION-FREE EXCEPT for the context.fillRect() call, which function I don't know how to reproduce yet
                                // eliminating toHexColor() and capColorBrightness() calls
                                // cap color brightness
                                for (var x = 0; x < 3; x++) if (cell.color[x] > 255) cell.color[x] = 255;
                                // toHexColor
                                for (var w = 0; w < 3; w++) {
                                        // Math.round()
                                        cell.color[w] -= cell.color[w] % 1;
                                        cell.color[w] = cell.color[w].toString(16);
                                        if (cell.color[w].length < 2) {
                                                cell.color[w] = '0' + cell.color[w];
                                        }
                                }
                                cell.color = '#' + cell.color[0] + cell.color[1] + cell.color[2];
                                if (drawingSettings.drawScreen) {
                                        context.fillStyle = cell.color;
                                        context.fillRect(cell.left, cell.top, cell.size, cell.size);
                                }
                }
                //////////////////////////////////////////////////////////////////////////////////
                // end FUNCTION finalizeCellColorAndDrawCell(cell);
                //////////////////////////////////////////////////////////////////////////////////
        }
        //////////////////////////////////////////////////////////////////////////////////
        // end FUNCTION drawAllCells(cell);
        //////////////////////////////////////////////////////////////////////////////////
        if (drawingSettings.normalizeBrightnesses) normalizeCellsArrayBrightnessRange(cellsArray, 0, 255); // requires a second pass over all the cells, necessarily (as it checks their relative brightnesses after all their brightnesses have been assigned), and so slows things down.
        frameCounter++;
}

function drawCellOnSpectrum(cell) {
        if (drawingSettings.greyscaleToSpectrum) {
                cell.color = brightnessToSpectrum(0, 255, cell);
        }
}

function makeRandomLights(numberOfLights, randomLightParametersObject, destinationArray, oscillatorsArray) {
        var lightSettings = randomLightParametersObject;
        for (var i = 0; i < numberOfLights; i++) {
                var randomBrightness = randomNumberBetweenNumbers(lightSettings.minBrightness, lightSettings.maxBrightness, true),
                        randomRadius = randomNumberBetweenNumbers(lightSettings.minRadius, lightSettings.maxRadius, true),
                        randomXY = [],
                        randomDirectionChangeChance = randomNumberBetweenNumbers(0.05, 0.3, false),
                        randomOscillator = getRandomNonExcludedOscillator(),
                        randomDiffusion = randomNumberBetweenNumbers(lightSettings.minDiffusion, lightSettings.maxDiffusion, true),
                        randomDeathChance = randomNumberBetweenNumbers(lightSettings.minDeathChance, lightSettings.maxDeathChance, false),
                        allCellsList = lightSettings.parentCellsArray,
                        randomFramesBetweenMovements = randomNumberBetweenNumbers(lightSettings.minFramesBetweenMovements, lightSettings.maxFramesBetweenMovements, true),
                        randomDirectionNumber = Math.round(Math.random() * 7);
                randomDirection = allDirections[3];
                if (Math.random() > 0.5) randomXY[0] = randomNumberBetweenNumbers(1, 0.5 * cellsPerRow, true);
                else randomXY[0] = -randomNumberBetweenNumbers(1, 0.5 * cellsPerRow, true);
                if (Math.random() > 0.5) randomXY[1] = randomNumberBetweenNumbers(1, 0.5 * cellsPerColumn, true);
                else randomXY[1] = -randomNumberBetweenNumbers(1, 0.5 * cellsPerColumn, true);
                destinationArray.push(makeLight(randomBrightness, randomRadius, randomXY, randomOscillator, randomDiffusion, randomFramesBetweenMovements, randomDirectionNumber, randomDirectionChangeChance, randomDeathChance, allCellsList, destinationArray));
        }
}

function getRandomNonExcludedOscillator() {
        var randomOscillator;
        for (var j = 0; j < 1; j++) {
                randomOscillator = settings.oscillators[randomNumberBetweenNumbers(0, (settings.oscillators.length - 1), true)];
                for (var i = 0; i < excludedNamesFromRandomOscillatorSelection.length; i++) {
                        if (randomOscillator.name === excludedNamesFromRandomOscillatorSelection[i]) {
                                i = excludedNamesFromRandomOscillatorSelection.length;
                                j--;
                        }
                }
        }
        return randomOscillator;
}

//WRONG the "make" functions should be in initialization.js (I don't want to move them till everything else is stable)
function makeLight(brightness, radius, coordinates, oscillator, diffusion, framesBetweenMovements, movementDirection, directionChangeChance, deathChance, allCellsList, lightsArray) {
        var light = {
                'brightness': brightness,
                'radius': radius,
                'diffusion': diffusion,
                'oscillator': oscillator,
                'deathChance': deathChance,
                'parentCellsArray': allCellsList, // large cellsList of which light's cell is a part
                'lightParentArray': lightsArray, // lights array
                'coordinates': coordinates,
                'framesBetweenMovements': framesBetweenMovements,
                'movementDirection': movementDirection, // 0-7 because it got weirdly broken to try to use the allDirecitons array
                'directionChangeChance': directionChangeChance,
                'cell': allCellsList[coordinatesToIndex(coordinates)],
                'cellIndex': coordinatesToIndex(coordinates),
                'personality': {
                }
        };
        return light;
}

function updateLight(light) {
        // possible death
        if (randomNumberIndex + 2 > arrayOfRandomNumbers.length - 1) randomNumberIndex = 0;
        else randomNumberIndex++;
        if (arrayOfRandomNumbers[randomNumberIndex] <= settings.entities.lights[f].deathChance && settings.entities.lights[f].oscillator.value < 0.1) {
                var lightsArrayIndex = settings.entities.lights[f].lightParentArray.indexOf(light);
                settings.entities.lights[f].lightParentArray.splice(lightsArrayIndex, 1);
        }
        // self-movement
        if (frameCounter % settings.entities.lights[f].framesBetweenMovements === 0 && (settings.entities.lights[f].noMovementUntil <= frameCounter || !settings.entities.lights[f].noMovementUntil)) {
                // eliminating a Math.round() and Math.random() function call
                var updateLightRandomMovementAmount = arrayOfRandomNumbers[randomNumberIndex] * 3 - ((arrayOfRandomNumbers[randomNumberIndex] * 3) % 1);
                randomNumberIndex++;
                moveEntity(light, light.movementDirection, updateLightRandomMovementAmount);
                // lights move faster when the player temperature is at extremes
                settings.entities.lights[f].noMovementUntil = frameCounter + Math.min(52, player.temperatureCircular * settings.entities.lights[f].framesBetweenMovements);
        }
        // lights move away from center when player is cooler, toward it when warmer
        if (settings.gameType === GAME_TYPE_ICARUS) temperatureMovesLightsIcarus(settings.entities.lights[f]);
        // update location & index
        // eliminating coordinatesToIndex function call
        var lightUpdateNewIndex;
        if (settings.entities.lights[f].coordinates[0] > 0) lightUpdateNewIndex = settings.entities.lights[f].coordinates[0] + cellsPerRow * 0.5 - 1;
        else settings.entities.lights[f] = lightForUpdateLight.coordinates[0] + cellsPerRow * 0.5;
        if (settings.entities.lights[f].coordinates[1] > 0) lightUpdateNewIndex += cellsPerRow * (cellsPerColumn * 0.5 - settings.entities.lights[f].coordinates[1]);
        else lightUpdateNewIndex += cellsPerRow * (cellsPerColumn * 0.5 - settings.entities.lights[f].coordinates[1] - 1);
        //lightUpdateNewIndex = coordinatesToIndex(light.coordinates);
        settings.entities.lights[f].cell = settings.entities.lights[f].parentCellsArray[lightUpdateNewIndex]; // this light's cell become whatever cell has this light's coordinates
        settings.entities.lights[f].cellIndex = lightUpdateNewIndex;
        //light.cell = light.parentCellsArray[light.cellIndex];
}

function isIcarusLightMovementEnabled() {
        if (player.emergencyPushBackUntil > frameCounter) return false;
        if (settings.gameType !== GAME_TYPE_ICARUS) return false;
        else return true;
}

function temperatureMovesLightsIcarus(light) {
        // WRONG Delay between light movements and how they scale off the player's temperature
        //      should be light properties. Maybe based on their brightness and/or diffusion?
        //      Could make the number of cells moved in the moveEntity calls below scale off of something.
        // WRONG should work out a way for things to move toward a given point.
        // WRONG Number of cells moved should scale with resolution, or you should be able to send pixels
        //      to moveEntity and have it translate them to cells at the current resolution.
        if (randomNumberIndex + 2 < arrayOfRandomNumbers.length - 1) randomNumberIndex++;
        else randomNumberIndex = 0;
        randomNumberIndex++;
        if (arrayOfRandomNumbers[randomNumberIndex] < 0.3) {
                randomNumberIndex++;
                if ((light.noTemperatureMoveUntil <= frameCounter || !light.noTemperatureMoveUntil) && isIcarusLightMovementEnabled()) {
                        if (light.coordinates[1] > 0) { // i.e. cell is in the UPPER HALF
                                if (player.temperature < 0.5) moveEntity(light, UP, 1); // cool players repel lights
                                if (player.temperature > 0.5) moveEntity(light, DOWN, 1); // hot players attract lights
                        }
                        if (light.coordinates[1] < 0) { // i.e. cell is in the LOWER HALF
                                if (player.temperature < 0.5) moveEntity(light, DOWN, 1); // cool players repel lights
                                if (player.temperature > 0.5) moveEntity(light, UP, 1); // hot players attract lights                        
                        }
                        if (light.coordinates[0] < 0) { // i.e. cell is in the LEFT HALF
                                if (player.temperature < 0.5) moveEntity(light, LEFT, 1); // cool players repel lights
                                if (player.temperature > 0.5) moveEntity(light, RIGHT, 1); // hot players attract lights                        
                        }
                        if (light.coordinates[0] > 0) { // i.e. cell is in the RIGHT HALF
                                if (player.temperature < 0.5) moveEntity(light, RIGHT, 1); // cool players repel lights
                                if (player.temperature > 0.5) moveEntity(light, LEFT, 1); // hot players attract lights                        
                        }
                        var lightsMoveTowardPlayerFramesBetweenMoves = 2;
                        // minimum number of frames between moves when lights move toward player
                            randomNumberIndex++;
                        if (lightsMoveTowardPlayerFramesBetweenMoves > 30 * settings.icarusLightMovementSpeedScale - (player.temperatureCircular * 30) * (0.5 + arrayOfRandomNumbers[randomNumberIndex])) {
                            randomNumberIndex++;
                            lightsMoveTowardPlayerFramesBetweenMoves = 30 * settings.icarusLightMovementSpeedScale - (player.temperatureCircular * 30) * (0.5 + arrayOfRandomNumbers[randomNumberIndex]);
                        }
                        light.noTemperatureMoveUntil = frameCounter + lightsMoveTowardPlayerFramesBetweenMoves; // WRONG MAYBE maybe light brightness and/or diffusion should figure into how fast they move?
                }
        }
}

function emergencyPushBackMovesLights(arrayOfLights) {
        for (var d = 0; d < settings.entities.lights.length; d++) {
                var lightForPushBack = settings.entities.lights[d];
                // WRONG Delay between light movements and how they scale off the player's temperature
                //      should be light properties. Maybe based on their brightness and/or diffusion?
                //      Could make the number of cells moved in the moveEntity calls below scale off of something.
                // WRONG should work out a way for things to move toward a given point.
                // WRONG Number of cells moved should scale with resolution, or you should be able to send pixels
                //      to moveEntity and have it translate them to cells at the current resolution.
                if (lightForPushBack.noEmergencyPushBackMoveUntil <= frameCounter || !lightForPushBack.noEmergencyPushBackMoveUntil) {
                        var pushBackMovementScale = 3,
                            roundedPushBackMovementScale = ((player.remainingPushBackDuration * 2) / player.emergencyPushBackDuration) - (((player.remainingPushBackDuration * 2) / player.emergencyPushBackDuration) % 1);
                        if (roundedPushBackMovementScale < pushBackMovementScale) pushBackMovementScale = roundedPushBackMovementScale;
                        player.remainingPushBackDuration = player.emergencyPushBackUntil - frameCounter;
                        if (lightForPushBack.coordinates[1] > 0) { // i.e. cell is in the UPPER HALF
                                // eliminating Math.min()s and Math.round()s
                                moveEntity(lightForPushBack, UP, 1 * pushBackMovementScale);
                        }
                        if (lightForPushBack.coordinates[1] < 0) { // i.e. cell is in the LOWER HALF
                                moveEntity(lightForPushBack, DOWN, 1 * pushBackMovementScale);
                        }
                        if (lightForPushBack.coordinates[0] < 0) { // i.e. cell is in the LEFT HALF
                                moveEntity(lightForPushBack, LEFT, 1 * pushBackMovementScale);
                        }
                        if (lightForPushBack.coordinates[0] > 0) { // i.e. cell is in the RIGHT HALF
                                moveEntity(lightForPushBack, RIGHT, 1 * pushBackMovementScale);
                        }
                        lightForPushBack.noEmergencyPushBackMoveUntil = frameCounter + (player.emergencyPushBackDuration - player.remainingPushBackDuration);
                }
        }
}

function updateLights(arrayOfLights, minLights, maxLights) {
        // individual light update
        for (var i = 0; i < arrayOfLights.length; i++) updateLight(arrayOfLights[i]);
        // keeping enough lights alive
        if (arrayOfLights.length < maxLights) {
                if (arrayOfLights.length < minLights) makeRandomLights(1, randomLightSettingsDefault, settings.entities.lights, settings.oscillators);
                else if (Math.random() < 0.05) makeRandomLights(1, randomLightSettingsDefault, settings.entities.lights, settings.oscillators);
        }
}

function makeOscillator(period, phase, waveShape, name) {
        // WRONG should have a 'phaseWanderingScale' property with an update that maybe gives the phase a 'wandering velocity'
        var osc = {
                'period': period,
                'value': 0,
                'phase': phase,
                'phaseShift': period * phase,
                'waveShape': waveShape,
                'name': name
        };
        osc.halfPeriod = 0.5 * osc.period;
        return osc;
}

function makeRandomOscillators(numberOfOscillators, minPeriod, maxPeriod, destinationArray) {
        for (var i = 0; i < numberOfOscillators; i++) {
                var randomPeriod = randomNumberBetweenNumbers(minPeriod, maxPeriod, true),
                        newOsc = makeOscillator(randomPeriod, Math.random(), SINE, 'randomOscillator');
                destinationArray.push(newOsc);
        }
}

function normalizeCellsArrayBrightnessRange(cellsArray, darkestValue, brightestValue) {
        // this function ensures that the darkest cell will almost be the darkestValue, and the brightest cell will always be the brightestValue
        var darkestBrightness = 255,
                brightestBrightness = 0,
                brightnessRange,
                newBrightness;
        // finding the darkest and brightest brightnesses in the current array of cells
        for (var i = 0; i < cellsArray.length; i++) {
                if (averageBrightness(cellsArray[i].color) > brightestBrightness) brightestBrightness = averageBrightness(cellsArray[i].color);
                if (averageBrightness(cellsArray[i].color) < darkestBrightness) darkestBrightness = averageBrightness(cellsArray[i].color);
        }
        brightnessRange = brightestBrightness - darkestBrightness;
        for (var j = 0; j < cellsArray.length; j++) {
                var currentBrightness = averageBrightness(cellsArray[j].color),
                        currentCellParametricBrightness = (currentBrightness - darkestBrightness) / brightnessRange;
                newBrightness = darkestValue + brightestValue * currentCellParametricBrightness;
                cellsArray[j].color = [newBrightness, newBrightness, newBrightness];
                finalizeCellColorAndDrawCell(cellsArray[i]);
        }
}

function findDistanceBetweenPoints(xyArray1, xyArray2) {
        xDistance = xyArray1[0] - xyArray2[0];
        yDistance = xyArray1[1] - xyArray2[1];
        distance = Math.sqrt(xDistance * xDistance + yDistance * yDistance);
        return distance;
}

function  rejectAndLogInvalidCoords(coordsXYArray, functionSentBadCoords) {
        // don't try to do anything if coordinates are off the cell grid or include fractions or are 0 (which this coord system doesn't have)
        var coords = coordsXYArray,
                func = functionSentBadCoords;
        if (Math.abs(coords[0]) > cellsPerRow / 2 || Math.abs(coords[1]) > cellsPerColumn / 2 ||
                coords[0] === 0 || coords[1] === 0 ||
                coords[0] % 1 !== 0 || coords[1] % 1 !== 0
        ) {
                console.log('"' + func + '" was passed invalid coordinates. The coordinate could have fallen outside the cell grid, been fractional, or been 0 (which does not exist on this even-numbered grid).');
                return;
        } 
}

function makeRectangle(widthInPixels, heightInPixels, topLeftCoordinatesXYArray, brightness, radianceRangeInPixels, oscillator, directionOfMovement, msBetweenMovements, pixelsPerMovement, name) {
        var rectangle = {
                        'coreCells': [],
                        'radianceCells': [],
                        'brightness': brightness,
                        'directionOfMovement': directionOfMovement,
                        'msBetweenMovements': msBetweenMovements,
                        'cellsPerMovement': Math.round(pixelsPerMovement / cellSize),
                        'oscillator': oscillator,
                        'widthInCells': Math.round(widthInPixels / cellSize),
                        'heightInCells': Math.round(heightInPixels / cellSize),
                        'radianceRangeInCells': radianceRangeInPixels / cellSize,
                        'topLeftCoords': topLeftCoordinatesXYArray,
                        'name': name
                },
                coords = topLeftCoordinatesXYArray;
        for (var i = 0; i < rectangle.widthInCells; i++) {
                var newCoords = [coords[0] + i, coords[1]];
                if (newCoords[0] <= cellsPerRow / 2) {
                        if (newCoords[0] === 0) newCoords[0]++;
                        if (newCoords[1] === 0) newCoords[0]--;
                        rectangle.coreCells.push(cells[coordinatesToIndex(coords[0], coords[1])]);
                }
                for (var j = 1; j < rectangle.heightInCells; j++) {
                        if (newCoords[1] - j >= -(cellsPerColumn / 2)) {
                                if (newCoords[1] - j === 0) newCoords[1]--;
                                if (newCoords[1] - j >= -(cellsPerColumn / 2)) rectangle.coreCells.push(cells[coordinatesToIndex(coords[0], coords[1] - j)]);
                        }
                }
        }
        rectangle.push(settings.rectangles);
        /* some ideas for radiance coloring borrowed from center cells shading
        for (var j = 0; j <3; j++) {
                cell.color[j] = ((cell.color[j] * paraLocation) + ((255 * player.temperature) * (1 - paraLocation)));
        }
        */
}

function updateRectangle(rectangle) {
        // self-movement
        
}

function updateRectangles(arrayOfRectangles) {
        for (var i = 0; i < settings.entities.rectangles.length; i++) {
                updateRectangle(settings.entities.rectangles[i]);
        }
}

// WRONG: this function tanks the framerate, at least if run every frame.
function findCellAtCoordinate(xyArray, allCellsList) {
        for (var i = 0; i < allCellsList.length; i++) {
                var cell = allCellsList[i];
                if (xyArray[0] >= cell.left && xyArray[0] <= cell.left + cell.size) {
                        if (xyArray[1] >= cell.top && xyArray[1] <= cell.top + cell.size) {
                                return cell;
                        }
                }
        }
        return null;
}
