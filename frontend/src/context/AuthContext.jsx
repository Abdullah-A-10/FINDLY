//AuthContext
import { createContext , useState , useEffect } from "react";

export const AuthContext = createContext();

export function AuthProvider ({children}){
    const [user , setUser] = useState(null);

    useEffect(()=>{
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');

        if(token && userData){
            setUser(JSON.parse(userData));
        }
    },[]);

    const login = (userData , token)=>{
        localStorage.setItem('user' , JSON.stringify(userData));
        localStorage.setItem('token',token);

        setUser(userData);
    };

    const logout = ()=>{
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        
        setUser(null);
    };

    return(
        <AuthContext.Provider value={{user,login,logout}} >
            {children}
        </AuthContext.Provider>

    );
} 