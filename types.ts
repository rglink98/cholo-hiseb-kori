
export type ActiveScreen = 'home' | 'menu' | 'links' | 'about' | 'user_management' | 'history' | 'profile' | 'docs' | 'audio_clips' | 'budget';

export type TransactionType = 'income' | 'expense' | 'dues' | 'post';

export interface User {
    id: string;
    username: string;
    email?: string;
    password?: string;
    status: 'pending' | 'approved';
    role: 'admin' | 'user';
    avatar?: string; // Optional Base64 uploaded avatar photo
    preferences?: {
        theme?: 'light' | 'dark';
        language?: 'bn' | 'en';
    };
}

export interface Income {
    id: string;
    date: string;
    name: string;
    enteredBy: string;
    type: string;
    item: string;
    receiptCount: number;
    amount: number;
    comment: string;
    image?: string; // Optional Base64 uploaded receipt image
}

export interface Expense {
    id: string;
    date: string;
    name: string;
    enteredBy: string;
    type: string;
    item: string;
    payeeName: string;
    amount: number;
    comment: string;
    image?: string; // Optional Base64 uploaded receipt image
}

export interface Dues {
    id: string;
    debtorName: string;
    item: string;
    amount: number;
    dueDate: string;
    enteredBy: string;
}

export interface Post {
    id: string;
    title: string;
    content: string;
    image?: string;
    date: string;
    enteredBy: string;
}

export interface LinkItem {
    id: string;
    title: string;
    url: string;
}

export interface AudioClip {
    id: string;
    title: string;
    audioUrl: string; // Base64 data URI or blob URL
    date: string;
    enteredBy: string;
    duration?: number; // in seconds
    category?: string; // folder or category name
    isTts?: boolean;
    ttsText?: string;
    ttsRate?: number;
    ttsPitch?: number;
    ttsVoiceName?: string;
}

export interface Budget {
    id: string;
    title: string;
    allocatedAmount: number;
    spentAmount: number;
    category: string;
    notes?: string;
    date: string;
    enteredBy: string;
}

