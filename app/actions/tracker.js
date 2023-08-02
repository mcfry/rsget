// @flow
import type { Dispatch } from '../reducers/types';

import fetch from 'cross-fetch';
import storage from 'electron-json-storage';

export const SET_TAB_VALUE = 'SET_TAB_VALUE';
export const REQUEST_ITEMS = 'REQUEST_ITEMS';
export const RECEIVE_ITEMS = 'RECEIVE_ITEMS';
export const INVALIDATE_ITEMS = 'INVALIDATE_ITEMS';

const DAILY_MS = 86400000;

let rLiteHeaders = new Headers({
    "Accept"       : "application/json",
    "Content-Type" : "application/json",
    "User-Agent"   : "market_analysis"
});

export function setTabValue(tabValue) {
  return {
    type: SET_TAB_VALUE,
    tabValue: tabValue
  }
}

function requestItems() {
  return {
    type: REQUEST_ITEMS
  };
}

function receiveItems(json, nightToggled, summary) {
  return {
    type: RECEIVE_ITEMS,
    items: json,
    summary: summary,
    logToggled: nightToggled,
    receivedAt: Date.now()
  };
}

export function invalidateItems() {
  return {
    type: INVALIDATE_ITEMS
  };
}

/* 
OSBUDDY API:
ITEM
id: {
  id:
  name:
  members:
  buy_average:
  buy_quantity:
  sell_average:
  sell_quantity:
}

In-game RuneLite API data:
https://api.runelite.net/runelite-1.8.3/item/prices.js
{
  id:
  name:
  price: (not useful)
  wikiPrice: (price shown in game)
}

RuneLite API:
https://prices.runescape.wiki/api/v1/osrs/5m
id: {
  avgHighPrice:
  highPriceVolume:
  avgLowPrice:
  lowPriceVolume:
}

https://prices.runescape.wiki/api/v1/osrs/latest

id: {
  high:
  highTime:
  low:
  lowTime:
}

RS API:
base_url = http://services.runescape.com/m=itemdb_oldschool

item_info: /api/catalogue/detail.json?item=itemId
{
  icon:
  icon_large:
  id:
  type:
  typeIcon:
  name:
  description:
  current: {
    trend: (nuetral, negative, positive)
    price:
  }
  members:
  day30: {
    trend: (nuetral, negative, positive)
    change:
  }
  day90: {
    trend: (nuetral, negative, positive)
    change:
  }
  day180: {
    trend: (nuetral, negative, positive)
    change:
  }

}

daily price histroy: /api/graph/itemID.json
{
  daily: {
    "epochmsstr": price
  }
}
*/

// OSBUDDY
// export function fetchItems() {
//   // Thunk middleware passes the dispatch method as an argument to the function
//   return function (dispatch, getState) {
//     dispatch(requestItems());
//     const { night } = getState();

//     fetch("https://storage.googleapis.com/osb-exchange/summary.json")
//       .then(
//         response => response.json(),

//         // Do not use catch
//         error => console.log('An error occurred.', error)
//       )
//       .then(json => {
//         // Note: sending summary as an action is a memory leak in dev mode because it's so large
//         storage.get('itemSummary', (e, data) => {
//           if (e) throw e;
//           if (!('summary' in data)) {
//             fetchItemSummary().then(res => 
//               dispatch(receiveItems(json, night.toggled, res))
//             );
//           } else {
//             const dailyMs = parseInt(new Date().getTime() / DAILY_MS);
//             if (dailyMs !== data['dateFetched']) {
//               fetchItemSummary().then(res => 
//                 dispatch(receiveItems(json, night.toggled, res))
//               );
//             } else {
//               // We can dispatch many times!
//               dispatch(receiveItems(json, night.toggled, data));
//             }
//           }
//         });
//       });
//   };
// }

// -- OLD NO LONGER AVAILABLE - CAN BUILD MANUALLY THOUGH BY USING SCRIPTS ON GITHUB
// -- IF USING THIS DATA, MUST INSURE THAT ITEMS ARE TRADEABLE ON GE
// https://www.osrsbox.com/osrsbox-db/items-complete.json
// example:
// id 0
// name "Dwarf remains"
// members  true
// tradeable  false
// tradeable_on_ge  false
// stackable  false
// noted  false
// noteable false
// linked_id  null
// placeholder  false
// equipable  false
// equipable_by_player  false
// cost 1
// lowalch  0
// highalch 0
// weight 0
// buy_limit  null
// quest_item true
// release_date "27 May 2003"
// examine  "The body of a Dwarf savaged by Goblins."
// url  "https://oldschool.runescape.wiki/w/Dwarf_remains"

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

function fetchItemSummary() {
  return fetch("https://prices.runescape.wiki/api/v1/osrs/mapping")
    .then(res => {
      if (res.status >= 400)
          throw new Error('Couldn\'t get item summary');

      return res.json();
    })
    .then(itemsData => {
      //console.log(storage.getDefaultDataPath());
      // Use IDs as keys
      const nextItems = {}
      for (let key in itemsData) {
        nextItems[itemsData[key].id] = itemsData[key];
      }

      nextItems['dateFetched'] = parseInt(new Date().getTime() / DAILY_MS);

      storage.set('summary', nextItems, (e) => {
        if (e) throw e;
      });

      return itemsData;
    }, error => console.log('An error occurred.', error));
}

export function fetchItems() {
  // Thunk middleware passes the dispatch method as an argument to the function
  return function (dispatch, getState) {
    dispatch(requestItems());
    const { night } = getState();

    fetch("https://prices.runescape.wiki/api/v1/osrs/5m", rLiteHeaders)
      .then(
        response => response.json(),

        // Do not use catch
        error => console.log('An error occurred.', error)
      )
      .then(json => {
        json = json.data

        // Note: sending summary as an action is a memory leak in dev mode because it's so large
        storage.get('summary', (e, data) => {
          if (e) throw e;
          if (Object.keys(data).length === 0) {
            // Fetch it and set
            fetchItemSummary().then(res => 
              dispatch(receiveItems(json, night.toggled, res))
            );
          } else {
            const dailyMs = parseInt(new Date().getTime() / DAILY_MS);
            if (dailyMs !== data['dateFetched']) {
              // If dates don't match, fetch and set
              fetchItemSummary().then(res => 
                dispatch(receiveItems(json, night.toggled, res))
              );
            } else {
              // We can just dispatch it, we have the data
              dispatch(receiveItems(json, night.toggled, data));
            }
          }
        });
      });
  };
}

export function fetchItemsLatest() {
  // Thunk middleware passes the dispatch method as an argument to the function
  return function (dispatch, getState) {
    dispatch(requestItems());
    const { night } = getState();

    fetch("https://prices.runescape.wiki/api/v1/osrs/latest", rLiteHeaders)
      .then(
        response => response.json(),

        // Do not use catch
        error => console.log('An error occurred.', error)
      )
      .then(json => {
        json = json.data
        for (let key in json) {
          json[key]['avgHighPrice'] = json[key].high
          json[key]['avgLowPrice'] = json[key].low
        }

        // // Note: sending summary as an action is a memory leak in dev mode because it's so large
        // storage.get('summary', (e, data) => {
        //   if (e) throw e;
        //   if (!('summary' in data)) {
        //     fetchItemSummary().then(res => 
        //       dispatch(receiveItems(json, night.toggled, res))
        //     );
        //   } else {
        //     const dailyMs = parseInt(new Date().getTime() / DAILY_MS);
        //     if (dailyMs !== data['dateFetched']) {
        //       fetchItemSummary().then(res => 
        //         dispatch(receiveItems(json, night.toggled, res))
        //       );
        //     } else {
        //       // We can dispatch many times!
        //       dispatch(receiveItems(json, night.toggled, data));
        //     }
        //   }
        // });

        // Note: sending summary as an action is a memory leak in dev mode because it's so large
        storage.get('summary', (e, data) => {
          if (e) throw e;
          if (Object.keys(data).length === 0) {
            // Fetch it and set
            fetchItemSummary().then(res => 
              dispatch(receiveItems(json, night.toggled, res))
            );
          } else {
            const dailyMs = parseInt(new Date().getTime() / DAILY_MS);
            if (dailyMs !== data['dateFetched']) {
              // If dates don't match, fetch and set
              fetchItemSummary().then(res => 
                dispatch(receiveItems(json, night.toggled, res))
              );
            } else {
              // We can just dispatch it, we have the data
              dispatch(receiveItems(json, night.toggled, data));
            }
          }
        });
      });
  };
}