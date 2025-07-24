// This file contains the Supabase table schemas for reference
// You can use the Supabase dashboard or SQL editor to create these tables

/*
User: id (uuid, pk), name (text), email (text, unique), createdAt (timestamp)
Gallery: id (uuid, pk), code (text, unique), ownerId (uuid, fk User), passwordHash (text, nullable), createdAt (timestamp)
File: id (uuid, pk), galleryId (uuid, fk Gallery), userId (uuid, fk User), name (text), size (int), url (text), encrypted (bool), metadata (jsonb), folderId (uuid, fk Folder, nullable), createdAt (timestamp)
Folder: id (uuid, pk), galleryId (uuid, fk Gallery), name (text), parentId (uuid, fk Folder, nullable), createdAt (timestamp)
Comment: id (uuid, pk), fileId (uuid, fk File), userId (uuid, fk User), body (text), createdAt (timestamp)
Team: id (uuid, pk), name (text), ownerId (uuid, fk User)
TeamMember: id (uuid, pk), teamId (uuid, fk Team), userId (uuid, fk User), role (text)
*/
