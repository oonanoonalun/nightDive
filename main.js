// Get the canvas from the page.
var canvas = $('canvas')[0];
// Get a thing I can draw to.
var context = canvas.getContext('2d');

// 800x600 coordinate space, 0,0 is the top left corner.
//context.fillRect(left, top, width, height);

//MAIN LOOP
function mainLoop() {
    context.clearRect(0, 0, 800, 600);
    controls();
    globalUpdates();
    drawAllCells(cells);
    logging();
}

// Every .033 seconds run the code in function mainLoop. 40(ms) is 25fps, 33.33etc.ms is 30.
setInterval(mainLoop, (33.333333333333 * 0.01)); // high framerate is just to see how efficient things are by seeing how fast they can possibly go

function controls() {
    if (interfaceSettings.controlScheme === NON_CONTINUOUS_MOVEMENT) {
        moveCameraWithButtons();
    }
    if (interfaceSettings.controlScheme === CONTINUOUS_MOVEMENT) {
        moveCameraWithButtonsContinuous();
    }
    abilitiyEmergencyPushBack(settings.entities.lights);
}

function displayCenterCellsAverageBrightness(displayInterval) {
    if (interfaceSettings.noCenterCellsAverageBrightnessDisplayUntil <= Date.now() || !interfaceSettings.noCenterCellsAverageBrightnessDisplayUntil) {
        console.log('Center cells average brightness is: ' + interfaceSettings.centerCellsAverageBrightness);
        interfaceSettings.noCenterCellsAverageBrightnessDisplayUntil = Date.now() + interfaceSettings.displayCenterCellsAverageBrightness[1];
    }
}

function globalUpdates() {
    updateOscillators(settings.oscillators);
    updatePlayer();
    updateNoise();
    updateLights(settings.entities.lights, settings.minLights, settings.maxLights);
}

function logging() {
    if (player.logPlayerTemperature) logPlayerTemperature(500);
    if (drawingSettings.fpsDisplay.displayFps) countFps(drawingSettings.fpsDisplay.fpsDisplayInterval, drawingSettings.fpsDisplay.fpsDisplayIntervalLongTerm);    
    if (interfaceSettings.displayCenterCellsAverageBrightness[0]) displayCenterCellsAverageBrightness(interfaceSettings.displayCenterCellsAverageBrightness[1]);
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
                console.log('Temperature: ' + player.temperature.toFixed(2));
                player.noTemperatureLoggingUntil = Date.now() + 100; // just keeps it from logging a few times during the necessarily non-tiny window.
        }
}
