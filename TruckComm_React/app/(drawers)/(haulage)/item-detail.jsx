import { useState, useEffect, useContext } from "react";
import { View, StyleSheet } from "react-native";
import { DataTable, Text, Button, Portal, Modal, Divider, useTheme } from "react-native-paper";
import * as SecureStore from 'expo-secure-store';
import { useLocalSearchParams } from "expo-router";
import { I18n } from 'i18n-js';
import { LanguageContext } from '../../_layout';

export default function ItemDetail() {
    const theme = useTheme();
    const {language, setLanguage} = useContext(LanguageContext);

    const translations = {
        en: { 
            header_marking: 'MARKING',
            header_uom: 'UOM',
            header_qty: 'QTY',
            header_volume: 'VOLUME',
            header_weight: 'WEIGHT',
            marking: 'Marking',
            ref_number: 'Reference No',
            uom: 'Unit of Measurement',
            quantity: 'Quantity',
            actual_quantity: 'Actual Quantity',
            unit_weight: 'Unit Weight',
            total_weight: 'Total Weight',
            length: 'Length',
            width: 'Width',
            height: 'Height',
            total_volume: 'Total Volume',
            remark: 'Remark',
            no_item: 'No items found',
            refresh: 'Refresh',
        },
        zh: { 
            header_marking: '物品',
            header_uom: '计量单位',
            header_qty: '数量',
            header_volume: '体积',
            header_weight: '重量',
            marking: '物品',
            ref_number: '参考号',
            uom: '计量单位',
            quantity: '数量',
            actual_quantity: '实际数量',
            unit_weight: '单位重量',
            total_weight: '总重量',
            length: '长度',
            width: '宽度',
            height: '高度',
            total_volume: '总体积',
            remark: '备注',
            no_item: '暂无货物',
            refresh: '刷新',
        },
    };
    const i18n = new I18n(translations);
    i18n.locale = language;

    const paramItem = useLocalSearchParams();

    const [items, setItems] = useState([]);
    const [modalItem, setModalItem] = useState({});
    const [loading, setLoading] = useState(false);

    const [visible, setVisible] = useState(false);
    const showModal = () => setVisible(true);
    const hideModal = () => setVisible(false);
    const containerStyle = {backgroundColor: theme.colors.background, padding: 20};

    const headers = [
        i18n.t('marking'), 
        i18n.t('ref_number'),
        i18n.t('uom'),
        i18n.t('quantity'),
        i18n.t('actual_quantity'),
        i18n.t('unit_weight'),
        i18n.t('total_weight'),
        i18n.t('length'),
        i18n.t('width'),
        i18n.t('height'),
        i18n.t('total_volume'),
        i18n.t('remark'),
    ]

    const getValue = (header) => {
        if (header == headers[0]) {
            return (modalItem.Marking == '' ? '-' : modalItem.Marking)
        } else if (header == headers[1]) {
            return (modalItem.Ref_No == '' ? '-' : modalItem.Ref_No)
        } else if (header == headers[2]) {
            return (modalItem.UOM == '' ? '-' : modalItem.UOM)
        } else if (header == headers[3]) {
            return ('x ' + modalItem.QTY)
        } else if (header == headers[4]) {
            return ('x ' + modalItem.ActQty)
        } else if (header == headers[5]) {
            return (modalItem.UNIT_WEIGHT + ' (kg)')
        } else if (header == headers[6]) {
            return (modalItem.TOTAL_WEIGHT + ' (kg)')
        } else if (header == headers[7]) {
            return (modalItem.LENGTH + ' (cm)')
        } else if (header == headers[8]) {
            return (modalItem.WIDTH + ' (cm)')
        } else if (header == headers[9]) {
            return (modalItem.HEIGHT + ' (cm)')
        } else if (header == headers[10]) {
            return (modalItem.TOTAL_VOLUME + ' (cbm)')
        } else if (header == headers[11]) {
            return (modalItem.REMARKS == '' ? '-' : modalItem.REMARKS)
        }
    }

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

    useEffect(() => {
        getItems();
    }, []);

    return (
        <View style={{flex: 1}}>
            <DataTable>
                <DataTable.Header>
                    <DataTable.Title>{i18n.t('header_marking')}</DataTable.Title>
                    <DataTable.Title>{i18n.t('header_uom')}</DataTable.Title>
                    <DataTable.Title>{i18n.t('header_qty')}</DataTable.Title>
                    {/* <DataTable.Title>LENGTH</DataTable.Title>
                    <DataTable.Title>WIDTH</DataTable.Title>
                    <DataTable.Title>HEIGHT</DataTable.Title>
                    <DataTable.Title>UNIT_WEIGHT</DataTable.Title>
                    <DataTable.Title>ActQty</DataTable.Title>
                    <DataTable.Title>Ref_No</DataTable.Title> */}
                    <DataTable.Title>{i18n.t('header_volume')}</DataTable.Title>
                    <DataTable.Title>{i18n.t('header_weight')}</DataTable.Title>
                    {/* <DataTable.Title>Remarks</DataTable.Title> */}
                </DataTable.Header>
                {items.map((item) => (
                <DataTable.Row key={item.Marking} onPress={() => {
                    setModalItem(item);
                    showModal();
                }}>
                    <DataTable.Cell>{item.Marking}</DataTable.Cell>
                    <DataTable.Cell>{item.UOM}</DataTable.Cell>
                    <DataTable.Cell>{item.QTY}</DataTable.Cell>
                    <DataTable.Cell>{item.TOTAL_VOLUME}</DataTable.Cell>
                    <DataTable.Cell>{item.TOTAL_WEIGHT}</DataTable.Cell>
                </DataTable.Row>
                ))}
            </DataTable>   
            <Portal>
                <Modal visible={visible} onDismiss={hideModal} contentContainerStyle={containerStyle}>
                    <DataTable>
                        {headers.map((header) => (
                        <DataTable.Row key={header}>
                            <DataTable.Cell>{header + ': '}</DataTable.Cell>
                            <DataTable.Cell numeric={true}>{getValue(header)}</DataTable.Cell>
                        </DataTable.Row>
                        ))}
                    </DataTable>  
                </Modal>
            </Portal>
            { 
                (!(items.length > 0)) &&
                <View style={styles.childContainer}>
                    <Text variant="titleMedium">{i18n.t('no_item')}</Text> 
                    <Button 
                        style={styles.card}
                        mode="contained" 
                        onPress={getItems} 
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
    card: {
        marginVertical: 10,
    },
});