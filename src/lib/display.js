var blessed = require('blessed');
var moment = require('moment');
var _ = require('underscore');

var logoAscii = "  {red-fg}____{/}            __         {red-fg}__{/}   _         \n" +
    " {red-fg}/ __ \\{/}__ _____ _/ /_____   {red-fg}/ /{/}  (_)  _____ \n" +
    "{red-fg}/ /_/ /{/} // / _ `/  '_/ -_) {red-fg}/ /__{/}/ / |/ / -_)\n" +
    "{red-fg}\\___\\_\\{/}_,_/\\_,_/_/\\_\\\\__/ {red-fg}/____/{/}_/|___/\\__/";
var eloRatingsComment = "ELO ratings are fetched directly from qlranks.com";

function clearScreen(screen) {
    _.each(screen.children, function(element) {
        element.detach();
    });
}

function createLogoBox() {
    var logoBox = blessed.box({
        width: '100%',
        height: 6,
        tags: true
    });

    logoBox.setContent( logoAscii + '\n\n' + eloRatingsComment );

    return logoBox;
}

module.exports = {
    clearScreen: clearScreen,
    createLogoBox: createLogoBox,
    activateProgressBox: function(screen) {
        clearScreen(screen);

        var progressBox = blessed.box();
        screen.append(progressBox);

        var logoBox = createLogoBox();
        progressBox.append(logoBox);

        var indicatorBox = blessed.box({
            parent: progressBox,
            width: eloRatingsComment.length,
            height: 3,
            top: logoBox.height + 1,
            border: {
                type: 'line'
            }
        });

        var indicator = blessed.box({
            content: '#####',
            parent: indicatorBox
        });

        function animateIndicator() {
            if(indicator.left + indicator.content.length + 2 > indicatorBox.width) {
                indicator.left = 0;
            }
            else {
                indicator.left++;
            }

            screen.render();

            indicatorBox.set('timer', setTimeout(animateIndicator, 200));
        }

        progressBox.on('detach', function() {
            clearTimeout(indicatorBox.get('timer'));
        });

        screen.render();

        indicatorBox.set('timer', setTimeout(animateIndicator, 200));

        return progressBox;
    },
    activateErrorBox: function(screen, error) {
        clearScreen(screen);

        var errorBox = blessed.box();
        screen.append(errorBox);

        var logoBox = createLogoBox();
        errorBox.append(logoBox);

        var messageBox = blessed.message({
            parent: errorBox,
            width: eloRatingsComment.length,
            height: 'shrink',
            top: logoBox.height + 1,
            label: 'Error',
            border: {
                type: 'line'
            }
        });

        messageBox.display(error, function() {
            errorBox.emit('finished');
        });

        return errorBox;
    },
    activateInfoBox: function(screen, playerElo) {
        clearScreen(screen);

        var infoBox = blessed.box();
        screen.append(infoBox);

        var logoBox = createLogoBox();
        infoBox.append(logoBox);

        var playerBox = blessed.box({
            parent: infoBox,
            width:  36,
            height: 12,
            top: logoBox.height + 1,
            tags: true,
            interactive: false,
            border: {
                type: 'line'
            }
        });

        var lastUpdatedBox = blessed.box({
            parent: infoBox,
            height: 1,
            top: playerBox.top + playerBox.height + 1
        });

        function populatePlayerBox(playerBox, player) {
            playerBox.setLabel(player.nick + "'s ELO rating");

            var eloList = _.pick(player, 'ca', 'duel', 'tdm', 'ctf', 'ffa');

            var lineOffset = 1;
            _.each(eloList, function(gameTypeStats, gameType) {
                addEloEntry(playerBox, lineOffset, gameType.toUpperCase(), gameTypeStats.elo);
                lineOffset += 2;
            });
        }

        function addEloEntry(playerBox, lineOffset, gameType, elo) {
            var gameTypeLine = blessed.box({
                content: gameType,
                width: '45%',
                height: 1,
                top: lineOffset
            });
            var eloLine = blessed.box({
                content: "{right}" + elo + "{/}",
                left: '50%',
                width: '45%',
                height: 1,
                top: lineOffset,
                tags: true
            });

            playerBox.append(gameTypeLine);
            playerBox.append(eloLine);
        }

        var player = playerElo.players[0];
        populatePlayerBox(playerBox, player);

        function updateLastUpdatedBox(lastUpdated) {
            lastUpdatedBox.setContent('Last updated: ' + moment(lastUpdated).fromNow());

            screen.render();

            lastUpdatedBox.set('timer', setTimeout(updateLastUpdatedBox, 20 * 1000, lastUpdated));
        }

        updateLastUpdatedBox(new Date());

        function refreshPlayer() {
            infoBox.emit('refresh', player.nick);
        }

        infoBox.key('r', refreshPlayer);

        playerBox.set('timer', setTimeout(refreshPlayer, 5 * 60 * 1000));

        infoBox.on('detach', function() {
            clearTimeout(playerBox.get('timer'));
            clearTimeout(lastUpdatedBox.get('timer'));
        });

        return infoBox;
    },
    activateInputBox: function(screen) {
        clearScreen(screen);

        var inputBox = blessed.box();
        screen.append(inputBox);

        var logoBox = createLogoBox();
        inputBox.append(logoBox);

        var form = blessed.form({
            parent: inputBox,
            top: logoBox.height + 1,
            keys: true
        });

        var usernameLabel = blessed.box({
            parent: form,
            content: 'Enter a username: '
        });

        var usernameTextBox = blessed.textbox({
            parent: form,
            keys: true,
            name: 'playerName',
            left: 'Enter a username: '.length,
            inputOnFocus: true
        });

        usernameTextBox.on('submit', function() {
            form.submit();
        });

        form.on('submit', function(data) {
            if(data.playerName) {
                inputBox.emit('submit', data.playerName);
            }
        });

        usernameTextBox.focus();

        return inputBox;
    }
};