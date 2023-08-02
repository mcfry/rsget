// @flow
import {
  SET_TAB_VALUE,
  REQUEST_ITEMS,
  RECEIVE_ITEMS,
  INVALIDATE_ITEMS
} from '../actions/tracker';
import { potGroups, setGroups } from '../constants/groups';
import type { Action } from './types';

import dateFormat from 'dateFormat';
import storage from 'electron-json-storage';

// https://www.robinwieruch.de/the-soundcloud-client-in-react-redux-flow/

type State = {
  tabValue: number,
  isFetching: boolean,
  isInvalid: boolean,
  timesUpdated: number,
  nightTimesUpdatedStart: number,
  itemsObj: Object,
  potsObj: Object,
  setsObj: Object,
  lastUpdated: Array
};

const initialState = {
  tabValue: 0,
  isFetching: false,
  isInvalid: false,
  timesUpdated: 0,
  nightTimesUpdatedStart: 0,
  itemsObj: {},
  potsObj: {},
  setsObj: {},
  lastUpdated: []
};

function difference(a1, a2) {
  var result = [];
  for (var i = 0; i < a1.length; i++) {
    if (a2.indexOf(a1[i]) === -1) {
      result.push(a1[i]);
    }
  }
  return result;
}

function calculateTax(high) {
  if (high * 0.01 > 5000000) {
    return 5000000;
  } else {
    return Math.round(high * 0.01);
  }
}

// https://www.osrsbox.com/osrsbox-db/items-complete.json
// example:
// id	0
// name	"Dwarf remains"
// members	true
// tradeable	false
// tradeable_on_ge	false
// stackable	false
// noted	false
// noteable	false
// linked_id	null
// placeholder	false
// equipable	false
// equipable_by_player	false
// cost	1
// lowalch	0
// highalch	0
// weight	0
// buy_limit	null
// quest_item	true
// release_date	"27 May 2003"
// examine	"The body of a Dwarf savaged by Goblins."
// url	"https://oldschool.runescape.wiki/w/Dwarf_remains"

// NEW - Runelite version
// https://prices.runescape.wiki/api/v1/osrs/mapping
// example:
// examine "A beautifully crafted axe, shaped by ancient smiths."
// id  20011
// members true
// lowalch 22000
// limit 40
// value 55000
// highalch  33000
// icon  "3rd age axe.png"
// name  "3rd age axe"

export default function tracker(state: State = initialState, action: Action) {
  switch (action.type) {
    case SET_TAB_VALUE:
      return Object.assign({}, state, {
        tabValue: action.tabValue
      });
    case REQUEST_ITEMS:
      return Object.assign({}, state, {
        isFetching: true,
        isInvalid: false
      });
    case RECEIVE_ITEMS:
      let changed = false;
      let newItemsObj = Object.assign({}, state.itemsObj);
      let newPotsObj = Object.assign({}, state.potsObj);
      let newSetsObj = Object.assign({}, state.setsObj);

      // Check if first run
      if (Object.keys(state.potsObj).length === 0) {
        changed = true;
      } else {
        for (let key in action.items) {
          // Only need to check items to see if whole object has changed
          if (!(key in potGroups) && !(key in setGroups)) {
            if (key in state.itemsObj) {
              // Use high val to check for change because sometimes we adjust the low value if none are sold
              let highVal = Math.max(
                action.items[key].avgHighPrice,
                action.items[key].avgLowPrice
              );
              if (
                highVal !== state.itemsObj[key][0].avgLowPrice &&
                highVal !== state.itemsObj[key][0].avgHighPrice
              ) {
                changed = true;
                break;
              }
            }
          }
        }
      }

      if (changed === true) {
        let diffs = difference(
          Object.keys(action.items),
          Object.keys(state.itemsObj)
        );
        let diffs2 = difference(
          Object.keys(action.items),
          Object.keys(action.summary)
        );
        let tempPotsObj = {};
        let tempSetsObj = {};

        if (action.logToggled === true) {
          storage.get('nightReport', (e, data) => {
            if (e) throw e;
            if (!('immediateReport' in data)) {
              data['immediateReport'] = {};
              data['immediateReport']['startTime'] = dateFormat(
                new Date(),
                'mmmm dS, yyyy, h:MM:ss TT'
              );
            }

            let dir = data['immediateReport'];
            for (let key in action.items) {
              let item = action.items[key];
              if (key in dir) {
                if (item.avgLowPrice > item.avgHighPrice) {
                  if (dir[key].avgLowPrice > item.avgHighPrice) {
                    dir[key].avgLowPrice = item.avgHighPrice;
                    dir[key].lowPriceVolume = item.highPriceVolume;
                  }

                  if (dir[key].avgHighPrice < item.avgLowPrice) {
                    dir[key].avgHighPrice = item.avgLowPrice;
                    dir[key].highPriceVolume = item.lowPriceVolume;
                  }
                } else {
                  if (dir[key].avgLowPrice > item.avgLowPrice) {
                    dir[key].avgLowPrice = item.avgLowPrice;
                    dir[key].lowPriceVolume = item.lowPriceVolume;
                  }

                  if (dir[key].avgHighPrice < item.avgHighPrice) {
                    dir[key].avgHighPrice = item.avgHighPrice;
                    dir[key].highPriceVolume = item.highPriceVolume;
                  }
                }
              } else {
                dir[key] = item;
              }
            }

            data['immediateReport'] = dir;
            storage.set('nightReport', data, e2 => {
              if (e2) console.log(e2);
            });
          });
        }

        for (let key in action.summary) {
          if (key !== 'dateFetched') {
            // && action.summary[key].tradeable_on_ge === true) {
            let item = {};

            if (action.items[key]) {
              item = action.items[key];
              item['id'] = action.summary[key]['id'];
              item['name'] = action.summary[key]['name'];
              item['icon'] = action.summary[key]['icon'];
              if (
                action.summary[key]['name'] === undefined ||
                action.summary[key]['name'] === null
              ) {
                console.log('item', item);
              }
              item['highalch'] = action.summary[key]['highalch'];

              // if (!('lowPriceVolume' in item)) {
              // 	item['latest'] = true
              // 	if (key in state.itemsObj) {
              // 		let i=0; while (i in state.itemsObj[key]) {
              // 			if ('lowPriceVolume' in state.itemsObj[key][i]
              // 					&& state.itemsObj[key][i].latest === true)
              // 			{
              // 				item['lowPriceVolume'] = state.itemsObj[key][i].lowPriceVolume;
              // 				break;
              // 			}
              // 			i += 1;
              // 		}
              // 	} else {
              // 		item['lowPriceVolume'] = 0;
              // 	}
              // } else {
              // 	item['latest'] = false
              // }

              // If using latest data instead of 5m, use last values for quantities
              if (!('lowPriceVolume' in item)) {
                item['latest'] = true;
                if (
                  key in state.itemsObj &&
                  'lowPriceVolume' in state.itemsObj[key][0]
                ) {
                  item['lowPriceVolume'] =
                    state.itemsObj[key][0].lowPriceVolume;
                } else {
                  item['lowPriceVolume'] = 0;
                }
              } else {
                item['latest'] = false;
              }

              if (!('highPriceVolume' in item)) {
                if (
                  key in state.itemsObj &&
                  'highPriceVolume' in state.itemsObj[key][0]
                ) {
                  item['highPriceVolume'] =
                    state.itemsObj[key][0].highPriceVolume;
                } else {
                  item['highPriceVolume'] = 0;
                }
              }
            } else if (diffs.includes(key) && key in state.itemsObj) {
              // Duplicate last entry if already exists and not found again
              item = state.itemsObj[key][0];
            } else {
              item['id'] = action.summary[key]['id'];
              item['name'] = action.summary[key]['name'];
              item['icon'] = action.summary[key]['icon'];
              item['highalch'] = action.summary[key]['highalch'];
              for (let key of [
                'avgLowPrice',
                'avgHighPrice',
                'lowPriceVolume',
                'highPriceVolume'
              ]) {
                item[key] = 0;
              }
            }

            if (item.avgLowPrice > item.avgHighPrice) {
              let temp = item.avgLowPrice;
              item.avgLowPrice = item.avgHighPrice;
              item.avgHighPrice = temp;

              temp = item.lowPriceVolume;
              item.lowPriceVolume = item.highPriceVolume;
              item.highPriceVolume = temp;
            }

            // If only one item bought/sold, then just list the price as both buy and sell
            if (item.lowPriceVolume === 0) {
              //item.lowPriceVolume = item.highPriceVolume;
              item.avgLowPrice = item.avgHighPrice;
            } else if (item.highPriceVolume === 0) {
              //item.highPriceVolume = item.lowPriceVolume;
              item.avgHighPrice = item.avgLowPrice;
            }

            // Set the alch difference
            item['highalch_difference'] = item['highalch'] - item.avgHighPrice;

            if (key in potGroups) {
              let newKey = potGroups[key][0];
              let newIndex = potGroups[key][1];
              if (newKey in tempPotsObj) {
                tempPotsObj[newKey]['pots'][newIndex] = item;

                let pot3 = tempPotsObj[newKey]['pots'][0];
                let pot4 = tempPotsObj[newKey]['pots'][1];
                tempPotsObj[newKey].key = newKey;
                tempPotsObj[newKey].difference =
                  pot4.avgHighPrice - parseInt((pot3.avgHighPrice / 3) * 4);
                tempPotsObj[newKey].name = pot3.name.slice(0, -3);
                tempPotsObj[newKey].buy_quant3 = pot3.lowPriceVolume;
                tempPotsObj[newKey].sell_quant4 = pot4.lowPriceVolume;
                newPotsObj[newKey] = [tempPotsObj[newKey]].concat(
                  newKey in state.potsObj
                    ? state.potsObj[newKey].slice(0, 6)
                    : []
                );
              } else {
                let newObj = {};
                newObj['pots'] = {};
                newObj['pots'][newIndex] = item;
                tempPotsObj[newKey] = newObj;
              }
            } else if (key in setGroups) {
              let setKeysArr = Array.isArray(setGroups[key][0])
                ? setGroups[key]
                : [setGroups[key]];
              for (let setKey of setKeysArr) {
                let newKey = setKey[0];
                let newIndex = setKey[1];
                if (newKey in tempSetsObj) {
                  tempSetsObj[newKey][newIndex] = item;
                  tempSetsObj[newKey][newIndex].invalid_override = true;
                } else {
                  let newObj = {};
                  newObj[newIndex] = item;
                  tempSetsObj[newKey] = newObj;
                  newObj[newIndex].invalid_override = true;
                }
              }
            }

            // Always put into items
            newItemsObj[key] = [item].concat(
              key in state.itemsObj ? state.itemsObj[key].slice(0, 6) : []
            );
          }
        }

        for (let key of diffs2) {
          let item = action.items[key];
          item['highalch'] = 0;
          item['highalch_difference'] = 0;

          if (item.avgLowPrice > item.avgHighPrice) {
            let temp = item.avgLowPrice;
            item.avgLowPrice = item.avgHighPrice;
            item.avgHighPrice = temp;

            temp = item.lowPriceVolume;
            item.lowPriceVolume = item.highPriceVolume;
            item.highPriceVolume = temp;
          }

          // If only one item bought/sold, then just list the price as both buy and sell
          if (item.lowPriceVolume === 0) {
            //item.lowPriceVolume = item.highPriceVolume;
            item.avgLowPrice = item.avgHighPrice;
          } else if (item.highPriceVolume === 0) {
            //item.highPriceVolume = item.lowPriceVolume;
            item.avgHighPrice = item.avgLowPrice;
          }

          newItemsObj[key] = [item].concat(
            key in state.itemsObj ? state.itemsObj[key].slice(0, 6) : []
          );
        }

        for (let key in tempSetsObj) {
          if (!(0 in tempSetsObj[key])) {
            console.log(tempSetsObj[key]);
          }
          tempSetsObj[key].key = key;
          tempSetsObj[key].name = tempSetsObj[key][0].name;
          tempSetsObj[key].invalid = false;
          // If combined set has no price data
          if (
            tempSetsObj[key][0].avgHighPrice === 0 &&
            tempSetsObj[key][0].avgLowPrice === 0
          ) {
            // And never price data
            if (
              key in state.setsObj &&
              (state.setsObj[key][0][0].avgHighPrice !== 0 ||
                state.setsObj[key][0][0].avgLowPrice !== 0)
            ) {
              tempSetsObj[key][0] = state.setsObj[key][0][0];
            } else {
              tempSetsObj[key].invalid = true;
            }
          }

          let high_buys = 0,
            low_buys = 0;
          let i = 1;
          while (i in tempSetsObj[key]) {
            if (tempSetsObj[key][i].avgHighPrice === 0) {
              if (tempSetsObj[key][i].avgLowPrice === 0) {
                if (
                  key in state.setsObj &&
                  (state.setsObj[key][0][i].avgHighPrice !== 0 ||
                    state.setsObj[key][0][i].avgLowPrice !== 0)
                ) {
                  tempSetsObj[key][i] = state.setsObj[key][0][i];

                  if (tempSetsObj[key][i].avgLowPrice !== 0) {
                    high_buys += tempSetsObj[key][i].avgLowPrice;
                  } else {
                    high_buys += tempSetsObj[key][i].avgHighPrice;
                  }
                } else {
                  tempSetsObj[key].invalid = true;
                }
              } else {
                high_buys += tempSetsObj[key][i].avgLowPrice;
              }
            } else {
              high_buys += tempSetsObj[key][i].avgHighPrice;
            }
            low_buys += tempSetsObj[key][i].avgLowPrice;
            i += 1;
          }
          tempSetsObj[key].latest = tempSetsObj[key][1].latest; // can use any item for info
          tempSetsObj[key].high_buys = high_buys;
          tempSetsObj[key].low_buys = low_buys;
          tempSetsObj[key].tax = calculateTax(
            tempSetsObj[key][0].avgHighPrice > 0
              ? tempSetsObj[key][0].avgHighPrice
              : tempSetsObj[key][0].avgLowPrice
          );
          tempSetsObj[key].taxPieces = calculateTax(high_buys);
          tempSetsObj[key].difference =
            (tempSetsObj[key][0].avgHighPrice > 0
              ? tempSetsObj[key][0].avgHighPrice
              : tempSetsObj[key][0].avgLowPrice) - high_buys;
          newSetsObj[key] = [tempSetsObj[key]].concat(
            key in state.setsObj ? state.setsObj[key].slice(0, 6) : []
          );
        }
      }

      return Object.assign({}, state, {
        isFetching: false,
        isInvalid: false,
        timesUpdated:
          changed === true ? state.timesUpdated + 1 : state.timesUpdated,
        nightTimesUpdatedStart:
          action.logToggled === false
            ? state.timesUpdated
            : state.nightTimesUpdatedStart,
        itemsObj: newItemsObj,
        potsObj: newPotsObj,
        setsObj: newSetsObj,
        lastUpdated:
          changed === true
            ? [dateFormat(action.receivedAt, 'hh:MM:ss TT')].concat(
                state.lastUpdated.slice(0, 6)
              )
            : state.lastUpdated
      });
    case INVALIDATE_ITEMS:
      return Object.assign({}, state, {
        isInvalid: true
      });
    default:
      return state;
  }
}
