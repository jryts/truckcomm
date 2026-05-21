import { createContext, useContext, useEffect, useState } from "react";
import { deleteItemAsync, getItemAsync, setItemAsync } from "expo-secure-store"
import { useAlert } from "./Alert";
import Loading from "../components/Loading";

const AUTH_API = "http://auth.freightmaster.com.sg:5757/datasnap/rest/TCloudServerMethod/AuthToken";

const AuthContext = createContext({
    loggedIn: false,
    logout: () => { },
    signIn: async (_userId, _password, _companyId) => false,
    fetchResource: async (_resource, _payload, _storageKeys) => []
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {

    const { dialog, toast } = useAlert();

    const [loading, setLoading] = useState(true);
    const [loggedIn, setLoggedIn] = useState(false);

    useEffect(() => {
        setLoading(true);
        getItemAsync("Auth_Token")
            .then(token => setLoggedIn(token !== null))
            .finally(() => setLoading(false));
    }, []);

    const logout = () => {
        deleteItemAsync("Auth_Token");
        deleteItemAsync("Auth_Expire");
        deleteItemAsync("Web_Server");
        deleteItemAsync("Port");
        deleteItemAsync("Database_Name");
        deleteItemAsync("Database_Server");
        deleteItemAsync("User_ID");
        deleteItemAsync("Password");
        deleteItemAsync("Company_ID");
        deleteItemAsync("Vehicle_No");

        setLoggedIn(false);
    };

    async function fetchResource(resource, payload, storageKeys = []) {

        const keys = ["Web_Server", "Port", "Auth_Token", "Auth_Expire", "Database_Server", "Database_Name", ...storageKeys];
        const [webServer, port, token, expire, server, db, ...values] = await Promise.all(keys.map(key => getItemAsync(key)));

        if (expire === null || Date.now() >= Date.parse(expire)) {
            setLoggedIn(false);
            return [{ access: "failed" }];
        }

        const url = `http://${webServer}:${port}/datasnap/rest/TServerMethods1/${resource}`;
        const init = payload && {
            method: "POST",
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "Auth_Token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpYXQiOjE3MTk0NjEwODMsImV4cCI6MTcxOTU0NzQ4MywiaXNzIjoiRGVscGhpIExpYnJhcnkiLCJ1c2VySUQiOiIiLCJpc2FkbWluIjp0cnVlfQ.RIi6xMx_jhJJHWuZERbEKt-QeCxtuh0BhXYl9-cOPM8",
                "Server_Name": server,
                "DB_Name": db,
                ...(typeof payload === "function" ? payload(values) : payload)
            })
        };
        
        const request = await fetch(url, init);
        const data = await request.json();

        const status = data[0];
        if (status["access"] === "failed") {
            console.error(status["msg"]);
            toast({ exception: status["msg"] });
        }

        return data;
    }

    async function signIn(userId, password, companyId) {
        try {
            const request = await fetch(AUTH_API, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    "User_ID": userId,
                    "Password": password,
                    "Company_ID": companyId,
                    "App_ID": "TRC"
                })
            });

            const [auth] = await request.json();

            if (auth["access"] === "Success") {
                await Promise.all([
                    setItemAsync("Auth_Token", auth["Auth_Token"]),
                    setItemAsync("Auth_Expire", auth["Auth_Expire"]),
                    setItemAsync("Web_Server", auth["Web_Server"]),
                    setItemAsync("Port", auth["Port"]),
                    setItemAsync("Database_Name", auth["Database_Name"]),
                    setItemAsync("Database_Server", auth["Database_Server"]),
                    setItemAsync("User_ID", userId),
                    setItemAsync("Password", password),
                    setItemAsync("Company_ID", companyId)
                ]);

                const [login] = await fetchResource("Login", {
                    "User_Name": userId,
                    "Password": password,
                    "Is_Mobile": "T",
                });

                if (login["access"] === "Success") {
                    await setItemAsync("Vehicle_No", login["vehicleno"]);
                    setLoggedIn(true);
                    return true;
                }
            }
            dialog({ titleKey: "alert_error", contentKey: "login_fail" });
            logout();
        } catch (exception) {
            toast({ exception });
            setLoggedIn(false);
        }
        return false;
    }

    return (
        <AuthContext.Provider value={{ loggedIn, signIn, logout, fetchResource }}>
            {loading ? <Loading /> : children}
        </AuthContext.Provider>
    );
};
