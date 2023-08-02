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

import storage from 'electron-json-storage';

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
  itemImage: {
    textAlign: 'center'
  },
  dirArrow: {
    position: 'absolute',
    marginTop: '-2px'
  },
  collapsePotsDiv: {
    borderTop: '1px solid #c8c8c8'
  },
  collapsePotsDiv2: {
    borderBottom: '1px solid #c8c8c8'
  },
  success: {
    color: 'green'
  },
  fail: {
    color: 'red'
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

  formatHelper = (number, urbanize = false) => {
    if (urbanize === true) {
      let unum = number.toString();
      if (unum.length >= 4) {
        return unum.slice(0, -3) + 'k';
      } else {
        return number.toLocaleString();
      }
    } else {
      return number.toLocaleString() + ' gp';
    }
  };

  render() {
    const { classes, pots, sort, sortField, dir, timesFetched } = this.props;
    const { openRows, page, rowsPerPage } = this.state;
    let type = 'pots';

    const startIndex = page * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const emptyRows =
      rowsPerPage -
      Math.min(rowsPerPage, Object.keys(pots).length - page * rowsPerPage);

    const TableInerds = Object.keys(pots)
      .slice(startIndex, endIndex)
      .map((key, index) => {
        let differences = [];
        let buy_avs3 = [],
          sell_avs3 = [],
          buy_qs3 = [],
          sell_qs3 = [];
        let buy_avs4 = [],
          sell_avs4 = [],
          buy_qs4 = [],
          sell_qs4 = [];
        for (let item of pots[key].slice(1, 7)) {
          let pot3 = item['pots'][0];
          let pot4 = item['pots'][1];
          buy_avs3.push(pot3.avgLowPrice);
          sell_avs3.push(pot3.avgHighPrice);
          buy_avs4.push(pot4.avgLowPrice);
          sell_avs4.push(pot4.avgHighPrice);

          buy_qs3.push(pot3.lowPriceVolume);
          sell_qs3.push(pot3.highPriceVolume);
          buy_qs4.push(pot4.lowPriceVolume);
          sell_qs4.push(pot4.highPriceVolume);
          differences.push(item.difference);
        }

        const collapseHidden = !(key in openRows) || openRows[key] === false;
        const collapseIn = key in openRows && openRows[key] === true;
        const id = pots[key][0]['pots'][1].id;
        const difference = pots[key][0].difference;
        return (
          <TableRow
            key={key}
            className={classes.tableRow}
            onClick={this.handleRowClick.bind(this, key)}
          >
            <TableCell className={classes.itemImage}>
              <ItemImage id={id} name={pots[key][0].name + '(4)'} />
            </TableCell>
            <TableCell className={classes.tableCell}>
              {pots[key][0].name}
            </TableCell>
            <TableCell>
              <div className={difference >= 0 ? classes.success : classes.fail}>
                {this.formatHelper(pots[key][0].difference)}
              </div>
              <Collapse hidden={collapseHidden} in={collapseIn}>
                {differences.map((difference, index) => {
                  return (
                    <div
                      key={`${index}_${timesFetched}`}
                      className={
                        difference >= 0 ? classes.success : classes.fail
                      }
                    >
                      <br />
                      {this.formatHelper(difference)}
                      <br />
                    </div>
                  );
                })}
              </Collapse>
            </TableCell>
            <TableCell>
              {'3: ' + this.formatHelper(pots[key][0]['pots'][0].avgLowPrice)}{' '}
              {`(${this.formatHelper(
                parseInt((pots[key][0]['pots'][0].avgLowPrice / 3) * 4)
              )})`}
              <br />
              {'4: ' + this.formatHelper(pots[key][0]['pots'][1].avgLowPrice)}
              <Collapse hidden={collapseHidden} in={collapseIn}>
                {buy_avs3.map((buy_av, index) => {
                  return (
                    <div
                      className={classes.collapsePotsDiv}
                      key={`${index}_${timesFetched}`}
                    >
                      {'3: ' + this.formatHelper(buy_av)}{' '}
                      {`(${this.formatHelper(parseInt((buy_av / 3) * 4))})`}
                      <br />
                      {'4: ' + this.formatHelper(buy_avs4[index])}
                    </div>
                  );
                })}
              </Collapse>
            </TableCell>
            <TableCell>
              {'3: ' + this.formatHelper(pots[key][0]['pots'][0].avgHighPrice)}{' '}
              <span
                className={difference >= 0 ? classes.success : classes.fail}
              >{`(${this.formatHelper(
                parseInt((pots[key][0]['pots'][0].avgHighPrice / 3) * 4)
              )})`}</span>
              <br />
              {'4: '}
              <span
                className={difference >= 0 ? classes.success : classes.fail}
              >
                {this.formatHelper(pots[key][0]['pots'][1].avgHighPrice)}
              </span>
              <Collapse hidden={collapseHidden} in={collapseIn}>
                {sell_avs3.map((sell_av, index) => {
                  return (
                    <div
                      className={classes.collapsePotsDiv}
                      key={`${index}_${timesFetched}`}
                    >
                      {'3: ' + this.formatHelper(sell_av)}{' '}
                      <span
                        className={
                          differences[index] >= 0
                            ? classes.success
                            : classes.fail
                        }
                      >{`(${this.formatHelper(
                        parseInt((sell_av / 3) * 4)
                      )})`}</span>
                      <br />
                      {'4: '}
                      <span
                        className={
                          differences[index] >= 0
                            ? classes.success
                            : classes.fail
                        }
                      >
                        {this.formatHelper(sell_avs4[index])}
                      </span>
                    </div>
                  );
                })}
              </Collapse>
            </TableCell>
            <TableCell>
              {'3: ' +
                this.formatHelper(pots[key][0]['pots'][0].lowPriceVolume, true)}
              <br />
              {'4: ' +
                this.formatHelper(pots[key][0]['pots'][1].lowPriceVolume, true)}
              <Collapse hidden={collapseHidden} in={collapseIn}>
                {buy_qs3.map((buy_q, index) => {
                  return (
                    <div
                      className={classes.collapsePotsDiv}
                      key={`${index}_${timesFetched}`}
                    >
                      {'3: ' + this.formatHelper(buy_q, true)}
                      <br />
                      {'4: ' + this.formatHelper(buy_qs4[index], true)}
                    </div>
                  );
                })}
              </Collapse>
            </TableCell>
            <TableCell>
              {'3: ' +
                this.formatHelper(
                  pots[key][0]['pots'][0].highPriceVolume,
                  true
                )}
              <br />
              {'4: ' +
                this.formatHelper(
                  pots[key][0]['pots'][1].highPriceVolume,
                  true
                )}
              <Collapse hidden={collapseHidden} in={collapseIn}>
                {sell_qs3.map((sell_q, index) => {
                  return (
                    <div
                      className={classes.collapsePotsDiv}
                      key={`${index}_${timesFetched}`}
                    >
                      {'3: ' + this.formatHelper(sell_q, true)}
                      <br />
                      {'4: ' + this.formatHelper(sell_qs4[index], true)}
                    </div>
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
                width="13.65%"
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
                width="12.65%"
                onClick={() => sort('difference', type)}
              >
                Difference{' '}
                {sortField === 'difference' && (
                  <span className={classes.dirArrow}>
                    {dir === 'up' ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
                  </span>
                )}
              </TableCell>
              <TableCell className={classes.tableHeader} width="26.8%">
                Buy Average
              </TableCell>
              <TableCell className={classes.tableHeader} width="26.8%">
                Sell Average
              </TableCell>
              <TableCell className={classes.tableHeader} width="7%">
                Buying Quantity
              </TableCell>
              <TableCell className={classes.tableHeader} width="7%">
                Selling Quantity
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
                count={Object.keys(pots).length}
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
