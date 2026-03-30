import { useContext } from "react";
import { AuthContext, AuthUser } from "../contexts/AuthContext";

export const useAuth = () => {
  const authContext = useContext(AuthContext);
  return authContext;
};

export type { AuthUser };