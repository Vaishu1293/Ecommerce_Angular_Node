const Mailjet = require("node-mailjet");
const mail = Mailjet.apiConnect(process.env.API_KEY, process.env.API_SECRET);

const sendWelcomeEmail = (email, name) => {
  const request = mail.post("send", { version: "v3.1" }).request({
    Messages: [
      {
        From: {
          Email: "vaishsvs12@gmail.com",
          Name: "Vaishali",
        },
        To: [
          {
            Email: email,
            Name: name,
          },
        ],
        Subject: "Thanks for joining in!",
        TextPart: `Welcome ${name}, let me know how you get along the app`,
        HTMLPart: `<h3>Welcome ${name}, let me know how you get along the app</h3>`,
        CustomID: "AppGettingStartedTest",
      },
    ],
  });

  request
    .then((result) => {
      //console.log(result.body);
    })
    .catch((err) => {
      //console.log(err.statusCode);
    });
};

const sendCancelEmail = (email, name) => {
  const request = mail.post("send", { version: "v3.1" }).request({
    Messages: [
      {
        From: {
          Email: "vaishsvs12@gmail.com",
          Name: "Vaishali",
        },
        To: [
          {
            Email: email,
            Name: name,
          },
        ],
        Subject: "Cancellation",
        TextPart: `Ooo ${name} Sorry may I know the reason for your cancellation`,
        HTMLPart: `<h3>Ooo ${name} Sorry may I know the reason for your cancellation</h3>`,
        CustomID: "CancellationEmail",
      },
    ],
  });

  request
    .then((result) => {
      //console.log(result.body);
    })
    .catch((err) => {
      //console.log(err.statusCode);
    });
};

const sendOtpEmail = (email, otp) => {
  const request = mail.post("send", { version: "v3.1" }).request({
    Messages: [
      {
        From: {
          Email: "vaishsvs12@gmail.com",
          Name: "Vaishali",
        },
        To: [
          {
            Email: email,
          },
        ],
        Subject: "Your OTP to reset password",
        TextPart: `${otp}, this OTP will expire in 60 seconds`,
        CustomID: "OtpEmail",
      },
    ],
  });

  request
    .then((result) => {
      //console.log(result.body);
    })
    .catch((err) => {
      //console.log(err.statusCode);
    });
};

const sendNewPasswordEmail = (email, name, password) => {
  const request = mail.post("send", { version: "v3.1" }).request({
    Messages: [
      {
        From: {
          Email: "vaishsvs12@gmail.com",
          Name: "Vaishali",
        },
        To: [
          {
            Email: email,
            Name: name,
          },
        ],
        Subject: "Your New Password",
        TextPart: `Hi ${name}, your new password is ${password}. Please reset it for security reasons.`,
        CustomID: "NewPasswordEmail",
      },
    ],
  });

  request
    .then((result) => {
      //console.log(result.body);
    })
    .catch((err) => {
      //console.log(err.statusCode);
    });
};

const sendOrderSuccessEmail = (email, name, orderNumber) => {
  const request = mail.post("send", { version: "v3.1" }).request({
    Messages: [
      {
        From: {
          Email: "vaishsvs12@gmail.com",
          Name: "Vaishali",
        },
        To: [
          {
            Email: email,
            Name: name,
          },
        ],
        Subject: "Order Confirmation - Order #" + orderNumber,
        TextPart: `Dear ${name},\n\nThank you for your order! Your order (Order #${orderNumber}) has been successfully placed.`,
        HTMLPart: `<h3>Dear ${name},</h3><p>Thank you for your order!</p><p>Your order (Order #${orderNumber}) has been successfully placed.</p>`,
        CustomID: "OrderSuccessEmail",
      },
    ],
  });

  request
    .then((result) => {
      //console.log(result.body);
    })
    .catch((err) => {
      //console.log(err.statusCode);
    });
};

const sendOrderCancelEmail = (email, name, reason) => {
  const request = mail.post("send", { version: "v3.1" }).request({
    Messages: [
      {
        From: {
          Email: "vaishsvs12@gmail.com",
          Name: "Vaishali",
        },
        To: [
          {
            Email: email,
            Name: name,
          },
        ],
        Subject: "Order Cancellation",
        TextPart: `Dear ${name},\n\nWe regret to inform you that your order has been cancelled. Reason: ${reason}. If you have any further inquiries, please feel free to contact us.`,
        HTMLPart: `<h3>Dear ${name},</h3><p>We regret to inform you that your order has been cancelled.</p><p><strong>Reason:</strong> ${reason}</p><p>If you have any further inquiries, please feel free to contact us.</p>`,
        CustomID: "OrderCancelEmail",
      },
    ],
  });

  request
    .then((result) => {
      //console.log(result.body);
    })
    .catch((err) => {
      //console.log(err.statusCode);
    });
};

module.exports = {
  sendWelcomeEmail,
  sendCancelEmail,
  sendOtpEmail,
  sendNewPasswordEmail,
  sendOrderSuccessEmail,
  sendOrderCancelEmail,
};
