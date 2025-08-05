-- Initialize Paimon's Codex Database
-- This script runs when Oracle container starts

-- Connect to FREEPDB1
ALTER SESSION SET CONTAINER = FREEPDB1;

-- Create user for the application (ignore if exists)
BEGIN
  EXECUTE IMMEDIATE 'CREATE USER paimons_user IDENTIFIED BY password123';
EXCEPTION
  WHEN OTHERS THEN
    IF SQLCODE = -1920 THEN
      NULL; -- User already exists, continue
    ELSE
      RAISE;
    END IF;
END;
/

-- Grant necessary privileges
GRANT CONNECT, RESOURCE TO paimons_user;
GRANT CREATE SESSION TO paimons_user;
GRANT CREATE TABLE TO paimons_user;
GRANT CREATE SEQUENCE TO paimons_user;
GRANT CREATE VIEW TO paimons_user;
GRANT CREATE PROCEDURE TO paimons_user;
GRANT CREATE TRIGGER TO paimons_user;

-- Grant unlimited tablespace (for development)
GRANT UNLIMITED TABLESPACE TO paimons_user;

-- Enable JSON features
GRANT EXECUTE ON SYS.JSON_ARRAY_T TO paimons_user;
GRANT EXECUTE ON SYS.JSON_OBJECT_T TO paimons_user;

COMMIT;