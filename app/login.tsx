
import React, { useState } from 'react';
import { Alert, StyleSheet, View, TextInput, TouchableOpacity, Text, SafeAreaView, ActivityIndicator } from 'react-native';
import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    async function signInWithEmail() {
        setLoading(true);
        const { error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password,
        });

        if (error) Alert.alert(error.message);
        setLoading(false);
    }

    async function signUpWithEmail() {
        setLoading(true);
        const {
            data: { session },
            error,
        } = await supabase.auth.signUp({
            email: email,
            password: password,
        });

        if (error) Alert.alert(error.message);
        else if (!session) Alert.alert('Please check your inbox for email verification!');
        setLoading(false);
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.title}>Welcome Back</Text>

                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        onChangeText={(text) => setEmail(text)}
                        value={email}
                        placeholder="Email"
                        placeholderTextColor="#999"
                        autoCapitalize="none"
                    />
                </View>
                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        onChangeText={(text) => setPassword(text)}
                        value={password}
                        secureTextEntry={true}
                        placeholder="Password"
                        placeholderTextColor="#999"
                        autoCapitalize="none"
                    />
                </View>

                <View style={styles.buttonContainer}>
                    <TouchableOpacity
                        style={[styles.button, styles.signInButton]}
                        onPress={signInWithEmail}
                        disabled={loading}
                    >
                        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Sign In</Text>}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.button, styles.signUpButton]}
                        onPress={signUpWithEmail}
                        disabled={loading}
                    >
                        <Text style={[styles.buttonText, styles.signUpText]}>Sign Up</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        padding: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 40,
        textAlign: 'center',
        color: '#000',
    },
    inputContainer: {
        marginBottom: 16,
    },
    input: {
        backgroundColor: '#f2f2f7',
        padding: 16,
        borderRadius: 12,
        fontSize: 16,
    },
    buttonContainer: {
        marginTop: 20,
        gap: 12,
    },
    button: {
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    signInButton: {
        backgroundColor: '#3797EF', // Instagram Blue
    },
    signUpButton: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '#3797EF',
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    signUpText: {
        color: '#3797EF',
    },
});
