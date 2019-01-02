import React from "react";
import { Transition } from "react-spring"; // you can remove this from App.js
import { Link } from "react-router-dom";

const ContactList = ({ contacts_list }) => (
  <Transition
    items={contacts_list}
    keys={contact => contact.id}
    from={{ transform: "translate3d(-100px,0,0)" }}
    enter={{ transform: "translate3d(0,0px,0)" }}
    leave={{ transform: "translate3d(-100px,0,0)" }}
  >
    { contact => style => (
      <div style={style}>
        <Link to={"/contact/"+contact.id}>{contact.name}</Link>
      </div>
    )}
  </Transition>
);

export default ContactList
