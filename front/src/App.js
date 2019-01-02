import React, { Component } from 'react';
import './App.css';

class App extends Component {
  state = { contacts_list:[] }
  async componentDidMount(){
    try{
      const response = await fetch('//localhost:8080/contacts/list')
      const data = await response.json()
      this.setState({contacts_list:data})
    }catch(err){
      console.log(err)
    }
  }

   

  render() {
    const { contacts_list } = this.state

    return (
      <div className="App">
        <header className="App-header">
        { contacts_list.map( contact => 
      <div key={contact.id}>
        <p>{contact.id} -  {contact.name}</p>
        <p>{contact.email}</p>
      </div>
  )
}

        </header>
      </div>
    );
  }
}

export default App;
