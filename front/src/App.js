import React, { Component } from "react";
import { withRouter, Route, Switch, Link } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ContactList from "./ContactList";
import Contact from "./Contact";
import "./App.css";
import * as auth0Client from "./auth";
import IfAuthenticated from "./IfAuthenticated";
import SecuredRoute from "./SecuredRoute";
import axios from "axios";

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
      this.setState({ checkingSession: false });
      return;
    }
    try {
      await auth0Client.silentAuth();
      await this.getPersonalPageData(); // get the data from our server
    } catch (err) {
      if (err.error !== "login_required") {
        console.log(err.error);
      }
    }
    this.setState({ checkingSession: false });
  }
  request = async (path, options) => {
    try {
      this.setState({ isLoading: true });
      if(options && options.data){
        const data = new FormData();
        Object.keys(options.data).forEach( key => {
          const value = options.data[key]
          if(Array.isArray(value) || value instanceof FileList){
            let i = 0;
            while(i < value.length){
              data.append(`${key}[${i}]`, value[i++]);
            }
          }else if(value !== null && typeof value !== 'undefined'){
            data.append(key,value)
          }
        })
        options.data = data
      }
      const config = {
        method: "get",
        url: `//localhost:8080/${path}`,
        headers: { 
          Authorization: `Bearer ${auth0Client.getIdToken()}`,
          'Content-Type': options && options.data ? 'multipart/form-data' : undefined
        },
        ...options
      }
      const response = await axios(config);
      const answer = response.data
      if (answer.success) {
        this.setState({ isLoading: false });  
      } else {
        this.setState({ error_message: answer.message, isLoading: false });
        toast.error('client error:'+answer.message);
      }
      return answer;
    } catch (err) {
      this.setState({ error_message: err.message, isLoading: false });
      toast.error('server error: '+err.message);
      return { success:false }
    }
  };
  getContact = async id => {
    if (this.state.contacts_list.find(c => c.id === id)) {
      return;
    }
    const answer = await this.request(`contacts/get`, { params: { id } });
    if(!answer.success){ return }
    const contact = answer.result
    const contacts_list = [...this.state.contacts_list, contact];
    this.setState({ contacts_list });
    toast(`contact loaded`);
  };

  deleteContact = async id => {
    const answer = await this.request(`contacts/delete/${id}`);
    if (!answer.success || !answer.result) { return; }
    const contacts_list = this.state.contacts_list.filter(c => c.id !== id);
    this.setState({ contacts_list });
    toast(`contact deleted`);
  };

  updateContact = async (id, props) => {
    const { name, email, image } = props
    const answer = await this.request(`contacts/update/${id}`, {
      method: "post",
      data: { image },
      params: { name, email }
    });
    if (!answer.success) { return; }
    const contacts_list = this.state.contacts_list.map(contact => {
      // if this is the contact we need to change, update it. This will apply to exactly
      // one contact
      if (contact.id === id) {
        const new_contact = {
          id: contact.id,
          name: name || contact.name,
          email: email || contact.email
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
  };
  createContact = async props => {
    if (!props || !(props.name && props.email)) {
      throw new Error(
        `you need both name and email properties to create a contact`
      );
    }
    const { name, email, image } = props;
    const answer = await this.request(`contacts/new`, {
      method:'post',
      data: { image },
      params: { name, email }
    });
    if (!answer.success) { return; }
    const id = answer.result;
    const contact = { name, email, id };
    const contacts_list = [...this.state.contacts_list, contact];
    this.setState({ contacts_list });
    toast(`contact "${name}" created`);
  };

  getContactsList = async order => {
    const answer = await this.request(`contacts/list`, {
      params: { order }
    });
    if(!answer.success){ return; }
    const contacts_list = answer.result
    this.setState({ contacts_list });
    toast("contacts loaded");
  };

  getPersonalPageData = async () => {
    const answer = await this.request('mypage')
    if(!answer.success){ return; }
    const user = answer.result;
    this.setState({ user });
    if (user.firstTime) {
      toast(`welcome ${user.nickname}! We hope you'll like it here'`);
    }
    toast(`hello ${user.nickname}'`);
  };
  onSubmit = evt => {
    // stop the form from submitting:
    evt.preventDefault();
    // extract name and email from state
    const { name, email } = this.state;
    // get the files
    const image = evt.target.contact_image_input.files[0];
    // create the contact from mail and email
    this.createContact({ name, email, image });
    // empty name and email so the text input fields are reset
    this.setState({ name: "", email: "" });
    this.props.history.push("/");
  };
  renderUser() {
    const isLoggedIn = auth0Client.isAuthenticated() && this.state.user;
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
    const user_contacts = this.state.user.contacts.map(contactFromUser =>
      this.state.contacts_list.find(
        contactFromMain => contactFromMain.id === contactFromUser.id
      )
    );
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
        <div>
          <ContactList contacts_list={user_contacts} />
        </div>
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
        author_id={contact.author_id}
        image={contact.image}
        updateContact={this.updateContact}
        deleteContact={this.deleteContact}
      />
    );
  };
  renderProfilePage = () => {
    if (this.state.checkingSession) {
      return <p>validating session...</p>;
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
      <form className="third" onSubmit={this.onSubmit}>
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
        <input type="file" name="contact_image_input" />
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
        <SecuredRoute path="/create" render={this.renderCreateForm} />
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
      await this.getPersonalPageData(); // get the data from our server
      this.props.history.push("/profile");
    } catch (err) {
      console.error(err);
      this.isLogging = false;
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
          <IfAuthenticated>
            <Link to="/create">create</Link>
          </IfAuthenticated>
        </div>
        {this.renderContent()}
        <ToastContainer />
      </div>
    );
  }
}

export default withRouter(App);
