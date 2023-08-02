// @flow
import React, { Component } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import * as NightActions from '../actions/night';
import * as TrackerActions from '../actions/tracker';
import type { State } from '../reducers/types';
import storage from 'electron-json-storage';

import Button from '@material-ui/core/Button';
import Tooltip from '@material-ui/core/Tooltip';
import Switch from '@material-ui/core/Switch';
import LinearProgress from '@material-ui/core/LinearProgress';

type Props = {
  toggleLogging: () => void,
  fetchItems: () => void,
  toggled: boolean
};

class NightPage extends Component<Props> {
  constructor(props: Props) {
    super(props);

    this.state = {
      completed: 0,
      buffer: 10,
      slideOn: this.props.toggled,
      reportObj: {}
    };
  }

  handleChange = name => event => {
    this.setState({ [name]: event.target.checked });
    this.props.toggleLogging();

    if (event.target.checked === true) {
      this.progress();
      this.timer = setInterval(this.progress, 15000);
    } else {
      clearInterval(this.timer);
      this.setState({ completed: 0, buffer: 10 });
    }
  };

  progress = () => {
    const { nightTimesUpdatedStart, timesUpdated } = this.props;

    this.props.fetchItems();

    let difference = timesUpdated - nightTimesUpdatedStart;
    let completed = (difference % 10) * 10;
    this.setState({ completed: completed, buffer: completed + 10 });
  };

  componentWillUnmount() {
    clearInterval(this.timer);
  }

  componentDidMount() {
    if (this.props.toggled === true) {
      this.progress();
      this.timer = setInterval(this.progress, 15000);
    }
  }

  render() {
    const { nightTimesUpdatedStart, timesUpdated } = this.props;
    const { slideOn, completed, buffer } = this.state;
    let difference = timesUpdated - nightTimesUpdatedStart;

    return (
      <div>
        {slideOn && (
          <LinearProgress
            variant="buffer"
            value={completed}
            valueBuffer={buffer}
          />
        )}
        {slideOn && (
          <center>
            <br />
            <i>Unique times analyzed: {difference + 1}</i>
            <br />
          </center>
        )}

        <br />
        <br />
        <br />
        <center>
          <h3>Start night logging?</h3>
          <Tooltip
            title="When active, rsget will begin to log all price changes. 
									Upon deactivation, it will analyze the results and generate a report of which items flucuated the most while it was active. 
									You can run it all night and check it in the morning to get an idea of which items to buy the following night!"
          >
            <Switch
              checked={slideOn}
              onChange={this.handleChange('slideOn')}
              color="primary"
              value="slideOn"
            />
          </Tooltip>
          <h6>You are free to switch screens with this enabled!</h6>
        </center>
      </div>
    );
  }
}

function mapStateToProps(state: State) {
  return {
    ...state.night,
    ...state.tracker
  };
}

function mapDispatchToProps(dispatch) {
  return {
    ...bindActionCreators(NightActions, dispatch),
    ...bindActionCreators(TrackerActions, dispatch)
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(NightPage);
