//import fetch from 'cross-fetch';
//let stripe = Stripe('pk_test_1nc5H1dWSnhxK89o9xHXF4AT'); // Global object

// export const REQUEST_LOGIN = 'REQUEST_LOGIN_LOGOUT';
// export const RECEIVE_LOGIN = 'RECEIVE_LOGIN_LOGOUT';

// function requestLoginLogout() {
//   return {
//     type: REQUEST_LOGIN_LOGOUT
//   };
// }

// function receiveLoginLogout(status, shouldRegister) {
//   return {
//     type: RECEIVE_LOGIN_LOGOUT,
//     isLoggedIn: status,
//     shouldRegister: shouldRegister
//   };
// }

//
// Thunk Callbacks (Thunk middleware passes the dispatch method as an argument to the function)
////

// export function login(username = null, password = null) {
//   if (username && password) {
//     return function(dispatch) {
//       storage.get('auth', (error, data) => {
//         // New
//         if (error) {
//           dispatch(requestLoginLogout());
//           return fetch("ec2-34-238-153-192.compute-1.amazonaws.com:3000/api/v1/users/sign_in", {
//             method: 'POST',
//             data: {
//               email: email,
//               password: password
//             },
//             headers: {
//               'Content-Type': 'application/json'
//             }
//           })
//           .then(
//             response => {
//               let json = response.json();
//               console.log(json);
//               storage.set('auth', json.data, (error) => {
//                 if (error) {
//                   console.log('An error occurred setting auth.', error);
//                   dispatch(receiveLoginLogout(false));
//                 } else {
//                   dispatch(receiveLoginLogout(true));
//                 }
//               });
//             },
//             error => {
//               console.log('An error occurred.', error);

//               storage.remove('auth');
//               dispatch(receiveLoginLogout(false));
//             }
//           );
//         // Old
//         } else {
//           // Attempt from storage
//           return loginFromStorageInternal(dispatch, data);
//         }
//       });
//     };
//   } else {
//     return logoutInternal(dispatch);
//   }
// }

// export function logout() {
//   return logoutInternal(dispatch);
// }

// //
// // Private
// ////

// function loginFromStorageInternal(dispatch, options) {
//   if (typeof(options.email) === 'undefined' || typeof(options.auth_token) === 'undefined') {
//     return fetch("ec2-34-238-153-192.compute-1.amazonaws.com:3000/api/v1/users/validate_token", {
//       method: 'get',
//       headers: {
//         'Content-Type': 'application/json',
//         'X-User-Email': options.email,
//         'X-User-Token': options.auth_token
//       }
//     })
//     .then(
//       response => {
//         // Do nothing, email and token are valid so leave them
//         dispatch(receiveLoginLogout(true));
//       },
//       error => {
//         console.log('An error occurred.', error);

//         storage.remove('auth', (error) => {
//           if (error) {
//             console.log('An error occurred removing auth.', error);
//           }

//           dispatch(receiveLoginLogout(false));
//         });
//       }
//     );
//   } else {
//     dispatch(receiveLoginLogout(false));

//     // Don't have to return promise, but good practice
//     return Promise.resolve();
//   }
// }

// function logoutInternal(dispatch) {
//   storage.get('auth', (error, data) => {
//     if (error) {
//       console.log('An error occurred getting auth.', error);
//       dispatch(receiveLoginLogout(false));

//       return Promise.resolve();
//     } else if (typeof(data.email) === 'undefined' || typeof(data.auth_token) === 'undefined') {
//       console.log('No auth object to logout.');
//       dispatch(receiveLoginLogout(false));

//       return Promise.resolve();
//     } else {
//       return fetch("ec2-34-238-153-192.compute-1.amazonaws.com:3000/api/v1/users/sign_out", {
//         method: 'delete',
//         headers: {
//           'Content-Type': 'application/json',
//           'X-User-Email': data.email,
//           'X-User-Token': data.authentication_token
//         }
//       })
//       .then(
//         response => {
//           storage.remove('auth', (error) => {
//             if (error) {
//               console.log('An error occurred removing auth.', error);
//             }

//             dispatch(receiveLoginLogout(false));
//           });
//         },
//         error => {
//           console.log('An error occurred.', error);
//           dispatch(receiveLoginLogout(false));
//         }
//       );
//     }
//   });
// }