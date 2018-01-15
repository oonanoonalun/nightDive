//INTERFACE
var buttonsGridQWERTY = [Q = 81, W = 87, E = 69, R = 82, A = 65, S = 83, D = 68, F = 70, Z = 90, X = 88, C = 67, V = 86],
        KEY_W = 87,
        KEY_S = 83,
        KEY_A = 65,
        KEY_D = 68,
        KEY_SPACE = 32,
        KEY_Q = 81,
        KEY_E = 69,
        KEY_Z = 90,
        KEY_X = 88,
        KEY_C = 67,
        keysDown = [],
        X_AXIS = 'xAxis', // for telling straight lines how to draw
        Y_AXIS = 'yAxis',
        POS = 'positive', // for telling straight lines which direction to lengthen and contract in
        NEG = 'negative',
        interfaceSettings = {
                'noUpMoveUntil': 0, // WRONG. Not being used.
                'noDownMoveUntil': 0, // WRONG. Not being used.
                'noLeftMoveUntil': 0, // WRONG. Not being used.
                'noRightMoveUntil': 0, // WRONG. Not being used.
                'cellsPerMove': 2,
                'moveRepeatDelay': 1,  // WRONG. Not being used. // number of frames between player moves
                'showPlayerLight': true,
                'centerCellsRadiusInPixels': 35,
                'showCenterCells': false, // not as efficient as it could be, cpu-wise (?), so only turn on if needed.
                'centerCells': [],
                'centerCellsAverageBrightness': null,
                'displayCenterCellsAverageBrightness': [false, 500] // second item is display interval
        },
        hudSettings = {
                'displayHUD': false
        };

function moveEntity(entity, direction, numberOfCellsToMove) {
        if (direction === UP || direction === UP_LEFT || direction === UP_RIGHT) {
                if (entity.coordinates[1] < 0.5 * cellsPerColumn - numberOfCellsToMove) entity.coordinates[1] += numberOfCellsToMove; // if it WON'T CROSS the TOP EDGE next frame
                else entity.coordinates[1] -= cellsPerColumn - numberOfCellsToMove;
        }
        if (direction === DOWN || direction === DOWN_LEFT || direction === DOWN_RIGHT) {
                if (entity.coordinates[1] > -(0.5 * cellsPerColumn - numberOfCellsToMove)) entity.coordinates[1] -= numberOfCellsToMove; // if it WON'T CROSS the BOTTOM EDGE next frame
                else entity.coordinates[1] += cellsPerColumn - numberOfCellsToMove;
        }
        if (direction === LEFT || direction === UP_LEFT || direction === DOWN_LEFT) {
                if (entity.coordinates[0] > -(0.5 * cellsPerRow - numberOfCellsToMove)) entity.coordinates[0] -= numberOfCellsToMove; // if it WON'T CROSS the LEFT EDGE next frame
                else entity.coordinates[0] += cellsPerRow - numberOfCellsToMove;
        }
        if (direction === RIGHT || direction === UP_RIGHT || direction === DOWN_RIGHT) {
                if (entity.coordinates[0] < 0.5 * cellsPerRow - numberOfCellsToMove) entity.coordinates[0] += numberOfCellsToMove; // if it WON'T CROSS the RIGHT EDGE next frame
                else entity.coordinates[0] -= cellsPerRow - numberOfCellsToMove;
        }
}

function abilityEmergencyPushBack() {
        if (keysDown[KEY_SPACE]) {
                if (player.noEmergencyPushBackUntil <= frameCounter || !player.noEmergencyPushBackUntil) {                        
                        player.emergencyPushBackUntil = frameCounter + player.emergencyPushBackDuration;
                        player.noEmergencyPushBackUntil = frameCounter + player.emergencyPushBackCooldown;
                        player.emergencyPushedBackAt = frameCounter;
                }
        }
        if (player.emergencyPushBackUntil && player.emergencyPushBackUntil > frameCounter) {
                emergencyPushBackMovesLights(settings.entities.lights);
        }
}

function updateTemperatureIndicators(cell) {
        updateTemperatureIndicatorHot(cell);
        updateTemperatureIndicatorCold(cell);
}

function updateTemperatureIndicatorHot(cell) {
        var tempBarTop = [],
                tempBarRight = [],
                parametricScreenLength,
                redValue = 1024 * player.temperature,
                greenValue = 384 * (1 - (player.temperature - 0.5)),
                blueValue = 0,
                damageValue = 1024 * player.damageOscillator.value,
                opacity = 0.67,
                startCoordsTop = [1, -(0.5 * cellsPerColumn) + 1],
                startCoordsBottom = [1, -(0.5 * cellsPerColumn)];
        if (player.temperature > 0.5) parametricScreenLength = 0.92 * (player.temperature - 0.5);
        tempBarTop = createStraightLine(X_AXIS, parametricScreenLength, startCoordsTop, POS);
        tempBarRight = createStraightLine(X_AXIS, parametricScreenLength, startCoordsBottom, POS);
        // health bar flashes white on taking damage
        if (player.damageWarningUntil > Date.now() && player.temperature > 0.5) {
                if (tempBarTop.indexOf(cell) !== -1) cell.color = [damageValue, damageValue , damageValue];
                if (tempBarRight.indexOf(cell) !== -1) cell.color = [damageValue, damageValue , damageValue];
        }
        else {
                if (tempBarTop.indexOf(cell) !== -1) cell.color = addColors(multiplyColorByNumber(cell.color, 1 - opacity), [redValue * opacity, greenValue * opacity, blueValue * opacity]);
                if (tempBarRight.indexOf(cell) !== -1) cell.color = addColors(multiplyColorByNumber(cell.color, 1 - opacity), [redValue * opacity, greenValue * opacity, blueValue * opacity]);
        }
}

function updateTemperatureIndicatorCold(cell) {
        var tempBarTop = [],
                tempBarRight = [],
                parametricScreenLength,
                redValue = 0,
                greenValue = 384 * (1 + (player.temperature - 0.5)),
                blueValue = 1024 * (player.temperature + 0.5),
                damageValue = 1024 * player.damageOscillator.value,
                opacity = 0.67,
                startCoordsTop = [-1, -(0.5 * cellsPerColumn) + 1],
                startCoordsBottom = [-1, -(0.5 * cellsPerColumn)];
        if (player.temperature < 0.5) parametricScreenLength = -0.92 * (player.temperature - 0.5);
        tempBarTop = createStraightLine(X_AXIS, parametricScreenLength, startCoordsTop, NEG);
        tempBarRight = createStraightLine(X_AXIS, parametricScreenLength, startCoordsBottom, NEG);
        // health bar flashes white on taking damage
        if (player.damageWarningUntil > Date.now() && player.temperature > 0.5) {
                if (tempBarTop.indexOf(cell) !== -1) cell.color = [damageValue, damageValue , damageValue];
                if (tempBarRight.indexOf(cell) !== -1) cell.color = [damageValue, damageValue , damageValue];
        }
        else {
                if (tempBarTop.indexOf(cell) !== -1) cell.color = addColors(multiplyColorByNumber(cell.color, 1 - opacity), [redValue * opacity, greenValue * opacity, blueValue * opacity]);
                if (tempBarRight.indexOf(cell) !== -1) cell.color = addColors(multiplyColorByNumber(cell.color, 1 - opacity), [redValue * opacity, greenValue * opacity, blueValue * opacity]);
        }
}

function updateEnergyIndicator(cell) {
        // push-back readiness indicator
        var startTime = player.emergencyPushedBackAt,
                readyTime = player.noEmergencyPushBackUntil,
                timeSinceStart = Date.now() - startTime,
                cooldown = player.emergencyPushBackCooldown, // could be readyTime - startTime
                chargeBarLeft = [],
                chargeBarRight = [],
                parametricScreenLength = 0.5 * (Math.min(1, timeSinceStart / cooldown) || 1),
                redValue = 1024 * (1 - timeSinceStart / cooldown),
                greenValue = 384 * (timeSinceStart / cooldown),
                blueValue = 0,
                opacity = 0.67,
                startCoordsLeft = [0.5 * cellsPerRow - 1, -(0.5 * cellsPerColumn)],
                startCoordsRight = [0.5 * cellsPerRow, -(0.5 * cellsPerColumn)],
                chargeFlashValue = 1024 * player.damageOscillator.value;
        chargeBarLeft = createStraightLine(Y_AXIS, parametricScreenLength, startCoordsLeft, POS);
        chargeBarRight = createStraightLine(Y_AXIS, parametricScreenLength, startCoordsRight, POS);
        if (readyTime <= Date.now() || !readyTime) { // if full charged
                if (Date.now() - readyTime < 800) { // if just reached charged state, flashes white for a few hundred milliseconds
                        if (chargeBarLeft.indexOf(cell) !== -1) cell.color = [chargeFlashValue, chargeFlashValue, chargeFlashValue];
                        if (chargeBarRight.indexOf(cell) !== -1) cell.color = [chargeFlashValue, chargeFlashValue, chargeFlashValue];
                } else { // fully charge and has been for a short while
                        if (chargeBarLeft.indexOf(cell) !== -1) cell.color = addColors(multiplyColorByNumber(cell.color, 1 - opacity), [192 * opacity, 0 * opacity, 255 * opacity]); // violet when fully charged
                        if (chargeBarRight.indexOf(cell) !== -1) cell.color = addColors(multiplyColorByNumber(cell.color, 1 - opacity), [192 * opacity, 0 * opacity, 255 * opacity]);
                }
        } else { // not fully charged
                if (chargeBarLeft.indexOf(cell) !== -1) cell.color = addColors(multiplyColorByNumber(cell.color, 1 - opacity), [redValue * opacity, greenValue * opacity, blueValue * opacity]);
                if (chargeBarRight.indexOf(cell) !== -1) cell.color = addColors(multiplyColorByNumber(cell.color, 1 - opacity), [redValue * opacity, greenValue * opacity, blueValue * opacity]);
        }
}



function updateHealthIndicator(cell) { // WRONG should genericize these color-and-length-changing meter bars
        var healthBarLeft = [],
                healthBarRight = [],
                parametricScreenLength = 0.5 * (player.health / player.maxHealth),
                redValue = 1024 * (1 - player.health / player.maxHealth),
                greenValue = 384 * (player.health / player.maxHealth),
                blueValue = 0,
                damageValue = 1024 * player.damageOscillator.value,
                opacity = 0.67,
                startCoordsLeft = [-(0.5 * cellsPerRow), -(0.5 * cellsPerColumn)],
                startCoordsRight = [-(0.5 * cellsPerRow) + 1, -(0.5 * cellsPerColumn)];
        healthBarLeft = createStraightLine(Y_AXIS, parametricScreenLength, startCoordsLeft, POS);
        healthBarRight = createStraightLine(Y_AXIS, parametricScreenLength, startCoordsRight, POS);
        // health bar flashes white on taking damage
        if (player.damageWarningUntil > Date.now()) {
                if (healthBarLeft.indexOf(cell) !== -1) cell.color = [damageValue, damageValue , damageValue];
                if (healthBarRight.indexOf(cell) !== -1) cell.color = [damageValue, damageValue , damageValue];
        }
        else {
                if (healthBarLeft.indexOf(cell) !== -1) cell.color = addColors(multiplyColorByNumber(cell.color, 1 - opacity), [redValue * opacity, greenValue * opacity, blueValue * opacity]);
                if (healthBarRight.indexOf(cell) !== -1) cell.color = addColors(multiplyColorByNumber(cell.color, 1 - opacity), [redValue * opacity, greenValue * opacity, blueValue * opacity]);
        }
}

function createStraightLine(X_AXISor_Y_AXIS, parametricScreenLength, startCoords, directionPOSorNEG) {
        // don't try to do anything if the start coordinates are off the cell grid or include fractions
        if (Math.abs(startCoords[0]) > cellsPerRow / 2 || Math.abs(startCoords[1]) > cellsPerColumn / 2 ||
                startCoords[0] === 0 || startCoords[1] === 0 ||
                startCoords[0] % 1 !== 0 || startCoords[1] % 1 !== 0
        ) {
                console.log('"createStraightLine" was passed invalid starting position coordinates. The coordinate could have fallen outside the cell grid, been fractional, or been 0 (which does not exist on this even-numbered grid).');
                return;
        }
        var line = [],
                currentCoords = startCoords,
                lengthInCells,
                newCoords;
        if (X_AXISor_Y_AXIS === X_AXIS) {
                lengthInCells = Math.round(parametricScreenLength * cellsPerRow);
                if (directionPOSorNEG === POS) {
                        for (var i = 0; i < lengthInCells; i++) {
                                newCoords = [currentCoords[0]++, startCoords[1]];
                                if (newCoords[0] === 0) newCoords[0]++; // there's no zero coord in this system
                                if (newCoords[0] <= cellsPerRow / 2) line.push(cells[coordinatesToIndex(newCoords)]);// making sure we don't go offscreen into invalid coords
                                else return line; // just return as much of the line as fits on the screen
                        }
                }
                if (directionPOSorNEG === NEG) {
                        for (var j = 0; j < lengthInCells; j++) {
                                newCoords = [currentCoords[0]--, startCoords[1]];
                                if (newCoords[0] === 0) newCoords[0]--;
                                if (newCoords[0] >= -(cellsPerRow / 2)) line.push(cells[coordinatesToIndex(newCoords)]);// making sure we don't go offscreen into invalid coords
                                else return line; // just return as much of the line as fits on the screen
                        }
                }
        }
        if (X_AXISor_Y_AXIS === Y_AXIS) {
                lengthInCells = Math.round(parametricScreenLength * cellsPerColumn);
                if (directionPOSorNEG === POS) {
                        for (var k = 0; k < lengthInCells; k++) {
                                newCoords = [startCoords[0], currentCoords[1]++];
                                if (newCoords[1] === 0) newCoords[1]++;
                                if (newCoords[0] <= cellsPerRow / 2) line.push(cells[coordinatesToIndex(newCoords)]);// making sure we don't go offscreen into invalid coords
                                else return line; // just return as much of the line as fits on the screen
                        }
                }
                if (directionPOSorNEG === NEG) {
                        for (var m = 0; m < lengthInCells; m++) {
                                if (newCoords[1] === 0) newCoords[1]--;
                                if (newCoords[0] >= -(cellsPerRow / 2)) line.push(cells[coordinatesToIndex(newCoords)]);// making sure we don't go offscreen into invalid coords
                                else return line; // just return as much of the line as fits on the screen
                        }
                }
        }
        return line;
}

function createLine(startCoords, endCoords, destinationArray) {
        var dx = startCoords[0] - endCoords[0],
                dy = startCoords[1] - endCoords[1],
                line = [];
        /* pseudo code: y movement per x movement equals dx / dy
        */
        line.push();
        return line;
}

function updateHUD(cell) {
        if (hudSettings.displayHUD && !player.died) {
                updateHealthIndicator(cell);
                updateEnergyIndicator(cell);
                updateTemperatureIndicators(cell);
        }
}
