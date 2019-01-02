import React from "react";
import { Route } from "react-router-dom";
import * as auth0Client from "./auth";

export const Validating = () => <h3 className="text-center">Validating session...</h3>;

export const Forbidden = () => <div>Forbidden</div>;

const SecuredRoute = ({ component, render, path, checkingSession }) => {

  const renderIf = props => {
    if (checkingSession) {
      return <Validating />;
    }
    if (!auth0Client.isAuthenticated()) {
      auth0Client.signIn();
      return <Forbidden />;
    }
    if (render) {
      return render(props);
    }
    const Component = component
    return <Component {...props} />;
  };

  return <Route path={path} render={renderIf} />;
};

export default SecuredRoute;
