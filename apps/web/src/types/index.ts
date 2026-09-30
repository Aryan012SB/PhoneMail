export interface User {
  id: string;
  phoneNumber: string;
  emailAddress: string;
  name: string;
  profilePicture?: string;
  language: string;
  aliases?: Alias[];
}

export interface Alias {
  id: string;
  userId: string;
  alias: string;
  createdAt: string;
}

export interface Attachment {
  id: string;
  emailId: string;
  filename: string;
  mimeType: string;
  size: number;
  storagePath: string;
}

export interface Recipient {
  id: string;
  emailId: string;
  recipientId?: string;
  recipientEmail: string;
  type: 'TO' | 'CC';
  status: string;
  readAt?: string;
}

export interface Email {
  id: string;
  senderId: string;
  subject: string;
  body: string;
  messageId: string;
  threadId?: string;
  parentEmailId?: string;
  isDraft: boolean;
  createdAt: string;
  updatedAt: string;
  sender: User;
  recipients?: Recipient[];
  attachments?: Attachment[];
  isRead?: boolean;
  isSpam?: boolean;
  isTrash?: boolean;
  isFavorite?: boolean;
  isArchived?: boolean;
  isImportant?: boolean;
}

export interface Conversation {
  id: string;
  subject: string;
  isGroup: boolean;
  members: User[];
  otherMembers: User[];
  latestEmail: {
    id: string;
    sender: User;
    body: string;
    createdAt: string;
    hasAttachments: boolean;
  };
  isRead: boolean;
  isFavorite: boolean;
  isSpam: boolean;
  isTrash: boolean;
  isArchived?: boolean;
  isImportant?: boolean;
}
