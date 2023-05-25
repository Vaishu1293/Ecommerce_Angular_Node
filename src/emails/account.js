const sgMail = require('@sendgrid/mail')
const sendgridAPIKey = process.env.SENDGRID_API_KEY

sgMail.setApiKey(sendgridAPIKey)

const sendWelcomeEmail = (email, name) => {
    sgMail.send({
        to: email,
        from: 'vaishsvs12@gmail.com',
        subject: 'Thanks for joining in!',
        text: `Welcome ${name}, let me know how you get along the app`
    })
}

const sendCancelEmail = (email, name) => {
    sgMail.send({
        to: email,
        from: 'vaishsvs12@gmail.com',
        subject: 'Cancellation',
        text: `Ooo ${name} Sorry may I knw the reason for your cancellation`
    })
}

const sendOtpEmail = (email, otp) => {
  sgMail.send({
    to: email,
    from: 'vaishsvs12@gmail.com',
    subject: 'Your Otp to reset password',
    text: `${otp}, this OTP will expire in 60secs`
  })
}

const sendNewPasswordEmail = (email, name, password) => {
  sgMail.send({
    to: email,
    from: 'vaishsvs12@gmail.com',
    subject: 'Your New Password',
    text: `Hi ${name} your new Password is ${password}, please reset for security reasons`
  })
}

module.exports = {
    sendWelcomeEmail,
    sendCancelEmail,
    sendOtpEmail,
    sendNewPasswordEmail
}
