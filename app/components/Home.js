// @flow
import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import routes from '../constants/routes.json';
import styles from './Home.css';

type Props = {};

export default class Home extends Component<Props> {
  props: Props;

  render() {
    // <h5><Link to={routes.COUNTER}>to Counter</Link></h5>
    //     <h5><Link to={routes.TRACKER}>to Tracker</Link></h5>
    return (
      <div className="container" data-tid="container">
        <center>
          <h2>Welcome</h2>
        </center>
      </div>
    );
  }
}
