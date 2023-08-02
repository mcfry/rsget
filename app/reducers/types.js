import type { Dispatch as ReduxDispatch, Store as ReduxStore } from 'redux';

// split this out
export type Action = {
  +type: string,
  +items?: Object,
  +receivedAt?: number,
  +search?: string,
  +logToggled?: boolean,
  +access?: boolean,
  +summary?: Object,
  +tabValue?: number
  // +isLoggedIn: boolean,
  // +requestRegistration: boolean
};

export type trackerStateType = {
  +isFetching: boolean,
  +isInvalid: boolean,
  +timesUpdated: number,
  +nightTimesUpdatedStart: number,
  +itemsObj: ?Object,
  +potsObj: ?Object,
  +setsObj: ?Object,
  +tabValue: number
};

export type navbarStateType = {
  +searchItemsStr: string,
  +searchPotsStr: string,
  +searchSetsStr: string,
  +searchAlchStr: string,
  +authorized: boolean
};

export type nightStateType = {
  +toggled: boolean
};

export type State = {
  tracker: trackerStateType,
  navbar: navbarStateType,
  night: nightStateType
};

export type GetState = () => State;
export type Dispatch = ReduxDispatch<Action>;
export type Store = ReduxStore<GetState, Action>;
