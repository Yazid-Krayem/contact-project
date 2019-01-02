import app from "./app";
import initializeDatabase from "./db";
import { isLoggedIn } from './auth'
import upload from './upload'

const start = async () => {
  const controller = await initializeDatabase();

  app.get("/", (req, res, next) => res.send("ok"));

  const controllerCall = async (method, props, res, next) => {
    try{
      const result = await controller[method](props);
      res.json({ success: true, result });
    } catch (e) {
      next(e);
    }
  }

  // CREATE
  app.post("/contacts/new", isLoggedIn, upload.single('image'), async (req, res, next) => {
    const author_id = req.user.sub
    const { name, email } = req.query;
    const image = req.file && req.file.filename
    controllerCall('createContact',{ name, email, image, author_id },res,next)
  });
  
  // READ
  app.get("/contacts/get/:contact_id", async (req, res, next) => {
    const { contact_id } = req.params;
    controllerCall('getContact',{ contact_id },res,next)
  });
  
  // DELETE
  app.get("/contacts/delete/:contact_id", isLoggedIn, async (req, res, next) => {
    const author_id = req.user.sub
    const { contact_id } = req.params;
    controllerCall('deleteContact',{ contact_id, author_id },res,next)
  });
  
  // UPDATE
  app.post("/contacts/update/:contact_id", isLoggedIn, upload.single('image'), async (req, res, next) => {
    const author_id = req.user.sub
    const { contact_id } = req.params;
    const { name, email } = req.query;
    const image = req.file && req.file.filename
    controllerCall('updateContact',{ contact_id, name, email, author_id, image },res,next)
  });
  
  // LIST
  app.get("/contacts/list", async (req, res, next) => {
    const { order, desc, limit, start } = req.query;
    controllerCall('getContactsList',{order, desc, limit, start},res,next)
  });

  app.get('/mypage', isLoggedIn, async ( req, res, next ) => {
    try{
      const { sub: auth0_sub, nickname} = req.user
      const { order, desc, limit, start } = req.query;
      const user = await controller.createUserIfNotExists({auth0_sub, nickname})
      const contacts = await controller.getContactsList({order, desc, limit, start, author_id:auth0_sub})
      user.contacts = contacts
      res.json({ success: true, result: user });
    }catch(e){
      next(e)
    }
  })
  

  // ERROR
  app.use((err, req, res, next) => {
    console.error(err)
    const message = err.message
    res.status(500).json({ success:false, message })
  })
  
  app.listen(8080, () => console.log("server listening on port 8080"));
};

start();
