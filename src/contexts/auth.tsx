import { createContext, ReactNode, useEffect, useState } from "react";
import { api } from "../services/api";

interface User{
  id: string;
  name: string;
  login: string;
  avatar_url: string;
}

interface AuthContextData{
  user: User | null;
   signInUrl: string;
  signOut(): void;
}


export const AuthContext = createContext({} as AuthContextData)

interface AuthProvider{
  children: ReactNode;
}


type AuthResponse = {
  token: string;
  user: {
    id: string;
    avatar_url: string;
    name: string;
    login: string;
  }
}

export const AuthProvider = ({children}: AuthProvider) => {
  const [user, setUser] = useState<User| null>(null)

  const signInUrl = `https://github.com/login/oauth/authorize?scope=user&client_id=bdc89db31f643fe2ab1f`

  async function signIn(githubCode: string) {
    const response = await api.post<AuthResponse>('/authenticate', {
      code: githubCode,
    })

    const { token, user } = response.data;

    localStorage.setItem('@dowhile:token', token);
    api.defaults.headers.common.authorization = `Bearer ${token}`;
    
    setUser(user);
  }

  function signOut() {
    setUser(null);
    localStorage.removeItem('@dowhile:token');
  }

  useEffect(() => {
    const token = localStorage.getItem('@dowhile:token');

    if(token){
      api.defaults.headers.common.authorization = `Bearer ${token}`;

      api.get<User>('profile').then(response => {
        setUser(response.data);
      })
    }
  })

  useEffect(() => {
    const url = window.location.href;
    const hasGithubCode = url.includes('?code=');

    if(hasGithubCode){
      const [urlWithoutCode, githubCode] = url.split('?code=');

      window.history.pushState({}, '', urlWithoutCode);
      signIn(githubCode);

    }

  },[])

  return(
    <AuthContext.Provider value={{user, signInUrl, signOut}}>
      {children}
    </AuthContext.Provider>
  )

}