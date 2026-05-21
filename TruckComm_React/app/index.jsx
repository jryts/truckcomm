import { useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { useRouter } from 'expo-router';
import messaging from '@react-native-firebase/messaging';

export default function Index() {
    const router = useRouter();

    const refreshToken = async () => {
        try {
            const username = await SecureStore.getItemAsync('User_ID');
            const password = await SecureStore.getItemAsync('Password');
            const companyID = await SecureStore.getItemAsync('Company_ID');
    
            const response = await fetch(process.env.EXPO_PUBLIC_AUTH_URL, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    "User_ID": username,
                    "Password": password,
                    "Company_ID": companyID,
                    "App_ID": process.env.EXPO_PUBLIC_APP_ID
                }),
            });
            
            const json = await response.json();
            
            if ((json[0]["access"]).toLowerCase() == "success") {
                await SecureStore.setItemAsync('Auth_Token', json[0]["Auth_Token"]);
                return true;
            } else {
                return false;
            }
        } catch {
            return false;
        }
    };

    const verifyLogin = async () => {
        const Auth_Token = await SecureStore.getItemAsync('Auth_Token');
        const department = await AsyncStorage.getItem('department');

        if (Auth_Token) {
            await refreshToken();

            if (department == 'Trucking') {
                router.replace('/(drawers)/(trucking)/home');
            } else if (department == 'Haulage') {
                router.replace('/(drawers)/(haulage)/home');  
            } 
        } else {
            router.replace('/login');
        }
    }

    useEffect(() => {
        verifyLogin();
    }, []);

    return (
        <>
        </>
    );
}
