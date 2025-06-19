const asyncHandler = require('express-async-handler');
const Product = require('../models/productModel');
const cloudinary = require('../config/cloudinaryConfig');


const uploadFromBuffer = (buffer) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'quickcart/products' },
      (error, result) => {
        if (result) {
          resolve(result);
        } else {
          reject(error);
        }
      }
    );
    stream.end(buffer);
  });


const getProducts = asyncHandler(async (req, res) => {
  const pageSize = 10;
  const page = Number(req.query.pageNumber) || 1;

  const keyword = req.query.keyword
    ? {
        name: {
          $regex: req.query.keyword,
          $options: 'i',
        },
      }
    : {};

  const count = await Product.countDocuments({ ...keyword });
  const products = await Product.find({ ...keyword })
    .limit(pageSize)
    .skip(pageSize * (page - 1));

  res.json({ products, page, pages: Math.ceil(count / pageSize) });
});


const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (product) {
    res.json(product);
  } else {
    res.status(404);
    throw new Error('Product not found');
  }
});


const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (product) {
    await product.deleteOne()
    res.json({ message: 'Product removed' });
  } else {
    res.status(404);
    throw new Error('Product not found');
  }
});


const createProduct = asyncHandler(async (req, res) => {
  let imageUrl = '/images/sample.jpg'; // default fallback image

  if (req.file) {
    const uploadResult = await uploadFromBuffer(req.file.buffer);
    imageUrl = uploadResult.secure_url;
  }

  const product = new Product({
    name: req.body.name || 'Sample name',
    price: req.body.price || 0,
    user: req.user._id,
    image: imageUrl,
    brand: req.body.brand || 'Sample brand',
    category: req.body.category || 'Sample category',
    countInStock: req.body.countInStock || 0,
    description: req.body.description || 'Sample description',
  });

  const createdProduct = await product.save();
  res.status(201).json(createdProduct);
});


const updateProduct = asyncHandler(async (req, res) => {
  const {
    name,
    price,
    description,
    brand,
    category,
    countInStock,
    image,
  } = req.body;

  const product = await Product.findById(req.params.id);

  if (product) {

    let imageUrl = image || product.image;

    
    if (req.file) {
      const uploadResult = await uploadFromBuffer(req.file.buffer);
      imageUrl = uploadResult.secure_url;
    }

    product.name = name || product.name;
    product.price = price || product.price;
    product.description = description || product.description;
    product.image = imageUrl;
    product.brand = brand || product.brand;
    product.category = category || product.category;
    product.countInStock = countInStock || product.countInStock;

    const updatedProduct = await product.save();
    res.json(updatedProduct);
  } else {
    res.status(404);
    throw new Error('Product not found');
  }
});



const createProductReview = asyncHandler(async (req, res) => {
  const { rating, comment } = req.body;

  const product = await Product.findById(req.params.id);

  if (product) {
    const alreadyReviewed = product.reviews.find(
      (r) => r.user.toString() === req.user._id.toString()
    );

    if (alreadyReviewed) {
      res.status(400);
      throw new Error('Product already reviewed');
    }

    const review = {
      name: req.user.name,
      rating: Number(rating),
      comment,
      user: req.user._id,
    };

    product.reviews.push(review);

    product.numReviews = product.reviews.length;

    product.rating =
      product.reviews.reduce((acc, item) => item.rating + acc, 0) /
      product.reviews.length;

    await product.save();
    res.status(201).json({ message: 'Review added' });
  } else {
    res.status(404);
    throw new Error('Product not found');
  }
});


const getTopProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({}).sort({ rating: -1 }).limit(3);

  res.json(products);
});

module.exports = {
  getProducts,
  getProductById,
  deleteProduct,
  createProduct,
  updateProduct,
  createProductReview,
  getTopProducts,
};
