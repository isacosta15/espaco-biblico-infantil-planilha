import { setAuthTokenGetter } from "@workspace/api-client-react";

const TOKEN_KEY = 'ebi_token';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeToken() {
  localStorage.removeItem(TOKEN_KEY);
}

// Register the token getter for api-client-react
setAuthTokenGetter(getToken);
