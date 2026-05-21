import { StyleSheet, View } from "react-native";
import { ActivityIndicator } from "react-native-paper";

const styles = StyleSheet.create({
    container: {
        display: "flex",
        flex: 1,
        justifyContent: "center",
        alignItems: "center"
    }
});

export default function Loading() {
    return (
        <View style={styles.container}>
            <ActivityIndicator
                animating
                size="large"
            />
        </View>
    );
}
