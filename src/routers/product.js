const express = require('express')
const Product = require('../models/product')
const Admin = require('../models/admin')
const Customer = require('../models/customer')
const router = new express.Router()
const auth = require('../middleware/auth')
const multer = require('multer')
const sharp = require('sharp')

//-------------------------PRODUCT ROUTER FOR ADMIN----------------------------------------------

// 1) ADDING PRODUCT-

const upload = multer({

  limits: {
    fileSize: 100000000
  },
  fileFilter(req, file, cb) {
    //if (!file) {
    //  return
    //}

    if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
      return cb(new Error('Please upload an image'))
    }

    cb(undefined, true)
  }
})

router.post('/products', auth, upload.single('avatar'), async (req, res) => {
    const buffer = await sharp(req.file.buffer).png().toBuffer()
    const product = new Product({
      ...req.body,
      avatar: buffer,
      owner: req.user._id
    })

    try {
        await product.save()
      res.status(201).json({
        product: product,
        user: req.user
      })
    } catch (e) {
      res.status(400).json({
        error: e
      })
    }
})

// 2) ONLY PRODUCTS CREATED BY ADMIN-


// GET /products?completed=true
// GET /products?pageSize=${productsPerPage}&currentPage=${currentPage}
// GET /products?sortBy=createdAt:desc or asc
router.get('/user-products', auth, async (req, res) => {

  const sort = {}

  if (req.query.sortBy) {
    const parts = req.query.sortBy.split(':')
    sort[parts[0]] = parts[1] === 'desc' ? -1 : 1
  }

  try {

    await req.user.populate({
      path: 'products',
      options: {
        limit: parseInt(req.query.limit),
        skip: parseInt(req.query.limit * (req.query.skip - 1)),
        sort
      }
    }).execPopulate()

    userProducts = await Product.find()
    let length = userProducts.length

    //console.log(length)

    res.json({
      owner: req.user.name,
      products: req.user.products,
      productsCount: length
    })
  } catch (e) {
    res.status(500).json({
      error: e
    })
  }
})

router.get('/products/:id', auth, async (req, res) => {
    const _id = req.params.id

    try {
        const product = await Product.findOne({ _id, owner: req.user._id })

        if (!product) {
          return res.status(404).json({
            error: "Not Found"
          })
        }

      res.status(200).json({
        product: product,
        owner: req.user.name
      })
    } catch (e) {
      res.status(500).json({
        error : e
      })
    }
})


// 3) UPDATE PRODUCT

router.put('/products/:id', auth, upload.single('avatar'), async (req, res) => {
    const buffer = await sharp(req.file.buffer).png().toBuffer()
    const updates = Object.keys(req.body)
    const allowedUpdates = ['instructions', 'avatar']
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update))

    if (!isValidOperation) {
        return res.status(400).json({ error: 'Invalid updates!' })
    }

    try {
      const product = await Product.findOne({ _id: req.params.id, owner: req.user._id })
      //console.log(product)

        if (!product) {
          return res.status(404).json({
            error: "Not Found!"
          })
        }

      updates.forEach((update) => product[update] = req.body[update])

      if (buffer) {
        product.avatar = buffer
      }
      
      savedProduct = await product.save()
      //console.log(product)
      return res.status(200).json({
        msg: "updated Successfully",
        product: savedProduct,
        id: product._id
      })
    } catch (e) {
      res.status(400).json({
        error: e
      })
    }
})

//----------------------PRODUCTS ROUTERS FOR GUESTS---------------------------------------------------

// 1) GET PRODUCTS

router.get('/allproducts', async (req, res) => {
    var mysort = {}

    if (req.query.sortBy) {
        const parts = req.query.sortBy.split(':')
        mysort[parts[0]] = parts[1] === 'desc' ? -1 : 1
    }

    var limit = parseInt(req.query.limit)
    var skip = parseInt(req.query.limit * (req.query.skip - 1))

    try {
      const products = await Product.find({}).sort(mysort).skip(skip).limit(limit)
      allProducts = await Product.find({})
      let length = allProducts.length

      res.status(200).json({
        products: products,
        productsCount: length
      })
    } catch (e) {
      return res.status(500).json({
        error: "error"
      })
    }
})

// 3) GET ALL PRODUCTS FOR REGISTERED USERS -

router.get('/allproducts/get/:id', async (req, res) => {
  const _id = req.params.id

  try {
    const product = await Product.findOne({ _id })

    if (!product) {
      return res.status(404).send()
    }

    const owner = await Admin.findOne({ _id: product.owner})
    res.status(200).json({
      product: product,
      owner: owner.name
    })
  } catch (e) {
    res.status(500).send()
  }
})

// 2) BUY PRODUCTS

router.patch('/products/buy/:id', auth, async (req, res) => {    
  try {

        const id = req.user._id
        const product = await Product.findOne({ _id: req.params.id })
        const user = await Customer.findOne({ _id: id })
      //console.log(user)
      //console.log(product)
        const product_id = product.id
        
        if (!product) {
            return res.status(404).send()
        }

        await product.save()
        await user.save()
        const buyer = await product.addBuyer(id)
        if (buyer) {
          const adProduct = await user.addProduct(product_id)
          //console.log(buyer)
          //console.log(adProduct)
          res.status(201).json({
            product: product,
            user: user,
            adProduct: adProduct,
            msg: "Enrolled for the Product"
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

// 3) GET SINGLE PRODUCT WHICH IS BOUGHT BY USER 

router.get('/myproducts/get/:id', auth, async (req, res) => {
    const _id = req.params.id

    try {
        const product = await Product.findOne({ _id })

        if (!product) {
          return res.status(404).json({
            error: "No such Product"
          })
        }

      const owner = await Admin.findOne({ _id: product.owner })
      res.json({
        product: product,
        owner: owner.name
      })
    } catch (e) {
      res.status(500).json({
        error: e
      })
    }
})

// 4) GET PRODUCTS ONLY BOUGHT BY USER-

router.get('/myproducts', auth, async (req, res) => {

  var per_page = parseInt(req.query.limit) || 10
  var page = parseInt(req.query.skip) || 1
  offset = (page - 1) * per_page

    myProducts = []
    try {
        products = req.user.products
        for (t of products) {
            const _id = t.product
            myproduct = await Product.findById(_id)
            myProducts.push(myproduct)
      }

      myProducts.reverse()
      
      let length = myProducts.length
      modifiedMyProducts = myProducts.slice(offset).slice(0, req.query.limit)
      
      res.json({
        length: modifiedMyProducts.length,
        buyerTotalProducts: length,
        buyerProducts: modifiedMyProducts
      })
    } catch (e) {
        res.status(500).send()
    }
})


//-----------------------------------OTHER ROUTES-------------------------------------------------------


router.post('/products/:id/avatar', auth, upload.single('avatar'), async (req, res) => {
  const product = await Product.findById(req.params.id)
  const buffer = await sharp(req.file.buffer).png().toBuffer()
    //const buffer = await sharp(req.file.buffer).resize({ width: 250, height: 250 }).png().toBuffer()
    product.avatar = buffer
    await product.save()
    res.send()
}, (error, req, res, next) => {
    res.status(400).send({ error: error.message })
})

router.post('/products/:id/productimage', auth, upload.single('productimage'), async (req, res) => {
  const product = await Product.findById(req.params.id)
  const buffer = await sharp(req.file.buffer).png().toBuffer()
  //const buffer = await sharp(req.file.buffer).resize({ width: 350, height: 250 }).png().toBuffer()
  product.productimage = buffer
  await product.save()
  res.send()
}, (error, req, res, next) => {
  res.status(400).send({ error: error.msg })
})

router.get('/products/:id/productimage', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id)

        if (!product || !product.productimage) {
            throw new Error()
        }

        res.set('Content-Type', 'image/png')
        res.send(product.productimage)
    } catch (e) {
        res.status(404).send()
    }
})

router.get('/products/:id/avatar', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id)

        if (!product || !product.avatar) {
            throw new Error()
        }

        res.set('Content-Type', 'image/png')
      res.json({
        img: product.avatar
      })
    } catch (e) {
        res.status(404).send()
    }
})


module.exports = router
