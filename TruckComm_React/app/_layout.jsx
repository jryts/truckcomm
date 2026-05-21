import { createContext, useState, useEffect } from "react";
import { AppState, AppRegistry } from "react-native";
import { PaperProvider, MD3LightTheme, MD3DarkTheme, Portal, Dialog, Button, Text } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Stack, usePathname, useRouter } from "expo-router";
import messaging from '@react-native-firebase/messaging';
import * as Notifications from 'expo-notifications';
import { I18n } from 'i18n-js';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import notifee, { AndroidImportance, AndroidStyle, EventType } from '@notifee/react-native';   
import Index from "./index";

export const ThemeContext = createContext(null);
export const LanguageContext = createContext(null);

export default function RootLayout() {
	const [theme, setTheme] = useState('Theme_Light');
	const [language, setLanguage] = useState('en');
	const [visible, setVisible] = useState(false);
	const [department, setDepartment] = useState('');
	const [isGrouped, setIsGrouped] = useState(false);
	const [notificationDrawer, setNotificationDrawer] = useState([]);

	const appState = AppState.currentState;
	const router = useRouter();
	const pathname = usePathname();

	const pathNameList = [
		'/job-detail',
		'/item-detail',
		'/chat',
		'/edms-file',
		'/pod',
	]

    const translations = {
        en: { 
            task_cancelled: 'This task has been cancelled',
			ok: 'OK',
        },
        zh: { 
            task_cancelled: '此任务已被取消',
			ok: '好的',
        },
    };
    const i18n = new I18n(translations);
    i18n.locale = language;

	const setup = async () => {
		const app_theme = await AsyncStorage.getItem('app_theme');
		const app_language = await AsyncStorage.getItem('app_language');
		const department = await AsyncStorage.getItem('department');

		if (app_theme) {
			setTheme(app_theme);
		}

		if (app_language) {
			setLanguage(app_language);
		}
		setDepartment(department);
	}

	const onMessageReceived = async (remoteMessage) => {
		const channelId = await notifee.createChannel({
			id: 'default',
			name: 'Default Channel',
		});
		
		notifee.displayNotification({
			title: 'Truckcomm',
			subtitle: '',
			android: {
				channelId,
				groupSummary: true,
				groupId: 'app',
			},
		});
		setIsGrouped(true);

		let index = 0;
		let found = false;
		for (var i = 0; i < notificationDrawer.length; i++) {
			if (notificationDrawer[i].TaskID == remoteMessage.data.TaskID) {
				index = i;
				found = true;
				break;
			}
		}

		let lines = [];
		if (found) {
			lines = notificationDrawer[index].lines;
		}	
		lines = [...lines, remoteMessage.data.message];
		console.log(remoteMessage.data);
		notifee.displayNotification({
			id: remoteMessage.data.TaskID,
			title: remoteMessage.data.NewTaskID,
			subtitle: 'planner',
			android: {
				channelId,
				groupId: 'app',
				style: {
					type: AndroidStyle.INBOX,
					lines: lines,
				},
				pressAction: {
					id: 'default',
				},
				sound: 'default',
				importance: AndroidImportance.HIGH,
			},
			data: {
				TaskID: remoteMessage.data.TaskID, // Add TaskID here
				MessageCode: remoteMessage.data.MessageCode,
			},
		});

		if (found) {
			let array = notificationDrawer;
			array[index].lines = lines;
			setNotificationDrawer(array);
		} else {
			let array = notificationDrawer;
			let item = {
				TaskID: remoteMessage.data.TaskID,
				lines: lines,
			}
			array.push(item);
			setNotificationDrawer(array);
		}
	} 

	notifee.onBackgroundEvent(async ({ type, detail }) => {
		switch (type) {
			case EventType.DISMISSED:
				console.log('User dismissed notification', detail.notification);
				break;
			case EventType.PRESS:
				const taskID = detail.notification.data.TaskID;
				const messageCode = detail.notification.data.MessageCode;

				const item = {
					Task_ID: taskID
				};
				setNotificationDrawer([]);
				router.navigate({ pathname: '/(drawers)/(trucking)/chat', params: item });
				// await notifee.cancelNotification(detail.notification.id);
				break;
		}
		
	});
	// AppRegistry.registerComponent('app', () => Index);
	
	useEffect(() => {
		setup();

		// 00 - normal chat message
		// 01 - start trip
		// 02 - change trip status
		// 03 - cancel trip
		// push notification
		messaging().setBackgroundMessageHandler(async remoteMessage => {
			// const item = {
			// 	Task_ID: remoteMessage.data.TaskID
			// };
			// if (remoteMessage.data.MessageCode == '00') {
			// 	router.navigate({ pathname: '/(drawers)/(trucking)/chat', params: item });	
			// } 
			onMessageReceived(remoteMessage);
		});

		// local notification
		// Notifications.setNotificationHandler({
		// 	handleNotification: async () => ({
		// 		shouldShowAlert: true,
		// 		shouldPlaySound: true,
		// 		shouldSetBadge: true,
		// 	}),
		// });

		let subscription = null;
		const unsubscribe = messaging().onMessage(async remoteMessage => {
			// subscription = Notifications.addNotificationResponseReceivedListener(response => {
			// 	const messageCode = response.notification.request.content.data.message_code;
			// 	const taskID = response.notification.request.content.data.Task_ID;  
						
			// 	const item = {
			// 		Task_ID: taskID
			// 	};
			// 	if (messageCode == '00') {
			// 		router.navigate({ pathname: '/(drawers)/(trucking)/chat', params: item });	
			// 	} 
			// });
			onMessageReceived(remoteMessage);


			// Notifications.scheduleNotificationAsync({
			// 	content: {
			// 		title: remoteMessage.data.TaskID + ' (Task ID)',
			// 		subtitle: 'planner',
			// 		body: remoteMessage.data.message,
			// 		data: {
			// 			"message_code": remoteMessage.data.MessageCode,
			// 			"Task_ID": remoteMessage.data.TaskID,
			// 		},
			// 	},
			// 	identifier: remoteMessage.data.TaskID,
			// 	trigger: {
			// 		seconds: 2,
			// 		channelId: 'app',
			// 	},
			// 	// trigger: null,
			// });

			// if (remoteMessage.data.MessageCode == '03') {
			// 	const found = pathNameList.find((element) => element == pathname);
			// 	if (found) {
			// 		setVisible(true);
			// 	}
			// }
		});
	
		return () => {
			unsubscribe(); // Remove onMessage listener
			return notifee.onForegroundEvent(({ type, detail }) => {
				switch (type) {
					case EventType.DISMISSED:
						console.log('User dismissed notification', detail.notification);
						break;
					case EventType.PRESS:
						const taskID = detail.notification.data.TaskID;
						const messageCode = detail.notification.data.MessageCode;

						const item = {
							Task_ID: taskID
						};
						setNotificationDrawer([]);
						router.navigate({ pathname: '/(drawers)/(trucking)/chat', params: item });
						notifee.cancelNotification(detail.notification.id);
						break;
				}
			});
		};
	}, [pathname]);

	return (
		<ThemeContext.Provider value={{theme, setTheme}}>
			<LanguageContext.Provider value={{language, setLanguage}}>
				<PaperProvider theme={theme == 'Theme_Light' ? MD3LightTheme : MD3DarkTheme}>
					<KeyboardProvider>
						<Stack
							screenOptions={{
								headerStyle: {
									backgroundColor: MD3LightTheme.colors.primary
								},
								headerTintColor: '#fff',
								headerTitleStyle: {
									fontWeight: 'bold',
								},
								
							}}
						>
							<Stack.Screen 
								name="index"
								options={{ 
									headerShown: false 
								}}	
							/>
							<Stack.Screen 
								name="login"
								options={{ 
									headerTitle: "TruckComm" 
								}}	
							/>
							<Stack.Screen 
								name="(drawers)"
								options={{ 
									headerShown: false 
								}}	
							/>
						</Stack>
						<Portal>
							<Dialog visible={visible} dismissable={false}>
								<Dialog.Icon icon="alert" />
								<Dialog.Content>
									<Text variant="bodyLarge" style={
										{ textAlign: 'center', marginVertical: 10, }
									}>
										{i18n.t('task_cancelled')}!
									</Text>
								</Dialog.Content>
								<Dialog.Actions>
									<Button onPress={() => {
										setVisible(false)
										if (department == 'Trucking') {
											router.navigate('/(drawers)/(trucking)/home');
										} else if (department == 'Haulage') {
											router.navigate('/(drawers)/(haulage)/home');  
										}
										//router.navigate('/(drawers)/(trucking)/home');
									}}>
										{i18n.t('ok')}
									</Button>
								</Dialog.Actions>
							</Dialog>
						</Portal>
					</KeyboardProvider>
				</PaperProvider>
			</LanguageContext.Provider>
		</ThemeContext.Provider>
	);
}
