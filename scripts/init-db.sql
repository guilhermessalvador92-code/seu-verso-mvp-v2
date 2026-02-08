-- PostgreSQL schema for seu-verso-mvp-v2
-- Using VARCHAR for enum-like fields to avoid type creation issues
-- Valid values: role (user, admin), status (QUEUED, PROCESSING, DONE, FAILED)

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  "openId" varchar(64) NOT NULL UNIQUE,
  name text,
  email varchar(320),
  "loginMethod" varchar(64),
  role varchar(20) NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  "createdAt" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastSignedIn" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create jobs table
CREATE TABLE IF NOT EXISTS jobs (
  id varchar(64) PRIMARY KEY,
  status varchar(20) NOT NULL DEFAULT 'QUEUED' CHECK (status IN ('QUEUED', 'PROCESSING', 'DONE', 'FAILED')),
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
