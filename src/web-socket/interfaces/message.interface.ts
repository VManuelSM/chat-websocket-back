export interface Message {
    sender: string;
    textContent: string;
    type: string;
    timestamp: string;
    options?: MessageOption[];
}
export interface MessageOption {
    title: string;
    subtitle: string;
}
