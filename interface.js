//INTERFACE
var buttonsGridQWERTY = [Q = 81, W = 87, E = 69, R = 82, A = 65, S = 83, D = 68, F = 70, Z = 90, X = 88, C = 67, V = 86],
        KEY_W = 87,
        KEY_S = 83,
        KEY_A = 65,
        KEY_D = 68,
        KEY_SPACE = 32,
        keysDown = [],
        interfaceSettings = {
                'noUpMoveUntil': Date.now(),
                'noDownMoveUntil': Date.now(),
                'noLeftMoveUntil': Date.now(),
                'noRightMoveUntil': Date.now(),
                'moveRepeatDelay': 30
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
                        moveArrayOfEntities(settings.entities.lights, DOWN, 1);
                        interfaceSettings.noUpMoveUntil = Date.now() + interfaceSettings.moveRepeatDelay;
                }
        }
        if (keysDown.indexOf(KEY_S) !== -1) { // move down
                if (interfaceSettings.noDownMoveUntil <= Date.now()) {
                        moveArrayOfEntities(settings.entities.lights, UP, 1);
                        interfaceSettings.noDownMoveUntil = Date.now() + interfaceSettings.moveRepeatDelay;
                }
        }
        if (keysDown.indexOf(KEY_A) !== -1) { // move left
                if (interfaceSettings.noLeftMoveUntil <= Date.now()) {
                        moveArrayOfEntities(settings.entities.lights, RIGHT, 1);
                        interfaceSettings.noLeftMoveUntil = Date.now() + interfaceSettings.moveRepeatDelay;
                }
        }
        if (keysDown.indexOf(KEY_D) !== -1) { // move right
                if (interfaceSettings.noRightMoveUntil <= Date.now()) {
                        moveArrayOfEntities(settings.entities.lights, LEFT, 1);
                        interfaceSettings.noRightMoveUntil = Date.now() + interfaceSettings.moveRepeatDelay;
                }
        }
}


function moveEntity(entity, direction, numberOfCells) {
        var index = entity.cellIndex;
        if (direction === UP || direction === UP_LEFT || direction === UP_RIGHT) {
                if (index < cellsPerRow) { // if it's on the top edge
                        index += totalNumberOfCells - (cellsPerRow * numberOfCells);
                } else {
                        index -= numberOfCells * cellsPerRow;
                }
        }
        if (direction === DOWN || direction === DOWN_LEFT || direction === DOWN_RIGHT) {
                if (index >= totalNumberOfCells - cellsPerRow) { // i.e. if it's on the bottom edge
                        index -= totalNumberOfCells - (numberOfCells * cellsPerRow);
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
