const express = require("express");
const serverless = require("serverless-http");
const cors = require('cors');
const app = express();
app.use(express.json());
app.use(cors({origin: "https://all-well-app.netlify.app"}));
const router = express.Router();
const mailer = require("nodemailer");

class MailService {
    async sendResetMail(email) {
        const smtpProtocol = mailer.createTransport({
            service: "smtp.gmail.com",
            port: 587,
            auth: {
                user: process.env.MAIL_USER,
                pass: process.env.MAIL_PASSWORD
            }
        });
        if (!email) return false;
        const htmlText = `<h1>Test App - Reset Password</h1> <br/><br/><br/> <h4>We received your request to reset your passworda.</h4> <br/> To reset your password click <a href="https://all-well-app.netlify.app/change-password.html/?email=${email}">HERE</a><br/>`;
        const mailOption = {
            from: `App Test <${process.env.MAIL_USER}>`,
            to: `${email}`,
            subject: "Test App - Reset Password",
            html: htmlText
        };
        smtpProtocol.sendMail(mailOption, (err) => !err);
    }
}

class UserService {
    constructor() {
        this.users = [];
    }

    userExist = (email) => {
        if (!email) return false;
        const userFound = this.users.find((utente) => utente.email === email);
        return !!userFound;
    }

    signUp(email, password) {
        if (!email || !password) return false;
        const newUser = {
            email: email,
            password: password
        };
        this.users.push(newUser);
        return newUser;
    }

    changePassword(email, password) {
        const user = this.userExist(email);
        if (!user) return false;
        user.password = password
        return user;
    }
}

const userService = new UserService();
const mailService = new MailService()
router.post('/login', cors(), (req, res) => {
    const user = req.body;
    if (!user.email || !user.password) return res.status(400).json({
        success: false,
        message: 'Email and password required'
    })

    const userExist = userService.userExist(user.email)
    if (!userExist) return res.status(400).json({
        success: false,
        message: 'User does not exist, please verify credentials or sign up'
    })

    if (userExist.password !== user.password) return res.status(400).json({
        success: false,
        message: 'Email or password wrong'
    })

    res.status(200).json({success: true, message: 'Logged in'})
})

router.post('/sign-up', cors(), (req, res) => {
    const user = req.body;
    if (!user.email || !user.password) return res.status(400).json({
        success: false,
        message: 'Email and password required'
    })

    const isUserAlreadySigned = userService.userExist(user.email)
    if (!!isUserAlreadySigned) return res.status(400).json({
        success: false,
        message: 'Email found - User already signed up'
    })

    userService.signUp(user.email, user.password)
    res.status(201).json({success: true, message: 'Signed Up'})
})

router.post('/change-password-email', cors(), (req, res) => {
    const user = req.body;
    if (!user.email) return res.status(400).json({
        success: false,
        message: 'Email required'
    })

    const userExist = userService.userExist(user.email)
    if (!userExist) return res.status(400).json({
        success: false,
        message: 'This email is not signed up yet. Please sign up before'
    })

    mailService.sendResetMail(user.email).then((imailSended) => {
        if (!imailSended) return res.status(400).json({
            success: false,
            message: 'Error in sending email'
        })
        res.status(200).json({success: true, message: 'Email sended'})
    })
})

router.post('/change-password', cors(), (req, res) => {
    const user = req.body;
    if (!user.email || !user.password) return res.status(400).json({
        success: false,
        message: 'Email and password required'
    })

    const userExist = userService.userExist(user.email)
    if (!userExist) return res.status(400).json({
        success: false,
        message: 'This email is not signed up yet. Please sign up before'
    })

    userService.changePassword(user.email, user.password)
    res.status(201).json({success: true, message: 'Password Changed'})
})

app.use(`/`, router);

module.exports = app;
module.exports.handler = serverless(app);
