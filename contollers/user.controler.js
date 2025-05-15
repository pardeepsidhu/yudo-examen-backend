import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from "../models/user.model.js";
import {OAuth2Client} from "google-auth-library"
import { sendEmail } from './email.contoller.js';

export const signup = async (req, res) => {
  try {
    // Input validation
    const { name, email, password, profile } = req.body;
    
    if ( !email || !password) {
      return res.status(400).json({ error: "Please provide all required data" });
    }
    
    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Please provide a valid email address" });
    }
    
    // Password strength validation
    if (password.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters long" });
    }
    
    // Check if the user already exists
    let user = await User.findOne({ email });
    
    if (user && user.otp === "verified") {
      return res.status(400).json({ error: "User already exists" });
    }
    
    // Hash the password before saving
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Generate OTP
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    
    // Prepare email content
    const mailBody = {
      from: process.env.EMAIL,
      to: email,
      subject: "Yudo-Examine - OTP Verification",
      text: `Your One-Time Password (OTP) for verifying your Yudo-Examine account is: ${otp}. This OTP will expire in 10 minutes. If you didn't request this, please ignore this email.`,
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2e86de; font-size: 28px; margin: 0;">Yudo-Examine</h1>
            <p style="color: #7f8c8d; font-size: 16px; margin-top: 5px;">OTP Verification</p>
          </div>
          
          <div style="background-color: #f8f9fa; border-radius: 8px; padding: 30px; box-shadow: 0 4px 8px rgba(0,0,0,0.05);">
            <h2 style="color: #2c3e50; font-size: 22px; margin-top: 0; margin-bottom: 20px;">Hello ${name},</h2>
            <p style="color: #34495e; font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
              Thank you for using Yudo-Examine. Use the following One-Time Password (OTP) to complete your verification process:
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <span style="background-color: #2e86de; color: white; padding: 14px 32px; border-radius: 6px; font-size: 24px; font-weight: bold; letter-spacing: 3px; display: inline-block;">${otp}</span>
            </div>
            
            <p style="color: #34495e; font-size: 16px; line-height: 1.6; margin-bottom: 5px;">
              This OTP is valid for <strong>10 minutes</strong>.
            </p>
            <p style="color: #34495e; font-size: 16px; line-height: 1.6;">
              If you didn't request this, you can safely ignore this email.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef;">
            <p style="color: #95a5a6; font-size: 14px;">© ${new Date().getFullYear()} Yudo-Examine. All rights reserved.</p>
            <p style="color: #95a5a6; font-size: 12px; margin-top: 10px;">This is an automated message, please do not reply.</p>
            <p style="color: #95a5a6; font-size: 12px;">Need help? Visit our <a href="https://yourdomain.com/support" style="color: #2e86de; text-decoration: none;">Support Center</a>.</p>
          </div>
        </div>
      `,
    };
    
    // Send OTP email
    try {
      await sendEmail(mailBody);
    } catch (emailError) {
      console.error("Email sending failed:", emailError);
      return res.status(500).json({ error: "Failed to send verification email" });
    }
    
    // Create token with OTP
    const token = jwt.sign(
      { otp },
      process.env.JWT_SECRET,
      { expiresIn: "10m" }
    );
    
    // Create new user if not exists
    if (!user) {
      user = new User({
        name,
        email,
        password: hashedPassword,
        profile: profile || null,
        otp: token
      });
    } else {
      // Update existing user with new OTP
      user.otp = token;
      if (name) user.name = name;
      if (profile) user.profile = profile;
      user.password = hashedPassword;
    }
    
    await user.save();
    
    return res.status(201).json({
      success: true,
      message: `Successfully sent OTP to ${email}`
    });
    
  } catch (error) {
    console.error("Signup error:", error);
    return res.status(500).json({ 
      error: "An error occurred during signup", 
      message: process.env.NODE_ENV === 'development' ? error.message : 'Please try again later' 
    });
  }
};




export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    
    if (!email || !otp) {
      return res.status(400).json({ error: "Please provide both email and OTP" });
    }
    
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    if (user.otp === "verified") {
      return res.status(400).json({ error: "User is already verified" });
    }
    
    if (!user.otp) {
      return res.status(400).json({ error: "OTP not found. Please request a new one." });
    }
    
    let decoded;
    try {
      decoded = jwt.verify(user.otp, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        return res.status(400).json({ error: "OTP has expired. Please request a new one." });
      }
      return res.status(400).json({ error: "Invalid OTP token" });
    }
    
    if (decoded.otp !== otp) {
      return res.status(400).json({ error: "Incorrect OTP" });
    }
    
    user.otp = "verified";
    await user.save();
    
    const token = jwt.sign({_id: user._id, email: user.email}, process.env.JWT_SECRET);
    return res.status(200).json({token});
  } catch (error) {
    return res.status(500).json({
      error: "An error occurred during OTP verification",
      message: error.message,
    });
  }
};;


export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if all required fields are present
    if (!email || !password) {
      return res.status(400).json({ error: "Please provide both email and password" });
    }

    // Find the user by email
    const user = await User.findOne({ email });
    if (!user || user.otp !== 'verified') {
      return res.status(404).json({ error: "User not found" });
    }

    // Compare entered password with hashed password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { _id: user._id, email: user.email },
      process.env.JWT_SECRET
    );

    // Return token and user info (optional)
    res.status(200).json({
      token
    });

  } catch (error) {
    res.status(500).json({ error: 'Login error', message: error.message });
  }
};


const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);



export const googleLogin = async (req, res) => {
  const { token: googleToken } = req.body;

  if (!googleToken) {
    return res.status(400).json({ error: "Token not provided" });
  }

  try {
    const ticket = await client.verifyIdToken({
      idToken: googleToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    if (!payload) {
      return res.status(401).json({ error: "Invalid Google token" });
    }

    const { email, name, picture, sub: googleId } = payload;

    let user = await User.findOne({ email });

    if (!user) {
      user = new User({
        email,
        googleId,
        profile: picture,
        name,
      });
      await user.save();
    }

    const jwtToken = jwt.sign(
      { _id: user._id, email: user.email },
      process.env.JWT_SECRET ,
      { expiresIn: "7d" }
    );

    return res.status(200).json({
      token: jwtToken
    });
  } catch (error) {
    console.error("Google Auth Error:", error);
    return res.status(401).json({ error: "Token verification failed", details: error.message });
  }
};


export const resetPassLink = async(req,res)=>{
  try {
      // Input validation
      const { email } = req.body;

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: "Please provide a valid email address" });
      }
      
    
      let user = await User.findOne({ email });
     if(!user) return res.status(404).send({error:"user not found"})
      let token = jwt.sign({userId:user._id},process.env.JWT_SECRET,{
    expiresIn:"10m"
    })
    const resetLink = `http://localhost:3000/login?token=${token}`
      const mailBody = {
        from: process.env.EMAIL,
        to: email,
        subject: "Yudo-Examine - Reset Your Password",
        text: `Hello dear ,\n\nWe received a request to reset your password. Please use the link below to set a new password:\n\n${resetLink}\n\nThis link will expire in 10 minutes.\n\nIf you didn't request a password reset, please ignore this email.`,
        html: `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #2e86de; font-size: 28px; margin: 0;">Yudo-Examine</h1>
              <p style="color: #7f8c8d; font-size: 16px; margin-top: 5px;">Password Reset</p>
            </div>
      
            <div style="background-color: #f8f9fa; border-radius: 8px; padding: 30px; box-shadow: 0 4px 8px rgba(0,0,0,0.05);">
              <h2 style="color: #2c3e50; font-size: 22px; margin-top: 0; margin-bottom: 20px;">Hello </h2>
              <p style="color: #34495e; font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
                We received a request to reset your password. Click the button below to proceed. This link is valid for <strong>10 minutes</strong>.
              </p>
      
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetLink}" style="background-color: #2e86de; color: white; padding: 14px 32px; border-radius: 6px; font-size: 18px; font-weight: bold; text-decoration: none;">Reset Password</a>
              </div>
      
              <p style="color: #34495e; font-size: 16px; line-height: 1.6;">
                If you didn’t request this, you can safely ignore this email.
              </p>
            </div>
      
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef;">
              <p style="color: #95a5a6; font-size: 14px;">© ${new Date().getFullYear()} Yudo-Examine. All rights reserved.</p>
              <p style="color: #95a5a6; font-size: 12px; margin-top: 10px;">This is an automated message, please do not reply.</p>
              <p style="color: #95a5a6; font-size: 12px;">Need help? Visit our <a href="https://yourdomain.com/support" style="color: #2e86de; text-decoration: none;">Support Center</a>.</p>
            </div>
          </div>
        `,
      };
      
      
    
      try {
        await sendEmail(mailBody);
      } catch (emailError) {
        console.error("Email sending failed:", emailError);
        return res.status(500).json({ error: "Failed to send reset password link" });
      }
      
      return res.status(201).json({
        message: `Successfully sent link to ${email}`
      });
      
  } catch (error) {
    console.log(error)
    res.status(400).send({error:"some error accured while sending link"})
  }
}


export const getMyProfile = async (req, res) => {
  try {
    // Assuming you have middleware that sets req.user._id from the auth token
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const user = await User.findById(userId).select('-password -otp');
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    console.error("Error fetching profile:", error);
    return res.status(500).json({ error: "Failed to fetch profile" });
  }
};

