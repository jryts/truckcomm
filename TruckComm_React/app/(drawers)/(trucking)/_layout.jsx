import { useEffect, useCallback, useContext, useState } from "react";
import { Stack } from "expo-router";
import { MD3LightTheme, useTheme } from 'react-native-paper';
import { I18n } from 'i18n-js';
import { LanguageContext } from '../../_layout';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import * as Application from 'expo-application';
import { useFocusEffect } from '@react-navigation/native';

export default function HomeLayout() {
    const theme = useTheme();
    const {language, setLanguage} = useContext(LanguageContext);
    const [driver, setDriver] = useState('');
    const [vehicle, setVehicle] = useState('');

    const translations = {
        en: { 
            task_detail: 'Task Detail',
            cargo_item: 'Cargo Item',
            chat: 'Chat',
            edms_file: 'EDMS File',
            pod: 'Proof of Delivery',
        },
        zh: { 
            task_detail: '任务详情',
            cargo_item: '货物清单',
            chat: '聊天',
            edms_file: 'EDMS文件',
            pod: '交货证明',
        },
    };
    const i18n = new I18n(translations);
    i18n.locale = language;

    const setLoginInfo = async () => {
        const Web_Server = await SecureStore.getItemAsync('Web_Server');
        const Port = await SecureStore.getItemAsync('Port');
        const Auth_Token = await SecureStore.getItemAsync('Auth_Token');
        const Database_Server = await SecureStore.getItemAsync('Database_Server');
        const Database_Name = await SecureStore.getItemAsync('Database_Name');
        const username = await SecureStore.getItemAsync('User_ID');
        const password = await SecureStore.getItemAsync('Password');

        const API_URL = process.env.EXPO_PUBLIC_API_PROTOCOL + '://' 
            + Web_Server + ':' + Port
            + process.env.EXPO_PUBLIC_API_ROOT_PATH + 'login';

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                "Auth_Token": Auth_Token,
                "Server_Name": Database_Server,
                "DB_Name": Database_Name,
                "User_Name": username,
                "Password": password,
                "Is_Mobile": "T",
                "APK_Version": Application.nativeApplicationVersion
            }),
        });
        
        const json = await response.json();
        console.log(json);
        if ((json[0]["access"]).toLowerCase() == "success") {
            await AsyncStorage.setItem('vehicleno', json[0]["vehicleno"]);
            setVehicle(json[0]["vehicleno"]);
        }
    }

    useEffect(() => {
        async function setup() {
            const driver = await SecureStore.getItemAsync('User_ID');
            const vehicle = await AsyncStorage.getItem('vehicleno');

            setDriver(driver);
            setVehicle(vehicle);
        }

        setup();
        
    }, []);

    useFocusEffect(
        useCallback(() => {
            setLoginInfo();
        }, [])
    );
    

	return (
        <Stack
            screenOptions={{
                headerStyle: {
                    backgroundColor: theme.dark ? theme.colors.background : theme.colors.primary,
                },
                headerTintColor: '#fff',
                headerTitleStyle: {
                    fontWeight: 'bold',
                },
                contentStyle: { backgroundColor: theme.colors.background },
            }}
        >
            <Stack.Screen 
                name="home"
                options={{ 
                    headerTitle: driver + " - " + vehicle,
                    headerShown: true
                }}	
            />
            <Stack.Screen 
                name="job-detail"
                options={{ 
                    headerTitle: i18n.t('task_detail')
                }}	
            />
            <Stack.Screen 
                name="item-detail"
                options={{ 
                    headerTitle: i18n.t('cargo_item')
                }}	
            />
            <Stack.Screen 
                name="chat"
                options={{ 
                    headerTitle: i18n.t('chat')
                }}	
            />
            <Stack.Screen 
                name="edms-file"
                options={{ 
                    headerTitle: i18n.t('edms_file')
                }}	
            />
            <Stack.Screen 
                name="pod"
                options={{ 
                    headerTitle: i18n.t('pod')
                }}	
            />
        </Stack>
	);
}
