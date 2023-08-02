// @flow
import type { Dispatch } from '../reducers/types';
import fetch from 'cross-fetch';

export const TOGGLE_NIGHT = 'TOGGLE_NIGHT';

export function toggleLogging() {
  return {
    type: TOGGLE_NIGHT
  };
}