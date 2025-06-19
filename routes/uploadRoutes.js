const express = require('express')
const multer = require('multer')
const { v2: cloudinary } = require('cloudinary')
const streamifier = require('streamifier')

const router = express.Router()

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

const storage = multer.memoryStorage()
const upload = multer({ storage })

router.post('/', upload.single('image'), async (req, res) => {
  try {
    const streamUpload = (req) => {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream((error, result) => {
          if (result) {
            resolve(result)
          } else {
            reject(error)
          }
        })
        streamifier.createReadStream(req.file.buffer).pipe(stream)
      })
    }

    const result = await streamUpload(req)
    res.json({ image: result.secure_url })
  } catch (error) {
    console.error('Upload error:', error)
    res.status(500).json({ message: 'Image upload failed' })
  }
})

module.exports = router
