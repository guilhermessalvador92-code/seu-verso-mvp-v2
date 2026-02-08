-- Create enum types
CREATE TYPE role AS ENUM ('user', 'admin');
CREATE TYPE status AS ENUM ('QUEUED', 'PROCESSING', 'DONE', 'FAILED');
CREATE TYPE email_type AS ENUM ('ORDER_CONFIRMATION', 'MUSIC_READY', 'NOTIFICATION');
CREATE TYPE email_status AS ENUM ('PENDING', 'SENT', 'FAILED');

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  "openId" varchar(64) NOT NULL UNIQUE,
  name text,
  email varchar(320),
  "loginMethod" varchar(64),
  role role NOT NULL DEFAULT 'user',
  "createdAt" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastSignedIn" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create jobs table
CREATE TABLE IF NOT EXISTS jobs (
  id varchar(64) PRIMARY KEY,
  status status NOT NULL DEFAULT 'QUEUED',
  "sunoTaskId" varchar(128),
  "createdAt" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create songs table
CREATE TABLE IF NOT EXISTS songs (
  id varchar(64) PRIMARY KEY,
  "jobId" varchar(64) NOT NULL,
  title text,
  lyrics text,
  "audioUrl" text,
  "imageUrl" text,
  duration integer DEFAULT 0,
  tags varchar(255),
  "modelName" varchar(64),
  "shareSlug" varchar(128) UNIQUE,
  "emailSent" timestamp,
  "downloadCount" integer NOT NULL DEFAULT 0,
  "createdAt" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create leads table
CREATE TABLE IF NOT EXISTS leads (
  id varchar(64) PRIMARY KEY,
  "jobId" varchar(64) NOT NULL,
  whatsapp varchar(20) NOT NULL,
  name text NOT NULL,
  style varchar(64) NOT NULL,
  occasion text,
  story text NOT NULL,
  mood varchar(64),
  language varchar(10) NOT NULL DEFAULT 'pt-BR',
  "createdAt" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create emailQueue table
CREATE TABLE IF NOT EXISTS "emailQueue" (
  id varchar(64) PRIMARY KEY,
  "to" varchar(320) NOT NULL,
  subject varchar(255) NOT NULL,
  "htmlContent" text NOT NULL,
  type email_type NOT NULL,
  "jobId" varchar(64),
  status email_status NOT NULL DEFAULT 'PENDING',
  attempts integer NOT NULL DEFAULT 0,
  "maxAttempts" integer NOT NULL DEFAULT 5,
  "nextRetryAt" timestamp,
  "lastError" text,
  "sentAt" timestamp,
  "createdAt" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);
