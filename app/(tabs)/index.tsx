import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { supabase } from '@/services/supabase';
import { router } from 'expo-router';
import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  FlatList,
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
import { styles } from '@/styles/chat.styles';

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
  const channelStatusRef = useRef<string>('CLOSED');
  const lastTypingEvent = useRef<number>(0);

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
    const now = Date.now();
    // Throttle: Only send if > 2000ms since last event
    if (text.length > 0 && channelRef.current && userEmail && (now - lastTypingEvent.current > 2000)) {
      lastTypingEvent.current = now;
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

  const renderItem = useCallback(({ item }: { item: Message }) => (
    <MessageItem
      item={item}
      currentUserId={currentUserId}
      userEmail={userEmail}
      igBlue={igBlue}
      igGray={igGray}
      igText={igText}
    />
  ), [currentUserId, userEmail, igBlue, igGray, igText]);

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

const MessageItem = React.memo(({ item, currentUserId, userEmail, igBlue, igGray, igText }: {
  item: Message;
  currentUserId: string | null;
  userEmail: string | null;
  igBlue: string;
  igGray: string;
  igText: string;
}) => {
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
});

MessageItem.displayName = 'MessageItem';
