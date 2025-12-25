import 'react-native-url-polyfill/auto'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://youfyjlqodhciwocrfbw.supabase.co'
const supabaseKey = 'sb_publishable_-2a_NOXc-HGv-MZOkpyMkA_H1-hJIKw'

// Custom storage adapter to handle SSR/Node environment during build
const ExpoStorage = {
    getItem: (key: string) => {
        if (typeof window !== 'undefined') {
            return AsyncStorage.getItem(key);
        }
        return Promise.resolve(null);
    },
    setItem: (key: string, value: string) => {
        if (typeof window !== 'undefined') {
            return AsyncStorage.setItem(key, value);
        }
        return Promise.resolve();
    },
    removeItem: (key: string) => {
        if (typeof window !== 'undefined') {
            return AsyncStorage.removeItem(key);
        }
        return Promise.resolve();
    },
};

export const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        storage: ExpoStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
    },
})
