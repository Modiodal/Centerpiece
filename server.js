const express = require('express');
const passport = require('passport');
require('dotenv').config();
const twitterAuth = require('./auth/twitter-auth');
const twitchAuth = require('./auth/twitch-auth');
const fetch = require("node-fetch");


// Add passport auth for Twitter and Twitch
twitterAuth.getTwitterAuth();
twitchAuth.getTwitchAuth();


// Create express app and set middleware
const app = express();

// Configure view engine to render EJS templates
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use('/public', express.static('public'));


// Middleware for logging, parsing, and session handling
app.use(require('morgan')('combined'));
app.use(express.json());
app.use(require('body-parser').urlencoded({ extended: true }));
app.use(require('express-session')({ secret: process.env.EXPRESS_SESSION_SECRET, resave: true, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());




app.get('/',
    function(req, res) {
        Promise.all([fetch('https://api.nytimes.com/svc/topstories/v2/home.json?api-key=' + process.env.NYTIMES_ACCESS_TOKEN),
            fetch('https://api.openweathermap.org/data/2.5/weather?q=orlando&units=imperial&APPID=' + process.env.WEATHER_ACCESS_TOKEN)])
            .then(function (responses){
                return Promise.all(responses.map(function (response) {
                    return response.json();
                }))
            }) .then(data => {
            fetch('https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest?', {
                method: 'GET',
                headers: {'X-CMC_PRO_API_KEY': process.env.CRYPTO_ACCESS_TOKEN},
                json: true,
                gzip: true
            }).then(response => response.json())
                .then(coinData => {
                    let cryptoData = [];

                    for (const key in coinData.data){
                        cryptoData.push(coinData.data[key])
                    }

                    res.render('home', { articles: data[0].results, weather: data[1], crypto: cryptoData });
                });
        });
    });

app.post('/home/weather',
    function(req, res) {
        function hasNumber(myString) {
            return /\d/.test(myString);
        }

        if (hasNumber(req.body.userInput)) {
            fetch('https://api.openweathermap.org/data/2.5/weather?zip=' + req.body.userInput + '&units=imperial&APPID=' + process.env.WEATHER_ACCESS_TOKEN, {
                method: 'GET'
            }).then(response => response.json())
                .then(data => {
                    res.send(data)
                })
        } else {
            fetch('https://api.openweathermap.org/data/2.5/weather?q=' + req.body.userInput + '&units=imperial&APPID=' + process.env.WEATHER_ACCESS_TOKEN, {
                method: 'GET'
            }).then(response => response.json())
                .then(data => {
                    res.send(data)
                })
        }
    });


/*
Express app endpoints, Twitch
*/


app.get('/twitch',
    function(req, res) {
        mainUserFollows();
        let myFollows = [];
        let myLiveFollows = [];

        function multipleUsers(count, userPagination){
            if (count > 1){
                count -= 1;

                fetch('https://api.twitch.tv/helix/users/follows?first=100&from_id=' + req.user.id.toString() + '&after=' + userPagination, {
                    method: 'GET',
                    headers: {'Content-Type': 'application/json',
                        "Authorization": "Bearer " + process.env.TWITCH_ACCESS_TOKEN,
                        "Client-ID": process.env.TWITCH_CLIENT_ID}
                }).then(response => response.json())
                    .then(data => {
                        // Get pagination for next set of tweets
                        userPagination = data.pagination.cursor;

                        for (const key in data.data){
                            myFollows.push(data.data[key].to_id)
                        }

                        // Recurse until all follow ID's have been stored
                        multipleUsers(count, userPagination);
                    });
            }
        }
        function mainUserFollows(){
            fetch('https://api.twitch.tv/helix/users/follows?first=100&from_id=' + req.user.id.toString(), {
                method: 'GET',
                headers: {'Content-Type': 'application/json',
                    "Authorization": "Bearer " + process.env.TWITCH_ACCESS_TOKEN,
                    "Client-ID": process.env.TWITCH_CLIENT_ID}
            }).then(response => response.json())
                .then(data => {
                    // Get number of times to call user follows api
                    let count = 1 + (data.total/100|0);

                    // Get pagination for next set of tweets
                    var userPagination = data.pagination.cursor;
                    multipleUsers(count, userPagination);

                    // Append data to list to send to front end
                    for (const key in data.data){
                        myFollows.push(data.data[key].to_id)
                    }

                    fetch('https://api.twitch.tv/helix/streams?first=100&user_id=' + myFollows.join('&user_id='), {
                        method: 'GET',
                        headers: {'Content-Type': 'application/json',
                            "Authorization": "Bearer " + process.env.TWITCH_ACCESS_TOKEN,
                            "Client-ID": process.env.TWITCH_CLIENT_ID}
                    }).then(response => response.json())
                        .then(data => {

                            for (const key in data.data){
                                myLiveFollows.push(data.data[key].user_id)
                            }

                            fetch('https://api.twitch.tv/helix/users?first=100&id=' + myLiveFollows.join('&id='), {
                                method: 'GET',
                                headers: {'Content-Type': 'application/json',
                                    "Authorization": "Bearer " + process.env.TWITCH_ACCESS_TOKEN,
                                    "Client-ID": process.env.TWITCH_CLIENT_ID}
                            }).then(response => response.json())
                                .then(data => {
                                    res.render('twitch', { user: req.user, userPhoto: data.data });
                                })
                        });
                });
        }
    });

app.get('/login/twitch',
    passport.authenticate('twitchNew'), function (req, res) {
        req.login(user, function(err) {
            if (err) { return next(err); }
            return res.redirect('/twitch' + req.user.username);
        });
    });

app.get('/oauth/callback/twitch',
    passport.authenticate('twitchNew', {
        successRedirect: '/twitch', failureRedirect: '/'
    }));

app.get('/logout/twitch',
    function(req, res){
        res.clearCookie('connect.sid');
        res.redirect('/');
    });



/*
Express app endpoints, Twitter
*/


app.get('/twitter',
    function(req, res) {
        res.render('twitter', { user: req.user });
    });

app.get('/login/twitter',
    passport.authenticate('twitterNew'), function (req, res) {
        req.login(user, function(err) {
            if (err) {
                return next(err);
            }
            return res.redirect('/twitter' + req.user.username);
        });
    });

app.get('/oauth/callback/twitter',
    passport.authenticate('twitterNew', {
        successRedirect: '/twitter', failureRedirect: '/'
    }));

app.get('/logout/twitter',
    function(req, res){
        res.clearCookie('connect.sid');
        req.logout();
        res.redirect('/');
    });

app.post('/twitter/home_timeline', function(req, res){
    var Twit = require('twit');
    var T = new Twit({
        consumer_key:         process.env.TWITTER_CONSUMER_KEY,
        consumer_secret:      process.env.TWITTER_CONSUMER_SECRET,
        access_token:         process.env.TWITTER_ACCESS_TOKEN,
        access_token_secret:  process.env.TWITTER_ACCESS_TOKEN_SECRET,
        timeout_ms:           60*1000,
        strictSSL:            true,
    });
    T.get('statuses/home_timeline', { count: req.body.amount, max_id: req.body.lastTweet, tweet_mode: 'extended', include_entities: true }, function(err, data, response) {
        if (err){
            console.log(err);
        } else {
            return res.send(data);
        }
    });
});

app.post('/tweet', function(req, res){
    var Twit = require('twit');
    var T = new Twit({
        consumer_key:         process.env.TWITTER_CONSUMER_KEY,
        consumer_secret:      process.env.TWITTER_CONSUMER_SECRET,
        access_token:         process.env.TWITTER_ACCESS_TOKEN,
        access_token_secret:  process.env.TWITTER_ACCESS_TOKEN_SECRET,
        timeout_ms:           60*1000,
        strictSSL:            true,
    });
    T.post('statuses/update', { status: req.body.content }, function(err, data, response) {
        if (err){
            console.log(err)
        }
    });
    res.redirect('/twitter');
});


console.log('Server has started...');
app.listen(process.env['PORT'] || 3000);
