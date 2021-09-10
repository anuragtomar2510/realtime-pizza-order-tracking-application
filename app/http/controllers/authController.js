const bcrypt = require('bcrypt');
const Joi = require('joi');
const User = require('../../models/user');
const passport = require('passport');

function authController () {

        const _getRedirectUrl = (req) => {

                return req.user.role === 'admin' ? '/admin/orders' : '/'; 

        }

        return {

                login(req, res) {

                        res.render('auth/login');

                },

                register(req, res) {

                        res.render('auth/register');
                }, 

                async postRegister(req, res) {

                        const registerSchema = Joi.object({

                                name : Joi.string().min(3).max(30).required(),

                                email : Joi.string().email().required(),

                                password : Joi.string().pattern(new RegExp('^[a-zA-Z0-9]{3,30}$')).required()

                        });
                        
                        const {error} = registerSchema.validate(req.body);
                        const {name, email, password} = req.body;

                        
                        if(error) {

                                req.flash('error', 'All fields are required');

                                req.flash('name', name);

                                req.flash('email', email);

                                return res.redirect('/register');

                        }

                        try {

                               const result = await User.exists({email : email});

                                if(result) {

                                        req.flash('error', 'Email already taken');

                                        req.flash('name', name);

                                        req.flash('email', email);

                                        return res.redirect('/register');


                                }

                        } catch(err) {

                                console.log('Something went wrong');

                        }
                        

                                
                        


                        const hashedPassword = await bcrypt.hash(password, 10);

                        const user = new User({

                                name, 
                                email, 
                                password : hashedPassword 

                        });

                        try {

                                const savedUser = await user.save();

                                // Login savedUser

                                // Redirect to home-page 

                                return res.redirect('/');


                        } catch (err) {

                                req.flash('error', 'Something went wrong');

                                return res.redirect('/register');

                        }
                },

                postLogin(req, res, next) {

                        const loginSchema = Joi.object({

                                email : Joi.string().email().required(),

                                password : Joi.string().pattern(new RegExp('^[a-zA-Z0-9]{3,30}$')).required()

                        });
                        
                        const {error} = loginSchema.validate(req.body);

                        if(error) {

                                req.flash('error', 'All fields are required');

                                return res.redirect('/login');

                        }



                        passport.authenticate('local',(err, user, info) => {

                                if(err) {

                                        req.flash('error', info.message);
                                        return next(err);

                                }

                                if(!user) { 

                                        req.flash('error', info.message);
                                        return res.redirect('/login');

                                }

                                req.logIn(user, (err) => {

                                        if(err) {

                                                req.flash('error', info.message);
                                                return next(err);

                                        }

                                        return res.redirect(_getRedirectUrl(req));

                                      
                                });

                        })(req, res, next);
                },

                logout(req, res) {

                        req.logout();
                        return res.redirect('/login');
                        
                }
        }

}

module.exports = authController;