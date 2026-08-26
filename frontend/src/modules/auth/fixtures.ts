export const authCredentialsFixture = {
  email: 'demo@manabandhu.local',
  password: 'DemoPass123',
} as const;

export const authFlowsFixture = {
  signIn: {
    title: 'Sign In',
    body: 'Welcome back to your community.',
  },
  signUp: {
    title: 'Create Account',
    body: 'Join ManaBandhu and start building your trusted community.',
  },
  forgotPassword: {
    title: 'Forgot Password',
    body: 'Enter your email and we will help you reset access.',
  },
  phoneLogin: {
    title: 'Phone Login',
    body: 'Enter your mobile number to receive a secure code.',
  },
  emailLogin: {
    title: 'Email Login',
    body: 'Use your email to continue into ManaBandhu.',
  },
  otpVerification: {
    title: 'OTP Verification',
    body: 'Enter the verification code we sent you.',
  },
  resetPassword: {
    title: 'Reset Password',
    body: 'Create a new password for your account.',
  },
  chooseLoginMethod: {
    title: 'Choose Login Method',
    body: 'Pick how you would like to continue.',
  },
} as const;
