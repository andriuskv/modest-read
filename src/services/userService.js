import { getResponse } from "../utils";

function fetchSessionUser() {
  return fetch("/api/users/me").then(getResponse);
}

function registerUser(data) {
  return fetch("/api/users", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
  }).then(getResponse);
}

function loginUser(data) {
  return fetch("/api/users/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
  }).then(getResponse);
}

function logoutUser() {
  return fetch("/api/users/logout").then(res => res.status);
}

export {
  fetchSessionUser,
  registerUser,
  loginUser,
  logoutUser
};
