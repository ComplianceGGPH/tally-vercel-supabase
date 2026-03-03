// lib/clientPdfGenerator.js
import jsPDF from 'jspdf'

export async function generateClientSidePDF(data) {
  const pdf = new jsPDF('p', 'mm', 'a4')
  const { submission, participant, activities, emergency, guardian } = data
  
  let yPos = 20
  const pageWidth = 210
  const margin = 20
  const contentWidth = pageWidth - (margin * 2)
  
  // Helper functions
  const addText = (text, size = 10, style = 'normal', x = margin) => {
    pdf.setFontSize(size)
    pdf.setFont('helvetica', style)
    pdf.text(text, x, yPos)
  }
  
  const addLine = () => {
    pdf.setDrawColor(200, 200, 200)
    pdf.line(margin, yPos, pageWidth - margin, yPos)
  }
  
  const checkPageBreak = (spaceNeeded = 10) => {
    if (yPos + spaceNeeded > 280) {
      pdf.addPage()
      yPos = 20
    }
  }
  
  // Header
  pdf.setFontSize(20)
  pdf.setFont('helvetica', 'bold')
  pdf.text('INDEMNITY FORM', pageWidth / 2, yPos, { align: 'center' })
  yPos += 7
  
  pdf.setFontSize(10)
  pdf.setFont('helvetica', 'normal')
  pdf.text('Participant Information & Liability Waiver', pageWidth / 2, yPos, { align: 'center' })
  yPos += 5
  
  addLine()
  yPos += 10
  
  // Participant Information
  pdf.setFontSize(14)
  pdf.setFont('helvetica', 'bold')
  pdf.text('Participant Information', margin, yPos)
  yPos += 8
  
  const fields = [
    ['Full Name:', participant.name || 'N/A'],
    ['NRIC:', participant.nric || 'N/A'],
    ['Date of Birth:', participant.dob ? new Date(participant.dob).toLocaleDateString() : 'N/A'],
    ['Gender:', participant.gender || 'N/A'],
    ['Phone Number:', participant.phone || 'N/A'],
    ['Email:', participant.email || 'N/A'],
    ['Address:', participant.address || 'N/A']
  ]
  
  fields.forEach(([label, value]) => {
    checkPageBreak()
    pdf.setFontSize(9)
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(100, 100, 100)
    pdf.text(label, margin, yPos)
    
    pdf.setFont('helvetica', 'normal')
    pdf.setTextColor(0, 0, 0)
    pdf.text(value, margin + 35, yPos)
    yPos += 6
  })
  
  yPos += 5
  
  // Guardian Information
  if (guardian) {
    checkPageBreak(30)
    pdf.setFontSize(14)
    pdf.setFont('helvetica', 'bold')
    pdf.text('Guardian Information', margin, yPos)
    yPos += 8
    
    const guardianFields = [
      ['Guardian Name:', guardian.name || 'N/A'],
      ['Guardian NRIC:', guardian.nric || 'N/A'],
      ['Guardian Phone:', guardian.phone || 'N/A'],
      ['Relationship:', guardian.relationship || 'N/A']
    ]
    
    guardianFields.forEach(([label, value]) => {
      checkPageBreak()
      pdf.setFontSize(9)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(100, 100, 100)
      pdf.text(label, margin, yPos)
      
      pdf.setFont('helvetica', 'normal')
      pdf.setTextColor(0, 0, 0)
      pdf.text(value, margin + 35, yPos)
      yPos += 6
    })
    
    yPos += 5
  }
  
  // Emergency Contact
  if (emergency) {
    checkPageBreak(30)
    pdf.setFontSize(14)
    pdf.setFont('helvetica', 'bold')
    pdf.text('Emergency Contact', margin, yPos)
    yPos += 8
    
    const emergencyFields = [
      ['Contact Name:', emergency.name || 'N/A'],
      ['Contact Phone:', emergency.phone || 'N/A'],
      ['Relationship:', emergency.relationship || 'N/A']
    ]
    
    emergencyFields.forEach(([label, value]) => {
      checkPageBreak()
      pdf.setFontSize(9)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(100, 100, 100)
      pdf.text(label, margin, yPos)
      
      pdf.setFont('helvetica', 'normal')
      pdf.setTextColor(0, 0, 0)
      pdf.text(value, margin + 35, yPos)
      yPos += 6
    })
    
    yPos += 5
  }
  
  // Activities
  checkPageBreak(30)
  pdf.setFontSize(14)
  pdf.setFont('helvetica', 'bold')
  pdf.text('Activities', margin, yPos)
  yPos += 8
  
  if (activities && activities.length > 0) {
    activities.forEach((act) => {
      checkPageBreak()
      pdf.setFontSize(10)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(0, 0, 0)
      pdf.text(act.activity_name || 'N/A', margin, yPos)
      yPos += 5
      
      pdf.setFontSize(9)
      pdf.setFont('helvetica', 'normal')
      pdf.setTextColor(100, 100, 100)
      pdf.text(act.activity_date ? new Date(act.activity_date).toLocaleDateString() : 'N/A', margin, yPos)
      yPos += 8
    })
  } else {
    pdf.setFontSize(10)
    pdf.setFont('helvetica', 'normal')
    pdf.setTextColor(150, 150, 150)
    pdf.text('No activities', margin, yPos)
    yPos += 8
  }
  
  yPos += 5
  
  // Health Declaration
  checkPageBreak(30)
  pdf.setFontSize(14)
  pdf.setFont('helvetica', 'bold')
  pdf.setTextColor(0, 0, 0)
  pdf.text('Health Declaration', margin, yPos)
  yPos += 8
  
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
      checkPageBreak()
      pdf.setFontSize(10)
      pdf.setFont('helvetica', 'normal')
      pdf.setTextColor(0, 0, 0)
      pdf.text(`• ${condition}`, margin + 5, yPos)
      yPos += 6
    })
  } else {
    pdf.setFontSize(10)
    pdf.setFont('helvetica', 'normal')
    pdf.setTextColor(150, 150, 150)
    pdf.text('None declared', margin, yPos)
    yPos += 6
  }
  
  yPos += 10
  
  // Signature Section
  checkPageBreak(40)
  addLine()
  yPos += 8
  
  pdf.setFontSize(14)
  pdf.setFont('helvetica', 'bold')
  pdf.setTextColor(0, 0, 0)
  pdf.text('Acknowledgement & Signature', margin, yPos)
  yPos += 10
  
  if (submission.signature_url) {
    // Note: actual signature image would need to be loaded as base64
    pdf.setFontSize(10)
    pdf.setFont('helvetica', 'italic')
    pdf.text('[Signature on file]', margin, yPos)
  } else {
    pdf.setFontSize(10)
    pdf.setFont('helvetica', 'normal')
    pdf.setTextColor(150, 150, 150)
    pdf.text('No signature', margin, yPos)
  }
  yPos += 8
  
  pdf.setFontSize(9)
  pdf.setFont('helvetica', 'normal')
  pdf.setTextColor(100, 100, 100)
  pdf.text(`Date: ${submission.created_at ? new Date(submission.created_at).toLocaleString() : 'N/A'}`, margin, yPos)
  
  return pdf
}
