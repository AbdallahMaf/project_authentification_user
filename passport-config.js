const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require("bcryptjs");

function initialize(passport, getUserByEmail, getUserById) {
    const authenticateUser = async(email, password, done) => {
        const user = await getUserByEmail(email);
        if(user == null){
            return done(null, false, {message: "Aucun utlisateur avec cette adresse email" });
        }

        try{
            if(await bcrypt.compare(password, user.password)){
                return done(null, user);
            }else{
                return done(null, false, {message: "Mot de Passe incorrect"})
            }
        }catch(err){
            return done(e)
        }
    };

    passport.use(new LocalStrategy({ usernameField: "email"}, authenticateUser))
    passport.serializeUser((user, done) => done(null, user.id));
    passport.deserializeUser(async (id, done) => {
        return done(null, await getUserById(id));
    });
}
module.exports = initialize;
