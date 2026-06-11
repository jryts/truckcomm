import { useEffect, useState } from "react";
import { AppState, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard, View, StyleSheet } from "react-native";
import { Avatar, Text, TextInput, HelperText, Button, RadioButton, Portal, Dialog } from "react-native-paper";
import { useRouter } from "expo-router";
import * as Application from 'expo-application';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import messaging from '@react-native-firebase/messaging';
import { getUniqueId, getManufacturer } from 'react-native-device-info';
import { KeyboardAwareScrollView, KeyboardToolbar } from 'react-native-keyboard-controller';

export default function Login() {
    const router = useRouter();

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [companyID, setCompanyID] = useState('');
    const [value, setValue] = useState('Trucking');

    const [usernameHelper, setUsernameHelper] = useState(false);
    const [passwordHelper, setPasswordHelper] = useState(false);
    const [companyHelper, setCompanyHelper] = useState(false);
    const [loginHelper, setLoginHelper] = useState(false);
    const [loginError, setLoginError] = useState('');

    const [secured, setSecured] = useState(true);
    const toggleSecured = () => setSecured(!secured);

    const [visible, setVisible] = useState(false);
    const [dialogText, setDialogText] = useState('');
    const showDialog = () => setVisible(true);
    const hideDialog = () => setVisible(false);

    const [deviceToken, setDeviceToken] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        getFCMToken();
    }, []);

    const getFCMToken = async () => {
        // 1. Request permission for notifications
        const authStatus = await messaging().requestPermission();
        const enabled =
            authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
            authStatus === messaging.AuthorizationStatus.PROVISIONAL;

        if (enabled) {
            try {
                // 2. Register the device with APNS/FCM
                await messaging().registerDeviceForRemoteMessages();
                
                // 3. Retrieve the token
                const token = await messaging().getToken().catch(error => {
                    console.log('Error fetching FCM token:', error);
                });

                console.log('FCM Device Token:', token);
                setDeviceToken(token);
            } catch (error) {
                console.log('Error getting token:', error);
            }
        }
    }

    const validate = () => {
        if (username.trim() == '') {
            setUsernameHelper(true);
            setTimeout(() => {
                setUsernameHelper(false);
            }, 5000);
            return false;
        }
        if (password.trim() == '') {
            setPasswordHelper(true);
            setTimeout(() => {
                setPasswordHelper(false);
            }, 5000);
            return false;
        }
        if (companyID.trim() == '') {
            setCompanyHelper(true);
            setTimeout(() => {
                setCompanyHelper(false);
            }, 5000);
            return false;
        }

        return true;
    }

    const loginServer = async () => {
        const authURL = process.env.EXPO_PUBLIC_AUTH_URL;
        const payload = JSON.stringify({
            "User_ID": username,
            "Password": password,
            "Company_ID": companyID,
            "App_ID": process.env.EXPO_PUBLIC_APP_ID
        });
        console.log('Login payload:', payload);
        console.log('Login URL:', authURL);
        // Inside your API caller or hook:
        if (AppState.currentState === 'active') {
            // Execute fetch safely

            const response = await fetch(authURL, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
                body: payload,
            }).catch(error => {
                // console.log('Login fetch authURL:', fetch.arguments);
                console.log('Error during login fetch authURL:', error);
                setLoginHelper(true);
                setTimeout(() => {
                    setLoginHelper(false);
                }, 5000);
                return;
            });

            console.log('Login response status:', response);
            if (!response) {
                return false;
            }
            const json = await response.json();
            console.log('Login json:', json);

            if ((json[0]["access"]).toLowerCase() == "success") {
                await SecureStore.setItemAsync('Auth_Token', json[0]["Auth_Token"]);
                await SecureStore.setItemAsync('Auth_Expire', json[0]["Auth_Expire"]);
                await SecureStore.setItemAsync('Web_Server', json[0]["Web_Server"]);
                await SecureStore.setItemAsync('Port', json[0]["Port"]);
                await SecureStore.setItemAsync('Database_Server', json[0]["Database_Server"]);
                await SecureStore.setItemAsync('Database_Name', json[0]["Database_Name"]);
                
                await SecureStore.setItemAsync('User_ID', username);
                await SecureStore.setItemAsync('Password', password);
                await SecureStore.setItemAsync('Company_ID', companyID);
            
                return true; 
            } else {
                setLoginHelper(true);
                setTimeout(() => {
                    setLoginHelper(false);
                }, 5000);

                return false;
            }
        } else {
        // Wait/Listen for AppState to turn 'active' before fetching
        }

    };

    const setLoginInfo = async () => {
        const Web_Server = await SecureStore.getItemAsync('Web_Server');
        const Port = await SecureStore.getItemAsync('Port');
        const Auth_Token = await SecureStore.getItemAsync('Auth_Token');
        const Database_Server = await SecureStore.getItemAsync('Database_Server');
        const Database_Name = await SecureStore.getItemAsync('Database_Name');

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
        
        if ((json[0]["access"]).toLowerCase() == "success") {
            await AsyncStorage.setItem('vehicleno', json[0]["vehicleno"]);
            await AsyncStorage.setItem('Role', json[0]["Role"]);
            await AsyncStorage.setItem('Language_ID', json[0]["Language_ID"]);
            await AsyncStorage.setItem('Support_Email', json[0]["Support_Email"]);
            await AsyncStorage.setItem('department', value);

            return true;
        } else {
            setLoginHelper(true);
            setTimeout(() => {
                setLoginHelper(false);
            }, 5000);
                            
            return false;
        }
    }

    const saveMobileDevice = async () => {
        const Web_Server = await SecureStore.getItemAsync('Web_Server');
        const Port = await SecureStore.getItemAsync('Port');
        const Auth_Token = await SecureStore.getItemAsync('Auth_Token');
        const Database_Server = await SecureStore.getItemAsync('Database_Server');
        const Database_Name = await SecureStore.getItemAsync('Database_Name');

        const API_URL = process.env.EXPO_PUBLIC_API_PROTOCOL + '://' 
            + Web_Server + ':' + Port
            + process.env.EXPO_PUBLIC_API_ROOT_PATH + 'SaveMobileDevice';

        const deviceID = await getUniqueId();

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify([{
                "Auth_Token": Auth_Token,
                "servername": Database_Server,
                "dbname": Database_Name,
                "userid": username,
                "userpassword": password,
                "companyname": companyID,
                "deviceid": deviceID,
                "DeviceID": deviceID,
                "DeviceToken": deviceToken,
                "Platform": (Platform.OS == 'IOS' ? 'I' : 'A')
            }]),
        });
        
        const json = await response.json();
        
        if ((json[0]["access"]).toLowerCase() == "success") {
            return true;
        } else {
            setLoginHelper(true);
            setTimeout(() => {
                setLoginHelper(false);
            }, 5000);
                            
            return false;
        }
    }

    const login = async () => {  
        try {
            console.log('Logging in.....')
            setLoading(true);

            if (!validate()) {
                return;
            }
            
            if (!(await loginServer())) {
                return;
            }
         
            if (!(await setLoginInfo())) {
                return;
            }
          
            if (!(await saveMobileDevice())) {
                return;
            }

            if (value == 'Trucking') {
                router.replace('/(drawers)/(trucking)/home');
            } else if (value == 'Haulage') {
                router.replace('/(drawers)/(haulage)/home');  
            } 
        } finally {
            setLoading(false);
        }
    }

    return (
        <>
            <KeyboardAwareScrollView bottomOffset={62} contentContainerStyle={styles.container}>  
                <View style={{flex: 1}}>     
                    <View style={styles.imgContainer}>
                        <Avatar.Text label="T" />
                    </View>
                    <View style={styles.childContainer}>
                        <TextInput style={styles.textInput}
                            label="Username"
                            value={username}
                            onChangeText={text => setUsername(text)}
                        />    
                        <HelperText type="error" visible={usernameHelper}>
                            Username is required!
                        </HelperText>       
                        <TextInput style={styles.textInput}
                            secureTextEntry={secured}
                            label="Password"
                            value={password}
                            onChangeText={text => setPassword(text)}
                            right={<TextInput.Icon icon="eye" onPress={toggleSecured} />}

                        />  
                        <HelperText type="error" visible={passwordHelper}>
                            Password is required!
                        </HelperText> 
                        <TextInput style={styles.textInput}
                            label="Company ID"
                            value={companyID}
                            onChangeText={text => setCompanyID(text)}
                        /> 
                        <HelperText type="error" visible={companyHelper}>
                            Company ID is required!
                        </HelperText>  
                        <HelperText type="error" visible={loginHelper}>
                            Login failed!
                        </HelperText>  
                        <RadioButton.Group onValueChange={newValue => setValue(newValue)} value={value}>
                            <RadioButton.Item label="Trucking" value="Trucking" />
                            <RadioButton.Item label="Haulage" value="Haulage" /> 
                        </RadioButton.Group>
                    </View>
                    <Button mode="contained" icon="account" onPress={login} loading={loading}>
                        Login
                    </Button>   
                    <Button onPress={() => {   
                        setDialogText("Please contact your Transport department to reset the password!");
                        showDialog();
                    }}>
                        Forgot password?
                    </Button>
                    <Portal>
                        <Dialog visible={visible} dismissable={false}>
                            <Dialog.Title>TruckComm</Dialog.Title>
                            <Dialog.Content>
                                <Text variant="bodyMedium">{dialogText}</Text>
                            </Dialog.Content>
                            <Dialog.Actions>
                                <Button onPress={hideDialog}>OK</Button>
                            </Dialog.Actions>
                        </Dialog>
                    </Portal>
                </View> 
            </KeyboardAwareScrollView>       
            <KeyboardToolbar /> 
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 10,
    },
    imgContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    childContainer: {
        flex: 5,
    },
    textInput: {
        marginVertical: 10
    },
});
