var request = require('request');

function performRequest(queryString, callback) {
    var qlRanksEloUrl = 'http://www.qlranks.com/api.aspx';

    request({url: qlRanksEloUrl, qs: queryString, json: true}, function(error, response, body) {
        if(error) {
            return callback(error);
        }
        if(response.statusCode !== 200) {
            var responseError = new Error('Unexpected HTTP status code');
            responseError.statusCode = response.statusCode;
            return callback(responseError);
        }

        return verifyBody(body, callback);
    });
}

function verifyBody(body, callback) {
    function createError(message) {
        var baseErrorMessage = 'An invalid server response was encountered. ';

        return new Error(baseErrorMessage + message);
    }

    if(!body.players) {
        return callback(createError('Expected a list of players.'));
    }

    for(var i = 0; i < body.players; i++) {
        var player = body[i];

        if(!player.nick) {
            return callback(createError('Expected ELO data available for every game type for player: ' + player.nick));
        }

        if(!player.ca || !player.duel || !player.tdm || !player.ctf || !player.ffa) {
            return callback(createError('Expected ELO data available for every game type for player: ' + player.nick));
        }
    }

    return callback(null, body);
}

module.exports = {
    retrievePlayer: function(playerName, callback) {
        var queryString = {nick: playerName};
        performRequest(queryString, callback);
    },
    retrievePlayers: function(playerNames, callback) {
        var queryString = {nick: playerNames.join(' ')};
        performRequest(queryString, callback);
    }
};