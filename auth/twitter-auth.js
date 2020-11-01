const passport = require('passport');
const twitterStrategy = require('passport-twitter').Strategy;
require('dotenv').config();


/*
Create the Twitter auth and set token's for use
in the routes below
*/

function getTwitterAuth() {

    var trustProxy = false;
    if (process.env.DYNO) {
        trustProxy = true;
    }

    passport.use('twitterNew', new twitterStrategy({
            consumerKey: process.env.TWITTER_CONSUMER_KEY,
            consumerSecret: process.env.TWITTER_CONSUMER_SECRET,
            callbackURL: '/oauth/callback/twitter',
        },
        function(token, tokenSecret, profile, cb) {
            process.env.TWITTER_ACCESS_TOKEN = token;
            process.env.TWITTER_ACCESS_TOKEN_SECRET = tokenSecret;
            return cb(null, profile);
        }));


    passport.serializeUser(function(user, cb) {
        cb(null, user);
    });

    passport.deserializeUser(function(obj, cb) {
        cb(null, obj);
    })
}

module.exports.getTwitterAuth = getTwitterAuth;



