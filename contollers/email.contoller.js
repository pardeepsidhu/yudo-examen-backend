import nodemailer from 'nodemailer'
import dotenv from "dotenv"


dotenv.config("../.env")

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true, 
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASS,
  },
});

// Send OTP function
export async function sendEmail(mailBody) {
  try {
    const info = await transporter.sendMail(mailBody);
    return info;
  } catch (error) {
    console.error("Error sending Email:", error);
    throw new Error("Failed to Send Email");
  }
}



