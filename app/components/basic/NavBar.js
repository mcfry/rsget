import React from 'react';
import routes from '../../constants/routes.json';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import * as NavBarActions from '../../actions/navbar';
import type { State } from '../../reducers/types';

import { NavLink, withRouter } from 'react-router-dom';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Button from '@material-ui/core/button';
import IconButton from '@material-ui/core/IconButton';
import Typography from '@material-ui/core/Typography';
import Input from '@material-ui/core/Input';
import { fade } from '@material-ui/core/styles/colorManipulator';
import { withStyles } from '@material-ui/core/styles';
import MenuIcon from '@material-ui/icons/Menu';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import SearchIcon from '@material-ui/icons/Search';
import Fade from '@material-ui/core/Fade';

type Props = {
  searchItems: () => void,
  // login: () => void,
  // logout: () => void,
  // isFetching: boolean,
  // isLoggedIn: boolean,
  // requireRegistration: booolean
  tabValue: ?number
};

const styles = theme => ({
  root: {
    width: '100%',
    position: 'fixed',
    top: 0,
    left: 0
  },
  grow: {
    flexGrow: 1
  },
  menuButton: {
    marginLeft: -12,
    marginRight: 20,
    display: 'block',
    [theme.breakpoints.up('sm')]: {
      display: 'none'
    }
  },
  title: {
    display: 'none',
    [theme.breakpoints.up('sm')]: {
      display: 'block'
    }
  },
  search: {
    position: 'relative',
    borderRadius: theme.shape.borderRadius,
    backgroundColor: fade(theme.palette.common.white, 0.15),
    '&:hover': {
      backgroundColor: fade(theme.palette.common.white, 0.25)
    },
    marginLeft: 0,
    width: '100%',
    [theme.breakpoints.up('sm')]: {
      marginLeft: theme.spacing.unit,
      width: 'auto'
    }
  },
  searchIcon: {
    width: theme.spacing.unit * 9,
    height: '100%',
    position: 'absolute',
    pointerEvents: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  inputRoot: {
    color: 'inherit',
    width: '100%'
  },
  inputInput: {
    paddingTop: theme.spacing.unit,
    paddingRight: theme.spacing.unit,
    paddingBottom: theme.spacing.unit,
    paddingLeft: theme.spacing.unit * 10,
    transition: theme.transitions.create('width'),
    width: '100%',
    [theme.breakpoints.up('sm')]: {
      width: 120,
      '&:focus': {
        width: 200
      }
    }
  },
  button: {
    margin: theme.spacing.unit
  },
  loginButton: {
    color: 'white'
  }
});

class NavBar extends React.Component {
  state = {
    anchorEl: null,
    searchItemsStr: '',
    searchPotsStr: '',
    searchSetsStr: '',
    searchAlchStr: ''
  };

  handleClick = name => (event, value) => {
    if (name === 'login') {
      this.props.login();
    } else if (name === 'logout') {
      this.props.logout();
    } else {
      this.setState({
        [name]: event.currentTarget
      });
    }
  };

  handleChange = name => (event, value) => {
    this.setState({
      [name]: event.target.value
    });

    this.props.searchItems(event.target.value);
  };

  handleClose = route => {
    this.setState({ anchorEl: null });
    this.props.history.push(route);
  };

  getCurrentSearchStr() {
    const { tabValue } = this.props;
    const {
      searchItemsStr,
      searchPotsStr,
      searchSetsStr,
      searchAlchStr
    } = this.state;

    if (tabValue === 0) {
      return [searchItemsStr, 'searchItemsStr'];
    } else if (tabValue === 1) {
      return [searchPotsStr, 'searchPotsStr'];
    } else if (tabValue === 2) {
      return [searchSetsStr, 'searchSetsStr'];
    } else if (tabValue === 3) {
      return [searchAlchStr, 'searchAlchStr'];
    } else {
      return [searchItemsStr, 'searchItemsStr'];
    }
  }

  componentDidUpdate(prevProps, prevState) {
    // const { requireRegistration } = this.props;
    // if (requireRegistration && requireRegistration !== prevProps.requireRegistration && requireRegistration === true) {
    //   this.props.history.push(routes.REGISTER);
    // }
  }

  render() {
    const { anchorEl } = this.state;
    const [searchStr, searchStrName] = this.getCurrentSearchStr();
    const open = Boolean(anchorEl);
    const { classes } = this.props;

    // {!this.props.isLoggedIn ? (
    //   <Button variant="outlined" className={classes.loginButton} onClick={this.handleClick('login')} className={classes.button}>
    //     Login
    //   </Button>
    // ) : (
    //   <Button variant="outlined" className={classes.loginButton} onClick={this.handleClick('logout')} className={classes.button}>
    //     Logout
    //   </Button>
    // )}

    return (
      <div className={classes.root}>
        <AppBar position="static">
          <Toolbar>
            <IconButton
              className={classes.menuButton}
              color="inherit"
              aria-owns={open ? 'fade-menu' : null}
              aria-haspopup="true"
              onClick={this.handleClick('anchorEl')}
              aria-label="Open drawer"
            >
              <MenuIcon />
            </IconButton>
            <Menu
              id="fade-menu"
              anchorEl={anchorEl}
              open={open}
              onClose={this.handleClose}
              TransitionComponent={Fade}
            >
              <MenuItem onClick={this.handleClose.bind(this, routes.HOME)}>
                Home
              </MenuItem>
              <MenuItem onClick={this.handleClose.bind(this, routes.TRACKER)}>
                Tracker
              </MenuItem>
            </Menu>

            <Typography
              className={classes.title}
              variant="title"
              color="inherit"
              noWrap
            >
              <NavLink activeClassName="active" to={routes.HOME}>
                Home
              </NavLink>
              &nbsp;&nbsp;&nbsp;&nbsp;
              <NavLink activeClassName="active" to={routes.TRACKER}>
                Tracker
              </NavLink>
              &nbsp;&nbsp;&nbsp;&nbsp;
              <NavLink activeClassName="active" to={routes.NIGHT}>
                Night Mode
              </NavLink>
            </Typography>

            <div className={classes.grow} />
            <div className={classes.search}>
              <div className={classes.searchIcon}>
                <SearchIcon />
              </div>
              <Input
                value={searchStr}
                onChange={this.handleChange(searchStrName)}
                placeholder="Search…"
                disableUnderline
                classes={{
                  root: classes.inputRoot,
                  input: classes.inputInput
                }}
              />
            </div>
          </Toolbar>
        </AppBar>
      </div>
    );
  }
}

function mapStateToProps(state: State) {
  return {
    ...state.navbar,
    ...state.tracker
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(NavBarActions, dispatch);
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(withStyles(styles)(withRouter(NavBar)));
