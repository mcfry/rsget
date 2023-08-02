// @flow
import { SEARCH_ITEMS, SET_ACCESS } from '../actions/navbar';
import type { NavbarStateType, Action } from './types';

const initialState = {
	searchItemsStr: "",
	searchPotsStr: "",
	searchSetsStr: "",
	searchAlchStr: "",
	authorized: false
};

export default function navbar(state: NavbarStateType = initialState, action: Action): State {
  switch (action.type) {
    case SEARCH_ITEMS:
    	const newSearchVal = {}

    	if (action.tabValue === 0) {
    		newSearchVal['searchItemsStr'] = action.search
    	} else if (action.tabValue === 1) {
    		newSearchVal['searchPotsStr'] = action.search
 	   	} else if (action.tabValue === 2) {
    		newSearchVal['searchSetsStr'] = action.search
 	   	} else if (action.tabValue === 3) {
    		newSearchVal['searchAlchStr'] = action.search
 	   	}

		return Object.assign({}, state, newSearchVal);
	case SET_ACCESS:
		return Object.assign({}, state, {
			authorized: action.access
		});
    default:
      return state;
  }
}