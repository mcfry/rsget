// @flow
import { combineReducers } from 'redux';
import { routerReducer as router } from 'react-router-redux';
import tracker from './tracker';
import navbar from './navbar';
import night from './night';

// Naming magic
const rootReducer = combineReducers({
  navbar,
  night,
  tracker,
  router
});

// function rootReducer(state = {}, action) {
// 	const nextState = combinedReducer(state, action);
// 	nextState.tracker = tracker(nextState.tracker, action, nextState.night);
// 	return nextState;
// }

export default rootReducer;
