# Boat Pro USA - 2026 Annapolis Boat Shows Lead Magnet

This landing page collects a visitor\'s first name, last name, and email address, then delivers the 2026 Annapolis Boat Shows Do\'s & Don\'ts Guide PDF.

## Google Sheets and email setup

1. Open the Google Sheet that will hold Boat Pro subscribers.
2. Select **Extensions > Apps Script**.
3. Replace the existing script with the contents of `Code.gs`.
4. Save the project.
5. Select **Deploy > Manage deployments**.
6. Edit the existing web-app deployment or create a new one.
7. Set **Execute as** to **Me** and access to **Anyone**.
8. Authorize Google Sheets and email access, then deploy.
9. If Google supplies a new `/exec` URL, replace `scriptURL` in both HTML files.

The script creates a `Leads` tab automatically, records each submission, and emails the guide link. Submit one test lead after deployment and confirm both the spreadsheet row and received email.
