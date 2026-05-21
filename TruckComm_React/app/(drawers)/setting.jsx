import { useState, useEffect, useCallback, useContext } from "react";
import { View, StyleSheet } from "react-native";
import { List, RadioButton, Divider, Button, Text, useTheme, Portal, Modal, TextInput, HelperText } from "react-native-paper";
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import * as Application from 'expo-application';
import { I18n } from 'i18n-js';
import { ThemeContext, LanguageContext } from '../_layout';
import { useRouter } from "expo-router";
import { useFocusEffect } from '@react-navigation/native';

export default function Setting() {
    const router = useRouter();

    const [themeValue, setThemeValue] = useState('');
    const [languageValue, setLanguageValue] = useState('');
    const [driver, setDriver] = useState('');
    const [vehicle, setVehicle] = useState('');
    const [department, setDepartment] = useState('');

    const [loading, setLoading] = useState(false);
    const {theme, setTheme} = useContext(ThemeContext);
    const {language, setLanguage} = useContext(LanguageContext);

    const currentTheme = useTheme();
    const [visible, setVisible] = useState(false);
    const showModal = () => setVisible(true);
    const hideModal = () => setVisible(false);
    const containerStyle = {backgroundColor: currentTheme.colors.background, padding: 20};

    const translations = {
        en: { 
            account: 'Account',
            vehicle_no: 'Vehicle No',
            theme: 'Theme',
            light: 'Light',
            dark: 'Dark',
            language: 'Language',
            app_version: 'App Version',
            save: 'Save',
            cancel: 'Cancel',
            change_password: 'Change Password',
            username: 'Username',
            password: 'Password',
            company_id: 'Company ID',
            new_password: 'New Password',
            confirm_password: 'Confirm Password', 
            username_required: 'Username is required',
            password_required: 'Password is required',
            companyid_required: 'Company ID is required',
            newpassword_required: 'New Password is required',
            confirmpassword_required: 'Confirm Password is required',
        },
        zh: { 
            account: '账号',
            vehicle_no: '车牌号',
            theme: '主题',
            light: '浅色',
            dark: '深色',
            language: '语言',
            app_version: '应用版本号',
            save: '保存',
            cancel: '取消',
            change_password: '更改密码',
            username: '用户名',
            password: '密码',
            company_id: '公司ID',
            new_password: '新密码',
            confirm_password: '确认密码',
            username_required: '用户名 必填',
            password_required: '密码 必填',
            companyid_required: '公司ID 必填',
            newpassword_required: '新密码 必填',
            confirmpassword_required: '确认密码 必填',
        },
    };
    const i18n = new I18n(translations);
    i18n.locale = language;

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [companyID, setCompanyID] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [usernameHelper, setUsernameHelper] = useState(false);
    const [passwordHelper, setPasswordHelper] = useState(false);
    const [companyHelper, setCompanyHelper] = useState(false);
    const [newPasswordHelper, setNewPasswordHelper] = useState(false);
    const [confirmPasswordHelper, setConfirmPasswordHelper] = useState(false);

    const [secured, setSecured] = useState(true);
    const toggleSecured = () => setSecured(!secured);
    const [newSecured, setNewSecured] = useState(true);
    const toggleNewSecured = () => setNewSecured(!newSecured);
    const [confirmSecured, setConfirmSecured] = useState(true);
    const toggleConfirmSecured = () => setConfirmSecured(!confirmSecured);

    useEffect(() => {
        async function setup() {
            const app_theme = await AsyncStorage.getItem('app_theme');
            const app_language = await AsyncStorage.getItem('app_language');
            const driver = await SecureStore.getItemAsync('User_ID');
            const vehicle = await AsyncStorage.getItem('vehicleno');
            const department = await AsyncStorage.getItem('department');

            if (app_theme) {
                setThemeValue(app_theme);
            } else {
                setThemeValue('Theme_Light');
            }
            
            if (app_language) {
                setLanguageValue(app_language);
            } else {
                setLanguageValue('en');
            }           

            setDriver(driver);
            setVehicle(vehicle);
            setDepartment(department);
        }

        setup();
        
    }, []);

    useFocusEffect(
        useCallback(() => {
            setLoginInfo();
        }, [])
    );

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

    const save = async () => {
        try {
            setLoading(true);

            setTheme(themeValue);
            setLanguage(languageValue);
            
            await AsyncStorage.setItem('app_theme', themeValue);
            await AsyncStorage.setItem('app_language', languageValue);
        } finally {
            setLoading(false);
            if (department == 'Trucking') {
                router.navigate('/(drawers)/(trucking)/home');
            } else if (department == 'Haulage') {
                router.navigate('/(drawers)/(haulage)/home');  
            }
        }
    };

    return (
        <View style={styles.container}>
            <View style={{flex: 1}}>
                <List.Section>
                    <List.Subheader>{i18n.t('account')}</List.Subheader>
                    <List.Item
                        title={driver}
                        description={i18n.t('vehicle_no') + ': ' + vehicle}
                        left={props => <List.Icon {...props} icon="account" />}
                    />
                </List.Section>
                <Divider />
                {/* <Button mode="outlined" onPress={showModal}>
                    {i18n.t('change_password')}
                </Button>  */}
                <List.Section>
                    <List.Subheader>{i18n.t('theme')}</List.Subheader>
                    <RadioButton.Group onValueChange={newValue => setThemeValue(newValue)} value={themeValue}>
                        <RadioButton.Item label={i18n.t('light')} value="Theme_Light" />
                        <RadioButton.Item label={i18n.t('dark')} value="Theme_Dark" />
                    </RadioButton.Group>
                </List.Section>
                <Divider />
                <List.Section>
                    <List.Subheader>{i18n.t('language')}</List.Subheader>
                    <RadioButton.Group onValueChange={newValue => setLanguageValue(newValue)} value={languageValue}>
                        <RadioButton.Item label="English" value="en" />
                        <RadioButton.Item label="简体中文" value="zh" />
                    </RadioButton.Group>
                </List.Section>
                {/* <Divider /> */}
            </View>
            <Text variant="bodyMedium" style={styles.title}>
                {i18n.t('app_version') + ' ' + Application.nativeApplicationVersion}
            </Text> 
            <Button icon="content-save" mode="contained" onPress={save} loading={loading}>
                {i18n.t('save')}
            </Button> 
            <Portal>
                <Modal visible={visible} contentContainerStyle={containerStyle}>
                    <TextInput style={styles.textInput}
                        label={i18n.t('username')}
                        value={username}
                        onChangeText={text => setUsername(text)}
                    />    
                    <HelperText type="error" visible={usernameHelper}>
                        {i18n.t('username_required')}
                    </HelperText>       
                    <TextInput style={styles.textInput}
                        secureTextEntry={secured}
                        label={i18n.t('password')}
                        value={password}
                        onChangeText={text => setPassword(text)}
                        right={<TextInput.Icon icon="eye" onPress={toggleSecured} />}
                    />  
                    <HelperText type="error" visible={passwordHelper}>
                        {i18n.t('password_required')}
                    </HelperText> 
                    <TextInput style={styles.textInput}
                        label={i18n.t('company_id')}
                        value={companyID}
                        onChangeText={text => setCompanyID(text)}
                    /> 
                    <HelperText type="error" visible={companyHelper}>
                        {i18n.t('companyid_required')}
                    </HelperText>  
                    <TextInput style={styles.textInput}
                        secureTextEntry={newSecured}
                        label={i18n.t('new_password')}
                        value={newPassword}
                        onChangeText={text => setNewPassword(text)}
                        right={<TextInput.Icon icon="eye" onPress={toggleNewSecured} />}
                    />  
                    <HelperText type="error" visible={newPasswordHelper}>
                        {i18n.t('newpassword_required')}
                    </HelperText> 
                    <TextInput style={styles.textInput}
                        secureTextEntry={confirmSecured}
                        label={i18n.t('confirm_password')}
                        value={confirmPassword}
                        onChangeText={text => setConfirmPassword(text)}
                        right={<TextInput.Icon icon="eye" onPress={toggleConfirmSecured} />}
                    />  
                    <HelperText type="error" visible={confirmPasswordHelper}>
                        {i18n.t('confirmpassword_required')}
                    </HelperText>                  
                    <View style={styles.flexBox}>
                    <Button mode="outlined" onPress={hideModal}>
                        {i18n.t('cancel')}
                    </Button>               
                    <Button mode="contained">
                        {i18n.t('change_password')}
                    </Button>       
                    </View>  
                </Modal>
            </Portal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 10,
    },
    title: {
        textAlign: 'center',
        marginVertical: 25,
    },
    textInput: {
        // marginVertical: 10
    },
    flexBox: {
        flexDirection: 'row',
        justifyContent: 'space-between'
    }
});
