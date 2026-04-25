import dotenv from 'dotenv';
dotenv.config();
console.log('BYPASS_AUTH:', process.env.BYPASS_AUTH);
console.log('DATABASE_URL:', process.env.DATABASE_URL);
