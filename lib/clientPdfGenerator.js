// lib/clientPdfGenerator.js
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

export async function generateClientSidePDF(data) {
  // Create a hidden container for the HTML content
  const container = document.createElement('div')
  container.style.position = 'absolute'
  container.style.left = '-9999px'
  container.style.top = '0'
  container.style.width = '210mm' // A4 width
  container.style.background = 'white'
  document.body.appendChild(container)

  try {
    // Generate HTML content
    container.innerHTML = generateHTMLContent(data)

    // Wait for images to load
    const images = container.querySelectorAll('img')
    await Promise.all(Array.from(images).map(img => {
      if (img.complete) return Promise.resolve()
      return new Promise(resolve => {
        img.onload = resolve
        img.onerror = resolve
      })
    }))

    // Convert to canvas
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    })

    // Create PDF
    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF('p', 'mm', 'a4')
    
    const imgWidth = 210 // A4 width in mm
    const pageHeight = 297 // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width
    let heightLeft = imgHeight
    let position = 0

    // Add first page
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
    heightLeft -= pageHeight

    // Add additional pages if needed
    while (heightLeft > 0) {
      position = heightLeft - imgHeight
      pdf.addPage()
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight
    }

    return pdf
  } finally {
    // Clean up
    document.body.removeChild(container)
  }
}

function generateHTMLContent(data) {
  const { submission, participant, activities, emergency, guardian } = data
  
  // Parse health declaration
  let healthDeclaration = participant.health_declaration || ''
  let healthArray = []
  
  if (typeof healthDeclaration === 'string') {
    if (healthDeclaration.trim().startsWith('[') || healthDeclaration.trim().startsWith('{')) {
      try {
        const parsed = JSON.parse(healthDeclaration)
        healthArray = Array.isArray(parsed) ? parsed : Object.values(parsed).filter(Boolean)
      } catch (e) {
        healthArray = healthDeclaration.trim() ? [healthDeclaration] : []
      }
    } else {
      healthArray = healthDeclaration.trim() ? healthDeclaration.split(',').map(h => h.trim()) : []
    }
  } else if (Array.isArray(healthDeclaration)) {
    healthArray = healthDeclaration
  }

  // Format activities
  const activitiesHtml = activities && activities.length > 0
    ? activities.map(act => `
        <div style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
          <strong>${act.activity_name || 'N/A'}</strong><br>
          <span style="font-size: 12px; color: #6b7280;">
            ${act.activity_date ? new Date(act.activity_date).toLocaleDateString() : 'N/A'}
          </span>
        </div>
      `).join('')
    : '<div style="padding: 8px; color: #9ca3af;">No activities</div>'

  // Format health conditions
  const healthHtml = healthArray.length > 0
    ? healthArray.map(condition => `<li style="margin-bottom: 4px;">${condition}</li>`).join('')
    : '<li style="color: #9ca3af;">None declared</li>'

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: Arial, Helvetica, sans-serif; 
      font-size: 11px; 
      line-height: 1.4; 
      color: #1f2937; 
      padding: 15mm;
      background-color: #ffffff;
    }
    .header { text-align: center; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 2px solid #000000; }
    .logo { width: 120px; margin-bottom: 10px; }
    h1 { font-size: 18px; font-weight: bold; margin-bottom: 5px; color: #000000; }
    h2 { font-size: 14px; font-weight: bold; margin: 15px 0 8px 0; border-bottom: 1px solid #d1d5db; padding-bottom: 4px; color: #111827; }
    .section { margin-bottom: 15px; }
    .grid { display: table; width: 100%; }
    .grid > .field { display: table-cell; width: 50%; padding-right: 10px; }
    .field { margin-bottom: 8px; }
    .label { font-weight: bold; font-size: 10px; color: #4b5563; display: block; }
    .value { font-size: 11px; margin-top: 2px; color: #1f2937; display: block; }
    .signature-section { margin-top: 20px; padding-top: 15px; border-top: 1px solid #d1d5db; }
    .signature-box { border: 1px solid #d1d5db; padding: 10px; min-height: 80px; background-color: #ffffff; }
    .qr-container { display: table; width: 100%; margin-top: 15px; }
    .qr-item { display: table-cell; width: 50%; text-align: center; }
    .qr-img { width: 100px; height: 100px; }
    ul { margin-left: 20px; }
    li { color: #1f2937; }
  </style>
</head>
<body>
  <div class="header">
    <img src="/logo/ggph.png" alt="Logo" class="logo">
    <h1>INDEMNITY FORM</h1>
    <div style="font-size: 10px; color: #6b7280;">Participant Information & Liability Waiver</div>
  </div>

  <h2>Participant Information</h2>
  <div class="grid">
    <div class="field">
      <div class="label">Full Name</div>
      <div class="value">${participant.name || 'N/A'}</div>
    </div>
    <div class="field">
      <div class="label">NRIC</div>
      <div class="value">${participant.nric || 'N/A'}</div>
    </div>
    <div class="field">
      <div class="label">Date of Birth</div>
      <div class="value">${participant.dob ? new Date(participant.dob).toLocaleDateString() : 'N/A'}</div>
    </div>
    <div class="field">
      <div class="label">Gender</div>
      <div class="value">${participant.gender || 'N/A'}</div>
    </div>
    <div class="field">
      <div class="label">Phone Number</div>
      <div class="value">${participant.phone || 'N/A'}</div>
    </div>
    <div class="field">
      <div class="label">Email</div>
      <div class="value">${participant.email || 'N/A'}</div>
    </div>
  </div>

  <div class="field" style="margin-top: 10px;">
    <div class="label">Address</div>
    <div class="value">${participant.address || 'N/A'}</div>
  </div>

  ${guardian ? `
    <h2>Guardian Information</h2>
    <div class="grid">
      <div class="field">
        <div class="label">Guardian Name</div>
        <div class="value">${guardian.name || 'N/A'}</div>
      </div>
      <div class="field">
        <div class="label">Guardian NRIC</div>
        <div class="value">${guardian.nric || 'N/A'}</div>
      </div>
      <div class="field">
        <div class="label">Guardian Phone</div>
        <div class="value">${guardian.phone || 'N/A'}</div>
      </div>
      <div class="field">
        <div class="label">Relationship</div>
        <div class="value">${guardian.relationship || 'N/A'}</div>
      </div>
    </div>
  ` : ''}

  ${emergency ? `
    <h2>Emergency Contact</h2>
    <div class="grid">
      <div class="field">
        <div class="label">Contact Name</div>
        <div class="value">${emergency.name || 'N/A'}</div>
      </div>
      <div class="field">
        <div class="label">Contact Phone</div>
        <div class="value">${emergency.phone || 'N/A'}</div>
      </div>
      <div class="field">
        <div class="label">Relationship</div>
        <div class="value">${emergency.relationship || 'N/A'}</div>
      </div>
    </div>
  ` : ''}

  <h2>Activities</h2>
  <div class="section">
    ${activitiesHtml}
  </div>

  <h2>Health Declaration</h2>
  <div class="section">
    <ul>
      ${healthHtml}
    </ul>
  </div>

  <div class="signature-section">
    <h2>Acknowledgement & Signature</h2>
    <div class="signature-box">
      ${submission.signature_url ? `<img src="${submission.signature_url}" alt="Signature" style="max-width: 200px; max-height: 60px;">` : '<div style="color: #9ca3af;">No signature</div>'}
      <div style="margin-top: 10px; font-size: 10px; color: #6b7280;">
        Date: ${submission.created_at ? new Date(submission.created_at).toLocaleString() : 'N/A'}
      </div>
    </div>

    <div class="qr-container">
      <div class="qr-item">
        <img src="/qr/acknowledgement-of-risk.png" alt="Acknowledgement" class="qr-img">
        <div style="font-size: 9px; margin-top: 5px;">Acknowledgement of Risk</div>
      </div>
      <div class="qr-item">
        <img src="/qr/terms-and-condition.png" alt="Terms" class="qr-img">
        <div style="font-size: 9px; margin-top: 5px;">Terms & Conditions</div>
      </div>
    </div>
  </div>
</body>
</html>
  `
}
