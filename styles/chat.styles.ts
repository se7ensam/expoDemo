import { StyleSheet, Platform } from 'react-native';

export const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        height: 50,
        alignItems: 'center',
        justifyContent: 'center',
        borderBottomWidth: 0.5,
        flexDirection: 'row',
    },
    headerTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerTitle: {
        fontWeight: 'bold',
        fontSize: 18,
    },
    logoutButton: {
        position: 'absolute',
        left: 16,
        padding: 8,
        zIndex: 10,
    },
    onlineBadge: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#34C759',
        marginLeft: 6,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    keyboardContainer: {
        flex: 1,
    },
    listContent: {
        paddingHorizontal: 16,
        paddingVertical: 16,
        gap: 12,
    },
    messageRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        marginBottom: 2,
    },
    avatarContainer: {
        marginRight: 8,
        marginBottom: 4,
    },
    avatarPlaceholder: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#ccc',
    },
    messageBubble: {
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 22,
    },
    messageContainer: {
        maxWidth: '75%',
    },
    messageText: {
        fontSize: 15,
        lineHeight: 20,
    },
    inputContainer: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderTopWidth: 0,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 24,
        paddingHorizontal: 12,
        height: 48,
    },
    cameraIcon: {
        padding: 4,
        borderRadius: 20,
        backgroundColor: '#3797EF20',
        marginRight: 8,
    },
    senderName: {
        fontSize: 12,
        color: '#888',
        marginBottom: 4,
        marginLeft: 4,
    },
    typingIndicator: {
        marginLeft: 16,
        marginBottom: 8,
        fontSize: 12,
        color: '#888',
        fontStyle: 'italic',
    },
    input: {
        flex: 1,
        fontSize: 16,
        height: '100%',
    },
    sendButton: {
        paddingLeft: 12,
    },
});
