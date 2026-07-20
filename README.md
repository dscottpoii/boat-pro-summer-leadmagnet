# Boat Pro USA - 2026 Annapolis Boat Shows Lead Magnet

This landing page collects a visitor's first name, last name, and email address, then delivers the 2026 Annapolis Boat Shows Do's & Don'ts Guide PDF.

## Production protections

The website and Apps Script include:

- JSON response validation before the website displays a success message
- A hidden honeypot and minimum form-completion time to reject simple bots
- A 15-minute request cooldown per email address
- A default limit of 100 guide emails per day
- Accurate `Pending`, `Email sent`, and `Email failed` statuses in Google Sheets
- Signed unsubscribe links and an automatic `Unsubscribes` sheet
- Suppression of future guide and marketing emails to unsubscribed addresses

Adjust `DAILY_SEND_LIMIT`, `EMAIL_COOLDOWN_SECONDS`, or `MINIMUM_FORM_TIME_MS` in `Code.gs` if required.

## 1. Merge the corrected website

1. Open Pull Request #1.
2. Confirm the changed files include `index.html`, `Code.gs`, this README, and the guide PDF.
3. Merge the pull request into `main`.
4. Confirm `main` contains:
   - `index.html`
   - `1845.png`
   - `2026-Annapolis-Boat-Shows-Dos-and-Donts-Guide.pdf`
   - `Code.gs`
   - `README.md`

Do not publish GitHub Pages until the PDF is present on `main`, because the delivery email links to that file.

## 2. Configure Google Sheets and Apps Script

1. Create or open the Google Sheet that will hold Boat Pro subscribers.
2. Select **Extensions > Apps Script**.
3. Replace the sample script with the contents of `Code.gs`.
4. Save the project as **Boat Pro USA Lead Capture**.
5. Select **Deploy > New deployment**.
6. Choose **Web app**.
7. Set **Execute as** to **Me**.
8. Set access to **Anyone**.
9. Authorize Google Sheets and email access.
10. Deploy and copy the URL ending in `/exec`.
11. Confirm it matches `scriptURL` in `index.html`. If it does not, update `index.html` and commit the change.

Whenever `Code.gs` changes, select **Deploy > Manage deployments**, edit the web app, choose **New version**, and redeploy. Keeping the same deployment preserves the existing `/exec` URL.

## 3. Test the complete automation

1. Open the website preview.
2. Submit a test using an email address you can access.
3. Confirm the `Leads` tab is created.
4. Confirm the row status changes from `Pending` to `Email sent`.
5. Confirm the delivery email arrives.
6. Open the PDF from the email.
7. Test the immediate download link on the success message.
8. Select the unsubscribe link in the email.
9. Confirm an `Unsubscribes` tab is created.
10. Confirm the lead status changes to `Unsubscribed`.
11. Submit the form with that address again and confirm it is suppressed.
12. Repeat the website test on a phone.

## 4. Enable GitHub Pages

1. Open the repository.
2. Select **Settings > Pages**.
3. Under **Build and deployment**, choose:
   - **Source:** Deploy from a branch
   - **Branch:** `main`
   - **Folder:** `/ (root)`
4. Select **Save**.
5. Wait for deployment to finish.
6. Open:
   `https://dscottpoii.github.io/boat-pro-summer-leadmagnet/`
7. Repeat the form, email, PDF, and unsubscribe tests in a private browser window.

## 5. Final launch checklist

- The Boat Pro logo loads.
- The Annapolis guide PDF downloads.
- A submission creates a lead row.
- The status reports the actual email result.
- The delivery email arrives.
- The Apps Script URL ends in `/exec`.
- Spam protection and daily limits are active.
- The unsubscribe link works and suppresses future messages.
- No placeholder URLs remain.
- The mobile layout works.
- GitHub Pages shows the Annapolis guide rather than the old Spring Dewinterization offer.
