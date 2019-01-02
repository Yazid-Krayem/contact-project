import app from "./app";
import initializeDatabase from "./db";
import { authenticateUser, logout, isLoggedIn } from './auth'

const start = async () => {
  const controller = await initializeDatabase();

  app.get("/", (req, res, next) => res.send("ok"));

  // CREATE
  app.get("/contacts/new", async (req, res, next) => {
    try {
      const { name, email } = req.query;
      const result = await controller.createContact({ name, email });
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
  app.get("/contacts/delete/:id", async (req, res, next) => {
    try {
      const { id } = req.params;
      const result = await controller.deleteContact(id);
      res.json({ success: true, result });
    } catch (e) {
      next(e);
    }
  });

  // UPDATE
  app.get("/contacts/update/:id", async (req, res, next) => {
    try {
      const { id } = req.params;
      const { name, email } = req.query;
      const result = await controller.updateContact(id, { name, email });
      res.json({ success: true, result });
    } catch (e) {
      next(e);
    }
  });

  // LIST
  app.get("/contacts/list", async (req, res, next) => {
    try {
      const { order } = req.query;
      const contacts = await controller.getContactsList(order);
      res.json({ success: true, result: contacts });
    } catch (e) {
      next(e);
    }
  });

  app.get('/mypage', isLoggedIn, ( req, res ) => {
    const username = req.user.name
    res.send({success:true, result: 'ok, user '+username+' has access to this page'})
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
