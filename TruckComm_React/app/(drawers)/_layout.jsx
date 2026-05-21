import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Drawer } from 'expo-router/drawer';
import {
    DrawerContentScrollView,
    DrawerItemList,
    DrawerItem
  } from '@react-navigation/drawer';
import { View, StyleSheet, Platform, PermissionsAndroid } from 'react-native';
import { useTheme, Icon, Divider, Portal, Dialog, Text, Button } from 'react-native-paper';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { useRouter } from 'expo-router';
import { useState, useContext, createContext, useEffect } from 'react';
import { I18n } from 'i18n-js';
import { ThemeContext, LanguageContext } from '../_layout';
import messaging from '@react-native-firebase/messaging';
import * as Location from 'expo-location';
import { getUniqueId } from 'react-native-device-info';
import moment from 'moment-timezone';

export const DeparmentContext = createContext(null);

export default function DrawerLayout() {
    const [visible, setVisible] = useState(false);
    const [departmentVisible, setDepartmentVisible] = useState(false);

    const {theme, setTheme} = useContext(ThemeContext);
    const {language, setLanguage} = useContext(LanguageContext);

    const [department, setDepartment] = useState('');

    const translations = {
        en: { 
            home: 'Home',
            setting: 'Setting',
            change_log: 'Change Log',
            user_guide: 'User Guide',
            notification: 'Notification',
            confirm_logout: 'Confirm to logout',
            logout: 'Logout',
            cancel: 'Cancel',
            switch_department: 'Switch Department',
            confirm_switch_department: 'Switch to other department',
            switch: 'Switch',
            current_location: 'Current Location',
        },
        zh: { 
            home: '首页',
            setting: '设置',
            change_log: '更新日志',
            user_guide: '用户指南',
            notification: '通知',
            confirm_logout: '确认登出',
            logout: '登出',
            cancel: '取消',
            switch_department: '转换部门',
            confirm_switch_department: '转换至另一个部门',
            switch: '转换',
            current_location: '目前位置',
        },
    };
    const i18n = new I18n(translations);
    i18n.locale = language;

    const router = useRouter();
    const currentTheme = useTheme();

    const logout = async () => {
        await AsyncStorage.clear(); 

        await SecureStore.deleteItemAsync('Auth_Token');
        await SecureStore.deleteItemAsync('Auth_Expire');
        await SecureStore.deleteItemAsync('Web_Server');
        await SecureStore.deleteItemAsync('Port');
        await SecureStore.deleteItemAsync('Database_Server');
        await SecureStore.deleteItemAsync('Database_Name');
        
        await SecureStore.deleteItemAsync('User_ID');
        await SecureStore.deleteItemAsync('Password');
        await SecureStore.deleteItemAsync('Company_ID');
        
        setTheme('Theme_Light');
        setLanguage('en');
        messaging().deleteToken();

        router.replace('/');
    }

    const setup = async () => {
        const department = await AsyncStorage.getItem('department'); 
        setDepartment(department); 
        
        if (Platform.Version >= 33) {
            const granted = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
            );
        }
    }

    useEffect(() => {
        setup();
    }, []);

    const switchDepartment = async () => {
        const department = await AsyncStorage.getItem('department');

        if (department == 'Trucking') {
            await AsyncStorage.setItem('department', 'Haulage');
            setDepartment('Haulage');
            router.navigate('/(drawers)/(haulage)/home');
        } else if (department == 'Haulage') {
            await AsyncStorage.setItem('department', 'Trucking');
            setDepartment('Trucking');
            router.navigate('/(drawers)/(trucking)/home');  
        }   
        
        setDepartmentVisible(false);
    }

    function CustomDrawerContent(props) {
        return (
            <DrawerContentScrollView {...props} contentContainerStyle={{flex:1, justifyContent: 'space-between'}}>
                <View style={{flex: 1}}>
                    <DrawerItemList {...props} />
                </View>
                <Divider />
                <DrawerItem
                    inactiveTintColor={currentTheme.colors.onBackground}
                    icon={() => <Icon source="logout" size={24} />}
                    label={i18n.t('logout')}
                    onPress={() => setVisible(true)}
                />
            </DrawerContentScrollView>
        );
    }

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <Drawer
                drawerContent={(props) => <CustomDrawerContent {...props} />}
                screenOptions={{
                    drawerStyle: {
                        backgroundColor: currentTheme.colors.background,
                    },
                    drawerInactiveTintColor: currentTheme.colors.onBackground,
                    headerStyle: {
                        backgroundColor: currentTheme.dark ? currentTheme.colors.background : currentTheme.colors.primary,
                    },
                    headerTintColor: '#fff',
                    headerTitleStyle: {
                        fontWeight: 'bold',
                    },
                    sceneContainerStyle: { backgroundColor: currentTheme.colors.background },
                }}
            >
                <Drawer.Screen
                    name="(trucking)"
                    options={({route}) => ({
                        drawerIcon: () => (<Icon source="home-outline" size={24} />),
                        drawerLabel: i18n.t('home'),
                        title: "Trucking",
                        headerShown: getFocusedRouteNameFromRoute(route) == 'home', 
                        // drawerItemStyle: (department == 'Trucking') ? {display: 'flex'} : {display: 'none'},
                    })}
                />
                <Drawer.Screen
                    name="(haulage)"
                    options={({route}) => ({
                        drawerIcon: () => (<Icon source="home-outline" size={24} />),
                        drawerLabel: i18n.t('home'),
                        title: "Haulage",
                        headerShown: getFocusedRouteNameFromRoute(route) == 'home', 
                        // drawerItemStyle: (department == 'Haulage') ? {display: 'flex'} : {display: 'none'}, 
                        drawerItemStyle: {display: 'none'}, 
                    })}
                />
                <Drawer.Screen
                    name="notification"
                    options={{
                        drawerIcon: () => (<Icon source="bell-outline" size={24} />),
                        drawerLabel: i18n.t('notification'),
                        title: i18n.t('notification'),
                        drawerItemStyle: { display: 'none' }
                    }}
                />
                <Drawer.Screen
                    name="setting"
                    options={{
                        drawerIcon: () => (<Icon source="toggle-switch-outline" size={24} />),
                        drawerLabel: i18n.t('setting'),
                        title: i18n.t('setting'),
                    }}
                />
                <Drawer.Screen
                    name="change-log"
                    options={{
                        drawerIcon: () => (<Icon source="note-text-outline" size={24} />),
                        drawerLabel: i18n.t('change_log'),
                        title: i18n.t('change_log'),
                    }}
                />
                <Drawer.Screen
                    name="user-guide"
                    options={{
                        drawerIcon: () => (<Icon source="video-outline" size={24} />),
                        drawerLabel: i18n.t('user_guide'),
                        title: i18n.t('user_guide'),
                    }}
                />
                <Drawer.Screen
                    name="current-location"
                    options={{
                        drawerIcon: () => (<Icon source="map-marker" size={24} />),
                        drawerLabel: i18n.t('current_location'),
                        title: i18n.t('current_location'),
                    }}
                />
            </Drawer>
            <Portal>
                <Dialog visible={visible} dismissable={false}>
                    <Dialog.Icon icon="alert" />
                    <Dialog.Content>
                        <Text variant="bodyLarge" style={styles.title}>
                            {i18n.t('confirm_logout')}?
                        </Text>
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button onPress={() => setVisible(false)}>{i18n.t('cancel')}</Button>
                        <Button onPress={() => logout()}>{i18n.t('logout')}</Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>
            <Portal>
                <Dialog visible={departmentVisible} dismissable={false}>
                    <Dialog.Icon icon="alert" />
                    <Dialog.Content>
                        <Text variant="bodyLarge" style={styles.title}>
                            {i18n.t('confirm_switch_department')}?
                        </Text>
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button onPress={() => setDepartmentVisible(false)}>{i18n.t('cancel')}</Button>
                        <Button onPress={() => switchDepartment()}>{i18n.t('switch')}</Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>
        </GestureHandlerRootView>
    );
}

const styles = StyleSheet.create({
    title: {
        textAlign: 'center',
        marginVertical: 10,
    },
});
