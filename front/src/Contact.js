import React from 'react'
import * as auth0Client from "./auth";

export default class Contact extends React.Component {
  state = {
    editMode: false
  };
  toggleEditMode = () => {
    const editMode = !this.state.editMode;
    this.setState({ editMode });
  };
  renderViewMode() {
    const { id, name, author_id, deleteContact, image } = this.props;
    const isLoggedIn = auth0Client.isAuthenticated();
    const current_logged_in_user_id = isLoggedIn && auth0Client.getProfile().sub
    const is_author = author_id === current_logged_in_user_id
    return (
      <div>
        { image && <img src={`//localhost:8080/images/${image}`} alt={`the avatar of ${name}`}/> }
        <span>
          {id} - {name}
        </span>
        { is_author && isLoggedIn ?
          <div>
              <button onClick={this.toggleEditMode} className="success">
                edit
              </button>
              <button onClick={() => deleteContact(id)} className="warning">
                x
              </button>
          </div>
        : false
        }
      </div>
    );
  }
  renderEditMode() {
    const { name, email } = this.props;
    return (
      <form
        className="third"
        onSubmit={this.onSubmit}
        onReset={this.toggleEditMode}
      >
        <input
          type="text"
          placeholder="name"
          name="contact_name_input"
          defaultValue={name}
        />
        <input
          type="text"
          placeholder="email"
          name="contact_email_input"
          defaultValue={email}
        />
        <input
          type="file"
          name="contact_image_input"
        />
        <div>
          <input type="submit" value="ok" />
          <input type="reset" value="cancel" className="button" />
        </div>
      </form>
    );
  }
  onSubmit = evt => {
    // stop the page from refreshing
    evt.preventDefault();
    // target the form
    const form = evt.target;
    // extract the two inputs from the form
    const contact_name_input = form.contact_name_input;
    const contact_email_input = form.contact_email_input;
    const contact_image_input = form.contact_image_input;
    // extract the values
    const name = contact_name_input.value;
    const email = contact_email_input.value;
    const image = contact_image_input.files[0];
    // get the id and the update function from the props
    const { id, updateContact } = this.props;
    // run the update contact function
    updateContact(id, { name, email, image });
    // toggle back view mode
    this.toggleEditMode();
  };
  render() {
    const { editMode } = this.state;
    if (editMode) {
      return this.renderEditMode();
    } else {
      return this.renderViewMode();
    }
  }
}
