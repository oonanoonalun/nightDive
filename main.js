// Get the canvas from the page.
var canvas = $('canvas')[0];
// Get a thing I can draw to.
var context = canvas.getContext('2d');

// 800x600 coordinate space, 0,0 is the top left corner.
//context.fillRect(left, top, width, height);

//MAIN LOOP
function mainLoop() {
    context.clearRect(0, 0, 800, 600);
    updateOscillators(settings.oscillators);
    updateLights(settings.entities.lights, settings.minLights, settings.maxLights);
    if (interfaceSettings.controlScheme === NON_CONTINUOUS_MOVEMENT) {
        moveCameraWithButtons();
    }
    if (interfaceSettings.controlScheme === CONTINUOUS_MOVEMENT) {
        moveCameraWithButtonsContinuous();
    }
    drawAllCells(cells);
    if (drawingSettings.fpsDisplay.displayFps) countFps(drawingSettings.fpsDisplay.fpsDisplayInterval);
}

// Every .033 seconds run the code in function mainLoop. 40(ms) is 25fps, 33.33etc.ms is 30.
setInterval(mainLoop, (33.333333333333 * 0.01)); // high framerate is just to see how efficient things are by seeing how fast they can possibly go

function countFps(displayInterval) {
    drawingSettings.fpsDisplay.frameCounter++;
    drawingSettings.fpsDisplay.framesSinceLastDisplay++;
    if (drawingSettings.fpsDisplay.noFpsDisplayUntil <= Date.now() || !drawingSettings.fpsDisplay.noFpsDisplayUntil) {
        var averageFpsSinceLastDisplay,
            recentFrames = drawingSettings.fpsDisplay.framesSinceLastDisplay;
        averageFpsSinceLastDisplay = Math.round(recentFrames / (displayInterval / 1000));
        console.log('FPS: ' + averageFpsSinceLastDisplay);
        drawingSettings.fpsDisplay.framesSinceLastDisplay = 0;
        drawingSettings.fpsDisplay.noFpsDisplayUntil = Date.now() + drawingSettings.fpsDisplay.fpsDisplayInterval;
    }
}

