import { createContext, useState, useEffect, useContext } from "react";
import * as userService from "../services/userService";

const UserContext = createContext();

function UserProvider({ children }) {
  const [user, setUser] = useState({ loading: true });

  useEffect(() => {
    init();
  }, []);

  async function init() {
    try {
      const data = await userService.fetchSessionUser();

      if (data.code === 204) {
        setUser({});
      }
      else {
        delete data.code;
        setUser(data);
      }
    } catch (e) {
      console.log(e);
      setUser({});
    }
  }

  async function registerUser(user) {
    const data = await userService.registerUser(user);

    if (data.email) {
      setUser(data);
    }
    return data;
  }

  async function loginUser(user) {
    const data = await userService.loginUser(user);

    if (data.email) {
      setUser(data);
    }
    return data;
  }

  async function logoutUser() {
    const status = await userService.logoutUser();

    if (status === 204) {
      setUser({});
      return true;
    }
    return false;
  }

  return <UserContext.Provider value={{ user, registerUser, loginUser, logoutUser }}>{children}</UserContext.Provider>;
}

function useUser() {
  return useContext(UserContext);
}

export {
  UserProvider,
  useUser
};
