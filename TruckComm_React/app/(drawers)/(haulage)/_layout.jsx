import { useContext } from "react";
import { Stack } from "expo-router";
import { MD3LightTheme, useTheme } from 'react-native-paper';
import { I18n } from 'i18n-js';
import { LanguageContext } from '../../_layout';

export default function HomeLayout() {
    const theme = useTheme();
    const {language, setLanguage} = useContext(LanguageContext);

    const translations = {
        en: { 
            task_detail: 'Task Detail',
            cargo_item: 'Cargo Item',
            driver_updates: 'Driver Updates',
            chat: 'Chat',
            edms_file: 'EDMS File',
            pod: 'Proof of Delivery',
        },
        zh: { 
            task_detail: '任务详情',
            cargo_item: '货物清单',
            driver_updates: 'Driver Updates',
            chat: '聊天',
            edms_file: 'EDMS文件',
            pod: '交货证明',
        },
    };
    const i18n = new I18n(translations);
    i18n.locale = language;

	return (
        <Stack
            screenOptions={{
                headerStyle: {
                    backgroundColor: theme.dark ? theme.colors.background : theme.colors.primary,
                },
                headerTintColor: '#fff',
                headerTitleStyle: {
                    fontWeight: 'bold',
                },
                contentStyle: { backgroundColor: theme.colors.background },
            }}
        >
            <Stack.Screen 
                name="home"
                options={{ 
                    headerTitle: "Haulage",
                    headerShown: false
                }}	
            />
            <Stack.Screen 
                name="job-detail"
                options={{ 
                    headerTitle: i18n.t('task_detail')
                }}	
            />
            <Stack.Screen 
                name="driver-updates"
                options={{ 
                    headerTitle: i18n.t('driver_updates')
                }}	
            />
            <Stack.Screen 
                name="item-detail"
                options={{ 
                    headerTitle: i18n.t('cargo_item')
                }}	
            />
            <Stack.Screen 
                name="chat"
                options={{ 
                    headerTitle: i18n.t('chat')
                }}	
            />
            <Stack.Screen 
                name="edms-file"
                options={{ 
                    headerTitle: i18n.t('edms_file')
                }}	
            />
            <Stack.Screen 
                name="pod"
                options={{ 
                    headerTitle: i18n.t('pod')
                }}	
            />
        </Stack>
	);
}
