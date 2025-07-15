# OAuth Login App

Login using Google or Facebook with Node.js and Express.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Add your Google and Facebook credentials in `server.js`.

3. Run the app:
   ```bash
   node server.js
   ```

4. Open in browser:
   ```
   http://localhost:3000/login.html
   ```

## Structure

- `public/` → Login page
- `views/` → Success pages
- `server.js` → OAuth logic

## Routes

- `/auth/google`
- `/oauth2callback`
- `/auth/facebook`
- `/facebook/callback`
- `/logout`