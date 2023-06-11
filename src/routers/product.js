const express = require("express");
const Product = require("../models/product");
const Admin = require("../models/admin");
const router = new express.Router();
const auth = require("../middleware/auth");
const multer = require("multer");
const sharp = require("sharp");

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

router.post(
  "/add-product",
  auth,
  upload.single("product_image"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file attached" });
      }

      const buffer = await sharp(req.file.buffer).png().toBuffer();
      //const base64Image = buffer.toString("base64");

      const product = new Product({
        product_name: req.body.product_name,
        brand_name: req.body.brand_name,
        description: req.body.description,
        allergens: req.body.allergens,
        nutrition_facts: JSON.parse(req.body.nutrition_facts), // Parse the JSON string into an object
        stocks: parseInt(req.body.stocks),
        price: parseFloat(req.body.price),
        expiration_date: new Date(req.body.expiration_date),
        country_of_origin: req.body.country_of_origin,
        product_category: req.body.product_category,
        product_image: buffer,
        owner: req.user._id,
      });

      await product.save();

      res.status(201).json({
        message: "Product added successfully!",
        product: product,
        user: req.user,
      });
    } catch (error) {
      console.error(error);
      res.status(400).json({ error: error.message });
    }
  }
);

//--------------------------------------------------BULK UPLOAD-------------------------------------------------------------------

router.post(
  "/bulk-upload",
  auth,
  upload.fields([
    { name: "bulk_data", maxCount: 1 },
    { name: "product_image", maxCount: 100 },
  ]),
  async (req, res) => {
    try {
      // Find and parse the JSON file
      let jsonData;

      jsonData = JSON.parse(req.files.bulk_data[0].buffer.toString());

      // Check that the files were found and parsed correctly
      if (!jsonData) {
        return res.status(400).json({ message: "Required files not found" });
      }

      // Store all the buffer promises
      const bufferPromises = req.files.product_image.map(file => sharp(file.buffer).toBuffer());

      // Wait until all buffers are ready
      const buffers = await Promise.all(bufferPromises);

      const productPromises = [];

      for (let i = 0; i < jsonData.length; i++) {
        const data = jsonData[i];

        const buffer = buffers[i]; // Get the base64 encoded image string

        // Split the base64 image string to remove the data URL prefix
        // const parts = base64Image.split(';base64,');
        // const base64Data = parts[1];

        // // Convert the Base64 encoded data to a buffer
        // const buffer = Buffer.from(base64Data, 'base64');

        const product = new Product({
          product_name: data.product_name,
          brand_name: data.brand_name,
          description: data.description,
          allergens: data.allergens,
          nutrition_facts: data.nutrition_facts,
          stocks: data.stocks,
          price: data.price,
          expiration_date: new Date(data.expiration_date),
          country_of_origin: data.country_of_origin,
          product_category: data.product_category,
          product_image: buffer,
          owner: req.user._id,
        });

        productPromises.push(product.save());
      }

      const products = await Promise.all(productPromises);

      res.status(201).json({
        message: "Products added successfully!",
        products: products,
        user: req.user,
      });
    } catch (error) {
      console.error(error);
      res.status(400).json({ error: error.message });
    }
  }
);

//-------------------------------------- RETRIVE ADMIN PRODUCTS------------------------------------------------------------------
// 2) ONLY PRODUCTS CREATED BY ADMIN-

// GET /products?completed=true
// GET /products?pageSize=${productsPerPage}&currentPage=${currentPage}
// GET /products?sortBy=createdAt:desc or asc
router.get("/user-products", auth, async (req, res) => {
  const sort = {};

  if (req.query.sortBy) {
    const parts = req.query.sortBy.split(":");
    sort[parts[0]] = parts[1] === "desc" ? -1 : 1;
  }

  try {
    await req.user
      .populate({
        path: "products",
        options: {
          limit: parseInt(req.query.limit),
          skip: parseInt(req.query.limit * (req.query.skip - 1)),
          sort,
        },
      })
      .execPopulate();

    userProducts = await Product.find();
    let length = userProducts.length;

    //console.log(length)

    res.json({
      owner: req.user.name,
      products: req.user.products,
      productsCount: length,
    });
  } catch (e) {
    res.status(500).json({
      error: e,
    });
  }
});

//----------------------------RETRIVE SINGLE ADMIN PRODUCT----------------------------------------------------------------------

router.get("/products/:id", auth, async (req, res) => {
  const _id = req.params.id;

  try {
    const product = await Product.findOne({ _id, owner: req.user._id });

    if (!product) {
      return res.status(404).json({
        error: "Not Found",
      });
    }

    res.status(200).json({
      product: product,
      owner: req.user,
      domain: req.user.domain,
    });
  } catch (e) {
    res.status(500).json({
      error: e,
    });
  }
});

// -----------------------------------------------UPDATE PRODUCT-------------------------------------------------------------------

router.put(
  "/products/:id",
  auth,
  upload.single("product_image"),
  async (req, res) => {
    const buffer = await sharp(req.file.buffer).png().toBuffer();
    const updates = Object.keys(req.body);
    var p = req.body;

    const allowedUpdates = [
      "product_name",
      "brand_name",
      "description",
      "allergens",
      "nutrition_facts",
      "stocks",
      "price",
      "expiration_date",
      "country_of_origin",
      "product_category",
      "product_image",
    ];

    //productData.nutrition_facts = JSON.parse(productData.nutrition_facts);
    const isValidOperation = updates.every((update) =>
      allowedUpdates.includes(update)
    );

    if (!isValidOperation) {
      return res.status(400).json({ error: "Invalid updates!" });
    }

    try {
      const product = await Product.findOne({
        _id: req.params.id,
        owner: req.user._id,
      });
      console.log(product);

      if (!product) {
        return res.status(404).json({
          error: "Not Found!",
        });
      }

      p.nutrition_facts = JSON.parse(p.nutrition_facts);
      updates.forEach((update) => (product[update] = p[update]));

      if (buffer) {
        product.product_image = buffer;
      }

      savedProduct = await product.save();
      //console.log(product)
      return res.status(200).json({
        message: "updated Successfully",
        product: savedProduct,
        id: product._id,
      });
    } catch (e) {
      res.status(400).json({
        error: e,
      });
    }
  }
);

//--------------------------------------------------------------DELETE ROUTE---------------------------------------------------

router.delete("/products/:id", auth, async (req, res) => {
  const _id = req.params.id;

  try {
    const product = await Product.findOneAndRemove({
      _id,
      owner: req.user._id,
    });

    if (!product) {
      return res.status(404).json({
        error: "Product not found",
      });
    }

    res.status(200).json({
      message: "Product deleted successfully",
      owner: req.user,
      domain: req.user.domain,
    });
  } catch (e) {
    res.status(500).json({
      error: e.message,
    });
  }
});

//----------------------PRODUCTS ROUTERS FOR GUESTS---------------------------------------------------

// 1) GET PRODUCTS

router.get("/allproducts", async (req, res) => {
  var mysort = {};

  if (req.query.sortBy) {
    const parts = req.query.sortBy.split(":");
    mysort[parts[0]] = parts[1] === "desc" ? -1 : 1;
  }

  var limit = parseInt(req.query.limit);
  var skip = parseInt(req.query.limit * (req.query.skip - 1));

  try {
    const products = await Product.find({})
      .sort(mysort)
      .skip(skip)
      .limit(limit);
    allProducts = await Product.find({});
    let length = allProducts.length;

    console.log(products)

    res.status(200).json({
      products: products,
      productsCount: length,
    });
  } catch (e) {
    return res.status(500).json({
      error: "error",
    });
  }
});

// 3) GET ONE PRODUCTS FOR ALL USERS -

router.get("/allproducts/get/:id", async (req, res) => {
  const _id = req.params.id;

  try {
    const product = await Product.findOne({ _id });

    if (!product) {
      return res.status(404).send();
    }

    const owner = await Admin.findOne({ _id: product.owner });
    res.status(200).json({
      product: product,
      owner: owner.name,
    });
  } catch (e) {
    res.status(500).send();
  }
});

//-------------------------------------ADD PRODUCT TO WISHLIST------------------------------------------------------------------

router.patch('/products/wishlist/:id', auth, async (req, res) => {    
  try {

        const id = req.user._id
        const product = await Product.findOne({ _id: req.params.id })
        const customer = await Customer.findOne({ _id: id })
      //console.log(user)
      //console.log(task)
        const product_id = product._id
        
        if (!product) {
            return res.status(404).send()
        }

        const buyer = await product.addBuyer(id)
        if (buyer) {
          const adProduct = await customer.addProduct(product_id)
         
        await product.save()
        await customer.save()

          res.status(201).json({
            product: product,
            customer: customer,
            domain: customer.domain,
            message: "Product Wishlisted"
          })
        } else {
          res.status(500).json({
            msg: 'Already enrolled'
          })
        }
  
        
    } catch (e) {
      res.status(400).json({
        error: e
      })
    }
})

//-----------------------------------  *****END*****----------------------------------------------------------------------------

module.exports = router;
