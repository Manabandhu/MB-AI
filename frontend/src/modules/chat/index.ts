// Public API of the chat module. Other modules and the app shell import only from here.

export { type Conversation, listConversations } from './api';
export { ChatBubble } from './components/ChatBubble';
export { ChatFrame, scrollToNewest } from './components/ChatFrame';
export { Composer } from './components/Composer';
export { type ChatContact, listChatContacts, useChatContacts } from './contacts';
export { moduleMeta } from './module';
