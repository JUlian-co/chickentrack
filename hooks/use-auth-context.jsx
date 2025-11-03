import { createContext, useContext } from "react";

export const AuthContext = createContext({
  session: undefined,
  profile: undefined,
  isLoading: true,
  isLoggedIn: false,
});

export const useAuthContext = () => useContext(AuthContext);
