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
      try {
        const parsedUser = JSON.parse(savedUser);
        // Validasi user data sebelum diset
        if (parsedUser && parsedUser.username && parsedUser.role) {
          setUser(parsedUser);
        } else {
          // Data tidak valid, hapus dari storage
          localStorage.removeItem('visitor_management_user');
        }
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem('visitor_management_user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    try {
      // Validasi input kosong
      if (!username.trim() || !password.trim()) {
        return { 
          success: false, 
          error: 'Username dan password harus diisi' 
        };
      }

      // ============================================
      // HAPUS SEMUA DATA DUMMY!
      // Tidak ada hardcoded credentials sama sekali
      // ============================================
      
      // Kembalikan error karena belum ada autentikasi yang dikonfigurasi
      return { 
        success: false, 
        error: 'Sistem autentikasi belum dikonfigurasi. Hubungi administrator.' 
      };

    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        error: 'Terjadi kesalahan saat login' 
      };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('visitor_management_user');
    // Hapus juga data aplikasi lainnya jika perlu
    localStorage.removeItem('visitor_management_data');
    localStorage.removeItem('tourism_locations');
  };

  // Fungsi untuk bypass login (hanya untuk development/testing)
  const bypassLogin = () => {
    // HANYA UNTUK DEVELOPMENT - JANGAN DIGUNAKAN DI PRODUKSI
    if (process.env.NODE_ENV === 'development') {
      const devUser = {
        id: Date.now(),
        username: 'dev_user',
        full_name: 'Development User',
        role: 'admin',
        email: 'dev@example.com',
        created_at: new Date().toISOString()
      };
      
      setUser(devUser);
      localStorage.setItem('visitor_management_user', JSON.stringify(devUser));
      
      return { 
        success: true, 
        user: devUser,
        message: '⚠️ DEVELOPMENT MODE: Login bypassed for testing' 
      };
    }
    
    return { 
      success: false, 
      error: 'Bypass login hanya tersedia di mode development' 
    };
  };

  const value = {
    user,
    login,
    bypassLogin, // Hanya untuk development
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