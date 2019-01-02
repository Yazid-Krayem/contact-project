import React, { Component } from "react";
import { withRouter, Route, Switch, Link } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ContactList from "./ContactList";
import Contact from "./Contact";
import { pause, makeRequestUrl } from "./utils.js";
import "./App.css";
import * as auth0Client from "./auth";

const makeUrl = (path, params) =>
  makeRequestUrl(`http://localhost:8080/${path}`, params);

class App extends Component {
  state = {
    contacts_list: [],
    error_message: "",
    name: "",
    email: "",
    isLoading: false,
    checkingSession: true
  };
  async componentDidMount() {
    this.getContactsList();
    if (this.props.location.pathname === "/callback") {
      this.setState({checkingSession:false});
      return;
    }
    try {
      await auth0Client.silentAuth();
      await this.getPersonalPageData(); // get the data from our server
      this.forceUpdate();
    } catch (err) {
      if (err.error !== "login_required") {
        console.log(err.error);
      }
    }
    this.setState({checkingSession:false});
  }
  getContact = async id => {
    // check if we already have the contact
    const previous_contact = this.state.contacts_list.find(
      contact => contact.id === id
    );
    if (previous_contact) {
      return; // do nothing, no need to reload a contact we already have
    }
    try {
      const url = makeUrl(`contacts/get/${id}`);
      const response = await fetch(url);
      const answer = await response.json();
      if (answer.success) {
        // add the user to the current list of contacts
        const contact = answer.result;
        const contacts_list = [...this.state.contacts_list, contact];
        this.setState({ contacts_list });
        toast(`contact loaded`);
      } else {
        this.setState({ error_message: answer.message });
        toast.error(answer.message);
      }
    } catch (err) {
      this.setState({ error_message: err.message });
      toast.error(err.message);
    }
  };

  deleteContact = async id => {
    try {
      const url = makeUrl(`contacts/delete/${id}`);
      const response = await fetch(url);
      const answer = await response.json();
      if (answer.success) {
        // remove the user from the current list of users
        const contacts_list = this.state.contacts_list.filter(
          contact => contact.id !== id
        );
        this.setState({ contacts_list });
        toast(`contact deleted`);
      } else {
        this.setState({ error_message: answer.message });
        toast.error(answer.message);
      }
    } catch (err) {
      this.setState({ error_message: err.message });
      toast.error(err.message);
    }
  };

  updateContact = async (id, props) => {
    try {
      if (!props || !(props.name || props.email)) {
        throw new Error(
          `you need at least name or email properties to update a contact`
        );
      }
      const url = makeUrl(`contacts/update/${id}`, {
        name: props.name,
        email: props.email,
      });
      const response = await fetch(url);
      const answer = await response.json();
      if (answer.success) {
        // we update the user, to reproduce the database changes:
        const contacts_list = this.state.contacts_list.map(contact => {
          // if this is the contact we need to change, update it. This will apply to exactly
          // one contact
          if (contact.id === id) {
            const new_contact = {
              id: contact.id,
              name: props.name || contact.name,
              email: props.name || contact.email
            };
            toast(`contact "${new_contact.name}" updated`);
            return new_contact;
          }
          // otherwise, don't change the contact at all
          else {
            return contact;
          }
        });
        this.setState({ contacts_list });
      } else {
        this.setState({ error_message: answer.message });
        toast.error(answer.message);
      }
    } catch (err) {
      this.setState({ error_message: err.message });
      toast.error(err.message);
    }
  };
  createContact = async props => {
    try {
      if (!props || !(props.name && props.email)) {
        throw new Error(
          `you need both name and email properties to create a contact`
        );
      }
      const { name, email } = props;
      const url = makeUrl(`contacts/new`, {
        name,
        email,
      });
      const response = await fetch(url);
      const answer = await response.json();
      if (answer.success) {
        // we reproduce the user that was created in the database, locally
        const id = answer.result;
        const contact = { name, email, id };
        const contacts_list = [...this.state.contacts_list, contact];
        this.setState({ contacts_list });
        toast(`contact "${name}" created`);
      } else {
        this.setState({ error_message: answer.message });
        toast.error(answer.message);
      }
    } catch (err) {
      this.setState({ error_message: err.message });
      toast.error(err.message);
    }
  };

  getContactsList = async order => {
    this.setState({ isLoading: true });
    try {
      const url = makeUrl(`contacts/list`, { order });
      const response = await fetch(url);
      await pause();
      const answer = await response.json();
      if (answer.success) {
        const contacts_list = answer.result;
        this.setState({ contacts_list, isLoading: false });
        toast("contacts loaded");
      } else {
        this.setState({ error_message: answer.message, isLoading: false });
        toast.error(answer.message);
      }
    } catch (err) {
      this.setState({ error_message: err.message, isLoading: false });
      toast.error(err.message);
    }
  };
  getPersonalPageData = async () => {
    try {
      const url = makeUrl(`mypage`);
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${auth0Client.getIdToken()}` }
      });
      const answer = await response.json();
      if (answer.success) {
        const message = answer.result;
        // we should see: "received from the server: 'ok, user <username> has access to this page'"
        toast(`received from the server: '${message}'`);
      } else {
        this.setState({ error_message: answer.message });
        toast.error(
          `error message received from the server: ${answer.message}`
        );
      }
    } catch (err) {
      this.setState({ error_message: err.message });
      toast.error(err.message);
    }
  };
  onSubmit = evt => {
    // stop the form from submitting:
    evt.preventDefault();
    // extract name and email from state
    const { name, email } = this.state;
    // create the contact from mail and email
    this.createContact({ name, email });
    // empty name and email so the text input fields are reset
    this.setState({ name: "", email: "" });
    this.props.history.push('/')
  };
  renderUser() {
    const isLoggedIn = auth0Client.isAuthenticated();
    if (isLoggedIn) {
      // user is logged in
      return this.renderUserLoggedIn();
    } else {
      return this.renderUserLoggedOut();
    }
  }
  renderUserLoggedOut() {
    return <button onClick={auth0Client.signIn}>Sign In</button>;
  }
  renderUserLoggedIn() {
    const nick = auth0Client.getProfile().name;
    return (
      <div>
        Hello, {nick}!{" "}
        <button
          onClick={() => {
            auth0Client.signOut();
            this.setState({});
          }}
        >
          logout
        </button>
      </div>
    );
  }
  renderHomePage = () => {
    const { contacts_list } = this.state;
    return <ContactList contacts_list={contacts_list} />;
  };
  renderContactPage = ({ match }) => {
    const id = match.params.id;
    // find the contact:
    // eslint-disable-next-line eqeqeq
    const contact = this.state.contacts_list.find(contact => contact.id == id);
    // we use double equality because our ids are numbers, and the id provided by the router is a string
    if (!contact) {
      return <div>{id} not found</div>;
    }
    return (
      <Contact
        id={contact.id}
        name={contact.name}
        email={contact.email}
        updateContact={this.updateContact}
        deleteContact={this.deleteContact}
      />
    );
  };
  renderProfilePage = () => {
    if(this.state.checkingSession){
      return <p>validating session...</p>
    }
    return (
      <div>
        <p>profile page</p>
        {this.renderUser()}
      </div>
    );
  };
  renderCreateForm = () => {
    return (
      <form
        className="third"
        onSubmit={this.onSubmit}
      >
        <input
          type="text"
          placeholder="name"
          onChange={evt => this.setState({ name: evt.target.value })}
          value={this.state.name}
        />
        <input
          type="text"
          placeholder="email"
          onChange={evt => this.setState({ email: evt.target.value })}
          value={this.state.email}
        />
        <div>
          <input type="submit" value="ok" />
          <input type="reset" value="cancel" className="button" />
        </div>
      </form>
    );
  };
  renderContent() {
    if (this.state.isLoading) {
      return <p>loading...</p>;
    }
    return (
      <Switch>
        <Route path="/" exact render={this.renderHomePage} />
        <Route path="/contact/:id" render={this.renderContactPage} />
        <Route path="/profile" render={this.renderProfilePage} />
        <Route path="/create" render={this.renderCreateForm} />
        <Route path="/callback" render={this.handleAuthentication} />
        <Route render={() => <div>not found!</div>} />
      </Switch>
    );
  }
  isLogging = false;
  login = async () => {
    if (this.isLogging === true) {
      return;
    }
    this.isLogging = true;
    try {
      await auth0Client.handleAuthentication();
      const name = auth0Client.getProfile().name; // get the data from Auth0
      await this.getPersonalPageData(); // get the data from our server
      toast(`${name} is logged in`);
      this.props.history.push("/profile");
    } catch (err) {
      this.isLogging = false
      toast.error(`error from the server: ${err.message}`);
    }
  };
  handleAuthentication = () => {
    this.login();
    return <p>wait...</p>;
  };
  render() {
    return (
      <div className="App">
        <div>
          <Link to="/">Home</Link> |<Link to="/profile">profile</Link> |
          <Link to="/create">create</Link>
        </div>
        {this.renderContent()}
        <ToastContainer />
      </div>
    );
  }
}

export default withRouter(App);
