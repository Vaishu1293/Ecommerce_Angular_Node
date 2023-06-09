const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    products: [
      {
          productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
          },
          product_name: {
            type: String,
          },
          product_image: {
            type: Buffer,
          },
          product_order_status: {
            type: Boolean,
          },
          product_price: {
            type: Number,
            float: true,
          },
          quantity: {
            type: Number,
          },
          owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Admin",
          }
        }
    ],
    order_total: {
      type: Number,
      float: true,
    },
    order_status: {
      type: Boolean,
    },
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
    },
  },
  {
    timestamps: true,
  }
);

//productSchema.virtual('', {
//    ref: 'Student',
//    localField: '_id',
//    foreignField: 'products'
//})

orderSchema.methods.toJSON = function () {
  const order = this;
  const orderObject = order.toObject();

  return orderObject;
};

const Order = mongoose.model("Order", orderSchema);

module.exports = Order;
