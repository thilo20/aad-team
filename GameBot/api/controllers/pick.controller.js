const PickStrategyFactory = require('../services/pickStrategyFactory.service');
const appInsights = require("applicationinsights");

const pick = async (req, res) => {
    var matchId = req.body.MatchId;
    var player1Name = req.body.Player1Name;
    var turn = req.body.Turn;
    if (player1Name == undefined || matchId == undefined) {
        res.status(400);
        res.send("Player1NamerId or MatchId undefined");
        return;
    }

    const strategyOption = process.env.PICK_STRATEGY || "RANDOM";
    const result = pickFromStrategy(strategyOption);

    // TODO: implement custom arcade intelligence here, see also ./GameBot/README.md for sample requests    
    //if (player1Name == "Brian" && turn == 0) {
    if (player1Name == "Brain") {
        strategyOption = "CUSTOM";
        result.text = "paper";
        result.bet = 10;
    }
    else if (turn > 0) {
        strategyOption = "CUSTOM";
        var moves = req.body.TurnsPlayer1Values;
        if(moves.length > 0) {
            var lastMove = moves[moves.length-1];
            switch(lastMove) {
              // for game rules / winning strategy: see phase guide intro image (tablet)
              case "rock":
                result.text = "paper";
                break;
              case "paper":
                result.text = "scissors";
                break;
              case "scissors":
                result.text = "rock";
                break;
              case "metal":
                result.text = "rock";
                break;
              case "snap":
                result.text = "metal";
                break;
              default:
                // nothing
            }
            result.bet = 10;
        }
    }

    console.log('Against ' + player1Name + ', strategy ' + strategyOption + '  played ' + result.text);

    const applicationInsightsIK = process.env.APPINSIGHTS_INSTRUMENTATIONKEY;
    if (applicationInsightsIK) {
        if (appInsights && appInsights.defaultClient) {
            var client = appInsights.defaultClient;
            client.commonProperties = {
                strategy: strategyOption
            };
            client.trackEvent({
                name: "pick", properties:
                    { matchId: matchId, strategy: strategyOption, move: result.text, player: player1Name, bet: result.bet }
            });
        }
    }
    res.send({ "Move": result.text, "Bet": result.bet });
};

const pickFromStrategy = (strategyOption) => {
    const strategyFactory = new PickStrategyFactory();

    strategyFactory.setDefaultStrategy(strategyOption);
    const strategy = strategyFactory.getStrategy();
    return strategy.pick();
}

module.exports = {
    pick,
}
