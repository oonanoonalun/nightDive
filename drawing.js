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
                'normalizeBrightnesses': true,
                'darkStretchScale': 0.5,// affects normalizeBrightness. Values < 1 and >= 0 are valid. Higher values lower contrast and reduce blacks create greys.
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
        // if our array of random numbers has been used up during the last loop, reset it;
        if (randomNumberIndex > arrayOfRandomNumbers.length - 1) {
            randomNumberIndex = 0;
            console.log('randomNumberIndex is larger than arrayOfRandomNumbers.length, but it is being reset to 0.');
        }
        ///////////////////////////////////////////////////////////////////////////////////////////////////
        // start FUNCTION updateLights(); (includes camera movement)
        ///////////////////////////////////////////////////////////////////////////////////////////////////
        // WARNING FUNCTION CALLS IN THIS FUNCTION-AREA
        // afaik, the only one is the .splice call in the death area
        // WARNING This is some kludgy shit because looping over object properties is apparently a pain or at least obscure in js.
        // Manual updates needed for added entity types.
        for (var aj = 0; aj < settings.entities.length; aj++) {
            var entityArray;
            if (aj === 0) entityArray = settings.entities.lights;
            if (aj === 1) entityArray = settings.entities.shadows;
            for (var f = 0; f < entityArray.length; f++) {
                var entity = entityArray[f];
                // UPDATE ENTITIES
                // possible death
                if (randomNumberIndex + 5 > arrayOfRandomNumbers.length - 1) randomNumberIndex = 0;
                else randomNumberIndex++;
                if (arrayOfRandomNumbers[randomNumberIndex] <= entity.personality.dieChance && (!entity.oscillator || entity.oscillator.value < 0.1)) {
                     // remove from its array. .splice() is a function (which I'm trying not to use), and I don't know how to get the entity's index in its array without using yet more functions.
                     //console.log('light would have died if that were implemented right now');
                }
                // self-movement
                // FIGURING OUT HOW MUCH TO MOVE AND IN WHAT DIRECTION
                var updateEntityRandomMovementAmount = 0;
                randomNumberIndex++;
                // change direction sometimes by one compass point
                if (arrayOfRandomNumbers[randomNumberIndex] < entity.personality.directionChangeChance) {
                    randomNumberIndex++;
                    if (arrayOfRandomNumbers[randomNumberIndex] < 0.5) {
                            entity.movementDirection++;
                    } else entity.movementDirection--;
                    // directions wrap around (only works for up to one extra time around the circle)
                    if (entity.movementDirection < 0) entity.movementDirection += 8;
                    if (entity.movementDirection > 7) entity.movementDirection -= 8;
                }
                updateEntityRandomMovementAmount = arrayOfRandomNumbers[randomNumberIndex] * 2 - ((arrayOfRandomNumbers[randomNumberIndex] * 2) % 1);
                randomNumberIndex++;
                // MOVEMENT KEY: 0 is up, then clockwise
                // up = 0, up-right = 1... down = 4... up-left = 7
                // WRONG I have no freaking idea why the allDirections array isn't working in makeRandomLights()
                // BUT MAYBE RIGHT Having them be numbers lets me increment and decrement them pretty easily.
                // makeRandomLights() should be picking a random item from allDirections (that's code's replaced now with just picking numbers) and we should check for UP... DOWN_LEFT etc. here.
                var entityXCellsMoveNextFrame = 0,
                    entityYCellsMoveNextFrame = 0;
                // camera movement
                if (keysDown[KEY_W]) entityYCellsMoveNextFrame -= interfaceSettings.cellsPerMove;
                if (keysDown[KEY_S]) entityYCellsMoveNextFrame += interfaceSettings.cellsPerMove;
                if (keysDown[KEY_D]) entityXCellsMoveNextFrame -= interfaceSettings.cellsPerMove;
                if (keysDown[KEY_A]) entityXCellsMoveNextFrame += interfaceSettings.cellsPerMove;
                // self-movement
                if ( // if self movement direction is DOWN
                    entity.movementDirection === 4 ||
                    entity.movementDirection === 5 ||
                    entity.movementDirection === 3
                ) { // DOWN || DOWN_LEFT || DOWN_RIGHT // move down
                    entityYCellsMoveNextFrame -= updateEntityRandomMovementAmount;
                }
                if ( // if self movement direction is UP
                    entity.movementDirection === 0 ||
                    entity.movementDirection === 7 ||
                    entity.movementDirection === 1
                ) { // UP || UP_LEFT || UP_RIGHT // move up
                    entityYCellsMoveNextFrame += updateEntityRandomMovementAmount;
                }
                if ( // if self movement direction is RIGHT
                    entity.movementDirection === 2 ||
                    entity.movementDirection === 1 ||
                    entity.movementDirection === 3
                ) { // RIGHT || UP_RIGHT || DOWN_RIGHT // move right
                    entityXCellsMoveNextFrame += updateEntityRandomMovementAmount;
                }
                if ( // if self movement direction is LEFT
                    entity.movementDirection === 6 ||
                    entity.movementDirection === 7 ||
                    entity.movementDirection === 5
                ) { // LEFT || UP_LEFT || DOWN_LEFT // move left
                    entityXCellsMoveNextFrame -= updateEntityRandomMovementAmount;
                }
                // movement toward hot players and away from cool players.
                if (player.temperature >= 0.5) {// && frameCounter % (player.temperature * 3 - player.temperature *3 % 1) === 0) {
                                if (entity.coordinates[0] < 0) entityXCellsMoveNextFrame += 1;//player.temperature * 3 - player.temperature *3 % 1;
                                else entityXCellsMoveNextFrame -= 1;//player.temperature * 3 - player.temperature *3 % 1;
                                if (entity.coordinates[1] < 0) entityYCellsMoveNextFrame += 1;//player.temperature * 3 - player.temperature *3 % 1;
                                else entityYCellsMoveNextFrame -= 1;//player.temperature * 3 - player.temperature *3 % 1;
                }
                if (player.temperature < 0.5) {// && frameCounter % (player.temperature * 3 - player.temperature * 3 % 1) === 0) {
                                if (entity.coordinates[0] < 0) entityXCellsMoveNextFrame -= 1;//player.temperature * 3 - player.temperature *3 % 1;
                                else entityXCellsMoveNextFrame += 1;//player.temperature * 3 - player.temperature *3 % 1;
                                if (entity.coordinates[1] < 0) entityYCellsMoveNextFrame -= 1;//player.temperature * 3 - player.temperature *3 % 1;
                                else entityYCellsMoveNextFrame += 1;//player.temperature * 3 - player.temperature *3 % 1;
                }
                // rounding down just before adding to light coordinates
                // WRONG MAYBE could make this round, not round down, with some more code
                if (entityYCellsMoveNextFrame > 0) entityYCellsMoveNextFrame = entityYCellsMoveNextFrame - entityYCellsMoveNextFrame % 1;
                else entityYCellsMoveNextFrame = -(-entityYCellsMoveNextFrame - (-entityYCellsMoveNextFrame % 1));
                if (entityXCellsMoveNextFrame > 0) entityXCellsMoveNextFrame = entityXCellsMoveNextFrame - entityXCellsMoveNextFrame % 1;
                else entityXCellsMoveNextFrame = -(-entityXCellsMoveNextFrame - (-entityXCellsMoveNextFrame % 1));
                // TIME TO ACTUALLY CHANGE COORDINATES
                // MOVE DOWN
                if (entityYCellsMoveNextFrame < 0) {
                    if (entity.coordinates[1] > -(0.5 * cellsPerColumn + entityYCellsMoveNextFrame)) entity.coordinates[1] += entityYCellsMoveNextFrame; // if it WON'T CROSS the BOTTOM EDGE next frame
                    else entity.coordinates[1] += cellsPerColumn + entityYCellsMoveNextFrame - (cellsPerColumn * 0.5 + entity.coordinates[1]); 
                }
                // MOVE UP
                if (entityYCellsMoveNextFrame > 0) {
                    if (entity.coordinates[1] < 0.5 * cellsPerColumn - entityYCellsMoveNextFrame) entity.coordinates[1] += entityYCellsMoveNextFrame; // if it WON'T CROSS the TOP EDGE next frame
                    else entity.coordinates[1] -= cellsPerColumn - entityYCellsMoveNextFrame - (cellsPerColumn * 0.5 - entity.coordinates[1]);
                }
                // MOVE RIGHT
                if (entityXCellsMoveNextFrame > 0) {
                    if (entity.coordinates[0] < 0.5 * cellsPerRow - entityXCellsMoveNextFrame) entity.coordinates[0] += entityXCellsMoveNextFrame; // if it WON'T CROSS the RIGHT EDGE next frame
                    else entity.coordinates[0] -= cellsPerRow - entityXCellsMoveNextFrame - (cellsPerRow * 0.5 - entity.coordinates[0]);        
                }
                // MOVE LEFT
                if (entityXCellsMoveNextFrame < 0) {
                    if (entity.coordinates[0] > -(0.5 * cellsPerRow + entityXCellsMoveNextFrame)) entity.coordinates[0] += entityXCellsMoveNextFrame; // if it WON'T CROSS the LEFT EDGE next frame
                    else entity.coordinates[0] += cellsPerRow + entityXCellsMoveNextFrame - (cellsPerRow * 0.5 + entity.coordinates[0]);
                }
                // lights move faster when the player temperature is at extremes
                //entity.noMovementUntil = frameCounter + player.temperatureCircular * entity.framesBetweenMovements;
                var entityUpdateNewIndex;
                // TIME TO ACTUALLY MOVE TO A DIFFERENT CELL
                // update cell association based on any coordinate changes
                if (entity.coordinates[0] > 0) entityUpdateNewIndex = entity.coordinates[0] + cellsPerRow * 0.5 - 1;
                else entityUpdateNewIndex = entity.coordinates[0] + cellsPerRow * 0.5;
                if (entity.coordinates[1] > 0) entityUpdateNewIndex += cellsPerRow * (cellsPerColumn * 0.5 - entity.coordinates[1]);
                else entityUpdateNewIndex += cellsPerRow * (cellsPerColumn * 0.5 - entity.coordinates[1] - 1);
                entity.cell = entity.parentCellsArray[entityUpdateNewIndex]; // this light's cell become whatever cell has this light's coordinates
                entity.cellIndex = entityUpdateNewIndex;
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
                // "circular temperature" is: 0 and 1 = 1, 0.5 = 0, i.e. extremes are 1, middle is 0
                if ((player.temperature - 0.5) * 2 < 0) player.temperatureCircular = -(player.temperature - 0.5) * 2; // i.e. 0 and 1 = 1, 0.5 = 0;
                else player.temperatureCircular = (player.temperature - 0.5) * 2; // i.e. 0 and 1 = 1, 0.5 = 0;
                player.temperatureChangeRateScale += frameCounter * player.temperatureChangeRateFrameCounterScale;
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
                                        xDistanceFromLight = light.cell.centerXY[0] - cell.centerXY[0],
                                        yDistanceFromLight = light.cell.centerXY[1] - cell.centerXY[1],
                                        // eliminating need for function call to Math.max
                                        diffusionOrDistanceIsGreater,
                                        xOrYDistanceIsGreater = xDistanceFromLight;
                                if (xDistanceFromLight < 0) xDistanceFromLight = -xDistanceFromLight;
                                if (yDistanceFromLight < 0) yDistanceFromLight = -yDistanceFromLight;
                                if (yDistanceFromLight > xDistanceFromLight) xOrYDistanceIsGreater = yDistanceFromLight;
                                if (distanceFromLight > light.coreRadius) diffusionOrDistanceIsGreater = distanceFromLight;
                                else diffusionOrDistanceIsGreater = light.coreRadius;
                                if (diffusionOrDistanceIsGreater < 0) diffusionOrDistanceIsGreater = 1;
                                if (light.oscillator) lightOscillatorValue = light.oscillator.value;
                                // Math.max is a function
                                //brightness = light.radius / Math.max(light.coreRadius, distanceFromLight) * lightOscillatorValue * light.brightness;
                                brightness = light.radius / (diffusionOrDistanceIsGreater + light.radius / light.diffusion) * lightOscillatorValue * 255 * light.brightness;
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
                            //brightness = light.radius / Math.max(light.coreRadius, distanceFromLight) * lightOscillatorValue * light.brightness;
                            darkness = xDistanceFromShadow * 10;
                            if (darkness < 0) darkness = 0;
                            for (var aa = 0; aa < 3; aa++) {
                                cell.color[aa] -= darkness;
                                if (cell.color[aa] < 0) cell.color[aa] = 0;
                            }
                        }
                        if (cell.coordinates[1] < shadow.coordinates[1]) {
                            var yDistanceFromShadow = cell.coordinates[1] - shadow.coordinates [1];
                            if (yDistanceFromShadow < 0) yDistanceFromShadow = -yDistanceFromShadow;
                            // Math.max is a function
                            //brightness = light.radius / Math.max(light.coreRadius, distanceFromLight) * lightOscillatorValue * light.brightness;
                            darkness = yDistanceFromShadow * 10;
                            if (darkness < 0) darkness = 0;
                            for (var ab = 0; ab < 3; ab++) {
                                cell.color[ab] -= darkness;
                                if (cell.color[ab] < 0) cell.color[ab] = 0;
                            }
                        }
                    }
                }
                for (var ac = 0; ac < 3; ac++) {
                        cell.color[ac] /= settings.entities.shadows.length + 1;
                }*/
                //////////////////////////////////////////////////////////////////////////////////
                // end FUNCTION showShadows(cell);
                //////////////////////////////////////////////////////////////////////////////////
                //////////////////////////////////////////////////////////////////////////////////
                // start FUNCTION normalizeBrightnesses(cell); // make the darkest cell black and lightest cell white
                //////////////////////////////////////////////////////////////////////////////////
                if (cell.color[0] > drawingSettings.brightestBrightnessThisFrame || !drawingSettings.brightestBrightnessThisFrame) {
                                drawingSettings.brightestBrightnessThisFrame = cell.color[0];
                }
                if (cell.color[0] < drawingSettings.dimmestBrightnessThisFrame || !drawingSettings.dimmestBrightnessThisFrame) {
                                drawingSettings.dimmestBrightnessThisFrame = cell.color[0];
                }
                if (drawingSettings.normalizeBrightnesses) {
                    drawingSettings.brightnessRangeLastFrame = drawingSettings.brightestBrightnessLastFrame - drawingSettings.dimmestBrightnessLastFrame;
                    var normCurrent = cell.color[0],
                        normPara, // parametric value of current cell brightness relative to the max-to-min range of brightnesses from last frame
                        normDim = drawingSettings.dimmestBrightnessLastFrame,
                        normBright = drawingSettings.brightestBrightnessLastFrame,
                        normRange; // range of brightness from dimmmest to brightest last frame, used as 0-1 for this frame
                    if (drawingSettings.brightestBrightnessLastFrame > 255) normBright = 255;
                    if (normCurrent < normDim) normCurrent = 0;
                    else normCurrent = normCurrent - normDim;
                    normDim *= (normBright / normDim) * drawingSettings.darkStretchScale; // lowers contrast and creates more greys, fewer blacks
                    normRange = normBright - normDim;
                    normPara = normCurrent / normRange;
                    if (drawingSettings.brightnessRangeLastFrame) {
                        for (var ak = 0; ak < 3; ak++) cell.color[ak] *= normPara;
                    }
                    //if (cell.index === 2000 && frameCounter % 20 === 0) console.log(para);
                }
                /*var currentBrightness = averageBrightness(cellsArray[j].color),
                        currentCellParametricBrightness = (currentBrightness - darkestBrightness) / brightnessRange;
                newBrightness = darkestValue + brightestValue * currentCellParametricBrightness;
                cellsArray[j].color = [newBrightness, newBrightness, newBrightness];
                finalizeCellColorAndDrawCell(cellsArray[i]);
        }*/
                //////////////////////////////////////////////////////////////////////////////////
                // end FUNCTION normalizeBrightnesses(cell);
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
                // start FUNCTION brightnessToSpectrum(cell);
                //////////////////////////////////////////////////////////////////////////////////
                //greyscale becomes rainbow if drawingSettings.greyScaleToSpectrum is 'true'
                //receives a number between 0 and 1, inclusively and converts it to a hue.
                // if HIGH_EQUALS_BLUE: Value 0 = red, val 0.25 = yellow, val 0.5 = green, val 0.75 = cyan, val 1 = blue
                if (drawingSettings.greyscaleToSpectrum) {
                                var cellAverageBrightnessForGreyScaleToSpectrum = cell.color[0]; // because everything's grey right now, this is the cell's average brightness
                                if (cellAverageBrightnessForGreyScaleToSpectrum > 255) cellAverageBrightnessForGreyScaleToSpectrum = 255;
                                cellAverageBrightnessForGreyScaleToSpectrum /= 255; // normalize the value
                                // FUNCTION WARNING Math.abs()
                                if (drawingSettings.blueIsHot) {
                                        if (cellAverageBrightnessForGreyScaleToSpectrum <= 0.25) {                            //anywhere from red to yellow
                                                cell.color = [255, (255 * (cellAverageBrightnessForGreyScaleToSpectrum * 4)), 0];
                                        }
                                        if (cellAverageBrightnessForGreyScaleToSpectrum > 0.25 && cellAverageBrightnessForGreyScaleToSpectrum <= 0.5) {             //anywhere from yellow to green
                                                cell.color = [Math.abs((255 * (cellAverageBrightnessForGreyScaleToSpectrum - 0.5)) * 4), 255, 0];     //the R cellAverageBrightnessForGreyScaleToSpectrum should be 0 for input 0.5 and 1 for input 0.25.
                                        }
                                        if (cellAverageBrightnessForGreyScaleToSpectrum > 0.5 && cellAverageBrightnessForGreyScaleToSpectrum <= 0.75) {
                                                cell.color = [0, 255, (255 * ((cellAverageBrightnessForGreyScaleToSpectrum - 0.5) * 4))];    //anywhere  from green to cyan
                                        }
                                        if (cellAverageBrightnessForGreyScaleToSpectrum > 0.75 && cellAverageBrightnessForGreyScaleToSpectrum <= 1) {             //anywhere from yellow to green
                                                cell.color = [0, Math.abs((255 * (cellAverageBrightnessForGreyScaleToSpectrum - 1) * 4)), 255];    //the G cellAverageBrightnessForGreyScaleToSpectrum should be 0 for input 0.5 and 1 for input 0.25.
                                        }
                                } else {
                                        if (cellAverageBrightnessForGreyScaleToSpectrum <= 0.25) {                            //anywhere from blue to cyan
                                                cell.color = [0, (255 * (cellAverageBrightnessForGreyScaleToSpectrum * 4)), 255];
                                        }
                                        if (cellAverageBrightnessForGreyScaleToSpectrum > 0.25 && cellAverageBrightnessForGreyScaleToSpectrum <= 0.5) {             //anywhere from cyan to green
                                                cell.color = [0, 255, Math.abs((255 * (cellAverageBrightnessForGreyScaleToSpectrum - 0.5)) * 4)];     //the B cellAverageBrightnessForGreyScaleToSpectrum should be 0 for input 0.5 and 1 for input 0.25.
                                        }
                                        if (cellAverageBrightnessForGreyScaleToSpectrum > 0.5 && cellAverageBrightnessForGreyScaleToSpectrum <= 0.75) {
                                                cell.color = [(255 * ((cellAverageBrightnessForGreyScaleToSpectrum - 0.5) * 4)), 255, 0];    //anywhere from green to yellow
                                        }
                                        if (cellAverageBrightnessForGreyScaleToSpectrum > 0.75 && cellAverageBrightnessForGreyScaleToSpectrum <= 1) {             //anywhere from yellow to red
                                                cell.color = [255, Math.abs((255 * (cellAverageBrightnessForGreyScaleToSpectrum - 1) * 4)), 0];    //the G cellAverageBrightnessForGreyScaleToSpectrum should be 0 for input 0.5 and 1 for input 0.25.
                                        }                
                                }
                }
                //////////////////////////////////////////////////////////////////////////////////
                // end FUNCTION brightnessToSpectrum(cell);
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
                            if (player.damageWarningUntil > frameCounter) {
                                    for (var ai = 0; ai < 3; ai++) cell.color[ai] = 2047 * player.damageOscillator.value;
                                } else for (var ah = 0; ah < 3; ah++) cell.color[ah] = 255 * (player.health / player.maxHealth);
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
                                for (var ae = 0; ae < 3; ae++) cell.color[ae] = 255 * player.temperature;
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
                                    if (a === 1) cell.color[a] = 255 * player.temperature;
                                    if (a === 2) cell.color[a] = 1023 * (1 - player.temperature);
                                }
                            } else {
                                // if in spectrum mode
                                for (var ad = 0; ad < 3; ad++) cell.color[ad] = 255 * player.temperature;
                            }
                        }
                    }
                    // temperature damage threshold indicators
                    // heat damage threshold indicator
                    if (
                        cell.coordinates[0] >= (canvas.width * (player.heatDamageThreshold - 0.5)) / cellSize && cell.coordinates[0] <= (canvas.width * (player.heatDamageThreshold - 0.5)) / cellSize + canvas.width * 0.024 / cellSize &&
                        cell.coordinates[1] <= -((cellsPerColumn / 2) - (0.036 * canvasHeight / cellSize))
                    ) {
                        if (!drawingSettings.greyscaleToSpectrum) {
                            cell.color = [255, 64, 24];
                        } else for (var ag = 0; ag < 3; ag++) cell.color[ag] = player.heatDamageThreshold * 255;
                    }
                    // cold damage threshold indicator
                    if (
                        cell.coordinates[0] <= -(canvas.width * (0.5 - player.coldDamageThreshold) / cellSize) && cell.coordinates[0] >= -(canvas.width * (0.5 - player.coldDamageThreshold) / cellSize) - (canvas.width * 0.024 / cellSize) &&
                        cell.coordinates[1] <= -((cellsPerColumn / 2) - (0.036 * canvasHeight / cellSize))
                    ) {
                        if (!drawingSettings.greyscaleToSpectrum) {
                            cell.color = [0, 128, 255];
                        } else for (var af = 0; af < 3; af++) cell.color[af] = player.coldDamageThreshold * 255;
                    }
                }
                //////////////////////////////////////////////////////////////////////////////////
                // end FUNCTION updateHUD(cell);
                //////////////////////////////////////////////////////////////////////////////////
                //////////////////////////////////////////////////////////////////////////////////
                // start FUNCTION addNoiseToCellColor(cell);
                //////////////////////////////////////////////////////////////////////////////////
                if (drawingSettings.noise.addNoise) {
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
                //////////////////////////////////////////////////////////////////////////////////
                // end FUNCTION addNoiseToCellColor(cell);
                //////////////////////////////////////////////////////////////////////////////////
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
                //////////////////////////////////////////////////////////////////////////////////
                // end FUNCTION finalizeCellColorAndDrawCell(cell);
                //////////////////////////////////////////////////////////////////////////////////
        }
        //////////////////////////////////////////////////////////////////////////////////
        // end FUNCTION drawAllCells(cell);
        //////////////////////////////////////////////////////////////////////////////////
        // these next four lines are for the normalizeBrightnesses "function"
        drawingSettings.brightestBrightnessLastFrame = drawingSettings.brightestBrightnessThisFrame;
        drawingSettings.dimmestBrightnessLastFrame = drawingSettings.dimmestBrightnessThisFrame;
        drawingSettings.brightestBrightnessThisFrame = 0;
        drawingSettings.dimmestBrightnessThisFrame = 255;
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
                        randomCoreRadius = randomNumberBetweenNumbers(lightSettings.minCoreRadius, lightSettings.maxCoreRadius, true),
                        randomDiffusion = randomNumberBetweenNumbers(lightSettings.minDiffusion, lightSettings.maxDiffusion, false),
                        randomDeathChance = randomNumberBetweenNumbers(lightSettings.minDeathChance, lightSettings.maxDeathChance, false),
                        allCellsList = lightSettings.parentCellsArray,
                        randomFramesBetweenMovements = randomNumberBetweenNumbers(lightSettings.minFramesBetweenMovements, lightSettings.maxFramesBetweenMovements, true),
                        randomDirectionNumber = Math.round(Math.random() * 7);
                randomDirection = allDirections[3];
                if (Math.random() > 0.5) randomXY[0] = randomNumberBetweenNumbers(1, 0.5 * cellsPerRow, true);
                else randomXY[0] = -randomNumberBetweenNumbers(1, 0.5 * cellsPerRow, true);
                if (Math.random() > 0.5) randomXY[1] = randomNumberBetweenNumbers(1, 0.5 * cellsPerColumn, true);
                else randomXY[1] = -randomNumberBetweenNumbers(1, 0.5 * cellsPerColumn, true);
                destinationArray.push(makeLight(randomBrightness, randomRadius, randomXY, randomOscillator, randomCoreRadius, randomDiffusion, randomFramesBetweenMovements, randomDirectionNumber, randomDirectionChangeChance, randomDeathChance, allCellsList, destinationArray));
        }
}

//WRONG the "make" functions should be in initialization.js (I don't want to move them till everything else is stable)
function makeLight(brightness, radius, coordinates, oscillator, coreRadius, diffusion, framesBetweenMovements, movementDirection, directionChangeChance, deathChance, allCellsList, lightsArray) {
        var light = {
                'brightness': brightness,
                'radius': radius,
                'coreRadius': coreRadius,
                'diffusion': diffusion,
                'oscillator': oscillator,
                'deathChance': deathChance,
                'parentCellsArray': allCellsList, // large cellsList of which light's cell is a part
                'entityParentArray': lightsArray, // lights array
                'coordinates': coordinates,
                'framesBetweenMovements': framesBetweenMovements,
                'movementDirection': movementDirection, // 0-7 because it got weirdly broken to try to use the allDirecitons array
                'directionChangeChance': directionChangeChance,
                'cell': allCellsList[coordinatesToIndex(coordinates)],
                'cellIndex': coordinatesToIndex(coordinates),
                'entityType': 'light',
                'personality': settings.lightPersonalities[5]/*
                    (arrayOfRandomNumbers[randomNumberIndex] * (settings.lightPersonalities.length - 1)) -
                    (arrayOfRandomNumbers[randomNumberIndex] * (settings.lightPersonalities.length - 1)) % 1
                ]*/
        };
        if (randomNumberIndex < arrayOfRandomNumbers.length) randomNumberIndex++;
        else randomNumberIndex = 0;
        return light;
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
