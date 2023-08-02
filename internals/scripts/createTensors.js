import * as tf from '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-backend-webgl';

import fetch from 'cross-fetch';
import storage from 'electron-json-storage';
import _ from 'lodash';

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

timeseries: 5m,1h,6h and id
https://prices.runescape.wiki/api/v1/osrs/timeseries?timestep=5m&id=4151
#earliestrecord: {
  timestamp:
  avgHighPrice:
  avgLowPrice:
  highPriceVolume:
  lowPriceVolume:
}
*/

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

function getDayFromTimestamp(ts) {
  let date = new Date(ts * 1000); // ms
  return date.getDay();
}

function fetchItemSummary() {
  return fetch('https://www.osrsbox.com/osrsbox-db/items-complete.json')
    .then(res => {
      if (res.status >= 400) throw new Error("Couldn't get item summary");

      return res.json();
    })
    .then(
      itemsData => {
        itemsData['dateFetched'] = parseInt(new Date().getTime() / DAILY_MS);
        storage.set('summary', itemsData, e => {
          if (e) throw e;
        });

        return itemsData;
      },
      error => console.log('An error occurred.', error)
    );
}

function fetchTimeSeries(id, timeStep = '1h') {
  return fetch(
    `https://prices.runescape.wiki/api/v1/osrs/timeseries?timestep=${timeStep}&id=${id}`
  )
    .then(res => {
      if (res.status >= 400) throw new Error("Couldn't get time series data");

      return res.json();
    })
    .then(
      json => {
        const timeSeriesData = {};
        timeSeriesData[id] = json.data;

        return featureData;
      },
      error => console.log('An error occurred getting time series data', error)
    );
}

// Create Tensors
storage.get('summary', (e, summaryData) => {
  if (e) throw e;
  if (_.isEmpty(summaryData)) summaryData = fetchItemSummary();

  const tensorData = {};

  for (let key in summaryData) {
    if (key !== 'dateFetched' && summaryData[key].tradeable_on_ge === true) {
      let timeSeriesData = fetchTimeSeries(key);

      tensorData['features'][key] = {
        name: summaryData[key]['name'],
        equipable: summaryData[key]['equipable'],
        buy_limit: summaryData[key]['buy_limit'],
        release_date: summaryData[key]['release_date']
      };

      tensorData['timeSeries'][key] = timeSeriesData[key];
    }
  }

  storage.set(`tensorData`, tensorData, e => {
    if (e) throw e;
  });

  let trainLength = parseInt(tensorData['timeSeries'][key].length * 0.8);
  let testLength = tensorData['timeSeries'][key].length - trainLength;

  const trainTensors = {
    sizeMB: tf.tensor2d(trainData.sizeMB, [4, 1]),
    timeSec: tf.tensor2d(trainData.timeSec, [4, 1])
  };
});
