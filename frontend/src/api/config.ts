import axios, { type AxiosInstance } from 'axios';

const apiClient: AxiosInstance = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
});

// Add basic content-type header
apiClient.defaults.headers.common['Content-Type'] = 'application/json';

export default apiClient;
