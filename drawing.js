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
                        'minMsBetweenNoiseChanges': 1500,
                        'maxMsBetweenNoiseChanges': 5000
                },
                'normalizeBrightnesses': false, // requires a second pass over all the cells, necessarily (as it checks their relative brightnesses after all their brightnesses have been assigned), and so slows things down.
                'displayResolutionInformation': false
};

function drawAllCells(cellsArray) {
        for (var i = 0; i < cellsArray.length; i++) {
                var cell = cellsArray[i];
                getCellColor(cell);
                if (!drawingSettings.normalizeBrightnesses) finalizeCellColorAndDrawCell(cell);
        }
        if (drawingSettings.normalizeBrightnesses) normalizeCellsArrayBrightnessRange(cellsArray, 0, 255); // requires a second pass over all the cells, necessarily (as it checks their relative brightnesses after all their brightnesses have been assigned), and so slows things down.
}


function getCellColor(cell) {
        showLights(cell);
}

function showLights(cell) {
        cell.color = [0, 0, 0];
        var brightness;
        if (settings.entities.lights.length > 0) {
                for (var i = 0; i < settings.entities.lights.length; i++) {
                        var light = settings.entities.lights[i],
                                distanceFromLight = findDistanceBetweenPoints(cell.centerXY, light.cell.centerXY),
                                lightOscillatorValue;
                        if (light.oscillator) lightOscillatorValue = light.oscillator.value;
                        else lightOscillatorValue = 1;
                        brightness = light.radius / Math.max(light.diffusion, distanceFromLight) * lightOscillatorValue * light.brightness;
                        cell.color = addColors(cell.color, [brightness, brightness, brightness]);
                }
                cell.color = divideColorByNumber(cell.color, settings.entities.lights.length + 1);
        }
        if (drawingSettings.noise.addNoise) {
                cell.color = addNoiseToColor(
                        cell.color,
                        drawingSettings.noise.redNoise,
                        drawingSettings.noise.greenNoise,
                        drawingSettings.noise.blueNoise,
                        drawingSettings.noise.globalNoiseScale,
                        drawingSettings.noise.minMsBetweenNoiseChanges,
                        drawingSettings.noise.maxMsBetweenNoiseChanges
                );
        }
}

function finalizeCellColorAndDrawCell(cell) {
        cell.color = toHexColor(capColorBrightness(cell.color, [255, 255, 255]));
        context.fillStyle = cell.color;
        context.fillRect(cell.left, cell.top, cell.size, cell.size);
}

function addNoiseToColor(color, redNoiseAmount, greenNoiseAmount, blueNoiseAmount, globalNoiseScale, minMsBetweenNoiseChanges, maxMsBetweenNoiseChanges) {
        if (drawingSettings.noNoiseChangeUntil <= Date.now() || !drawingSettings.noNoiseChangeUntil) {
                var rNoise = 1 - redNoiseAmount * Math.random() * globalNoiseScale,
                        gNoise = 1 - greenNoiseAmount * Math.random() * globalNoiseScale,
                        bNoise = 1 -blueNoiseAmount * Math.random() * globalNoiseScale,
                        noiseColorScale = [rNoise, gNoise, bNoise],
                        noiseColor = [];
                for (var i = 0; i < 3; i++) {
                        noiseColor[i] = color[i] * noiseColorScale[i];
                }
                drawingSettings.noNoiseChangeUntil = minMsBetweenNoiseChanges + Math.random() * (maxMsBetweenNoiseChanges - minMsBetweenNoiseChanges);
                return noiseColor;
        }
}

function makeRandomLights(numberOfLights, randomLightParametersObject, destinationArray, oscillatorsArray) {
        var lightSettings = randomLightParametersObject;
        for (var i = 0; i < numberOfLights; i++) {
                var randomBrightness = randomNumberBetweenNumbers(lightSettings.minBrightness, lightSettings.maxBrightness, true),
                        randomRadius = randomNumberBetweenNumbers(lightSettings.minRadius, lightSettings.maxRadius, true),
                        randomCellIndex = randomNumberBetweenNumbers(lightSettings.minCellIndex, lightSettings.maxCellIndex, true),
                        randomOscillator = oscillatorsArray[randomNumberBetweenNumbers(0, (oscillatorsArray.length - 1), true)],
                        randomDiffusion = randomNumberBetweenNumbers(lightSettings.minDiffusion, lightSettings.maxDiffusion, true),
                        randomDeathChance = randomNumberBetweenNumbers(lightSettings.minDeathChance, lightSettings.maxDeathChance, false),
                        allCellsList = lightSettings.parentCellsArray;
                destinationArray.push(makeLight(randomBrightness, randomRadius, randomCellIndex, randomOscillator, randomDiffusion, randomDeathChance, allCellsList, destinationArray));
        }
}

//WRONG the "make" functions should be in initialization.js (I don't want to move them till everything else is stable)
function makeLight(brightness, radius, cellIndex, oscillator, diffusion, deathChance, allCellsList, lightsArray) {
        var light = {
                'brightness': brightness,
                'radius': radius,
                'diffusion': diffusion,
                'oscillator': oscillator,
                'deathChance': deathChance,
                'parentCellsArray': allCellsList, // large cellsList of which light's cell is a part
                'lightParentArray': lightsArray, // lights array
                'cellIndex': cellIndex,
                'cell': allCellsList[cellIndex],
                'coordinates': allCellsList[cellIndex].coordinates
        };
        return light;
}

function updateLight(light) {
        // possible death
        if (Math.random() <= light.deathChance && light.oscillator.value < 0.1) {
                var lightsArrayIndex = light.lightParentArray.indexOf(light);
                light.lightParentArray.splice(lightsArrayIndex, 1);
        }
        // lights move away from center when player is cooler, toward it when warmer
        if (settings.gameType === GAME_TYPE_ICARUS) temperatureMovesLightsIcarus(light);
        // update location
        light.cell = light.parentCellsArray[coordinatesToIndex(light.coordinates)]; // this light's cell become whatever cell has this light's coordinates
        //light.cell = light.parentCellsArray[light.cellIndex];
}

function temperatureMovesLightsIcarus(light) {
        // WRONG Delay between light movements and how they scale off the player's temperature
        //      should be light properties. Maybe based on their brightness and/or diffusion?
        //      Could make the number of cells moved in the moveEntity calls below scale off of something.
        // WRONG should work out a way for things to move toward a given point.
        // WRONG Number of cells moved should scale with resolution, or you should be able to send pixels
        //      to moveEntity and have it translate them to cells at the current resolution.
        if (light.noTemperatureMoveUntil <= Date.now() || !light.noTemperatureMoveUntil) {
                if (light.coordinates[1] > 0) { // i.e. cell is in the UPPER HALF
                        if (player.temperature < 0.5) moveEntity(light, UP, 1); // cool players repel lights
                        if (player.temperature >= 0.5) moveEntity(light, DOWN, 1); // hot players attract lights
                }
                if (light.coordinates[1] < 0) { // i.e. cell is in the LOWER HALF
                        if (player.temperature < 0.5) moveEntity(light, DOWN, 1); // cool players repel lights
                        if (player.temperature >= 0.5) moveEntity(light, UP, 1); // hot players attract lights                        
                }
                if (light.coordinates[0] < 0) { // i.e. cell is in the LEFT HALF
                        if (player.temperature < 0.5) moveEntity(light, LEFT, 1); // cool players repel lights
                        if (player.temperature >= 0.5) moveEntity(light, RIGHT, 1); // hot players attract lights                        
                }
                if (light.coordinates[0] > 0) { // i.e. cell is in the RIGHT HALF
                        if (player.temperature < 0.5) moveEntity(light, RIGHT, 1); // cool players repel lights
                        if (player.temperature >= 0.5) moveEntity(light, LEFT, 1); // hot players attract lights                        
                }
                light.noTemperatureMoveUntil = Date.now() + Math.max(200, (500 - (player.temperatureCircular * 500))); // WRONG MAYBE maybe light brightness and/or diffusion should figure into how fast they move?
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

function updateOscillator(oscillator) {
        // WRONG missing decreasing square wave?
        var osc = oscillator;
        if (osc.waveShape !== SAW || SQUARE) {
                if ((Date.now() + osc.phaseShift) % osc.period < osc.halfPeriod) osc.value = ((Date.now() + osc.phaseShift) % osc.halfPeriod) / osc.halfPeriod;
                else osc.value = 1 - (((Date.now() + osc.phaseShift) % osc.halfPeriod) / osc.halfPeriod);
        }
        if (osc.waveShape === SAW) osc.value = ((Date.now() + osc.phaseShift) % osc.period) / osc.period;
        if (osc.waveShape === SINE) osc.value = Math.sin(osc.value);
        if (osc.waveShape === SQUARE) {
                if (Date.now() + osc.phaseShift % osc.period < osc.halfPeriod) osc.value = 0;
                else osc.value = 1;
        }
        // if osc.waveShape === TRI, do nothing
}

function updateOscillators(arrayOfOscillators) {
        for (var i = 0; i < arrayOfOscillators.length; i++) updateOscillator(arrayOfOscillators[i]);
}

function updateNoise() {
        drawingSettings.noise.globalNoiseScale = player.temperatureCircular * player.temperatureNoiseScale;
        drawingSettings.noise.redNoise = 1 - player.temperature;
        drawingSettings.noise.greenNoise = player.temperatureCircular * 0.5;
        drawingSettings.noise.blueNoise = player.temperature;
}

function logPlayerTemperature(displayInterval) {
        if (Date.now() % displayInterval < 50 && (player.noTemperatureLoggingUntil <= Date.now() || !player.noTemperatureLoggingUntil)) {
                console.log('Temperature: ' + player.temperature.toFixed(2));
                player.noTemperatureLoggingUntil = Date.now() + 100; // just keeps it from logging a few times during the necessarily non-tiny window.
        }
}

function updatePlayer() {
        player.temperature = settings.oscillators[settings.oscillators.length - 1].value;
        player.temperatureCircular = Math.abs((player.temperature - 0.5) * 2); // i.e. 0 and 1 = 1, 0.5 = 0;
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

function showPlayerLight(cell) {
        var playerLight = interfaceSettings.playerLight,
                distanceFromPlayerLight = findDistanceBetweenPoints(cell.centerXY, playerLight.centerXY),
                brightness;
        brightness = playerLight.radius / Math.max(playerLight.diffusion, distanceFromPlayerLight) * /*playerLight.oscillator.value **/ playerLight.brightness; // WRONG I don't know why the oscillator's not working here
        cell.color = addColors(cell.color, [brightness, brightness, brightness]);       
}

function findDistanceBetweenPoints(xyArray1, xyArray2) {
        xDistance = xyArray1[0] - xyArray2[0];
        yDistance = xyArray1[1] - xyArray2[1];
        distance = Math.sqrt(xDistance * xDistance + yDistance * yDistance);
        return distance;
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
