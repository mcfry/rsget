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
  tableBodyCell: {
    fontSize: '11px !important'
  },
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
  collapsePotsDiv: {
    borderTop: '1px solid #c8c8c8'
  },
  dirArrow: {
    position: 'absolute',
    marginTop: '-2px'
  },
  success: {
    color: 'green'
  },
  fail: {
    color: 'red'
  },
  notLatest: {
    color: '#ff7d19 !important'
  },
  none: {}
});

class SetTable extends React.Component {
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
    return number === 0 ? 'None' : number.toLocaleString() + ' gp';
  };

  render() {
    const { classes, sets, sort, sortField, dir, timesFetched } = this.props;
    const { openRows, page, rowsPerPage } = this.state;
    let type = 'sets';

    const startIndex = page * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const emptyRows =
      rowsPerPage -
      Math.min(rowsPerPage, Object.keys(sets).length - page * rowsPerPage);

    const TableInerds = Object.keys(sets)
      .slice(startIndex, endIndex)
      .map((key, index) => {
        let names = [],
          differences = [],
          diff_invalid = [],
          high_buys = [],
          latests = [],
          taxes = [],
          taxesPieces = [];
        let setItems = {
          item0: [],
          item1: [],
          item2: [],
          item3: [],
          item4: []
        };
        for (let set of sets[key].slice(1, 7)) {
          let i = 0;
          while (i in set) {
            setItems[`item${i}`].push(set[i]);
            i += 1;
          }
          names.push(set.name);
          differences.push(set.difference);
          taxes.push(set.tax);
          taxesPieces.push(set.taxPieces);
          diff_invalid.push(set.invalid);
          high_buys.push(set.high_buys);
          latests.push(set.latest);
        }

        const collapseHidden = !(key in openRows) || openRows[key] === false;
        const collapseIn = key in openRows && openRows[key] === true;
        const id = sets[key][0][0].id;
        return (
          <TableRow
            key={key}
            className={classes.tableRow}
            onClick={this.handleRowClick.bind(this, key)}
          >
            <TableCell className={classes.itemImage}>
              <ItemImage id={id} name={sets[key][0][0].name} />
            </TableCell>
            <TableCell
              className={classnames(classes.tableCell, classes.tableBodyCell)}
            >
              {sets[key][0][0].name}
            </TableCell>
            <TableCell className={classes.tableBodyCell}>
              <span
                className={
                  sets[key][0].latest
                    ? sets[key][0].difference >= 0 &&
                      sets[key][0].invalid === false
                      ? classes.success
                      : classes.fail
                    : classes.notLatest
                }
              >
                {sets[key][0].invalid === false
                  ? this.formatHelper(sets[key][0].difference)
                  : 'Not enough info'}
                <br />
              </span>
              <span>
                T:{' '}
                {sets[key][0].invalid === false
                  ? this.formatHelper(sets[key][0].tax)
                  : ''}
              </span>
              <br />
              <span>
                RT:{' '}
                {sets[key][0].invalid === false
                  ? this.formatHelper(sets[key][0].taxPieces)
                  : ''}
              </span>
              <Collapse hidden={collapseHidden} in={collapseIn}>
                <br />
                {differences.map((difference, index) => {
                  return (
                    <React.Fragment key={`${index}_${timesFetched}`}>
                      <div>
                        <span
                          className={
                            latests[index]
                              ? difference >= 0 && diff_invalid[index] === false
                                ? classes.success
                                : classes.fail
                              : classes.notLatest
                          }
                        >
                          {diff_invalid[index] === false
                            ? this.formatHelper(difference)
                            : 'Not enough info'}
                        </span>
                        <br />
                        <span>
                          T:{' '}
                          {diff_invalid[index] === false
                            ? this.formatHelper(taxes[index])
                            : ''}
                        </span>
                        <br />
                        <span>
                          RT:{' '}
                          {diff_invalid[index] === false
                            ? this.formatHelper(taxesPieces[index])
                            : ''}
                        </span>
                      </div>
                      <br />
                    </React.Fragment>
                  );
                })}
              </Collapse>
            </TableCell>
            <TableCell className={classes.tableBodyCell}>
              {0 in sets[key][0] ? (
                <React.Fragment>
                  <span
                    className={
                      sets[key][0][0].avgLowPrice !== 0 &&
                      sets[key][0].difference >= 0 &&
                      sets[key][0].invalid === false
                        ? sets[key][0][0].avgHighPrice !== 0 &&
                          sets[key][0].invalid === false
                          ? classes.none
                          : classes.success
                        : sets[key][0][0].avgHighPrice !== 0 &&
                          sets[key][0].invalid === false
                        ? classes.none
                        : classes.fail
                    }
                  >
                    {'Buy: ' + this.formatHelper(sets[key][0][0].avgLowPrice)}
                  </span>
                  <br />
                  <span
                    className={
                      sets[key][0][0].avgHighPrice !== 0 &&
                      sets[key][0].difference >= 0 &&
                      sets[key][0].invalid === false
                        ? classes.success
                        : classes.fail
                    }
                  >
                    {'Sell: ' + this.formatHelper(sets[key][0][0].avgHighPrice)}
                  </span>
                  <br />
                  <span
                    className={
                      (sets[key][0][0].avgHighPrice !== 0 ||
                        sets[key][0][0].avgLowPrice !== 0) &&
                      sets[key][0].difference >= 0 &&
                      sets[key][0].invalid === false
                        ? classes.success
                        : classes.fail
                    }
                  >
                    {'Pieces: ' + this.formatHelper(sets[key][0].high_buys)}
                  </span>
                  <br />
                  {'Total: ' +
                    (
                      parseInt(sets[key][0][0].lowPriceVolume) +
                      parseInt(sets[key][0][0].highPriceVolume)
                    ).toString()}
                  <Collapse hidden={collapseHidden} in={collapseIn}>
                    {setItems.item0.map((item0, index) => {
                      return (
                        <div
                          className={classes.collapsePotsDiv}
                          key={`${index}_${timesFetched}_${item0.id}`}
                        >
                          <span
                            className={
                              item0.avgLowPrice !== 0 &&
                              differences[index] >= 0 &&
                              diff_invalid[index] === false
                                ? item0.avgHighPrice !== 0 &&
                                  diff_invalid[index] === false
                                  ? classes.none
                                  : classes.success
                                : item0.avgHighPrice !== 0 &&
                                  diff_invalid[index] === false
                                ? classes.none
                                : classes.fail
                            }
                          >
                            {'Buy: ' + this.formatHelper(item0.avgLowPrice)}
                          </span>
                          <br />
                          <span
                            className={
                              item0.avgHighPrice !== 0 &&
                              differences[index] >= 0 &&
                              diff_invalid[index] === false
                                ? classes.success
                                : classes.fail
                            }
                          >
                            {'Sell: ' + this.formatHelper(item0.avgHighPrice)}
                          </span>
                          <br />
                          <span
                            className={
                              (item0.avgHighPrice !== 0 ||
                                item0.avgLowPrice !== 0) &&
                              differences[index] >= 0 &&
                              diff_invalid[index] === false
                                ? classes.success
                                : classes.fail
                            }
                          >
                            {'Pieces: ' + this.formatHelper(high_buys[index])}
                          </span>
                          <br />
                          {'Total: ' +
                            (
                              parseInt(item0.lowPriceVolume) +
                              parseInt(item0.highPriceVolume)
                            ).toString()}
                        </div>
                      );
                    })}
                  </Collapse>
                </React.Fragment>
              ) : (
                ''
              )}
            </TableCell>
            <TableCell className={classes.tableBodyCell}>
              {1 in sets[key][0] ? (
                <React.Fragment>
                  {'Name: ' +
                    sets[key][0][1].name
                      .split(' ')
                      .slice(1, 4)
                      .join(' ')}
                  <br />
                  {'Buy: ' + this.formatHelper(sets[key][0][1].avgLowPrice)}
                  <br />
                  {'Sell: ' + this.formatHelper(sets[key][0][1].avgHighPrice)}
                  <br />
                  {'Total: ' +
                    (
                      parseInt(sets[key][0][1].lowPriceVolume) +
                      parseInt(sets[key][0][1].highPriceVolume)
                    ).toString()}
                  <Collapse hidden={collapseHidden} in={collapseIn}>
                    {setItems.item1.map((item1, index) => {
                      return (
                        <div
                          className={classes.collapsePotsDiv}
                          key={`${index}_${timesFetched}_${item1.id}`}
                        >
                          {'Name: ' +
                            item1.name
                              .split(' ')
                              .slice(1, 4)
                              .join(' ')}
                          <br />
                          {'Buy: ' + this.formatHelper(item1.avgLowPrice)}
                          <br />
                          {'Sell: ' + this.formatHelper(item1.avgHighPrice)}
                          <br />
                          {'Total: ' +
                            (
                              parseInt(item1.lowPriceVolume) +
                              parseInt(item1.highPriceVolume)
                            ).toString()}
                        </div>
                      );
                    })}
                  </Collapse>
                </React.Fragment>
              ) : (
                ''
              )}
            </TableCell>
            <TableCell className={classes.tableBodyCell}>
              {2 in sets[key][0] ? (
                <React.Fragment>
                  {'Name: ' +
                    sets[key][0][2].name
                      .split(' ')
                      .slice(1, 4)
                      .join(' ')}
                  <br />
                  {'Buy: ' + this.formatHelper(sets[key][0][2].avgLowPrice)}
                  <br />
                  {'Sell: ' + this.formatHelper(sets[key][0][2].avgHighPrice)}
                  <br />
                  {'Total: ' +
                    (
                      parseInt(sets[key][0][2].lowPriceVolume) +
                      parseInt(sets[key][0][2].highPriceVolume)
                    ).toString()}
                  <Collapse hidden={collapseHidden} in={collapseIn}>
                    {setItems.item2.map((item2, index) => {
                      return (
                        <div
                          className={classes.collapsePotsDiv}
                          key={`${index}_${timesFetched}_${item2.id}`}
                        >
                          {'Name: ' +
                            item2.name
                              .split(' ')
                              .slice(1, 4)
                              .join(' ')}
                          <br />
                          {'Buy: ' + this.formatHelper(item2.avgLowPrice)}
                          <br />
                          {'Sell: ' + this.formatHelper(item2.avgHighPrice)}
                          <br />
                          {'Total: ' +
                            (
                              parseInt(item2.lowPriceVolume) +
                              parseInt(item2.highPriceVolume)
                            ).toString()}
                        </div>
                      );
                    })}
                  </Collapse>
                </React.Fragment>
              ) : (
                ''
              )}
            </TableCell>
            <TableCell className={classes.tableBodyCell}>
              {3 in sets[key][0] ? (
                <React.Fragment>
                  {'Name: ' +
                    sets[key][0][3].name
                      .split(' ')
                      .slice(1, 4)
                      .join(' ')}
                  <br />
                  {'Buy: ' + this.formatHelper(sets[key][0][3].avgLowPrice)}
                  <br />
                  {'Sell: ' + this.formatHelper(sets[key][0][3].avgHighPrice)}
                  <br />
                  {'Total: ' +
                    (
                      parseInt(sets[key][0][3].lowPriceVolume) +
                      parseInt(sets[key][0][3].highPriceVolume)
                    ).toString()}
                  <Collapse hidden={collapseHidden} in={collapseIn}>
                    {setItems.item3.map((item3, index) => {
                      return (
                        <div
                          className={classes.collapsePotsDiv}
                          key={`${index}_${timesFetched}_${item3.id}`}
                        >
                          {'Name: ' +
                            item3.name
                              .split(' ')
                              .slice(1, 4)
                              .join(' ')}
                          <br />
                          {'Buy: ' + this.formatHelper(item3.avgLowPrice)}
                          <br />
                          {'Sell: ' + this.formatHelper(item3.avgHighPrice)}
                          <br />
                          {'Total: ' +
                            (
                              parseInt(item3.lowPriceVolume) +
                              parseInt(item3.highPriceVolume)
                            ).toString()}
                        </div>
                      );
                    })}
                  </Collapse>
                </React.Fragment>
              ) : (
                ''
              )}
            </TableCell>
            <TableCell className={classes.tableBodyCell}>
              {4 in sets[key][0] ? (
                <React.Fragment>
                  {'Name: ' +
                    sets[key][0][4].name
                      .split(' ')
                      .slice(1, 4)
                      .join(' ')}
                  <br />
                  {'Buy: ' + this.formatHelper(sets[key][0][4].avgLowPrice)}
                  <br />
                  {'Sell: ' + this.formatHelper(sets[key][0][4].avgHighPrice)}
                  <br />
                  {'Total: ' +
                    (
                      parseInt(sets[key][0][4].lowPriceVolume) +
                      parseInt(sets[key][0][4].highPriceVolume)
                    ).toString()}
                  <Collapse hidden={collapseHidden} in={collapseIn}>
                    {setItems.item4.map((item4, index) => {
                      return (
                        <div
                          className={classes.collapsePotsDiv}
                          key={`${index}_${timesFetched}_${item4.id}`}
                        >
                          {'Name: ' +
                            item4.name
                              .split(' ')
                              .slice(1, 4)
                              .join(' ')}
                          <br />
                          {'Buy: ' + this.formatHelper(item4.avgLowPrice)}
                          <br />
                          {'Sell: ' + this.formatHelper(item4.avgHighPrice)}
                          <br />
                          {'Total: ' +
                            (
                              parseInt(item4.lowPriceVolume) +
                              parseInt(item4.highPriceVolume)
                            ).toString()}
                        </div>
                      );
                    })}
                  </Collapse>
                </React.Fragment>
              ) : (
                ''
              )}
            </TableCell>
          </TableRow>
        );
      });

    return (
      <Paper className={classes.root}>
        <Table className={classes.table}>
          <TableHead>
            <TableRow>
              <TableCell className={classes.tableHeader} width="4%"></TableCell>
              <TableCell
                className={classnames(
                  classes.tableHeader,
                  classes.tableHeaderCursor
                )}
                width="9.65%"
                onClick={() => sort('name', type)}
              >
                Set Name{' '}
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
              <TableCell className={classes.tableHeader} width="15%">
                Set
              </TableCell>
              <TableCell className={classes.tableHeader} width="14.9%">
                Item 1
              </TableCell>
              <TableCell className={classes.tableHeader} width="14.9%">
                Item 2
              </TableCell>
              <TableCell className={classes.tableHeader} width="14.9%">
                Item 3
              </TableCell>
              <TableCell className={classes.tableHeader} width="14.9%">
                Item 4
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
                count={Object.keys(sets).length}
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

export default withStyles(styles)(SetTable);
