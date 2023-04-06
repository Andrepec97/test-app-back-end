const express = require("express");
const serverless = require("serverless-http");

const app = express();
const router = express.Router();

app.use(express.json());
const users = []

router.post('/login', (req, res) => {
    const user = req.body;
    if (!user.email || !user.password) return res.status(400).json({
        success: false,
        message: 'Email and password required'
    })

    const userExist = users.find((utente) => utente.email === user.email)
    if (!userExist) return res.status(400).json({
        success: false,
        message: 'User does not exist, please verify credentials or sign up'
    })

    if (userExist.password !== user.password) return res.status(400).json({
        success: false,
        message: 'Email or password wrong'
    })

    console.log(users)
    res.status(200).json({success: true, message: 'Logged in'})
})

router.post('/sign-up', (req, res) => {
    const user = req.body;
    if (!user.email || !user.password) return res.status(400).json({
        success: false,
        message: 'Email and password required'
    })

    const isUserAlreadySigned = users.find((utente) => utente.email === user.email)
    if (!!isUserAlreadySigned) return res.status(400).json({
        success: false,
        message: 'Email found - User already signed up'
    })

    users.push(user)
    console.log(users)
    res.status(201).json({success: true, message: 'Signed Up'})
})

router.all('*', (req, res) => {
    res.status(403).json({success: false, message: 'You are not allowed to this url'});
})

app.use(`/.netlify/functions/api`, router);

module.exports = app;
module.exports.handler = serverless(app);
