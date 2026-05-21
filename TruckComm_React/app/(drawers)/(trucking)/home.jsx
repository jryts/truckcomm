import { useState, useEffect, useCallback, useContext } from "react";
import { View, StyleSheet, FlatList, RefreshControl, Platform, PermissionsAndroid } from "react-native";
import { Searchbar, Text, Card, Avatar, Button, Badge, Icon, Tooltip, IconButton } from "react-native-paper";
import { useRouter } from "expo-router";
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { useFocusEffect } from '@react-navigation/native';
import moment from 'moment-timezone';
import { I18n } from 'i18n-js';
import { LanguageContext } from '../../_layout';
import messaging from '@react-native-firebase/messaging';

export default function Home() {
    const { language, setLanguage } = useContext(LanguageContext);

    const translations = {
        en: {
            search_task: 'Search Task ID',
            search_address: 'Search address',
            no_task: 'No task today',
            refresh: 'Refresh',
            task: 'Task',
            assigned_at: 'Assigned at',
            pickup: 'Pickup',
            delivery: 'Delivery',
            detail: 'Details',
            completed: 'Completed',
            next_status: 'Next Status',
            in_progress: 'In Progress',
            waiting: 'Waiting',
            completed: 'Completed',
            failed: 'Failed',
            task_id: 'Task ID',
            accept: 'Accept'
        },
        zh: {
            search_task: '搜索任务ID',
            search_address: '搜索地址',
            no_task: '今天暂无任务',
            refresh: '刷新',
            task: '任务',
            assigned_at: '委托于',
            pickup: '提货',
            delivery: '送货',
            detail: '详情',
            completed: '已完成',
            next_status: '下个状态',
            in_progress: '进行中',
            waiting: '等待中',
            completed: '已完成',
            failed: '已失败',
            task_id: '任务ID',
            accept: '接受'
        },
    };
    const i18n = new I18n(translations);
    i18n.locale = language;

    const router = useRouter();

    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [jobtrips, setJobTrips] = useState([]);
    const [originalJobTrips, setOriginalJobTrips] = useState([]);
    const [buttons, setButtons] = useState([]);
    const [badges, setBadges] = useState([]);

    const getTasks = async () => {
        try {
            setLoading(true);
            setSearchQuery('');

            const Web_Server = await SecureStore.getItemAsync('Web_Server');
            const Port = await SecureStore.getItemAsync('Port');
            const Auth_Token = await SecureStore.getItemAsync('Auth_Token');
            const Database_Server = await SecureStore.getItemAsync('Database_Server');
            const Database_Name = await SecureStore.getItemAsync('Database_Name');

            const User_ID = await SecureStore.getItemAsync('User_ID');
            const Password = await SecureStore.getItemAsync('Password');
            const Company_ID = await SecureStore.getItemAsync('Company_ID');
            const vehicle = await AsyncStorage.getItem('vehicleno');

            const API_URL = process.env.EXPO_PUBLIC_API_PROTOCOL + '://'
                + Web_Server + ':' + Port
                + process.env.EXPO_PUBLIC_API_ROOT_PATH + 'GetJobTripAllFromDriver';

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
                    "userid": User_ID,
                    "userpassword": Password,
                    "companyname": Company_ID,
                    "deviceid": "",
                    "Vehicle_Number": vehicle,
                    "Start_DateTime": moment().tz('Singapore').format('YYYYMMDD'),
                    "Completion_DateTime": moment().tz('Singapore').format('YYYYMMDD'),
                    "Job_Type": process.env.EXPO_PUBLIC_Trucking_Type,
                    "Accept_DateTime": moment().tz('Singapore').format('YYYY-MM-DD HH:mm:ss')
                }),
            });

            const json = await response.json();

            if ((json[0]["access"]).toLowerCase() == "success") {
                let result = json.slice(1);
                let tempArray = [];

                for (var i = 0; i < result.length; i++) {
                    let temp = result[i];
                    let pickupTime = temp.Start_DateTime;
                    let deliveryTime = temp.End_DateTime;
                    let pickupAdd = temp.Start_Add1 + ' ' + temp.Start_Add2 + ' ' + temp.Start_Add3 + ' ' + temp.Start_Add4;
                    let deliveryAdd = temp.End_Add1 + ' ' + temp.End_Add2 + ' ' + temp.End_Add3 + ' ' + temp.End_Add4;
                    let pickupStatus = temp.PICKUP_STATUS;
                    let deliveryStatus = temp.DELIVERY_STATUS;
                    let pickup = { ...temp, id: i * 2, type: 'pickup', time: pickupTime, address: pickupAdd, status: pickupStatus};
                    let delivery = { ...temp, id: i * 2 + 1, type: 'delivery', time: deliveryTime, address: deliveryAdd, status: deliveryStatus};

                    // Pickup grouping
                    let pickupFound = false;
                    let foundIndex = 0;
                    for (var j = 0; j < tempArray.length; j++) {
                        let current = tempArray[j];
                        let currentType = current.type;
                        let currentTime = current.time;
                        let currentStatus = current.status;
                        let currentAdd = currentType == 'pickup' ?
                            (current.Start_Add1 + ' ' + current.Start_Add2 + ' ' + current.Start_Add3 + ' ' + current.Start_Add4) :
                            (current.End_Add1 + ' ' + current.End_Add2 + ' ' + current.End_Add3 + ' ' + current.End_Add4);
                        if (pickup.type == currentType && pickup.time == currentTime && pickup.address == currentAdd && pickup.status == currentStatus) {
                            pickupFound = true;
                            foundIndex = j;
                            break;
                        }
                    }

                    if (pickupFound) {
                        let taskArray = [];
                        // Check if the found pickup already has a Task_Array
                        if (tempArray[foundIndex].Task_Array) {
                            taskArray = JSON.parse(tempArray[foundIndex].Task_Array);  // Parse existing array
                        } else {
                            taskArray.push({
                                id: tempArray[foundIndex].id,
                                type: 'pickup',
                                Task_ID: tempArray[foundIndex].Task_ID,
                                Job_Number: tempArray[foundIndex].Job_Number,
                                Job_ID: tempArray[foundIndex].JOB_ID,
                                Job_SeqNo: tempArray[foundIndex].Job_SeqNo,
                                DO_Number: tempArray[foundIndex].DO_Number,
                                PLANTRIP_NO: tempArray[foundIndex].PLANTRIP_NO,
                                PLST_SEQNO: tempArray[foundIndex].PLST_SEQNO,
                                Status: tempArray[foundIndex].PICKUP_STATUS,
                                Start_DateTime: tempArray[foundIndex].Start_DateTime,
                                End_DateTime: tempArray[foundIndex].End_DateTime,
                                Master_Job_Number: tempArray[foundIndex].Master_Job_Number,
                                House_Job_Number: tempArray[foundIndex].House_Job_Number,
                            });
                        }
                        taskArray.push({
                            id: pickup.id,
                            type: 'pickup',
                            Task_ID: pickup.Task_ID,
                            Job_Number: pickup.Job_Number,
                            Job_ID: pickup.JOB_ID,
                            Job_SeqNo: pickup.Job_SeqNo,
                            DO_Number: pickup.DO_Number,
                            PLANTRIP_NO: pickup.PLANTRIP_NO,
                            PLST_SEQNO: pickup.PLST_SEQNO,
                            Status: pickup.PICKUP_STATUS,
                            Start_DateTime: pickup.Start_DateTime,
                            End_DateTime: pickup.End_DateTime,
                            Master_Job_Number: pickup.Master_Job_Number,
                            House_Job_Number: pickup.House_Job_Number,
                        });
                        tempArray[foundIndex] = { ...tempArray[foundIndex], Task_Array: JSON.stringify(taskArray) };
                    } else {
                        tempArray = [...tempArray, pickup];
                    }

                    // Delivery grouping
                    let deliveryFound = false;
                    foundIndex = 0;
                    for (var j = 0; j < tempArray.length; j++) {
                        let current = tempArray[j];
                        let currentType = current.type;
                        let currentTime = current.time;
                        let currentStatus = current.status;
                        let currentAdd = currentType == 'pickup' ?
                            (current.Start_Add1 + ' ' + current.Start_Add2 + ' ' + current.Start_Add3 + ' ' + current.Start_Add4) :
                            (current.End_Add1 + ' ' + current.End_Add2 + ' ' + current.End_Add3 + ' ' + current.End_Add4);
                        if (delivery.type == currentType && delivery.time == currentTime && delivery.address == currentAdd && delivery.status == currentStatus) {
                            deliveryFound = true;
                            foundIndex = j;
                            break;
                        }
                    }

                    if (deliveryFound) {
                        let taskArray = [];
                        if (tempArray[foundIndex].Task_Array) {
                            taskArray = JSON.parse(tempArray[foundIndex].Task_Array);  // Parse existing array
                        } else {
                            taskArray.push({
                                id: tempArray[foundIndex].id,
                                type: 'delivery',
                                Task_ID: tempArray[foundIndex].Task_ID,
                                Job_Number: tempArray[foundIndex].Job_Number,
                                Job_ID: tempArray[foundIndex].JOB_ID,
                                Job_SeqNo: tempArray[foundIndex].Job_SeqNo,
                                DO_Number: tempArray[foundIndex].DO_Number,
                                PLANTRIP_NO: tempArray[foundIndex].PLANTRIP_NO,
                                PLST_SEQNO: tempArray[foundIndex].PLST_SEQNO,
                                Status: tempArray[foundIndex].DELIVERY_STATUS,
                                HAS_POD: tempArray[foundIndex].HAS_POD,
                                Start_DateTime: tempArray[foundIndex].Start_DateTime,
                                End_DateTime: tempArray[foundIndex].End_DateTime,
                                Master_Job_Number: tempArray[foundIndex].Master_Job_Number,
                                House_Job_Number: tempArray[foundIndex].House_Job_Number,
                            });
                        }
                        taskArray.push({
                            id: delivery.id,
                            type: 'delivery',
                            Task_ID: delivery.Task_ID,
                            Job_Number: delivery.Job_Number,
                            Job_ID: delivery.JOB_ID,
                            Job_SeqNo: delivery.Job_SeqNo,
                            DO_Number: delivery.DO_Number,
                            PLANTRIP_NO: delivery.PLANTRIP_NO,
                            PLST_SEQNO: delivery.PLST_SEQNO,
                            Status: delivery.DELIVERY_STATUS,
                            HAS_POD: delivery.HAS_POD,
                            Start_DateTime: delivery.Start_DateTime,
                            End_DateTime: delivery.End_DateTime,
                            Master_Job_Number: delivery.Master_Job_Number,
                            House_Job_Number: delivery.House_Job_Number,
                        });
                        tempArray[foundIndex] = { ...tempArray[foundIndex], Task_Array: JSON.stringify(taskArray) };
                    } else {
                        tempArray = [...tempArray, delivery];
                    }
                }

                // Sort the task by time
                tempArray.sort((a, b) => {
                    let firstStatus = (a.type == 'pickup') ? a.PICKUP_STATUS : a.DELIVERY_STATUS;
                    let secondStatus = (b.type == 'pickup') ? b.PICKUP_STATUS : b.DELIVERY_STATUS;
                    let firstInteger = 0;
                    let secondInteger = 0;

                    if (firstStatus == 'CP' || firstStatus == 'S') {
                        firstInteger = 1;
                    } else {
                        firstInteger = 0;
                    }

                    if (secondStatus == 'CP' || secondStatus == 'S') {
                        secondInteger = 1;
                    } else {
                        secondInteger = 0;
                    }

                    if (firstInteger != secondInteger) {
                        return (firstInteger - secondInteger);
                    }

                    // Create Date objects from the 'time' property
                    let dateA = new Date(a.time);
                    let dateB = new Date(b.time);

                    // Compare the dates
                    return dateA - dateB;
                });

                setJobTrips(tempArray);
                setOriginalJobTrips(tempArray);

                // each item button
                const buttonArray = [];
                for (var i = 0; i < tempArray.length; i++) {
                    buttonArray.push(false);
                }
                setButtons(buttonArray);

                // each item unread chat badge
                const badgeArray = [];
                for (var i = 0; i < tempArray.length; i++) {
                    const count = await renderBadge(tempArray[i].Task_ID);
                    badgeArray.push(count);
                }
                setBadges(badgeArray);
            } else {
                setJobTrips([]);
                setOriginalJobTrips([]);
            }
        } finally {
            setLoading(false);
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

        let API_URL = process.env.EXPO_PUBLIC_API_PROTOCOL + '://'
            + Web_Server + ':' + Port
            + process.env.EXPO_PUBLIC_API_ROOT_PATH;

        if (item.type == 'pickup') {
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
                "Pickup_Status": (item.type == 'pickup') ? statusCode : "",
                "Delivery_Status": (item.type == 'delivery') ? statusCode : "",
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
            await getTasks();
        }
    }

    const setNextStatus = async (item, index) => {
        try {
            let temp = [...buttons];
            temp[index] = true;
            setButtons(temp);

            let statusCode = (item.type == 'pickup') ? item.PICKUP_STATUS : item.DELIVERY_STATUS;
            let nextStatusCode = statusCode;

            if (statusCode == 'A' || statusCode == 'N') {
                nextStatusCode = (item.type == 'pickup') ? 'PP' : 'PD';
            } else if (statusCode == 'PP') {
                nextStatusCode = 'WP';
            } else if (statusCode == 'WP') {
                nextStatusCode = 'CP';
            } else if (statusCode == 'PD') {
                nextStatusCode = 'WD';
            } else if (statusCode == 'WD') {
                nextStatusCode = 'S';
            } else if (statusCode == 'CP') {
                nextStatusCode = 'CP';
            } else if (statusCode == 'S') {
                nextStatusCode = 'S';
            } else {
                if (item.PICKUP_STATUS == 'A' || item.PICKUP_STATUS == 'PP' || item.PICKUP_STATUS == 'WP' || item.PICKUP_STATUS == 'CP') {
                    nextStatusCode = 'PD';
                } else if (item.DELIVERY_STATUS == 'A' || item.DELIVERY_STATUS == 'PD' || item.DELIVERY_STATUS == 'WD' || item.DELIVERY_STATUS == 'S') {
                    nextStatusCode = 'PP';
                } else {
                    nextStatusCode = 'A';
                }
            }

            if (item.Task_Array) {
                taskArray = JSON.parse(item.Task_Array);
                // for (var i = 0; i < taskArray.length; i++) {
                //     const singleItem = taskArray[i];
                //     await editStatus(singleItem, nextStatusCode);
                // }
                await Promise.all(taskArray.map(singleItem => editStatus(singleItem, nextStatusCode)));
            } else {
                await editStatus(item, nextStatusCode);
            }
        } finally {
            let temp = [...buttons];
            temp[index] = false;
            setButtons(temp);
        }

    }

    const getStatus = (statusCode) => {
        if (statusCode == 'PP' || statusCode == 'PD') {
            return (
                <View style={styles.rightContent}>
                    <Avatar.Icon size={12} style={{ backgroundColor: 'lightblue' }} />
                    <Text style={styles.badge}>{i18n.t('in_progress')}</Text>
                </View>
            )
        } else if (statusCode == 'WP' || statusCode == 'WD') {
            return (
                <View style={styles.rightContent}>
                    <Avatar.Icon size={12} style={{ backgroundColor: 'orange' }} />
                    <Text style={styles.badge}>{i18n.t('waiting')}</Text>
                </View>
            )
        } else if (statusCode == 'CP' || statusCode == 'S') {
            return (
                <View style={styles.rightContent}>
                    <Avatar.Icon size={12} style={{ backgroundColor: 'green' }} />
                    <Text style={styles.badge}>{i18n.t('completed')}</Text>
                </View>
            )
        } else if (statusCode == 'FP' || statusCode == 'FD') {
            return (
                <View style={styles.rightContent}>
                    <Avatar.Icon size={12} style={{ backgroundColor: 'red' }} />
                    <Text style={styles.badge}>{i18n.t('failed')}</Text>
                </View>
            )
        }
    }

    const getNextStatus = (item) => {
        const statusCode = (item.type == 'pickup') ? item.PICKUP_STATUS : item.DELIVERY_STATUS;
        if (statusCode == 'A' || statusCode == 'N') {
            return (i18n.t('next_status') + '(' + i18n.t('in_progress') + ')')
        } else if (statusCode == 'PP' || statusCode == 'PD') {
            return (i18n.t('next_status') + ' (' + i18n.t('waiting') + ')')
        } else if (statusCode == 'WP' || statusCode == 'WD') {
            return (i18n.t('next_status') + ' (' + i18n.t('completed') + ')')
        } else if (statusCode == 'CP' || statusCode == 'S') {
            return (i18n.t('completed'))
        } else {
            if (item.PICKUP_STATUS == 'A' || item.PICKUP_STATUS == 'PP' || item.PICKUP_STATUS == 'WP' || item.PICKUP_STATUS == 'CP') {
                return (i18n.t('next_status') + '(' + i18n.t('in_progress') + ')')
            } else if (item.DELIVERY_STATUS == 'A' || item.DELIVERY_STATUS == 'PD' || item.DELIVERY_STATUS == 'WD' || item.DELIVERY_STATUS == 'S') {
                return (i18n.t('next_status') + '(' + i18n.t('in_progress') + ')')
            } else {
                return (i18n.t('accept'))
            }
        }
    }

    useEffect(() => {
        const unsubscribe = messaging().onMessage(async remoteMessage => {
            getTasks();
        });

        return unsubscribe;
    }, []);

    useFocusEffect(
        useCallback(() => {
            getTasks();
        }, [])
    );

    const [refreshing, setRefreshing] = useState(false);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        getTasks();
        setTimeout(() => {
            setRefreshing(false);
        }, 2000);
    }, []);

    const goToDetail = (item) => {
        router.navigate({ pathname: '/(drawers)/(trucking)/job-detail', params: item });
    }

    const RightContent = ({ item }) => (
        (item.type == 'pickup') ?
            getStatus(item.PICKUP_STATUS) : getStatus(item.DELIVERY_STATUS)
    )

    const LeftContent = props => <Avatar.Icon {...props} icon="truck" />
    const LeftContent2 = props => <Avatar.Icon {...props} icon="truck" />

    const getCardStyle = (item) => {
        const status = (item.type == 'pickup') ? item.PICKUP_STATUS : item.DELIVERY_STATUS;

        if (status == 'A' || status == 'N') {
            return ({
                marginVertical: 10,
            });
        } else {
            return ({
                marginVertical: 10,
                backgroundColor: (item.type == 'pickup') ? getColor(item.PICKUP_STATUS) : getColor(item.DELIVERY_STATUS)
            })
        }
    }

    const getColor = (statusCode) => {
        if (statusCode == 'PP' || statusCode == 'PD') {
            return 'lightblue';
        } else if (statusCode == 'WP' || statusCode == 'WD') {
            return 'orange';
        } else if (statusCode == 'CP' || statusCode == 'S') {
            return 'lightgreen';
        } else if (statusCode == 'FP' || statusCode == 'FD') {
            return 'orangered';
        }
    }

    const renderBadge = async (Task_ID) => {
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
                "Task_ID": Task_ID,
            }),
        });

        let json = await response.json();
        let count = 0;

        if ((json[0]["access"]).toLowerCase() == "success") {
            json = json.slice(1);
            for (let i = 0; i < json.length; i++) {
                if (json[i].Is_Opened == 'F') {
                    count = count + 1;
                }
            }
        }
        return count;
    }

    const Item = ({ item, index }) => (
        <View>
            <Card style={styles.card}>
                <Card.Title
                    title={
                        <View style={{ flexDirection: 'row' }}>
                            <Text variant="titleMedium">
                                {item.type == 'pickup' ? i18n.t('pickup') : i18n.t('delivery')}
                            </Text>
                            {
                                item.Task_Array &&
                                <Avatar.Text style={styles.badge} size={24} label={JSON.parse(item.Task_Array).length} />
                            }
                        </View>
                    }
                    subtitle={
                        item.Task_Array
                            ? `${i18n.t('task_id')}: ` + JSON.parse(item.Task_Array)
                                .map(task => `${task.Job_ID}~${task.Job_SeqNo}`)  // Extract JOB_ID & Job_SeqNo
                                .join(', ')  // Join them into a string
                            : `${i18n.t('task_id')}: ${item.JOB_ID}~${item.Job_SeqNo}`
                    }
                    left={(props) => <LeftContent {...props} />}
                    right={(props) => <RightContent item={item} />}
                />
                <Card.Content>
                    <Text style={{ textAlign: 'right' }}>{item.Master_Job_Number + ' ' + item.House_Job_Number}</Text>
                    <Text variant="titleMedium">{moment(item.time).format('hh:mm A')}</Text>
                    <Text variant="bodyMedium" style={styles.card}>{item.address}</Text>
                </Card.Content>
                <Card.Actions>
                    <Button loading={buttons[index]} mode="outlined" onPress={() => setNextStatus(item, index)}>
                        {getNextStatus(item)}
                    </Button>
                    <Button mode="contained" onPress={() => goToDetail(item)}>
                        {i18n.t('detail')}
                    </Button>
                    {
                        (badges[index] > 0) ?
                            <Badge style={styles.numberBadge} size={24}>{badges[index]}</Badge>
                            :
                            <></>
                    }
                </Card.Actions>
            </Card>
        </View>
    );

    const filterTask = (query) => {
        setJobTrips(
            originalJobTrips.filter(jobtrip =>
                (jobtrip.Task_ID).includes(query)
            )
        );
    }

    return (
        <View style={styles.container}>
            <Searchbar style={styles.searchbar}
                placeholder={i18n.t('search_task')}
                onChangeText={(query) => {
                    setSearchQuery(query);
                    filterTask(query);
                }}
                onClearIconPress={() => {
                    setJobTrips(originalJobTrips);
                }}
                value={searchQuery}
            />
            {
                (jobtrips.length > 0) ?
                    <FlatList
                        data={jobtrips}
                        renderItem={({ item, index }) => <Item item={item} index={index} />}
                        keyExtractor={item => item.id}
                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                        }
                    />
                    :
                    <View style={styles.childContainer}>
                        <Text variant="titleLarge">{i18n.t('no_task')}</Text>
                        <Button
                            style={styles.card}
                            mode="contained"
                            onPress={getTasks}
                            loading={loading}>
                            {i18n.t('refresh')}
                        </Button>
                    </View>
            }
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
    searchbar: {
        marginBottom: 10,
    },
    card: {
        marginVertical: 10,
    },
    rightContent: {
        marginHorizontal: 25,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    flexbox: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    badge: {
        marginLeft: 10,
    },
    numberBadge: {
        position: 'absolute',
        top: 4,
        right: 4,
    },
});
