# NestJS Real-Time Chat Backend

A scalable real-time communication backend built with **NestJS, TypeScript, MongoDB, Mongoose, Socket.IO, WebRTC, and Cloudinary**.

This backend provides the core APIs and real-time infrastructure for a modern communication platform, supporting direct messaging, groups, channels, communities, notifications, presence, and real-time communication.

## Overview

Volix is designed as a complete communication platform rather than a simple messaging application.

The backend handles:

- Authentication and authorization
- User profiles and account management
- Direct and group conversations
- Real-time messaging
- Groups and member permissions
- Public and private channels
- Communities and community organization
- Real-time presence and notifications
- Calls and meetings
- Media uploads and processing
- Reports and moderation
- Platform administration
- User privacy and settings
- Real-time events through Socket.IO

## Core Features

### Authentication & Authorization

- JWT-based authentication
- Protected API endpoints
- Role-based access control
- Permission management
- User session handling
- Account settings
- Privacy controls

### Users

- User profiles
- Profile information and avatars
- Online/offline presence
- Last seen status
- User settings
- Privacy settings
- User blocking and interaction controls

### Messaging

- Real-time messaging
- Direct conversations
- Group conversations
- Send, edit, and delete messages
- Message replies
- Message reactions
- Message pinning
- Typing indicators
- Read status
- Message attachments
- Media sharing
- Stickers
- GIF support
- Message-related notifications

### Groups

- Group creation and management
- Member management
- Member roles and permissions
- Administrator promotion
- Member removal
- Ban and unban functionality
- Group moderation
- Group settings
- Group invitations

### Channels

- Public channels
- Private channels
- Channel creation and management
- Channel posts
- Comments
- Reactions
- Post pinning
- Subscriber management
- Channel permissions
- Invite links

### Communities

- Community creation and management
- Organize groups and channels
- Community categories
- Member management
- Join approval
- Community invitations
- Community settings
- Community-level permissions

### Real-Time Communication

The backend uses **Socket.IO** through NestJS WebSocket gateways to provide real-time communication between connected clients.

Real-time functionality includes:

- Message delivery
- Message updates
- Message deletion
- Typing indicators
- Presence updates
- Notifications
- Group events
- Channel events
- Community events
- Membership updates
- Call and meeting events

### Calls & Meetings

Volix includes real-time communication infrastructure for calls and meetings.

- Call signaling
- Meeting signaling
- Participant events
- Connection state updates
- WebRTC integration
- Real-time call events

WebRTC is used for peer-to-peer real-time media communication, while the backend handles the signaling layer required to establish and coordinate connections.

### Notifications

- Real-time notifications
- Message notifications
- Group notifications
- Channel notifications
- Community notifications
- Membership notifications
- Call and meeting notifications
- Notification state management

### Media

Media handling is integrated with **Cloudinary**.

Supported use cases include:

- User avatars
- Message attachments
- Image sharing
- Media uploads
- Cloud-based media storage

### Reports & Moderation

The backend provides moderation functionality for maintaining platform safety and administration.

- User reports
- Content reports
- Moderation workflows
- Group moderation
- Channel moderation
- Community moderation
- Administrative actions

### Administration

Volix includes backend functionality for a dedicated administration dashboard.

Administrators can manage:

- Users
- Groups
- Channels
- Communities
- Reports
- Moderation
- Platform-level settings

## Technology Stack

| Technology | Purpose                      |
| ---------- | ---------------------------- |
| NestJS     | Backend framework            |
| TypeScript | Application language         |
| Node.js    | Runtime                      |
| MongoDB    | Primary database             |
| Mongoose   | MongoDB ODM                  |
| Socket.IO  | Real-time communication      |
| JWT        | Authentication               |
| WebRTC     | Real-time calls and meetings |
| Cloudinary | Media storage                |
| REST       | HTTP API                     |

### REST API

REST endpoints are responsible for operations such as:

- Authentication
- User management
- Conversations
- Messages
- Groups
- Channels
- Communities
- Notifications
- Reports
- Administration
- Settings

### WebSockets

Socket.IO is responsible for operations that require immediate updates between connected clients.

Examples include:

```text
Messaging
Presence
Typing indicators
Notifications
Group updates
Channel updates
Community updates
Call events
Meeting events
```

This separation allows standard CRUD and business operations to remain available through HTTP APIs while latency-sensitive events are handled through persistent WebSocket connections.

## Authentication

Volix uses JWT-based authentication for protected API access.

Authenticated requests use the standard bearer token pattern:

```http
Authorization: Bearer <access_token>
```

Authentication and authorization are handled separately so that authentication establishes the user's identity while authorization controls access to protected resources and actions.

## Database

MongoDB is used as the primary persistence layer with Mongoose for schema modeling and database operations.

The backend contains data models covering areas such as:

- Users
- Conversations
- Messages
- Groups
- Channels
- Communities
- Memberships
- Notifications
- Reports
- Calls
- Meetings
- Settings

## Environment Variables

Create a `.env` file in the project root.

Example:

```env
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d
GMAIL=example@gmail.com
GMAIL_APP_PASSWORD=your-gmail-app-password
APP_NAME=NestJS Real-Time Chat Backend
OTP_EXPIRATION_MINUTES=10
PORT=5000
DATABASE_URI=mongodb://localhost:27017/nestjs-realtime-chat
NODE_ENV=development
APP_DOMAIN=http://localhost:5000
```

Additional environment variables may be required depending on the enabled features and deployment environment.

## Getting Started

### Prerequisites

- Node.js 20+
- MongoDB
- npm, pnpm, or yarn

### Installation

Clone the repository:

```bash
git clone https://github.com/mohamed-elsayed-200/nestjs-realtime-chat.git

cd nestjs-realtime-chat
```

Install dependencies:

Or:

```bash
npm install
```

### Development

Start the development server:

```bash
pnpm dev
```

Or:

```bash
npm run dev
```

The server will start on:

```text
http://localhost:5000
```

## Production

Build the application:

```bash
npm build
```

Start the production server:

```bash
npm start:prod
```

## Scripts

Common development scripts include:

```bash
npm start
npm dev
npm start:debug
npm build
npm start:prod
npm lint
npm test
npm test:e2e
npm test:cov
```

Available scripts may vary depending on the current project configuration.

## Real-Time Events

The backend exposes real-time events through Socket.IO.

Examples of event categories include:

```text
messages
├── new
├── update
├── delete
├── reaction
└── read

typing
├── start
└── stop

presence
├── online
├── offline
└── last-seen

notifications
└── new

groups
├── created
├── updated
├── member-added
├── member-removed
└── settings-updated

channels
├── created
├── updated
├── post-created
└── subscriber-updated

communities
├── created
├── updated
├── member-added
└── member-removed

calls
├── started
├── joined
├── left
└── ended

meetings
├── created
├── joined
├── participant-updated
└── ended
```

Event names are implementation details and may change as the backend evolves.

## Security

The backend follows standard application security practices including:

- JWT authentication
- Protected routes
- Role and permission checks
- Request validation
- Controlled access to resources
- Environment-based secrets
- Separation of authentication and authorization

Sensitive configuration values should always be provided through environment variables or an appropriate secret-management solution rather than committed to source control.

## Related Projects

Volix is composed of multiple applications working with this backend:

### Web Application

The main Volix client application provides the user-facing communication experience.

### Admin Dashboard

A dedicated dashboard for platform administration, moderation, and management.

## Project

**Volix** is a real-time communication platform focused on providing a complete messaging and community experience with modern web technologies.

### Main Technologies

```text
NestJS
TypeScript
MongoDB
Mongoose
Socket.IO
WebRTC
JWT
Cloudinary
```

## License

This project is provided under the license included in the repository.

See the `LICENSE` file for details.
