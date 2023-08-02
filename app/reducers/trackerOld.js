// @flow
import { REQUEST_ITEMS, RECEIVE_ITEMS, INVALIDATE_ITEMS } from '../actions/tracker';
import { potGroups, setGroups } from '../constants/groups';
import type { Action } from './types';

import dateFormat from 'dateFormat';
import storage from 'electron-json-storage';

// https://www.robinwieruch.de/the-soundcloud-client-in-react-redux-flow/

type State = {
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
	isFetching: false,
	isInvalid: false,
	timesUpdated: 0,
	nightTimesUpdatedStart: 0,
	itemsObj: {},
	potsObj: {},
	setsObj: {},
	lastUpdated: []
}

function difference(a1, a2) {
  var result = [];
  for (var i = 0; i < a1.length; i++) {
    if (a2.indexOf(a1[i]) === -1) {
      result.push(a1[i]);
    }
  }
  return result;
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

export default function tracker(state: State = initialState, action: Action) {
	switch (action.type) {
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
						// Use high val because sometimes we adjust the low value if none are sold
						let highVal = Math.max(action.items[key].sell_average, action.items[key].buy_average)
						if (highVal !== state.itemsObj[key][0].buy_average 
								&& highVal !== state.itemsObj[key][0].sell_average) {
							changed = true;
							break;
						}
					}
				}
			}

			if (changed === true) {
				let diffs = difference(Object.keys(action.items), Object.keys(state.itemsObj));
				let diffs2 = difference(Object.keys(action.items), Object.keys(action.summary));
				let tempPotsObj = {};
				let tempSetsObj = {};

				if (action.logToggled === true) {
					storage.get('nightReport', (e, data) => {
						if (e) throw e;
						if (!('immediateReport' in data)) {
							data['immediateReport'] = {};
							data['immediateReport']['startTime'] = dateFormat(new Date(), "mmmm dS, yyyy, h:MM:ss TT");
						}

						let dir = data['immediateReport'];
						for (let key in action.items) {
							let item = action.items[key];
							if (key in dir) {
								if (item.buy_average > item.sell_average) {
									if (dir[key].buy_average > item.sell_average) {
										dir[key].buy_average = item.sell_average;
										dir[key].buy_quantity = item.sell_quantity;
									}

									if (dir[key].sell_average < item.buy_average) {
										dir[key].sell_average = item.buy_average;
										dir[key].sell_quantity = item.buy_quantity;
									}
								} else {
									if (dir[key].buy_average > item.buy_average) {
										dir[key].buy_average = item.buy_average;
										dir[key].buy_quantity = item.buy_quantity;
									}

									if (dir[key].sell_average < item.sell_average) {
										dir[key].sell_average = item.sell_average;
										dir[key].sell_quantity = item.sell_quantity;
									}
								}
							} else {
								dir[key] = item;
							}
						}

						data['immediateReport'] = dir;
						storage.set('nightReport', data, (e2) => {
							if (e2) console.log(e2);
						});
					});
				}

				for (let key in action.summary) {
					if (key !== 'dateFetched' && action.summary[key].tradeable_on_ge === true) {
						let item = {};
						if (action.items[key]) {
							item = action.items[key];
							item['highalch'] = action.summary[key]['highalch'];
						} else if (key in diffs) {
							// Duplicate last entry if already exists and not found again
							item = state.itemsObj[key][0];
						} else {
							item['id'] = action.summary[key]['id'];
							item['name'] = action.summary[key]['name'];
							item['highalch'] = action.summary[key]['highalch'];
							for (let key of ['buy_average', 'sell_average', 'buy_quantity', 'sell_quantity']) {
								item[key] = 0;
							}
						}

						if (item.buy_average > item.sell_average) {
							let temp = item.buy_average;
							item.buy_average = item.sell_average;
							item.sell_average = temp;

							temp = item.buy_quantity;
							item.buy_quantity = item.sell_quantity;
							item.sell_quantity = temp;
						}

						// If only one item bought/sold, then just list the price as both buy and sell
						if (item.buy_quantity === 0) {
							item.buy_quantity = item.sell_quantity;
							item.buy_average = item.sell_average;
						}

						// Set the alch difference
						item['highalch_difference'] = item['highalch'] - item.sell_average;

						if (key in potGroups) {
							let newKey = potGroups[key][0];
							let newIndex = potGroups[key][1];
							if (newKey in tempPotsObj) {
								tempPotsObj[newKey]['pots'][newIndex] = item;

								let pot3 = tempPotsObj[newKey]['pots'][0];
								let pot4 = tempPotsObj[newKey]['pots'][1];
								tempPotsObj[newKey].key = newKey;
								tempPotsObj[newKey].difference = pot4.sell_average - parseInt(pot3.sell_average/3*4);
								tempPotsObj[newKey].name = pot3.name.slice(0, -3);
								tempPotsObj[newKey].buy_quant3 = pot3.buy_quantity;
								tempPotsObj[newKey].sell_quant4 = pot4.buy_quantity;
								newPotsObj[newKey] = [tempPotsObj[newKey]].concat(newKey in state.potsObj ? state.potsObj[newKey].slice(0, 3) : []);
							} else {
								let newObj = {};
								newObj['pots'] = {};
								newObj['pots'][newIndex] = item;
								tempPotsObj[newKey] = newObj;
							}
						} else if (key in setGroups) {
							let setKeysArr = Array.isArray(setGroups[key][0]) ? setGroups[key] : [setGroups[key]];
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
						newItemsObj[key] = [item].concat(key in state.itemsObj ? state.itemsObj[key].slice(0, 3) : []);
					}
				}

				for (let key of diffs2) {
					let item = action.items[key];
					item['highalch'] = 0;
					item['highalch_difference'] = 0;

					if (item.buy_average > item.sell_average) {
						let temp = item.buy_average;
						item.buy_average = item.sell_average;
						item.sell_average = temp;

						temp = item.buy_quantity;
						item.buy_quantity = item.sell_quantity;
						item.sell_quantity = temp;
					}

					// If only one item bought/sold, then just list the price as both buy and sell
					if (item.buy_quantity === 0) {
						item.buy_quantity = item.sell_quantity;
						item.buy_average = item.sell_average;
					}

					newItemsObj[key] = [item].concat(key in state.itemsObj ? state.itemsObj[key].slice(0, 3) : []);
				}

				for (let key in tempSetsObj) {
					tempSetsObj[key].key = key;
					tempSetsObj[key].name = tempSetsObj[key][0].name;
					tempSetsObj[key].invalid = false;
					if (tempSetsObj[key][0].sell_average === 0 && tempSetsObj[key][0].buy_average === 0) {
						tempSetsObj[key].invalid = true;
					}

					let high_buys = 0, low_buys = 0;
					let i=1; while (i in tempSetsObj[key]) {
						if (tempSetsObj[key][i].sell_average === 0) {
							if (tempSetsObj[key][i].buy_average === 0) {
								tempSetsObj[key].invalid = true;
							} else {
								high_buys += tempSetsObj[key][i].buy_average;
							}
						} else {
							high_buys += tempSetsObj[key][i].sell_average;
						}
						low_buys += tempSetsObj[key][i].buy_average;
						i += 1;
					}
					tempSetsObj[key].high_buys = high_buys;
					tempSetsObj[key].low_buys = low_buys;
					tempSetsObj[key].difference = (tempSetsObj[key][0].sell_average > 0 ? tempSetsObj[key][0].sell_average : tempSetsObj[key][0].buy_average) - high_buys;
					newSetsObj[key] = [tempSetsObj[key]].concat(key in state.setsObj ? state.setsObj[key].slice(0, 3) : []);
				}
			}

			return Object.assign({}, state, {
				isFetching: false,
				isInvalid: false,
				timesUpdated: changed === true ? state.timesUpdated + 1 : state.timesUpdated,
				nightTimesUpdatedStart: action.logToggled === false ? state.timesUpdated : state.nightTimesUpdatedStart,
				itemsObj: newItemsObj,
				potsObj: newPotsObj,
				setsObj: newSetsObj,
				lastUpdated: changed === true ? [dateFormat(action.receivedAt, "hh:MM:ss TT")].concat(state.lastUpdated.slice(0, 3)) : state.lastUpdated, 
			});
		case INVALIDATE_ITEMS:
			return Object.assign({}, state, {
				isInvalid: true
			});
		default:
			return state;
	}
}