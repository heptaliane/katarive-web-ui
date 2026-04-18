import { createContext, useContext, type ReactNode } from "react";
import { client as defaultClient } from "./client";

const ClientContext = createContext<any>(defaultClient);

export const useClient = () => useContext(ClientContext);

export const ClientProvider = ({ children, client }: { children: ReactNode, client?: any }) => (
  <ClientContext.Provider value={client || defaultClient}>{children}</ClientContext.Provider>
);
