import nodemailer from 'nodemailer';
import smtp from 'nodemailer-smtp-transport';

// create reusable transporter object using SMTP transport
let emailClient = nodemailer.createTransport(smtp({
    port: process.env.MAILGUN_SMTP_PORT,
    host: process.env.MAILGUN_SMTP_SERVER,
    auth: {
        user: process.env.MAILGUN_SMTP_LOGIN,
        pass: process.env.MAILGUN_SMTP_PASSWORD
    },
    name: 'yacha.herokuapp.com'
}));

export default emailClient;
