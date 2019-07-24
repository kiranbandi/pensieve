/*global $*/
import React, { Component } from 'react';
import ReactDOM from 'react-dom';

//Root sass file for webpack to compile
import './style/main.css';


class App extends Component {
  render() {
    return (
      <div className='root'>
        <h2>Hello Stanger !</h2>
      </div>
    )
  }
}

ReactDOM.render(<App />, document.getElementById('root'))

