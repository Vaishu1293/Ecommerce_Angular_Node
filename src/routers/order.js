const express = require("express");
const Product = require("../models/product");
const Admin = require("../models/admin");
const Customer = require("../models/customer");
const Order = require("../models/order");
const router = new express.Router();
const auth = require("../middleware/auth");
const multer = require("multer");
const sharp = require("sharp");
const {
  sendOrderSuccessEmail,
  sendOrderCancelEmail
} = require("../emails/account");

//-------------------------PRODUCT ROUTER FOR ADMIN----------------------------------------------

// 1) ADDING PRODUCT-

const upload = multer({
  limits: {
    fileSize: 100000000,
  },
  fileFilter(req, file, cb) {
    console.log(file);
    if (!file.originalname.match(/\.(jpg|jpeg|png|json)$/)) {
      return cb(
        new Error(
          "Please upload an image with a .jpg, .jpeg, or .png extension"
        )
      );
    }
    console.log(file.originalname);
    cb(null, true);
  },
});

// --------------------------------------------------- CREATE AN ORDER ----------------------------------------------------------------------

router.post("/order", auth, async (req, res) => {

  const products = req.body.products
  const order_total = req.body.order_total
  const order_status = req.body.order_status
  const buyer = await Customer.findOne({ _id: req.user._id });

  let orderProducts = []

  for (p of products){
    let prod = await Product.findById(p.productId)
    let data = {
      productId: p.productId,
      product_name: prod.product_name,
      product_image: prod.product_image,
      price: p.price,
      quantity: p.quantity,
      owner: p.owner
    }
    orderProducts.push(p)
  }

  const orderData = {
    products: orderProducts,
    order_total: order_total,
    order_status: order_status,
    buyer: req.user._id
  }

  const order = new Order(orderData);

  await order.save();

  try {
    const id = req.user._id;

    for (x of products) {
      var product = await Product.findOne({ _id: x.productId });

      if (!product) {
        return res.status(404).send();
      }

      await product.addOrder(order._id);
      await product.save();

      var owner = await Admin.findOne({ _id: product.owner });

      if (!owner) {
        return res.status(404).send();
      }

      await owner.addOrder(order._id);
      await owner.save();
    }
    await buyer.addOrder(order._id);
    await buyer.save();

    sendOrderSuccessEmail(buyer.email, buyer.name, order._id)

    res.status(201).json({
      order: order,
      user: buyer,
      message: "Successfully placed order",
    });
  } catch (e) {
    res.status(400).json({
      error: e,
    });
  }
});

//-----------------------------------------------------RETRIVE ORDERS CUSTOMERS---------------------------------------------------------------------------

// 2) RETIRVE ALL ORDERS PLACED BY CUSTOMER

router.get("/myorders", auth, async (req, res) => {
  var per_page = parseInt(req.query.limit) || 10;
  var page = parseInt(req.query.skip) || 1;
  offset = (page - 1) * per_page;

  var myOrders = [];
  try {
    let orders = req.user.orders;
    for (o of orders) {
      const _id = o.order;
      let myorder = await Order.findById(_id);
      myOrders.push(myorder);
    }

    myOrders.reverse();

    let length = myOrders.length;
    modifiedMyOrders = myOrders.slice(offset).slice(0, req.query.limit);

    res.json({
      length: modifiedMyOrders.length,
      totalOrders: length,
      allOrders: modifiedMyOrders,
      userDomain: req.user.domain,
    });
  } catch (e) {
    res.status(500).send();
  }
});

//------------------------------RETRIVE SINGLE ORDER CUSTOMER------------------------------------------------------------------

// 3) GET SINGLE ORDER WHICH IS PLACED BY THE CUSTOMER

router.get("/myorders/get/:id", auth, async (req, res) => {
  const _id = req.params.id;

  try {
    const order = await Order.findOne({ _id });

    if (!order) {
      return res.status(404).json({
        error: "No such Order",
      });
    }

    orderProducts = [];

    for (p in order.products) {
      var product = await Product.findOne({ _id: p.productId });
      var price = p.price;
      var quantity = p.quantity;

      if (!product) {
        var orderProduct = {
          product: "Product No longer available",
          product_name: p.product_name,
          product_image: p.product_image,
          price: price,
          quantity: quantity,
        };
      } else {
        var orderProduct = {
          product: product,
          product_name: p.product_name,
          product_image: p.product_image,
          price: price,
          quantity: quantity,
        };
      }

      orderProducts.push(orderProduct);

      order_data = {
        products: orderProducts,
        order_total: 15.99,
        status: true,
        buyer: "buyerId",
      };
    }

    res.json({
      order: order_data,
      domain: req.user.domain,
    });
  } catch (e) {
    res.status(500).json({
      error: e,
    });
  }
});

//-----------------------------------------------CANCEL ORDER CUSTOMER------------------------------------------------------------------------------

router.put("/myorders/:id", auth, async (req, res) => {
  const updates = Object.keys(req.body);
  var o = req.body;

  const allowedUpdates = ["products", "order_total", "order_status"];

  //productData.nutrition_facts = JSON.parse(productData.nutrition_facts);
  const isValidOperation = updates.every((update) =>
    allowedUpdates.includes(update)
  );

  if (!isValidOperation) {
    return res.status(400).json({ error: "Invalid updates!" });
  }

  try {
    const order = await Order.findOne({
      _id: req.params.id,
    });
    console.log(order);

    if (!order) {
      return res.status(404).json({
        error: "Order Not Found!",
      });
    }

    o.products = JSON.parse(o.products);
    updates.forEach((update) => (order[update] = o[update]));

    savedOrder = await order.save();
    //console.log(product)
    sendOrderSuccessEmail(buyer.email, buyer.name, order._id)
    
    return res.status(200).json({
      message: "Order Modified Successfully",
      order: savedOrder,
      id: order._id,
    });
  } catch (e) {
    res.status(400).json({
      error: e,
    });
  }
});

//-------------------------------------- ADMIN ORDER ROUTES ---------------------------------------------------------------------

// GET /products?completed=true
// GET /products?pageSize=${productsPerPage}&currentPage=${currentPage}
// GET /products?sortBy=createdAt:desc or asc
router.get("/user-orders", auth, async (req, res) => {
  var per_page = parseInt(req.query.limit) || 10;
  var page = parseInt(req.query.skip) || 1;
  offset = (page - 1) * per_page;

  var myOrders = [];
  try {
    let orders = req.user.orders;

    for (o of orders) {
      let orderProducts = [];
      const _id = o.order_id;
      let myorder = await Order.findById(_id);

      for (p in myorder.products) {
        if (req.user._id == p.owner) {
          orderProducts.push(p);
        }
      }

      let buyer = await Customer.findById(myorder.buyer);

      if (!buyer) {
        buyer = "Buyer Data not available";
      }

      order_data = {
        order_id: _id,
        products: orderProducts,
        buyer: buyer,
      };

      myOrders.push(order_data);
    }

    myOrders.reverse();

    let length = myOrders.length;
    modifiedMyOrders = myOrders.slice(offset).slice(0, req.query.limit);

    res.json({
      length: modifiedMyOrders.length,
      totalOrders: length,
      allOrders: modifiedMyOrders,
      userDomain: req.user.domain,
    });
  } catch (e) {
    res.status(500).send();
  }
});

//------------------------------RETRIVE SINGLE ORDER-----------------------------------------------------------------------------

router.get("/user-orders/:id", auth, async (req, res) => {
  const _id = req.params.id;

  try {
    const order = await Order.findOne({ _id });

    if (!order) {
      return res.status(404).json({
        error: "No such Order",
      });
    }

    let orderProducts = [];

    for (p in order.products) {
      if (req.user._id == p.owner) {
        var product = await Product.findOne({ _id: p.productId });
        var price = p.price;
        var quantity = p.quantity;

        if (!product) {
          var orderProduct = {
            product: "Product No longer available",
            product_name: p.product_name,
            product_image: p.product_image,
            price: price,
            quantity: quantity,
          };
        } else {
          var orderProduct = {
            product: product,
            product_name: p.product_name,
            product_image: p.product_image,
            price: price,
            quantity: quantity,
          };
        }

        orderProducts.push(orderProduct);
      }

      let buyer = await Customer.findById(myorder.buyer);

      if (!buyer) {
        buyer = "Buyer Data not available";
      }

      order_data = {
        products: orderProducts,
        buyer: buyer,
      };
    }

    res.json({
      order: order_data,
      domain: req.user.domain,
    });
  } catch (e) {
    res.status(500).json({
      error: e,
    });
  }
});

//------------------------------------------------------****END****-----------------------------------------------------------

module.exports = router;
