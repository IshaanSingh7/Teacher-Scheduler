import React, { createContext, useState, useEffect, useContext } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  const login = (userData, token) => {
    // Ensure userData includes first_name and last_name
    setUser({
      id: userData.id,
      email: userData.email,
      role: userData.role,
      first_name: userData.first_name,
      last_name: userData.last_name, 
    });
    setToken(token);
    localStorage.setItem('authToken', token);
    localStorage.setItem('user', JSON.stringify(userData));

    const decodedToken = JSON.parse(atob(token.split('.')[1]));
    const expiresIn = decodedToken.exp * 1000 - Date.now();

    setTimeout(logout, expiresIn);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  };

  useEffect(() => {
    const savedToken = localStorage.getItem('authToken');
    const savedUser = localStorage.getItem('user');
    if (savedToken && savedUser) {
      const decodedToken = JSON.parse(atob(savedToken.split('.')[1]));
      if (decodedToken.exp * 1000 > Date.now()) {
        setUser(JSON.parse(savedUser));
        setToken(savedToken);
      } else {
        logout();
      }
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);