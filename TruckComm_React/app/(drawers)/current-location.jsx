import { useEffect, useState, useContext, useRef, useCallback } from "react";
import { View, StyleSheet } from "react-native";
import { Switch, Text, Portal, Dialog, Button } from "react-native-paper";
import MapView from 'react-native-maps';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { I18n } from 'i18n-js';
import { ThemeContext, LanguageContext } from '../_layout';
import { getUniqueId, getManufacturer } from 'react-native-device-info';
import moment from 'moment-timezone';
import { startActivityAsync, ActivityAction } from 'expo-intent-launcher';
import DeviceInfo from 'react-native-device-info';
import { useFocusEffect } from '@react-navigation/native';

export default function CurrentLocation() {
    const [isSwitchOn, setIsSwitchOn] = useState(false);

    const {theme, setTheme} = useContext(ThemeContext);
    const {language, setLanguage} = useContext(LanguageContext);

    const translations = {
        en: { 
            share_location: 'Share your location',
            sharing_location: 'You are sharing location with the planner',
            require_location: 'This app requires location permission to show your current location',
            require_background_location: 
                'This app requires location permission \'Allow all the time\' to share your location in the background',
            cancel: 'Cancel',
            settings: 'Settings',
        },
        zh: { 
            share_location: '共享你的位置',
            sharing_location: '正在与策划者共享你的位置',
            require_location: '此应用需要获得位置权限，以显示你的目前位置',
            require_background_location: 
                '此应用需要获得位置权限 \'Allow all the time\'，以在后台分享你的位置',
            cancel: '取消',
            settings: '设置',
        },
    };
    const i18n = new I18n(translations);
    i18n.locale = language;

    const LOCATION_TASK_NAME = 'background-location-task';
    const pkg = DeviceInfo.getBundleId();

    const [visible, setVisible] = useState(false);
    const showDialog = () => setVisible(true);
    const hideDialog = () => setVisible(false);

    const [backgroundVisible, setBackgroundVisible] = useState(false);
    const showBackgroundDialog = () => setBackgroundVisible(true);
    const hideBackgroundDialog = () => setBackgroundVisible(false);

    const [locationSubcription, setLocationSubscription] = useState(null);
    const map = useRef(null);

    const openSettings = () => {
        hideDialog();
        startActivityAsync(ActivityAction.APPLICATION_DETAILS_SETTINGS,
            { data: 'package:' + pkg }
        );
        setup();
    }

    const openBackgroundSettings = () => {
        hideBackgroundDialog();
        startActivityAsync(ActivityAction.APPLICATION_DETAILS_SETTINGS,
            { data: 'package:' + pkg }
        );
        requestPermissions();
    }

    const saveVehicleLocation = async (location) => {
        const Web_Server = await SecureStore.getItemAsync('Web_Server');
        const Port = await SecureStore.getItemAsync('Port');
        const Auth_Token = await SecureStore.getItemAsync('Auth_Token');
        const Database_Server = await SecureStore.getItemAsync('Database_Server');
        const Database_Name = await SecureStore.getItemAsync('Database_Name');

        const User_ID = await SecureStore.getItemAsync('User_ID');
        const vehicle = await AsyncStorage.getItem('vehicleno');
        const deviceID = await getUniqueId();

        const API_URL = process.env.EXPO_PUBLIC_API_PROTOCOL + '://' 
            + Web_Server + ':' + Port
            + process.env.EXPO_PUBLIC_API_ROOT_PATH + 'AddVehicleGPS';

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
                "Current_DriverCode": User_ID,
                "VEHICLE_NUMBER": vehicle,
                "PROCESS_DATETIME": moment().tz('Singapore').format('YYYY-MM-DD HH:mm:ss'),
                "LAT": location.coords.latitude,
                "LNG": location.coords.longitude,
                "TASK_ID": "",
                "ROUTE_ID": "",
                "DEVICE_ID": deviceID,
                "MagnitudeXYZ": "",
                "HeadingY": "",
                "AltitudeX": "",
                "RollZ": "",
                "Compass": "",
            }),
        });
    }

    TaskManager.defineTask(LOCATION_TASK_NAME, ({ data, error }) => {
        if (error) {
            console.log(error);
            return;
        }
        if (data) {
            const { locations } = data;
            saveVehicleLocation(locations[0]);
        }
    });

    const requestPermissions = async () => {
        const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
        if (backgroundStatus === 'granted') {
            const location = await Location.getCurrentPositionAsync();

            await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
                accuracy: Location.Accuracy.BestForNavigation, 
                distanceInterval: 500,
                timeInterval: 5000,
                foregroundService: {
                    notificationBody: i18n.t('sharing_location'),
                    killServiceOnDestroy: false,
                }
            });
            setIsSwitchOn(true);
        } else {
            showBackgroundDialog();
        }
    };

    const stopForegroundService = async () => {
        const isSharingLocation =  await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
        if (isSharingLocation) {
            await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
        }
        setIsSwitchOn(false);   
    }

    const onToggleSwitch = async () => {
        if (!isSwitchOn) {
            requestPermissions();
        } else {
            stopForegroundService();
        }
    };

    const centerLocation = (location) => {
        map.current?.animateCamera({
            center: {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
            }, 
        });
    }

    const setup = async () => {
        const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
        if (foregroundStatus === 'granted') {
            const location = await Location.getCurrentPositionAsync();
            map.current?.animateCamera({
                center: {
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                },
                zoom: 15
            });

            // if (!locationSubcription) {
            //     const locationSubscription = await Location.watchPositionAsync(
            //         {}, 
            //         (location) => {centerLocation(location)}
            //     );
            //     setLocationSubscription(locationSubscription);
            // }
        } else {
            showDialog();
        }

        const isSharingLocation =  await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
        setIsSwitchOn(isSharingLocation);
    }

    useFocusEffect(
        useCallback(() => {
            setup();
        }, [])
    );

    return (
        <View style={styles.container}>
            <View style={styles.switchContainer}>
                <Text variant="bodyLarge">{i18n.t('share_location')}</Text>
                <Switch value={isSwitchOn} onValueChange={onToggleSwitch} />
            </View>
            <MapView 
                ref={map}
                style={styles.map} 
                showsUserLocation={true} 
            />
            <Portal>
                <Dialog visible={visible} dismissable={false}>
                    <Dialog.Title>TruckComm</Dialog.Title>
                    <Dialog.Content>
                        <Text variant="bodyMedium">{i18n.t('require_location')}</Text>
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button onPress={hideDialog}>{i18n.t('cancel')}</Button>
                        <Button onPress={openSettings}>{i18n.t('settings')}</Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>
            <Portal>
                <Dialog visible={backgroundVisible} dismissable={false}>
                    <Dialog.Title>TruckComm</Dialog.Title>
                    <Dialog.Content>
                        <Text variant="bodyMedium">{i18n.t('require_background_location')}</Text>
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button onPress={hideBackgroundDialog}>{i18n.t('cancel')}</Button>
                        <Button onPress={openBackgroundSettings}>{i18n.t('settings')}</Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    switchContainer: {
        padding: 10,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    map: {
        flex: 1,
    },
  });