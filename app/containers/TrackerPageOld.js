// @flow
import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import routes from '../constants/routes.json';
import * as TrackerActions from '../actions/tracker';
import type { State } from '../reducers/types';

import storage from 'electron-json-storage';
import fuzzysort from 'fuzzysort';
import classnames from 'classnames';
import { css } from 'emotion';

import potGroups from '../constants/groups';
import ItemTable from '../components/basic/ItemTable';
import PotTable from '../components/basic/PotTable';
import SetTable from '../components/basic/SetTable';
import HighAlchTable from '../components/basic/HighAlchTable';

import { withStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/button';
import CircularProgress from '@material-ui/core/CircularProgress';
import AppBar from '@material-ui/core/AppBar';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import TextField from '@material-ui/core/TextField';
import InputAdornment from '@material-ui/core/InputAdornment';
import FormGroup from '@material-ui/core/FormGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Switch from '@material-ui/core/Switch';

type Props = {
  fetchItems: () => void,
  isFetching: boolean,
  isInvalid: boolean,
  itemsObj: ?Object,
  potsObj: ?Object,
  setsObj: ?Object,
  lastUpdated: Array,
  search: string,
  toggled: boolean
};

const styles = theme => ({
  tabRoot: {
    flexGrow: 1,
    backgroundColor: '#e0e0e0'
  },
  progress: {
    margin: theme.spacing.unit * 2
  },
  histContainer: {
    borderTop: '1px solid red',
    padding: '4px'
  },
  controlBar: {
    marginBottom: '2px'
  },
  textField: {
    marginLeft: theme.spacing.unit,
    marginRight: theme.spacing.unit,
    width: 160,
    height: 45,
    margin: 0
  },
  textFieldInputProps: {
    color: 'white'
  },
  histText: {
    color: 'white'
  },
  nightText: {
    color: 'black',
    marginBottom: '1px',
    fontSize: '14px'
  },
  button: {
    margin: theme.spacing.unit
  },
  resetButton: {
    color: 'white'
  }
});

function TabContainer(props) {
  return (
    <Typography component="div" style={{ padding: 8 * 3 }}>
      {props.children}
    </Typography>
  );
}

class TrackerPage extends Component<Props> {
  constructor(props: Props) {
    super(props);

    // Parent context
    this.sortItems = this.sortItems.bind(this);

    this.state = {
      tabValue: 0,
      difference: 0,
      quantity: 0,
      updatedTimesArr: [],
      sortedItems: null,
      sortedPots: null,
      sortedSets: null,
      sortedAlchs: null,
      searchedItems: null,
      searchedPots: null,
      searchedSets: null,
      searchedAlchs: null,
      sortedNightReport: null,
      searchedNightReport: null,
      nightReportObj: {},
      alchsObj: {},
      lastSortDir: 'up',
      lastSortField: 'items',
      usingNightReport: false
    };
  }

  handleChange = name => (event, value) => {
    let temp =
      name === 'tabValue'
        ? {
            difference: 0,
            quantity: 0,
            lastSortDir: 'up',
            lastSortField: 'items'
          }
        : {};
    this.setState({
      [name]:
        name !== 'difference' && name !== 'quantity'
          ? value
          : this.dehumanizeNumber(event.target.value),
      ...temp
    });
  };

  handleBlur = name => (event, value) => {
    if (event.target.value.length === 0) {
      this.setState({
        [name]: 0
      });
    }
  };

  dehumanizeNumber(number) {
    const numStr = number.toString();
    const startStr = numStr.slice(0, numStr.length - 1);
    switch (numStr.substr(numStr.length - 1).toUpperCase()) {
      case 'K':
        return parseInt(startStr + '000');
      case 'M':
        return parseInt(startStr + '000000');
      default:
        return number;
    }
  }

  resetFilters = () => {
    this.setState({ difference: 0, quantity: 0 });
  };

  sortItems(field, type, update_dir = true) {
    const { itemsObj, potsObj, setsObj } = this.props;
    const {
      lastSortDir,
      lastSortField,
      usingNightReport,
      nightReportObj,
      alchsObj
    } = this.state;

    let dir = null;
    if (update_dir === true) {
      if (lastSortField !== field) {
        dir = 'up';
      } else {
        dir = lastSortDir === 'up' ? 'down' : 'up';
      }
    } else {
      dir = lastSortDir;
    }

    let working_keys = [];
    if (usingNightReport === true) {
      working_keys = Object.keys(nightReportObj).sort((keya, keyb) => {
        let [itema, itemb] = [nightReportObj[keya], nightReportObj[keyb]];
        if (typeof itema[field] === 'string') {
          return dir == 'up'
            ? itema[field].localeCompare(itemb[field])
            : itemb[field].localeCompare(itema[field]);
        } else if (field === 'difference') {
          const diffa = Math.abs(itema.buy_average - itema.sell_average);
          const diffb = Math.abs(itemb.buy_average - itemb.sell_average);
          return dir == 'up' ? diffb - diffa : diffa - diffb;
        } else {
          return dir == 'up'
            ? itemb[field] - itema[field]
            : itema[field] - itemb[field];
        }
      });

      // Convert keys to non-numeric string so they are retrieved in the order in which they were added
      const items = {};
      for (let key of working_keys) {
        items['_' + key.toString()] = nightReportObj[key];
      }

      this.setState({
        sortedNightReport: items,
        lastSortDir: dir,
        lastSortField: field
      });
      // Not Using Night Report
    } else {
      if (type === 'items') {
        working_keys = Object.keys(itemsObj).sort((keya, keyb) => {
          let [itema, itemb] = [itemsObj[keya][0], itemsObj[keyb][0]];
          if (typeof itema[field] === 'string') {
            return dir == 'up'
              ? itema[field].localeCompare(itemb[field])
              : itemb[field].localeCompare(itema[field]);
          } else if (field === 'difference') {
            const diffa = Math.abs(itema.buy_average - itema.sell_average);
            const diffb = Math.abs(itemb.buy_average - itemb.sell_average);
            return dir == 'up' ? diffb - diffa : diffa - diffb;
          } else {
            return dir == 'up'
              ? itemb[field] - itema[field]
              : itema[field] - itemb[field];
          }
        });
      } else if (type === 'pots') {
        working_keys = Object.keys(potsObj).sort((keya, keyb) => {
          let [itema, itemb] = [potsObj[keya][0], potsObj[keyb][0]];

          // Name, difference
          if (typeof itema[field] === 'string') {
            return dir == 'up'
              ? itema[field].localeCompare(itemb[field])
              : itemb[field].localeCompare(itema[field]);
          } else {
            return dir == 'up'
              ? itemb[field] - itema[field]
              : itema[field] - itemb[field];
          }
        });
      } else if (type === 'sets') {
        working_keys = Object.keys(setsObj).sort((keya, keyb) => {
          let [seta, setb] = [setsObj[keya][0], setsObj[keyb][0]];

          // Name, difference
          if (typeof seta[field] === 'string') {
            return dir == 'up'
              ? seta[field].localeCompare(setb[field])
              : setb[field].localeCompare(seta[field]);
          } else if (field === 'difference') {
            return dir == 'up'
              ? setb[field] - seta[field]
              : seta[field] - setb[field];
          }
        });
      } else if (type === 'highalch') {
        working_keys = Object.keys(alchsObj).sort((keya, keyb) => {
          let [itema, itemb] = [alchsObj[keya][0], alchsObj[keyb][0]];
          if (typeof itema[field] === 'string') {
            return dir == 'up'
              ? itema[field].localeCompare(itemb[field])
              : itemb[field].localeCompare(itema[field]);
          } else if (field === 'difference') {
            return dir == 'up'
              ? itemb['highalch_difference'] - itema['highalch_difference']
              : itema['highalch_difference'] - itemb['highalch_difference'];
          } else {
            return dir == 'up'
              ? itemb[field] - itema[field]
              : itema[field] - itemb[field];
          }
        });
      }

      // http://2ality.com/2015/10/property-traversal-order-es6.html
      // Convert keys to non-numeric string so they are retrieved in the order in which they were added
      const items = {};
      for (let key of working_keys) {
        if (type === 'items') {
          items['_' + key.toString()] = itemsObj[key];
        } else if (type === 'pots') {
          items['_' + key.toString()] = potsObj[key];
        } else if (type === 'sets') {
          items['_' + key.toString()] = setsObj[key];
        } else if (type === 'highalch') {
          items['_' + key.toString()] = alchsObj[key];
        }
      }

      if (type === 'items') {
        this.setState({
          sortedItems: items,
          lastSortDir: dir,
          lastSortField: field
        });
      } else if (type === 'pots') {
        this.setState({
          sortedPots: items,
          lastSortDir: dir,
          lastSortField: field
        });
      } else if (type === 'sets') {
        this.setState({
          sortedSets: items,
          lastSortDir: dir,
          lastSortField: field
        });
      } else if (type === 'highalch') {
        this.setState({
          sortedAlchs: items,
          lastSortDir: dir,
          lastSortField: field
        });
      }
    }
  }

  searchItems() {
    const { search, itemsObj, potsObj, setsObj } = this.props;
    const { nightReportObj, usingNightReport, alchsObj } = this.state;
    const type = this.tabValueName();

    if (search === '') {
      if (usingNightReport === true) {
        this.setState({ searchedNightReport: nightReportObj });
      } else if (type === 'items') {
        this.setState({ searchedItems: itemsObj });
      } else if (type === 'pots') {
        this.setState({ searchedPots: potsObj });
      } else if (type === 'sets') {
        this.setState({ searchedSets: setsObj });
      } else if (type === 'highalch') {
        this.setState({ searchedAlchs: alchsObj });
      }
    } else {
      let workingArr = [];
      if (usingNightReport === true) {
        for (let key in nightReportObj) {
          workingArr.push(nightReportObj[key]);
        }
      } else if (type === 'items') {
        for (let key in itemsObj) {
          workingArr.push(itemsObj[key][0]);
        }
      } else if (type === 'pots') {
        for (let key in potsObj) {
          workingArr.push(potsObj[key][0]);
        }
      } else if (type === 'sets') {
        for (let key in setsObj) {
          workingArr.push(setsObj[key][0]);
        }
      } else if (type === 'highalch') {
        for (let key in alchsObj) {
          workingArr.push(alchsObj[key][0]);
        }
      }

      const newObj = {};
      for (let result of fuzzysort.go(search, workingArr, {
        threshold: -200,
        key: 'name'
      })) {
        if (usingNightReport === true) {
          newObj['_' + result.obj.id.toString()] =
            nightReportObj[result.obj.id];
        } else if (type === 'items') {
          newObj['_' + result.obj.id.toString()] = itemsObj[result.obj.id];
        } else if (type === 'pots') {
          newObj[result.obj.key] = potsObj[result.obj.key];
        } else if (type === 'sets') {
          newObj[result.obj.key] = setsObj[result.obj.key];
        } else if (type === 'highalch') {
          newObj['_' + result.obj.id.toString()] = alchsObj[result.obj.id];
        }
      }

      if (usingNightReport === true) {
        this.setState({ searchedNightReport: newObj });
      } else if (type === 'items') {
        this.setState({ searchedItems: newObj });
      } else if (type === 'pots') {
        this.setState({ searchedPots: newObj });
      } else if (type === 'sets') {
        this.setState({ searchedSets: newObj });
      } else if (type === 'highalch') {
        this.setState({ searchedAlchs: newObj });
      }
    }
  }

  updateNightReportObj() {
    storage.get('nightReport', (e, data) => {
      let nightObj = {};
      if ('oldReport' in data) {
        nightObj = data['oldReport'];
      } else if ('immediateReport' in data) {
        nightObj = data['immediateReport'];
      }

      this.setState({ nightReportObj: nightObj });
    });
  }

  toggleNightReportViewing() {
    this.setState({ usingNightReport: !usingNightReport });
  }

  tabValueName() {
    if (this.state.tabValue === 0) {
      return 'items';
    } else if (this.state.tabValue === 1) {
      return 'pots';
    } else if (this.state.tabValue === 2) {
      return 'sets';
    } else {
      return 'items';
    }
  }

  stopInterval() {
    if (this.fetchInterval !== null) {
      clearInterval(this.fetchInterval);
    }
  }

  componentDidUpdate(prevProps, prevState) {
    const { lastUpdated, search, itemsObj, toggled, timesUpdated } = this.props;
    const { tabValue } = this.state;

    if (
      prevProps.timesUpdated !== timesUpdated ||
      prevState.tabValue !== tabValue
    ) {
      if (toggled === true) this.updateNightReportObj();

      this.setState({
        alchsObj: Object.filter(itemsObj, item => item[0].sell_average > 0)
      });
      this.sortItems(this.state.lastSortField, this.tabValueName(), false);
      this.searchItems();
    } else if (
      prevProps.search !== search ||
      Object.keys(prevProps.itemsObj).length !== Object.keys(itemsObj).length
    ) {
      this.setState({
        alchsObj: Object.filter(itemsObj, item => item[0].sell_average > 0)
      });
      this.searchItems();
    } else if (prevProps.toggled !== toggled) {
      this.updateNightReportObj();
    }
  }

  componentDidMount() {
    this.props.fetchItems();
    this.updateNightReportObj();

    let timer = setInterval(() => {
      this.props.fetchItems();
    }, 15000);
    this.fetchInterval = timer;
  }

  componentWillUnmount() {
    this.stopInterval();
  }

  render() {
    const { classes, lastUpdated, search, timesUpdated } = this.props;
    const {
      tabValue,
      difference,
      quantity,
      sortedItems,
      sortedPots,
      sortedSets,
      searchedItems,
      searchedPots,
      searchedSets,
      sortedAlchs,
      searchedAlchs,
      lastSortDir,
      lastSortField,
      searchedNightReport,
      sortedNightReport,
      usingNightReport,
      nightReportObj
    } = this.state;
    const histLength = lastUpdated.length;

    // if nightMode is enabled, just use itemsObj, items to hold data
    let itemsObj, potsObj, setsObj, alchsObj;
    const items = {};
    const pots = {};
    const sets = {};
    const alchs = {};

    if (usingNightReport === false) {
      sortedItems !== null
        ? (itemsObj = sortedItems)
        : searchedItems !== null
        ? (itemsObj = searchedItems)
        : (itemsObj = this.props.itemsObj);
      sortedPots !== null
        ? (potsObj = sortedPots)
        : searchedPots !== null
        ? (potsObj = searchedPots)
        : (potsObj = this.props.potsObj);
      sortedSets !== null
        ? (setsObj = sortedSets)
        : searchedSets !== null
        ? (setsObj = searchedSets)
        : (setsObj = this.props.setsObj);
      sortedAlchs !== null
        ? (alchsObj = sortedAlchs)
        : searchedAlchs !== null
        ? (alchsObj = searchedAlchs)
        : (alchsObj = this.state.alchsObj);

      for (let key of Object.keys(itemsObj)) {
        if (
          searchedItems === null ||
          itemsObj[key][0].id in searchedItems ||
            '_' + key.toString() in searchedItems ||
          key in searchedItems
        ) {
          let item = itemsObj[key][0];
          if (
            Math.abs(
              parseInt(item.buy_average) - parseInt(item.sell_average)
            ) >= difference && //&& parseInt(item.buy_quantity) > 2 && parseInt(item.sell_quantity) > 2
            parseInt(item.buy_quantity) + parseInt(item.sell_quantity) >=
              quantity
          ) {
            items[key] = itemsObj[key];
          }
        }
      }

      for (let key of Object.keys(potsObj)) {
        if (
          searchedPots === null ||
          potsObj[key][0].key in searchedPots || key in searchedPots
        ) {
          let item = potsObj[key][0];
          if (
            (difference === 0 || item.difference > difference) &&
            parseInt(item.sell_quant4) + parseInt(item.buy_quant3) > quantity
          ) {
            pots[key] = potsObj[key];
          }
        }
      }

      for (let key of Object.keys(setsObj)) {
        if (
          searchedSets === null ||
          setsObj[key][0].key in searchedSets || key in searchedSets
        ) {
          let set = setsObj[key][0];
          if (difference === 0 || set.difference > difference) {
            sets[key] = setsObj[key];
          }
        }
      }

      for (let key of Object.keys(alchsObj)) {
        if (
          searchedAlchs === null ||
          itemsObj[key][0].id in searchedAlchs ||
            '_' + key.toString() in searchedAlchs ||
          key in searchedAlchs
        ) {
          let item = alchsObj[key][0];
          if (item.highalch_difference >= difference) {
            alchs[key] = alchsObj[key];
          }
        }
      }
    } else {
      sortedNightReport !== null
        ? (itemsObj = sortedNightReport)
        : searchedNightReport !== null
        ? (itemsObj = searchedNightReport)
        : (itemsObj = nightReportObj);
      for (let key of Object.keys(itemsObj)) {
        if (
          searchedNightReport === null ||
          itemsObj[key].id in searchedNightReport ||
            '_' + key.toString() in searchedNightReport ||
          key in searchedNightReport
        ) {
          let item = itemsObj[key];
          if (
            Math.abs(
              parseInt(item.buy_average) - parseInt(item.sell_average)
            ) >= difference &&
            parseInt(item.buy_quantity) > 2 &&
            parseInt(item.sell_quantity) > 2 &&
            parseInt(item.buy_quantity) + parseInt(item.sell_quantity) >=
              quantity
          ) {
            items[key] = itemsObj[key];
          }
        }
      }
    }

    return (
      <div>
        <React.Fragment>
          <AppBar className={classes.controlBar} position="static">
            <Toolbar>
              <TextField
                id="difference-input"
                value={difference}
                label="min. gold difference"
                onChange={this.handleChange('difference')}
                onBlur={this.handleBlur('difference')}
                className={classes.textField}
                InputLabelProps={{
                  className: classes.textFieldInputProps,
                  FormLabelClasses: {
                    root: css`
                      &.focused {
                        color: #c8c8c8 !important;
                      }
                    `,
                    focused: 'focused'
                  }
                }}
                InputProps={{ className: classes.textFieldInputProps }}
                margin="normal"
                variant="filled"
              />
              {tabValue === 0 && (
                <TextField
                  id="difference-input"
                  value={quantity}
                  label="min. total quantity"
                  onChange={this.handleChange('quantity')}
                  onBlur={this.handleBlur('quantity')}
                  className={classes.textField}
                  InputLabelProps={{
                    className: classes.textFieldInputProps,
                    FormLabelClasses: {
                      root: css`
                        &.focused {
                          color: #c8c8c8 !important;
                        }
                      `,
                      focused: 'focused'
                    }
                  }}
                  InputProps={{ className: classes.textFieldInputProps }}
                  margin="normal"
                  variant="filled"
                />
              )}
              <Button
                variant="outlined"
                className={classes.resetButton}
                onClick={this.resetFilters}
                className={classes.button}
              >
                Reset
              </Button>
              &nbsp;&nbsp;&nbsp;
              <FormControlLabel
                control={
                  <Switch
                    checked={this.state.usingNightReport}
                    onChange={this.handleChange('usingNightReport')}
                    value="usingNightReport"
                    color="secondary"
                  />
                }
                label="Last Night Report"
              />
              &nbsp;&nbsp;&nbsp;
              {this.state.usingNightReport &&
                'startTime' in this.state.nightReportObj && (
                  <div className={classes.nightText}>
                    Started at: {this.state.nightReportObj['startTime']}
                  </div>
                )}
            </Toolbar>
          </AppBar>

          <div className={classes.tabRoot}>
            <AppBar position="static">
              <Tabs value={tabValue} onChange={this.handleChange('tabValue')}>
                <Tab label="Single Items" />
                {usingNightReport === false && [
                  <Tab key="pots" label="Pots" />,
                  <Tab key="sets" label="Sets" />,
                  <Tab key="highalch" label="High Alch" />
                ]}
              </Tabs>
              {usingNightReport === false && (
                <div className={classnames('container', classes.histContainer)}>
                  <center>
                    <Typography className={classes.histText}>
                      {`${histLength}${
                        histLength === 4 ? ' (Max)' : ''
                      } Recorded ${
                        histLength > 1
                          ? 'Histories - Click Items to View'
                          : 'History'
                      } - Updated at: ${lastUpdated.join(', ')}`}
                    </Typography>
                  </center>
                </div>
              )}
            </AppBar>
            {tabValue === 0 && (
              <TabContainer className={classes.tabContainer}>
                <ItemTable
                  singleItems={items}
                  sort={this.sortItems}
                  dir={lastSortDir}
                  sortField={lastSortField}
                  timesFetched={timesUpdated}
                  night={usingNightReport}
                />
              </TabContainer>
            )}
            {usingNightReport === false && tabValue === 1 && (
              <TabContainer className={classes.tabContainer}>
                <PotTable
                  pots={pots}
                  sort={this.sortItems}
                  dir={lastSortDir}
                  sortField={lastSortField}
                  timesFetched={timesUpdated}
                />
              </TabContainer>
            )}
            {usingNightReport === false && tabValue === 2 && (
              <TabContainer className={classes.tabContainer}>
                <SetTable
                  sets={sets}
                  sort={this.sortItems}
                  dir={lastSortDir}
                  sortField={lastSortField}
                  timesFetched={timesUpdated}
                />
              </TabContainer>
            )}
            {usingNightReport === false && tabValue === 3 && (
              <TabContainer className={classes.tabContainer}>
                <HighAlchTable
                  singleItems={alchs}
                  sort={this.sortItems}
                  dir={lastSortDir}
                  sortField={lastSortField}
                  timesFetched={timesUpdated}
                />
              </TabContainer>
            )}
          </div>
        </React.Fragment>
      </div>
    );
  }
}

function mapStateToProps(state: State) {
  return {
    ...state.tracker,
    ...state.navbar,
    ...state.night
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(TrackerActions, dispatch);
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(withStyles(styles)(TrackerPage));
