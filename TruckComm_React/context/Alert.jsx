import { createContext, useContext, useState } from "react";
import { Button, Dialog, Portal, Snackbar, Text } from "react-native-paper";
import { useLocale } from "./Language";

const AlertContext = createContext({
    dialog({ titleKey: _titleKey, contentKey: _contentKey }) { },
    toast({ exception: _exception, messageKey: _messageKey }) { }
});

export const useAlert = () => useContext(AlertContext);

export function AlertDialogProvider({ children }) {

    const { messages } = useLocale();

    const [dialogVisible, setDialogVisible] = useState(false);
    const closeDialog = () => setDialogVisible(false);
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");

    const [toastVisible, setToastVisible] = useState(false);
    const closeToast = () => setToastVisible(false);
    const [message, setMessage] = useState("");

    return (
        <AlertContext.Provider
            value={{
                dialog({ titleKey = "", contentKey }) {
                    setDialogVisible(true);
                    setTitle(messages[titleKey]);
                    setContent(messages[contentKey]);
                },
                toast({ exception, messageKey }) {
                    setToastVisible(true);
                    setMessage(exception?.toString() || messages[messageKey]);
                }
            }}
        >
            {children}
            <Portal>
                <Dialog
                    visible={dialogVisible}
                    onDismiss={closeDialog}
                >
                    <Dialog.Title>{title}</Dialog.Title>
                    <Dialog.Content>
                        <Text variant="bodyMedium">{content}</Text>
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button onPress={closeDialog}>{messages["alert_close"]}</Button>
                    </Dialog.Actions>
                </Dialog>
                <Snackbar
                    visible={toastVisible}
                    onDismiss={closeToast}
                    onIconPress={closeToast}
                >
                    {message}
                </Snackbar>
            </Portal>
        </AlertContext.Provider>
    );
}
