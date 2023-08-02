// @flow
import { TOGGLE_NIGHT, RETRIEVE_LAST_LOG } from '../actions/night';
import type { Action } from './types';

import storage from 'electron-json-storage';

type State = {
	toggled: boolean
};

const initialState = {
	toggled: false,
}

export default function night(state: State = initialState, action: Action): State {
  switch (action.type) {
    case TOGGLE_NIGHT:
      if (!state.toggled) {
        storage.get('nightReport', (e, data) => {
          if (e) return state;
          if ('immediateReport' in data) {
            data['oldReport'] = data['immediateReport'];
            delete data['immediateReport'];
            storage.set('nightReport', data, (e2) => {
              if (e2) console.log(e2);
            });
          }
        });
      }

      return Object.assign({}, state, {
        toggled: !state.toggled
      });
    default:
      return state;
  }
}