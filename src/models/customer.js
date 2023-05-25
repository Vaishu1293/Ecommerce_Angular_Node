const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

const customerSchema = new mongoose.Schema({
    domain: {
        type: Number,
        required: true,
        validate(value) {
            if (!value === 1) {
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
  userUpdatedPassword: {
    type: Boolean,
    required: true
  },
    phone: {
        type: String,
        unique: true,
        trim: true,
        validate(value) {
            var len = value.length
            var val = Number(value)
            if ((val !== NaN) && (len === 11)) {
                if (!validator.isNumeric(val)) {
                    throw new Error('Not a phone number')
                }
            }
        }
    },
    tokens: [{
        token: {
            type: String,
            required: true
        }
    }],
    avatar: {
        type: Buffer
    },
    tasks: [{
        task: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Task'
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

//customerSchema.virtual('tasks', {
//    ref: 'Task',
//    localField: '_id',
//    foreignField: 'buyers'
//})

customerSchema.methods.addTask = async function (id) {
    const customer = this
    const task = id
   
    customer.tasks = customer.tasks.concat({ task })
    await customer.save()
    return task
}

customerSchema.methods.toJSON = function () {
    const customer = this
    const customerObject = customer.toObject()

    delete customerObject.confirmpassword
    delete customerObject.tokens

    return customerObject
}

customerSchema.statics.findByCredentials = async (email, password) => {
    const customer = await Customer.findOne({ email })

    if (!customer) {
        throw new Error('Unable to login')
    }

    const isMatch = await bcrypt.compare(password, customer.confirmpassword)

    if (!isMatch) {
        throw new Error('Unable to login')
    }

    return customer
}

customerSchema.methods.generateAuthToken = async function () {
    const customer = this
    const token = jwt.sign({ _id: customer._id.toString() }, 'thisismynewcourse')

    customer.tokens = customer.tokens.concat({ token })
    await customer.save()

    return token
}

customerSchema.methods.generateTokenUrl = async function () {
  const customer = this
  const Otp = Math.floor(1000 + Math.random() * 9000);
  const issuedAt = new Date();
  const currentTime = new Date();
  const expiry = new Date(currentTime.setSeconds(currentTime.getSeconds() + 60));
  customer.activeUrl = customer.activeUrl.concat({
    Otp,
    issuedAt,
    expiry
  })
  await customer.save()

  return Otp
}

customerSchema.statics.findByCredentials = async (email, confirmpassword) => {
    const customer = await Customer.findOne({ email })

    if (!customer) {
        throw new Error('Unable to login')
    }

    const isMatch = await bcrypt.compare(confirmpassword, customer.confirmpassword)

    if (!isMatch) {
        throw new Error('Unable to login')
    }

    return customer
}

customerSchema.pre('save', async function (next) {
    const customer = this

    if (customer.isModified('confirmpassword')) {
        customer.confirmpassword = await bcrypt.hash(customer.confirmpassword, 8)
    }

    next()
})

const Customer = mongoose.model('Customer', customerSchema)

module.exports = Customer
