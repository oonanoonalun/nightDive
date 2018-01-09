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
                'cellIndex': cellIndex,
                'cell': allCellsList[cellIndex]
        };
        return light;
}

function updateLight(light) {
        if (Math.random() < 0.2) moveEntity(light, DOWN);
}

function updateLights(arrayOfLights) {
        for (var i = 0; i < arrayOfLights.length; i++) updateLight(arrayOfLights[i]);       
}

function moveEntity(entity, direction) {
        var index = entity.cellIndex;
        if (direction === UP || direction === UP_LEFT || direction === UP_RIGHT) {
                if (index < cellsPerRow) {
                        index += totalNumberOfCells - cellsPerRow;
                } else {
                        index -= cellsPerRow;
                }
        }
        if (direction === DOWN || direction === DOWN_LEFT || direction === DOWN_RIGHT) {
                if (index >= totalNumberOfCells - cellsPerRow) {
                        index -= totalNumberOfCells - cellsPerRow;
                } else {
                        index += cellsPerRow;
                }                
        }
        if (direction === LEFT || direction === UP_LEFT || direction === DOWN_LEFT) {
                if (index % cellsPerRow === 0) {
                        index += totalNumberOfCells - cellsPerColumn;
                } else {
                        index -= cellsPerColumn;
                }                   
        }
        if (direction === RIGHT || direction === UP_RIGHT || direction === DOWN_LEFT) {
                if (cellsPerRow % index === 1) {
                        index -= totalNumberOfCells - cellsPerColumn;
                } else {
                        index += cellsPerColumn;
                }                  
        }
        entity.cellIndex = index;
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
                /////////
                //cellsArray[i].color = getCellColor20180106(cellsArray[i]);
                // just trying make larger-scale patterns, with a cell's color drawing on a wider swath of other cells as influence. But really, the influence of cells should be weighted with distance.
                //var averageBrightnessOfNearbyCells = getAverageBrightnessOfCellsInRadiusOfCell(cellsArray[i], cellsArray, 150);
                /*for (var k = 0; k < 3; k++) {
                        cellsArray[i].color[k] = (cellsArray[i].color[k] + averageBrightnessOfNearbyCells) / 2;
                }*/
                //varyCellBrightnessBasedOnProximityToEmittersAndDampers(cellsArray[i], modifierCells);
                //////////
        }
        // DON'T DELETE THIS--it's important even if it's commented out (the 'noramlizeCellsArrayBrightnessRange' line)
        //normalizeCellsArrayBrightnessRange(cellsArray, 0, 255);
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

function getNeighborsAverageCycleLength(cell) {
        neighborsAveragedCycleLenghts = 0;
        for (var i = 0; i < cell.neighbors.length; i++) {
                neighborsAveragedCycleLenghts += cell.neighbors[i].cycleLength;
        }
        return neighborsAveragedCycleLenghts /= cell.neighbors.length;
}

function blendCycleLengths(cellsList) {
        for (var i = 0; i < cellsList.length; i++) {
                cellsList[i].cycleLength = (cellsList[i].cycleLength + getNeighborsAverageCycleLength(cells[i])) / 2;
        }
}

function updateModifierCells(modifierCellsList, chanceToMove) {
        for (var i = 0; i < modifierCellsList.length; i++) {
                var modCell = modifierCellsList[i];
                // life cycle
                //      being born
                /*if (Date.now() <= modCell.beingBornUntil) {
                        var birthingDuration = modCell.beingBornUntil - modCell.createdAt;
                        modCell.radius = modCell.maxRadius * Math.sin(((Date.now() - modCell.createdAt) / birthingDuration));
                        modCell.intensity = modCell.maxIntensity * Math.sin(((Date.now() - modCell.createdAt) / birthingDuration));
                }
                //      living
                if (Date.now() <= modCell.notDyingUntil && Date.now() > modCell.beingBornUntil) {
                        modCell.radius = modCell.maxRadius;
                        modCell.intensity = modCell.maxIntensity;
                        // WRONG radius and intensity should flicker
                }
                //      dying
                if (Date.now() <= modCell.notDeadUntil && Date.now() > modCell.notDyingUntil) {
                        var dyingDuration = modCell.notDeadUntil - modCell.notDyingUntil;
                        modCell.radius = modCell.maxRadius * Math.sin(((modCell.notDeadUntil - Date.now()) / dyingDuration));
                        modCell.intensity = modCell.maxIntensity * Math.sin(((modCell.notDeadUntil - Date.now()) / dyingDuration));       
                }
                //      dead
                if (Date.now() >= modCell.notDeadUntil) {
                        modifierCells.splice(i, 1);
                        console.log(modifierCells);
                }*/
                // movement
                if (Math.random() <= chanceToMove) {
                        // if it moves, assign the cells modifier information to a random one of its neighbors, then...
                        var randomNeighborIndex = Math.round(Math.random() * (modCell.neighbors.length - 1)),
                                newModCell = modCell.neighbors[randomNeighborIndex];
                        newModCell.radius = modCell.radius;
                        newModCell.intensity = modCell.intensity;
                        newModCell.beingBornUntil = modCell.beingBornUntil;
                        newModCell.notDyingUntil = modCell.notDyingUntil;
                        newModCell.notDeadUntil = modCell.notDeadUntil;
                        newModCell.modifierType = modCell.modifierType;
                        modCell.modifierType = null; // I don't think this is necessary, but it will be clearer to look at.
                        // ... add the neighbor (the new modCell) to the modifier cells array, and remove the old one from that array
                        modifierCellsList.push(newModCell);
                        modifierCellsList.splice(i, 1);
                }
                // spawn new modifiers in place of ones that have died
                if (modifierCells.length < 40) {
                        var emitters = [],
                                dampers = [];
                        for (var j = 0; j < modifierCells.length; j++) {
                                if (modifierCells[j].modifierType === EMITTER) emitters.push(modifierCells[j]);
                                if (modifierCells[j].modifierType === DAMPER) dampers.push(modifierCells[j]);
                        }
                        if (emitters.length <= dampers.length) {
                                if (Math.random() < 0.02) assignEmitter(cells, 20, 25, 100, 1.1, 1.5, 2000, 6000, 4000, 20000, 5000, 15000);
                                else if (Math.random() < 0.02) assignDamper(cells, 20, 25, 100, 1.1, 1.5, 2000, 6000, 4000, 20000, 5000, 15000);
                        }
                }
        }
}

function varyCellBrightnessBasedOnProximityToEmittersAndDampers(cell, modifierCellsList) {
        for (var i = 0; i < modifierCellsList.length; i++) {
                var modCell = modifierCellsList[i],
                        distanceBetweenCells = findDistanceBetweenPoints(modCell.centerXY, cell.centerXY);
                // if emiiter
                if (modCell.modifierType === EMITTER && distanceBetweenCells <= modCell.radius) {
                        var emitter = modCell,
                                emitterBrightnessScalingFactor = emitter.intensity * Math.min(2, emitter.radius / distanceBetweenCells),
                                randomPeriod = 7000,
                                halfRandomPeriod = randomPeriod * 0.5;
                        /*if (Date.now() % randomPeriod < 100) randomPeriod = 7000 + Math.random() * 21000;
                        if (Date.now() % randomPeriod < halfRandomPeriod) emitterBrightnessScalingFactor = ((Date.now() % halfRandomPeriod) / halfRandomPeriod) * 2;
                        else emitterBrightnessScalingFactor = ((3500 - Date.now() % 3500) / 3500) * 2;*/
                        cell.color = multiplyColorByNumber(cell.color, emitterBrightnessScalingFactor);                      
                }
                // if damper
                if (modCell.modifierType === DAMPER && distanceBetweenCells <= modCell.radius) {
                        var damper = modCell,
                                damperBrightnessScalingFactor = damper.intensity * Math.sin(distanceBetweenCells / damper.radius);
                        cell.color = multiplyColorByNumber(cell.color, damperBrightnessScalingFactor);
                }
        }
}

// BROKEN not working
function movePage(allCellsList, chanceToMove) {
        // NOTE WRONG: This is repeating some code for finding rows and columns that's already written better in the findNeighbors function. It would be better to expose the sorting into columns and rows to anything that wants to use it, rather than making it private to findNeighbors.
        // NOTE WRONG: This only works for moving downward.
        if (Math.random() < chanceToMove) {
                var newCellsArray = [];
                for (var j = 0; j < cellsPerRow; j++) {
                        newCellsArray.push(allCellsList[j + cellsPerRow * (cellsPerColumn - 1)]);
                }
                for (var i = 0; i < allCellsList.length - cellsPerRow; i++) {
                        newCellsArray.push(allCellsList[i + cellsPerRow]);
                }
                cells = newCellsArray;
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
