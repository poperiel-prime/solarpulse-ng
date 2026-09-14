# Upload SolarPulse NG to GitHub and deploy it

You do not paste the source into one text box. Upload the files from the ZIP while preserving their folders.

## 1. Download and extract the source

1. Download `SolarPulse-NG-source.zip` from the Arena project files.
2. Extract/unzip it on your phone or computer.
3. The extracted folder should contain `package.json`, `src`, `public`, `README.md`, and other config files.

## 2. Create the GitHub repository

1. Sign in at https://github.com.
2. Tap **New repository**.
3. Repository name: `solarpulse-ng`.
4. Choose **Private** or **Public**.
5. Do not add a README or `.gitignore`—this package already has both.
6. Tap **Create repository**.

## 3. Upload the extracted files

1. On the empty repository page, choose **uploading an existing file** or **Add file → Upload files**.
2. Upload the extracted files and folders—not the ZIP itself.
3. Ensure GitHub shows folders such as `src` and `public`, plus `package.json` at the repository root.
4. Commit message: `Initial SolarPulse NG app`.
5. Tap **Commit changes**.

If GitHub's mobile browser will not upload folders, use a computer or the GitHub Desktop application. Do not paste all source code into a single file.

## 4. Deploy with Vercel

1. Sign in at https://vercel.com using GitHub.
2. Select **Add New → Project**.
3. Find `solarpulse-ng` and tap **Import**.
4. Keep the detected Next.js settings.
5. Under **Environment Variables**, add:
   - `ADMIN_PIN` = a private PIN you choose
   - `DATABASE_URL` = `postgresql://localhost:5432/placeholder`
6. Tap **Deploy**.
7. Vercel gives you a permanent HTTPS URL such as `https://solarpulse-ng.vercel.app`.

## 5. Install on your phone

1. Open the Vercel HTTPS URL in Chrome on Android.
2. Open the Chrome menu (⋮).
3. Tap **Install app** or **Add to Home screen**.
4. SolarPulse NG appears on your home screen and opens full-screen.

The curator desk is at `https://your-vercel-url/admin`, using the `ADMIN_PIN` you configured in Vercel.
