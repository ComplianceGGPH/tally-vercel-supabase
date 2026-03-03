// lib/clientPdfGenerator.js
import jsPDF from 'jspdf'

// Helper to load image as base64
async function loadImageAsBase64(url) {
  try {
    const response = await fetch(url)
    const blob = await response.blob()
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  } catch (error) {
    console.error('Error loading image:', url, error)
    return null
  }
}

export async function generateClientSidePDF(data) {
  const pdf = new jsPDF('p', 'mm', 'a4')
  const { submission, participant, activities, emergency, guardian } = data
  
  let yPos = 20
  const pageWidth = 210
  const margin = 15
  const contentWidth = pageWidth - (margin * 2)
  const colWidth = contentWidth / 2
  
  // Load images
  const logoBase64 = await loadImageAsBase64('/logo/ggph.png')
  const qrAckBase64 = await loadImageAsBase64('/qr/acknowledgement-of-risk.png')
  const qrTermsBase64 = await loadImageAsBase64('/qr/terms-and-condition.png')
  
  // Helper functions
  const checkPageBreak = (spaceNeeded = 10) => {
    if (yPos + spaceNeeded > 280) {
      pdf.addPage()
      yPos = 20
    }
  }
  
  const addSectionTitle = (title) => {
    checkPageBreak(8)
    pdf.setFontSize(12)
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(0, 0, 0)
    pdf.text(title, margin, yPos)
    yPos += 2
    pdf.setDrawColor(200, 200, 200)
    pdf.line(margin, yPos, pageWidth - margin, yPos)
    yPos += 6
  }
  
  const addField = (label, value, xOffset = 0) => {
    checkPageBreak(10)
    pdf.setFontSize(8)
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(100, 100, 100)
    pdf.text(label, margin + xOffset, yPos)
    yPos += 4
    
    pdf.setFontSize(10)
    pdf.setFont('helvetica', 'normal')
    pdf.setTextColor(0, 0, 0)
    
    // Handle long text wrapping
    const lines = pdf.splitTextToSize(value, colWidth - 5)
    pdf.text(lines, margin + xOffset, yPos)
    yPos += (lines.length * 5)
  }
  
  const addFieldRow = (label1, value1, label2, value2) => {
    const startY = yPos
    
    // Left column
    pdf.setFontSize(8)
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(100, 100, 100)
    pdf.text(label1, margin, yPos)
    yPos += 4
    
    pdf.setFontSize(10)
    pdf.setFont('helvetica', 'normal')
    pdf.setTextColor(0, 0, 0)
    const lines1 = pdf.splitTextToSize(value1, colWidth - 5)
    pdf.text(lines1, margin, yPos)
    
    // Right column
    const rightY = startY
    pdf.setFontSize(8)
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(100, 100, 100)
    pdf.text(label2, margin + colWidth, rightY)
    
    pdf.setFontSize(10)
    pdf.setFont('helvetica', 'normal')
    pdf.setTextColor(0, 0, 0)
    const lines2 = pdf.splitTextToSize(value2, colWidth - 5)
    pdf.text(lines2, margin + colWidth, rightY + 4)
    
    yPos = startY + Math.max(lines1.length * 5, lines2.length * 5) + 4
  }
  
  // Header with logo
  if (logoBase64) {
    pdf.addImage(logoBase64, 'PNG', pageWidth / 2 - 15, yPos, 30, 15)
    yPos += 18
  }
  
  pdf.setFontSize(18)
  pdf.setFont('helvetica', 'bold')
  pdf.setTextColor(0, 0, 0)
  pdf.text('INDEMNITY FORM', pageWidth / 2, yPos, { align: 'center' })
  yPos += 6
  
  pdf.setFontSize(9)
  pdf.setFont('helvetica', 'normal')
  pdf.setTextColor(100, 100, 100)
  pdf.text('Participant Information & Liability Waiver', pageWidth / 2, yPos, { align: 'center' })
  yPos += 5
  
  pdf.setDrawColor(0, 0, 0)
  pdf.setLineWidth(0.5)
  pdf.line(margin, yPos, pageWidth - margin, yPos)
  yPos += 10
  
  // Participant Information
  addSectionTitle('Participant Information')
  
  addFieldRow('Full Name', participant.name || 'N/A', 'NRIC', participant.nric || 'N/A')
  addFieldRow('Date of Birth', participant.dob ? new Date(participant.dob).toLocaleDateString() : 'N/A', 'Gender', participant.gender || 'N/A')
  addFieldRow('Phone Number', participant.phone || 'N/A', 'Email', participant.email || 'N/A')
  addField('Address', participant.address || 'N/A')
  
  yPos += 3
  
  // Guardian Information
  if (guardian) {
    addSectionTitle('Guardian Information')
    addFieldRow('Guardian Name', guardian.name || 'N/A', 'Guardian NRIC', guardian.nric || 'N/A')
    addFieldRow('Guardian Phone', guardian.phone || 'N/A', 'Relationship', guardian.relationship || 'N/A')
    yPos += 3
  }
  
  // Emergency Contact
  if (emergency) {
    addSectionTitle('Emergency Contact')
    addFieldRow('Contact Name', emergency.name || 'N/A', 'Contact Phone', emergency.phone || 'N/A')
    addField('Relationship', emergency.relationship || 'N/A')
    yPos += 3
  }
  
  // Activities
  addSectionTitle('Activities')
  
  if (activities && activities.length > 0) {
    activities.forEach((act, index) => {
      checkPageBreak(12)
      pdf.setFontSize(10)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(0, 0, 0)
      pdf.text(`${index + 1}. ${act.activity_name || 'N/A'}`, margin, yPos)
      yPos += 5
      
      pdf.setFontSize(9)
      pdf.setFont('helvetica', 'normal')
      pdf.setTextColor(100, 100, 100)
      pdf.text(act.activity_date ? new Date(act.activity_date).toLocaleDateString() : 'N/A', margin + 5, yPos)
      yPos += 7
    })
  } else {
    pdf.setFontSize(9)
    pdf.setFont('helvetica', 'italic')
    pdf.setTextColor(150, 150, 150)
    pdf.text('No activities', margin, yPos)
    yPos += 7
  }
  
  yPos += 3
  
  // Health Declaration
  addSectionTitle('Health Declaration')
  
  let healthArray = []
  let healthDeclaration = participant.health_declaration || ''
  
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
  
  if (healthArray.length > 0) {
    healthArray.forEach((condition) => {
      checkPageBreak(6)
      pdf.setFontSize(9)
      pdf.setFont('helvetica', 'normal')
      pdf.setTextColor(0, 0, 0)
      const lines = pdf.splitTextToSize(`• ${condition}`, contentWidth - 5)
      pdf.text(lines, margin + 3, yPos)
      yPos += lines.length * 5
    })
  } else {
    pdf.setFontSize(9)
    pdf.setFont('helvetica', 'italic')
    pdf.setTextColor(150, 150, 150)
    pdf.text('None declared', margin, yPos)
    yPos += 6
  }
  
  yPos += 5
  
  // Signature Section
  checkPageBreak(50)
  pdf.setDrawColor(200, 200, 200)
  pdf.line(margin, yPos, pageWidth - margin, yPos)
  yPos += 7
  
  addSectionTitle('Acknowledgement & Signature')
  
  // Signature box
  pdf.setDrawColor(200, 200, 200)
  pdf.setLineWidth(0.3)
  pdf.rect(margin, yPos, contentWidth, 35)
  
  if (submission.signature_url) {
    try {
      const signatureBase64 = await loadImageAsBase64(submission.signature_url)
      if (signatureBase64) {
        pdf.addImage(signatureBase64, 'PNG', margin + 5, yPos + 5, 60, 20)
      }
    } catch (error) {
      pdf.setFontSize(9)
      pdf.setFont('helvetica', 'italic')
      pdf.setTextColor(150, 150, 150)
      pdf.text('[Signature on file]', margin + 5, yPos + 15)
    }
  } else {
    pdf.setFontSize(9)
    pdf.setFont('helvetica', 'italic')
    pdf.setTextColor(150, 150, 150)
    pdf.text('No signature', margin + 5, yPos + 15)
  }
  
  pdf.setFontSize(8)
  pdf.setFont('helvetica', 'normal')
  pdf.setTextColor(100, 100, 100)
  pdf.text(`Date: ${submission.created_at ? new Date(submission.created_at).toLocaleString() : 'N/A'}`, margin + 5, yPos + 30)
  
  yPos += 40
  
  // QR Codes
  checkPageBreak(40)
  
  if (qrAckBase64 || qrTermsBase64) {
    const qrSize = 30
    const qrSpacing = contentWidth / 2
    const qrStartX = margin + (contentWidth - qrSpacing) / 2
    
    if (qrAckBase64) {
      pdf.addImage(qrAckBase64, 'PNG', qrStartX, yPos, qrSize, qrSize)
      pdf.setFontSize(7)
      pdf.setFont('helvetica', 'normal')
      pdf.setTextColor(0, 0, 0)
      pdf.text('Acknowledgement of Risk', qrStartX + qrSize/2, yPos + qrSize + 4, { align: 'center' })
    }
    
    if (qrTermsBase64) {
      pdf.addImage(qrTermsBase64, 'PNG', qrStartX + qrSpacing, yPos, qrSize, qrSize)
      pdf.setFontSize(7)
      pdf.setFont('helvetica', 'normal')
      pdf.setTextColor(0, 0, 0)
      pdf.text('Terms & Conditions', qrStartX + qrSpacing + qrSize/2, yPos + qrSize + 4, { align: 'center' })
    }
  }
  
  return pdf
}
