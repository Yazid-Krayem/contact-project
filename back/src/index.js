import app from "./app";
import initializeDatabase from "./db";
import { authenticateUser, logout, isLoggedIn } from './auth'

const start = async () => {
  const controller = await initializeDatabase();

  app.get("/", (req, res, next) => res.send("ok"));

  // CREATE
  app.get("/contacts/new", isLoggedIn, async (req, res, next) => {
    const author_id = req.user.sub
    try {
      const { name, email } = req.query;
      const result = await controller.createContact({ name, email, author_id });
      res.json({ success: true, result });
    } catch (e) {
      next(e);
    }
  });

  // READ
  app.get("/contacts/get/:id", async (req, res, next) => {
    try {
      const { id } = req.params;
      const contact = await controller.getContact(id);
      res.json({ success: true, result: contact });
    } catch (e) {
      next(e);
    }
  });

  // DELETE
  app.get("/contacts/delete/:id", isLoggedIn, async (req, res, next) => {
    const author_id = req.user.sub
    try {
      const { id } = req.params;
      const result = await controller.deleteContact({id, author_id});
      res.json({ success: true, result });
    } catch (e) {
      next(e);
    }
  });

  // UPDATE
  app.get("/contacts/update/:id", isLoggedIn, async (req, res, next) => {
    const author_id = req.user.sub
    try {
      const { id } = req.params;
      const { name, email } = req.query;
      const result = await controller.updateContact(id, { name, email, author_id });
      res.json({ success: true, result });
    } catch (e) {
      next(e);
    }
  });

  // LIST
  app.get("/contacts/list", async (req, res, next) => {
    try {
      const { order, desc, limit, start } = req.query;
      const contacts = await controller.getContactsList({order, desc, limit, start});
      res.json({ success: true, result: contacts });
    } catch (e) {
      next(e);
    }
  });

  app.get('/mypage', isLoggedIn, async ( req, res, next ) => {
    try{
      const { order, desc, limit, start } = req.query;
      const { sub: auth0_sub, nickname} = req.user
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
