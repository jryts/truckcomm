import { useEffect, useState, useCallback, useContext } from "react";
import { View, StyleSheet, Platform, Image } from "react-native";
import { Icon } from "react-native-paper";
import { GiftedChat, Send } from 'react-native-gifted-chat';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { useLocalSearchParams } from "expo-router";
import messaging from '@react-native-firebase/messaging';
import moment from 'moment-timezone';
import { I18n } from 'i18n-js';
import { LanguageContext } from '../../_layout';
import { KeyboardAwareScrollView, KeyboardToolbar } from 'react-native-keyboard-controller';

export default function chat() {
    const {language, setLanguage} = useContext(LanguageContext);

    const translations = {
        en: { 
            type_message: 'Type a message...',
        },
        zh: { 
            type_message: '输入消息...',
        },
    };
    const i18n = new I18n(translations);
    i18n.locale = language;

    const paramItem = useLocalSearchParams();

    const [userID, setUserID] = useState('');
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
 
    const getMessages = async () => {
        try {
            setLoading(true);

            const username = await SecureStore.getItemAsync('User_ID');
            setUserID(username);

            const Web_Server = await SecureStore.getItemAsync('Web_Server');
            const Port = await SecureStore.getItemAsync('Port');
            const Auth_Token = await SecureStore.getItemAsync('Auth_Token');
            const Database_Server = await SecureStore.getItemAsync('Database_Server');
            const Database_Name = await SecureStore.getItemAsync('Database_Name');
            
         
            const API_URL = process.env.EXPO_PUBLIC_API_PROTOCOL + '://' 
                + Web_Server + ':' + Port
                + process.env.EXPO_PUBLIC_API_ROOT_PATH + 'GetComment';
           
            console.log(JSON.stringify({
                "Auth_Token": Auth_Token,
                "Server_Name": Database_Server,
                "DB_Name": Database_Name,
                "Task_ID": paramItem.Task_ID,
            }));

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
                    "Task_ID": paramItem.Task_ID,
                }),
            });

            let json = await response.json();
            
            if ((json[0]["access"]).toLowerCase() == "success") {
                json = json.slice(1);

                for (let i = 0; i < json.length; i++) {
                    setMessages(previousMessages =>
                        GiftedChat.append(previousMessages, {
                            _id: json[i].Comment_ID,
                            text: json[i].Description,
                            createdAt: new Date(json[i].Added_DateTime),
                            user: {
                                _id: json[i].User_ID == username ? username : 'planner',
                                name: json[i].User_ID == username ? username : 'planner',
                            },
                        }),                       
                    );
                }
            }
        } finally {
            setLoading(false);
        }
    };

    const readMessages = async () => {
        const Web_Server = await SecureStore.getItemAsync('Web_Server');
        const Port = await SecureStore.getItemAsync('Port');
        const Auth_Token = await SecureStore.getItemAsync('Auth_Token');
        const Database_Server = await SecureStore.getItemAsync('Database_Server');
        const Database_Name = await SecureStore.getItemAsync('Database_Name');
        
        const API_URL = process.env.EXPO_PUBLIC_API_PROTOCOL + '://' 
            + Web_Server + ':' + Port
            + process.env.EXPO_PUBLIC_API_ROOT_PATH + 'MarkedCommentAsOpened';

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
                "Task_ID": paramItem.Task_ID,
            }),
        });

        let json = await response.json();
    }

    useEffect(() => {
        getMessages();
        readMessages();
        
		const unsubscribe = messaging().onMessage(async remoteMessage => {
            console.log(remoteMessage);
            if (remoteMessage.data.TaskID == paramItem.Task_ID) {
                setMessages(previousMessages =>
                    GiftedChat.append(previousMessages, {
                        _id: remoteMessage.data.CommentID,
                        text: remoteMessage.data.message,
                        createdAt: new Date(remoteMessage.sentTime),
                        user: {
                            _id: 'planner',
                            name: 'planner',
                        },
                    }),                       
                );
            }
		});
	
		return unsubscribe;
    }, []);

    const sendMessages = async (messages) => {
        try {
            setLoading(true);

            const username = await SecureStore.getItemAsync('User_ID');
            setUserID(username);
            const vehicle = await AsyncStorage.getItem('vehicleno');

            const Web_Server = await SecureStore.getItemAsync('Web_Server');
            const Port = await SecureStore.getItemAsync('Port');
            const Auth_Token = await SecureStore.getItemAsync('Auth_Token');
            const Database_Server = await SecureStore.getItemAsync('Database_Server');
            const Database_Name = await SecureStore.getItemAsync('Database_Name');
         
            const API_URL = process.env.EXPO_PUBLIC_API_PROTOCOL + '://' 
                + Web_Server + ':' + Port
                + process.env.EXPO_PUBLIC_API_ROOT_PATH + 'AddComment';
           
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
                    "Task_ID": paramItem.Task_ID,
                    "Description": messages[0].text,
                    "Driver_Number": username,
                    "Vehicle_Number": vehicle,
                    "User_ID": messages[0].user._id,
                    "Added_DateTime": moment().tz('Singapore').format('YYYY-MM-DD HH:mm:ss'),
                    "CMT_FileName": "",
                    "CMT_File": "",
                    "Send_Notification": "F"
                }),
            });

            let json = await response.json();
            
            if ((json[0]["access"]).toLowerCase() == "success") {
                setMessages(previousMessages =>
                    GiftedChat.append(previousMessages, messages),                       
                );
            }
        } finally {
            setLoading(false);
        }
    };

    const onSend = useCallback((messages = []) => {
        sendMessages(messages);
    }, []);

    const renderSend = (props) => {
        return (
            <Send {...props} containerStyle={{
                justifyContent: 'center',
                alignItems: 'center',
                alignSelf: 'center',
                marginRight: 20,
            }}>
                <Icon
                    source="send"
                    size={20}
                />
            </Send>
        );
    }

    return (
        <View style={styles.container}>
            <KeyboardAwareScrollView bottomOffset={62} contentContainerStyle={styles.container}>   
                <GiftedChat
                    renderSend={renderSend}
                    placeholder={i18n.t('type_message')}
                    messages={messages}
                    onSend={messages => onSend(messages)}
                    user={{
                        _id: userID,
                    }} 
                    multiline={false}
                />               
            </KeyboardAwareScrollView>  
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    childContainer: {
        flex: 1, 
        alignItems: 'center', 
        justifyContent: 'center',
    },
});