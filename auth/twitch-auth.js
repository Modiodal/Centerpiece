const passport = require('passport');
// var twitchStrategy = require("@d-fischer/passport-twitch").Strategy;
require('dotenv').config();
var twitchStrategy = require("passport-twitch-new").Strategy;


/*
Create the Twitch auth and set token's for use
in the routes below
*/

function getTwitchAuth() {

    var trustProxy = false;
    if (process.env.DYNO) {
        trustProxy = true;
    }

    passport.use('twitchNew', new twitchStrategy({
            clientID: process.env.TWITCH_CLIENT_ID,
            clientSecret: process.env.TWITCH_CLIENT_SECRET,
            callbackURL: '/oauth/callback/twitch',
        },
        function(token, tokenSecret, profile, cb) {
            process.env.TWITCH_ACCESS_TOKEN = token;
            process.env.TWITCH_ACCESS_TOKEN_SECRET = tokenSecret;
            return cb(null, profile);
        }));
}

module.exports.getTwitchAuth = getTwitchAuth;



