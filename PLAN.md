# MS Graph TUI - Outlook, Teams & Slack Integration

## Executive Summary

A Terminal User Interface (TUI) application that provides unified access to Microsoft Outlook, Teams, and Slack. Built with TypeScript/Node.js, it offers efficient keyboard-driven workflows for email, calendar, messaging, and collaboration.

## Core Design Principles

1. **Progressive Feature Set**: Start with essential Outlook features, expand to Teams/Slack
2. **Plugin Architecture**: Extensible design for adding new chat systems
3. **Keyboard-First**: Vim-like keybindings for power users
4. **Unified Interface**: Consistent UX across different services
5. **Offline Capable**: Local caching for offline viewing and draft composition

## Tech Stack

### Core Technologies
- **Language**: TypeScript 5.x (type safety, better tooling)
- **Runtime**: Node.js 20+ LTS
- **TUI Framework**: `blessed` or `ink`
  - `blessed`: Mature, low-level terminal control, better performance
  - `ink`: React-based, easier component composition (recommended for MVP)
- **Build Tool**: esbuild or tsc + rollup

### API SDKs
- **Microsoft Graph**: `@microsoft/microsoft-graph-client` (v3.x)
- **Slack**: `@slack/web-api` (v6.x)
- **Authentication**: `@azure/identity`, `@azure/msal-node`

### Supporting Libraries
- **Storage**: `conf` (configuration), `lowdb` (local cache)
- **HTTP**: `axios` or `got` (resilient HTTP client)
- **CLI**: `commander` (command-line parsing)
- **Logging**: `winston` or `pino`
- **Date/Time**: `date-fns` (lightweight)
- **Markdown Rendering**: `marked-terminal` (for rich emails)

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                     TUI Application                      │
├─────────────────────────────────────────────────────────┤
│  ┌──────────┬──────────┬──────────┬──────────────────┐ │
│  │  Email   │ Calendar │ Contacts │  Chat/Messages   │ │
│  │  View    │   View   │   View   │      View        │ │
│  └──────────┴──────────┴──────────┴──────────────────┘ │
├─────────────────────────────────────────────────────────┤
│              Navigation & Layout Manager                 │
├─────────────────────────────────────────────────────────┤
│  ┌──────────┬──────────┬──────────┬──────────────────┐ │
│  │  Email   │ Calendar │ Contacts │   Chat Plugin    │ │
│  │  Module  │  Module  │  Module  │    Manager       │ │
│  └──────────┴──────────┴──────────┴──────────────────┘ │
├─────────────────────────────────────────────────────────┤
│              Service Layer (API Clients)                 │
│  ┌──────────────┬──────────────┬──────────────────────┐│
│  │   MS Graph   │    Slack     │   Plugin Interface   ││
│  │    Client    │    Client    │   (Teams, Discord)   ││
│  └──────────────┴──────────────┴──────────────────────┘│
├─────────────────────────────────────────────────────────┤
│         Authentication & Token Management                │
│  ┌──────────────┬──────────────┬──────────────────────┐│
│  │  OAuth2/MSAL │ Slack OAuth  │   Token Storage      ││
│  └──────────────┴──────────────┴──────────────────────┘│
├─────────────────────────────────────────────────────────┤
│        Local Storage & Cache (SQLite or JSON)           │
└─────────────────────────────────────────────────────────┘
```

## Directory Structure

```
/
├── src/
│   ├── index.ts                    # Application entry point
│   ├── app.ts                      # Main TUI app logic
│   │
│   ├── cli/                        # CLI command handling
│   │   ├── commands.ts
│   │   └── config.ts
│   │
│   ├── ui/                         # TUI components
│   │   ├── layout/
│   │   │   ├── MainLayout.tsx      # Overall layout
│   │   │   ├── Sidebar.tsx         # Navigation sidebar
│   │   │   └── StatusBar.tsx       # Bottom status bar
│   │   │
│   │   ├── views/
│   │   │   ├── EmailView.tsx       # Email list & detail
│   │   │   ├── CalendarView.tsx    # Calendar grid
│   │   │   ├── ContactsView.tsx    # Contact list
│   │   │   ├── ChatView.tsx        # Unified chat interface
│   │   │   └── ComposeView.tsx     # Email/message composer
│   │   │
│   │   └── components/             # Reusable UI components
│   │       ├── Table.tsx
│   │       ├── Modal.tsx
│   │       ├── Input.tsx
│   │       └── Notification.tsx
│   │
│   ├── services/                   # API client services
│   │   ├── graph/
│   │   │   ├── GraphClient.ts      # MS Graph base client
│   │   │   ├── EmailService.ts     # Email operations
│   │   │   ├── CalendarService.ts  # Calendar operations
│   │   │   ├── ContactsService.ts  # Contacts operations
│   │   │   └── TeamsService.ts     # Teams chat operations
│   │   │
│   │   ├── slack/
│   │   │   └── SlackClient.ts      # Slack API client
│   │   │
│   │   └── plugins/                # Plugin system
│   │       ├── ChatPlugin.ts       # Plugin interface
│   │       └── PluginManager.ts    # Plugin loader
│   │
│   ├── auth/                       # Authentication
│   │   ├── AuthManager.ts          # Auth orchestration
│   │   ├── MSALProvider.ts         # Microsoft auth
│   │   ├── SlackAuthProvider.ts    # Slack auth
│   │   └── TokenStore.ts           # Secure token storage
│   │
│   ├── storage/                    # Data persistence
│   │   ├── ConfigStore.ts          # User configuration
│   │   ├── CacheManager.ts         # API response cache
│   │   └── DraftStore.ts           # Draft emails/messages
│   │
│   ├── core/                       # Core utilities
│   │   ├── Logger.ts               # Logging utility
│   │   ├── EventBus.ts             # Event system
│   │   ├── Keybindings.ts          # Keyboard shortcuts
│   │   └── types.ts                # Shared TypeScript types
│   │
│   └── utils/                      # Helper functions
│       ├── date.ts
│       ├── formatting.ts
│       └── validation.ts
│
├── tests/                          # Test files
│   ├── unit/
│   ├── integration/
│   └── fixtures/
│
├── config/                         # Configuration files
│   ├── default.json
│   └── keybindings.json
│
├── docs/                           # Documentation
│   ├── ARCHITECTURE.md
│   ├── API.md
│   ├── PLUGINS.md
│   └── KEYBINDINGS.md
│
├── .env.example                    # Environment template
├── package.json
├── tsconfig.json
└── README.md
```

## Feature Breakdown

### Phase 1: Core Outlook Features (MVP)

#### 1.1 Email Management
- **Inbox View**
  - List emails with: sender, subject, date, read/unread status
  - Pagination (50 emails per page)
  - Keyboard navigation (j/k, arrow keys)
  - Search/filter (by sender, subject, date range)

- **Email Detail View**
  - Display full email content (HTML → markdown)
  - Show attachments with download option
  - Thread view for conversations

- **Compose & Reply**
  - Compose new email modal
  - Reply/Reply-all/Forward
  - Basic formatting (markdown → HTML)
  - Attachment support
  - Save drafts locally

- **Email Actions**
  - Mark as read/unread
  - Delete/Archive
  - Move to folder
  - Flag/Unflag
  - Categories/Tags

#### 1.2 Calendar
- **Calendar Views**
  - Daily agenda
  - Weekly grid
  - Monthly view (ASCII calendar)

- **Event Management**
  - Create new event with form
  - Edit existing events
  - Delete/Cancel events
  - View event details (attendees, location, description)

- **Event Operations**
  - Accept/Decline meeting invitations
  - Check availability
  - Set reminders
  - Recurring events support

#### 1.3 Contacts
- **Contact List**
  - Searchable directory
  - Display: name, email, phone, organization

- **Contact Detail**
  - Full contact information
  - Recent email history
  - Quick actions (email, schedule meeting)

- **Contact Management**
  - Add/Edit/Delete contacts
  - Import from vCard
  - Export contacts

### Phase 2: Teams & Chat Integration

#### 2.1 Microsoft Teams
- **Chat View**
  - List recent chats
  - Display messages in conversation
  - Send messages
  - @mentions support

- **Channels**
  - List teams and channels
  - Post to channels
  - React to messages

- **Presence**
  - Show user availability status
  - Set custom status

#### 2.2 Slack Integration
- **Workspace Management**
  - Connect multiple Slack workspaces
  - Switch between workspaces

- **Channels & DMs**
  - List channels and direct messages
  - Send/receive messages
  - Thread support
  - Reactions

- **Slack-specific Features**
  - Slash commands
  - File sharing
  - Search messages

#### 2.3 Unified Chat Interface
- **Message List**
  - Combine Teams + Slack into single view (optional)
  - Filter by source
  - Unread message count

- **Quick Switch**
  - Hotkey to switch between email/calendar/chat
  - Recent conversations list

### Phase 3: Advanced Features

#### 3.1 Notifications
- **Real-time Updates**
  - MS Graph webhooks for emails
  - Slack RTM API for messages
  - Desktop notifications
  - Sound alerts (optional)

#### 3.2 Search
- **Global Search**
  - Search across emails, calendar, messages
  - Full-text search with filters
  - Save search queries

#### 3.3 Productivity
- **Rules & Automation**
  - Email filters/rules
  - Auto-responses
  - Smart folders

- **Quick Actions**
  - Keyboard shortcuts for common tasks
  - Bulk operations
  - Email templates

#### 3.4 Plugin System
- **Plugin Architecture**
  - Plugin discovery and loading
  - Standard plugin interface
  - Sandbox for plugin execution

- **Potential Plugins**
  - Discord integration
  - Telegram support
  - Mattermost
  - Custom chat systems

## Authentication Flow

### Microsoft Graph (Azure AD)

```
1. User runs: graph-tui login microsoft
2. Open browser to Azure AD OAuth URL
3. User authenticates and grants permissions
4. Redirect to localhost callback with auth code
5. Exchange code for access + refresh tokens
6. Store tokens securely (encrypted, OS keychain)
7. Auto-refresh tokens when expired
```

**Required Permissions**:
- `Mail.ReadWrite` - Email operations
- `Calendars.ReadWrite` - Calendar operations
- `Contacts.ReadWrite` - Contacts
- `Chat.ReadWrite` - Teams chat
- `User.Read` - User profile

### Slack OAuth

```
1. User runs: graph-tui login slack
2. Open browser to Slack OAuth page
3. User selects workspace and authorizes
4. Callback with access token
5. Store token securely
```

**Required Scopes**:
- `channels:read`, `channels:write`
- `chat:write`
- `im:read`, `im:write`
- `users:read`

## User Interface Design

### Main Layout

```
┌─────────────────────────────────────────────────────────────┐
│ MS Graph TUI v1.0 | user@company.com | Ctrl+? Help          │
├──────────┬──────────────────────────────────────────────────┤
│          │                                                   │
│  Email   │  ┌─────────────────────────────────────────────┐ │
│  Calendar│  │ From: Alice <alice@example.com>             │ │
│> Chat    │  │ Subject: Q4 Planning Meeting                 │ │
│  Contacts│  │ Date: 2026-01-15 10:30 AM                    │ │
│  Tasks   │  │                                              │ │
│          │  │ Hi team,                                     │ │
│  ───────│  │                                              │ │
│          │  │ Let's sync on Q4 priorities. I've prepared  │ │
│  Teams   │  │ an agenda...                                 │ │
│  Slack   │  │                                              │ │
│          │  │ [View 3 Attachments]                         │ │
│          │  └─────────────────────────────────────────────┘ │
│          │                                                   │
│          │  [r]eply [f]orward [a]rchive [d]elete [n]ext    │
├──────────┴──────────────────────────────────────────────────┤
│ 2 unread emails | Next meeting in 30min | Slack: 5 messages │
└─────────────────────────────────────────────────────────────┘
```

### Key Bindings (Vim-inspired)

**Global**:
- `Ctrl+C` - Quit
- `Ctrl+?` or `?` - Help
- `Tab` - Switch panes
- `/` - Search
- `:` - Command mode
- `Esc` - Cancel/Back

**Navigation**:
- `1-9` - Switch to view (1=Email, 2=Calendar, 3=Chat, etc.)
- `j/k` or `↓/↑` - Move down/up
- `h/l` or `←/→` - Move left/right
- `g/G` - Go to top/bottom
- `Enter` - Open/Select

**Email View**:
- `c` - Compose new email
- `r` - Reply
- `R` - Reply all
- `f` - Forward
- `d` - Delete
- `a` - Archive
- `*` - Star/Flag
- `m` - Mark as read/unread
- `v` - Move to folder

**Calendar View**:
- `n` - New event
- `e` - Edit event
- `d` - Delete event
- `a` - Accept invitation
- `x` - Decline invitation
- `t` - Today (jump to current date)

**Chat View**:
- `c` - Compose message
- `@` - Mention user
- `r` - React to message
- `t` - View thread

## Data Model

### Email Message
```typescript
interface Email {
  id: string;
  subject: string;
  from: EmailAddress;
  to: EmailAddress[];
  cc?: EmailAddress[];
  body: string;
  bodyPreview: string;
  receivedDateTime: Date;
  isRead: boolean;
  hasAttachments: boolean;
  attachments?: Attachment[];
  conversationId: string;
  flag?: FlagStatus;
  categories?: string[];
}
```

### Calendar Event
```typescript
interface CalendarEvent {
  id: string;
  subject: string;
  start: DateTime;
  end: DateTime;
  location?: string;
  attendees?: Attendee[];
  organizer: EmailAddress;
  body?: string;
  isAllDay: boolean;
  recurrence?: RecurrencePattern;
  reminder?: number; // minutes before
  responseStatus?: ResponseStatus;
}
```

### Chat Message
```typescript
interface ChatMessage {
  id: string;
  source: 'teams' | 'slack' | string; // Extensible
  conversationId: string;
  sender: User;
  content: string;
  timestamp: Date;
  attachments?: Attachment[];
  reactions?: Reaction[];
  threadId?: string;
  mentions?: Mention[];
}
```

### Plugin Interface
```typescript
interface ChatPlugin {
  name: string;
  version: string;
  authenticate(): Promise<void>;
  getConversations(): Promise<Conversation[]>;
  getMessages(conversationId: string): Promise<ChatMessage[]>;
  sendMessage(conversationId: string, content: string): Promise<void>;
  onMessage(callback: (message: ChatMessage) => void): void;
}
```

## Configuration

### User Configuration (`~/.config/graph-tui/config.json`)
```json
{
  "theme": "dark",
  "keybindings": "vim",
  "notifications": {
    "enabled": true,
    "sound": false,
    "desktop": true
  },
  "email": {
    "defaultFolder": "inbox",
    "pageSize": 50,
    "autoMarkAsRead": true
  },
  "calendar": {
    "defaultView": "week",
    "workingHours": {
      "start": "09:00",
      "end": "17:00"
    }
  },
  "chat": {
    "unifiedView": true,
    "enabledPlugins": ["teams", "slack"]
  },
  "plugins": {
    "slack": {
      "workspaces": ["workspace1", "workspace2"]
    }
  }
}
```

## Error Handling

### Network Errors
- Retry with exponential backoff
- Display offline status in status bar
- Queue operations for retry when back online

### Authentication Errors
- Detect expired tokens
- Auto-refresh when possible
- Prompt user to re-authenticate if refresh fails

### API Rate Limits
- Respect rate limit headers
- Implement request throttling
- Show rate limit status

## Security Considerations

1. **Token Storage**: Use OS keychain (keytar library)
2. **Encryption**: Encrypt local cache with user password
3. **Permissions**: Minimal required scopes
4. **HTTPS Only**: All API calls over TLS
5. **Input Validation**: Sanitize all user input
6. **Plugin Sandboxing**: Isolate plugin execution

## Performance Optimization

1. **Lazy Loading**: Load data on-demand
2. **Virtual Scrolling**: For long lists (>1000 items)
3. **Caching**: Cache API responses with TTL
4. **Debouncing**: Debounce search/filter operations
5. **Pagination**: Load data in chunks
6. **Background Sync**: Sync data in background thread

## Testing Strategy

### Unit Tests
- Service layer (API clients)
- Authentication logic
- Data transformations
- Utility functions

### Integration Tests
- MS Graph API integration (with mock server)
- Slack API integration
- Plugin loading

### E2E Tests
- Key user workflows
- Navigation between views
- Compose and send email

## Deployment & Distribution

### NPM Package
```bash
npm install -g ms-graph-tui
graph-tui login microsoft
graph-tui
```

### Binary Distribution
- Use `pkg` or `nexe` to create standalone binaries
- Distribute via GitHub Releases
- Support: Linux, macOS, Windows

## Milestones

### M1: Foundation (Weeks 1-2)
- ✓ Project setup
- ✓ Authentication (MS Graph)
- ✓ Basic TUI layout
- ✓ Email list view

### M2: Core Email Features (Weeks 3-4)
- ✓ Email detail view
- ✓ Compose email
- ✓ Email actions (delete, archive, etc.)

### M3: Calendar & Contacts (Weeks 5-6)
- ✓ Calendar view
- ✓ Event management
- ✓ Contacts list

### M4: Teams Integration (Weeks 7-8)
- ✓ Teams authentication
- ✓ Chat view
- ✓ Send/receive messages

### M5: Slack & Plugin System (Weeks 9-10)
- ✓ Plugin architecture
- ✓ Slack plugin
- ✓ Plugin documentation

### M6: Polish & Release (Weeks 11-12)
- ✓ Bug fixes
- ✓ Performance optimization
- ✓ Documentation
- ✓ Release v1.0

## Open Questions

1. **TUI Framework**: `ink` vs `blessed`?
   - **Recommendation**: Start with `ink` (React familiarity, faster dev)

2. **Local Storage**: SQLite vs JSON files?
   - **Recommendation**: `lowdb` (JSON) for simplicity, migrate to SQLite if needed

3. **Real-time Updates**: Polling vs Webhooks?
   - **Recommendation**: Start with polling, add webhooks later

4. **Plugin Distribution**: NPM packages vs local files?
   - **Recommendation**: Both - NPM for official, local for custom

## Success Criteria

- [ ] Successfully authenticate with MS Graph and Slack
- [ ] View and send emails via TUI
- [ ] View and create calendar events
- [ ] Send/receive Teams messages
- [ ] Send/receive Slack messages
- [ ] Responsive TUI (60fps scrolling)
- [ ] < 200MB memory footprint
- [ ] Plugin system working with at least 1 custom plugin
- [ ] Cross-platform (Linux, macOS, Windows)
- [ ] Comprehensive documentation

## Future Enhancements (Post v1.0)

- Offline mode with full sync
- Email threading improvements
- Rich text editor for emails
- Multiple account support
- AI-powered features (smart replies, email summarization)
- Mobile app integration
- Voice input
- Accessibility (screen reader support)
- Themes and customization
- Collaboration features (shared calendars)

---

**Document Version**: 1.0
**Last Updated**: 2026-01-15
**Author**: Claude (AI Assistant)
