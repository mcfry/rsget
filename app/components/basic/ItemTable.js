import React, { Component } from 'react';
import { withStyles } from '@material-ui/core/styles';
import classnames from 'classnames';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableFooter from '@material-ui/core/TableFooter';
import TablePagination from '@material-ui/core/TablePagination';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Paper from '@material-ui/core/Paper';
import Collapse from '@material-ui/core/Collapse';
import KeyboardArrowDown from '@material-ui/icons/KeyboardArrowDown';
import KeyboardArrowUp from '@material-ui/icons/KeyboardArrowUp';
import TablePaginationActions from './TablePaginationActions';

import ItemImage from './ItemImage';

const styles = theme => ({
  root: {
    width: '100%',
    marginTop: theme.spacing.unit * 3,
    overflow: 'auto',
    height: '400px'
  },
  table: {
    minWidth: 500
  },
  tableBody: {},
  tableHeader: {
    backgroundColor: '#fff',
    position: 'sticky',
    top: 0,
    zIndex: 10,
    boxShadow: 'inset 0px -1px 0px 0px rgba(0,0,0,0.75)',
    borderBottom: '0px'
  },
  tableHeaderCursor: {
    cursor: 'pointer'
  },
  tableRow: {
    cursor: 'pointer'
  },
  tableCell: {
    verticalAlign: 'middle'
  },
  spanNotLatest: {
    color: '#ff7d19 !important'
  },
  itemImage: {
    textAlign: 'center'
  },
  dirArrow: {
    position: 'absolute',
    marginTop: '-2px'
  }
});

class ItemTable extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      openRows: {},
      page: 0,
      rowsPerPage: 5
    };
  }

  handleChangePage = (event, page) => {
    this.setState({ page });
  };

  handleChangeRowsPerPage = event => {
    this.setState({ rowsPerPage: event.target.value });
  };

  handleRowClick = rowIndex => {
    let { openRows } = this.state;
    if (rowIndex in openRows && openRows[rowIndex] === true) {
      openRows[rowIndex] = false;
    } else {
      openRows[rowIndex] = true;
    }
    this.setState({ openRows: openRows });
  };

  formatHelper = number => {
    return number.toLocaleString() + ' gp';
  };

  calculateTax(high) {
    if (high * 0.01 > 5000000) {
      return 5000000;
    } else {
      return Math.round(high * 0.01);
    }
  }

  render() {
    const {
      classes,
      singleItems,
      sort,
      sortField,
      dir,
      timesFetched,
      night
    } = this.props;
    const { openRows, page, rowsPerPage } = this.state;
    let type = 'items';

    const startIndex = page * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const emptyRows =
      rowsPerPage -
      Math.min(
        rowsPerPage,
        Object.keys(singleItems).length - page * rowsPerPage
      );

    const TableInerds = Object.keys(singleItems)
      .slice(startIndex, endIndex)
      .map((key, index) => {
        let names = [],
          buy_avs = [],
          sell_avs = [],
          buy_qs = [],
          sell_qs = [],
          latests = [];

        // If not in an array list, put it into one so it can be processed
        if (!Array.isArray(singleItems[key]))
          singleItems[key] = [singleItems[key]];

        for (let item of singleItems[key].slice(1, 7)) {
          names.push(item.name);
          buy_avs.push(item.avgLowPrice);
          sell_avs.push(item.avgHighPrice);
          buy_qs.push(item.lowPriceVolume);
          sell_qs.push(item.highPriceVolume);
          latests.push(item.latest);
        }

        const collapseHidden = !(key in openRows) || openRows[key] === false;
        const collapseIn = key in openRows && openRows[key] === true;
        const id = singleItems[key][0].id;
        return (
          <TableRow
            key={key}
            className={classes.tableRow}
            onClick={this.handleRowClick.bind(this, key)}
          >
            <TableCell className={classes.itemImage}>
              <ItemImage
                id={id}
                name={singleItems[key][0].name}
                icon={singleItems[key][0].icon}
              />
            </TableCell>
            <TableCell className={classes.tableCell}>
              {singleItems[key][0].name}
            </TableCell>
            <TableCell>
              <span
                className={
                  singleItems[key][0].latest ? '' : classes.spanNotLatest
                }
              >
                {this.formatHelper(
                  singleItems[key][0].avgHighPrice -
                    singleItems[key][0].avgLowPrice -
                    this.calculateTax(singleItems[key][0].avgHighPrice)
                )}
              </span>
              <Collapse hidden={collapseHidden} in={collapseIn}>
                {buy_avs.map((buy_av, index) => {
                  return (
                    <span
                      className={latests[index] ? '' : classes.spanNotLatest}
                      key={`${index}_${timesFetched}`}
                    >
                      {this.formatHelper(
                        Math.abs(buy_av - sell_avs[index]) -
                          this.calculateTax(sell_avs[index])
                      )}
                      <br />
                    </span>
                  );
                })}
              </Collapse>
            </TableCell>
            <TableCell>
              <span
                className={
                  singleItems[key][0].latest ? '' : classes.spanNotLatest
                }
              >
                {this.formatHelper(singleItems[key][0].avgLowPrice)}
              </span>
              <Collapse hidden={collapseHidden} in={collapseIn}>
                {buy_avs.map((buy_av, index) => {
                  return (
                    <span
                      className={latests[index] ? '' : classes.spanNotLatest}
                      key={`${index}_${timesFetched}`}
                    >
                      {this.formatHelper(buy_av)}
                      <br />
                    </span>
                  );
                })}
              </Collapse>
            </TableCell>
            <TableCell>
              <span
                className={
                  singleItems[key][0].latest ? '' : classes.spanNotLatest
                }
              >
                {this.formatHelper(singleItems[key][0].avgHighPrice)}
              </span>
              <Collapse hidden={collapseHidden} in={collapseIn}>
                {sell_avs.map((sell_av, index) => {
                  return (
                    <span
                      className={latests[index] ? '' : classes.spanNotLatest}
                      key={`${index}_${timesFetched}`}
                    >
                      {this.formatHelper(sell_av)}
                      <br />
                    </span>
                  );
                })}
              </Collapse>
            </TableCell>
            <TableCell>
              <span
                className={
                  singleItems[key][0].latest ? '' : classes.spanNotLatest
                }
              >
                {singleItems[key][0].lowPriceVolume.toLocaleString()}
              </span>
              <Collapse hidden={collapseHidden} in={collapseIn}>
                {buy_qs.map((buy_q, index) => {
                  return (
                    <span
                      className={latests[index] ? '' : classes.spanNotLatest}
                      key={`${index}_${timesFetched}`}
                    >
                      {buy_q.toLocaleString()}
                      <br />
                    </span>
                  );
                })}
              </Collapse>
            </TableCell>
            <TableCell>
              <span
                className={
                  singleItems[key][0].latest ? '' : classes.spanNotLatest
                }
              >
                {singleItems[key][0].highPriceVolume.toLocaleString()}
              </span>
              <Collapse hidden={collapseHidden} in={collapseIn}>
                {sell_qs.map((sell_q, index) => {
                  return (
                    <span
                      className={latests[index] ? '' : classes.spanNotLatest}
                      key={`${index}_${timesFetched}`}
                    >
                      {sell_q.toLocaleString()}
                      <br />
                    </span>
                  );
                })}
              </Collapse>
            </TableCell>
          </TableRow>
        );
      });

    return (
      <Paper className={classes.root}>
        <Table className={classes.table}>
          <TableHead>
            <TableRow>
              <TableCell className={classes.tableHeader} width="6%"></TableCell>
              <TableCell
                className={classnames(
                  classes.tableHeader,
                  classes.tableHeaderCursor
                )}
                width="16.65%"
                onClick={() => sort('name', type)}
              >
                Item Name{' '}
                {sortField === 'name' && (
                  <span className={classes.dirArrow}>
                    {dir === 'up' ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
                  </span>
                )}
              </TableCell>
              <TableCell
                className={classnames(
                  classes.tableHeader,
                  classes.tableHeaderCursor
                )}
                width="17.65%"
                onClick={() => sort('difference', type)}
              >
                Taxed Difference{' '}
                {sortField === 'difference' && (
                  <span className={classes.dirArrow}>
                    {dir === 'up' ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
                  </span>
                )}
              </TableCell>
              <TableCell
                className={classnames(
                  classes.tableHeader,
                  classes.tableHeaderCursor
                )}
                width="22.8%"
                onClick={() => sort('avgLowPrice', type)}
              >
                {night ? 'Lowest Price Point' : 'Buy Average'}{' '}
                {sortField === 'avgLowPrice' && (
                  <span className={classes.dirArrow}>
                    {dir === 'up' ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
                  </span>
                )}
              </TableCell>
              <TableCell
                className={classnames(
                  classes.tableHeader,
                  classes.tableHeaderCursor
                )}
                width="22.8%"
                onClick={() => sort('avgHighPrice', type)}
              >
                {night ? 'Highest Price Point' : 'Sell Average'}{' '}
                {sortField === 'avgHighPrice' && (
                  <span className={classes.dirArrow}>
                    {dir === 'up' ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
                  </span>
                )}
              </TableCell>
              <TableCell
                className={classnames(
                  classes.tableHeader,
                  classes.tableHeaderCursor
                )}
                width="7%"
                onClick={() => sort('lowPriceVolume', type)}
              >
                {night ? 'Quantity at Min' : 'Buying Quantity'}{' '}
                {sortField === 'lowPriceVolume' && (
                  <span className={classes.dirArrow}>
                    {dir === 'up' ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
                  </span>
                )}
              </TableCell>
              <TableCell
                className={classnames(
                  classes.tableHeader,
                  classes.tableHeaderCursor
                )}
                width="7%"
                onClick={() => sort('highPriceVolume', type)}
              >
                {night ? 'Quantity at Max' : 'Selling Quantity'}{' '}
                {sortField === 'highPriceVolume' && (
                  <span className={classes.dirArrow}>
                    {dir === 'up' ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
                  </span>
                )}
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody className={classes.tableBody}>
            <React.Fragment>{TableInerds}</React.Fragment>
            {emptyRows > 0 && (
              <TableRow style={{ height: 48 * emptyRows }}>
                <TableCell colSpan="7" />
              </TableRow>
            )}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TablePagination
                colSpan={7}
                count={Object.keys(singleItems).length}
                rowsPerPage={rowsPerPage}
                page={page}
                onChangePage={this.handleChangePage}
                onChangeRowsPerPage={this.handleChangeRowsPerPage}
                ActionsComponent={TablePaginationActions}
              />
            </TableRow>
          </TableFooter>
        </Table>
      </Paper>
    );
  }
}

export default withStyles(styles)(ItemTable);
