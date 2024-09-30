const loginRequired = (req, res, next) => {
    if (req.session.userId){
        next()
    }
    else{
        res.send("You are not authorized to view this page")
    }
}

const alreadyLoggedIn = (req, res, next) => {
    if(req.session.userId){
        res.send("You are already logged")
    }
    else{
        next()
    }
}

const authMiddlewareObj = {
    loginRequired: loginRequired,
    alreadyLoggedIn: alreadyLoggedIn
}

module.exports = authMiddlewareObj