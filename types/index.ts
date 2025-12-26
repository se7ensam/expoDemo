export interface User {
  id: string;
  email: string | null;
  username?: string;
  avatar_url?: string;
}

export interface Message {
  id: string;
  text: string;
  sender: string; // email for now, or display name
  user_id: string;
  created_at: string;
  chat_id?: string; // Future proofing
}

export interface Chat {
  id: string;
  name: string;
  participants: User[];
  last_message?: Message;
}
