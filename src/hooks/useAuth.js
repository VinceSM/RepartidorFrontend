import React, { useState, useEffect, createContext, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG, buildApiUrl } from '../config/config';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      const userData = await AsyncStorage.getItem('repartidorData');
      if (userData) {
        setUser(JSON.parse(userData));
      }
    } catch (error) {
      console.error('Error checking auth state:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      setLoading(true);
      
      console.log('🔐 Intentando login con:', email);
      console.log('🔗 URL:', buildApiUrl(API_CONFIG.ENDPOINTS.REPARTIDORES.LOGIN));

      const response = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.REPARTIDORES.LOGIN), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          password: password
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Credenciales inválidas');
      }

      const result = await response.json();
      console.log('✅ Login exitoso:', result);

      // Guardar datos del repartidor
      const repartidorData = {
        id: result.Repartidor?.idrepartidor,
        email: result.Repartidor?.email,
        nombreCompleto: result.Repartidor?.nombreCompleto,
        celular: result.Repartidor?.celular,
        vehiculo: result.Repartidor?.vehiculo,
        token: result.Token, // Si tu backend devuelve un token
        ...result.Repartidor
      };

      await AsyncStorage.setItem('repartidorData', JSON.stringify(repartidorData));
      setUser(repartidorData);
      
      return { success: true, data: repartidorData };
      
    } catch (error) {
      console.error('❌ Error en login:', error);
      let errorMessage = error.message;
      
      if (errorMessage.includes('Failed to fetch')) {
        errorMessage = 'No se pudo conectar con el servidor. Verifica tu conexión.';
      } else if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
        errorMessage = 'Credenciales inválidas';
      }
      
      return { 
        success: false, 
        error: errorMessage 
      };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.multiRemove(['repartidorData', 'userToken']);
      setUser(null);
      console.log('✅ Logout exitoso');
    } catch (error) {
      console.error('❌ Error al cerrar sesión:', error);
    }
  };

  const register = async (repartidorData) => {
    try {
      setLoading(true);
      
      console.log('📤 Registrando repartidor:', repartidorData);
      console.log('🔗 URL:', buildApiUrl(API_CONFIG.ENDPOINTS.REPARTIDORES.BASE));

      const response = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.REPARTIDORES.BASE), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(repartidorData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Error en el registro');
      }

      const result = await response.json();
      console.log('✅ Registro exitoso:', result);
      
      return { success: true, data: result };
      
    } catch (error) {
      console.error('❌ Error en registro:', error);
      let errorMessage = error.message;
      
      if (errorMessage.includes('email')) {
        errorMessage = 'Ya existe un repartidor con ese email';
      } else if (errorMessage.includes('dni')) {
        errorMessage = 'Ya existe un repartidor con ese DNI';
      } else if (errorMessage.includes('Failed to fetch')) {
        errorMessage = 'No se pudo conectar con el servidor. Verifica tu conexión.';
      }
      
      return { 
        success: false, 
        error: errorMessage 
      };
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    loading,
    login,
    logout,
    register,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
}