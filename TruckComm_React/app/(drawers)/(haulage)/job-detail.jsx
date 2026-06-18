import { useState, useContext } from "react";
import { View, StyleSheet, Platform, FlatList } from "react-native";
import { List, Divider, Button, IconButton, Snackbar, Card, Text, Icon, Menu } from "react-native-paper";
import { useLocalSearchParams } from "expo-router";
import * as Clipboard from 'expo-clipboard';
import * as Linking from 'expo-linking';
import { useRouter } from "expo-router";
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import moment from 'moment-timezone';
import { I18n } from 'i18n-js';
import { LanguageContext } from '../../_layout';

export default function JobDetail() {
    const {language, setLanguage} = useContext(LanguageContext);

    const translations = {
        en: { 
            task: 'Task',
            pickup: 'Pickup',
            delivery: 'Delivery',
            launch: 'Open',
            job_number: 'Job Number',
            do_number: 'Delivery Order Number',
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
        },
    };
    const i18n = new I18n(translations);
    i18n.locale = language;

    const router = useRouter();

    const item = useLocalSearchParams();
    const [itemDetails, setItemDetails] = useState([item]);

    let address = '';
    address = item.Start_Add1 + ' ' + item.Start_Add2 + ' ' + item.Start_Add3 + ' ' + item.Start_Add4;
    const [pickupAdd, setPickupAdd] = useState(address);
    address = item.End_Add1 + ' ' + item.End_Add2 + ' ' + item.End_Add3 + ' ' + item.End_Add4;
    const [deliveryAdd, setDeliveryAdd] = useState(address);

    const [visible, setVisible] = useState(false);
    const [snackbarText, setSnackbarText] = useState('');
    const onDismissSnackBar = () => setVisible(false);

    // const [menuVisible, setMenuVisible] = useState(false);
    // const openMenu = () => setMenuVisible(true);
    // const closeMenu = () => setMenuVisible(false);

    const copyToClipboard = async (text) => {
        await Clipboard.setStringAsync(text);
        setSnackbarText(i18n.t('address_copied'));
        setVisible(true);
    };

    const openMap = (destination) => {
        const params = new URLSearchParams();

        if (Platform.OS === "ios") {
            params.append("daddr", destination);
            params.append("dirflg", "d");
            Linking.openURL("http://maps.apple.com/?" + params);
        } else {
            params.append("api", 1);
            params.append("origin", pickupAdd);
            params.append("destination", deliveryAdd);
            params.append("travelmode", "driving");
            Linking.openURL("https://www.google.com/maps/dir/?" + params);
        }
    }

    const goToPage = (page, item) => {
        if (page == 'cargo') {
            router.navigate({ pathname: '/(drawers)/(haulage)/driver-updates', params: item }); //driver-updates  //item-detail
        } else if (page == 'chat') {
            router.navigate({ pathname: '/(drawers)/(haulage)/chat', params: item });
        } else if (page == 'file') {
            router.navigate({ pathname: '/(drawers)/(haulage)/edms-file', params: item });   
        } else if (page == 'pod') {
            router.navigate({ pathname: '/(drawers)/(haulage)/pod', params: item });   
        }
    }

    const editStatus = async (item, statusCode) => {
        const Web_Server = await SecureStore.getItemAsync('Web_Server');
        const Port = await SecureStore.getItemAsync('Port');
        const Auth_Token = await SecureStore.getItemAsync('Auth_Token');
        const Database_Server = await SecureStore.getItemAsync('Database_Server');
        const Database_Name = await SecureStore.getItemAsync('Database_Name');

        const User_ID = await SecureStore.getItemAsync('User_ID');
        const vehicle = await AsyncStorage.getItem('vehicleno');

        const API_URL = process.env.EXPO_PUBLIC_API_PROTOCOL + '://' 
            + Web_Server + ':' + Port
            + process.env.EXPO_PUBLIC_API_ROOT_PATH + 'EditJobTripStatus';
        console.log('API_URL --->',API_URL);    
        console.log('SELECT<ed status --> --->',statusCode);    
        const body = {
            "Auth_Token": Auth_Token,
            "Server_Name": Database_Server,
            "DB_Name": Database_Name,
            "Task_ID": item.Task_ID,
            "Message_Type": process.env.EXPO_PUBLIC_Haulage_Type,
            "Status": statusCode,
            "Pickup_Status": statusCode,
            "Send_Notification": "T",
            "Vehicle_Number": vehicle,
            "Captured_DateTime": item.Assigned_DateTime,
            "PLANTRIP_NO": item.PLANTRIP_NO,
            "PLANSUBTRIP_SEQNO": item.PLST_SEQNO,
            "Driver_Number": User_ID,
            "Added_DateTime": moment().tz('Singapore').format('YYYY-MM-DD HH:mm:ss'),
            "JOB_TYPE":process.env.EXPO_PUBLIC_Haulage_Type,
            "User_ID": User_ID
        }
        console.log('REQUEST BODY --->',body);  
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        const json = await response.json(); 
        console.log('RESPONSE --->',json);  

        if ((json[0]['access']).toLowerCase() == 'success') {
            const modifyItemDetails = [...itemDetails];
            const foundItem = modifyItemDetails.find(
                itemDetail => itemDetail.DO_Number === item.DO_Number
            );
            foundItem.Status = statusCode;
            setItemDetails(modifyItemDetails);
        }
    }

    const getStatus = (statusCode) => {
        if (statusCode == 'PP') {
            return (
                <View style={{marginVertical: 10}}>
                    <Icon
                        source="progress-clock"
                        size={20}
                    />
                    <Text variant="bodyMedium">{i18n.t('in_progress_pickup')}</Text>
                </View>    
            )
        } else if (statusCode == 'WP') {
            return (
                <View style={{marginVertical: 10}}>
                    <Icon
                        source="progress-alert"
                        size={20}
                    />
                    <Text variant="bodyMedium">{i18n.t('waiting_pickup')}</Text>
                </View>    
            )
        } else if (statusCode == 'CP') {
            return (
                <View style={{marginVertical: 10}}>
                    <Icon
                        source="progress-check"
                        size={20}
                    />
                    <Text variant="bodyMedium">{i18n.t('completed_pickup')}</Text>
                </View>    
            )
        } else if (statusCode == 'FP') {
            return (
                <View style={{marginVertical: 10}}>
                    <Icon
                        source="progress-close"
                        size={20}
                    />
                    <Text variant="bodyMedium">{i18n.t('failed_pickup')}</Text>
                </View>    
            )
        } else if (statusCode == 'PD') {
            return (
                <View style={{marginVertical: 10}}>
                    <Icon
                        source="progress-clock"
                        size={20}
                    />
                    <Text variant="bodyMedium">{i18n.t('in_progress_delivery')}</Text>
                </View>    
            )
        } else if (statusCode == 'WD') {
            return (
                <View style={{marginVertical: 10}}>
                    <Icon
                        source="progress-alert"
                        size={20}
                    />
                    <Text variant="bodyMedium">{i18n.t('waiting_delivery')}</Text>
                </View>    
            )
        } else if (statusCode == 'S') {
            return (
                <View style={{marginVertical: 10}}>
                    <Icon
                        source="check-circle-outline"
                        size={20}
                    />
                    <Text variant="bodyMedium">{i18n.t('completed_delivery')}</Text>
                </View>    
            )
        } else if (statusCode == 'FD') {
            return (
                <View style={{marginVertical: 10}}>
                    <Icon
                        source="close-circle-outline"
                        size={20}
                    />
                    <Text variant="bodyMedium">{i18n.t('failed_delivery')}</Text>
                </View>    
            )
        }
    }

    const LeftContent = props => <Text variant="bodyMedium">In progess pickup</Text>
    const RightMenu = ({item}) => {
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
                <Menu.Item onPress={() => {editStatus(item, 'SP')}} title={i18n.t('in_progress_pickup')} />
                <Divider />
                <Menu.Item onPress={() => {editStatus(item, 'WP')}} title={i18n.t('waiting_pickup')} />
                <Divider />
                <Menu.Item onPress={() => {editStatus(item, 'CP')}} title={i18n.t('completed_pickup')} />
                <Divider />
                <Menu.Item onPress={() => {editStatus(item, 'FP')}} title={i18n.t('failed_pickup')} />
                <Divider />
                <Menu.Item onPress={() => {editStatus(item, 'SD')}} title={i18n.t('in_progress_delivery')} />
                <Divider />
                <Menu.Item onPress={() => {editStatus(item, 'WD')}} title={i18n.t('waiting_delivery')} />
                <Divider />
                <Menu.Item onPress={() => {editStatus(item, 'S')}} title={i18n.t('completed_delivery')} />
                <Divider />
                <Menu.Item onPress={() => {editStatus(item, 'FD')}} title={i18n.t('failed_delivery')} />
            </Menu>
		);
	}

    const Item = ({item}) => (
        <Card style={styles.card}>
            <Card.Title
                title={i18n.t('job_number') + ': ' + item.Job_Number}
                subtitle={i18n.t('do_number') + ': ' + item.DO_Number}
                right={(props) => <RightMenu {...props} item={item} />}
            />
            <Card.Content>
                {getStatus(item.Status)}
            </Card.Content>
            <Card.Actions>
                <IconButton icon="truck" mode="outlined" onPress={() => {goToPage('cargo', item)}} />
                <IconButton icon="chat-processing" mode="outlined"onPress={() => {goToPage('chat', item)}} />
                {/* <IconButton icon="file" mode="outlined" onPress={() => {goToPage('file', item)}} /> */}
                <IconButton disabled={item.Status == 'S' ? false : true} icon="image-multiple" mode="outlined" onPress={() => {goToPage('pod', item)}} />
            </Card.Actions>
        </Card>
    );

    return (
        <View style={styles.container}>
            <List.Section>
                <List.Item
                    title={i18n.t('task') + ' ' + item.Task_ID}
                    description={
                        moment(item.Start_DateTime).format('hh:mm A') + 
                        ' - ' + 
                        moment(item.End_DateTime).format('hh:mm A')
                    }
                />
                <Divider />
            </List.Section>
            <List.Section>
                <List.Subheader>{i18n.t('pickup')}</List.Subheader>
                <List.Item
                    title={item.Start_Code}
                    description={pickupAdd}
                    right={props => 
                        <IconButton {...props} icon="content-copy" onPress={() => {
                            copyToClipboard(pickupAdd)
                        }} />
                    }
                />
            </List.Section>
            <Button mode="outlined" onPress={() => openMap(pickupAdd)} style={styles.card}>
                {i18n.t('launch') + ' Map'}
            </Button>
            <Divider />
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
            </List.Section>  
            <Button mode="outlined" onPress={() => openMap(deliveryAdd)} style={styles.card}>
                {i18n.t('launch') + ' Map'}
            </Button>
            <FlatList
                data={itemDetails}
                renderItem={({item}) => <Item item={item} />}
                keyExtractor={item => item.DO_Number}
            />
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
        marginVertical: 10,
    },
});