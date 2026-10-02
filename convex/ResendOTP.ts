import { Email } from "@convex-dev/auth/providers/Email";
import { Resend as ResendAPI } from "resend";
import { RandomReader, generateRandomString } from "@oslojs/crypto/random";

// Until a domain is verified in Resend, onboarding@resend.dev only delivers
// to the Resend account owner. Set AUTH_EMAIL_FROM to switch senders.
const FROM = process.env.AUTH_EMAIL_FROM ?? "Showroom Ads <onboarding@resend.dev>";

export const ResendOTP = Email({
  id: "resend-otp",
  apiKey: process.env.AUTH_RESEND_KEY,
  maxAge: 60 * 15,
  async generateVerificationToken() {
    const random: RandomReader = {
      read(bytes) {
        crypto.getRandomValues(bytes as Uint8Array<ArrayBuffer>);
      },
    };
    return generateRandomString(random, "0123456789", 6);
  },
  async sendVerificationRequest({ identifier: email, provider, token }) {
    const resend = new ResendAPI(provider.apiKey);
    const { error } = await resend.emails.send({
      from: FROM,
      to: [email],
      subject: `Your Showroom Ads code: ${token}`,
      text: `Your sign-in code is ${token}. It expires in 15 minutes.`,
    });
    if (error) {
      throw new Error("Could not send sign-in email: " + error.message);
    }
  },
});
