import axios from 'axios';

const BASE_URL = 'http://localhost:8000/api';

export const axiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
axiosInstance.interceptors.request.use(
  (config) => {
    // 可以在这里添加 token
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
axiosInstance.interceptors.response.use(
  (response) => {
    // 对响应数据做些什么
    return response.data;
  },
  (error) => {
    // 对响应错误做些什么
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);