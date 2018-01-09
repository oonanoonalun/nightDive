function drawAllCells(cellsArray) {
        for (var i = 0; i < cellsArray.length; i++) {
                var cell = cellsArray[i];
                getCellColor20180108(cell, cells);
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
                'cell': allCellsList[cellIndex]
        };
        return light;
}


function updateLight(light) {
        // possible death
        if (Math.random() <= light.deathChance && light.oscillator.value < 0.1) {
                var lightsArrayIndex = light.lightParentArray.indexOf(light);
                light.lightParentArray.splice(lightsArrayIndex, 1);
        }
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

function moveEntity(entity, direction, numberOfCells) {
        var index = entity.cellIndex;
        if (direction === UP || direction === UP_LEFT || direction === UP_RIGHT) {
                if (index < cellsPerRow) { // if it's on the top edge
                        index += (numberOfCells * cellsPerRow) + (totalNumberOfCells - cellsPerRow);
                } else {
                        index -= numberOfCells * cellsPerRow;
                }
        }
        if (direction === DOWN || direction === DOWN_LEFT || direction === DOWN_RIGHT) {
                if (index >= totalNumberOfCells - cellsPerRow) { // i.e. if it's on the bottom edge
                        index -= totalNumberOfCells - (cellsPerRow - (numberOfCells * cellsPerRow));
                } else {
                        index += numberOfCells * cellsPerRow;
                }                
        }
        if (direction === LEFT || direction === UP_LEFT || direction === DOWN_LEFT) {
                if (index === 0 || index % cellsPerRow === 0) { // if it's on the left edge
                        index += cellsPerRow - numberOfCells;
                } else {
                        index -= numberOfCells;
                }                    
        }
        if (direction === RIGHT || direction === UP_RIGHT || direction === DOWN_RIGHT) {
                if (cellsPerRow % index === 1) { // if it's on the right edge
                        index -= cellsPerRow - numberOfCells;
                } else {
                        index += numberOfCells;
                }                  
        }
        entity.cellIndex = index;
}

function moveArrayOfEntities(arrayOfEntities, direction, numberOfCells) {
        // NOTE: the setting.entities property is an OBJECT. To move everything in it using this function as it is now, you
        //      will/would have to push the contents of all the arrays that are properties of 'settings.entities' to a single array,
        //      send each array to this function individually, or learn how to automate grabbing successive properties' values,
        //      which I don't know how to do.
        for (var i = 0; i < arrayOfEntities.length; i++) {
                var entity = arrayOfEntities[i];
                moveEntity(entity, direction, numberOfCells);
        }
}

function makeOscillator(period, phase, waveShape, name) {
        // WRONG should have a 'phaseWanderingScale' property with an update that maybe gives the phase a 'wandering velocity'
        var osc = {
                'period': period,
                'value': 0,
                'phase': phase,
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
        var osc = oscillator,
                phaseShift = osc.phase * osc.period;
        if (osc.waveShape !== SAW || SQUARE) {
                if ((Date.now() + phaseShift) % osc.period < osc.halfPeriod) osc.value = ((Date.now() + phaseShift) % osc.halfPeriod) / osc.halfPeriod;
                else osc.value = 1 - (((Date.now() + phaseShift) % osc.halfPeriod) / osc.halfPeriod);
        }
        if (osc.waveShape === SAW) osc.value = ((Date.now() + phaseShift) % osc.period) / osc.period;
        if (osc.waveShape === SINE) osc.value = Math.sin(osc.value);
        if (osc.waveShape === SQUARE) {
                if (Date.now() + phaseShift % osc.period < osc.halfPeriod) osc.value = 0;
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
