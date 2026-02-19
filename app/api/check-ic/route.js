import { google } from 'googleapis';
import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        // Validate environment variables first
        if (!process.env.GOOGLE_CLIENT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY || !process.env.SHEET_ID) {
            console.error('Missing environment variables:', {
                GOOGLE_CLIENT_EMAIL: !!process.env.GOOGLE_CLIENT_EMAIL,
                GOOGLE_PRIVATE_KEY: !!process.env.GOOGLE_PRIVATE_KEY,
                SHEET_ID: !!process.env.SHEET_ID,
            });
            return NextResponse.json(
                { message: 'Server configuration error. Please set up GOOGLE_CLIENT_EMAIL, GOOGLE_PRIVATE_KEY, and SHEET_ID in .env.local file. See GUIDE_VERIFICATION_SETUP.md for instructions.' },
                { status: 500 }
            );
        }

        const body = await request.json();
        let { icNumber } = body;
        
        // Remove spaces and dashes from IC number
        icNumber = icNumber.replace(/[\s-]/g, '');

        if (!icNumber) {
            return NextResponse.json(
                { message: 'IC number is required' },
                { status: 400 }
            );
        }

        // Initialize Google Sheets API
        const auth = new google.auth.GoogleAuth({
            credentials: {
                client_email: process.env.GOOGLE_CLIENT_EMAIL,
                private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
            },
            scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
        });

        const client = await auth.getClient();
        const sheets = google.sheets({ version: 'v4', auth: client });

        // Fetch data from Google Sheets
        const result = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.SHEET_ID,
            range: "'DATABASE'!A2:AZ",
        });

        const rows = result.data.values;
        
        // Find matching IC number in column D (index 3)
        const matched = rows.find((row) => row[3] === icNumber);

        if (matched) {
            return NextResponse.json({
                RegNo: matched[0],
                name: matched[1],
                nickname: matched[2],
                // WHITE WATER RAFTING
                WWRFTR: matched[6],
                WWRFTRVALID: matched[7],
                WWRFTRCERT: matched[8],
                WWRFTRCARD: matched[9],
                // WATERFALL ABSEILING
                WA: matched[10],
                WAVALID: matched[11],
                WACERT: matched[12],
                WACARD: matched[13],
                // ALL-TERRAIN VEHICLE
                ATV: matched[14],
                ATVVALID: matched[15],
                ATVCERT: matched[16],
                ATVCARD: matched[17],
                // PAINTBALL
                PB: matched[18],
                PBVALID: matched[19],
                PBCERT: matched[20],
                PBCARD: matched[21],
                // SUNSET HIKING / JUNGLE TREKKING / CAVE EXPLORATION
                SHJTCE: matched[22],
                SHJTCEVALID: matched[23],
                SHJTCECERT: matched[24],
                SHJTCECARD: matched[25],
                // TELEMATCH / TEAM BUILDING
                TMTB: matched[26],
                TMTBVALID: matched[27],
                TMTBCERT: matched[28],
                TMTBCARD: matched[29],
                // DRIVER
                DRIVER: matched[30],
                DRIVERVALID: matched[31],
                DRIVERCERT: matched[32],
                DRIVERCARD: matched[33],
            });
        } else {
            return NextResponse.json(
                { message: 'Record not found. Please contact admin.' }
            );
        }
    } catch (error) {
        console.error('Error in check-ic API:', error);
        return NextResponse.json(
            { message: 'Server error' },
            { status: 500 }
        );
    }
}
