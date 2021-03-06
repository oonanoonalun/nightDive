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
                'spectrumHotColor': [255, 160, 80],
                'spectrumMedColor': [0, 255, 0],
                'spectrumColdColor': [64, 96, 255],
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
        //////////////
        // game type diurnal updates
        //////////////
        // day counter, daily events, things that happen at midnight
        if (settings.game.diurnal.on && frameCounter % settings.game.diurnal.duration === 0) {
            settings.game.diurnal.dayCounter++;
            settings.game.diurnal.noon = frameCounter + settings.game.diurnal.duration / 2;
            settings.game.diurnal.midnight = frameCounter + settings.game.diurnal.duration;
            if (frameCounter !== 0) {
                // it becomes easier to get too hot or cold
                //player.maxHeatGainRate *= player.dailyMaxGainLossRateIncreaseScale;
                //player.maxHeatLossRate *= player.dailyMaxGainLossRateIncreaseScale;
                if (player.heatDamageThreshold > 0.65) player.heatDamageThreshold = (11 - settings.game.diurnal.dayCounter) * 0.1;
                if (player.coldDamageThreshold < 0.35) player.coldDamageThreshold = (settings.game.diurnal.dayCounter - 1) * 0.1;
            }
        }
        // day cycle clock
        settings.game.diurnal.timeOfDayNormalized = (frameCounter % settings.game.diurnal.duration) / settings.game.diurnal.duration; // 0 and 1 are midnight
        //////////////
        // end game type diurnal updates
        //////////////
        // if our array of random numbers has been used up during the last loop, reset it;
        if (randomNumberIndex > arrayOfRandomNumbers.length - 1) {
            randomNumberIndex = 0;
            console.log('randomNumberIndex is larger than arrayOfRandomNumbers.length, but it is being reset to 0.');
        }
        ///////////////////////////////////////////////////////////////////////////////////////////////////
        // start FUNCTION controls();
        ///////////////////////////////////////////////////////////////////////////////////////////////////
        if (keysDown[KEY_W]) interfaceSettings.cameraMovingUp = true;
        else interfaceSettings.cameraMovingUp = false;
        if (keysDown[KEY_S]) interfaceSettings.cameraMovingDown = true;
        else interfaceSettings.cameraMovingDown = false;
        if (keysDown[KEY_A]) interfaceSettings.cameraMovingLeft = true;
        else interfaceSettings.cameraMovingLeft = false;
        if (keysDown[KEY_D]) interfaceSettings.cameraMovingRight = true;
        else interfaceSettings.cameraMovingRight = false;
        if (keysDown[KEY_SPACE] && player.energy > 0) interfaceSettings.energyBeingUsed = true;
        else interfaceSettings.energyBeingUsed = false;
        ///////////////////////////////////////////////////////////////////////////////////////////////////
        // end FUNCTION controls();
        ///////////////////////////////////////////////////////////////////////////////////////////////////
        ///////////////////////////////////////////////////////////////////////////////////////////////////
        // start FUNCTION gameSettings(); // i.e. turning gametypes and associated behaviors on and off
        ///////////////////////////////////////////////////////////////////////////////////////////////////
        /////////////////
        // start ambient temperature update
        ///////////////
        if (settings.game.ambientTemperature.noChangeUntil <= frameCounter ||
            !settings.game.ambientTemperature.noChangeUntil) {
                if (settings.game.diurnal.on) {
                    // should have temperature lag (look it up re: heat and times of day) so that
                    //      0.29 on the timeOfDay is the coolest, and 0.625 is the warmest.
                    //      https://en.wikipedia.org/wiki/Diurnal_temperature_variation#Temperature_lag
                    // this is just syncing the ambient temp to the time of day
                    if (settings.game.diurnal.timeOfDayNormalized < 0.5) {
                        settings.game.ambientTemperature.current = settings.game.diurnal.timeOfDayNormalized * 2;
                    } else settings.game.ambientTemperature.current = 2 - settings.game.diurnal.timeOfDayNormalized * 2;
                    // this commented-out line below makes the impact of time of day on ambient temperature more extreme.
                    //settings.game.ambientTemperature.scale = settings.game.diurnal.timeOfDayNormalized;
                    // limiting max and min ambient temperatures
                    // WRONG: it would be better to have the temp cycle smoothly between max and min
                    if (settings.game.ambientTemperature.current > settings.game.ambientTemperature.max) {
                        settings.game.ambientTemperature.current = settings.game.ambientTemperature.max;
                    }
                    if (settings.game.ambientTemperature.current < settings.game.ambientTemperature.min) {
                        settings.game.ambientTemperature.current = settings.game.ambientTemperature.min;
                    }
                    // OLD
                    // time of day affects ambient temperature
                    // UGH! Percariously balanced by hand to make natural times of day's peak and low temperatures (3pm-ish and 7am-ish)
                    // sync with what happens here.
                    /*var oClock = settings.game.diurnal.timeOfDayNormalized; // coldest at 0.29 o'clock (7am), warmest at 0.625 (3pm) in .timeOfDayNormalized
                    // oClock is < 0.625 and > 0.29, i.e. if it's after the coldest part of the day, and before the warmest, ambient temperature is increasing.
                    // cooling phase part I (broken up because the normalizing clock crosses 0 during cooling)
                    if (oClock <= 0.29) {
                        // GOOD, working. Good temp at midnight (about 0.25), at min temp of 0.25 right on the dot at 0.29 oClock (7am)
                        settings.game.ambientTemperature.current =
                        settings.game.ambientTemperature.min + 0.11 - oClock / 3 *
                        settings.game.ambientTemperature.scale;
                        // starts at about 0.35 (a good temp for midnight/oClock 0) when oClock is 0.29 (7am). Gets us down to min temp of 0.25 by oClock 0.29 (7am).
                    }
                    // cooling phase part II
                    if (oClock >= 0.625) {
                        settings.game.ambientTemperature.current =
                        settings.game.ambientTemperature.min + 0.5 + (0.625 / 0.96) - oClock / 0.96 *
                        settings.game.ambientTemperature.scale;
                    }
                    // warming phase
                    if (oClock > 0.29 && oClock < 0.625) { // if it's after the warmest point in the day and before the coldest, ambient temperature is decreasing.
                        // this needs to pick up from the <= 0.29 bit of code at min temp (0.25), and carry us to 0.75
                        // oClock will be at 0.29 when this starts, so we need (pseudo-code):
                        // initial start state = temp of min of 0.25
                        // this rate reaching oClock = 0.625 = temp max of 0.75
                        settings.game.ambientTemperature.current = settings.game.ambientTemperature.min + oClock * 1.5 - (0.29 * 1.5);
                        // this balances out to start at temp min of 0.25, and arrive at 0.75 temp (max) by 0.625 clock (3pm, hottest point in the day)
                    }*/
                    // EVEN OLDER
                    // could not work out the math on this one, but the basic info is there to actually do this right.
                    /*var decreasingTempDuration = 1 - 0.625 + 0.29, // 0.665 i.e. for how long, in normalized clock time, is the ambient temperature cooling
                        increasingTempDuration = 0.625 - 0.29, // 0.335 i.e. for how long, in normalized clock time, is the ambient temperature warming
                        coolingStretch = decreasingTempDuration / 0.5,
                        heatingScrunch = increasingTempDuration / 0.5,
                        oClock = settings.game.diurnal.timeOfDayNormalized; // coldest at 0.29 o'clock (7am), warmest at 0.625 (3pm) in .timeOfDayNormalized
                    // if it's after the warmest point in the day and before the coldest, ambient temperature is decreasing.
                    if (oClock >= 0.625 || oClock <= 0.29) {
                        settings.game.ambientTemperature.current =
                        settings.game.ambientTemperature.min +
                        ((settings.game.ambientTemperature.max - settings.game.ambientTemperature.min) *
                        coolingStretch * ((oClock - (1 - 0.29)) % 1) * settings.game.ambientTemperature.scale);
                    } else { // oClock is < 0.625 and > 0.29, i.e. if it's after the coldest part of the day, and before the warmest, ambient temperature is increasing.
                        settings.game.ambientTemperature.current =
                        settings.game.ambientTemperature.min +
                        ((settings.game.ambientTemperature.max - settings.game.ambientTemperature.min) *
                        heatingScrunch * (oClock - 0.625 % 1) * settings.game.ambientTemperature.scale);
                    }*/
                }
                settings.game.ambientTemperature.noChangeUntil = frameCounter + settings.game.ambientTemperature.intervalBetweenUpdates;
            }
        ////////////////
        // end ambient temperature update
        //////////////////
        //////////////////
        // game cycle updates
        //////////////////
        if (settings.game.individualPersonalities.cycle) {
            if (settings.game.individualPersonalities.notOnUntil === frameCounter) {
                settings.game.individualPersonalities.on = true;
                settings.game.individualPersonalities.notOffUntil = frameCounter + settings.game.individualPersonalities.framesOn;
            }
            if (settings.game.individualPersonalities.notOffUntil === frameCounter) {
                settings.game.individualPersonalities.on = false;
                settings.game.individualPersonalities.notOnUntil = frameCounter + settings.game.individualPersonalities.framesOff;
            }
        }
        if (settings.game.slipperySlope.cycle) {
            if (settings.game.slipperySlope.notOnUntil === frameCounter) {
                settings.game.slipperySlope.on = true;
                settings.game.slipperySlope.notOffUntil = frameCounter + settings.game.slipperySlope.framesOn;
            }
            if (settings.game.slipperySlope.notOffUntil === frameCounter) {
                settings.game.slipperySlope.on = false;
                settings.game.slipperySlope.notOnUntil = frameCounter + settings.game.slipperySlope.framesOff;
            }
        }
        if (settings.game.race.cycle) {
            if (settings.game.race.notOnUntil === frameCounter) {
                settings.game.race.on = true;
                settings.game.race.notOffUntil = frameCounter + settings.game.race.framesOn;
            }
            if (settings.game.race.notOffUntil === frameCounter) {
                settings.game.race.on = false;
                settings.game.race.notOnUntil = frameCounter + settings.game.race.framesOff;
            }
        }
        ///////////////////////////////////////////////////////////////////////////////////////////////////
        // end FUNCTION gameSettings();
        ///////////////////////////////////////////////////////////////////////////////////////////////////
        ///////////////////////////////////////////////////////////////////////////////////////////////////
        // start FUNCTION updateEntities(); (includes camera movement)
        ///////////////////////////////////////////////////////////////////////////////////////////////////
        // WARNING This is some kludgy shit because looping over object properties is apparently a pain or at least obscure in js.
        // Manual updates needed for added entity types.
        for (var aj = 0; aj < settings.entities.length; aj++) {
            var entityArray;
            if (aj === 0) entityArray = settings.entities.lights;
            if (aj === 1) entityArray = settings.entities.shadows;
            if (aj === 2) entityArray = settings.entities.lightLines;
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
                if (interfaceSettings.cameraMovingUp) entityYCellsMoveNextFrame -= interfaceSettings.cellsPerMove;
                if (interfaceSettings.cameraMovingDown) entityYCellsMoveNextFrame += interfaceSettings.cellsPerMove;
                if (interfaceSettings.cameraMovingLeft) entityXCellsMoveNextFrame += interfaceSettings.cellsPerMove;
                if (interfaceSettings.cameraMovingRight) entityXCellsMoveNextFrame -= interfaceSettings.cellsPerMove;
                // self-movement
                if (settings.game.individualPersonalities.on && entity.entityType === 'light') {                    
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
                }
                // movement toward hot players and away from cool players.
                // doesn't function if push back ability is being used
                if (settings.game.slipperySlope.on && entity.entityType === 'light') {
                    if (!(player.energyBeingUsed && player.abilities.pushBack)) {
                        if (player.temperature >= 0.5 && frameCounter % 2 === 0) {// && frameCounter % (player.temperature * 3 - player.temperature *3 % 1) === 0) {
                            if (entity.coordinates[0] < 0) entityXCellsMoveNextFrame += 1;//player.temperature * 3 - player.temperature *3 % 1;
                            else entityXCellsMoveNextFrame -= 1;//player.temperature * 3 - player.temperature *3 % 1;
                            if (entity.coordinates[1] < 0) entityYCellsMoveNextFrame += 1;//player.temperature * 3 - player.temperature *3 % 1;
                            else entityYCellsMoveNextFrame -= 1;//player.temperature * 3 - player.temperature *3 % 1;
                        }
                        if (player.temperature < 0.5 && frameCounter % 2 === 0) {// && frameCounter % (player.temperature * 3 - player.temperature * 3 % 1) === 0) {
                            if (entity.coordinates[0] < 0) entityXCellsMoveNextFrame -= 1;//player.temperature * 3 - player.temperature *3 % 1;
                            else entityXCellsMoveNextFrame += 1;//player.temperature * 3 - player.temperature *3 % 1;
                            if (entity.coordinates[1] < 0) entityYCellsMoveNextFrame -= 1;//player.temperature * 3 - player.temperature *3 % 1;
                            else entityYCellsMoveNextFrame += 1;//player.temperature * 3 - player.temperature *3 % 1;
                        }
                    }
                }
                // misc. movement/behavior experiments
                if (settings.game.race.on && entity.entityType === 'light') {
                    entityYCellsMoveNextFrame -= 1;
                    if (frameCounter % 3 === 0) {
                        if (entity.coordinates[0] < 0) entityXCellsMoveNextFrame -= 1;
                        else entityXCellsMoveNextFrame += 1;
                    }
                }
                // push back ability's effects
                if (interfaceSettings.energyBeingUsed && player.abilities.pushBack && entity.entityType === 'light') {
                    var xPushBackAmount,
                        yPushBackAmount;
                    if (((cellsPerRow / 2) / entity.coordinates[0]) - ((cellsPerRow / 2) / entity.coordinates[0] % 1) > (player.abilities.maxPushBackAmount / cellSize)) xPushBackAmount = player.abilities.maxPushBackAmount / cellSize;
                    else xPushBackAmount = ((cellsPerRow / 2) / entity.coordinates[0]) - ((cellsPerRow / 2) / entity.coordinates[0] % 1);
                    if (((cellsPerColumn / 2) / entity.coordinates[1]) - ((cellsPerColumn / 2) / entity.coordinates[1] % 1) > (player.abilities.maxPushBackAmount / cellSize)) yPushBackAmount = player.abilities.maxPushBackAmount / cellSize;
                    else yPushBackAmount = ((cellsPerColumn / 2) / entity.coordinates[1]) - ((cellsPerColumn / 2) / entity.coordinates[1] % 1);
                    entityXCellsMoveNextFrame += xPushBackAmount;
                    entityYCellsMoveNextFrame += yPushBackAmount;
                }
                // FINAL STEPS to translate move amounts into coordinate changes
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
        // Maybe put this back in, but Math.sin() is a function.
        //if (osc.waveShape === SINE) osc.value = Math.sin(osc.value);
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
                if (interfaceSettings.centerCellsAverageBrightness > 255) interfaceSettings.centerCellsAverageBrightnessCapped = 255;
                else interfaceSettings.centerCellsAverageBrightnessCapped = interfaceSettings.centerCellsAverageBrightness;
                /*var ambientTempInfluence = 1;
                // factoring in ambient tmperature based on time of day
                if (settings.game.diurnal.on && settings.game.ambientTemperature) {
                    ambientTempInfluence = settings.game.ambientTemperature.current;
                    if (ambientTempInfluence >= 0.5) ambientTempInfluence *= 2 * settings.game.ambientTemperature.scale;
                    else ambientTempInfluence *= (ambientTempInfluence * (1 / ambientTempInfluence / 2)) * settings.game.ambientTemperature.scale;
                }
                var heatGainRate = interfaceSettings.centerCellsAverageBrightness * ambientTempInfluence * player.heatingScale * player.temperatureChangeRateScale * ((interfaceSettings.centerCellsAverageBrightness - player.brightness) / 255),
                        heatLossRate = interfaceSettings.centerCellsAverageBrightness * ambientTempInfluence * player.coolingScale * player.temperatureChangeRateScale * ((player.brightness - interfaceSettings.centerCellsAverageBrightness) / 255);
                
                // limiting rate of heat gain or loss
                if (heatGainRate > player.maxHeatGainRate) heatGainRate = player.maxHeatGainRate;
                if (heatLossRate > player.maxHeatLossRate) heatLossRate = player.maxHeatLossRate;
                */
                // i.e. player.max...rate * normalized fraction of 255 that's the difference between the player brightness and the center cells' brighteness
                heatGainRate = player.maxHeatGainRate * ((interfaceSettings.centerCellsAverageBrightnessCapped - player.brightness) / 255);
                heatLossRate = player.maxHeatLossRate * ((player.brightness - interfaceSettings.centerCellsAverageBrightnessCapped) / 255);
                // if the center cells (and ambient temp, if settings.game.diurnal is on) are cooler than the player
                if (interfaceSettings.centerCellsAverageBrightness <= player.brightness) {
                    player.temperature -= heatLossRate;
                    player.currentTemperatureChangeRate = -heatLossRate;
                } else { // if the center cells are warmer than the player
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
        drawingSettings.noise.globalNoiseScale = (
            player.temperatureCircular * player.temperatureNoiseScale +
            player.coldDamageThreshold + (1 - player.heatDamageThreshold)
        );
        if (player.temperature < player.heatDamageThreshold) drawingSettings.noise.redNoise = player.heatDamageThreshold - player.temperature;
        else drawingSettings.noise.redNoise = 0;
        drawingSettings.noise.greenNoise = player.temperatureCircular * (0.5 * player.heatDamageThreshold - player.coldDamageThreshold);
        if (player.temperature > player.coldDamageThreshold) drawingSettings.noise.blueNoise = player.temperature - player.coldDamageThreshold;
        else drawingSettings.noise.blueNoise = 0;
        //////////////////////////////////////////////////////////////////////////////////
        // end FUNCTION updateNoise(); // updating the screen noise
        //////////////////////////////////////////////////////////////////////////////////
        //////////////////////////////////////////////////////////////////////////////////
        // start FUNCTION updatePlayerHealth() and updatePlayerEnergy(), part 1 (part 2 is per-cell updates to health that affect drawing)
        //////////////////////////////////////////////////////////////////////////////////
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
                    player.health < player.maxHealth &&
                    !player.died
                ) {
                        player.health += player.healthRegenerationAmount;
                        player.noHealthRegenUntil = frameCounter + player.healthRegenerationInterval; // just to keep you from getting more than one helath bump in the 50ms window that opens up to make sure you don't miss it altogether.
                }
                // energy use
                // is the "player.energyJustDepleted" thing inelegant/kludgy?
                if (interfaceSettings.energyBeingUsed) player.energy -= player.energyUseRate;
                if (player.energy < 0) player.energy = 0;
                if (player.energy === 0 && !player.energyJustDepleted) {
                    player.noEnergyRegenUntil = frameCounter + player.delayBeforeEnergyRegenUponDepletion;
                    player.energyJustDepleted = true;
                }
                // energy regen
                if (
                    frameCounter % player.intervalBetweenEnergyRegenUpdates === 0 &&
                    player.energy < player.maxEnergy &&
                    (player.noEnergyRegenUntil <= frameCounter || !player.noEnergyRegenUntil)
                ) {
                    player.energy += player.energyRegenerationAmount;
                    if (player.energyJustDepleted) player.energyJustDepleted = false;
                }
        //////////////////////////////////////////////////////////////////////////////////
        // end FUNCTION update health and energy, part 1 (part 2 is per-cell updates to health that affect drawing)
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
                                        lightCoreOrDistanceIsGreater = light.coreRadius;
                                if (distanceFromLight > light.coreRadius) lightCoreOrDistanceIsGreater = distanceFromLight;
                                if (lightCoreOrDistanceIsGreater < 0) lightCoreOrDistanceIsGreater = 1;
                                if (light.oscillator) lightOscillatorValue = light.oscillator.value;
                                // Math.max is a function
                                //brightness = light.radius / Math.max(light.coreRadius, distanceFromLight) * lightOscillatorValue * light.brightness;
                                brightness = light.radius / (lightCoreOrDistanceIsGreater + light.radius / light.diffusion) * lightOscillatorValue * 255 * light.brightness;
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
                // start FUNCTION showLightLines(cell);
                //////////////////////////////////////////////////////////////////////////////////
                if (settings.entities.lightLines.length > 0) {
                    for (var ap = 0; ap < settings.entities.lightLines.length; ap++) { // for each light line
                        var lightLine = settings.entities.lightLines[ap],
                            lightLineBrightness;
                        if (randomNumberIndex + lightLine.length > arrayOfRandomNumbers.length) randomNumberIndex = 0; // making sure random number index doesn't overshoot durring this loop
                        for (var aq = 0; aq < lightLine.length; aq++) { // for each cell in the light line
                            if (
                                (cell.coordinates[0] === lightLine.coordinates[0] + (0.5 * aq) ||
                                cell.coordinates[0] === lightLine.coordinates[0] - (0.5 * aq)) && // on either side of line coordinats
                                cell.coordinates[1] < lightLine.coordinates[1] // one-sided
                            ) {
                                var distanceToLightLineCoords = (lightLine.coordinates[1] - cell.coordinates[1]) * cellSize,
                                    lightLineNoise = lightLine.noiseFactor,
                                    lightLineOscillatorValue = 1;
                                lightLineNoise *= (1 - player.energy / player.maxEnergy) * 4;
                                if (lightLine.oscillator) lightLineOscillatorValue = lightLine.oscillator.value;
                                if (distanceToLightLineCoords < 0) distanceToLightLineCoords = -distanceToLightLineCoords;
                                lightLineBrightness =
                                    ((lightLine.range * lightLineOscillatorValue) - distanceToLightLineCoords) /
                                    lightLine.range * lightLine.brightness -
                                    (arrayOfRandomNumbers[randomNumberIndex] * lightLineNoise * (lightLine.oscillator.value + 0.5))// *
                                    //lightLine.oscillator.value
                                ;
                                randomNumberIndex++;
                                if (lightLineBrightness < 0) lightLineBrightness = 0;
                                //if (frameCounter % 100 === 0) console.log(distanceToLightLineCoords);
                                for (var ar = 0; ar < 3; ar++) cell.color[ar] -= lightLineBrightness;
                            }
                        }
                    }
                }
                //////////////////////////////////////////////////////////////////////////////////
                // end FUNCTION showLightLines(cell);
                //////////////////////////////////////////////////////////////////////////////////
                /////////
                // apply ambient temperature to cell brightness
                ////////
                // separated into colors rather than a for loop in case we want to make some color shifts based on ambient temperature
                cell.color[0] *= settings.game.ambientTemperature.current * settings.game.ambientTemperature.scale;
                cell.color[1] *= settings.game.ambientTemperature.current * settings.game.ambientTemperature.scale;
                cell.color[2] *= settings.game.ambientTemperature.current * settings.game.ambientTemperature.scale;
                //////////////////////////////////////////////////////////////////////////////////
                // start FUNCTION normalizeBrightnesses(cell); // make the darkest cell black and lightest cell white
                // note: this is usually off
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
                                        if (cellAverageBrightnessForGreyScaleToSpectrum > 0.75 && cellAverageBrightnessForGreyScaleToSpectrum <= 1) {             //anywhere from cyan to blue
                                                cell.color = [0, Math.abs((255 * (cellAverageBrightnessForGreyScaleToSpectrum - 1) * 4)), 255];    //the G cellAverageBrightnessForGreyScaleToSpectrum should be 0 for input 0.5 and 1 for input 0.25.
                                        }
                                }
                                if (!drawingSettings.blueIsHot && !drawingSettings.muteSpectralTones) {
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
                                if (settings.game.diurnal.on) {
                                    // capping brightness
                                    for (var at = 0; at < 3; at++) {
                                        if (cell.color[at] > 255) cell.color[at] = 255;
                                    }
                                    // pretty good cheap, simple approximation of original effect. Not much yellow, deep blue is too blue.
                                    //cell.color[2] = 255 - cell.color[2];
                                    //if (cell.color[0] <= 127) cell.color[1] = cell.color[0] * 2;
                                    //else cell.color[1] = cell.color[2] * 2;
                                    var hotCol0 = drawingSettings.spectrumHotColor[0],
                                        hotCol1 = drawingSettings.spectrumHotColor[1],
                                        hotCol2 = drawingSettings.spectrumHotColor[2],
                                        medCol0 = drawingSettings.spectrumMedColor[0],
                                        medCol1 = drawingSettings.spectrumMedColor[1],
                                        medCol2 = drawingSettings.spectrumMedColor[2],
                                        coldCol0 = drawingSettings.spectrumColdColor[0],
                                        coldCol1 = drawingSettings.spectrumColdColor[1],
                                        coldCol2 = drawingSettings.spectrumColdColor[2],
                                        normCol = cell.color[0] / 255,
                                        targetColor = [
                                            (coldCol0 * (1 - normCol)) + (hotCol0 * normCol),
                                            (coldCol1 * (1 - normCol)) + (hotCol1 * normCol),
                                            (coldCol2 * (1 - normCol)) + (hotCol2 * normCol)
                                        ];
                                    // WRONG this doesn't need to be declared here, and not every frame. Just here for convenience right now.
                                    //settings.game.diurnal.duration = 350; // 3600 frames is two minutes at 30 fps
                                    // 1800 frames (or about a minute) to get to target color
                                    // rising sun
                                    if (frameCounter < settings.game.diurnal.noon) {
                                        cell.color[0] += (targetColor[0] - cell.color[0]) * settings.game.diurnal.timeOfDayNormalized * 2;
                                        cell.color[1] += (targetColor[1] - cell.color[1]) * settings.game.diurnal.timeOfDayNormalized * 2;
                                        cell.color[2] += (targetColor[2] - cell.color[2]) * settings.game.diurnal.timeOfDayNormalized * 2;
                                        //if (frameCounter % 10 === 0 && cell.index === 2000) console.log('rising ' + settings.game.diurnal.timeOfDayNormalized.toFixed(2));
                                    }
                                    // setting sun
                                    else {
                                        cell.color[0] += (targetColor[0] - cell.color[0]) * (1 - ((settings.game.diurnal.timeOfDayNormalized - 0.5) * 2));
                                        cell.color[1] += (targetColor[1] - cell.color[1]) * (1 - ((settings.game.diurnal.timeOfDayNormalized - 0.5) * 2));
                                        cell.color[2] += (targetColor[2] - cell.color[2]) * (1 - ((settings.game.diurnal.timeOfDayNormalized - 0.5) * 2));
                                        //if (frameCounter % 10 === 0 && cell.index === 2000) console.log('setting ' + settings.game.diurnal.timeOfDayNormalized.toFixed(2));
                                    }
                                    //cell.color[0] = (coldCol0 * (1 - normCol)) + (hotCol0 * normCol);
                                    //cell.color[1] = (coldCol1 * (1 - normCol)) + (hotCol1 * normCol);
                                    //cell.color[2] = (coldCol2 * (1 - normCol)) + (hotCol2 * normCol);
                                        
                                    /*if (normCol <= 0.5) {
                                        cell.color[0] = (coldCol0 * (1 - normCol * 2)) + (medCol0 * (2 * normCol));
                                        cell.color[1] = (coldCol1 * (1 - normCol * 2)) + (medCol1 * (2 * normCol));
                                        cell.color[2] = (coldCol2 * (1 - normCol * 2)) + (medCol2 * (2 * normCol));
                                    } else {
                                       cell.color[0] = (medCol0 * ((normCol - 1) * -2)) + (hotCol0 * (normCol * 2 - 1));
                                       cell.color[1] = (medCol1 * ((normCol - 1) * -2)) + (hotCol1 * (normCol * 2 - 1));
                                       cell.color[2] = (medCol2 * ((normCol - 1) * -2)) + (hotCol2 * (normCol * 2 - 1));
                                    }*/
                                    
                                    /*cell.color[0] = (coldCol0 * ((normCol - 1) * -2)) + (hotCol0 * normCol * 2 - 1);
                                    cell.color[1] = (coldCol1 * ((normCol - 1) * -2)) + (hotCol1 * normCol * 2 - 1);
                                    cell.color[2] = (coldCol2 * ((normCol - 1) * -2)) + (hotCol2 * normCol * 2 - 1);*/
                                    
                                    /*cell.color[0] = (coldCol0 * (1 - normCol * 2)) + (hotCol0 * normCol * 2 - 1);
                                    cell.color[1] = (coldCol1 * (1 - normCol * 2)) + (hotCol1 * normCol * 2 - 1);
                                    cell.color[2] = (coldCol2 * (1 - normCol * 2)) + (hotCol2 * normCol * 2 - 1);*/
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
                                    cell.color[0] = 1024 * (1 - player.health / player.maxHealth);
                                    cell.color[1] = 384 * (player.health / player.maxHealth);
                                    cell.color[2] = 0;
                                }
                        } else {
                            // if in spectrum mode
                            if (player.damageWarningUntil > frameCounter) {
                                    for (var ai = 0; ai < 3; ai++) cell.color[ai] = 2047 * player.damageOscillator.value;
                            } else for (var ah = 0; ah < 3; ah++) cell.color[ah] = 255 * (player.health / player.maxHealth);
                        }
                    }
                    // energy bar
                    // if cell is on the right edge, 2 cells wide at 800x600
                    if (
                        cell.coordinates[0] >=
                        player.energyBarXPositionPolarity * (cellsPerRow / 2 - (canvas.width * 0.024 / cellSize) * player.energyBarWidthScale) &&
                        // and its y coordinate is at or under the y location that corresponds to parametric player.energy * parametric screen height
	        cell.coordinates[1] <= -(cellsPerColumn / 2) + (player.energy / player.maxEnergy * player.energyBarMaxLength * cellsPerColumn)
	    ) {
                        if (!drawingSettings.greyscaleToSpectrum) {
                        // if in greyScale
                        // make the cell scale from yellow to blue based on player energy
                            cell.color[0] = 255 * (1 - player.health / player.maxEnergy);
                            cell.color[1] = 255 * (1 - player.health / player.maxEnergy);
                            cell.color[2] = 1024 * (player.energy / player.maxEnergy);
                        } else {
                            // if in spectrum mode
                            for (var ao = 0; ao < 3; ao++) cell.color[ao] = 255 * (player.energy / player.maxEnergy);
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
                        cell.coordinates[0] >= (canvas.width * (player.heatDamageThreshold - 0.5)) / cellSize && cell.coordinates[0] <= canvas.width * (player.heatDamageThreshold - 0.5) / cellSize + (canvas.width * 0.024 / cellSize) && // NOTE: this being 0.02*7* here, and the comparable figure in the cold version being 0.02*4* is deliberate and important. Sometimes the hot threshold indicator was too thin.
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
                    // diurnal clock WRONG-ish. Only works properly at 800 x 600
                    if (settings.game.diurnal.on) {
                        // indentation f'd up
                                if (settings.game.diurnal.timeOfDayNormalized <= 0.25) {
                                    // settings.game.diurnal.clockColor = [ // use this as target color to blend into
                                    //     radial clock cells depending on how close settings.game.diurnal.timeOfDay is to them.
                                    settings.game.diurnal.clockColor = [
                                        0,
                                        1023 * settings.game.diurnal.timeOfDayNormalized,
                                        255 - (1023 * settings.game.diurnal.timeOfDayNormalized)
                                    ];
                                    //cell.color[0] = 0;
                                    //cell.color[1] = 1023 * settings.game.diurnal.timeOfDayNormalized;
                                    //cell.color[2] = 255 - (1023 * settings.game.diurnal.timeOfDayNormalized);
                                }
                                if (settings.game.diurnal.timeOfDayNormalized > 0.25 && settings.game.diurnal.timeOfDayNormalized <= 0.5) {
                                    settings.game.diurnal.clockColor = [
                                        1023 * (settings.game.diurnal.timeOfDayNormalized - 0.25),
                                        255 - (1023 * (settings.game.diurnal.timeOfDayNormalized - 0.25)),
                                        0
                                    ];
                                    //cell.color[0] = 1023 * (settings.game.diurnal.timeOfDayNormalized - 0.25);
                                    //cell.color[1] = 255 - (1023 * (settings.game.diurnal.timeOfDayNormalized - 0.25));
                                    //cell.color[2] = 0;
                                }
                                if (settings.game.diurnal.timeOfDayNormalized > 0.5 && settings.game.diurnal.timeOfDayNormalized <= 0.75) {
                                    settings.game.diurnal.clockColor = [
                                        255 - (255 * (settings.game.diurnal.timeOfDayNormalized - 0.5)),
                                        1023 * (settings.game.diurnal.timeOfDayNormalized - 0.5),
                                        0
                                    ];
                                    //cell.color[0] = 255 - (1023 * (settings.game.diurnal.timeOfDayNormalized - 0.5));
                                    //cell.color[1] = 1023 * (settings.game.diurnal.timeOfDayNormalized - 0.5);
                                    //cell.color[2] = 0;
                                }
                                if (settings.game.diurnal.timeOfDayNormalized > 0.75 && settings.game.diurnal.timeOfDayNormalized <= 1) {
                                    settings.game.diurnal.clockColor = [
                                        0,
                                        255 - ((settings.game.diurnal.timeOfDayNormalized - 0.75) * 1023),
                                        1023 * (settings.game.diurnal.timeOfDayNormalized - 0.75)
                                    ];
                                    //cell.color[0] = 0;
                                    //cell.color[1] = 255 - ((settings.game.diurnal.timeOfDayNormalized - 0.75) * 1023);
                                    //cell.color[2] = 1023 * (settings.game.diurnal.timeOfDayNormalized - 0.75);
                                }
                        // clock
                        if (cell.clock || cell.clock === 0) {
                            if (cell.clock === 'centerCross') {
                                for (var av = 0; av < 3; av++) {
                                    cell.color[av] = cell.color[av] * 0.5 + settings.game.diurnal.clockColor[av] * 0.75;
                                }
                                //cell.color = settings.game.diurnal.clockColor;
                            }
                            else {
                                var greaterClockValue = cell.clock,
                                    lesserClockValue = settings.game.diurnal.timeOfDayNormalized;
                                if (cell.clock < settings.game.diurnal.timeOfDayNormalized) {
                                    greaterClockValue = settings.game.diurnal.timeOfDayNormalized;
                                    lesserClockValue = cell.clock;
                                }
                                for (var au = 0; au < 3; au++) {
                                   if (
                                       (settings.game.diurnal.timeOfDayNormalized <
                                       cell.clock + 0.1 &&
                                       settings.game.diurnal.timeOfDayNormalized >
                                       cell.clock - 0.1)
                                   ) {
                                        cell.color[au] = (
                                        cell.color[au] * 0.5 + 0.5 *
                                        settings.game.diurnal.clockColor[au]
                                        );
                                   }
                                   if (
                                       (settings.game.diurnal.timeOfDayNormalized <
                                       cell.clock + 0.06 &&
                                       settings.game.diurnal.timeOfDayNormalized >
                                       cell.clock - 0.06)
                                   ) {
                                        cell.color[au] = settings.game.diurnal.clockColor[au] * 1.33 + 64;
                                   }
                                }
                            }
                        }
                    }
                }
                //////////////////////////////////////////////////////////////////////////////////
                // end FUNCTION updateHUD(cell);
                //////////////////////////////////////////////////////////////////////////////////
                //////////////////////////////////////////////////////////////////////////////////
                // start FUNCTION addNoiseToCellColor(cell);
                //////////////////////////////////////////////////////////////////////////////////
                // keeping shadows from creating negative color values. Just before adding noise, which should be the last color step.
                for (var as = 0; as < 3; as++) {
                    if (cell.color[as] < 0) cell.color[as] = 0;
                }
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
                // start FUNCTION updatePlayerHealth(); part 2 (cell coloring)
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
                        // if in spectrum mode, screen brightnes on taking heat damage and dims on taking cold damage
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
                                // FUNCTION calls here (.now() & .toFixed()), but it runs very rarely, at a time when framerate doesn't matter. I can't do this with frames because framerate will vary.
                                console.log('You died on Day ' + settings.game.diurnal.dayCounter + '.' + (100 * settings.game.diurnal.timeOfDayNormalized.toFixed(2)).toFixed(0) + '.');
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
                'oscillator': null,//oscillator,
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
