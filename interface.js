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
