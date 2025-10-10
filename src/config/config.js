// Para desarrollo sin react-native-config, puedes usar esto temporalmente:
export const API_CONFIG = {
  BASE_URL: 'http://localhost:5189', // Cambia esto por tu URL
  ENDPOINTS: {
    REPARTIDORES: {
      BASE: '/api/Repartidores',
      LOGIN: '/api/Repartidores/login',
      LIBRES: '/api/Repartidores/libres'
    },
  }
};

export const buildApiUrl = (endpoint) => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};