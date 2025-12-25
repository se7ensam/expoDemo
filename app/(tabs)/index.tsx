import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';
import React, { useEffect, useState, useRef } from 'react';
import {
  FlatList,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  LayoutAnimation,
  UIManager,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RealtimeChannel } from '@supabase/supabase-js';

// Enable LayoutAnimation on Android
if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface Message {
  id: string;
  text: string;
  sender: string; // Keeping for backward compatibility or display
  user_id: string; // The real owner
  created_at: string;
}

export default function ChatScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();

  // Instagram Colors
  const igBlue = '#3797EF';
  const igGray = isDark ? '#262626' : '#EFEFEF';
  const igText = isDark ? '#FFFFFF' : '#000000';
  const igInputBg = isDark ? '#262626' : '#EFEFEF';

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [typingUser, setTypingUser] = useState<string | null>(null);

  const channelRef = useRef<RealtimeChannel | null>(null);
  const typingTimeoutRef = useRef<any>(null);

  useEffect(() => {
    // Get current user
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setCurrentUserId(user.id);
        setUserEmail(user.email || 'User');
      }
    });

    fetchMessages();

    // Subscribe to realtime changes AND broadcast events
    const channel = supabase
      .channel('public:messages')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          const newMessage = payload.new as Message;
          setMessages((current) => {
            if (current.find(m => m.id === newMessage.id)) return current;
            return [...current, newMessage];
          });
        }
      )
      .on('broadcast', { event: 'typing' }, (payload) => {
        if (payload.payload.user !== userEmail) {
          setTypingUser(payload.payload.user.split('@')[0]);
          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = setTimeout(() => {
            setTypingUser(null);
          }, 3000);
        }
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [userEmail]);

  const fetchMessages = async () => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
    } else {
      setMessages(data || []);
    }
    setLoading(false);
  };

  const handleInputChange = (text: string) => {
    setInputText(text);
    if (text.length > 0 && channelRef.current && userEmail) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'typing',
        payload: { user: userEmail },
      });
    }
  };

  const sendMessage = async () => {
    if (inputText.trim().length === 0) return;
    if (!currentUserId) {
      Alert.alert('Error', 'No user logged in. Please log out and log in again.');
      return;
    }

    const textToSend = inputText;
    setInputText('');

    const { error } = await supabase.from('messages').insert({
      text: textToSend,
      sender: userEmail || 'user', // We can deprecate this or use it for display name later
      user_id: currentUserId,
    });

    if (error) {
      Alert.alert('Error sending message', error.message);
    }
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        Alert.alert('Error', error.message);
      } else {
        router.replace('/login');
      }
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const renderItem = ({ item }: { item: Message }) => {
    // Check match by ID (preferred) or fallback to sender email match for legacy messages
    const isMe = (currentUserId && item.user_id === currentUserId) || (userEmail && item.sender === userEmail);
    const senderName = item.sender.includes('@') ? item.sender.split('@')[0] : item.sender;

    return (
      <View
        style={[
          styles.messageRow,
          isMe ? { justifyContent: 'flex-end' } : { justifyContent: 'flex-start' },
        ]}>
        {!isMe && (
          <View style={styles.avatarContainer}>
            <View style={styles.avatarPlaceholder} />
          </View>
        )}
        <View style={styles.messageContainer}>
          {!isMe && (
            <Text style={styles.senderName}>{senderName}</Text>
          )}
          <View
            style={[
              styles.messageBubble,
              isMe
                ? { backgroundColor: igBlue, borderBottomRightRadius: 4 }
                : { backgroundColor: igGray, borderBottomLeftRadius: 4 },
            ]}>
            <Text
              style={[
                styles.messageText,
                isMe ? { color: '#fff' } : { color: igText },
              ]}>
              {item.text}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#000' : '#fff', paddingTop: insets.top }]}>
      {/* Custom Header */}
      <View style={[styles.header, { borderBottomColor: igGray }]}>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Text style={{ color: igText, fontSize: 12 }}>Log Out</Text>
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={[styles.headerTitle, { color: igText }]}>
            {userEmail ? userEmail.split('@')[0] : 'InstaChat'}
          </Text>
          <View style={styles.onlineBadge} />
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={igBlue} />
        </View>
      ) : (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardContainer}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
          <FlatList
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 16 }]}
          />
          <View style={[styles.inputContainer, { backgroundColor: isDark ? '#000' : '#fff', paddingBottom: Platform.OS === 'android' ? 12 : 8 }]}>
            {typingUser && (
              <Text style={styles.typingIndicator}>{typingUser} is typing...</Text>
            )}
            <View style={[styles.inputWrapper, { backgroundColor: igInputBg }]}>
              <View style={styles.cameraIcon}>
                <IconSymbol name="camera.fill" size={24} color={igBlue} />
              </View>
              <TextInput
                style={[styles.input, { color: igText }]}
                value={inputText}
                onChangeText={handleInputChange}
                placeholder="Message..."
                placeholderTextColor="#888"
              />
              {inputText.length > 0 && (
                <TouchableOpacity onPress={sendMessage} style={styles.sendButton}>
                  <Text style={{ color: igBlue, fontWeight: '600' }}>Send</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </KeyboardAvoidingView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
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
  headerTitleContainer: { // New container to align text and badge
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
    zIndex: 10, // Ensure clickable
  },
  onlineBadge: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#34C759', // Green
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
    // maxWidth constraint moved to messageContainer
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
    backgroundColor: '#3797EF20', // Light blue bg
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
