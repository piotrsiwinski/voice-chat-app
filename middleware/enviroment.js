/**
 * Created by Piotrek on 07.05.2017.
 */
var enviroment = (req, res, next) =>{
    res.locals.enviroment = req.app.get('env');
    res.locals[req.app.get('env')] = req.app.get('env');
    console.log(`My middleware ${JSON.stringify(res.locals)}`)
    next();
};

module.exports = {enviroment};