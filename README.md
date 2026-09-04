# Bank Transaction System

A RESTful banking backend built with **Node.js**, **Express**, **MongoDB**, and **Mongoose**. The project focuses on core backend concepts involved in handling users, accounts, ledger-based balances, money transfers, authentication, idempotency, and atomic database transactions.

## Features

- User registration and login
- Password hashing with `bcryptjs`
- JWT-based authentication
- HTTP-only cookie support for authentication tokens
- JWT blacklist on logout
- Automatic expiry of blacklisted tokens using a MongoDB TTL index
- Protected account APIs
- One account per user
- Account status management (`ACTIVE`, `INACTIVE`, `FROZEN`)
- Ledger-based balance calculation
- Credit and debit ledger entries
- Atomic money transfers using MongoDB sessions/transactions
- Transaction states: `PENDING`, `COMPLETED`, `FAILED`, `REVERSED`
- Idempotency keys for transaction requests
- Protected system-user endpoint for adding initial funds
- Email service integration with Nodemailer

## Tech Stack

| Technology | Purpose |
|---|---|
| Node.js | JavaScript runtime |
| Express 5 | REST API framework |
| MongoDB | Database |
| Mongoose 9 | MongoDB ODM and schema/model layer |
| JSON Web Token | Authentication |
| bcryptjs | Password hashing |
| cookie-parser | Reading authentication cookies |
| Nodemailer | Email notifications |
| dotenv | Environment variable configuration |
| Nodemon | Development server reloads |

The dependency versions are defined in `package.json`. 

## Architecture

The application follows a layered Express structure:

```text
Bank-Transaction-System/
├── server.js
├── package.json
├── src/
│   ├── app.js
│   ├── config/
│   │   └── db.js
│   ├── controllers/
│   │   ├── account.controller.js
│   │   ├── auth.controller.js
│   │   └── transaction.controller.js
│   ├── middleware/
│   │   └── auth.middleware.js
│   ├── models/
│   │   ├── account.model.js
│   │   ├── blackList.model.js
│   │   ├── ledger.model.js
│   │   ├── transaction.model.js
│   │   └── user.model.js
│   ├── routers/
│   │   ├── account.routes.js
│   │   ├── auth.routes.js
│   │   └── transaction.routes.js
│   └── services/
│       └── email.service.js
└── .gitignore
```

`server.js` loads the environment, connects to MongoDB, imports the Express application, and starts the HTTP server. `src/app.js` registers JSON and cookie parsing middleware and mounts the authentication, account, and transaction routers. 

## Data Model

### User

Users contain an email, name, password, and a `systemUser` flag. The password is excluded from normal queries and is hashed with bcrypt before saving. Email and name are unique. `systemUser` is immutable once set. 

### Account

Each account belongs to a user and has a status and currency. A unique index on `user` ensures one account per user. The account model exposes `getBalance()`, which calculates the balance from ledger entries rather than storing a mutable balance field. 

```text
Balance = Total Credits - Total Debits
```

### Ledger

The ledger is append-oriented financial history. Each entry records the account, amount, transaction, and entry type (`CREDIT` or `DEBIT`). Important ledger fields are immutable, and middleware prevents update/delete operations on ledger records. Account and transaction fields are indexed for efficient lookups. 

### Transaction

Transactions connect a sender account with a receiver account and track the transaction lifecycle:

```text
PENDING → COMPLETED
        ↘ FAILED
        ↘ REVERSED
```

The `idempotencyKey` is required, indexed, and unique so the same key cannot represent multiple transaction records. Sender and receiver account fields are also indexed. 

### Token Blacklist

On logout, the JWT is stored in the blacklist. The blacklist schema uses timestamps and a TTL index on `createdAt`, configured to expire records after three days. This allows stale blacklist entries to be removed automatically by MongoDB. 

## Authentication Flow

The authentication flow is:

```text
Client
  ↓
Register / Login
  ↓
JWT issued
  ↓
JWT stored in HTTP-only cookie
  ↓
Protected request
  ↓
Auth middleware checks blacklist
  ↓
JWT verified with JWT_SECRET_KEY
  ↓
User loaded from MongoDB
  ↓
Request continues
```

The middleware also includes a separate system-user authorization path. It verifies the JWT, loads the user including `systemUser`, and rejects callers that are not system users.

On logout, the current token is stored in the blacklist and the authentication cookie is cleared. 

## Transaction Flow

A normal transfer follows a ten-step process implemented in `transaction.controller.js`:

```text
1. Validate request
        ↓
2. Validate idempotency key
        ↓
3. Check account status
        ↓
4. Calculate sender balance from ledger
        ↓
5. Create transaction as PENDING
        ↓
6. Create DEBIT ledger entry
        ↓
7. Create CREDIT ledger entry
        ↓
8. Mark transaction COMPLETED
        ↓
9. Commit MongoDB transaction
        ↓
10. Send notification
```

The database writes for the transaction and its ledger entries are performed using a MongoDB session/transaction so the money movement is treated as an atomic unit. The current implementation also contains an artificial `sleep(15000)` delay in the normal transfer path, which appears to be intended for demonstrating/testing transaction and concurrent-request behavior. 

### Double-entry representation

For a transfer of `100`:

```text
Sender Account ── DEBIT  100
Receiver Account ─ CREDIT 100
```

The sender's balance decreases by `100`, while the receiver's balance increases by `100`. Balances are derived from the ledger rather than directly updated on the account document. 

## Idempotency

Transaction creation requires an `idempotencyKey`. Before processing a request, the controller checks whether that key already exists and responds according to the existing transaction status.

```text
Same idempotency key
        ↓
Existing transaction?
   ↙             ↘
 YES              NO
  ↓                ↓
Return status     Process transaction
```

Supported existing states include `COMPLETED`, `PENDING`, `FAILED`, and `REVERSED`. The database also enforces uniqueness on the idempotency key.

## API Endpoints

### Authentication

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register a new user | Public |
| `POST` | `/api/auth/login` | Login and receive JWT authentication | Public |
| `POST` | `/api/auth/logout` | Blacklist current token and clear cookie | Public |

These routes are defined in `auth.routes.js`. 

### Accounts

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `POST` | `/api/accounts/create` | Create an account for the authenticated user | Required |
| `GET` | `/api/accounts/` | Get accounts belonging to the authenticated user | Required |
| `GET` | `/api/accounts/balance/:accountId` | Get the derived balance of an account | Required |

The account routes are protected by the authentication middleware, and the balance endpoint verifies that the account belongs to the authenticated user before calculating its balance. 

### Transactions

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `POST` | `/api/transactions/` | Create a transfer between accounts | User auth |
| `POST` | `/api/transactions/system/initial-funds` | Add initial funds from the system user's account | System-user auth |

The transaction routes apply the appropriate authentication middleware to each endpoint. 

## Getting Started

### Prerequisites

- Node.js
- MongoDB instance
- An SMTP/email provider if you want email functionality

### Installation

```bash
git clone https://github.com/DevDoshi19/Bank-Transaction-System.git
cd Bank-Transaction-System
npm install
```

### Environment Variables

Create a `.env` file in the project root.

```env
PORT=3000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET_KEY=your_jwt_secret

# Email configuration used by the email service
# Add the SMTP variables expected by src/services/email.service.js
```

The database connection reads `MONGODB_URI`, while JWT creation and verification use `JWT_SECRET_KEY`. 

### Run in development

```bash
npm run dev
```

The repository currently defines `dev` as `npx nodemon server.js`. 

The API defaults to port `3000` when `PORT` is not provided. 

## Example Request

### Create a transaction

```http
POST /api/transactions/
Content-Type: application/json
Authorization: Bearer <token>
```

```json
{
  "fromAccount": "<sender-account-id>",
  "toAccount": "<receiver-account-id>",
  "amount": 100,
  "idempotencyKey": "unique-client-generated-key"
}
```

The controller validates the required fields, verifies both accounts, checks account status, derives the sender balance from ledger entries, and then performs the transfer inside a MongoDB transaction. 

## Project Goals

This project is primarily focused on learning and demonstrating backend engineering concepts around financial transactions:

- REST API design
- Authentication and authorization
- Secure password storage
- JWT lifecycle management
- Database modeling with Mongoose
- Indexes and uniqueness constraints
- Ledger-based accounting
- MongoDB transactions and atomicity
- Idempotent transaction APIs
- Middleware-based access control
- Service-layer email integration

## Current Development Notes

This repository is a learning-oriented implementation and is still evolving. The current transaction controller intentionally contains a 15-second delay in the normal transaction flow for experimentation with transaction behavior and concurrent requests. Some email notification code in the transaction controller is currently commented out. 

For production use, additional work would be expected around stronger validation, error handling, transaction concurrency strategy, observability, automated tests, and deployment configuration.

## License

This project currently uses the `ISC` license as declared in `package.json`. 

## Author

**Dev Doshi**

GitHub: [@DevDoshi19](https://github.com/DevDoshi19)
