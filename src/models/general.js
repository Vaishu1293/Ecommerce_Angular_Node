const mongoose = require("mongoose");
const validator = require("validator");

const genSchema = new mongoose.Schema({
  domain: {
    type: Number,
    required: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    unique: true,
    required: true,
    trim: true,
    lowercase: true,
    validate(value) {
      if (!validator.isEmail(value)) {
        throw new Error("Email is invalid");
      }
    },
  },
  confirmpassword: {
    type: String,
    required: true,
    minlength: 7,
    trim: true,
    validate(value) {
      if (value.toLowerCase().includes("password")) {
        throw new Error('Password cannot contain "password"');
      }
    },
  },
  userUpdatedPassword: {
    type: Boolean,
    required: true,
  },
  phone: {
    type: String,
    unique: true,
    trim: true,
    validate(value) {
      var len = value.length;
      var val = Number(value);
      if (val !== NaN && len === 11) {
        if (!validator.isNumeric(val)) {
          throw new Error("Not a phone number");
        }
      }
    },
  },
});

const General = mongoose.model("General", genSchema);

module.exports = General;
