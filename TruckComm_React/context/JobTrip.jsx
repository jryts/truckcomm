import { createContext, useContext, useState } from "react";
import { Text, useTheme } from "react-native-paper";
import { useLocale } from "./Language";

const JobTripContext = createContext({
    selectedGroup: null,
    selectGroup: (_group) => { },
    selectedItemDetail: null,
    selectItemDetail: (_detail) => { },
    selectedItem: null,
    selectItem: (_item) => { }
});

export const useJobTrip = () => useContext(JobTripContext);

export function JobTripProvider({ children }) {
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [selectedItem, setSelectedItem] = useState(null);
    const [selectedItemDetail, setSelectedItemDetail] = useState(null);
    return (
        <JobTripContext.Provider
            value={{
                selectedGroup,
                selectGroup: setSelectedGroup,
                selectedItemDetail,
                selectItemDetail: setSelectedItemDetail,
                selectedItem,
                selectItem: setSelectedItem
            }}
        >
            {children}
        </JobTripContext.Provider>
    );
}

export function useJobTypeName(type) {
    const { messages } = useLocale();
    switch (type) {
        case "P": return messages["pickup"];
        case "D": return messages["delivery"];
    }
}

export function useJobStatus(status) {
    const { messages } = useLocale();
    let statusKey, color;
    switch (status) {
        case "N":
            statusKey = "sent_out_status";
            color = "gray"
            break;
        case "A":
            statusKey = "accepted_status";
            color = "darkgreen"
            break;
        // case "Assigned":
        //     statusKey = "sent_out_status";
        //     color = "gray"
        //     break;
        case "P":
            statusKey = "in_progress_status";
            color = "lightblue"
            break;
        case "CP":
            statusKey = "complete_pickup_status";
            color = "lightgreen"
            break;
        case "S":
            statusKey = "complete_status";
            color = "lightgreen"
            break;
        case "WP":
            statusKey = "waiting_pickup_status";
            color = "brown"
            break;
        case "WD":
            statusKey = "waiting_delivery_status";
            color = "brown"
            break;
        case "C":
            statusKey = "cancelled_status";
            color = "gray"
            break;
        case "PD":
            statusKey = "partial_delivery_status";
            color = "orange"
            break;
        case "PP":
            statusKey = "partial_pickup_status";
            color = "orange"
            break;
        case "FD":
            statusKey = "failed_delivery_status";
            color = "red"
            break;
        case "FP":
            statusKey = "failed_pickup_status";
            color = "red"
            break;
    }
    return props => (
        <Text
            theme={{ colors: { onSurface: color } }}
            {...props}
        >
            {messages[statusKey]}
        </Text>
    );
}