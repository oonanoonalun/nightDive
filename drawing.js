function drawAllCells(cellsArray) {
        for (var i = 0; i < cellsArray.length; i++) {
                var cell = cellsArray[i];
                getCellColor20180108(cell, cells);
                // reticle is tinted
                if (interfaceSettings.showReticle) {
                        if (interfaceSettings.reticleCenterCells.indexOf(cell) !== -1) cell.color = addColors(cell.color, [0, 0, 0]);
                        if (interfaceSettings.reticleOuterCornerCells.indexOf(cell) !== -1) cell.color = addColors(cell.color, [0, 0, 0]);
                        if (interfaceSettings.reticleFarOuterCornerCells.indexOf(cell) !== -1) cell.color = addColors(cell.color, [128, 0, 0]);
                }
                // player light
                if (interfaceSettings.showPlayerLight) {
                        var playerLight = interfaceSettings.playerLight,
                                distanceFromPlayerLight = findDistanceBetweenPoints(cell.centerXY, playerLight.centerXY),
                                brightness;
                        brightness = playerLight.radius / Math.max(playerLight.diffusion, distanceFromPlayerLight) * /*playerLight.oscillator.value **/ playerLight.brightness;
                        cell.color = addColors(cell.color, [brightness * 0, brightness * 0, brightness]);
                }
        }
        // DON'T DELETE THIS--it's important even if it's commented out (the 'noramlizeCellsArrayBrightnessRange' line)
        //normalizeCellsArrayBrightnessRange(cellsArray, 0, 255);
        // final steps for drawing the cells and making sure its color is valid
        for (var j = 0; j < cellsArray.length; j++) {
                cellsArray[j].color = toHexColor(capColorBrightness(cellsArray[j].color, [255, 255, 255]));
                context.fillStyle = cellsArray[j].color;
                context.fillRect(cellsArray[j].left, cellsArray[j].top, cellsArray[j].size, cellsArray[j].size);
        }
}

function getCellColor20180108(cell, allCellsList) {
        var brightness;
        cell.color = [0, 0, 0];
        // applying lights
        if (settings.entities.lights.length > 0) {
                for (var i = 0; i < settings.entities.lights.length; i++) {
                        var light = settings.entities.lights[i],
                                distanceFromLight = findDistanceBetweenPoints(cell.centerXY, light.cell.centerXY);
                        brightness = light.radius / Math.max(light.diffusion, distanceFromLight) * light.oscillator.value * light.brightness;
                        cell.color = addColors(cell.color, [brightness, brightness, brightness]);
                }
        }
        cell.color = divideColorByNumber(cell.color, settings.entities.lights.length + 1);
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
        };
        return light;
}

function makePlayerLight(brightness, radius, diffusion, allCellsList) {
        var centerUpperLeftCellIndex = (totalNumberOfCells / 2) + (cellsPerRow / 2);
        var playerLight = {
                'brightness': brightness,
                'radius': radius,
                'diffusion': diffusion,
                'oscillator': makeOscillator(3000, 0, SINE, 'playerLightOscillator'),
                'parentCellsArray': allCellsList, // large cellsList of which light's cell is a part
                'centerXY': [allCellsList[centerUpperLeftCellIndex].left + allCellsList[0].size, allCellsList[centerUpperLeftCellIndex].top + allCellsList[0].size]
        };
        interfaceSettings.playerLight = playerLight;        
}


function updateLight(light) {
        // possible death
        if (Math.random() <= light.deathChance && light.oscillator.value < 0.1) {
                var lightsArrayIndex = light.lightParentArray.indexOf(light);
                light.lightParentArray.splice(lightsArrayIndex, 1);
        }
        // reticle kills lights
        
        // update location
        light.cell = light.parentCellsArray[light.cellIndex];
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
        }
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
