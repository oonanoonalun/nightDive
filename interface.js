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
                if (event.which == KEY_W && keysDown.indexOf(KEY_W) == -1) {
                        keysDown.push(KEY_W);
                }
                if (event.which == KEY_S && keysDown.indexOf(KEY_S) == -1) {
                        keysDown.push(KEY_S);
                }
                if (event.which == KEY_A && keysDown.indexOf(KEY_A) == -1) {
                        keysDown.push(KEY_A);
                }
                if (event.which == KEY_D && keysDown.indexOf(KEY_D) == -1) {
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
        if (keysDown.indexOf(KEY_W) !== -1) {
                if (interfaceSettings.noUpMoveUntil <= Date.now()) {
                        moveArrayOfEntities(settings.entities.lights, DOWN, 1);
                        interfaceSettings.noUpMoveUntil = Date.now() + interfaceSettings.moveRepeatDelay;
                }
        }
        if (keysDown.indexOf(KEY_S) !== -1) {
                if (interfaceSettings.noDownMoveUntil <= Date.now()) {
                        moveArrayOfEntities(settings.entities.lights, UP, 1);
                        interfaceSettings.noDownMoveUntil = Date.now() + interfaceSettings.moveRepeatDelay;
                }        }
        if (keysDown.indexOf(KEY_A) !== -1) {
                if (interfaceSettings.noLeftMoveUntil <= Date.now()) {
                        moveArrayOfEntities(settings.entities.lights, RIGHT, 1);
                        interfaceSettings.noLeftMoveUntil = Date.now() + interfaceSettings.moveRepeatDelay;
                }        }
        if (keysDown.indexOf(KEY_D) !== -1) {
                if (interfaceSettings.noRightMoveUntil <= Date.now()) {
                        moveArrayOfEntities(settings.entities.lights, LEFT, 1);
                        interfaceSettings.noRightMoveUntil = Date.now() + interfaceSettings.moveRepeatDelay;
                }
        }
}

function cellSelect(cellsList, buttonsList) {
        $('body').on('keydown', function (event) {
                //console.log(event.which);
                for (var i = 0; i < Math.min(cellsList.length, buttonsList.length); i++) {
                        if (event.which == buttonsList[i]) {
                                cellsList[i].selected = !cellsList[i].selected;
                                setTimeout(cellSelect, 200);    //This keeps a button press from registering a bunch on times in a row if you hold it down for moment //I think maybe this is causing an error that shows up in the console but doesn't seem
                        }                                               //to keep anything from working.
                }                        
        });
}

function oscillatorSelect(oscillatorsList, buttonsList) {
        $('body').on('keydown', function (event) {
                //console.log(event.which);
                for (var i = 0; i < Math.min(oscillatorsList.length, buttonsList.length); i++) {
                        if (event.which == buttonsList[i]) {
                                oscillatorsList[i].selected = !oscillatorsList[i].selected;
                                setTimeout(cellSelect, 200);    //I think maybe this is causing an error that shows up in the console but doesn't seem
                        }                                               //to keep anything from working.
                }                        
        });
}

//NOT BEING USED
function moveHomeCellWithButtons() {
        //directions are clock-like: neighborUP is 0, numbers rising going clockwise
                moveHomeCellWithButton(W, cell, 0, 4);
                moveHomeCellWithButton(S, cell, 4, 4);
                moveHomeCellWithButton(A, cell, 6, 4);
                moveHomeCellWithButton(D, cell, 2, 4);
                moveHomeCellWithButton(E, cell, 1, 4);
                moveHomeCellWithButton(Q, cell, 7, 4);
                moveHomeCellWithButton(X, cell, 5, 4);
                moveHomeCellWithButton(C, cell, 3, 4);
}




function changePlayerState() {        //toWhichNeighbor should be passed 'cell.neighborX'
        $('body').on('keydown', function (event) {
                if (event.which == S) {
                        playerFlags[0] = !playerFlags[0];  //player is jump-ready
                }
        });
        //$('body').on('keyup', function (event) {
          //      if (event.which == S) {
            //          playerFlags[0] = false;
              //  }
        //});
}

function buttonsMakeImpulses() {
        $('body').on('keydown', function (event) {
                if (event.which == Q && impulses[0] === null) {
                        impulses[0] = makeImpulse(70, 70, [127, 127, 127], [95, 95, 95], 15, 15, 23, 23, [0]);
                }
                if (event.which == W && impulses[1] === null) {
                        impulses[0] = makeImpulse(70, 70, [127, 127, 127], [95, 95, 95], 15, 15, 23, 23, [1]);
                }
                if (event.which == E && impulses[2] === null) {
                        impulses[0] = makeImpulse(70, 70, [127, 127, 127], [95, 95, 95], 15, 15, 23, 23, [2]);
                }
                if (event.which == R && impulses[3] === null) {
                        impulses[0] = makeImpulse(70, 70, [127, 127, 127], [95, 95, 95], 15, 15, 23, 23, [3]);
                }                
                if (event.which == C && impulses[4] === null) {
                        impulses[0] = makeImpulse(70, 70, [127, 127, 127], [95, 95, 95], 15, 15, 23, 23, [4]);
                } 
        });
}




function moveHomeCellWithButton() {        //toWhichNeighbor should be passed 'cell.neighborX'
        $('body').on('keydown', function (event) {
      //  console.log(event.which);
                var walkOrJump;
                if (playerFlags[0] === false) {
                        walkOrJump = 0;
                } else {
                        walkOrJump = 1;
                }
                if (event.which == W) {      //if player presses W and player is jump-ready
                        impulses[walkOrJump] = (makeImpulse(14, 14, [0, 0, 0], [0, 0, 0], 0, 0, 5, 5));  //create an impulse for the jump. Could use a simpler impulse for the jump.
                        impulses[walkOrJump].flags[0] = true;                    //make the impulse have the "up" direction
                }
                if (event.which == E) {
                        impulses[walkOrJump] = (makeImpulse(14, 14, [0, 0, 0], [0, 0, 0], 0, 0, 5, 5));
                        impulses[walkOrJump].flags[1] = true;
                }
                if (event.which == D) {
                        impulses[walkOrJump] = (makeImpulse(14, 14, [0, 0, 0], [0, 0, 0], 0, 0, 5, 5));
                        impulses[walkOrJump].flags[2] = true;
                }
                if (event.which == C) {
                        impulses[walkOrJump] = (makeImpulse(14, 14, [0, 0, 0], [0, 0, 0], 0, 0, 5, 5));
                        impulses[walkOrJump].flags[3] = true;
                }
                if (event.which == X) {
                        impulses[walkOrJump] = (makeImpulse(14, 14, [0, 0, 0], [0, 0, 0], 0, 0, 5, 5));
                        impulses[walkOrJump].flags[4] = true;
                }
                if (event.which == Z) {
                        impulses[walkOrJump] = (makeImpulse(14, 14, [0, 0, 0], [0, 0, 0], 0, 0, 5, 5));
                        impulses[walkOrJump].flags[5] = true;
                }
                if (event.which == A) {
                        impulses[walkOrJump] = (makeImpulse(14, 14, [0, 0, 0], [0, 0, 0], 0, 0, 5, 5));
                        impulses[walkOrJump].flags[6] = true;
                }
                if (event.which == Q) {
                        impulses[walkOrJump] = (makeImpulse(14, 14, [0, 0, 0], [0, 0, 0], 0, 0, 5, 5));
                        impulses[walkOrJump].flags[7] = true;
                }
        });
}

//cell should get larger in middle of jump, and should travel at beginning and end more quickly than middle (to simulate a ballistic arc viewed from above)
//do we really need impulse or can just use global var "frameCounter?"
function updateJump(impulsesList) {
        moveHomeCellWithButton();
        //jumps
        if (impulsesList[1] !== null && playerFlags[0] === true) {      //if a jump impulse exists and the player is jump-ready
                //impulses[1] is jump impulse, impulses[0] is walk impulse
                //playerFlags[2] is airborne
                //playerFlags[0] is jump-readiness (true) or lack thereof (false)
                //diagonal and orthogonal jumps are separated because the same number of cells is a larger distance diagonally, so diagonal jumps cover fewer cells
                //orthogonal jumps
                if (impulsesList[1].frameCounter === 0 || impulsesList[1].frameCounter === 5 || impulsesList[1].frameCounter === 7 || impulsesList[1].frameCounter === 8 || impulsesList[1].frameCounter === 10 || impulsesList[1].frameCounter === 13) {       //at which frames of the jump should the homeCell shift a cell
                        playerFlags[2] = true;          //player is airborne
                        homeCell.flags[1] = false;
                        if (impulsesList[1].flags[0] === true) {
                                homeCell = homeCell.neighborUp;
                        }
                        if (impulsesList[1].flags[2] === true) {
                                homeCell = homeCell.neighborRight;
                        }
                        if (impulsesList[1].flags[4] === true) {
                                homeCell = homeCell.neighborDown;
                        }
                        if (impulsesList[1].flags[6] === true) {
                                homeCell = homeCell.neighborLeft;
                        }
                        if (impulsesList[1].frameCounter >= impulsesList[1].duration) {
                                playerFlags[0] = false;
                        }
                }
                //diagonal jumps
                if (impulsesList[1].frameCounter === 0 || impulsesList[1].frameCounter === 6 || impulsesList[1].frameCounter === 8 || impulsesList[1].frameCounter === 9 || impulsesList[1].frameCounter === 12) {
                        playerFlags[2] = true;          //player is airborne
                        homeCell.flags[1] = false;
                        if (impulsesList[1].flags[1] === true) {
                                homeCell = homeCell.neighborUpRight;
                        }
                        if (impulsesList[1].flags[3] === true) {
                                homeCell = homeCell.neighborDownRight;
                        }
                        if (impulsesList[1].flags[5] === true) {
                                homeCell = homeCell.neighborDownLeft;
                        }
                        if (impulsesList[1].flags[7] === true) {
                                homeCell = homeCell.neighborUpLeft;
                        }
                }
                if (impulsesList[1] === null) {
                        playerFlags[0] = false;         //player is no longer jump-ready
                }
                playerFlags[2] = false;         //player is no longer airborne
                homeCell.flags[1] = true;
        }
        //walking
        if (impulsesList[0] !== null && playerFlags[0] === false) {     //if a walk impulse is active and the player is not jump-ready
                //diagonal and orthogonal walks don't need to be separated.
                //orthogonal walks
                if (impulsesList[0].frameCounter < 2) {       //at which frames of the impulse should the homeCell shift a cell
                        homeCell.flags[1] = false;
                        if (impulsesList[0].flags[0] === true) {
                                homeCell = homeCell.neighborUp;
                        }
                        if (impulsesList[0].flags[2] === true) {
                                homeCell = homeCell.neighborRight;
                        }
                        if (impulsesList[0].flags[4] === true) {
                                homeCell = homeCell.neighborDown;
                        }
                        if (impulsesList[0].flags[6] === true) {
                                homeCell = homeCell.neighborLeft;
                        }
                        homeCell.flags[1] = true;
                }
                //diagonal walks
                if (impulsesList[0].frameCounter < 2) {
                        homeCell.flags[1] = false;
                        if (impulsesList[0].flags[1] === true) {
                                homeCell = homeCell.neighborUpRight;
                        }
                        if (impulsesList[0].flags[3] === true) {
                                homeCell = homeCell.neighborDownRight;
                        }
                        if (impulsesList[0].flags[5] === true) {
                                homeCell = homeCell.neighborDownLeft;
                        }
                        if (impulsesList[0].flags[7] === true) {
                                homeCell = homeCell.neighborUpLeft;
                        }
                        homeCell.flags[1] = true;
                }
        }
}


function playerConsequences(cell) {
        if (cell.flags[1] === true && playerFlags[2] === false) {       //if it is the homeCell and not airborne
                if (sumColor(cell.color) <= fallThresholds[0]) {        //if the cell is black before the homeCellOverlay is drawn. This is a problem—won't register if the homeCell is on top of a cell when it goes black (though it will register if the homeCell moves onto a black cell)
                        console.log('You fell!');
                        location.reload();
                }
        }
}

function moveHomeCell(oscillatorsList) {         //oscillatorsList should be homeOscillators
        if (oscillatorsList[0].frameCounter === Math.round(oscillatorsList[0].period / 2)) {
                homeCell.flags[1] = false;       //current HC becomes not the HC
                homeCell.flags[2] = true;        //current HC becomes immediately previous HC
                for (var j = 0; j < homeCell.neighbors.length; j++) {
                        homeCell.neighbors[j].flags[2] = false;         //this new, immediately-previous HC tells all its neighbors that they are no longer the immediately-previous HC
                }
                //homeCell = homeCell.neighbors[randomNumber(0, homeCell.neighbors.length)];      //for testing, homeCell moves to random neighbor
                homeCell = findBrightestNeighbor(homeCell.neighbors);         //the var "homeCell" is now the previous homeCell's brightest neighbor
                homeCell.flags[1] = true;                                       //the flag saying that something is the homeCell is turned on in the new homeCell
        }
}