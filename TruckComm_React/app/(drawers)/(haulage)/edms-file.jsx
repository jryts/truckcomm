import { View, StyleSheet, FlatList } from "react-native";
import { useState, useEffect, useContext } from "react";
import { Avatar, Card, Text, Button, Portal, Dialog } from 'react-native-paper';
import { useLocalSearchParams } from "expo-router";
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import moment from 'moment-timezone';
import { I18n } from 'i18n-js';
import { LanguageContext } from '../../_layout';
import * as FileSystem from 'expo-file-system';
import * as IntentLauncher from 'expo-intent-launcher';

export default function EDMSFile() {
    const {language, setLanguage} = useContext(LanguageContext);

    const translations = {
        en: { 
            no_file: 'No files found',
            refresh: 'Refresh',
            uploaded_at: 'Uploaded at',
            delete: 'Delete',
            open: 'Open',
            download_error: 'Download error',
            cancel: 'Cancel',
            try_again: 'Try again',
            confirm_delete: 'Confirm to delete',
        },
        zh: { 
            no_file: '暂无文件',
            refresh: '刷新',
            uploaded_at: '上传于',
            delete: '删除',
            open: '打开',
            download_error: '下载失败',
            cancel: '取消',
            try_again: '重试',
            confirm_delete: '确认删除',
        },
    };
    const i18n = new I18n(translations);
    i18n.locale = language;

    const paramItem = useLocalSearchParams();

    const [loading, setLoading] = useState(true);
    const [files, setFiles] = useState([]);
    const [buttons, setButtons] = useState([]);

    const [againItem, setAgainItem] = useState(null);
    const [againIndex, setAgainIndex] = useState(-1);
    const [failedVisible, setFailedVisible] = useState(false);

    const [deleteItem, setDeleteItem] = useState(null);
    const [deleteIndex, setDeleteIndex] = useState(-1);
    const [visible, setVisible] = useState(false);

    const getFiles = async () => {
        try {
            setLoading(true);

            const Web_Server = await SecureStore.getItemAsync('Web_Server');
            const Port = await SecureStore.getItemAsync('Port');
            const Auth_Token = await SecureStore.getItemAsync('Auth_Token');
            const Database_Server = await SecureStore.getItemAsync('Database_Server');
            const Database_Name = await SecureStore.getItemAsync('Database_Name');
    
            const API_URL = process.env.EXPO_PUBLIC_API_PROTOCOL + '://' 
                + Web_Server + ':' + Port
                + process.env.EXPO_PUBLIC_API_ROOT_PATH + 'GetEDMSFile';
    
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
                    "Job_Number": paramItem.Job_Number, 
                    "Document_Type": process.env.EXPO_PUBLIC_Haulage_Document_Type,
                }),
            });

            const json = await response.json();

            if ((json[0]["access"]).toLowerCase() == "success") {
                const responseData = json.slice(1);
                const buttonArray = [];

                for (let i = 0; i < responseData.length; i++) {
                    const lastIndex = responseData[i].Original_File_Name.lastIndexOf('.');
                    const fileExtension = responseData[i].Original_File_Name.substring(lastIndex);
                    const fileUri = FileSystem.documentDirectory + 
                        'eDMS_' + responseData[i].Rec_Key + fileExtension; 
                    responseData[i].localFileUri = fileUri;

                    const fileInfo = await FileSystem.getInfoAsync(fileUri);
                    responseData[i].localFileExists = fileInfo.exists;

                    buttonArray.push(false);
                }

                setFiles(responseData);
                setButtons(buttonArray);
            }
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        getFiles();
    }, []);
   
    const downloadFile = async (item, index) => {
        try {
            const tempButtons = [...buttons];
            tempButtons[index] = true;
            setButtons(tempButtons);

            const Web_Server = await SecureStore.getItemAsync('Web_Server');
            const Port = await SecureStore.getItemAsync('Port');
            const Auth_Token = await SecureStore.getItemAsync('Auth_Token');
            const Database_Server = await SecureStore.getItemAsync('Database_Server');
            const Database_Name = await SecureStore.getItemAsync('Database_Name');
    
            const API_URL = process.env.EXPO_PUBLIC_API_PROTOCOL + '://' 
                + Web_Server + ':' + Port
                + process.env.EXPO_PUBLIC_API_ROOT_PATH + 'DownloadEDMSFile';
    
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
                    "Job_Number": item.Job_Number, 
                    "Rec_Key": [item.Rec_Key],
                }),
            });

            const json = await response.json();

            if ((json[0]["access"]).toLowerCase() == "success") {
                const base64File = json[1]['File_Data'];
                await FileSystem.writeAsStringAsync(item.localFileUri, base64File, { encoding: FileSystem.EncodingType.Base64 });

                const tempFiles = [...files];
                tempFiles[index].localFileExists = true;
                setFiles(tempFiles); 
            } else {
                setAgainItem(item);
                setAgainIndex(index);
                setFailedVisible(true);
            }
        } finally {
            const tempButtons = [...buttons];
            tempButtons[index] = false;
            setButtons(tempButtons);
        }    
    }

    const deleteFile = async (item, index) => {
        await FileSystem.deleteAsync(item.localFileUri);

        const tempFiles = [...files];
        tempFiles[index].localFileExists = false;
        setFiles(tempFiles); 

        setVisible(false);
    }

    const openFile = async (item) => {
        FileSystem.getContentUriAsync(item.localFileUri).then(cUri => {
            IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
                data: cUri,
                flags: 1,
            });
        });
    }

    const LeftContent = props => <Avatar.Icon {...props} icon="folder" />

    const Item = ({item, index}) => (
        <Card style={styles.card}>
            <Card.Title 
                title={item.Original_File_Name}
                subtitle={i18n.t('uploaded_at') + ' ' + moment(item.Date_Time).format('YYYY-MM-DD hh:mm A')}
                left={LeftContent} 
            />
            <Card.Content>
                <Text variant="bodyMedium">{item.Descriptions}</Text>
            </Card.Content>
            {
            (item.localFileExists) ?
            <Card.Actions>
                <Button icon="delete" onPress={() => {
                    setDeleteItem(item);
                    setDeleteIndex(index);
                    setVisible(true);
                }}>
                    {i18n.t('delete')}
                </Button> 
                <Button onPress={() => openFile(item)}>
                    {i18n.t('open')}
                </Button>  
            </Card.Actions>              
            :
            <Card.Actions>
                <Button loading={buttons[index]} mode="outlined" icon="download" onPress={() => downloadFile(item, index)}>
                    {item.File_Size}
                </Button> 
            </Card.Actions>
            }    
        </Card>
    );

    return (
        <View style={styles.container}>
            { 
            (files.length > 0) ? 
            <FlatList
                data={files}
                renderItem={({item, index}) => <Item item={item} index={index} />}
                keyExtractor={item => item.Rec_Key}
            /> 
            :
            <View style={styles.childContainer}>
                <Text variant="titleMedium">{i18n.t('no_file')}</Text> 
                <Button 
                    style={styles.card}
                    mode="contained" 
                    onPress={getFiles} 
                    loading={loading}>
                    {i18n.t('refresh')} 
                </Button>   
            </View>             
            } 
            <Portal>
                <Dialog visible={failedVisible} dismissable={false}>
                    <Dialog.Icon icon="alert" color="red" />
                    <Dialog.Content>
                        <Text variant="bodyLarge" style={styles.title}>
                            {i18n.t('download_error')}
                        </Text>
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button onPress={() => setFailedVisible(false)}>{i18n.t('cancel')}</Button>
                        <Button onPress={() => {
                            setFailedVisible(false);
                            downloadFile(againItem, againIndex);
                        }}>
                            {i18n.t('try_again')}
                        </Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>          
            <Portal>
                <Dialog visible={visible} dismissable={false}>
                    <Dialog.Icon icon="alert" />
                    <Dialog.Content>
                        <Text variant="bodyLarge" style={styles.title}>
                            {i18n.t('confirm_delete')}?
                        </Text>
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button onPress={() => setVisible(false)}>{i18n.t('cancel')}</Button>
                        <Button onPress={() => deleteFile(deleteItem, deleteIndex)}>{i18n.t('delete')}</Button>
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
    searchbar: {
        marginBottom: 10,
    },
    card: {
        marginVertical: 10,
    },
    title: {
        textAlign: 'center',
        marginVertical: 10,
    },
});
