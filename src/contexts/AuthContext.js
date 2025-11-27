import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in from localStorage
    const savedUser = localStorage.getItem('visitor_management_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    try {
      // Demo authentication - replace with real API call
      const users = {
        'admin': { id: 1, username: 'admin', full_name: 'Administrator', role: 'admin', password: 'admin123' },
        'operator': { id: 2, username: 'operator', full_name: 'Operator UPTD', role: 'uptd_head', password: 'operator123' }
      };

      const user = users[username];
      
      if (user && user.password === password) {
        const { password: _, ...userWithoutPassword } = user;
        setUser(userWithoutPassword);
        localStorage.setItem('visitor_management_user', JSON.stringify(userWithoutPassword));
        return { success: true, user: userWithoutPassword };
      } else {
        return { success: false, error: 'Username atau password salah' };
      }
    } catch (error) {
      return { success: false, error: 'Terjadi kesalahan saat login' };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('visitor_management_user');
  };

  const value = {
    user,
    login,
    logout,
    loading,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};