const nodemailer = require("nodemailer")
require("dotenv").config()

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_APP_HOST,
    port: Number(process.env.EMAIL_APP_PORT),
    secure: process.env.BUILD=="prod", 
    auth: {
      user: process.env.EMAIL_APP_USER,
      pass: process.env.EMAIL_APP_PASS,
    },
})


exports.transporter=transporter