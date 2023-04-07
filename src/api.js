const express = require("express");
const serverless = require("serverless-http");
const cors = require('cors');

const app = express();
const router = express.Router();
const nodemailer = require("nodemailer");

app.use(express.json());
app.use(cors({origin: "https://all-well-app.netlify.app"}));
const tranport = nodemailer.createTransport({
    host: 'smtp.gmail.com', port: 587, auth: {
        user: process.env.MAIL_USER, pass: process.env.MAIL_PASSWORD,
    }
});

class UserService {
    constructor() {
        this.users = [];
    }

    userExist = (email) => {
        if (!email) return false;
        const userFound = this.users.find((utente) => utente.email === email);
        return !!userFound;
    }

    signUp(user) {
        if (!user.email || !user.password) return false;
        this.users.push(user);
        return user;
    }

    changePassword(email, password) {
        const user = this.userExist(email);
        if (!user) return false;
        user.password = password
        return user;
    }
}

const userService = new UserService();
router.post('/login', cors(), (req, res) => {
    const user = req.body;
    if (!user.email || !user.password) return res.status(400).json({
        success: false, message: 'Email and password required'
    })

    const userExist = userService.userExist(user.email)
    if (!userExist) return res.status(400).json({
        success: false, message: 'User does not exist, please verify credentials or sign up'
    })

    if (userExist.password !== user.password) return res.status(400).json({
        success: false, message: 'Email or password wrong'
    })

    res.status(200).json({success: true, message: 'Logged in'})
})

router.post('/sign-up', cors(), (req, res) => {
    const user = req.body;
    if (!user.email || !user.password) return res.status(400).json({
        success: false, message: 'Email and password required'
    })

    const isUserAlreadySigned = userService.userExist(user.email)
    if (!!isUserAlreadySigned) return res.status(400).json({
        success: false, message: 'Email found - User already signed up'
    })

    userService.signUp(user)
    res.status(201).json({success: true, message: 'Signed Up'})
})

router.post('/change-password-email', cors(), (req, res) => {
    const user = req.body;
    if (!user.email) return res.status(400).json({
        success: false, message: 'Email required'
    })

    const userExist = userService.userExist(user.email)
    if (!userExist) return res.status(400).json({
        success: false, message: 'This email is not signed up yet. Please sign up before'
    })
    const message = {
        from: `Test App <${process.env.MAIL_USER}`,
        to: user.email,
        subject: 'Test App - Change Password',
        html: `<h1>Test App</h1><br/><h3>Change Password</h3><br/><p>Hi!<br/>We received a request to reset your password.<br/>To procede <a href="https://all-well-app.netlify.app/change-password.html?email=${user.email}">Click Here!</a></p>`
    };
    tranport.sendMail(message, (error) => {
        if (!!error) return res.status(400).json({
            success: false,
            message: `Error in sending email:with credentials user: ${process.env.MAIL_USER}, pass:${process.env.MAIL_PASSWORD} - Error: ${error}`
        })
        res.status(200).json({success: true, message: 'Email sent'})
    })
})

router.post('/change-password', cors(), (req, res) => {
    const user = req.body;
    if (!user.email || !user.password) return res.status(400).json({
        success: false, message: 'Email and password required'
    })

    const userExist = userService.userExist(user.email)
    if (!userExist) return res.status(400).json({
        success: false, message: 'This email is not signed up yet. Please sign up before'
    })

    userService.changePassword(user.email, user.password)
    res.status(201).json({success: true, message: 'Password Changed'})
})

app.use(`/`, router);

module.exports = app;
module.exports.handler = serverless(app);
