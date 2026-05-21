
import { View, StyleSheet, FlatList, ImageBackground, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { Avatar, Text, TextInput, HelperText, Button, 
    List, Portal, Dialog,IconButton,
 } from "react-native-paper";
import Ionicons from '@expo/vector-icons/Ionicons';
import React, { useEffect, useState,useContext } from 'react'
import { KeyboardAwareScrollView, KeyboardToolbar } from 'react-native-keyboard-controller';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { useLocalSearchParams } from "expo-router";
import moment from 'moment-timezone';
import * as ImagePicker from 'expo-image-picker';
import { I18n } from 'i18n-js';
import { LanguageContext } from '../../_layout';

const DriverUpdates = () => {
    const router = useRouter();
    const {language, setLanguage} = useContext(LanguageContext);
     const translations = {
        en: { 
            trailer_number: 'Trailer Number',
            container_Number: 'Container Number',
            pictures: 'Pictures',
            no_pictures: 'No pictures yet',
            seal_number: 'Seal Number',
            clear: 'Clear',
            submit: 'Submit',
            ok: 'OK',
            submitting: 'Submitting',
            success: 'Success',
            done: 'Done',
            failed: 'Failed',
            cancel: 'Cancel',
            try_again: 'Try again',
            picture_removed: 'Picture removed',
            undo: 'Undo',
        },
        zh: { 
            trailer_number: 'Trailer Number',
            container_Number: 'Container Number',
            pictures: 'Pictures',
            no_pictures: 'No pictures yet',
            seal_number: 'Seal Number',
            clear: 'Clear',
            submit: 'Submit',
            ok: 'OK',
            submitting: 'Submitting',
            success: 'Success',
            done: 'Done',
            failed: 'Failed',
            cancel: 'Cancel',
            try_again: 'Try again',
            picture_removed: 'Picture removed',
            undo: 'Undo',
        },
    };
    const i18n = new I18n(translations);
    i18n.locale = language;

    
    const paramItem = useLocalSearchParams();
    const item = useLocalSearchParams();
    
    const [isDoubleMount, setIsDoubleMount] = useState(false);
    const [trailerNo, setTrailerNo] = useState('');
    const [containerNo, setContainerNo] = useState('');
    const [containerNo2, setContainerNo2] = useState('');
    const [sealNo, setSealNo] = useState('');
    const [sealNo2, setSealNo2] = useState('');
    const [sendUpdateHelper, setSendUpdateHelper] = useState(false);
    const [loading, setLoading] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [dialogText, setDialogText] = useState('');
    const [items, setItems] = useState([]);

    const [secured, setSecured] = useState(true);
    const toggleSecured = () => setSecured(!secured);

    const [visible, setVisible] = useState(false);
    const [aiAccessToken, setAIAccessToken] = useState('');
    const [loadingText, setLoadingText] = useState('');
    const [file, setFile] = useState(null); // Stores the selected image URI
    const [error, setError] = useState(null); // Stores any error message
    const showDialog = () => setVisible(true);
    const hideDialog = () => setVisible(false);
    const [images, setImages] = useState([]);
    const [snackbarText, setSnackbarText] = useState('');
    const [snackbarVisible, setSnackbarVisible] = useState(false);
    const onToggleSnackBar = () => setSnackbarVisible(!snackbarVisible);
    const onDismissSnackBar = () => setSnackbarVisible(false);
    

    useEffect(() =>{
        setIsDoubleMount(false);
        getItems();
        getAIAuthToken();
    }, []);

    const sendUpdates = async () => {
        try{
            setLoading(true);
            setLoadingText("Sending updates, please wait...")
            console.log('Sending Driver Updates --> '); 
            const Web_Server = await SecureStore.getItemAsync('Web_Server');
            const Port = await SecureStore.getItemAsync('Port');
            const Auth_Token = await SecureStore.getItemAsync('Auth_Token');
            const Database_Server = await SecureStore.getItemAsync('Database_Server');
            const Database_Name = await SecureStore.getItemAsync('Database_Name');

            const User_ID = await SecureStore.getItemAsync('User_ID');
            const vehicle = await AsyncStorage.getItem('vehicleno');

            const API_URL = process.env.EXPO_PUBLIC_API_PROTOCOL + '://' 
                + Web_Server + ':' + Port
                + process.env.EXPO_PUBLIC_API_ROOT_PATH + 'DriverUpdates_Haulage';
                
            console.log('Driver Updates URL --> ',API_URL);   
            console.log('item --> ',item);    
            const payload ={
                    "Auth_Token": Auth_Token,
                    "Server_Name": Database_Server,
                    "DB_Name": Database_Name,
                    "Task_ID": item.Task_ID,
                    "Message_Type": process.env.EXPO_PUBLIC_Haulage_Type,
                    "Send_Notification": "F",
                    "Vehicle_Number": vehicle,
                    "Captured_DateTime": item.Assigned_DateTime,
                    "Driver_Number": User_ID,
                    "Added_DateTime": moment().tz('Singapore').format('YYYY-MM-DD HH:mm:ss'),
                    "User_ID": User_ID
                };
            if(trailerNo !== '') payload.Trailer_Number=trailerNo;
            if(containerNo !== '') payload.Container_Number=containerNo;
            if(containerNo2 !== '') payload.Container_Number2=containerNo2;  
            if(sealNo !== '') payload.Seal_Number=sealNo;
            if(sealNo2 !== '') payload.Seal_Number2=sealNo2;    

            console.log('Driver Updates payload --> ',payload);                
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            setLoading(false);
            setLoadingText("");
            const json = await response.json();
            console.log('Sending updates result-->', json);
            if(response.status===200){
                setDialogText("Information was successfully updated to TMS.")
                setVisible(true);
            }

        } catch (error) {
            console.error('Upload error:', error);
        }finally{
            setLoading(false);
            setLoadingText("")
        }
    }

    const pickImage = async (fieldname) => {
        // if (images.length > 1) {
        //     setSnackbarText('Only 1 picture is allowed at this moment');
        //     setSnackbarVisible(true);
        //     return;
        // }

            console.log('fieldname-->',fieldname)
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            // aspect: [4, 3],
            quality: 1,
            // base64: true,
        });

            console.log('selected photo result-->',result)
        if (!result.canceled) {   
            const photo =  {
                name: result.assets[0].fileName || 'photo.jpg',
                type: result.assets[0].type || 'image/jpeg',
                // iOS requires stripping 'file://' prefix sometimes, Android works with it
                uri: Platform.OS === 'ios' ? result.assets[0].uri.replace('file://', '') : result.assets[0].uri
            }
            console.log('selected photo -->',photo)
            processImage(fieldname,photo);
            setImages([
                ...images, { 
                    id: images.length, 
                    uri: result.assets[0].uri, 
                    base64: result.assets[0].base64,
                    mimeType: result.assets[0].mimeType 
                }
            ]);
        }
    };

    const getAIAuthToken = async() => {
        const API_URL = "https://dxuat.freightmaster.com.sg/dx/oauth/v1/token"; 
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'partnerid':'System-freightx-Innosys',
                'clientid':'PGCDAELISKXFFH4E6DVD',
                'Authorization':'Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJQR0NEQUVMSVNLWEZGSDRFNkRWRCIsImF1ZCI6IkRYIiwiaWF0IjoxNzQ0NjAzMDc3LCJleHAiOjE4MzkyNjg2Nzd9.Y1zcv9_KnbQNkGlAC87d7Ibe4atb1oTJ6NpIg3lSrkyNedr4mMWMKgBX6fJ9wLWdxGSDUcwkuvKPibFqEIsjXENlUzSwyeo93UeICI1CpV-FbBVMifswedayz1-g537nSJm1T3RVeSObS3hONVIwyl3kIRnViSNbukYCe7eXiRTB_li3afpw68Hg2fL16KTkvfyrxapYUW3ca_Qtg6Ge5P_asCyK00M_l86ErtQEKrT6dFwmMz53C480GMJyXEhnF9Ggvg5lVTx7JKWNP2QOxcQ-DJsAMqsoKOvHezB_-eMrbLHAHU80wd8MLe4mqXj_LCB6kfF0I5rx_SW7qtW2ig '
            },
        });
        
        console.log('response -->', json);
        const json = await response.json();
        console.log('AIAccessToken json response -->', json.accessToken);
        setAIAccessToken(json.accessToken);
    }

    const processImage = async (fieldname,photo) => {
        setLoadingText("Processing photo please wait...")
        setProcessing(true)
        const API_URL = "https://dxuat.freightmaster.com.sg/service/ai/extract-text/single-file"; 
        // getAIAuthToken();
        const User_ID = await SecureStore.getItemAsync('User_ID');
        const temPhoto ={
            name:  'photo.jpeg',
            type: 'image/jpeg',
            // iOS requires stripping 'file://' prefix sometimes, Android works with it
            uri: Platform.OS === 'ios' ? photo.uri.replace('file://', '') : photo.uri,
        };
        console.log('Photo--->:', photo);
        console.log('temPhoto--->:', temPhoto);
        const body = new FormData();
        body.append('file_extension','jpeg');
        body.append('doc_type','ctn_seal_image');//ctn_seal_image
        body.append('file_name',temPhoto.name)
        body.append('uploaded_by',User_ID)
        body.append('page_count','1')
        body.append('profile_id','e962e95b32f29955f4db8442b36c2266a3c75e062c76992e2bf5fc881bc2015f')
        body.append('partner_id','System-freightx-Innosys')
        body.append('uploaded_file', temPhoto);
        try {
            console.log('aiAccessToken--->:', aiAccessToken);
            console.log('body--->:', body);
            const response = await fetch(API_URL, 
                {
                    method: 'POST',
                    headers: {
                         'Authorization':'Bearer '+aiAccessToken,
                        // 'Content-Type': 'multipart/form-data;'  
                    },
                    body
                })
            console.log('Response--->:', response);
            const result = await response.json();
            console.log('Photo result:', result);
            if(response.status === 200){
                const aiRespond =result.AI_Respond[0];    
                console.log('AIRespond json object:', aiRespond);
                if(aiRespond.Container_Number !== "")
                    setContainerNo(aiRespond.Container_Number);
                if(aiRespond.Seal_Number !== "")
                    setSealNo(aiRespond.Seal_Number);
            }

        } catch (error) {
            console.error('Upload error:', error);
        }finally{
            setProcessing(false);
            setLoadingText("")
        }
    };
    
    const openCamera = async (fieldname) => {
        let result = await ImagePicker.launchCameraAsync({
            base64: true
        });

        if (!result.canceled) {
            
            const photo =  {
                name: result.assets[0].fileName || 'photo.jpg',
                type: result.assets[0].type || 'image/jpeg',
                // iOS requires stripping 'file://' prefix sometimes, Android works with it
                uri: Platform.OS === 'ios' ? result.assets[0].uri.replace('file://', '') : result.assets[0].uri
            }
            // setImages([
            //     ...images
                //  { 
                //     id: images.length, 
                //     uri: result.assets[0].uri, 
                //     base64: result.assets[0].base64,
                //     mimeType: result.assets[0].mimeType 
                // }
            // ]);
            console.log('camera photo -->',photo)
            //process photo using AI to get container or seal number
            processImage(fieldname,photo);
            
        }

    };  
  
    const getItems = async () => {
        try {
            setLoading(true);

            const Web_Server = await SecureStore.getItemAsync('Web_Server');
            const Port = await SecureStore.getItemAsync('Port');
            const Auth_Token = await SecureStore.getItemAsync('Auth_Token');
            const Database_Server = await SecureStore.getItemAsync('Database_Server');
            const Database_Name = await SecureStore.getItemAsync('Database_Name');
    
            const API_URL = process.env.EXPO_PUBLIC_API_PROTOCOL + '://' 
                + Web_Server + ':' + Port
                + process.env.EXPO_PUBLIC_API_ROOT_PATH + 'GetJobTripItem';
    
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
                    "PlanTripNo": paramItem.PLANTRIP_NO,
                    "Seq_No": paramItem.PLST_SEQNO
                }),
            });

            const json = await response.json();

            if ((json[0]["access"]).toLowerCase() == "success") {
                setItems(json.slice(1));
            }
        } finally {
            setLoading(false);
        }
    };
    
    const Item = ({item}) => (
        <ImageBackground 
            source={{ uri: item.uri }} 
            resizeMode='cover'
            style={styles.image}
        >
            {/* <TouchableOpacity
                style={styles.image}
                onPress={() => {
                    setModalImage(item);
                    setVisible(true);
                }}
            >
                <Ionicons 
                    name="remove-circle" 
                    size={24} 
                    color="white" 
                    style={{position: 'absolute', right: 0}}
                    onPress={() => {
                        setImages(images.filter(image => image.id !== item.id))
                    }}
                />
            </TouchableOpacity> */}
        </ImageBackground>
    );

    const TitleContent = props => (
        <View style={{flexDirection: 'row'}}>
            <Text variant="titleMedium">{i18n.t('pictures')}</Text>
            {
                (images.length > 0) && 
                <Avatar.Text style={{marginHorizontal: 10}} size={24} label={images.length} /> 
            }
        </View>
    )

    
    const RightContent = props => (
        <View style={{flexDirection: 'row'}}>
            <IconButton icon="camera" mode="outlined" size={20} onPress={pickImage} />
            {/* <IconButton icon="plus" mode="outlined" size={20} onPress={pickImage} /> */}
        </View>
    );


    return (
        <>
            <KeyboardAwareScrollView bottomOffset={62} contentContainerStyle={styles.container}>  
                <View style={{flex: 1}}>  
                    <View style={styles.childContainer}>
                        <TextInput style={styles.textInput}
                            label="Trailer No."
                            value={trailerNo}
                            onChangeText={text => setTrailerNo(text)}
                            />      
                        <View style={{flexDirection:"row", alignItems:"center"}}>
                            <TextInput style={[styles.textInput,]}
                                label="Container No."
                                value={containerNo}
                                onChangeText={text => setContainerNo(text)}
                            />   
                            
                            <View style={{flexDirection: 'row'}}>
                                <IconButton loading={processing} icon="camera" mode="outlined" size={20} onPress={() => openCamera('Container_Number')} />
                                <IconButton loading={processing}  icon="image-multiple" mode="outlined" size={20} onPress={() => pickImage('Container_Number')} />
                            </View>
                            {/* <Button style={{width:"10%", alignContent:"center"}}
                                icon="image-multiple" onPress={openCamera} loading={loading}/>   */}
                                
                        </View>   
                        {isDoubleMount &&
                        (<View><TextInput style={styles.textInput}
                            label="Container No.2"
                            value={containerNo2}
                            onChangeText={text => setContainerNo2(text)}
                        
                        /></View>)  }
                        
                        <View style={{flexDirection:"row", alignItems:"center", alignContent:"center"}}>
                            <TextInput style={[styles.textInput]}
                                label="Seal No."
                                value={sealNo}
                                onChangeText={text => setSealNo(text)}
                            /> 
                            <View style={{flexDirection: 'row'}}>
                                <IconButton loading={processing} icon="camera" mode="outlined" size={20} onPress={()=>openCamera('Seal_Number')} />
                                <IconButton loading={processing} icon="image-multiple" mode="outlined" size={20} onPress={() => pickImage('Container_Number')} />
                            </View>
                        </View>    
                        {isDoubleMount &&
                            (<><TextInput style={styles.textInput}
                            label="Seal No.2"
                            value={sealNo2}
                            onChangeText={text => setSealNo2(text)}
                            visible={isDoubleMount}
                        /> </>)  }
                        <HelperText type="error" visible={sendUpdateHelper}>
                            Sending updates failed!
                        </HelperText>  
                
                        <Button mode="contained" icon="send" onPress={sendUpdates} loading={loading}>
                            Send Updates
                        </Button> 
                         {/* <Button mode="contained" icon="camera" onPress={sendUpdates} loading={loading}>
                            Take Photo to Send Updates
                        </Button>  */}

                        {/* <View style={{flexDirection: 'row'}}>
                            <IconButton icon="camera" mode="outlined" size={20} onPress={openCamera} />
                            <IconButton icon="send" mode="outlined" size={20} onPress={sendUpdates} />
                        </View> */}
             
                        <View style={styles.imgContainer}>
                            <List.Item/>
                            {
                            (images.length > 0) ?
                            <View style={styles.flatListContainer}>
                                <FlatList
                                    data={images}
                                    renderItem={({item}) => <Item item={item} />}
                                    keyExtractor={(item) => item.id}
                                    horizontal={true}
                                /> 
                            </View>
                            :
                            <View style={styles.childContainer}>
                                <Text variant="bodyLarge">{i18n.t('no_pictures')}!</Text>
                            </View>
                        }
                    </View>
                    
                    <Portal>
                        <Dialog visible={loading} dismissable={false}>
                            <Dialog.Icon loading={true} icon="reload" />
                            <Dialog.Content>
                                <Text variant="bodyLarge" style={styles.title}>
                                    {loadingText}
                                </Text>
                            </Dialog.Content>
                        </Dialog>
                    </Portal>
                    <Portal>
                        <Dialog visible={visible} dismissable={false}>
                            <Dialog.Title>TruckComm</Dialog.Title>
                            <Dialog.Content>
                                <Text variant="bodyMedium">{dialogText}</Text>
                            </Dialog.Content>
                            <Dialog.Actions>
                                <Button onPress={hideDialog}>OK</Button>
                            </Dialog.Actions>
                        </Dialog>
                    </Portal>
                    </View> 
                </View> 
            </KeyboardAwareScrollView>       
            <KeyboardToolbar /> 
        </>
  )
}


const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 10,
    },
    imgContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    childContainer: {
        flex: 5,
    },
    textInput: {
        marginVertical: 10,
        width:"75%"
    },
    flatListContainer: {
        flex: 1,
        padding: 10,        
    }, 
});

export default DriverUpdates