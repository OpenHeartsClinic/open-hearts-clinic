# Open Hearts

Open Hearts is now set up in two modes:

- `demo` mode: works locally with browser storage so you can test the full flow immediately
- `live` mode: uses free Firebase + free EmailJS so bookings, admin login, and messages work across devices

## Current files

- [index.html](D:\Indicator\open-hearts\index.html)
- [styles.css](D:\Indicator\open-hearts\styles.css)
- [script.js](D:\Indicator\open-hearts\script.js)
- [config.js](D:\Indicator\open-hearts\config.js)
- [offer.html](D:\Indicator\open-hearts\offers\offer.html)

## Open it locally

1. Open [index.html](D:\Indicator\open-hearts\index.html) in your browser.
2. In demo mode, bookings are saved only on that browser.
3. Demo admin login:
   - Email: `admin@openhearts.com`
   - Password: `OpenHearts123!`

## Free live stack

- Hosting: [Vercel Hobby](https://vercel.com/pricing)
- Database and login: [Firebase Spark](https://firebase.google.com/docs/projects/billing/firebase-pricing-plans)
- Email sending: [EmailJS Free](https://www.emailjs.com/pricing/)

## Make it live for free

### 1. Firebase

1. Go to [Firebase Console](https://console.firebase.google.com/).
2. Create a project.
3. Add a Web App.
4. Turn on `Authentication` with `Email/Password`.
5. Create `Firestore Database`.
6. Add your admin user in Firebase Authentication using your chosen admin email.

### 2. EmailJS

1. Create a free account at [EmailJS](https://www.emailjs.com/).
2. Connect the email inbox you want Open Hearts to send from.
3. Create two templates:
   - one for accepted appointments
   - one for declined appointments
4. Include these variables in the template if you want the current script to fill them:
   - `company_name`
   - `patient_name`
   - `patient_email`
   - `patient_phone`
   - `appointment_date`
   - `appointment_time`
   - `status_label`
   - `message`
   - `reply_to`
   - `to_email`

### 3. Edit config.js

Open [config.js](D:\Indicator\open-hearts\config.js) and replace the placeholders.

Use this shape:

```js
window.OPEN_HEARTS_CONFIG = {
  mode: "live",
  adminEmail: "admin@openhearts.com",
  firebase: {
    apiKey: "YOUR_FIREBASE_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    appId: "YOUR_FIREBASE_APP_ID",
  },
  emailjs: {
    publicKey: "YOUR_EMAILJS_PUBLIC_KEY",
    serviceId: "YOUR_EMAILJS_SERVICE_ID",
    acceptedTemplateId: "YOUR_ACCEPTED_TEMPLATE_ID",
    declinedTemplateId: "YOUR_DECLINED_TEMPLATE_ID",
  },
};
```

Important:
- `mode` must be `"live"` for Firebase login and shared bookings to turn on.
- If EmailJS values are left blank, the site falls back to opening the user's email app instead of sending automatically.

## Deploy free on Vercel

1. Put the `open-hearts` folder into a GitHub repo.
2. Import the repo into [Vercel](https://vercel.com/).
3. Deploy it.
4. Your public link will look like `your-project.vercel.app`.

## What is live-ready now

Once Firebase and EmailJS are configured:

- visitors can submit bookings from different devices
- bookings appear in one shared admin dashboard
- admin login uses Firebase email/password
- accepted or declined status updates are saved centrally
- appointment emails can send through EmailJS

## Important note

This is a strong low-cost launch version, but it is not a clinical records platform. Before using it for sensitive real-world therapy work, you should also add:

- privacy policy
- consent wording
- clear emergency or crisis guidance
- proper data handling rules in Firestore
