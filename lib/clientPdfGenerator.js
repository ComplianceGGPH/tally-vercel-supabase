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
  
  const pageWidth = 210
  const pageHeight = 297
  const margin = 15
  const contentWidth = pageWidth - (margin * 2)
  const colWidth = contentWidth / 2
  
  let yPos = margin
  
  // Load all images upfront
  console.log('Loading images...')
  const logoBase64 = await loadImageAsBase64('/logo/ggph.png')
  const qrAckBase64 = await loadImageAsBase64('/qr/acknowledgement-of-risk.png')
  const qrTermsBase64 = await loadImageAsBase64('/qr/terms-and-condition.png')
  
  // Load signatures
  let participantSigBase64 = null
  if (participant.participant_signature) {
    participantSigBase64 = await loadImageAsBase64(participant.participant_signature)
  }
  
  let guardianSigBase64 = null
  if (guardian?.guardian_signature) {
    guardianSigBase64 = await loadImageAsBase64(guardian.guardian_signature)
  }
  
  // Helper functions
  const checkPageBreak = (spaceNeeded = 10) => {
    if (yPos + spaceNeeded > pageHeight - margin) {
      pdf.addPage()
      yPos = margin
      return true
    }
    return false
  }
  
  const drawBox = (x, y, width, height, fillColor = null) => {
    if (fillColor) {
      pdf.setFillColor(...fillColor)
      pdf.rect(x, y, width, height, 'F')
    }
    pdf.setDrawColor(200, 200, 200)
    pdf.setLineWidth(0.1)
    pdf.rect(x, y, width, height)
  }
  
  const addSectionTitle = (title) => {
    checkPageBreak(12)
    pdf.setFillColor(240, 240, 240)
    pdf.rect(margin, yPos, contentWidth, 8, 'F')
    pdf.setFontSize(12)
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(0, 0, 0)
    pdf.text(title, margin + 3, yPos + 5.5)
    pdf.setDrawColor(51, 51, 51)
    pdf.setLineWidth(0.5)
    pdf.line(margin, yPos, margin + 3, yPos)
    pdf.line(margin, yPos, margin, yPos + 8)
    pdf.line(margin, yPos + 8, margin + 3, yPos + 8)
    yPos += 12
  }
  
  const addInfoBox = (label, value, x, width) => {
    drawBox(x, yPos, width, 12, [250, 250, 250])
    pdf.setFontSize(7)
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(100, 100, 100)
    pdf.text(label, x + 2, yPos + 4)
    
    pdf.setFontSize(10)
    pdf.setFont('helvetica', 'normal')
    pdf.setTextColor(0, 0, 0)
    const textValue = value || 'N/A'
    const lines = pdf.splitTextToSize(textValue, width - 4)
    pdf.text(lines, x + 2, yPos + 9)
  }
  
  const addInfoRow = (label1, value1, label2, value2) => {
    checkPageBreak(14)
    addInfoBox(label1, value1, margin, colWidth - 2)
    addInfoBox(label2, value2, margin + colWidth + 2, colWidth - 2)
    yPos += 14
  }
  
  const addFullWidthInfoBox = (label, value) => {
    checkPageBreak(14)
    addInfoBox(label, value, margin, contentWidth)
    yPos += 14
  }
  
  // ===== HEADER =====
  if (logoBase64) {
    pdf.addImage(logoBase64, 'PNG', pageWidth / 2 - 25, yPos, 50, 25)
    yPos += 28
  } else {
    yPos += 10
  }
  
  pdf.setFontSize(18)
  pdf.setFont('helvetica', 'bold')
  pdf.setTextColor(0, 0, 0)
  pdf.text("PARTICIPANT'S REGISTRATION AND ACKNOWLEDGEMENT OF RISK", pageWidth / 2, yPos, { align: 'center', maxWidth: contentWidth })
  yPos += 5
  
  pdf.setFontSize(9)
  pdf.setFont('helvetica', 'italic')
  pdf.setTextColor(100, 100, 100)
  pdf.text('**Please take note that this is a customer copy only.**', pageWidth / 2, yPos, { align: 'center' })
  yPos += 3
  
  pdf.setDrawColor(51, 51, 51)
  pdf.setLineWidth(0.8)
  pdf.line(margin, yPos, pageWidth - margin, yPos)
  yPos += 10
  
  // ===== PERSONAL INFORMATION =====
  addSectionTitle('PERSONAL INFORMATION')
  
  addInfoRow('Participant Full Name:', participant.fullname, 'NRIC:', participant.nric)
  addInfoRow('Gender:', participant.gender, 'Tel No:', participant.phone_number)
  addFullWidthInfoBox('Address:', participant.full_address)
  addInfoRow('Nationality:', participant.nationality, 'Age:', participant.age?.toString())
  addInfoRow('Date of Birth:', participant.dob, 'Race:', participant.race)
  addFullWidthInfoBox('Email:', participant.email)
  addInfoRow('Branch:', submission.branch, 'Group:', submission.group)
  
  yPos += 5
  
  // ===== ACTIVITY INFORMATION =====
  if (activities && activities.length > 0) {
    checkPageBreak(50)
    addSectionTitle('ACTIVITY INFORMATION')
    
    activities.forEach((activity, index) => {
      checkPageBreak(16)
      addInfoRow('Activity Name:', activity.activity_name, 'Activity Date:', activity.activity_date)
      addFullWidthInfoBox('Activity Time:', activity.activity_time)
      if (index < activities.length - 1) yPos += 2
    })
    
    yPos += 5
  }
  
  // ===== MEDICAL INFORMATION =====
  checkPageBreak(80)
  addSectionTitle('MEDICAL INFORMATION')
  
  pdf.setFontSize(9)
  pdf.setFont('helvetica', 'italic')
  pdf.setTextColor(80, 80, 80)
  const disclaimerText = pdf.splitTextToSize(
    'Please declare any health conditions that may affect your ability to participate safely. This information is confidential and will be used only for safety purposes.',
    contentWidth
  )
  pdf.text(disclaimerText, margin, yPos)
  yPos += disclaimerText.length * 4 + 5
  
  // Parse health declaration
  let healthArray = []
  const healthDeclaration = participant.health_declaration || ''
  
  if (typeof healthDeclaration === 'string' && healthDeclaration.trim()) {
    if (healthDeclaration.trim().startsWith('[') || healthDeclaration.trim().startsWith('{')) {
      try {
        const parsed = JSON.parse(healthDeclaration)
        healthArray = Array.isArray(parsed) ? parsed : Object.values(parsed).filter(Boolean)
      } catch (e) {
        healthArray = [healthDeclaration]
      }
    } else {
      healthArray = healthDeclaration.split(',').map(s => s.trim()).filter(Boolean)
    }
  } else if (Array.isArray(healthDeclaration)) {
    healthArray = healthDeclaration
  }
  
  const standardConditions = [
    'Asthma', 'Asma',
    'Brain', 'Otak',
    'Chest Surgery', 'Pembedahan Dada',
    'Chronic Bronchitis', 'Bronkitis',
    'Epilepsy', 'Epilepsi',
    'Heart', 'Jantung',
    'Injury', 'Surgery', 'Kecederaan',
    'Pregnant', 'Mengandung'
  ]
  
  const hasAsthma = healthArray.some(item => item && (item.includes('Asthma') || item.includes('Asma')))
  const hasBrainInjury = healthArray.some(item => item && (item.includes('Brain') || item.includes('Otak')))
  const hasChestSurgery = healthArray.some(item => item && (item.includes('Chest Surgery') || item.includes('Pembedahan Dada')))
  const hasBronchitis = healthArray.some(item => item && (item.includes('Chronic Bronchitis') || item.includes('Bronkitis')))
  const hasEpilepsy = healthArray.some(item => item && (item.includes('Epilepsy') || item.includes('Epilepsi')))
  const hasHeartDisease = healthArray.some(item => item && (item.includes('Heart') || item.includes('Jantung')))
  const hasInjury = healthArray.some(item => item && (item.includes('Injury') || item.includes('Surgery') || item.includes('Kecederaan')))
  const isPregnant = healthArray.some(item => item && (item.includes('Pregnant') || item.includes('Mengandung')))
  
  const otherConditions = healthArray.filter(item => {
    if (!item) return false
    return !standardConditions.some(std => item.includes(std))
  })
  
  const hasOther = otherConditions.length > 0
  const hasNoIssues = healthArray.length === 0
  
  // Medical table
  checkPageBreak(70)
  const conditionWidth = contentWidth * 0.7
  const checkboxWidth = contentWidth * 0.15
  
  // Table header
  pdf.setFillColor(224, 224, 224)
  pdf.rect(margin, yPos, contentWidth, 8, 'F')
  pdf.setDrawColor(204, 204, 204)
  pdf.setLineWidth(0.3)
  pdf.rect(margin, yPos, conditionWidth, 8)
  pdf.rect(margin + conditionWidth, yPos, checkboxWidth, 8)
  pdf.rect(margin + conditionWidth + checkboxWidth, yPos, checkboxWidth, 8)
  
  pdf.setFontSize(8)
  pdf.setFont('helvetica', 'bold')
  pdf.setTextColor(0, 0, 0)
  pdf.text('CONDITION', margin + 3, yPos + 5.5)
  pdf.text('YES', margin + conditionWidth + checkboxWidth / 2, yPos + 5.5, { align: 'center' })
  pdf.text('NO', margin + conditionWidth + checkboxWidth + checkboxWidth / 2, yPos + 5.5, { align: 'center' })
  yPos += 8
  
  // Table rows
  const conditions = [
    { label: 'Asthma / Asma', value: hasAsthma },
    { label: 'Brain Injury / Kecederaan Otak', value: hasBrainInjury },
    { label: 'Chest Surgery / Pembedahan Dada', value: hasChestSurgery },
    { label: 'Chronic Bronchitis / Bronkitis Kronik', value: hasBronchitis },
    { label: 'Epilepsy / Sawan', value: hasEpilepsy },
    { label: 'Heart Disease / Penyakit Jantung', value: hasHeartDisease },
    { label: 'Past Injury/Surgery / Kecederaan/Pembedahan Lalu', value: hasInjury },
    { label: 'Pregnant / Mengandung', value: isPregnant },
    { label: 'None of the above / Tiada', value: hasNoIssues }
  ]
  
  conditions.forEach((condition) => {
    checkPageBreak(7)
    pdf.setDrawColor(204, 204, 204)
    pdf.rect(margin, yPos, conditionWidth, 7)
    pdf.rect(margin + conditionWidth, yPos, checkboxWidth, 7)
    pdf.rect(margin + conditionWidth + checkboxWidth, yPos, checkboxWidth, 7)
    
    pdf.setFontSize(9)
    pdf.setFont('helvetica', 'normal')
    pdf.setTextColor(0, 0, 0)
    pdf.text(condition.label, margin + 2, yPos + 5)
    
    // Checkmarks
    pdf.setFontSize(12)
    pdf.setFont('helvetica', 'bold')
    if (condition.value) {
      pdf.text('✓', margin + conditionWidth + checkboxWidth / 2, yPos + 5, { align: 'center' })
    } else {
      pdf.text('✓', margin + conditionWidth + checkboxWidth + checkboxWidth / 2, yPos + 5, { align: 'center' })
    }
    
    yPos += 7
  })
  
  // Other conditions
  if (hasOther) {
    checkPageBreak(15)
    yPos += 5
    pdf.setFontSize(9)
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(0, 0, 0)
    pdf.text('Other Conditions:', margin, yPos)
    yPos += 5
    
    pdf.setFont('helvetica', 'normal')
    otherConditions.forEach(condition => {
      checkPageBreak(6)
      const lines = pdf.splitTextToSize(`• ${condition}`, contentWidth - 5)
      pdf.text(lines, margin + 3, yPos)
      yPos += lines.length * 5
    })
  }
  
  yPos += 10
  
  // ===== EMERGENCY CONTACT =====
  if (emergency) {
    checkPageBreak(40)
    addSectionTitle('EMERGENCY CONTACT INFORMATION')
    addInfoRow('Emergency Contact Name:', emergency.emergency_fullname, 'Emergency Contact Phone:', emergency.emergency_phone)
    addFullWidthInfoBox('Relationship:', emergency.emergency_relationship)
    yPos += 5
  }
  
  // ===== SIGNATURE SECTION =====
  checkPageBreak(60)
  addSectionTitle('SIGNATURE')
  
  pdf.setDrawColor(200, 200, 200)
  pdf.setLineWidth(0.3)
  pdf.rect(margin, yPos, contentWidth, 40)
  
  pdf.setFontSize(9)
  pdf.setFont('helvetica', 'bold')
  pdf.setTextColor(0, 0, 0)
  pdf.text('Participant Signature:', margin + 3, yPos + 5)
  
  if (participantSigBase64) {
    pdf.addImage(participantSigBase64, 'PNG', margin + 5, yPos + 8, 60, 20)
  } else {
    pdf.setFontSize(8)
    pdf.setFont('helvetica', 'italic')
    pdf.setTextColor(150, 150, 150)
    pdf.text('[No signature]', margin + 5, yPos + 20)
  }
  
  pdf.setFontSize(8)
  pdf.setFont('helvetica', 'normal')
  pdf.setTextColor(100, 100, 100)
  pdf.text(`Date: ${submission.created_at ? new Date(submission.created_at).toLocaleDateString() : 'N/A'}`, margin + 5, yPos + 35)
  
  yPos += 45
  
  // ===== GUARDIAN SECTION (if under 18) =====
  if (guardian) {
    checkPageBreak(80)
    addSectionTitle('GUARDIAN INFORMATION (For Participants Under 18)')
    
    pdf.setFontSize(9)
    pdf.setFont('helvetica', 'italic')
    pdf.setTextColor(80, 80, 80)
    const guardianText = pdf.splitTextToSize(
      'I am the parent or legal guardian of the participant. I hereby sign below in agreement for the release of liability and assumption of risk for my child / ward named above.',
      contentWidth
    )
    pdf.text(guardianText, margin, yPos)
    yPos += guardianText.length * 4 + 5
    
    addFullWidthInfoBox("Name of minor participant's Parent / Guardian:", guardian.guardian_name)
    addFullWidthInfoBox("NRIC of minor participant's Parent / Guardian:", guardian.guardian_nric)
    
    // Guardian signature box
    checkPageBreak(45)
    pdf.setDrawColor(200, 200, 200)
    pdf.rect(margin, yPos, contentWidth, 40)
    
    pdf.setFontSize(9)
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(0, 0, 0)
    pdf.text("Signature of minor participant's Parent / Guardian:", margin + 3, yPos + 5)
    
    if (guardianSigBase64) {
      pdf.addImage(guardianSigBase64, 'PNG', margin + 5, yPos + 8, 60, 20)
    } else {
      pdf.setFontSize(8)
      pdf.setFont('helvetica', 'italic')
      pdf.setTextColor(150, 150, 150)
      pdf.text('[No signature]', margin + 5, yPos + 20)
    }
    
    yPos += 45
  }
  
  // ===== QR CODES =====
  checkPageBreak(45)
  yPos += 5
  
  pdf.setFontSize(10)
  pdf.setFont('helvetica', 'bold')
  pdf.setTextColor(0, 0, 0)
  pdf.text('Additional Information:', margin, yPos)
  yPos += 7
  
  const qrSize = 35
  const qrSpacing = 15
  const totalQrWidth = (qrSize * 2) + qrSpacing
  const qrStartX = margin + (contentWidth - totalQrWidth) / 2
  
  if (qrAckBase64) {
    pdf.addImage(qrAckBase64, 'PNG', qrStartX, yPos, qrSize, qrSize)
    pdf.setFontSize(8)
    pdf.setFont('helvetica', 'normal')
    pdf.setTextColor(0, 0, 0)
    pdf.text('Acknowledgement', qrStartX + qrSize / 2, yPos + qrSize + 5, { align: 'center' })
    pdf.text('of Risk', qrStartX + qrSize / 2, yPos + qrSize + 9, { align: 'center' })
  }
  
  if (qrTermsBase64) {
    pdf.addImage(qrTermsBase64, 'PNG', qrStartX + qrSize + qrSpacing, yPos, qrSize, qrSize)
    pdf.setFontSize(8)
    pdf.setFont('helvetica', 'normal')
    pdf.setTextColor(0, 0, 0)
    pdf.text('Terms and', qrStartX + qrSize + qrSpacing + qrSize / 2, yPos + qrSize + 5, { align: 'center' })
    pdf.text('Conditions', qrStartX + qrSize + qrSpacing + qrSize / 2, yPos + qrSize + 9, { align: 'center' })
  }
  
  // Footer
  yPos = pageHeight - 10
  pdf.setFontSize(7)
  pdf.setFont('helvetica', 'italic')
  pdf.setTextColor(150, 150, 150)
  pdf.text('Generated by GGPH Booking System', pageWidth / 2, yPos, { align: 'center' })
  pdf.text(`Generated on: ${new Date().toLocaleString()}`, pageWidth / 2, yPos + 3, { align: 'center' })
  
  console.log('PDF generation complete')
  return pdf
}
