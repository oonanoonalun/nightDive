//INTERFACE
var buttonsGridQWERTY = [Q = 81, W = 87, E = 69, R = 82, A = 65, S = 83, D = 68, F = 70, Z = 90, X = 88, C = 67, V = 86],
        KEY_W = 87,
        KEY_S = 83,
        KEY_A = 65,
        KEY_D = 68,
        KEY_SPACE = 32,
        keysDown = [],
        CONTINUOUS_MOVEMENT = 'continuousMovementControlScheme',
        NON_CONTINUOUS_MOVEMENT = 'nonContinuousMovementControlScheme',
        interfaceSettings = {
                'noUpMoveUntil': Date.now(),
                'noDownMoveUntil': Date.now(),
                'noLeftMoveUntil': Date.now(),
                'noRightMoveUntil': Date.now(),
                'cellsPerMove': 2,
                'moveRepeatDelay': 25,
                'controlScheme': NON_CONTINUOUS_MOVEMENT,
                'showPlayerLight': true,
                'centerCellsRadius': 35,
                'showCenterCells': false, // not as efficient as it could be, cpu-wise (?), so only turn on if needed.
                'centerCells': [],
                'centerCellsAverageBrightness': null,
                'displayCenterCellsAverageBrightness': [false, 500] // second item is display interval
        };

function moveCameraWithButtons() {
        $('body').on('keydown', function (event) {
                if (event.which == KEY_W && keysDown.indexOf(KEY_W) === -1) {
                        keysDown.push(KEY_W);
                }
                if (event.which == KEY_S && keysDown.indexOf(KEY_S) === -1) {
                        keysDown.push(KEY_S);
                }
                if (event.which == KEY_A && keysDown.indexOf(KEY_A) === -1) {
                        keysDown.push(KEY_A);
                }
                if (event.which == KEY_D && keysDown.indexOf(KEY_D) === -1) {
                        keysDown.push(KEY_D);
                }
        });
        $('body').on('keyup', function (event) {
                if (event.which == KEY_W) {
                        var wIndex = keysDown.indexOf(KEY_W);
                        keysDown.splice(wIndex, 1);
                }
                if (event.which == KEY_S) {
                        var sIndex = keysDown.indexOf(KEY_S);
                        keysDown.splice(sIndex, 1);
                }
                if (event.which == KEY_A) {
                        var aIndex = keysDown.indexOf(KEY_A);
                        keysDown.splice(aIndex, 1);
                }
                if (event.which == KEY_D) {
                        var dIndex = keysDown.indexOf(KEY_D);
                        keysDown.splice(dIndex, 1);
                }
        });
        if (keysDown.indexOf(KEY_W) !== -1) { // move up
                if (interfaceSettings.noUpMoveUntil <= Date.now()) {
                        moveArrayOfEntities(settings.entities.lights, DOWN, interfaceSettings.cellsPerMove);
                        interfaceSettings.noUpMoveUntil = Date.now() + interfaceSettings.moveRepeatDelay;
                }
        }
        if (keysDown.indexOf(KEY_S) !== -1) { // move down
                if (interfaceSettings.noDownMoveUntil <= Date.now()) {
                        moveArrayOfEntities(settings.entities.lights, UP, interfaceSettings.cellsPerMove);
                        interfaceSettings.noDownMoveUntil = Date.now() + interfaceSettings.moveRepeatDelay;
                }
        }
        if (keysDown.indexOf(KEY_A) !== -1) { // move left
                if (interfaceSettings.noLeftMoveUntil <= Date.now()) {
                        moveArrayOfEntities(settings.entities.lights, RIGHT, interfaceSettings.cellsPerMove);
                        interfaceSettings.noLeftMoveUntil = Date.now() + interfaceSettings.moveRepeatDelay;
                }
        }
        if (keysDown.indexOf(KEY_D) !== -1) { // move right
                if (interfaceSettings.noRightMoveUntil <= Date.now()) {
                        moveArrayOfEntities(settings.entities.lights, LEFT, interfaceSettings.cellsPerMove);
                        interfaceSettings.noRightMoveUntil = Date.now() + interfaceSettings.moveRepeatDelay;
                }
        }
}

function moveCameraWithButtonsContinuous() {
        $('body').on('keydown', function (event) {
                interfaceSettings.lastButtonPressed = event.which;
        });
        if (interfaceSettings.lastButtonPressed === KEY_W) { // move up
                if (interfaceSettings.noUpMoveUntil <= Date.now()) {
                        moveArrayOfEntities(settings.entities.lights, DOWN, interfaceSettings.cellsPerMove);
                        interfaceSettings.noUpMoveUntil = Date.now() + interfaceSettings.moveRepeatDelay;
                }
        }
        if (interfaceSettings.lastButtonPressed === KEY_S) { // move down
                if (interfaceSettings.noDownMoveUntil <= Date.now()) {
                        moveArrayOfEntities(settings.entities.lights, UP, interfaceSettings.cellsPerMove);
                        interfaceSettings.noDownMoveUntil = Date.now() + interfaceSettings.moveRepeatDelay;
                }
        }
        if (interfaceSettings.lastButtonPressed === KEY_A) { // move left
                if (interfaceSettings.noLeftMoveUntil <= Date.now()) {
                        moveArrayOfEntities(settings.entities.lights, RIGHT, interfaceSettings.cellsPerMove);
                        interfaceSettings.noLeftMoveUntil = Date.now() + interfaceSettings.moveRepeatDelay;
                }
        }
        if (interfaceSettings.lastButtonPressed === KEY_D) { // move right
                if (interfaceSettings.noRightMoveUntil <= Date.now()) {
                        moveArrayOfEntities(settings.entities.lights, LEFT, interfaceSettings.cellsPerMove);
                        interfaceSettings.noRightMoveUntil = Date.now() + interfaceSettings.moveRepeatDelay;
                }
        }
}

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

/*function findAverageBrightnessOfCenterCells() {
        var brightness = 0;
        for (var i = 0; i < interfaceSettings.centerCells.length; i++) {
                brightness += averageBrightness(interfaceSettings.centerCells[i].color);
        }
        brightness /= interfaceSettings.centerCells.length;
        interfaceSettings.centerCellsAverageBrightness = brightness;
}*/

function findAverageBrightnessOfCenterCells(cell) {
        // WRONG, sort of. This is a sloppy way to do this, and it may not be very efficient to put it where
        //      it is in drawAllCells, but it's hard to insert it in the right place, while the cells' colors
        //      still aren't in hex, and when they haven't been wiped by getCellColor.
        if (cells.indexOf(cell) === 0) interfaceSettings.centerCellsAverageBrightness = 0;
        if (interfaceSettings.centerCells.indexOf(cell) !== -1) {
                showCenterCells(cell);
                interfaceSettings.centerCellsAverageBrightness += averageBrightness(cell.color);
        }
        // average color when done looking at all cells
        if (cells.indexOf(cell) === totalNumberOfCells - 1) {
                interfaceSettings.centerCellsAverageBrightness /= interfaceSettings.centerCells.length;
        }
}

function showCenterCells(cell) {
        if (interfaceSettings.showCenterCells) {
                cell.color = addColors(cell.color, [64, 0, 0]);
        }       
}

function updatePlayerTemperature() {
        if (player.noTemperatureChangeUntil <= Date.now() || !player.noTemperatureChangeUntil) {
                if (interfaceSettings.centerCellsAverageBrightness <= 127) player.temperature -= interfaceSettings.centerCellsAverageBrightness * player.temperatureChangeRateScale;
                else player.temperature += interfaceSettings.centerCellsAverageBrightness * player.temperatureChangeRateScale;
                player.noTemperatureChangeUntil = Date.now() + player.intervalBetweenTemperatureUpdates;
        }
        // limit temperature to within 0-1
        player.temperature = Math.min(1, player.temperature);
        player.temperature = Math.max(0, player.temperature);
}
