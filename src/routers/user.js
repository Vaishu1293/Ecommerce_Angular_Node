//Import express for Router setup
//Models - User, customer

const express = require("express");
const auth = require("../middleware/auth");
const Admin = require("../models/admin");
const Customer = require("../models/customer");
const General = require("../models/general");
const multer = require("multer");
const sharp = require("sharp");
const {
  sendWelcomeEmail,
  sendCancelationEmail,
  sendOtpEmail,
  sendNewPasswordEmail,
} = require("../emails/account");
const router = new express.Router();

// Routes

//------------------------------REGISTRATION AND LOGIN ROUTES---------------------------------------------------

// 1) REGISTRATION ROUTE FOR BOTH ADMIN AND CUSTOMERS

router.post("/register", async (req, res) => {
  const ind = new General(req.body);
  const user = new Admin(req.body);
  const customer = new Customer(req.body);
  try {
    if (ind.domain === 0) {
      // INSTRUCTOR
      try {
        await user.save();
        const token = await user.generateAuthToken();
        sendWelcomeEmail(user.email, user.name);
        res.status(201).json({
          msg: "User Created!",
          user: user,
          token: token,
          expiresIn: 3600,
        });
      } catch (e) {
        var msg = "error";
        var keyVal = Object.keys(e.keyValue);
        if (keyVal == "phone") {
          //console.log(e.keyValue.phone)
          msg = "Phone No already enrolled";
        } else if (keyVal == "email") {
          msg = "Email already enrolled";
        } else {
          msg = e;
        }

        res.status(400).json({
          msg: msg,
        });
      }
    } else if (ind.domain === 1) {
      // customer
      try {
        await customer.save();
        const token = await customer.generateAuthToken();
        sendWelcomeEmail(customer.email, customer.name);
        res.status(201).json({
          msg: "User Created!",
          user: user,
          token: token,
          expiresIn: 3600,
        });
      } catch (e) {
        var msg = "error";
        var keyVal = Object.keys(e.keyValue);
        if (keyVal == "phone") {
          //console.log(e.keyValue.phone)
          msg = "Phone No already enrolled";
        } else if (keyVal == "email") {
          msg = "Email already enrolled";
        } else {
          msg = e;
        }

        res.status(400).json({
          msg: msg,
        });
      }
    } else {
      return res.status(400).json({
        msg: "error",
      });
    }
  } catch (e) {
    var msg = "error";
    res.status(400).json({
      msg: msg,
    });
  }
});

//-------------------------------------------------LOGIN ROUTE------------------------------------------------------------------

//2) LOGIN ROUTE FOR BOTH ADMIN & CUSTOMER

router.post("/login", async (req, res) => {
  const domain = req.body.domain;
  const email = req.body.email;
  const confirmpassword = req.body.password;

  if (domain == 0) {
    try {
      const user = await Admin.findByCredentials(email, confirmpassword);
      const token = await user.generateAuthToken();
      res.status(200).json({
        user: user,
        domain: user.domain,
        token: token,
        expiresIn: 3600,
      });
    } catch (e) {
      //console.log(e)
      res.status(400).json({
        error: e,
        msg: "Auth Failed!..Not Registered",
      });
    }
  } else if (domain == 1) {
    try {
      const customer = await Customer.findByCredentials(email, confirmpassword);
      const token = await customer.generateAuthToken();
      res.status(200).json({
        user: customer,
        domain: customer.domain,
        token: token,
        expiresIn: 3600,
      });
    } catch (e) {
      res.status(400).json({
        error: e,
        msg: "Auth Failed!..Not Registered",
      });
    }
  } else {
    res.status(400).json({
      msg: "Auth Failed!..Not Registered",
    });
  }
});

//--------------------------------------------------FORGOT PASSWORD-------------------------------------------------------------

//3) FORGOT PASSWORD ROUTE FOR BOTH ADMIN & CUSTOMER

router.post("/forgot-password", async (req, res) => {
  const email = req.body.email;
  const domain = req.body.domain;

  //console.log(email)
  //console.log(domain)

  if (domain == 0) {
    const user = await Admin.findOne({ email: email });

    if (user) {
      if (user.activeUrl != []) {
        user.activeUrl = [];
        await user.save();
      }
      const Otp = await user.generateTokenUrl();
      sendOtpEmail(user.email, Otp);
      return res.status(200).json({
        msg: "OTP send to email",
        otp: Otp,
      });
    } else {
      return res.status(400).json({
        msg: "Not registered please register!",
      });
    }
  } else {
    const customer = await Customer.findOne({ email: email });

    if (customer) {
      if (customer.activeUrl != []) {
        customer.activeUrl = [];
        await customer.save();
      }
      const Otp = await customer.generateTokenUrl();
      sendOtpEmail(customer.email, Otp);
      return res.status(200).json({
        msg: "OTP send to email",
        otp: Otp,
      });
    } else {
      return res.status(400).json({
        msg: "Not registered please register!",
      });
    }
  }
});

//---------------------------------------------------VALID OTP------------------------------------------------------------------

//4) OTP VALIDATION ROUTE FOR BOTH ADMIN & CUSTOMERS

router.post("/validate-otp", async (req, res) => {
  const email = req.body.email;
  const domain = req.body.domain;
  const otp = req.body.otp;
  const password = Math.random().toString(36).substring(2, 10);
  const userUpdatedPassword = false;

  if (domain == 0) {
    const user = await Admin.findOne({ email: email });

    if (!user) {
      return res.status(400).json({
        msg: "No such user!",
      });
    }

    user.activeUrl.forEach(function (otpData) {
      if (otpData.Otp == otp && otpData.expiry > new Date()) {
        OTP_CURRENT = true;
      } else {
        OTP_CURRENT = false;
      }
    });
    if (OTP_CURRENT) {
      user.activeUrl = [];
      user.confirmpassword = password;
      user.userUpdatedPassword = userUpdatedPassword;
      await user.save();
      sendNewPasswordEmail(user.email, user.name, password);
      return res.status(200).json({
        msg: "New Password sent to your Email",
        user: user,
        password: password,
        userUpdatedPassword: userUpdatedPassword,
      });
    } else {
      user.activeUrl = [];
      await user.save();
      return res.status(500).json({
        msg: "Invalid OTP try again!",
      });
    }
  } else {
    const customer = await customer.findOne({ email: email });

    if (!customer) {
      return res.status(400).json({
        msg: "No such user!",
      });
    }

    customer.activeUrl.forEach(function (otpData) {
      if (otpData.Otp == otp && otpData.expiry > new Date()) {
        OTP_CURRENT = true;
      } else {
        OTP_CURRENT = false;
      }
    });
    if (OTP_CURRENT) {
      customer.activeUrl = [];
      customer.confirmpassword = password;
      customer.userUpdatedPassword = userUpdatedPassword;
      await customer.save();
      sendNewPasswordEmail(customer.email, customer.name, password);
      return res.status(200).json({
        msg: "New Password sent to your Email",
        user: customer,
        password: password,
        userUpdatedPassword: userUpdatedPassword,
      });
    } else {
      customer.activeUrl = [];
      await customer.save();
      return res.status(500).json({
        msg: "Invalid OTP try again!",
      });
    }
  }
});

//-----------------------------------LOGOUT ROUTE-------------------------------------------------------------------------------

//5) LOGOUT ROUTE FOR BOTH CUSTOMERS & ADMIN

router.post("/users/logout", auth, async (req, res) => {
  //console.log(req.user)
  try {
    req.user.tokens = req.user.tokens.filter((token) => {
      return token.token !== req.token;
    });
    await req.user.save();

    res.status(200).json({
      msg: "You are now logged out!",
    });
  } catch (e) {
    res.status(500).json({
      error: e,
    });
  }
});

//----------------------------------LOGOUTALL ROUTE--------------------------------------------------------------------------

// 6) LOGOUTALL FOR BOTH CUSTOMER & ADMIN

router.post("/logoutAll", auth, async (req, res) => {
  try {
    req.user.tokens = [];
    await req.user.save();
    res.send();
  } catch (e) {
    res.status(500).send();
  }
});

//-------------------------------------USERS PROFILE---------------------------------------------------------

// 1) VIEW PROFILE

router.get("/profile/me", auth, async (req, res) => {
  res.json({
    user: req.user,
  });
});

//-----------------------------UPDATE PROFILE----------------------------------------------------------------

// 2) UPDATE PROFILE ROUTES

router.patch("/users/me", auth, async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = [
    "name",
    "confirmpassword",
    "userUpdatedPassword",
    "address",
    "city",
    "state",
    "country",
  ];
  const isValidOperation = updates.every((update) =>
    allowedUpdates.includes(update)
  );

  if (!isValidOperation) {
    return res.status(400).json({ error: "Invalid updates!" });
  }

  try {
    updates.forEach((update) => (req.user[update] = req.body[update]));
    await req.user.save();
    res.json({
      user: req.user,
      token: req.user.token,
      expiresIn: 3600,
    });
  } catch (e) {
    res.status(400).json({
      error: e,
    });
  }
});

//----------------------------------------------------------DELETE PROFILE-------------------------------------------------------

router.delete("/users/me", auth, async (req, res) => {
  const email = req.user.email;
  const name = req.user.name;

  try {
    await req.user.remove();
    sendCancelationEmail(email, name)
    res.send("Bye Bye");
  } catch (e) {
    res.status(500).send();
  }
});

//------------------------------------------IMAGE UPLOADS-----------------------------------------------------------

const upload = multer({
  limits: {
    fileSize: 1000000000,
  },
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
      return cb(new Error("Please upload an image"));
    }

    cb(undefined, true);
  },
});

//-----------------------------------UPLOAD PROFILE PICTURE----------------------------------------------------------

router.post(
  "/users/me/avatar",
  auth,
  upload.single("avatar"),
  async (req, res) => {
    const buffer = await sharp(req.file.buffer).png().toBuffer();
    req.user.avatar = buffer;
    await req.user.save();
    res.json({
      msg: "profile picture updated successfully!!",
      user: req.user,
      token: req.user.token,
      expiresIn: 3600,
    });
  },
  (error, req, res, next) => {
    res.status(400).json({ error: error.message });
  }
);

//--------------------------------------DELETE PROFILE PICTURE-------------------------------------------------------------------

router.delete("/users/me/avatar", auth, async (req, res) => {
  req.user.avatar = undefined;
  await req.user.save();
  res.json({
    user: req.user,
  });
});

//------------------------------------------------RETIRVE PROFILE PICTURE----------------------------------------------------------

router.get("/users/:id/avatar", async (req, res) => {
  const users = await Admin.findById(req.params.id);
  const customer = await customer.findById(req.params.id);

  if (!users) {
    user = customer;
  } else {
    user = users;
  }
  try {
    if (!user.avatar) {
      throw new Error();
    }

    res.set("Content-Type", "image/png");
    res.send(user.avatar);
  } catch (e) {
    res.status(404).send();
  }
});

//---------------------------------------------****END****-----------------------------------------------------------------------

module.exports = router;
