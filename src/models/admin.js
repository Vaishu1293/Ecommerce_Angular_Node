const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

const adminSchema = new mongoose.Schema({
    domain: {
        type: Number,
        required: true,
        validate(value) {
            if (!value === 0) {
                throw new Error('Invalid')
            }
        }
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        unique: true,
        required: true,
        trim: true,
        lowercase: true,
        validate(value) {
            if (!validator.isEmail(value)) {
                throw new Error('Email is invalid')
            }
        }
    },
    confirmpassword: {
        type: String,
        required: true,
        minlength: 7,
        trim: true,
        validate(value) {
            if (value.toLowerCase().includes('password')) {
                throw new Error('Password cannot contain "password"')
            }
        }
  },
    phone: {
        type: String,
        unique: true,
        trim: true,
        validate(value) {
            var len = value.length
            var val = Number(value)
            if ((val === NaN) || (len > 10) || (len < 10)) {
                if (!validator.isNumeric(val)) {
                    throw new Error('Not a phone number')
                }
            }
        }
    },
  userUpdatedPassword: {
    type: Boolean,
    required: true
  },
    avatar: {
        type: Buffer
    },
    tokens: [{
        token: {
            type: String,
            required: true
        }
  }],
  activeUrl: [{
    Otp: String,
    issuedAt: Date,
    expiry: Date
  }]
}, {
    timestamps: true
})

adminSchema.virtual('products', {
    ref: 'Product',
    localField: '_id',
    foreignField: 'owner'
})

adminSchema.methods.toJSON = function () {
    const user = this
    const userObject = user.toObject()

    delete userObject.confirmpassword
    delete userObject.tokens

    return userObject
}

adminSchema.methods.generateAuthToken = async function () {
  const user = this
  const token = jwt.sign({ _id: user._id.toString() }, process.env.JWT_SECRET, { expiresIn: "1h" })

    user.tokens = user.tokens.concat({ token })
    await user.save()

    return token
}

adminSchema.methods.generateTokenUrl = async function () {
  const user = this
  const Otp = Math.floor(1000 + Math.random() * 9000);
  const issuedAt = new Date();
  const currentTime = new Date();
  const expiry = new Date(currentTime.setSeconds(currentTime.getSeconds() + 60));
  user.activeUrl = user.activeUrl.concat({
    Otp,
    issuedAt,
    expiry
  })
  await user.save()

  return Otp
}

adminSchema.statics.findByCredentials = async (email, confirmpassword) => {
    const user = await Admin.findOne({ email })

    if (!user) {
        throw new Error('Unable to login')
    }

    const isMatch = await bcrypt.compare(confirmpassword, user.confirmpassword)

    if (!isMatch) {
        throw new Error('Unable to login')
    }

    return user
}

adminSchema.pre('save', async function (next) {
    const user = this

    if (user.isModified('confirmpassword')) {
        user.confirmpassword = await bcrypt.hash(user.confirmpassword, 8)
    }

    next()
})

const Admin = mongoose.model('Admin', adminSchema)

module.exports = Admin
