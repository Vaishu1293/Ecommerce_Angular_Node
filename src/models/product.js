const mongoose = require('mongoose')
const User = require('./admin')
const Student = require('./customer')

const productSchema = new mongoose.Schema({
    title: {
        type: String
    },
    instructions: {
        type: String
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Admin'
    },
    avatar: {
        type: Buffer
    },
    productimage: {
        type: Buffer
    },
    productnotes: {
        type: Buffer
    },
    buyers: [{
        buyer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Customer'
        }
    }]
}, {
    timestamps: true
})

//productSchema.virtual('', {
//    ref: 'Student',
//    localField: '_id',
//    foreignField: 'products'
//})

productSchema.methods.toJSON = function () {
    const product = this
    const productObject = product.toObject()

    return productObject
}

productSchema.methods.addBuyer = async function (id) {
    const product = this
    const check = product.buyers
    const buyer = id
    const oldBuyer = false
    for (b of check) {
        if (b.buyer.toString() == buyer) {
            oldBuyer = true
            break
        }
    }
    if (!oldBuyer) {
        product.buyers = product.buyers.concat({ buyer })

        await product.save()
        return buyer
    }
    return res.status(500).send(e)
   
}

const Product = mongoose.model('Product', productSchema)

module.exports = Product
