

## FileTransferApp Roadmap

**Core Value:**
FileTransferApp is designed for easy, fast, and convenient file sharing—no mandatory accounts, no compression or quality loss, and instant access via gallery code. Optional gallery passwords allow secure, frictionless sharing with anyone, anywhere.

### Current Features (as of July 23, 2025)
- **Prisma schema** for collaborative image library:
  - `Gallery` model with code, passwordHash, createdAt, images, and roles
  - `Image` model with id, code, filename, createdAt, and gallery relation
  - `User` model with id, username, passwordHash, createdAt, and roles
  - `GalleryRole` model for user roles in galleries (owner, admin, viewer)
  - Enum `Role` for role types
- **API routes** for gallery and user management (see `src/app/api/`)
- **Basic file upload and image management** (see `public/uploads/`)
- **User authentication** (register, login, session)
- **Gallery join, role assignment, and password protection**

### To Do Next
- **Frontend improvements:**
  - Add UI for managing gallery roles (promote/demote users, remove users)
  - Display user roles in gallery pages
  - Add error/success feedback for user actions
  - Add option to send encrypted files/images: encrypt uploads with a user-provided password, decrypt on download with the same password (end-to-end encryption; implementation details TBD)
- **API enhancements:**
  - Add endpoints for updating/removing gallery roles
  - Add endpoint for changing gallery password
  - Add endpoint for deleting images
- **Security:**
  - Hash passwords securely (ensure best practices)
  - Add rate limiting and validation to API endpoints
- **Testing:**
  - Add unit and integration tests for API and models
- **Documentation:**
  - Document API endpoints and usage
  - Add setup instructions to README.md

---
_Update this roadmap as features are completed or new requirements arise._
