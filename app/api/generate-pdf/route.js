// app/api/generate-pdf/route.js
import { NextResponse } from 'next/server'
import puppeteer from 'puppeteer-core'
import chromium from '@sparticuz/chromium'
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(request) {
  try {
    const { submissionId, group } = await request.json()
    
    if (submissionId) {
      // Fetch single submission with all related data
      const data = await fetchSubmissionData(submissionId)
      const pdfBuffer = await generatePDF(data)
      
      return new NextResponse(pdfBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="indemnity_${data.participant.nric}.pdf"`
        }
      })
    } else if (group) {
      // Fetch all submissions for a group
      const { data: submissions, error } = await supabase
        .from('submissions')
        .select('id')
        .eq('group', group)
      
      if (error) throw error
      
      // For now, generate first one (you can zip multiple later)
      if (submissions.length > 0) {
        const data = await fetchSubmissionData(submissions[0].id)
        const pdfBuffer = await generatePDF(data)
        
        return new NextResponse(pdfBuffer, {
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="indemnity_group_${group}.pdf"`
          }
        })
      }
    }
    
    throw new Error('No submissionId or group provided')
    
  } catch (error) {
    console.error('PDF Generation Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

async function fetchSubmissionData(submissionId) {
  // Fetch submission
  const { data: submission, error: subError } = await supabase
    .from('submissions')
    .select('*')
    .eq('id', submissionId)
    .single()
  
  if (subError) throw subError
  
  // Fetch participant
  const { data: participant, error: partError } = await supabase
    .from('participants')
    .select('*')
    .eq('id', submission.participant_id)
    .single()
  
  if (partError) throw partError
  
  // Fetch activities
  const { data: activities, error: actError } = await supabase
    .from('activities')
    .select('*')
    .eq('submission_id', submissionId)
  
  if (actError) throw actError
  
  // Fetch emergency contact
  let emergency = null
  if (submission.emergency_id) {
    const { data: emergencyData } = await supabase
      .from('emergency_contacts')
      .select('*')
      .eq('id', submission.emergency_id)
      .single()
    emergency = emergencyData
  }
  
  // Fetch guardian (if exists)
  let guardian = null
  if (submission.guardian_id) {
    const { data: guardianData } = await supabase
      .from('guardians')
      .select('*')
      .eq('id', submission.guardian_id)
      .single()
    guardian = guardianData
  }
  
  return {
    submission,
    participant,
    activities,
    emergency,
    guardian
  }
}

async function generatePDF(data) {
  const browser = await puppeteer.launch({
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath: await chromium.executablePath(),
    headless: chromium.headless,
  })
  
  const page = await browser.newPage()
  
  // Convert logo to base64
  let logoBase64 = ''
  try {
    const logoPath = path.join(process.cwd(), 'public', 'logo', 'ggph.png')
    const logoBuffer = fs.readFileSync(logoPath)
    logoBase64 = `data:image/png;base64,${logoBuffer.toString('base64')}`
  } catch (error) {
    console.error('Error loading logo:', error)
  }
  
  // Convert QR codes to base64
  let qrAcknowledgementBase64 = ''
  let qrTermsBase64 = ''
  try {
    const qrAckPath = path.join(process.cwd(), 'public', 'qr', 'acknowledgement-of-risk.png')
    const qrAckBuffer = fs.readFileSync(qrAckPath)
    qrAcknowledgementBase64 = `data:image/png;base64,${qrAckBuffer.toString('base64')}`
  } catch (error) {
    console.error('Error loading QR acknowledgement:', error)
  }
  
  try {
    const qrTermsPath = path.join(process.cwd(), 'public', 'qr', 'terms-and-condition.png')
    const qrTermsBuffer = fs.readFileSync(qrTermsPath)
    qrTermsBase64 = `data:image/png;base64,${qrTermsBuffer.toString('base64')}`
  } catch (error) {
    console.error('Error loading QR terms:', error)
  }
  
  const htmlContent = generateHTMLTemplate(data, logoBase64, qrAcknowledgementBase64, qrTermsBase64)
  
  await page.setContent(htmlContent, { waitUntil: 'networkidle0' })
  
  const pdfBuffer = await page.pdf({
    format: 'A4',
    printBackground: true,
    margin: { top: '15mm', right: '15mm', bottom: '15mm', left: '15mm' }
  })
  
  await browser.close()
  return pdfBuffer
}

function generateHTMLTemplate(data, logoBase64 = '', qrAcknowledgementBase64 = '', qrTermsBase64 = '') {
  const { submission, participant, activities, emergency, guardian } = data
  
  // Parse health declaration
  let healthDeclaration = participant.health_declaration || ''
  let healthArray = []
  
  // If it's a string, check if it's JSON or plain text
  if (typeof healthDeclaration === 'string') {
    if (healthDeclaration.trim().startsWith('[') || healthDeclaration.trim().startsWith('{')) {
      // Try to parse as JSON
      try {
        const parsed = JSON.parse(healthDeclaration)
        healthArray = Array.isArray(parsed) ? parsed : Object.values(parsed).filter(Boolean)
      } catch (e) {
        // If parsing fails, treat as plain text (other condition)
        healthArray = healthDeclaration.trim() ? [healthDeclaration] : []
      }
    } else {
      // Plain text - treat as "other" condition
      healthArray = healthDeclaration.trim() ? [healthDeclaration] : []
    }
  } else if (Array.isArray(healthDeclaration)) {
    healthArray = healthDeclaration
  } else if (typeof healthDeclaration === 'object' && healthDeclaration !== null) {
    healthArray = Object.values(healthDeclaration).filter(Boolean)
  }
  
  // Check if each condition is selected (from predefined checkboxes)
  const hasAsthma = healthArray.some(item => item && (item.includes('Asthma') || item.includes('Asma')))
  const hasBrainInjury = healthArray.some(item => item && (item.includes('Brain') || item.includes('Otak')))
  const hasChestSurgery = healthArray.some(item => item && (item.includes('Chest Surgery') || item.includes('Pembedahan Dada')))
  const hasBronchitis = healthArray.some(item => item && (item.includes('Chronic Bronchitis') || item.includes('Bronkitis')))
  const hasEpilepsy = healthArray.some(item => item && (item.includes('Epilepsy') || item.includes('Epilepsi')))
  const hasHeartDisease = healthArray.some(item => item && (item.includes('Heart') || item.includes('Jantung')))
  const hasInjury = healthArray.some(item => item && (item.includes('Injury') || item.includes('Surgery') || item.includes('Kecederaan')))
  const isPregnant = healthArray.some(item => item && (item.includes('Pregnant') || item.includes('Mengandung')))

  // If it's free-form text (not matching any standard conditions), treat as "other"
  const otherConditions = healthArray.filter(item => {
    if (!item) return false
    // If it doesn't contain any standard condition keywords, it's "other"
    return !standardConditions.some(std => item.includes(std))
  })
  
  const hasOther = otherConditions.length > 0
  const otherDescription = otherConditions.join(', ')
  
  // If no health issues at all
  const hasNoIssues = healthArray.length === 0
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Arial', sans-serif;
          font-size: 11px;
          line-height: 1.4;
          color: #000;
          padding: 20px;
        }
        
        .header {
          text-align: center;
          margin-bottom: 20px;
          border-bottom: 3px solid #333;
          padding-bottom: 15px;
        }
        
        .header h1 {
          font-size: 18px;
          font-weight: bold;
          margin-bottom: 5px;
        }
        
        .header p {
          font-size: 10px;
          color: #666;
          font-style: italic;
        }
        
        .section {
          margin: 15px 0;
        }
        
        .section-title {
          font-weight: bold;
          font-size: 12px;
          background: #f0f0f0;
          padding: 8px;
          margin-bottom: 10px;
          border-left: 4px solid #333;
        }
        
        .medical-table {
          width: 100%;
          border-collapse: collapse;
          margin: 10px 0;
        }
        
        .medical-table td {
          padding: 6px 8px;
          border: 1px solid #ccc;
        }
        
        .medical-table .condition {
          width: 70%;
        }
        
        .medical-table .checkbox {
          width: 15%;
          text-align: center;
          font-weight: bold;
        }
        
        .checkbox-header {
          background: #e0e0e0;
          font-weight: bold;
        }
        
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin: 10px 0;
        }
        
        .info-item {
          padding: 8px;
          border: 1px solid #ddd;
          background: #fafafa;
        }
        
        .info-item.full-width {
          grid-column: 1 / -1;
        }
        
        .info-label {
          font-weight: bold;
          font-size: 10px;
          color: #555;
          margin-bottom: 3px;
        }
        
        .info-value {
          font-size: 11px;
          color: #000;
        }
        
        .declaration {
          margin: 15px 0;
          padding: 12px;
          border: 1px solid #ddd;
          background: #f9f9f9;
          font-size: 10px;
          text-align: justify;
          line-height: 1.5;
        }
        
        .declaration p {
          margin-bottom: 10px;
        }
        
        .signature-section {
          margin-top: 30px;
          padding: 15px;
          border: 2px solid #333;
        }
        
        .signature-box {
          margin: 20px 0;
          padding-top: 40px;
          border-bottom: 2px solid #000;
          position: relative;
          text-align: center;
        }
        
        .signature-box label {
          position: absolute;
          top: 0;
          left: 0;
          font-weight: bold;
          font-size: 10px;
        }
        
        .signature-box img {
          display: block;
          margin: 0 auto;
        }
        
        .guardian-section {
          margin-top: 20px;
          padding: 15px;
          background: #fff8e1;
          border: 2px dashed #ff9800;
        }
        
        .guardian-title {
          font-weight: bold;
          margin-bottom: 10px;
          color: #ff6f00;
        }
        
        .checkmark {
          color: #4CAF50;
          font-weight: bold;
          font-size: 14px;
        }
        
        .footer-note {
          margin-top: 20px;
          padding: 10px;
          background: #e3f2fd;
          border-left: 4px solid #2196F3;
          font-size: 10px;
          font-style: italic;
        }
        
        .qr-container {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 30px;
          margin: 20px 0;
          padding: 20px;
        }
        
        .qr-box {
          text-align: center;
          flex: 1;
          max-width: 400px;
        }
        
        .qr-box img {
          width: 100%;
          max-width: 350px;
          height: auto;
        }
        
        .qr-label {
          font-weight: bold;
          font-size: 11px;
          margin-bottom: 10px;
          color: #333;
        }
      </style>
    </head>
    <body>
      <div class="header">
        ${logoBase64 ? `<img src="${logoBase64}" alt="GGPH Logo" width="200" />` : '<div style="height: 80px;"></div>'}
        <h1>PARTICIPANT'S REGISTRATION AND ACKNOWLEDGEMENT OF RISK</h1>
        <p>**Please take note that this is a customer copy only.**</p>
      </div>

      <!-- PERSONAL INFORMATION -->
      <div class="section">
        <div class="section-title">PERSONAL INFORMATION</div>
        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">Participant Full Name:</div>
            <div class="info-value">${participant.fullname || ''}</div>
          </div>
          <div class="info-item">
            <div class="info-label">NRIC:</div>
            <div class="info-value">${participant.nric || ''}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Gender:</div>
            <div class="info-value">${participant.gender || ''}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Tel No:</div>
            <div class="info-value">${participant.phone_number || ''}</div>
          </div>
          <div class="info-item full-width">
            <div class="info-label">Address:</div>
            <div class="info-value">${participant.full_address || ''}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Nationality:</div>
            <div class="info-value">${participant.nationality || ''}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Age:</div>
            <div class="info-value">${participant.age || ''}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Date of Birth:</div>
            <div class="info-value">${participant.dob || ''}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Race:</div>
            <div class="info-value">${participant.race || ''}</div>
          </div>
          <div class="info-item full-width">
            <div class="info-label">Email:</div>
            <div class="info-value">${participant.email || ''}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Branch:</div>
            <div class="info-value">${submission.branch || ''}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Group:</div>
            <div class="info-value">${submission.group || ''}</div>
          </div>
        </div>
      </div>

      <div style="page-break-before: always;"></div>
      
      <!-- ACTIVITY INFORMATION -->
      ${activities && activities.length > 0 ? `
      <div class="section">
        <div class="section-title">ACTIVITY INFORMATION</div>
        ${activities.map(activity => `
          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">Activity Name:</div>
              <div class="info-value">${activity.activity_name || ''}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Activity Date:</div>
              <div class="info-value">${activity.activity_date || ''}</div>
            </div>
            <div class="info-item full-width">
              <div class="info-label">Activity Time:</div>
              <div class="info-value">${activity.activity_time || ''}</div>
            </div>
          </div>
        `).join('')}
      </div>
      ` : ''}


      <!-- MEDICAL INFORMATION -->
      <div class="section">
        <div class="section-title">MEDICAL INFORMATION</div>
        <p style="margin-bottom: 10px; font-size: 10px;">Have you ever suffered and/or currently suffering any of the following?</p>
        
        <table class="medical-table">
          <tr class="checkbox-header">
            <td class="condition">CONDITION</td>
            <td class="checkbox">YES</td>
            <td class="checkbox">NO</td>
          </tr>
          <tr>
            <td class="condition">ASTHMA OR WHEEZING</td>
            <td class="checkbox">${hasAsthma ? '✓' : ''}</td>
            <td class="checkbox">${!hasAsthma || hasNoIssues ? '✓' : ''}</td>
          </tr>
          <tr>
            <td class="condition">BRAIN INJURY, SPINAL CORD INJURY OR NERVOUS DISORDER</td>
            <td class="checkbox">${hasBrainInjury ? '✓' : ''}</td>
            <td class="checkbox">${!hasBrainInjury || hasNoIssues ? '✓' : ''}</td>
          </tr>
          <tr>
            <td class="condition">CHEST SURGERY</td>
            <td class="checkbox">${hasChestSurgery ? '✓' : ''}</td>
            <td class="checkbox">${!hasChestSurgery || hasNoIssues ? '✓' : ''}</td>
          </tr>
          <tr>
            <td class="condition">CHRONIC BRONCHITIS OR PERSISTENT CHEST COMPLAINTS</td>
            <td class="checkbox">${hasBronchitis ? '✓' : ''}</td>
            <td class="checkbox">${!hasBronchitis || hasNoIssues ? '✓' : ''}</td>
          </tr>
          <tr>
            <td class="condition">EPILEPSY/ FAINTING/ SEIZURES/ BLACKOUTS</td>
            <td class="checkbox">${hasEpilepsy ? '✓' : ''}</td>
            <td class="checkbox">${!hasEpilepsy || hasNoIssues ? '✓' : ''}</td>
          </tr>
          <tr>
            <td class="condition">HEART DISEASE OF ANY KIND</td>
            <td class="checkbox">${hasHeartDisease ? '✓' : ''}</td>
            <td class="checkbox">${!hasHeartDisease || hasNoIssues ? '✓' : ''}</td>
          </tr>
          <tr>
            <td class="condition">MAJOR / MINOR INJURY OR SURGERY</td>
            <td class="checkbox">${hasInjury ? '✓' : ''}</td>
            <td class="checkbox">${!hasInjury || hasNoIssues ? '✓' : ''}</td>
          </tr>
          <tr>
            <td class="condition">PREGNANT</td>
            <td class="checkbox">${isPregnant ? '✓' : ''}</td>
            <td class="checkbox">${!isPregnant || hasNoIssues ? '✓' : ''}</td>
          </tr>
          <tr>
            <td class="condition">OTHER: ${hasOther ? otherDescription : ''}</td>
            <td class="checkbox">${hasOther ? '✓' : ''}</td>
            <td class="checkbox">${!hasOther || hasNoIssues ? '✓' : ''}</td>
          </tr>
        </table>
        
        <p style="margin-top: 10px; font-size: 10px;">
          <span class="checkmark">✓</span> Having answered "YES" to any of the medical conditions stated above, 
          I have been offered the opportunity not to participate in the activity.
        </p>
      </div>

      <div style="page-break-before: always;"></div>

      <!-- EMERGENCY CONTACT -->
      ${emergency ? `
      <div class="section">
        <div class="section-title">EMERGENCY CONTACT INFORMATION</div>
        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">Name:</div>
            <div class="info-value">${emergency.emergency_fullname || ''}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Relationship:</div>
            <div class="info-value">${emergency.emergency_relationship || ''}</div>
          </div>
          <div class="info-item full-width">
            <div class="info-label">Tel No:</div>
            <div class="info-value">${emergency.emergency_phone || ''}</div>
          </div>
        </div>
      </div>
      ` : ''}

      <!-- DECLARATION - QR CODES -->
      <div class="section">
        <div class="section-title">ACKNOWLEDGEMENT AND TERMS</div>
        <div class="qr-container">
          <div class="qr-box">
            ${qrAcknowledgementBase64 ? `<img src="${qrAcknowledgementBase64}" alt="Acknowledgement of Risk QR" />` : '<p style="font-size: 10px; color: #999;">QR Code not available</p>'}
          </div>
          <div class="qr-box">
            ${qrTermsBase64 ? `<img src="${qrTermsBase64}" alt="Terms and Condition QR" />` : '<p style="font-size: 10px; color: #999;">QR Code not available</p>'}
          </div>
        </div>
        <p style="text-align: center; font-size: 10px; color: #666; margin-top: 10px; font-style: italic;">
          Scan the QR codes above to view the full Acknowledgement of Risk and Terms & Conditions
        </p>
      </div>

      <!-- SIGNATURE SECTION -->
      <div class="signature-section">
        <div class="signature-box">
          <label>Participant Signature:</label>
          ${participant.participant_signature ? `<img src="${participant.participant_signature}" style="max-height: 60px;" />` : ''}
        </div>
      </div>

      <!-- GUARDIAN SECTION (if under 18 or guardian exists) -->
      ${guardian ? `
      <div class="guardian-section">
        <div class="guardian-title">If the participant is under 18 Years Of Age:</div>
        <p style="font-size: 10px; margin-bottom: 15px;">I am the parent or legal guardian of the participant. I hereby sign below in agreement for the release of liability and assumption of risk for my child / ward named above.</p>
        
        <div class="info-grid">
          <div class="info-item full-width">
            <div class="info-label">Name of minor participant's Parent / Guardian:</div>
            <div class="info-value">${guardian.guardian_name || ''}</div>
          </div>
          <div class="info-item full-width">
            <div class="info-label">NRIC of minor participant's Parent / Guardian:</div>
            <div class="info-value">${guardian.guardian_nric || ''}</div>
          </div>
        </div>
        
        <div class="signature-box">
          <label>Signature of minor participant's Parent / Guardian:</label>
          ${guardian.guardian_signature ? `<img src="${guardian.guardian_signature}" style="max-height: 50px;" />` : ''}
        </div>
      </div>
      ` : ''}
    </body>
    </html>
  `
}