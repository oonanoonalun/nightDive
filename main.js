// Get the canvas from the page.
var canvas = $('canvas')[0];
// Get a thing I can draw to.
var context = canvas.getContext('2d');

// 800x600 coordinate space, 0,0 is the top left corner.
//context.fillRect(left, top, width, height);

//MAIN LOOP
function mainLoop() {
    newMainLoop();
    //drawAllCells(cells);
    //logging();
}
// Every .033 seconds run the code in function mainLoop. 40(ms) is 25fps, 33.33etc.ms is 30.
//setInterval(mainLoop, 33.3333333333); // locking this to 30fps for consistency of gameplay
//setInterval(mainLoop, (33.333333333333 * 0.01)); // high framerate is just to see how efficient things are by seeing how fast they can possibly go
function newMainLoop() {
    context.clearRect(0, 0, 800, 600); // this calls a function, but I don't know how to recreate this function, or where to find its contents
    for (var i = 0; i < cells.length; i++) {
        var cell = cells[i];
        for (var x = 0; x < 3; x++) {
            if (cell.color[x] > 255) cell.color[x] = 255;
            // toHexColor
            for (var w = 0; w < 3; w++) {
                    // Math.round()
                    cell.color[w] -= cell.color[w] % 1;
                    cell.color[w] = cell.color[w].toString(16);
                    if (cell.color[w].length < 2) {
                            cell.color[w] = '0' + cell.color[w];
                    }
            }
            cell.color = '#' + cell.color[0] + cell.color[1] + cell.color[2];
            if (drawingSettings.drawScreen) {
                    context.fillStyle = cell.color;
                    context.fillRect(cell.left, cell.top, cell.size, cell.size);
            }
        }
    }
}

function displayCenterCellsAverageBrightness(displayInterval) {
    if (interfaceSettings.noCenterCellsAverageBrightnessDisplayUntil <= Date.now() || !interfaceSettings.noCenterCellsAverageBrightnessDisplayUntil) {
        interfaceSettings.noCenterCellsAverageBrightnessDisplayUntil = Date.now() + interfaceSettings.displayCenterCellsAverageBrightness[1];
    }
}

function logging() {
    if (!player.died) {
        if ((player.logPlayerTemperature || player.logPlayerTemperatureChangeRate) && !player.died) logPlayerTemperature(500);
        if (drawingSettings.fpsDisplay.displayFps) countFps(drawingSettings.fpsDisplay.fpsDisplayInterval, drawingSettings.fpsDisplay.fpsDisplayIntervalLongTerm);    
        if (interfaceSettings.displayCenterCellsAverageBrightness[0]) displayCenterCellsAverageBrightness(interfaceSettings.displayCenterCellsAverageBrightness[1]);
        //if (settings.game.ambientTemperature.log && settings.gamesettings.game.ambientTemperature.current) {
          //  console.log('Ambient temp.: ' + settings.game.ambientTemperature.current.toFixed(2));
        //}
        //if (settings.game.diurnal.timeOfDayNormalized && settings.game.diurnal.on && settings.game.diurnal.logTimeOfDay && frameCounter % 45 === 0) {
          //  console.log(' Time of day: ' + settings.game.diurnal.timeOfDayNormalized.toFixed(2));
        //}
        if (settings.game.diurnal.logDayCounter && settings.game.diurnal.on && frameCounter % settings.game.diurnal.duration === Math.round(settings.game.diurnal.duration)) {
            console.log('Day ' + settings.game.diurnal.dayCounter);
        }
    }
}

function countFps(displayInterval, displayIntervalLongTerm) {
    drawingSettings.fpsDisplay.frameCounter++;
    drawingSettings.fpsDisplay.framesSinceLastDisplay++;
    drawingSettings.fpsDisplay.framesSinceLastDisplayLongTerm++;
    // short-term average
    if (drawingSettings.fpsDisplay.noFpsDisplayUntil <= Date.now() || !drawingSettings.fpsDisplay.noFpsDisplayUntil) {
        var averageFpsSinceLastDisplay,
            recentFrames = drawingSettings.fpsDisplay.framesSinceLastDisplay;
        averageFpsSinceLastDisplay = Math.round(recentFrames / (displayInterval / 1000));
        if (averageFpsSinceLastDisplay) console.log('FPS average over ' + displayInterval / 1000 + ' seconds: ' + averageFpsSinceLastDisplay);
        drawingSettings.fpsDisplay.framesSinceLastDisplay = 0;
        drawingSettings.fpsDisplay.noFpsDisplayUntil = Date.now() + displayInterval;
    }
    // long-term average
    if (drawingSettings.fpsDisplay.noFpsDisplayLongTermUntil <= Date.now() || !drawingSettings.fpsDisplay.noFpsDisplayLongTermUntil) {
        var averageFpsSinceLastDisplayLongTerm,
            recentFramesLongTerm = drawingSettings.fpsDisplay.framesSinceLastDisplayLongTerm;
        averageFpsSinceLastDisplayLongTerm = Math.round(recentFramesLongTerm / (displayIntervalLongTerm / 1000));
        if (averageFpsSinceLastDisplayLongTerm) console.log('FPS average over ' + displayIntervalLongTerm / 1000 + ' seconds: ' + averageFpsSinceLastDisplayLongTerm);
        drawingSettings.fpsDisplay.framesSinceLastDisplayLongTerm = 0;
        drawingSettings.fpsDisplay.noFpsDisplayLongTermUntil = Date.now() + displayIntervalLongTerm;
    }
}

function logPlayerTemperature(displayInterval) {
        if (Date.now() % displayInterval < 50 && (player.noTemperatureLoggingUntil <= Date.now() || !player.noTemperatureLoggingUntil)) {
                if (player.logPlayerTemperature) console.log('Temperature: ' + player.temperature.toFixed(2));
                if (player.logPlayerTemperatureChangeRate) console.log('Temperature change rate: ' + player.currentTemperatureChangeRate.toFixed(4));
                player.noTemperatureLoggingUntil = Date.now() + 100; // just keeps it from logging a few times during the necessarily non-tiny window.
        }
}
