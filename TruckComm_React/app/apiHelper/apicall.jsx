import { View, Text } from 'react-native'
import React from 'react';
import * as SecureStore from 'expo-secure-store';


const  apicall = async (path, payload) => {
    const Web_Server = await SecureStore.getItemAsync('Web_Server');
    const Port = await SecureStore.getItemAsync('Port');
    const Auth_Token = await SecureStore.getItemAsync('Auth_Token');
    const Database_Server = await SecureStore.getItemAsync('Database_Server');
    const Database_Name = await SecureStore.getItemAsync('Database_Name');

    const User_ID = await SecureStore.getItemAsync('User_ID');
    const vehicle = await AsyncStorage.getItem('vehicleno');

    const API_URL = process.env.EXPO_PUBLIC_API_PROTOCOL + '://' 
        + Web_Server + ':' + Port
        + process.env.EXPO_PUBLIC_API_ROOT_PATH + path;

    const postRequest = async() => {
        const response =  await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            body: payload
        });

        const json = await response.json();
        if ((json[0]['access']).toLowerCase() == 'success') {
            return true;
        }
        return false;
    };
}
export default apicall;