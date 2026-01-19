exports.getEmailVerificationOtpContent=function getEmailVerificationOtpContent(user,otp){
   return `<body style="font-family: Arial, sans-serif; color: #333; background-color: #f9f9f9; margin: 0; padding: 0;">
    <div style="width: 100%; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff; border: 1px solid #e0e0e0;">
        <div style="font-size: 24px; font-weight: bold; color: #4CAF50; text-align: center; margin-bottom: 20px;">
            Verify Your Email Address
        </div>
        <div style="font-size: 16px; line-height: 1.5;">
            <p>Hi <strong>${user.username}</strong>,</p>
            <p>Thank you for registering with us! To complete your email verification, please use the following OTP:</p>
            <p style="font-size: 20px; font-weight: bold; color: #ff6b6b;">${otp}</p>
            <p>Simply enter this OTP on our verification page:</p>
            <a href="" style="display: inline-block; padding: 10px 20px; font-size: 16px; font-weight: bold; color: #ffffff; background-color: #4CAF50; text-decoration: none; border-radius: 5px; margin-top: 20px; text-align: center;">Verify Email</a>
            <p>If you did not request this email, you can safely ignore it.</p>
        </div>
        <div style="font-size: 12px; color: #777; margin-top: 20px; text-align: center;">
            <p>Thank you for choosing our service!</p>
        </div>
    </div>
</body>`
}