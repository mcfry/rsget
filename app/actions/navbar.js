// @flow
import type { GetState, Dispatch } from '../reducers/types';
import storage from 'electron-json-storage';
import fs from 'fs';
import CryptoJS from 'crypto-js';
import { machineIdSync } from 'node-machine-id';

export const SEARCH_ITEMS = 'SEARCH_ITEMS';
export const SET_ACCESS = 'SET_ACCESS';

const MS_WEEKLY = 604800000;
const mid = machineIdSync({original: true});

export function searchItems(searchStr) {
	return function(dispatch, getState) {
		const { tabValue } = getState().tracker;
		dispatch(search(searchStr, tabValue));
	};
}

function search(searchStr, tabValue) {
	return {
		type: SEARCH_ITEMS,
		search: searchStr,
		tabValue: tabValue
	};
}

export function setAccess(hasAccess) {
	return {
		type: SET_ACCESS,
		access: hasAccess
	};
}

export function requestAccess() {
	return function(dispatch, getState) {
		storage.get('auth', (e, data) => {
			if (e) throw e;
			if (!('authId' in data)) {
				openTimeCert((found) => {
					if (found === true) {
						const decryptedTime = readTimeCert();
						const msString = (parseInt(new Date().getTime()) / MS_WEEKLY).toString();
						if (msString === decryptedTime) {
							data['authId'] = CryptoJS.AES.encrypt(decryptedTime, mid);
						} else {
							data['authId'] = CryptoJS.AES.encrypt('expired', mid);
						}
						storage.set('auth', data, (e) => {
							if (e) throw e;
						});
						dispatch(setAccess(msString === decryptedTime));
					} else {
						dispatch(setAccess(false));
					}
				});
			} else {
				openTimeCert((found) => {
					const decryptedTime = readTimeCert();
					const decryptedId = CryptoJS.AES.decrypt(data['authId'], mid);
					if (decryptedTime === decryptedId) {
						dispatch(setAccess(true));
					} else {
						dispatch(setAccess(false));
					}
				});
			}
		});
	}
}

function readTimeCert() {
	return CryptoJS.AES.decrypt(fs.readFileSync('../utils/timeCertificate.txt'), 'TIME_CERT');
}

function openTimeCert(callback) {
	if (fileExists('../utils/timeCertificate.txt')) {
		fs.open('../utils/timeCertificate.txt', 'r', (e, fd) => {
			if (e) throw e;
			callback(false);
		});
	} else {
		callback(true);
	}
}
		
function fileExists(path) {
  try  {
    return fs.statSync(path).isFile();
  }
  catch (e) {
    if (e.code == 'ENOENT') // Doesn't exist
      return false;

    console.log("Exception fs.statSync (" + path + "): " + e);
    throw e;
  }
}