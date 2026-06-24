import { useEffect, useState, useRef, useCallback, useContext } from "react";
import { View, StyleSheet, KeyboardAvoidingView, Platform, 
    RefreshControl, Image, SafeAreaView } from "react-native";
import { Icon } from "react-native-paper";
import { GiftedChat, Send } from 'react-native-gifted-chat';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { useLocalSearchParams } from "expo-router";
import { getApp } from "@react-native-firebase/app";
// import messaging from '@react-native-firebase/messaging';
import moment from 'moment-timezone';
import { I18n } from 'i18n-js';
import { LanguageContext } from '../../_layout';

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
    const [isFetchingMsg, setisFetchingMsg] = useState(false);
    const chatRef = useRef(null);
 
    // To scroll to top or specific offset manually:
    chatRef.current?.scrollToOffset({ offset: 0, animated: false });

    const getMessages = async (isfirstLoad) => {
        try {
            setLoading(true);
            setisFetchingMsg(true);

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
            if(response.status === 200){
                let json = await response.json();
                // console.log('getMessages json-->',json);
                if ((json[0]["access"]).toLowerCase() == "success") {
                    json = json.slice(1);
                    if (isfirstLoad) {
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
                                })         
                            );   
                        }   
                    }else {
                        const newMessages = json.filter(msg => msg.Is_Opened== 'F');
                        console.log('newMessages-->',newMessages);
                        // Map API object formats to match GiftedChat's structure
                        const formattedMessages = newMessages.map((msg) => ({
                            _id: msg.Comment_ID,
                            text: msg.Description,
                            createdAt: new Date(msg.Added_DateTime),
                            user: {
                                _id: msg.User_ID == username ? username : 'planner',
                                name: msg.User_ID == username ? username : 'planner',
                            },
                        })).sort((a, b) => b.Comment_ID - a.Comment_ID);

                        console.log('formattedMessages-->',formattedMessages);
                        for (let i = 0; i < formattedMessages.length; i++) {
                            setMessages(previousMessages => {
                                // Filter out duplicates from incoming messages
                                const filteredNew = newMessages.filter(
                                    (newMsg) => !previousMessages.some((prevMsg) => prevMsg._id === formattedMessages[i]._id)
                                );
                                console.log('filteredNew-->',filteredNew);
                                return GiftedChat.append(previousMessages, filteredNew);
                            });
                            console.log('formattedMessage-->',formattedMessages[i]);
                            readMessage(formattedMessages[i]);
                            console.log('message set to READ--->');
                        }
                    }
                }
            }
        } finally {
            setLoading(false);
            setisFetchingMsg(false);
        }
    };

    const reloadMessages = useCallback(() => {
        console.log('Reloading messages...');
        // setMessages([]);
        getMessages(false);
        console.log('Done Reloading messages...');
    }, []);

    useEffect(() => {
        getMessages(true);
        console.log('First fetch ...');
        const intervalId = setInterval(() => {
            if (!isFetchingMsg) {
                getMessages(false);
                console.log('reload fetch Messages...');
            }
        }, 5000);
        // const unsubscribe = getApp().messaging().onMessage(async remoteMessage => {
        // console.log('remoteMessage-->',remoteMessage);
        // if (remoteMessage.data.TaskID == paramItem.Task_ID) {
        //     setMessages(previousMessages =>
        //         GiftedChat.append(previousMessages, {
        //             _id: remoteMessage.data.CommentID,
        //             text: remoteMessage.data.message,
        //             createdAt: new Date(remoteMessage.sentTime),
        //             user: {
        //                 _id: 'planner',
        //                 name: 'planner',
        //             },
        //         }),                       
        //     );
        // }
        //     });
        
        // // 2. Clear the timeout if the component unmounts
        return () => clearInterval(intervalId);
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
            const payload = JSON.stringify({
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
                });
            console.log('payload', payload);    
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
                body: payload,
            });
            if(response.status === 200){
                let json = await response.json();
                
                if ((json[0]["access"]).toLowerCase() == "success") {
                    // setMessages(previousMessages =>
                    //     GiftedChat.append(previousMessages, messages),                       
                    // );

                    setMessages(previousMessages => {
                        // Filter out duplicates from incoming messages
                        const filteredNew = messages.filter(
                            (newMsg) => !previousMessages.some((prevMsg) => prevMsg._id === messages[0]._id)
                        );
                        console.log('filteredNew-->',filteredNew);
                        return GiftedChat.append(previousMessages, filteredNew);
                    });
                }
            }
        } finally {
            setLoading(false);
        }
    };
    const readMessage = async (message) => {
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
                + process.env.EXPO_PUBLIC_API_ROOT_PATH + 'EditCommentIsOpen_Haulage';
            const payload = JSON.stringify({
                    "Auth_Token": Auth_Token,
                    "Server_Name": Database_Server,
                    "DB_Name": Database_Name,
                    "Task_ID": paramItem.Task_ID,
                    "Comment_ID": message._id,
                    "Is_Msg_Opened": "T",
                    "Vehicle_Number": vehicle,
                    "User_ID": message.user._id,
                    "Added_DateTime": moment().tz('Singapore').format('YYYY-MM-DD HH:mm:ss'),
                    "CMT_FileName": "",
                    "CMT_File": "",
                    "Send_Notification": "F"
                });
            // console.log('API_URL', API_URL);    
            // console.log('payload', payload);    
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
                body: payload,
            });
            if(response.status === 200){
                console.log('Message marked as read');
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
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0} // Adjust based on header height
            >
            <GiftedChat
                alignTop={true}
                renderSend={renderSend}
                // placeholder={i18n.t('type_message')}
                messages={messages??[]}
                onSend={messages => onSend(messages)}
                user={{
                    _id: userID?userID:'', // Ensure userID is not null or undefined
                }} 
                multiline={false}
                listViewProps={{
                   refreshControl: (
                        <RefreshControl
                            refreshing={false}
                            onRefresh={reloadMessages}
                            tintColor="#000" // iOS spinner color
                            colors={['#000']} // Android spinner color
                        />
                    ),
                }}
                isKeyboardInternallyHandled={false} 
                // messagesContainerRef={chatRef}
                // keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
                // keyboardAvoidingViewProps={{ keyboardVerticalOffset: headerHeight }}

            />

            </KeyboardAvoidingView>
        </SafeAreaView>
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