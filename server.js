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
bot.add('/', function (session) {
    
    //respond with user's message
    //session.send("You really said " + session.message.text);
    //session.send("Looking up products (" + session.message.text + ")...")
    session.sendTyping();
    client.get('/api/product/search/' + session.message.text, function(err, req, res, obj) {
        
        if (err != null) {
            session.endDialog("Sorry, I'm having an issue connecting to the project API");
            return;
        }

        session.send("I found " + obj.length + " products...");
        obj.forEach(function(element) {
            session.send(element.ProductName);
        }, this);

        session.endDialog("All Done!");
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