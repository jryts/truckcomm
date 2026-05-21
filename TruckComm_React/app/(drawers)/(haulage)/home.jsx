import { useState, useEffect, useCallback, useContext } from "react";
import { View, StyleSheet, FlatList, RefreshControl, Platform, PermissionsAndroid } from "react-native";
import { Searchbar, Text, Card, Avatar, Button, Icon } from "react-native-paper";
import { useRouter } from "expo-router";
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { useFocusEffect } from '@react-navigation/native';
import moment from 'moment-timezone';
import { I18n } from 'i18n-js';
import { LanguageContext } from '../../_layout';
import messaging from '@react-native-firebase/messaging';

export default function Home() {
    const {language, setLanguage} = useContext(LanguageContext);

    const translations = {
        en: { 
            search_address: 'Search address',
            no_task: 'No task today',
            refresh: 'Refresh',
            task: 'Task',
            assigned_at: 'Assigned at',
            pickup: 'Pickup',
            delivery: 'Delivery',
            detail: 'Detail',
            completed: 'Completed',
        },
        zh: { 
            search_address: '搜索地址',
            no_task: '今天暂无任务',
            refresh: '刷新',
            task: '任务',
            assigned_at: '委托于',
            pickup: '提货',
            delivery: '送货',
            detail: '详情',
            completed: '已完成',
        },
    };
    const i18n = new I18n(translations);
    i18n.locale = language;

    const router = useRouter();

    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [jobtrips, setJobTrips] = useState([]);
    const [originalJobTrips, setOriginalJobTrips] = useState([]);

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
                + process.env.EXPO_PUBLIC_API_ROOT_PATH + 'GetJobTrip';
    
            const payload = {
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
                    "Job_Type": process.env.EXPO_PUBLIC_Haulage_Type
                }    
            console.log('API URL -->',API_URL)
            console.log('payload----',payload);
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });
            const json = await response.json();

            if ((json[0]["access"]).toLowerCase() == "success") {
                setJobTrips(json.slice(1));
                setOriginalJobTrips(json.slice(1));
            } else {
                setJobTrips([]);
                setOriginalJobTrips([]);
            }
        } finally {
            setLoading(false);
        }
    }

    const requestUserPermission = async () => {
        if (Platform.Version >= 33) {
            await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
            );
        }
    }

    useEffect(() => {
        requestUserPermission();

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
        router.navigate({ pathname: '/(drawers)/(haulage)/job-detail', params: item });  
    }

    const RightContent = ({item}) => (
        (item.HAS_POD == 'T') &&
        <View style={{flexDirection: 'row', marginHorizontal: 10}}>
            <Icon source="check-circle" color="green" size={20} />
            <Text style={{marginHorizontal: 5}}>{i18n.t('completed')}</Text>
        </View>
    )
    const LeftContent = props => <Avatar.Icon {...props} icon="truck" />

    const Item = ({item}) => (
        <Card style={styles.card}>
            <Card.Title 
                title={i18n.t('task') + ' ' + item.Task_ID}
                subtitle={i18n.t('assigned_at') + ' ' + moment(item.Assigned_DateTime).format('hh:mm A')}
                left={LeftContent} 
                right={(props) => <RightContent {...props} item={item} />}
            />
            <Card.Content>
                <Text variant="titleLarge">
                    {moment(item.Start_DateTime).format('hh:mm A') + ' - ' + moment(item.End_DateTime).format('hh:mm A')}
                </Text>
                <Text variant="bodyMedium" style={styles.card}>
                    {i18n.t('pickup') + '\n'+ item.Start_Add1 + ' ' + item.Start_Add2 + ' ' + item.Start_Add3 + ' ' + item.Start_Add4}
                </Text>
                <Text variant="bodyMedium" style={styles.card}>
                    {i18n.t('delivery') + '\n' + item.End_Add1 + ' ' + item.End_Add2 + ' ' + item.End_Add3 + ' ' + item.End_Add4}
                </Text>
            </Card.Content>
            <Card.Actions>
            {
                (!(item.HAS_POD == 'T')) &&
                <Button mode="outlined" onPress={() => goToDetail(item)}>
                    {i18n.t('detail')}
                </Button>
            }
            </Card.Actions>
        </Card>
    );

    const filterTask = (query) => {
        setJobTrips(
            originalJobTrips.filter(jobtrip => 
                (jobtrip.Start_Add1 + jobtrip.Start_Add2 + jobtrip.Start_Add3 + jobtrip.Start_Add4)
                .toLowerCase().includes(query.toLowerCase())
                ||
                (jobtrip.End_Add1 + jobtrip.End_Add2 + jobtrip.End_Add3 + jobtrip.End_Add4)
                .toLowerCase().includes(query.toLowerCase())                  
            )
        );
    }

    return (
        <View style={styles.container}>
            <Searchbar style={styles.searchbar}
                placeholder={i18n.t('search_address')} 
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
                    renderItem={({item}) => <Item item={item} />}
                    keyExtractor={item => item.Task_ID}
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
});
