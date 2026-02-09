import axios from 'axios';
const api = axios.create({
    baseURL : 'http://localhost:5000/api' ,
    timeout:10000
});

//Automatically attach authorization token to every request
api.interceptors.request.use((config)=>{
    const token = localStorage.getItem('token');

    if(token){
        config.headers.Authorization=`Bearer ${token}`;
    }
    return config;
});

//Handle errors globally
api.interceptors.response.use(
    (response)=>response,
    (error)=>{
        if(error.response?.status === 401){
            //Handle unauthorized access
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href='/login';   //redirect to login page   

        }
        return Promise.reject(error);
    });

    export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";


export default api;