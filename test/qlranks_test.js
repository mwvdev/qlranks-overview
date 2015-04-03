var nock = require('nock');
var qlranks = require('../src/lib/qlranks');

nock.disableNetConnect();

exports.setUp = function(callback) {
    this.playerName = 'player';
    this.playerNames = ['cooller', 'evil', 'rapha'];

    callback();
};

function mockSinglePlayerRequest(statusCode, playerName, queryResponse) {
    return nock('http://www.qlranks.com')
               .get('/api.aspx?nick=' + playerName)
               .reply(statusCode, queryResponse);
}

function mockMultiplePlayerRequest(statusCode, playerNames, queryResponse) {
    return nock('http://www.qlranks.com')
               .get('/api.aspx?nick=' + playerNames.join('%20'))
               .reply(statusCode, queryResponse);
}

exports.tests = {
    'should return errors': function(test) {
        test.expect(2);
        qlranks.retrievePlayer(this.playerName, function(error, playerElo) {
            test.ok(error !== null);
            test.equal(playerElo, null);
            test.done();
        });
    },
    'should return HTTP errors': function(test) {
        var statusCode = 500;
        var scope = mockSinglePlayerRequest(500, this.playerName, '');

        test.expect(3);
        qlranks.retrievePlayer(this.playerName, function(error, playerElo) {
            test.ok(error !== null);
            test.equal(error.statusCode, statusCode);
            test.equal(playerElo, null);
            test.done();
        });
    },
    'should fetch and parse ELO for a single player': function(test) {
        var queryResponse = '{"players":[{"nick":"player","ca":{"rank":2823,"elo":1937},' +
            '"duel":{"rank":20818,"elo":1263},"tdm":{"rank":18961,"elo":1294},' +
            '"ctf":{"rank":32635,"elo":1247},"ffa":{"rank":384,"elo":2534}}]}';

        var scope = mockSinglePlayerRequest(200, this.playerName, queryResponse);

        var expectedPlayerElo = {
            players: [{
                nick: 'player',
                ca: { rank: 2823, elo: 1937 },
                duel: { rank: 20818, elo: 1263 },
                tdm: { rank: 18961, elo: 1294 },
                ctf: { rank: 32635, elo: 1247 },
                ffa: { rank: 384, elo: 2534 }
            }]
        };

        test.expect(2);
        qlranks.retrievePlayer(this.playerName, function(error, playerElo) {
            test.ifError(error);
            test.deepEqual(playerElo, expectedPlayerElo, 'server ELO should be properly parsed');
            test.done();
        });
    },
    'should handle invalid query response': function(test) {
        var scope = mockSinglePlayerRequest(200, this.playerName, '{invalid query response}');

        test.expect(2);
        qlranks.retrievePlayer(this.playerName, function(error, playerElo) {
            test.ok(error !== null);
            test.equal(playerElo, null);
            test.done();
        });
    },
    'should fetch and parse ELO for multiple players': function(test) {
        var queryResponse = '{"players":[{"nick":"cooller","ca":{"rank":68501,"elo":1264},' +
            '"duel":{"rank":31,"elo":2332},"tdm":{"rank":166,"elo":2216},' +
            '"ctf":{"rank":25038,"elo":1280},"ffa":{"rank":80479,"elo":1598}},' +
            '{"nick":"evil","ca":{"rank":282266,"elo":1014},"duel":{"rank":2,"elo":2665},' +
            '"tdm":{"rank":102666,"elo":1117},"ctf":{"rank":0,"elo":1250},' +
            '"ffa":{"rank":116723,"elo":1444}},{"nick":"rapha","ca":{"rank":254,"elo":2338},' +
            '"duel":{"rank":1,"elo":2696},"tdm":{"rank":955,"elo":1804},"ctf":{"rank":47,"elo":2388},' +
            '"ffa":{"rank":51492,"elo":1806}}]}';

        var scope = mockMultiplePlayerRequest(200, this.playerNames, queryResponse);

        var expectedPlayerElos = {
            players: [{
                nick: 'cooller',
                ca: { rank: 68501, elo: 1264 },
                duel: { rank: 31, elo: 2332 },
                tdm: { rank: 166, elo: 2216 },
                ctf: { rank: 25038, elo: 1280 },
                ffa: { rank: 80479, elo: 1598 }
            }, {
                nick: 'evil',
                ca: { rank: 282266, elo: 1014 },
                duel: { rank: 2, elo: 2665 },
                tdm: { rank: 102666, elo: 1117 },
                ctf: { rank: 0, elo: 1250 },
                ffa: { rank: 116723, elo: 1444 }
            }, {
                nick: 'rapha',
                ca: { rank: 254, elo: 2338 },
                duel: { rank: 1, elo: 2696 },
                tdm: { rank: 955, elo: 1804 },
                ctf: { rank: 47, elo: 2388 },
                ffa: { rank: 51492, elo: 1806 }
            }]
        };

        test.expect(2);
        qlranks.retrievePlayers(this.playerNames, function(error, playerElo) {
            test.ifError(error);
            test.deepEqual(playerElo, expectedPlayerElos, 'server ELO should be properly parsed');
            test.done();
        });
    }
};
