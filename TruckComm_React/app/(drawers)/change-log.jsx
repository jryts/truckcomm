import { View, StyleSheet } from "react-native";
import { List, Divider, Text } from "react-native-paper";
import * as Application from 'expo-application';

export default function ChangeLog() {
    return (
        <View style={styles.container}>
            <List.Section>
                <List.Subheader>Version 1.0.0</List.Subheader> 
                <Text variant="bodyLarge" style={{marginHorizontal: 25}}>
                    {
                        '\u2022 First release \n\n' +
                        'Features: \n' +
                        '\u2022 Receive tasks from the planner \n' +
                        '\u2022 View the cargo items \n' + 
                        '\u2022 Chat with the planner \n' + 
                        '\u2022 Download EDMS files \n' + 
                        '\u2022 Submit the proof of delivery \n'
                    }
                </Text>            
            </List.Section>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 10
    },
    childContainer: {
        flex: 1, 
        alignItems: 'center', 
        justifyContent: 'center',
    },
});