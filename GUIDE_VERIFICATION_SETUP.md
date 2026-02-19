# Environment Variables for Guide Verification System

## Required Google Sheets API Credentials

To enable the guide verification functionality, you need to add the following environment variables to your `.env.local` file:

```env
# Google Sheets API Configuration
GOOGLE_CLIENT_EMAIL=your-service-account-email@project-id.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour-Private-Key-Here\n-----END PRIVATE KEY-----\n"
SHEET_ID=your-google-sheet-id-here
```

## Setup Instructions

### 1. Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one

### 2. Enable Google Sheets API

1. In your Google Cloud project, go to "APIs & Services" > "Library"
2. Search for "Google Sheets API"
3. Click "Enable"

### 3. Create a Service Account

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "Service Account"
3. Fill in the service account details
4. Click "Create and Continue"
5. Skip optional steps and click "Done"

### 4. Generate Private Key

1. Click on the newly created service account
2. Go to the "Keys" tab
3. Click "Add Key" > "Create new key"
4. Select "JSON" format
5. Download the JSON file

### 5. Extract Credentials

From the downloaded JSON file, extract:
- `client_email` → Copy to `GOOGLE_CLIENT_EMAIL`
- `private_key` → Copy to `GOOGLE_PRIVATE_KEY` (keep the quotes and newlines as `\n`)

### 6. Get Google Sheet ID

1. Open your Google Sheet
2. The URL will look like: `https://docs.google.com/spreadsheets/d/SHEET_ID/edit`
3. Copy the `SHEET_ID` part

### 7. Share the Sheet with Service Account

1. In your Google Sheet, click "Share"
2. Add the service account email (from step 5)
3. Give it "Viewer" or "Editor" permissions
4. Click "Send"

### 8. Google Sheet Structure

Ensure your Google Sheet has a tab named **"DATABASE"** with the following column structure:

| Column | Index | Field | Description |
|--------|-------|-------|-------------|
| A | 0 | RegNo | Registration Number |
| B | 1 | Name | Guide's Full Name |
| C | 2 | Nickname | Guide's Nickname |
| D | 3 | IC Number | Identity Card Number (used for search) |
| E | 4-5 | - | Reserved |
| F | 6 | WWRFTR | White Water Rafting / Fun Trip Rafting Level |
| G | 7 | WWRFTRVALID | WWR/FTR Validity Date |
| H | 8 | WWRFTRCERT | WWR/FTR Certificate Status |
| I | 9 | WWRFTRCARD | WWR/FTR Card Status |
| J | 10 | WA | Waterfall Abseiling Level |
| K | 11 | WAVALID | WA Validity Date |
| L | 12 | WACERT | WA Certificate Status |
| M | 13 | WACARD | WA Card Status |
| N | 14 | ATV | All-Terrain Vehicle Level |
| O | 15 | ATVVALID | ATV Validity Date |
| P | 16 | ATVCERT | ATV Certificate Status |
| Q | 17 | ATVCARD | ATV Card Status |
| R | 18 | PB | Paintball Level |
| S | 19 | PBVALID | PB Validity Date |
| T | 20 | PBCERT | PB Certificate Status |
| U | 21 | PBCARD | PB Card Status |
| V | 22 | SHJTCE | Sunset Hiking/Jungle Trekking/Cave Exploration Level |
| W | 23 | SHJTCEVALID | SHJTCE Validity Date |
| X | 24 | SHJTCECERT | SHJTCE Certificate Status |
| Y | 25 | SHJTCECARD | SHJTCE Card Status |
| Z | 26 | TMTB | Telematch / Team Building Level |
| AA | 27 | TMTBVALID | TMTB Validity Date |
| AB | 28 | TMTBCERT | TMTB Certificate Status |
| AC | 29 | TMTBCARD | TMTB Card Status |
| AD | 30 | DRIVER | Driver Level |
| AE | 31 | DRIVERVALID | Driver Validity Date |
| AF | 32 | DRIVERCERT | Driver Certificate Status |
| AG | 33 | DRIVERCARD | Driver Card Status |

## Testing

After setting up the environment variables, you can test the functionality by:

1. Starting your development server: `npm run dev`
2. Navigate to `/guide-verification`
3. Enter a valid IC number from your Google Sheet
4. The system should display the guide's information and activity competency levels

## Troubleshooting

### "Record not found" error
- Verify the IC number format in column D of your sheet
- Ensure the sheet name is exactly "DATABASE"
- Check that spaces and dashes are removed from IC numbers

### Authentication errors
- Verify your service account email and private key are correct
- Ensure the service account has access to the Google Sheet
- Check that the private key newlines are properly escaped as `\n`

### API errors
- Confirm Google Sheets API is enabled in your Google Cloud project
- Check that the SHEET_ID is correct
- Verify the range "'DATABASE'!A2:AZ" matches your sheet structure
