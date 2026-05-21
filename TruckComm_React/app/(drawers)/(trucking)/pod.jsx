import { useState, useContext, useRef } from 'react';
import { View, StyleSheet, FlatList, ImageBackground, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { Button, Text, TextInput, HelperText, useTheme, Portal, Dialog, Snackbar, Divider, List, IconButton, Avatar, Icon, Modal } from 'react-native-paper';
import Signature from "react-native-signature-canvas";
import SignatureScreen from "react-native-signature-canvas";
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { useLocalSearchParams, useRouter } from "expo-router";
import * as ImagePicker from 'expo-image-picker';
import Ionicons from '@expo/vector-icons/Ionicons';
import moment from 'moment-timezone';
import * as Clipboard from 'expo-clipboard';
import { I18n } from 'i18n-js';
import { LanguageContext } from '../../_layout';
import { startActivityAsync, ActivityAction } from 'expo-intent-launcher';
import DeviceInfo from 'react-native-device-info';
import { KeyboardAwareScrollView, KeyboardToolbar } from 'react-native-keyboard-controller';

export default function POD() {
    const router = useRouter();
    const {language, setLanguage} = useContext(LanguageContext);

    const translations = {
        en: { 
            recipient_name: 'Recipient Name',
            recipient_required: 'Recipient Name is required',
            pictures: 'Pictures',
            no_pictures: 'No pictures yet',
            signature: 'Signature',
            clear: 'Clear',
            clear_signature: 'Clear Signature',
            submit: 'Submit',
            signature_pad: 'Signature Pad',
            ok: 'OK',
            signature_required: 'Please sign first',
            pictures_required: 'Please choose at least one picture',
            submitting: 'Submitting',
            success: 'Success',
            done: 'Done',
            failed: 'Failed',
            cancel: 'Cancel',
            try_again: 'Try again',
            picture_removed: 'Picture removed',
            undo: 'Undo',
            settings: 'Settings',
            camera_permission: 'This app requires camera permission to take a photo',
            clear_signature: 'Clear Signature',
            max_picture: 'Maximum 10 pictures are allowed',
        },
        zh: { 
            recipient_name: '收货人名字',
            recipient_required: '收货人名字 必填',
            pictures: '照片',
            no_pictures: '尚未有照片',
            signature: '签名',
            clear: '清除',
            clear_signature: '清除签名',
            submit: '呈交',
            signature_pad: '签名面板',
            ok: '好的',
            signature_required: '请先签名',
            pictures_required: '请选择至少一张照片',
            submitting: '呈交中',
            success: '成功',
            done: '确认',
            failed: '失败',
            cancel: '取消',
            try_again: '重试',
            picture_removed: '照片已移除',
            undo: '撤回',
            settings: '设置',
            camera_permission: '此应用需要摄像头权限，以拍摄照片',
            max_picture: '最多只允许10张照片',
        },
    };
    const i18n = new I18n(translations);
    i18n.locale = language;

    const ref = useRef();
    const theme = useTheme();
    const item = useLocalSearchParams();

    const [text, setText] = useState('');
    const [helperVisible, setHelperVisible] = useState(false);
    const [pictureText, setPictureText] = useState('');
    const [pictureVisible, setPictureVisible] = useState(false);
    const [signatureText, setSignatureText] = useState('');
    const [signatureVisible, setSignatureVisible] = useState(false);

    const [images, setImages] = useState([]);
    const [base64Signature, setbase64Signature] = useState('');
    
    const [snackbarText, setSnackbarText] = useState('');
    const [snackbarVisible, setSnackbarVisible] = useState(false);
    const onToggleSnackBar = () => setSnackbarVisible(!snackbarVisible);
    const onDismissSnackBar = () => setSnackbarVisible(false);

    const [undoText, setUndoText] = useState('');
    const [undoVisible, setUndoVisible] = useState(false);
    const [prevImages, setPrevImages] = useState([]);
    const onToggleUndo = () => setUndoVisible(!snackbarVisible);
    const onDismissUndo = () => {
        setImages(prevImages);
        setUndoVisible(false);
    } 

    const [loading, setLoading] = useState(false);
    const [failedVisible, setFailedVisible] = useState(false);
    const [successVisible, setSuccessVisible] = useState(false);

    const [modalImage, setModalImage] = useState({});
    const [visible, setVisible] = useState(false);
    const showModal = () => setVisible(true);
    const hideModal = () => setVisible(false);
    const containerStyle = {backgroundColor: 'white', padding: 20};

    const [cameraVisible, setCameraVisible] = useState(false);
    const showCameradDialog = () => setCameraVisible(true);
    const hideCameraDialog = () => setCameraVisible(false);
    const pkg = DeviceInfo.getBundleId();

    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsMultipleSelection: true,
            // allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
            base64: true,
            // selectionLimit: 2
            // orderedSelection: true,
        });

        if (!result.canceled) {
            if ((images.length + result.assets.length) > 10) {
                setPictureText(i18n.t('max_picture') + '!');
                setPictureVisible(true);
                setTimeout(() => {
                    setPictureVisible(false);
                }, 5000);
                return;
            }

            const imageArray = [...images];
            let currentID = 0;
            if (images.length > 0) {
                currentID = images[images.length - 1].id + 1;
            }

            for (var i = 0; i < result.assets.length; i++) {
                console.log(result.assets[i].fileName);
                imageArray.push({
                    id: currentID + i, 
                    uri: result.assets[i].uri, 
                    base64: result.assets[i].base64,
                    mimeType: result.assets[i].mimeType                    
                });
            }
            setImages(imageArray);
        }
    };

    const openCamera = async () => {
        const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
        
        if (cameraStatus === 'granted') {
            if (images.length >= 10) {
                setPictureText(i18n.t('max_picture') + '!');
                setPictureVisible(true);
                setTimeout(() => {
                    setPictureVisible(false);
                }, 5000);
                return;
            }

            let result = await ImagePicker.launchCameraAsync({
                base64: true
            });

            if (!result.canceled) {
                let currentID = 0;
                if (images.length > 0) {
                    currentID = images[images.length - 1].id + 1;
                }

                setImages([
                    ...images, { 
                        id: currentID, 
                        uri: result.assets[0].uri, 
                        base64: result.assets[0].base64,
                        mimeType: result.assets[0].mimeType 
                    }
                ]);
            }
        } else {
            showCameradDialog();
        }
    };  

    const openSettings = () => {
        hideCameraDialog();
        startActivityAsync(ActivityAction.APPLICATION_DETAILS_SETTINGS,
            { data: 'package:' + pkg }
        );
        openCamera();
    }

    const validation = () => {
        if (text.trim() == '') {
            setHelperVisible(true);
            setTimeout(() => {
                setHelperVisible(false);
            }, 5000);
            return false;          
        }

        if (!(images.length > 0)) {
            // setSnackbarText(i18n.t('pictures_required'));
            // setSnackbarVisible(true);
            // return false;
            setPictureText(i18n.t('pictures_required') + '!');
            setPictureVisible(true);
            setTimeout(() => {
                setPictureVisible(false);
            }, 5000);
            return false;
        }

        return true;
    }

    const uploadPOD = async (img) => {
        try {
            setLoading(true);
            
            const Web_Server = await SecureStore.getItemAsync('Web_Server');
            const Port = await SecureStore.getItemAsync('Port');
            const Auth_Token = await SecureStore.getItemAsync('Auth_Token');
            const Database_Server = await SecureStore.getItemAsync('Database_Server');
            const Database_Name = await SecureStore.getItemAsync('Database_Name');
            
            const username = await SecureStore.getItemAsync('User_ID');
            const vehicle = await AsyncStorage.getItem('vehicleno');

            const API_URL = process.env.EXPO_PUBLIC_API_PROTOCOL + '://' 
                + Web_Server + ':' + Port
                + process.env.EXPO_PUBLIC_API_ROOT_PATH + 'AddPOD';

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
                    "Recipient_Name": text,
                    "Vehicle_Number": vehicle,
                    "POD_File": img.split(',')[1],
                    "POD_FileName": 'POD_' + item.Task_ID + '_' + username + '.png',
                    "POD_Name": 'POD_' + item.Task_ID + '_' + username + '.png',
                    "POD_DateTime": moment().tz('Singapore').format('YYYY-MM-DD HH:mm:ss'),
                    "Identity_Number": "",
                    "Image1_File": images[0] == null ? "" : images[0].base64,
                    "Image1_Name": images[0] == null ? "" : 'IMG_' + item.Task_ID + '_' + username + '_1.' + images[0].mimeType.split('/')[1],
                    "Image2_File": images[1] == null ? "" : images[1].base64,
                    "Image2_Name": images[1] == null ? "" : 'IMG_' + item.Task_ID + '_' + username + '_2.' + images[1].mimeType.split('/')[1],
                    "Image3_File": images[2] == null ? "" : images[2].base64,
                    "Image3_Name": images[2] == null ? "" : 'IMG_' + item.Task_ID + '_' + username + '_3.' + images[2].mimeType.split('/')[1],
                    "Image4_File": images[3] == null ? "" : images[3].base64,
                    "Image4_Name": images[3] == null ? "" : 'IMG_' + item.Task_ID + '_' + username + '_4.' + images[3].mimeType.split('/')[1],
                    "Image5_File": images[4] == null ? "" : images[4].base64,
                    "Image5_Name": images[4] == null ? "" : 'IMG_' + item.Task_ID + '_' + username + '_5.' + images[4].mimeType.split('/')[1],
                    "Image6_File": images[5] == null ? "" : images[5].base64,
                    "Image6_Name": images[5] == null ? "" : 'IMG_' + item.Task_ID + '_' + username + '_6.' + images[5].mimeType.split('/')[1],
                    "Image7_File": images[6] == null ? "" : images[6].base64,
                    "Image7_Name": images[6] == null ? "" : 'IMG_' + item.Task_ID + '_' + username + '_7.' + images[6].mimeType.split('/')[1],
                    "Image8_File": images[7] == null ? "" : images[7].base64,
                    "Image8_Name": images[7] == null ? "" : 'IMG_' + item.Task_ID + '_' + username + '_8.' + images[7].mimeType.split('/')[1],
                    "Image9_File": images[8] == null ? "" : images[8].base64,
                    "Image9_Name": images[8] == null ? "" : 'IMG_' + item.Task_ID + '_' + username + '_9.' + images[8].mimeType.split('/')[1],
                    "Image10_File": images[9] == null ? "" : images[9].base64,
                    "Image10_Name": images[9] == null ? "" : 'IMG_' + item.Task_ID + '_' + username + '_10.' + images[9].mimeType.split('/')[1],
                }),
            });
            
            const json = await response.json();

            
            // if ((json[0]['access']).toLowerCase() == 'success') {
            //     setSuccessVisible(true);
            // } else {
            //     setFailedVisible(true);
            // }
        } finally {
            setLoading(false);
            setSuccessVisible(true);
        }
    }

    const submitPOD = (img) => {
        if (!validation()) {
            return;
        }
        setbase64Signature(img);   
        uploadPOD(img);
    }

    const emptyPOD = () => {
        if (!validation()) {
            return;
        }

        setSignatureText(i18n.t('signature_required') + '!');
        setSignatureVisible(true);
        setTimeout(() => {
            setSignatureVisible(false);
        }, 5000);
    }

    const Item = ({item}) => (
        <ImageBackground 
            source={{ uri: item.uri }} 
            resizeMode='cover'
            style={styles.image}
        >
            <TouchableOpacity
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
                        setPrevImages(images);
                        setImages(images.filter(image => image.id !== item.id))
                        setUndoText(i18n.t('picture_removed'));
                        setUndoVisible(true);
                    }}
                />
            </TouchableOpacity>
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
            <IconButton icon="camera" mode="outlined" size={20} onPress={openCamera} />
            <IconButton icon="plus" mode="outlined" size={20} onPress={pickImage} />
        </View>
    );

    const SigTitleContent = props => (
        <Text variant="titleMedium">{i18n.t('signature')}</Text>
    )

    // const style = `
    //     body {
    //         height: 100%;
    //     }

    //     .m-signature-pad {
    //         position: absolute;
    //         height: 80%;
    //     }

    //     .m-signature-pad--footer {
    //         .button {
    //             background-color: ` + theme.colors.primary + `
    //         }
    //     }
    // `;
    const style = `.m-signature-pad--footer {display: none; margin: 0px;}`;

    const handleClear = () => {
        ref.current.clearSignature();
    };

    const handleConfirm = () => {
        ref.current.readSignature();
    };

    return (
        <>
            <KeyboardAwareScrollView bottomOffset={62} contentContainerStyle={styles.container}> 
                <View style={styles.container}> 
                    <TextInput
                        label={i18n.t('recipient_name')}
                        value={text}
                        onChangeText={text => setText(text)}
                    /> 
                    <HelperText type="error" visible={helperVisible}>
                        {i18n.t('recipient_required') + '!'}
                    </HelperText> 
                    <View style={styles.imgContainer}>
                        <List.Item title={TitleContent} right={RightContent} />
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
                        <HelperText type="error" visible={pictureVisible}>
                            {pictureText}
                        </HelperText>
                    </View>
                    <List.Item title={SigTitleContent} />
                    <View style={styles.imgContainer}>
                        {/* <Signature webStyle={style}
                            onOK={(img) => {submitPOD(img)}}
                            onEmpty={() => {emptyPOD()}}
                            // descriptionText={i18n.t('signature_pad')}
                            // clearText={i18n.t('clear')}
                            // confirmText={i18n.t('submit')}
                        /> */}
                        <SignatureScreen 
                            ref={ref} 
                            webStyle={style} 
                            onOK={(img) => {submitPOD(img)}}
                            onEmpty={() => {emptyPOD()}}  
                        />
                        <HelperText type="error" visible={signatureVisible}>
                            {signatureText}
                        </HelperText>
                        <Portal>
                            <Dialog visible={loading} dismissable={false}>
                                <Dialog.Icon icon="reload" />
                                <Dialog.Content>
                                    <Text variant="bodyLarge" style={styles.title}>
                                        {i18n.t('submitting')}
                                    </Text>
                                </Dialog.Content>
                            </Dialog>
                        </Portal>
                        <Portal>
                            <Dialog visible={successVisible} dismissable={false}>
                                <Dialog.Icon icon="check-circle" color="green" />
                                <Dialog.Content>
                                    <Text variant="bodyLarge" style={styles.title}>
                                        {i18n.t('success')}
                                    </Text>
                                </Dialog.Content>
                                <Dialog.Actions>
                                    <Button onPress={() => router.navigate('/(drawers)/(trucking)/home')}>
                                        {i18n.t('done')}
                                    </Button>
                                </Dialog.Actions>
                            </Dialog>
                        </Portal>
                        <Portal>
                            <Dialog visible={failedVisible} dismissable={false}>
                                <Dialog.Icon icon="alert" color="red" />
                                <Dialog.Content>
                                    <Text variant="bodyLarge" style={styles.title}>
                                        {i18n.t('failed')}
                                    </Text>
                                </Dialog.Content>
                                <Dialog.Actions>
                                    <Button onPress={() => setFailedVisible(false)}>{i18n.t('cancel')}</Button>
                                    <Button onPress={() => {
                                        setFailedVisible(false);
                                        uploadPOD(base64Signature);
                                    }}>
                                        {i18n.t('try_again')}
                                    </Button>
                                </Dialog.Actions>
                            </Dialog>
                        </Portal>
                    </View>
                    <View style={{flexDirection: 'row', justifyContent: 'space-between', margin: 10}}>
                        <Button mode="outlined" onPress={handleClear}>
                            {i18n.t('clear_signature')}
                        </Button>
                        <Button mode="contained" onPress={handleConfirm}>
                            {i18n.t('submit')}
                        </Button>
                    </View>
                    {/* <View>
                    <Snackbar
                        visible={snackbarVisible}
                        onDismiss={onDismissSnackBar}
                        action={{
                            label: i18n.t('ok'),
                            onPress: () => {
                                onDismissSnackBar
                            },
                        }}>
                        {snackbarText}
                    </Snackbar>
                    <Snackbar
                        visible={undoVisible}
                        onDismiss={() => setUndoVisible(false)}
                        action={{
                            label: i18n.t('undo'),
                            onPress: () => {
                                onDismissUndo()
                            },
                        }}>
                        {undoText}
                    </Snackbar>
                    </View> */}
                    <Portal>
                        <Modal visible={visible} onDismiss={hideModal}>
                            <ImageBackground
                                style={styles.fullscreen} 
                                source={{ uri: modalImage.uri }} 
                                resizeMode='cover'
                            >
                                <TouchableOpacity
                                    style={styles.fullscreen}
                                    onPress={() => {
                                        setVisible(false);
                                    }}
                                >
                                </TouchableOpacity>
                            </ImageBackground>
                        </Modal>
                    </Portal>
                    <Portal>
                        <Dialog visible={cameraVisible} dismissable={false}>
                            <Dialog.Title>TruckComm</Dialog.Title>
                            <Dialog.Content>
                                <Text variant="bodyMedium">{i18n.t('camera_permission')}</Text>
                            </Dialog.Content>
                            <Dialog.Actions>
                                <Button onPress={hideCameraDialog}>{i18n.t('cancel')}</Button>
                                <Button onPress={openSettings}>{i18n.t('settings')}</Button>
                            </Dialog.Actions>
                        </Dialog>
                    </Portal>
                </View>
            </KeyboardAwareScrollView>       
            <KeyboardToolbar /> 
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    imgContainer: {
        flex: 2,
    },  
    sigContainer: {
        flex: 3,
    },
    image: {
        width: 150,
        height: 150,
    },
    flatListContainer: {
        flex: 1,
        padding: 10,        
    }, 
    childContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        textAlign: 'center',
        marginVertical: 10,
    },
    fullscreen: {
        width: '100%',
        height: '100%',
    },
    button: {
        width: '50%',
        margin: 10,
    }
});
