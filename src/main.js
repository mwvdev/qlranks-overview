var blessed = require('blessed');
var _ = require('underscore');

var display = require('./lib/display');
var qlranks = require('./lib/qlranks');

function retrieveElo(playerName) {
    display.activateProgressBox(screen);

    screen.render();

    qlranks.retrievePlayer(playerName, function(error, playerElo) {
        if(error) {
            var errorBox = display.activateErrorBox( screen, error );
            errorBox.on('finished', function() {
                displayMain();
            });
        }
        else {
            var infoBox = display.activateInfoBox(screen, playerElo);
            infoBox.on('refresh', retrieveElo);
        }

        screen.render();
    });
}

function displayMain() {
    var inputBox = display.activateInputBox(screen);
    inputBox.on('submit', retrieveElo);

    screen.render();
}

var screen = blessed.screen({
    autoPadding: true,
    smartCSR: true
});

screen.key(['escape', 'q', 'C-c'], function() {
    return process.exit(0);
});

displayMain();
