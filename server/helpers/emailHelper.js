import axios from "axios";

const brevoClient = axios.create({
  baseURL: "https://api.brevo.com/v3",
  headers: {
    "api-key": process.env.BREVO_API_KEY,
    "Content-Type": "application/json",
  },
});

export const sendOTPEmail = async (email, otp) => {
  try {
    await brevoClient.post("/smtp/email", {
      sender: { name: "Connectify", email: "prabhat844502@gmail.com" },
      to: [{ email }],
      subject: "🔐 Your Connectify Verification Code",
      htmlContent: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 500px; margin: auto; padding: 30px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
          <h2 style="color: #6366f1; text-align: center; margin-bottom: 24px;">Connectify</h2>
          <p style="color: #334155; font-size: 16px; line-height: 1.5;">Hi there,</p>
          <p style="color: #334155; font-size: 15px; line-height: 1.5;">Thank you for choosing Connectify. Please use the following One-Time Password (OTP) to complete your account registration:</p>
          <div style="background-color: #f1f5f9; padding: 15px; border-radius: 8px; text-align: center; margin: 24px 0;">
            <h1 style="color: #4f46e5; letter-spacing: 4px; font-size: 32px; margin: 0;">${otp}</h1>
          </div>
          <p style="color: #64748b; font-size: 14px; line-height: 1.5;">This code is valid for <strong>5 minutes</strong>. Do not share this OTP with anyone.</p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
          <p style="font-size: 12px; color: #94a3b8; text-align: center;">If you didn't request this email, you can safely ignore it.</p>
          <p style="font-size: 12px; color: #94a3b8; text-align: center;">— Connectify Team</p>
        </div>
      `,
    });
    console.log("Verification OTP sent successfully via Brevo.");
  } catch (err) {
    console.error("Brevo sendOTPEmail error:", err.response?.data || err.message);
    throw new Error("Failed to send verification email.");
  }
};

export const sendAccountCreatedEmail = async (email, fullName) => {
  try {
    await brevoClient.post("/smtp/email", {
      sender: { name: "Connectify", email: "prabhat844502@gmail.com" },
      to: [{ email }],
      subject: "🎉 Welcome to Connectify!",
      htmlContent: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; background-color: #f8fafc; border-radius: 12px; padding: 30px; border: 1px solid #e2e8f0;">
          <div style="text-align: center;">
            <h1 style="color: #10b981; margin-bottom: 8px;">Welcome to Connectify, ${fullName}!</h1>
            <p style="font-size: 16px; color: #475569;">We are thrilled to have you join us.</p>
          </div>

          <div style="margin-top: 24px; background: #ffffff; padding: 24px; border-radius: 8px; border: 1px solid #f1f5f9;">
            <p style="font-size: 15px; color: #334155; line-height: 1.6;">
              Your account has been successfully verified and created. Connectify is designed to be a premium, secure, and instant workspace for all your messaging needs.
            </p>
            <p style="font-size: 15px; color: #334155; line-height: 1.6;">
              Start chatting, create channels/groups, customize your display themes, or try out our built-in AI assistant features!
            </p>
          </div>

          <p style="font-size: 14px; color: #64748b; margin-top: 24px; text-align: center;">
            If you have any questions or feedback, feel free to reach out to us!
          </p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e2e8f0;" />
          <p style="text-align: center; font-size: 13px; color: #94a3b8;">
            — The Connectify Team
          </p>
        </div>
      `,
    });
    console.log("Account creation welcome email sent successfully via Brevo.");
  } catch (err) {
    console.error("Brevo sendAccountCreatedEmail error:", err.response?.data || err.message);
  }
};

export const sendResetPasswordOTPEmail = async (email, otp) => {
  try {
    await brevoClient.post("/smtp/email", {
      sender: { name: "Connectify", email: "prabhat844502@gmail.com" },
      to: [{ email }],
      subject: "🔑 Your Connectify Password Reset Code",
      htmlContent: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 500px; margin: auto; padding: 30px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
          <h2 style="color: #6366f1; text-align: center; margin-bottom: 24px;">Connectify</h2>
          <p style="color: #334155; font-size: 16px; line-height: 1.5;">Hi there,</p>
          <p style="color: #334155; font-size: 15px; line-height: 1.5;">We received a request to reset the password for your Connectify account. Please use the following One-Time Password (OTP) to proceed with resetting your password:</p>
          <div style="background-color: #f1f5f9; padding: 15px; border-radius: 8px; text-align: center; margin: 24px 0;">
            <h1 style="color: #4f46e5; letter-spacing: 4px; font-size: 32px; margin: 0;">${otp}</h1>
          </div>
          <p style="color: #64748b; font-size: 14px; line-height: 1.5;">This code is valid for <strong>5 minutes</strong>. Do not share this OTP with anyone. If you did not request a password reset, you can safely ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
          <p style="font-size: 12px; color: #94a3b8; text-align: center;">If you have any questions, please contact our support team.</p>
          <p style="font-size: 12px; color: #94a3b8; text-align: center;">— Connectify Team</p>
        </div>
      `,
    });
    console.log("Password reset OTP sent successfully via Brevo.");
  } catch (err) {
    console.error("Brevo sendResetPasswordOTPEmail error:", err.response?.data || err.message);
    throw new Error("Failed to send password reset email.");
  }
};