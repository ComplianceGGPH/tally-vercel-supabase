import { NextResponse } from 'next/server';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { google } from 'googleapis';
import fs from 'fs/promises';
import path from 'path';

export async function POST(request) {
    try {
        const { icNumber, type, activity } = await request.json(); // type: 'card' or 'certificate', activity: optional activity key

        if (!icNumber) {
            return NextResponse.json({ message: 'IC number is required' }, { status: 400 });
        }

        if (!type || !['card', 'certificate'].includes(type)) {
            return NextResponse.json({ message: 'Valid type (card or certificate) is required' }, { status: 400 });
        }

        // Validate environment variables
        if (!process.env.GOOGLE_CLIENT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY || !process.env.SHEET_ID) {
            return NextResponse.json(
                { message: 'Server configuration error. Missing Google Sheets credentials.' },
                { status: 500 }
            );
        }

        // Fetch guide data from Google Sheets
        const guideData = await fetchGuideData(icNumber);

        if (!guideData) {
            return NextResponse.json({ message: 'Guide not found' }, { status: 404 });
        }

        // Generate PDF based on type
        const pdfBuffer = await generateGuidePDF(guideData, type, activity);
        const filename = type === 'card' 
            ? `guide_card_${activity || 'all'}_${guideData.RegNo}_${Date.now()}.pdf`
            : `guide_certificate_${guideData.RegNo}_${Date.now()}.pdf`;

        return new NextResponse(pdfBuffer, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${filename}"`
            }
        });

    } catch (error) {
        console.error('PDF Generation Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

async function fetchGuideData(icNumber) {
    const cleanIC = icNumber.replace(/[\s-]/g, '');

    const auth = new google.auth.GoogleAuth({
        credentials: {
            client_email: process.env.GOOGLE_CLIENT_EMAIL,
            private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        },
        scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const client = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: client });

    const result = await sheets.spreadsheets.values.get({
        spreadsheetId: process.env.SHEET_ID,
        range: "'DATABASE'!A2:AZ",
    });

    const rows = result.data.values;
    const matched = rows.find((row) => row[3] === cleanIC);

    if (!matched) return null;

    return {
        RegNo: matched[0],
        name: matched[1],
        nickname: matched[2],
        icNumber: matched[3],
        WWRFTR: matched[6],
        WWRFTRVALID: matched[7],
        WA: matched[10],
        WAVALID: matched[11],
        ATV: matched[14],
        ATVVALID: matched[15],
        PB: matched[18],
        PBVALID: matched[19],
        SHJTCE: matched[22],
        SHJTCEVALID: matched[23],
        TMTB: matched[26],
        TMTBVALID: matched[27],
        DRIVER: matched[30],
        DRIVERVALID: matched[31],
    };
}

async function generateGuidePDF(guideData, type, activity = null) {
    if (type === 'card') {
        return await generateCardPDF(guideData, activity);
    } else {
        return await generateCertificatePDF(guideData);
    }
}

async function generateCardPDF(guide, activity = null) {
    const allActivities = [
        { key: 'WWRFTR', label: 'WWR/FTR', fullName: 'White Water Rafting / Fun Trip Rafting', level: guide.WWRFTR || 'NILL', valid: guide.WWRFTRVALID },
        { key: 'WA', label: 'WA', fullName: 'Waterfall Abseiling', level: guide.WA || 'NILL', valid: guide.WAVALID },
        { key: 'ATV', label: 'ATV', fullName: 'All-Terrain Vehicle', level: guide.ATV || 'NILL', valid: guide.ATVVALID },
        { key: 'PB', label: 'PB', fullName: 'Paintball', level: guide.PB || 'NILL', valid: guide.PBVALID },
        { key: 'SHJTCE', label: 'SH/JT/CE', fullName: 'Sunset Hiking / Jungle Trekking / Cave Exploration', level: guide.SHJTCE || 'NILL', valid: guide.SHJTCEVALID },
        { key: 'TMTB', label: 'TM/TB', fullName: 'Telematch / Team Building', level: guide.TMTB || 'NILL', valid: guide.TMTBVALID },
        { key: 'DRIVER', label: 'Driver', fullName: 'Driver', level: guide.DRIVER || 'NILL', valid: guide.DRIVERVALID },
    ];

    const activities = activity 
        ? allActivities.filter(act => act.key === activity)
        : allActivities;

    const pdfDoc = await PDFDocument.create();
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

    const pageWidth = 420;
    const pageHeight = 298;

    for (const act of activities) {
        // FRONT PAGE - Simple white card
        const frontPage = pdfDoc.addPage([pageWidth, pageHeight]);
        
        frontPage.drawRectangle({
            x: 0,
            y: 0,
            width: pageWidth,
            height: pageHeight,
            color: rgb(1, 1, 1),
        });

        frontPage.drawRectangle({
            x: 10,
            y: 10,
            width: pageWidth - 20,
            height: pageHeight - 20,
            borderColor: rgb(0, 0, 0),
            borderWidth: 2,
        });

        // Title
        let y = pageHeight - 50;
        frontPage.drawText('GOPENG GLAMPING PARK', {
            x: 60,
            y: y,
            size: 16,
            font: boldFont,
            color: rgb(0, 0, 0),
        });

        y -= 25;
        frontPage.drawText('Guide Credential Card', {
            x: 60,
            y: y,
            size: 12,
            font: regularFont,
            color: rgb(0, 0, 0),
        });

        // Guide info
        y -= 40;
        frontPage.drawText('Name:', {
            x: 30,
            y: y,
            size: 10,
            font: boldFont,
            color: rgb(0, 0, 0),
        });
        frontPage.drawText(guide.name || '', {
            x: 120,
            y: y,
            size: 10,
            font: regularFont,
            color: rgb(0, 0, 0),
        });

        y -= 25;
        frontPage.drawText('Nickname:', {
            x: 30,
            y: y,
            size: 10,
            font: boldFont,
            color: rgb(0, 0, 0),
        });
        frontPage.drawText(guide.nickname || '', {
            x: 120,
            y: y,
            size: 10,
            font: regularFont,
            color: rgb(0, 0, 0),
        });

        y -= 25;
        frontPage.drawText('Reg No:', {
            x: 30,
            y: y,
            size: 10,
            font: boldFont,
            color: rgb(0, 0, 0),
        });
        frontPage.drawText(guide.RegNo || '', {
            x: 120,
            y: y,
            size: 10,
            font: regularFont,
            color: rgb(0, 0, 0),
        });

        y -= 25;
        frontPage.drawText('IC Number:', {
            x: 30,
            y: y,
            size: 10,
            font: boldFont,
            color: rgb(0, 0, 0),
        });
        frontPage.drawText(guide.icNumber || '', {
            x: 120,
            y: y,
            size: 10,
            font: regularFont,
            color: rgb(0, 0, 0),
        });

        // BACK PAGE - Activity info
        const backPage = pdfDoc.addPage([pageWidth, pageHeight]);
        
        backPage.drawRectangle({
            x: 0,
            y: 0,
            width: pageWidth,
            height: pageHeight,
            color: rgb(1, 1, 1),
        });

        backPage.drawRectangle({
            x: 10,
            y: 10,
            width: pageWidth - 20,
            height: pageHeight - 20,
            borderColor: rgb(0, 0, 0),
            borderWidth: 2,
        });

        // Activity name
        y = pageHeight - 60;
        const activityLines = wrapText(act.fullName, 35);
        activityLines.forEach(line => {
            const textWidth = boldFont.widthOfTextAtSize(line, 14);
            backPage.drawText(line, {
                x: (pageWidth - textWidth) / 2,
                y: y,
                size: 14,
                font: boldFont,
                color: rgb(0, 0, 0),
            });
            y -= 20;
        });

        // Tier
        y -= 20;
        const tierText = `Level: ${act.level}`;
        const tierWidth = boldFont.widthOfTextAtSize(tierText, 20);
        backPage.drawText(tierText, {
            x: (pageWidth - tierWidth) / 2,
            y: y,
            size: 20,
            font: boldFont,
            color: rgb(0, 0, 0),
        });

        // Valid until
        if (act.valid) {
            y -= 35;
            const validText = `Valid Until: ${act.valid}`;
            const validWidth = regularFont.widthOfTextAtSize(validText, 10);
            backPage.drawText(validText, {
                x: (pageWidth - validWidth) / 2,
                y: y,
                size: 10,
                font: regularFont,
                color: rgb(0, 0, 0),
            });
        }
    }

    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
}

// Helper function to wrap text
function wrapText(text, maxChars) {
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';

    words.forEach(word => {
        if ((currentLine + word).length <= maxChars) {
            currentLine += (currentLine ? ' ' : '') + word;
        } else {
            if (currentLine) lines.push(currentLine);
            currentLine = word;
        }
    });
    
    if (currentLine) lines.push(currentLine);
    return lines;
}

async function generateCertificatePDF(guide, activity = null) {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]); // A4
    
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

    // Border
    page.drawRectangle({
        x: 50,
        y: 50,
        width: 495,
        height: 742,
        borderColor: rgb(0, 0, 0),
        borderWidth: 2,
    });

    // Title
    let y = 750;
    page.drawText('CERTIFICATE', {
        x: 180,
        y: y,
        size: 28,
        font: boldFont,
        color: rgb(0, 0, 0),
    });

    y -= 30;
    page.drawText('of Activity Competency', {
        x: 210,
        y: y,
        size: 14,
        font: regularFont,
        color: rgb(0, 0, 0),
    });

    // Line
    y -= 20;
    page.drawRectangle({
        x: 100,
        y: y,
        width: 395,
        height: 1,
        color: rgb(0, 0, 0),
    });

    // Body
    y -= 50;
    page.drawText('This is to certify that', {
        x: 100,
        y: y,
        size: 12,
        font: regularFont,
        color: rgb(0, 0, 0),
    });

    y -= 35;
    page.drawText(guide.name, {
        x: 100,
        y: y,
        size: 18,
        font: boldFont,
        color: rgb(0, 0, 0),
    });

    y -= 30;
    page.drawText(`Registration No: ${guide.RegNo}`, {
        x: 100,
        y: y,
        size: 11,
        font: regularFont,
        color: rgb(0, 0, 0),
    });

    y -= 40;
    page.drawText('has successfully completed training in:', {
        x: 100,
        y: y,
        size: 12,
        font: regularFont,
        color: rgb(0, 0, 0),
    });

    // Activities
    const activities = [
        { key: 'WWRFTR', name: 'White Water Rafting / Fun Trip Rafting', level: guide.WWRFTR },
        { key: 'WA', name: 'Waterfall Abseiling', level: guide.WA },
        { key: 'ATV', name: 'All-Terrain Vehicle', level: guide.ATV },
        { key: 'PB', name: 'Paintball', level: guide.PB },
        { key: 'SHJTCE', name: 'Sunset Hiking / Jungle Trekking / Cave Exploration', level: guide.SHJTCE },
        { key: 'TMTB', name: 'Telematch / Team Building', level: guide.TMTB },
        { key: 'DRIVER', name: 'Driver', level: guide.DRIVER },
    ];

    const certified = activities.filter(act => act.level && act.level !== 'NILL' && act.level !== 'TIER 1');
    
    y -= 30;
    if (certified.length > 0) {
        certified.forEach(act => {
            page.drawText(`• ${act.name} (${act.level})`, {
                x: 120,
                y: y,
                size: 11,
                font: regularFont,
                color: rgb(0, 0, 0),
            });
            y -= 22;
        });
    } else {
        page.drawText('No Tier 2 or Tier 3 certifications', {
            x: 120,
            y: y,
            size: 11,
            font: regularFont,
            color: rgb(0, 0, 0),
        });
    }

    // Date
    y -= 40;
    const currentDate = new Date().toLocaleDateString('en-MY', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    page.drawText(`Date: ${currentDate}`, {
        x: 100,
        y: y,
        size: 10,
        font: regularFont,
        color: rgb(0, 0, 0),
    });

    // Signature line
    y -= 60;
    page.drawRectangle({
        x: 100,
        y: y,
        width: 150,
        height: 1,
        color: rgb(0, 0, 0),
    });

    y -= 15;
    page.drawText('Authorized Signature', {
        x: 100,
        y: y,
        size: 9,
        font: regularFont,
        color: rgb(0, 0, 0),
    });

    // Footer
    page.drawText('Gopeng Glamping Park - Guide Training Program', {
        x: 170,
        y: 70,
        size: 9,
        font: regularFont,
        color: rgb(0, 0, 0),
    });

    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
}
