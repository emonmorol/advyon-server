# 📁 Advyon Server - Folder Structure Documentation

> **Purpose**: This document provides a comprehensive overview of the Advyon Server project structure, designed to help developers and AI assistants understand the organization and architecture of the codebase.

---

## 🏗️ Project Architecture Overview

This is a **Node.js/Express/TypeScript** backend server following a **modular MVC architecture** with MongoDB/Mongoose for data persistence.

**Tech Stack:**
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: MongoDB (via Mongoose ODM)
- **Validation**: Zod
- **Authentication**: JWT (jsonwebtoken)
- **File Upload**: Multer + Cloudinary
- **Testing**: Jest + Supertest
- **Code Quality**: ESLint + Prettier

---

## 📂 Root Directory Structure

```
advyon-server/
├── src/                          # Source code directory
├── dist/                         # Compiled JavaScript output (build artifacts)
├── node_modules/                 # NPM dependencies
├── module_example/               # Example module template for reference
├── .env                          # Environment variables (not in version control)
├── .env.example                  # Example environment variables template
├── .eslintrc.json                # ESLint configuration
├── .eslintignore                 # ESLint ignore patterns
├── .prettierrc.json              # Prettier code formatting configuration
├── .gitignore                    # Git ignore patterns
├── package.json                  # NPM dependencies and scripts
├── package-lock.json             # Locked dependency versions
├── tsconfig.json                 # TypeScript compiler configuration
├── jest.config.ts                # Jest testing framework configuration
├── postman_collection.json       # API endpoint collection for testing
└── README.md                     # Project documentation
```

---

## 🎯 Source Code Structure (`src/`)

```
src/
├── app/                          # Main application logic
│   ├── modules/                  # Feature modules (domain-driven design)
│   ├── middlewares/              # Express middleware functions
│   ├── routes/                   # Route aggregation and registration
│   ├── errors/                   # Error handling utilities
│   ├── utils/                    # Shared utility functions
│   ├── config/                   # Configuration files
│   ├── interface/                # Global TypeScript interfaces
│   ├── builder/                  # Query builder utilities
│   └── DB/                       # Database initialization
├── app.ts                        # Express app configuration
└── server.ts                     # Server entry point
```

---

## 🧩 Core Directories Explained

### 1️⃣ **`src/app/modules/`** - Feature Modules

Each module represents a distinct business domain/feature and follows a consistent structure:

```
modules/
├── user/                         # User management module
│   ├── user.model.ts             # Mongoose schema & model
│   ├── user.interface.ts         # TypeScript interfaces/types
│   ├── user.validation.ts        # Zod validation schemas
│   ├── user.route.ts             # Express route definitions
│   ├── user.controller.ts        # Request handlers
│   ├── user.service.ts           # Business logic layer
│   ├── user.utils.ts             # Module-specific utilities
│   ├── user.constant.ts          # Module constants
│   ├── user.test.ts              # Unit/integration tests
│   ├── profile.model.ts          # Related profile model
│   ├── role.model.ts             # Role model
│   └── user-role.model.ts        # User-role relationship model
│
└── admin/                        # Admin management module
    ├── admin.model.ts            # (if needed) Admin-specific models
    ├── admin.interface.ts        # Admin TypeScript types
    ├── admin.validation.ts       # Admin request validation schemas
    ├── admin.route.ts            # Admin route definitions
    ├── admin.controller.ts       # Admin request handlers
    ├── admin.service.ts          # Admin business logic
    └── admin.constant.ts         # Admin constants
```

#### **Module File Responsibilities:**

| File | Purpose |
|------|---------|
| `*.model.ts` | Mongoose schema definitions, model creation, and database structure |
| `*.interface.ts` | TypeScript type definitions and interfaces for type safety |
| `*.validation.ts` | Zod schemas for request validation (body, params, query) |
| `*.route.ts` | Express router configuration and endpoint definitions |
| `*.controller.ts` | Request/response handling, calling services, sending responses |
| `*.service.ts` | Core business logic, database operations, data transformations |
| `*.utils.ts` | Helper functions specific to the module |
| `*.constant.ts` | Module-level constants (enums, status codes, etc.) |
| `*.test.ts` | Jest test suites for the module |

---

### 2️⃣ **`src/app/middlewares/`** - Express Middleware

```
middlewares/
├── auth.ts                       # JWT authentication & authorization middleware
├── validateRequest.ts            # Zod schema validation middleware
├── globalErrorhandler.ts         # Centralized error handling middleware
└── notFound.ts                   # 404 route handler
```

**Key Middleware Functions:**
- **`auth()`**: Verifies JWT tokens and checks user roles/permissions
- **`validateRequest()`**: Validates incoming requests against Zod schemas
- **`globalErrorhandler()`**: Catches and formats all errors consistently
- **`notFound()`**: Handles undefined routes (404 errors)

---

### 3️⃣ **`src/app/routes/`** - Route Aggregation

```
routes/
└── index.ts                      # Central route registry
```

**Purpose**: Aggregates all module routes and mounts them to the Express app.

**Example Structure:**
```typescript
const moduleRoutes = [
  { path: '/users', route: UserRoutes },
  { path: '/admin', route: AdminRoutes },
];
```

---

### 4️⃣ **`src/app/errors/`** - Error Handling

```
errors/
├── appError.ts                   # Custom application error class
├── handleZodError.ts             # Zod validation error formatter
├── handleValidationError.ts      # Mongoose validation error formatter
├── handleCastError.ts            # Mongoose cast error formatter
└── handleDuplicateError.ts       # MongoDB duplicate key error formatter
```

**Purpose**: Provides consistent error formatting and handling across the application.

---

### 5️⃣ **`src/app/utils/`** - Shared Utilities

```
utils/
├── catchAsync.ts                 # Async error wrapper for route handlers
├── sendResponse.ts               # Standardized API response formatter
├── sendEmail.ts                  # Email sending utility (Nodemailer)
└── sendImageToCloudinary.ts      # Cloudinary image upload helper
```

**Common Utilities:**
- **`catchAsync()`**: Wraps async functions to catch errors automatically
- **`sendResponse()`**: Ensures consistent API response structure
- **`sendEmail()`**: Handles email notifications
- **`sendImageToCloudinary()`**: Manages file uploads to Cloudinary

---

### 6️⃣ **`src/app/config/`** - Configuration

```
config/
├── index.ts                      # Environment variable exports
├── cloudinary.config.ts          # Cloudinary SDK configuration
└── multer.config.ts              # Multer file upload configuration
```

**Purpose**: Centralizes configuration management and environment variables.

---

### 7️⃣ **`src/app/interface/`** - Global Interfaces

```
interface/
├── index.d.ts                    # Global type declarations
└── error.ts                      # Error-related interfaces
```

**Purpose**: Defines global TypeScript types and interfaces used across modules.

---

### 8️⃣ **`src/app/builder/`** - Query Builder

```
builder/
└── queryBuilder.ts               # Mongoose query builder utility
```

**Purpose**: Provides reusable query building logic for filtering, sorting, pagination, and field selection.

---

### 9️⃣ **`src/app/DB/`** - Database Initialization

```
DB/
└── index.ts                      # Database seeding and initialization scripts
```

**Purpose**: Handles initial database setup, seeding, and migrations.

---

## 🔄 Request Flow Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT REQUEST                          │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  server.ts → app.ts → routes/index.ts                           │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  Module Route (e.g., user.route.ts)                             │
│  ├── Middleware: auth() - Authentication & Authorization        │
│  ├── Middleware: validateRequest() - Request Validation         │
│  └── Controller: user.controller.ts                             │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  Service Layer (e.g., user.service.ts)                          │
│  ├── Business Logic                                             │
│  ├── Database Operations (via Mongoose models)                  │
│  └── Data Transformations                                       │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  Model Layer (e.g., user.model.ts)                              │
│  └── MongoDB via Mongoose ODM                                   │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  Response sent via sendResponse() utility                       │
│  OR Error caught by globalErrorhandler middleware               │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🛣️ API Endpoint Structure

### **User Module Endpoints** (`/users`)
```
POST   /users/create-user        # Create a new user
GET    /users                    # Get all users
GET    /users/:id                # Get single user by ID
PATCH  /users/:id                # Update user by ID
DELETE /users/:id                # Delete user by ID
```

### **Admin Module Endpoints** (`/admin`)
```
GET    /admin/users              # Get all users (admin/superAdmin)
GET    /admin/users/:id          # Get single user (admin/superAdmin)
PATCH  /admin/users/:id/role     # Update user role (superAdmin only)
PATCH  /admin/users/:id/status   # Update user status (admin/superAdmin)
DELETE /admin/users/:id          # Soft delete user (superAdmin only)
```

---

## 🧪 Testing Structure

Tests are located alongside their respective modules:
```
modules/
└── user/
    └── user.test.ts              # Jest tests for user module
```

**Run Tests:**
```bash
npm test
```

---

## 🚀 NPM Scripts

```bash
npm run dev          # Start development server with hot reload
npm run build        # Compile TypeScript to JavaScript
npm run prod         # Run production server
npm run lint         # Run ESLint
npm run lint:fix     # Auto-fix ESLint issues
npm run prettier     # Format code with Prettier
npm run prettier:fix # Auto-fix Prettier formatting
npm test             # Run Jest tests
```

---

## 📋 Module Creation Checklist

When creating a new module, follow this structure:

- [ ] Create module directory: `src/app/modules/[module-name]/`
- [ ] Define TypeScript interfaces: `[module].interface.ts`
- [ ] Create Mongoose model: `[module].model.ts`
- [ ] Define validation schemas: `[module].validation.ts`
- [ ] Implement service layer: `[module].service.ts`
- [ ] Create controllers: `[module].controller.ts`
- [ ] Define routes: `[module].route.ts`
- [ ] Add constants: `[module].constant.ts` (if needed)
- [ ] Add utilities: `[module].utils.ts` (if needed)
- [ ] Write tests: `[module].test.ts`
- [ ] Register routes in `src/app/routes/index.ts`

---

## 🔐 Environment Variables

Required environment variables (see `.env.example`):

```env
NODE_ENV=development
PORT=5000
DATABASE_URL=mongodb://localhost:27017/advyon
JWT_SECRET=your_jwt_secret
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_password
```

---

## 🎨 Code Style & Conventions

1. **File Naming**: Use kebab-case for files (e.g., `user.service.ts`)
2. **Module Naming**: Use PascalCase for exports (e.g., `UserService`)
3. **Consistent Structure**: All modules follow the same file organization
4. **Type Safety**: TypeScript strict mode enabled
5. **Validation**: All inputs validated with Zod schemas
6. **Error Handling**: Use `catchAsync` wrapper and custom error classes
7. **Response Format**: Use `sendResponse` utility for consistency

---

## 📚 Additional Resources

- **Postman Collection**: `postman_collection.json` - Import for API testing
- **Module Example**: `module_example/` - Reference template for new modules
- **TypeScript Config**: `tsconfig.json` - Compiler options and paths

---

## 🤖 AI Assistant Guidelines

When working with this codebase:

1. **Follow the Module Pattern**: Always create files following the established module structure
2. **Maintain Consistency**: Use existing patterns for validation, error handling, and responses
3. **Type Safety**: Ensure all functions and variables are properly typed
4. **Validation First**: Always validate requests using Zod schemas
5. **Error Handling**: Use `catchAsync` and throw `AppError` for consistent error handling
6. **Authentication**: Apply `auth()` middleware to protected routes
7. **Testing**: Write tests for new features in `*.test.ts` files
8. **Documentation**: Update this file when adding new modules or significant changes

---

**Last Updated**: December 2025  
**Project**: Advyon Server v1.0.0  
**Maintained By**: Development Team
