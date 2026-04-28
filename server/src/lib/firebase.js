// Firebase Admin removed. Authentication is now JWT-based.
// This file is a stub to prevent import errors from other files.
const admin = {
  apps: [],
  auth: () => ({
    verifyIdToken: async () => { throw new Error('Firebase Admin not configured'); },
    createUser: async () => { throw new Error('Firebase Admin not configured'); },
    getUserByEmail: async () => { throw new Error('Firebase Admin not configured'); },
  }),
};

export default admin;
