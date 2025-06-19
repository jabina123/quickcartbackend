const express = require('express');
const router = express.Router();

const {
  getProducts,
  getProductById,
  deleteProduct,
  createProduct,
  updateProduct,
  createProductReview,
  getTopProducts,
} = require('../controllers/productController');

const { protect, admin } = require('../middleware/authMiddleware');

const upload = require('../middleware/uploadMiddleware'); // new

router.route('/')
  .get(getProducts)
  .post(protect, admin, upload.single('image'), createProduct);  

router.route('/:id/reviews').post(protect, createProductReview);
router.get('/top', getTopProducts);
router.route('/:id')
  .get(getProductById)
  .delete(protect, admin, deleteProduct)
  .put(protect, admin, upload.single('image'), updateProduct); 

module.exports = router;
