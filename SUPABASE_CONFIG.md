# Supabase Configuration Guide

## Authentication URL Configuration

To fix email confirmation redirects, you need to configure the following settings in your Supabase dashboard:

### Step 1: Access Authentication Settings
1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Select your project: `dwrknslxhbgxknvjwtaz`
3. Navigate to **Authentication** → **URL Configuration**

### Step 2: Configure Site URL
Set the **Site URL** to your production domain:
```
https://taxi-carpooling.vercel.app
```

### Step 3: Configure Redirect URLs
Add the following URLs to **Redirect URLs**:
```
https://taxi-carpooling.vercel.app/**
https://taxi-carpooling.vercel.app/auth/callback
https://taxi-carpooling.vercel.app/auth/reset-password
http://localhost:5173/**
http://localhost:5173/auth/callback
http://localhost:5173/auth/reset-password
```

The localhost URLs are needed for development environment.

### Step 4: Email Templates (Optional)
You can customize the email templates in **Authentication** → **Email Templates**:

#### Confirm Signup Template
- **Subject**: Welcome to Taxi Carpooling - Confirm your email
- **Body**: Include a clear call-to-action button that links to the confirmation URL

#### Reset Password Template  
- **Subject**: Reset your Taxi Carpooling password
- **Body**: Include a clear call-to-action button for password reset

### Step 5: Verify Configuration
After making these changes:
1. Test email confirmation by signing up with a new email
2. Check that the confirmation email links to the correct domain
3. Verify that clicking the link redirects to your production app

## Common Issues and Solutions

### Issue: Still redirecting to localhost
**Solution**: 
- Clear browser cache and cookies
- Wait 5-10 minutes for Supabase configuration to propagate
- Check that the Site URL is exactly: `https://taxi-carpooling.vercel.app` (no trailing slash)

### Issue: Email not arriving
**Solution**:
- Check spam/junk folder
- Verify email address is correct
- Check Supabase logs for delivery errors

### Issue: Callback page not found
**Solution**:
- Ensure `/auth/callback` route exists in your app
- Check that the redirect URL exactly matches the configured URL

## Environment Variables in Vercel

Make sure these environment variables are set in your Vercel dashboard:

```bash
VITE_SUPABASE_URL=https://dwrknslxhbgxknvjwtaz.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_APP_URL=https://taxi-carpooling.vercel.app
VITE_APP_NAME=Taxi Carpooling
```

## Testing Checklist

- [ ] Site URL configured in Supabase dashboard
- [ ] Redirect URLs added for both production and development
- [ ] Environment variables updated in Vercel
- [ ] Code deployed with updated auth service
- [ ] Test signup with new email address
- [ ] Verify confirmation email contains correct redirect URL
- [ ] Test clicking confirmation link redirects to production app
- [ ] Test password reset email flow
- [ ] Verify Google OAuth redirects correctly

## Next Steps

After completing the Supabase configuration:
1. Deploy the updated code to Vercel
2. Test the complete signup and email confirmation flow
3. Verify users can successfully complete registration
4. Check user profiles are created correctly in the database

---

**Note**: Configuration changes in Supabase may take a few minutes to propagate. If you're still seeing issues after configuration, wait 5-10 minutes and try again.