import { Message } from "./message.interface";

export interface DateOrderedMessages {
    date: string | Date;
    messages: Message[];
}