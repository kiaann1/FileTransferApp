-- Galleries table
CREATE TABLE galleries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text UNIQUE NOT NULL,
  password text,
  owner_id uuid NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Gallery files table
CREATE TABLE gallery_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gallery_id uuid REFERENCES galleries(id) ON DELETE CASCADE,
  name text NOT NULL,
  url text NOT NULL,
  type text,
  size bigint,
  uploaded_by uuid,
  uploaded_at timestamptz DEFAULT now()
);

-- Gallery members table
CREATE TABLE gallery_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gallery_id uuid REFERENCES galleries(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  joined_at timestamptz DEFAULT now()
);

-- Gallery invites table
CREATE TABLE gallery_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gallery_id uuid REFERENCES galleries(id) ON DELETE CASCADE,
  email text NOT NULL,
  invited_by uuid,
  invited_at timestamptz DEFAULT now()
);
