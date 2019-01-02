import * as auth0Client from "./auth";

const IfAuthenticated = ({ children, else:otherwise }) => {
  const isLoggedIn = auth0Client.isAuthenticated();
  if(isLoggedIn){
    return children
  }else{
    return otherwise || null
  }
}

export default IfAuthenticated
