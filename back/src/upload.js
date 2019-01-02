import path from 'path'
import multer from 'multer' 

const multerStorage = multer.diskStorage({
  destination: path.join( __dirname, '../public/images'),
  filename: (req, file, cb) => {
    const { fieldname, originalname } = file
    const date = Date.now()
    // filename will be: image-1345923023436343-filename.png
    const filename = `${fieldname}-${date}-${originalname}` 
    cb(null, filename)
  }
})

const upload = multer({ storage: multerStorage  })

export default upload
