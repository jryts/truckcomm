import { useEffect, useState, useContext } from "react";
import { View, StyleSheet, Platform, FlatList } from "react-native";
import { List, Divider, Button, IconButton, Snackbar, Card, Text, Icon, Menu, Portal, Dialog, Badge } from "react-native-paper";
import { useLocalSearchParams } from "expo-router";
import * as Clipboard from 'expo-clipboard';
import * as Linking from 'expo-linking';
import { useRouter } from "expo-router";
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import moment from 'moment-timezone';
import { I18n } from 'i18n-js';
import { LanguageContext } from '../../_layout';
import * as Location from 'expo-location';
import { getLastNotificationResponseAsync } from "expo-notifications";

export default function JobDetail() {
    const { language, setLanguage } = useContext(LanguageContext);

    const translations = {
        en: {
            task: 'Task',
            pickup: 'Pickup',
            delivery: 'Delivery',
            launch: 'Launch',
            job_number: 'Job Number',
            do_number: 'DO Number',
            address_copied: 'Address copied',
            ok: 'OK',
            in_progress_pickup: 'In-progress Pickup',
            waiting_pickup: 'Waiting Pickup',
            completed_pickup: 'Completed Pickup',
            failed_pickup: 'Failed Pickup',
            in_progress_delivery: 'In-progress Delivery',
            waiting_delivery: 'Waiting Delivery',
            completed_delivery: 'Completed Delivery',
            failed_delivery: 'Failed Delivery',
            change_all_status: 'Change all Status to',
            submitted_pod: 'You have submitted the Proof of Delivery',
            task_id: 'Task ID',
            details: 'Details',
        },
        zh: {
            task: '任务',
            pickup: '提货',
            delivery: '送货',
            launch: '打开',
            job_number: '工作号',
            do_number: '运单号',
            address_copied: '地址已复制',
            ok: '好的',
            in_progress_pickup: '提货中',
            waiting_pickup: '等待提货',
            completed_pickup: '完成提货',
            failed_pickup: '提货失败',
            in_progress_delivery: '送货中',
            waiting_delivery: '等待送货',
            completed_delivery: '完成送货',
            failed_delivery: '送货失败',
            change_all_status: '更改全部状态至',
            submitted_pod: '你已呈交送货证明',
            task_id: '任务ID',
            details: '详情',
        },
    };
    const i18n = new I18n(translations);
    i18n.locale = language;

    const router = useRouter();

    const paramItem = useLocalSearchParams();
    const [itemDetails, setItemDetails] = useState(null);

    useEffect(() => {
        if (paramItem.Task_Array) {
            setItemDetails(JSON.parse(paramItem.Task_Array));
        } else {
            setItemDetails([paramItem]);
        }
    }, []);

    // let address = '';
    // address = item.Start_Add1 + ' ' + item.Start_Add2 + ' ' + item.Start_Add3 + ' ' + item.Start_Add4;
    // const [pickupAdd, setPickupAdd] = useState(address);
    // address = item.End_Add1 + ' ' + item.End_Add2 + ' ' + item.End_Add3 + ' ' + item.End_Add4;
    // const [deliveryAdd, setDeliveryAdd] = useState(address);

    const [visible, setVisible] = useState(false);
    const [snackbarText, setSnackbarText] = useState('');
    const onDismissSnackBar = () => setVisible(false);

    const [dialogVisible, setDialogVisible] = useState(false);
    const [dialogText, setDialogText] = useState('');
    const hideDialog = () => setDialogVisible(false);

    const [menuVisible, setMenuVisible] = useState(false);
    const openMenu = () => setMenuVisible(true);
    const closeMenu = () => setMenuVisible(false);

    const [badgeVisible, setBadgeVisible] = useState(false);

    const copyToClipboard = async (text) => {
        await Clipboard.setStringAsync(text);
        setSnackbarText(i18n.t('address_copied'));
        setVisible(true);
    };

    const getCoordinates = async (address) => {
        try {
            // Geocode the provided address
            const geocodeResults = await Location.geocodeAsync(address);

            // Check if any results were returned
            if (geocodeResults.length > 0) {
                // Return the first result's latitude and longitude
                return {
                    latitude: geocodeResults[0].latitude,
                    longitude: geocodeResults[0].longitude,
                };
            } else {
                throw new Error("No coordinates found for the provided address.");
            }
        } catch (error) {
            console.error("Error in getCoordinates:", error);
            throw error;
        }
    };

    const openMap = async () => {
        const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
        if (foregroundStatus === 'granted') {
            // const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
            // if (backgroundStatus === 'granted') {
            const params = new URLSearchParams();
            const location = await Location.getCurrentPositionAsync();
            const destinationCoords = await getCoordinates(paramItem.address);

            if (Platform.OS === "ios") {
                params.append("daddr", paramItem.address);
                params.append("dirflg", "d");
                Linking.openURL("http://maps.apple.com/?" + params);
            } else {
                params.append("api", 1);
                params.append("origin", location.coords.latitude + ',' + location.coords.longitude);
                params.append("destination", destinationCoords.latitude + ',' + destinationCoords.longitude);
                //params.append("destination", paramItem.address);
                params.append("travelmode", "driving");
                Linking.openURL("https://www.google.com/maps/dir/?" + params);
            }
            //}
        }
    }

    const goToPage = (page, item) => {
        if (page == 'cargo') {
            router.navigate({ pathname: '/(drawers)/(trucking)/item-detail', params: item });
        } else if (page == 'chat') {
            setBadgeVisible(false);
            router.navigate({ pathname: '/(drawers)/(trucking)/chat', params: item });
        } else if (page == 'file') {
            router.navigate({ pathname: '/(drawers)/(trucking)/edms-file', params: item });
        } else if (page == 'pod') {
            if (item.HAS_POD == 'T') {
                setDialogText(i18n.t('submitted_pod'));
                setDialogVisible(true);
            } else {
                router.navigate({ pathname: '/(drawers)/(trucking)/pod', params: item });
            }
        }
    }

    const drawPolyline = async () => {
        const Web_Server = await SecureStore.getItemAsync('Web_Server');
        const Port = await SecureStore.getItemAsync('Port');
        const Auth_Token = await SecureStore.getItemAsync('Auth_Token');
        const Database_Server = await SecureStore.getItemAsync('Database_Server');
        const Database_Name = await SecureStore.getItemAsync('Database_Name');

        const User_ID = await SecureStore.getItemAsync('User_ID');
        const vehicle = await AsyncStorage.getItem('vehicleno');

        const API_URL = process.env.EXPO_PUBLIC_API_PROTOCOL + '://'
            + Web_Server + ':' + Port
            + process.env.EXPO_PUBLIC_API_ROOT_PATH + 'CreateGPSDataAllPolylineEnh/0';

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
                "DRIVER_CODE": User_ID,
                "VEHICLE_NUMBER": vehicle,
                "Captured_DateTime": moment().tz('Singapore').format('YYYY-MM-DD'),
            }),
        });

        const json = await response.json();
    }

    const editStatus = async (item, statusCode) => {
        const Web_Server = await SecureStore.getItemAsync('Web_Server');
        const Port = await SecureStore.getItemAsync('Port');
        const Auth_Token = await SecureStore.getItemAsync('Auth_Token');
        const Database_Server = await SecureStore.getItemAsync('Database_Server');
        const Database_Name = await SecureStore.getItemAsync('Database_Name');

        const User_ID = await SecureStore.getItemAsync('User_ID');
        const vehicle = await AsyncStorage.getItem('vehicleno');

        let API_URL = process.env.EXPO_PUBLIC_API_PROTOCOL + '://'
            + Web_Server + ':' + Port
            + process.env.EXPO_PUBLIC_API_ROOT_PATH;

        if (paramItem.type == 'pickup') {
            API_URL = API_URL + 'EditJobTripStatusPickupEnh';
        } else {
            API_URL = API_URL + 'EditJobTripStatusDeliveryEnh';
        }

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
                "Task_ID": item.Task_ID,
                "Message_Type": process.env.EXPO_PUBLIC_Trucking_Type,
                "Status": statusCode,
                "Pickup_Status": (paramItem.type == 'pickup') ? statusCode : "",
                "Delivery_Status": (paramItem.type == 'delivery') ? statusCode : "",
                "Send_Notification": "F",
                "Vehicle_Number": vehicle,
                "Captured_DateTime": item.Assigned_DateTime,
                "PLANTRIP_NO": item.PLANTRIP_NO,
                "PLANSUBTRIP_SEQNO": item.PLST_SEQNO,
                "Driver_Number": User_ID,
                "Added_DateTime": moment().tz('Singapore').format('YYYY-MM-DD HH:mm:ss'),
                "User_ID": User_ID
            }),
        });

        const json = await response.json();

        if ((json[0]['access']).toLowerCase() == 'success') {
            if (itemDetails.length > 1) {
                const modifyItemDetails = [...itemDetails];
                const foundItem = modifyItemDetails.find(
                    itemDetail => itemDetail.id === item.id
                );
                foundItem.Status = statusCode;
                setItemDetails(modifyItemDetails);
            } else {
                const modifyItemDetails = [...itemDetails];
                if (modifyItemDetails[0].type == 'pickup') {
                    modifyItemDetails[0].PICKUP_STATUS = statusCode;
                } else {
                    modifyItemDetails[0].DELIVERY_STATUS = statusCode;
                }
                setItemDetails(modifyItemDetails);
            }
        }

        // if (statusCode == 'S') {
        //     drawPolyline();
        // }
    }

    const editAllStatus = async (statusCode) => {
        for (var i = 0; i < itemDetails.length; i++) {
            const item = itemDetails[i];
            editStatus(item, statusCode);
        }
        closeMenu();
    }

    const getStatus = (statusCode) => {
        if (statusCode == 'PP') {
            return (
                <View style={styles.flexBox}>
                    <Icon
                        source="progress-clock"
                        size={20}
                    />
                    <Text variant="bodyMedium" style={{ marginLeft: 10 }}>{i18n.t('in_progress_pickup')}</Text>
                </View>
            )
        } else if (statusCode == 'WP') {
            return (
                <View style={styles.flexBox}>
                    <Icon
                        source="progress-alert"
                        size={20}
                    />
                    <Text variant="bodyMedium" style={{ marginLeft: 10 }}>{i18n.t('waiting_pickup')}</Text>
                </View>
            )
        } else if (statusCode == 'CP') {
            return (
                <View style={styles.flexBox}>
                    <Icon
                        source="progress-check"
                        size={20}
                    />
                    <Text variant="bodyMedium" style={{ marginLeft: 10 }}>{i18n.t('completed_pickup')}</Text>
                </View>
            )
        } else if (statusCode == 'FP') {
            return (
                <View style={styles.flexBox}>
                    <Icon
                        source="progress-close"
                        size={20}
                    />
                    <Text variant="bodyMedium" style={{ marginLeft: 10 }}>{i18n.t('failed_pickup')}</Text>
                </View>
            )
        } else if (statusCode == 'PD') {
            return (
                <View style={styles.flexBox}>
                    <Icon
                        source="progress-clock"
                        size={20}
                    />
                    <Text variant="bodyMedium" style={{ marginLeft: 10 }}>{i18n.t('in_progress_delivery')}</Text>
                </View>
            )
        } else if (statusCode == 'WD') {
            return (
                <View style={styles.flexBox}>
                    <Icon
                        source="progress-alert"
                        size={20}
                    />
                    <Text variant="bodyMedium" style={{ marginLeft: 10 }}>{i18n.t('waiting_delivery')}</Text>
                </View>
            )
        } else if (statusCode == 'S') {
            return (
                <View style={styles.flexBox}>
                    <Icon
                        source="progress-check"
                        size={20}
                    />
                    <Text variant="bodyMedium" style={{ marginLeft: 10 }}>{i18n.t('completed_delivery')}</Text>
                </View>
            )
        } else if (statusCode == 'FD') {
            return (
                <View style={styles.flexBox}>
                    <Icon
                        source="progress-close"
                        size={20}
                    />
                    <Text variant="bodyMedium" style={{ marginLeft: 10 }}>{i18n.t('failed_delivery')}</Text>
                </View>
            )
        }
    }

    const LeftContent = props => <Text variant="bodyMedium">In progess pickup</Text>
    const RightMenu = ({ item }) => {
        const [menuVisible, setMenuVisible] = useState(false);
        const openMenu = () => setMenuVisible(true);
        const closeMenu = () => setMenuVisible(false);

        return (
            <Menu
                visible={menuVisible}
                onDismiss={closeMenu}
                anchor={<IconButton icon="dots-vertical" onPress={openMenu} />}
                anchorPosition="bottom"
            >
                {
                    (paramItem.type == 'pickup') ?
                        <View>
                            <Menu.Item onPress={() => { editStatus(item, 'PP') }} title={i18n.t('in_progress_pickup')} />
                            <Divider />
                            <Menu.Item onPress={() => { editStatus(item, 'WP') }} title={i18n.t('waiting_pickup')} />
                            <Divider />
                            <Menu.Item onPress={() => { editStatus(item, 'CP') }} title={i18n.t('completed_pickup')} />
                            <Divider />
                            <Menu.Item onPress={() => { editStatus(item, 'FP') }} title={i18n.t('failed_pickup')} />
                        </View>
                        :
                        <View>
                            <Menu.Item onPress={() => { editStatus(item, 'PD') }} title={i18n.t('in_progress_delivery')} />
                            <Divider />
                            <Menu.Item onPress={() => { editStatus(item, 'WD') }} title={i18n.t('waiting_delivery')} />
                            <Divider />
                            <Menu.Item onPress={() => { editStatus(item, 'S') }} title={i18n.t('completed_delivery')} />
                            <Divider />
                            <Menu.Item onPress={() => { editStatus(item, 'FD') }} title={i18n.t('failed_delivery')} />
                        </View>
                }
            </Menu>
        );
    }

    const getDisabled = (item) => {
        if (paramItem.Task_Array) {
            return (item.Status == 'S') ? false : true;
        } else {
            return (item.DELIVERY_STATUS == 'S') ? false : true;
        }
    }

    const Item = ({ item }) => (
        <Card style={styles.card}>
            <Card.Title
                title={<Text variant="titleMedium">{i18n.t('job_number') + ': ' + item.Job_Number}</Text>}
                subtitle={i18n.t('do_number') + ': ' + item.DO_Number}
                right={(props) => <RightMenu {...props} item={item} />}
            />
            <Card.Content>
                <Text variant="titleMedium">{i18n.t('details')}</Text>
                <View style={{ flexDirection: 'row', marginVertical: 10 }}>
                    <View>
                        <Text variant="bodyMedium">{i18n.t('task_id') + ': ' + (paramItem.Task_Array ? item.Job_ID : item.JOB_ID) + '~' + item.Job_SeqNo}</Text>
                        <Text variant="bodyMedium">{moment(item.Start_DateTime).format('hh:mm A') + ' - ' + moment(item.End_DateTime).format('hh:mm A')}</Text>
                    </View>
                    <View style={{ marginLeft: 25 }}>
                        <Text>{item.Master_Job_Number}</Text>
                        <Text>{item.House_Job_Number}</Text>
                    </View>
                </View>
                {
                    (paramItem.Task_Array) ? getStatus(item.Status) :
                        ((paramItem.type == 'pickup') ? getStatus(item.PICKUP_STATUS) : getStatus(item.DELIVERY_STATUS))
                }
            </Card.Content>
            <Card.Actions>
                <IconButton icon="truck" mode="outlined" onPress={() => { goToPage('cargo', item) }} />
                <View>
                    <IconButton icon="chat-processing" mode="outlined" onPress={() => { goToPage('chat', item) }} />
                    <Badge style={styles.badge} size={12} visible={badgeVisible}></Badge>
                </View>
                <IconButton icon="file" mode="outlined" onPress={() => { goToPage('file', item) }} />
                {
                    (paramItem.type == 'delivery') &&
                    <IconButton
                        disabled={getDisabled(item)}
                        icon="image-multiple"
                        mode="outlined"
                        onPress={() => { goToPage('pod', item) }}
                    />
                }
            </Card.Actions>
        </Card>
    );

    return (
        <View style={styles.container}>
            {/* <List.Section>
                <List.Item
                    title={i18n.t('task') + ' ' + item.Task_ID}
                    description={
                        moment(item.Start_DateTime).format('hh:mm A') + 
                        ' - ' + 
                        moment(item.End_DateTime).format('hh:mm A')
                    }
                />
                <Divider />
            </List.Section> */}
            <List.Section>
                <List.Subheader style={{ fontSize: 20 }}>
                    {paramItem.type == 'pickup' ? i18n.t('pickup') : i18n.t('delivery')}
                </List.Subheader>
                <List.Item
                    title={paramItem.type == 'pickup' ? paramItem.Start_Code : paramItem.End_Code}
                    description={paramItem.address}
                    right={props =>
                        <IconButton {...props} icon="content-copy" onPress={() => {
                            copyToClipboard(paramItem.address)
                        }} />
                    }
                />
            </List.Section>
            {/* <Divider />
            <List.Section>
                <List.Subheader>{i18n.t('delivery')}</List.Subheader>
                <List.Item
                    title={item.End_Code}
                    description={deliveryAdd}
                    right={props => 
                        <IconButton {...props} icon="content-copy" onPress={() => {
                            copyToClipboard(deliveryAdd)
                        }} />
                    }
                />
            </List.Section>   */}
            <Button mode="outlined" onPress={() => openMap()} style={styles.card}>
                {i18n.t('launch') + ' Google Maps'}
            </Button>
            <FlatList
                data={itemDetails}
                renderItem={({ item }) => <Item item={item} />}
                keyExtractor={item => item.id}
            />
            {
                (paramItem.Task_Array) &&
                // <Button mode="outlined" onPress={() => openMap()} style={styles.card}>
                //     {i18n.t('change_all_status')}
                // </Button>   
                <Menu style={styles.menu}
                    visible={menuVisible}
                    onDismiss={closeMenu}
                    anchor={<Button mode="outlined" onPress={openMenu} style={styles.card}>{i18n.t('change_all_status')}</Button>}>
                    {
                        (paramItem.type == 'pickup') ?
                            <View>
                                <Menu.Item onPress={() => { editAllStatus('PP') }} title={i18n.t('in_progress_pickup')} />
                                <Divider />
                                <Menu.Item onPress={() => { editAllStatus('WP') }} title={i18n.t('waiting_pickup')} />
                                <Divider />
                                <Menu.Item onPress={() => { editAllStatus('CP') }} title={i18n.t('completed_pickup')} />
                                <Divider />
                                <Menu.Item onPress={() => { editAllStatus('FP') }} title={i18n.t('failed_pickup')} />
                            </View>
                            :
                            <View>
                                <Menu.Item onPress={() => { editAllStatus('PD') }} title={i18n.t('in_progress_delivery')} />
                                <Divider />
                                <Menu.Item onPress={() => { editAllStatus('WD') }} title={i18n.t('waiting_delivery')} />
                                <Divider />
                                <Menu.Item onPress={() => { editAllStatus('S') }} title={i18n.t('completed_delivery')} />
                                <Divider />
                                <Menu.Item onPress={() => { editAllStatus('FD') }} title={i18n.t('failed_delivery')} />
                            </View>
                    }
                </Menu>
            }
            <Snackbar
                visible={visible}
                onDismiss={onDismissSnackBar}
                action={{
                    label: i18n.t('ok'),
                    onPress: () => {
                        onDismissSnackBar
                    },
                }}>
                {snackbarText}
            </Snackbar>
            <Portal>
                <Dialog visible={dialogVisible} dismissable={false}>
                    <Dialog.Title>TruckComm</Dialog.Title>
                    <Dialog.Content>
                        <Text variant="bodyMedium">{dialogText}</Text>
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button onPress={hideDialog}>{i18n.t('ok')}</Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 10,
    },
    childContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    card: {
        marginVertical: 15,
    },
    menu: {
        width: '100%',
        margin: 10
    },
    badge: {
        position: 'absolute',
        top: 4,
        right: 4,
    },
    flexBox: {
        marginVertical: 10,
        flexDirection: 'row',
        alignItems: 'center',
        // justifyContent: 'center',
    }
});