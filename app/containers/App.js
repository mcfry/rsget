// @flow
import * as React from 'react';
import NavBar from '../components/basic/NavBar';
import { withStyles } from '@material-ui/core/styles';

const styles = theme => ({
  marginAdjust: {
    "margin-top": '58px',
    [theme.breakpoints.up('sm')]: {
      "margin-top": '68px',
    },
  },
});

type Props = {
  children: React.Node
};

class App extends React.Component<Props> {
  props: Props;

  render() {
    const { children } = this.props;
    const { classes } = this.props;

    return (
    	<React.Fragment>
    		<NavBar/>
        <div className={classes.marginAdjust}>
	    	  {children}
        </div>
        <br/><br/>
	    </React.Fragment>
    );
  }
}

export default withStyles(styles)(App);