//DRAWING CELLS

function getCellColor20180108(cell, allCellsList) {
        var brightness;
        // applying lights
        if (settings.entities.lights.length > 0) {
                for (var i = 0; i < settings.entities.lights.length; i++) {
                        var light = settings.entities.lights[i],
                                distanceFromLight = findDistanceBetweenPoints(cell.centerXY, light.cell.centerXY);
                        brightness = light.radius / distanceFromLight * light.oscillator.value * light.brightness;
                }
        }
        cell.color = [brightness, brightness, brightness];
}

function makeLight(brightness, radius, cellIndex, oscillator, allCellsList) {
        var light = {
                'brightness': brightness,
                'radius': radius,
                'oscillator': oscillator,
                'parentCellsArray': allCellsList,
                'cellIndex': cellIndex,
                'cell': allCellsList[cellIndex]
        };
        return light;
}

function updateLight(light) {
        // update location
        light.cell = light.parentCellsArray[light.cellIndex];
}

function updateLights(arrayOfLights) {
        for (var i = 0; i < arrayOfLights.length; i++) updateLight(arrayOfLights[i]);       
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
        var osc = {'period': period, 'value': 0, 'phase': phase, 'waveShape': waveShape, 'name': name};
        osc.halfPeriod = 0.5 * osc.period;
        return osc;
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

function normalizeCellsArrayBrightnessRange(cellsArray, darkestValue, brightestValue) {
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
