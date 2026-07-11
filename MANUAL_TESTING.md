# Prioritized Manual Testing Plan

This testing plan highlights critical scenarios that **cannot be covered** by unit or automated E2E tests (e.g., native browser prompts, OS level integrations, real network drops, and OAuth redirects) in the **Top Section**, followed by **Good to Have** verification steps for regular regression testing.

---

## ─── TOP SECTION: NON-AUTOMATABLE SCENARIOS ───

The following test scenarios must be validated manually by a QA engineer because automated frameworks (Vitest/Playwright) are sandboxed and cannot access native OS APIs, hardware triggers, or third-party authentication pages.

### 1. OS & Browser Native PWA Integration
* **Why it cannot be automated:** Playwright and Vitest run in automated browser contexts where native URL-bar install prompts and OS-level application shortcuts are disabled or inaccessible.
* **Steps to test:**
  1. Open the platform in a standard browser window (Chrome, Safari, or Edge) on desktop or mobile.
  2. Verify the **Install App** icon appears in the browser's address bar (plus sign or install banner).
  3. Click the install icon and accept the prompt.
  4. **Expected Result:**
     - The app installs and launches in a standalone chromeless window.
     - A desktop shortcut and start menu/launcher shortcut are successfully created.
     - Launching the app via the shortcut loads the home page instantly.

### 2. Lockscreen & Hardware Audio Control (Media Session API)
* **Why it cannot be automated:** Automated test environments do not have physical audio output, physical lockscreens, bluetooth connection APIs, or hardware keys (like volume/media buttons).
* **Steps to test:**
  1. Open the app on a mobile device and start playing any discourse.
  2. Lock the device screen.
  3. **Expected Result:**
     - The lockscreen displays the Media Player widget containing the correct lecture title, speaker name ("HG Radheshyamdas"), and album artwork.
     - Play, pause, seek forward, and seek backward buttons on the lockscreen control playback correctly.
  4. **Headphones / Bluetooth Interruption:**
     - Unplug wired headphones or turn off bluetooth headphones during active playback.
     - **Expected Result:** Playback pauses immediately.
  5. **Call Interruption:**
     - Call the test device while audio is playing.
     - **Expected Result:** Audio pauses when the phone rings and stays paused during the call, resuming or remaining paused cleanly afterwards depending on OS settings.

### 3. Real-World Network State Transitions
* **Why it cannot be automated:** Playwright's `setOffline` simulates offline state by blocking network packets in the browser engine, but does not simulate actual OS interface switching, high packet loss, or DNS resolution timeouts.
* **Steps to test:**
  1. Load the app and start playing an audio track.
  2. Physically disable Wi-Fi/cellular on the device.
  3. **Expected Result:**
     - The app displays an "Offline" status badge/toast in the UI.
     - Audio currently playing does not crash (if pre-buffered or cached).
  4. Move to an area with weak/flaky connectivity.
  5. **Expected Result:** Sync triggers retry gracefully using exponential backoff without throwing unhandled exceptions.
  6. Re-enable Wi-Fi.
  7. **Expected Result:** The app detects network recovery, changes the offline badge to online, and syncs queued data in the background.

### 4. Third-Party OAuth Authentication (Google Login Redirects)
* **Why it cannot be automated:** Google blocks automated browsers (like Playwright's default chromium profile) from logging in to prevent bots, throwing "This browser or app may not be secure" errors.
* **Steps to test:**
  1. Click **Login** in the header.
  2. Click the **Google** login button.
  3. **Expected Result:**
     - The browser redirects to Google's official sign-in page.
     - Complete sign-in using a real Google account.
     - The page redirects back to the platform homepage showing the correct user profile avatar.

### 5. Service Worker Update & Refresh Cycles
* **Why it cannot be automated:** Testing how browser update checks take control of active sessions and handle service worker activation requires reloading active browser windows under live network deployments.
* **Steps to test:**
  1. Open the app.
  2. Deploy a minor update to the Service Worker script (`sw.ts`).
  3. Reload the page or navigate.
  4. **Expected Result:**
     - The browser detects a new service worker version in the background.
     - A toast message appears: "New version available! Click to update." (or updates silently depending on PWA settings).
     - Clicking update replaces the active service worker without corrupting existing IndexedDB data.

---

## ─── SECONDARY SECTION: GOOD TO HAVE (AUTOMATION BACKUPS) ───

The following test scenarios are already covered by our automated unit and Playwright tests, but should be run as quick manual checkpoints to verify visual layouts and responsiveness.

### 6. Local Storage Cache Slider Controls
* **Steps to test:**
  1. Navigate to `/settings`.
  2. Click the Max Cache Limit dropdown selector.
  3. Change the limit to `500 MB`.
  4. **Expected Result:** A toast message appears: "Max cache size set to 500 MB". The limit updates in localStorage and is retained on page refresh.

### 7. Search Bar Dropdown & Filters
* **Steps to test:**
  1. Click the Search input in the header.
  2. Type a word (e.g., "Krishna").
  3. Click the **Filters** button.
  4. **Expected Result:**
     - The advanced search filters panel collapses/expands smoothly.
     - Dropdown filters (Speaker, Language, Venue) show options correctly.

### 8. Theme Swapping & Density
* **Steps to test:**
  1. Hover/click the paint brush icon.
  2. Click **monk**, **clean**, or **dark**.
  3. Click **compact**.
  4. **Expected Result:**
     - Monk/Clean/Dark themes change color tokens instantly.
     - Compact mode reduces spacings on list cards instantly.
