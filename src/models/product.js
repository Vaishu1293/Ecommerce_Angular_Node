const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    product_name: {
      type: String,
    },
    brand_name: {
      type: String,
    },
    description: {
      type: String,
    },
    allergens: {
      type: [String],
    },
    nutrition_facts: {
      Calories: {
        type: Number,
        float: true,
      },
      Fat: {
        type: Number,
        float: true,
      },
      Saturated_Fat: {
        type: Number,
        float: true,
      },
      Cholesterol: {
        type: Number,
        float: true,
      },
      Sodium: {
        type: Number,
        float: true,
      },
      Carbohydrates: {
        type: Number,
        float: true,
      },
      Fiber: {
        type: Number,
        float: true,
      },
      Sugar: {
        type: Number,
        float: true,
      },
      Protein: {
        type: Number,
        float: true,
      },
    },
    price: {
      type: Number,
      float: true,
    },
    stocks: {
      type: Number,
    },
    expiration_date: {
      type: Date,
    },
    country_of_origin: {
      type: String,
    },
    barcode: {
      type: String,
    },
    product_category: {
      type: String,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Admin",
    },
    product_image: {
      type: Buffer,
    },
    orders: [
      {
        order: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Order"
        },
      },
    ],
    whishlist: [
      {
        customers: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Customer"
        }
      }
    ]
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

productSchema.methods.toJSON = function () {
  const product = this;
  const productObject = product.toObject();

  return productObject;
};

productSchema.methods.addOrder = async function (id) {
  const product = this;
  const order = id;

  product.orders = product.orders.concat({ order });

  await product.save();
  return order;
};

productSchema.methods.addBuyer = async function (id) {
  const product = this
  const check = product.wishlist
  const buyer = id
  const oldBuyer = false
  for (b of check) {
      if (b.wishlist.toString() == buyer) {
          oldBuyer = true
          break
      }
  }
  if (!oldBuyer) {
      product.wishlist = product.wishlist.concat({ buyer })

      await product.save()
      return buyer
  }
  res.status(500).json({
    msg: 'Already wishlisted'
  })
 
}

const Product = mongoose.model("Product", productSchema);

module.exports = Product;
