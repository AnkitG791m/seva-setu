import admin from 'firebase-admin';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: 'seva-setu-74bcc',
      clientEmail: 'firebase-adminsdk-fbsvc@seva-setu-74bcc.iam.gserviceaccount.com',
      privateKey: '-----BEGIN PRIVATE KEY-----\nMIIEvwIBADANBgkqhkiG9w0BAQEFAASCBKkwggSlAgEAAoIBAQC52EtuJYNZ+2J8\nAGzLMhqAv3HOQooeicIfaYdbS1u8KvRAtp6e+TXZD8guopTe1R8aa509AlsW/CFE\nd+5AaZkRTO65yma+3XkTtHw+eWmu2939oMm+O7rmdDgD5Cvy72UR2eNhWQRZ0z2n\nygGznKsbgTxQ4Ks+4eKzUWbHeKycVbTPnT2pB1+BkDDjhjnz2FMeAm0wpoYmPNla\nF9d9YqAD/VpZZ+beIggBq+MNdh2BF/pBJ3jsKBEHXTY3zpUQZlbjW5PGXcNf5tOO\nzECT7+sA4IeHlS+UQsuwx8aP9sC+Qslcg2sm+MnZkfEM3IH1BglfwUi6108M8L2T\n8sndkoYtAgMBAAECggEAEUWNjxVL7ZEsIDee5MyJg4UnU8LB2OA3Kxmw43Zvtl9s\nl1YRjFc/Xqa1lUX1XXdDnn45XQnqwspYYidePFzEBcRXXGt33I2zOrZXpKu+e2qC\nKVfn3/bnohLTgOMUBY4jn8LW+71c5uc3r/AZc+Kf0VzTqPWUXLH8EmvCiE/KBPZW\nfhqLObX94Kit8bFqSizxrRaxepPFgGOqucZ+g/QPN+/YbleCK2upAykAqUPWNU6u\n3owb4u9qu59QuiVw7iiNK3MGWAM7PWJUnBt/nciP5wGtEpawxLcWauQREf7pD8mj\nS5B+w5AXVrvYejMBXssqyRsoEigYs0gN6Wte3lK7MQKBgQDr+fHGSA8h21JTjFi1\nDsQczMKBniWct8lSk5tdy60AckddN5ScvC6a39kK215YQt+QI2dc6GeQL4Ps5GBz\nG5tomz+RCjA7f5soiPpCVUtp3nl57a+ASOWieg2g0diIV3wm+si4KTCI4p2lz6JO\nlws9QvM/ZAaBcq7JJyOFfgk4cQKBgQDJnVt3tE7U1BBBtz7WKxprAHYQUSU6gJyw\n4dwy+rQdDX/2rCmJXwS8QJ8EcWmdyntySsQ4goEqhTwjmB9qfKiT5OMetzGrs+MN\no/UJnNukJ16R71soIHeE8n2VHI1I4TmFvVrlmBreprA8pw0uvdx3+eEp47JDXi9I\n8JtYxWTnfQKBgQCYLaAV1vKrSt1Us/WhDdy7FfF51Zs77eoPLtHLM0ZmO0x6eRWF\n3nXPuvwlXEMDeFzkf3BxIg9nlLznUIBCu1MFqtjbmE5ykGBnS67YiFkR9T8xum6r\ntFci6MNRKwMRKhoOqTw4R5fdLwernrN1K0M8RqjIAKGRaXv+jRcDR7x6gQKBgQCo\n2GyyukFOwe5/apxoNh7gv7kgfySjcvRGulB0LTtMHXMuPQ5oKjhIBAJocSaXa+yo\nUe80uC6+UmiEErE0uANiIE0I+zjQ6EzdrpLXIxNazVHI++CmoVIW+BGuIAQ+pchL\ntcH7B8Bw+L4dfXVv0LdjjtRABZ3UB3uoJUCkPmP77QKBgQC/lKvYEuRfWS7G+vPS\nro3u2V+5kQaLwJsGA5zt2olS9OakF0zx+4ZchduHWmdsYttuX9N0uxDRfPOX8ucF\npUgldMCuaD+UTAyMIrUi7QPMeFbf6twFOnki69Gyl0seJCNiexualuFMpBWEsFP4\neypWEzTWDNseCDL0VuABt7ffIQ==\n-----END PRIVATE KEY-----\n',
    }),
  });
}

const FIREBASE_UID = 'QVbWCegbSzZoJBnyUa1sMeA4kr32';
const EMAIL = 'demo@sevasetu.app';
const NAME = 'Demo User';

async function seedUser() {
  try {
    const existing = await prisma.user.findUnique({ where: { firebase_uid: FIREBASE_UID } });
    if (existing) {
      console.log('User already in DB:', existing.id);
      return;
    }

    const user = await prisma.user.create({
      data: {
        firebase_uid: FIREBASE_UID,
        name: NAME,
        email: EMAIL,
        role: 'VOLUNTEER',
      }
    });

    await prisma.volunteer.create({
      data: { userId: user.id, skills: null, preferred_zones: null }
    });

    console.log('✅ User seeded to DB:', user.id);
    console.log('   Role:', user.role);
  } catch (err) {
    console.error('DB Error:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

seedUser();
