
import { createServer } from 'http'

/**
* This function will be used as a request handler
* by our server. It will run for every request the server
* receives. It will always answer "hello", with a status code
* of 200.
**/ 
const whenRequestReceived = (request /* the request sent by the client*/, response /* the response we use to answer*/) => {
 /**
  * We have to specify the status code (200), which means everything is ok,
  * and the content type, which tells the browser we're sending plain text.
  * Not specifying those is ok (the browser will infer them), but not 
  * correct.
  **/
 response.writeHead(200, { 'Content-type': `text/plain` });
 /**
  * We write our actual response, a text that says "hello"
  **/ 
 response.write(`Hello`);
 /**
  * We terminate the response, so the browser can close the connection.
  * As a user, we know this happens because the browser stops displaying the
  * loading spinner
  **/
 response.end( );
}

/**
* This is our server object, created through the `createServer`
* function provided by the `http` library.
* We give it the `whenRequestReceived` function we wrote above so
* any request directed at the server gets passed to this function
**/
const server = createServer(whenRequestReceived)

/**
* Finally, we start the server by using `listen`, and specifying
* a port. In Node, we traditionally use the port `3000`, but since
* we already will have something running on port 3000, we choose something 
* else.
**/
server.listen(8080, ()=>{console.log('ok, listening')});
