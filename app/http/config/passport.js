const passport = require('passport');
const localStrategy = require('passport-local').Strategy;
const User = require('../../models/user');
const bcrypt = require('bcrypt');

function init () {

        passport.use(new localStrategy({

                usernameField : 'email' },

                async (email, password, done) => {

                        const user = await User.findOne({ email : email});

                        if(!user) {

                                return done (null, false, { message : 'No Email found'});

                        }

                        try {

                                const match = await bcrypt.compare(password, user.password);

                                if(match) {

                                        return done(null, user, { message : 'Logged in success'});

                                }

                                return done(null, false, { message : 'Wrong username or password'});

                        } catch(e) {

                                return done(null, false, { message : 'Something went wrong'});

                        }
                }
        ));

        passport.serializeUser((user, done) => {

                done(null, user._id);

        });

        passport.deserializeUser((id, done) => {

                User.findById(id, (err,user) => {

                        done(err, user);

                })

        });

}

module.exports = init;