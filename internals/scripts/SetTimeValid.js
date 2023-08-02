// @flow
import { writeFile } from 'fs';
import CryptoJS from 'crypto-js';

const MS_WEEKLY = 604800000;

(function setTimeValid() {
  const msString = (parseInt(new Date().getTime()) / MS_WEEKLY).toString();
  writeFile('./app/utils/timeCertificate.txt', CryptoJS.AES.encrypt(msString, "TIME_CERT"), (e) => {
    if (e) throw e;
    console.log('The time certificate was created successfully.');
  });
})();
