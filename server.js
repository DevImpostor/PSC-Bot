var restify = require('restify');
var builder = require('botbuilder');

// Get secrets from server environment
var botConnectorOptions = { 
    appId: process.env.BOTFRAMEWORK_APPID, 
    appSecret: process.env.BOTFRAMEWORK_APPSECRET 
};

// Setup Restify Server
var server = restify.createServer();


// Setup Restify client
var client = restify.createJsonClient({
    url: 'https://machinelearningapi.azurewebsites.net'
});

// Create bot
var bot = new builder.BotConnectorBot(botConnectorOptions);

// Create LUIS recognizer that points at our model and add it as the root '/' dialog for our Cortana Bot.
var model = process.env.model || 'https://api.projectoxford.ai/luis/v1/application?id=ec37e61b-3ece-4ae5-a915-b0e82fa39fff&subscription-key=49aaa290020f498eb01c5c4013e1128f&q=';
var recognizer = new builder.LuisRecognizer(model);
var dialog = new builder.IntentDialog({ recognizers: [recognizer] });
bot.dialog('/', dialog);


bot.add('/', function (session) {
    
    session.sendTyping();
    client.get('/api/product/search/' + session.message.text, function(err, req, res, obj) {
        
        if (err != null) {
            session.endDialog("Sorry, I'm having an issue connecting to the project API");
            return;
        }

        var productListDisplay = "";
        obj.forEach(function(element) {
            productListDisplay += element.ProductName + "<br />";
        }, this);



        // var msg = new builder.Message(session)
        //     .textFormat(builder.TextFormat.xml)
        //     .attachments([
        //         new builder.HeroCard(session)
        //             .title("Search Results")
        //             .subtitle("I found " + obj.length + " products...")
        //             .text(productListDisplay)
        //             // .images([
        //             //     builder.CardImage.create(session, "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/Seattlenighttimequeenanne.jpg/320px-Seattlenighttimequeenanne.jpg")
        //             // ])
        //             // .tap(builder.CardAction.openUrl(session, "https://en.wikipedia.org/wiki/Space_Needle"))
        //     ]);

        session.endDialog(productListDisplay);
    });

});

// Handle Bot Framework messages
server.post('/api/messages', bot.verifyBotFramework(), bot.listen());

server.get('/api/creds', function (req, res, next) {
    var creds = {
        appId: process.env.BOTFRAMEWORK_APPID,
        appSecret: process.env.BOTFRAMEWORK_APPSECRET
    };
 res.send(creds)
});

server.get('/api/test', function (req, res, next) {
    client.get('/api/product/search/Lager', function(err, req, res, obj) {
        assert.ifError(err);
        //res.send(err);
        res.send(JSON.stringify(obj));
    });
 //res.send(creds)
});


// Serve a static web page
server.get(/.*/, restify.serveStatic({
	'directory': '.',
	'default': 'index.html'
}));

server.listen(process.env.port || 3978, function () {
    console.log('%s listening to %s', server.name, server.url); 
});

var getProducts = function(searchText) {
    client.get('api/product/search/'+ searchText, function(err, req, res, obj) {
        assert.ifError(err);
        return obj;
    });
};