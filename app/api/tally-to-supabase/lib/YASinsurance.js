const crypto = require('crypto');
const axios = require('axios');

/**
* Generates the HMAC-SHA256 signature for an API request.
* @param {string} secret - The shared secret key (API Secret).
* @param {string} path - The request path (e.g., "/partner/{partner_id}/policy/create").
* @param {string} method - The HTTP method (e.g., "post", "get").
* @param {string} timestamp - The Unix timestamp in milliseconds (as a string), corresponding to X-Timestamp header.
* @param {object | null} body - The request body object. Pass null if the request has no body.
* @returns {string} The HMAC-SHA256 signature as a hexadecimal string.
*/

function generateRequestSignature(secret, path, method, timestamp, body) {
  const hmac = crypto.createHmac('SHA256', secret);

  let signData = `${method.toUpperCase()}${path}${timestamp}`;
  if (body !== null && typeof body !== 'undefined') {
    signData += JSON.stringify(body);
  }

  hmac.update(signData);
  return hmac.digest('hex');
}

async function main(insuranceData) {
  console.log('--- YAS API Test Script ---');

  const BASE_URL = process.env.YAS_BASE_URL;
  const MY_SECRET = process.env.YAS_SECRET_KEY;
  const PARTNER_ID = process.env.YAS_PARTNER_ID;

  // Endpoint path
  const createPolicyPath = `/partner/${PARTNER_ID}/policy/create`;
  const fullUrl = `${BASE_URL}${createPolicyPath}`;

  // request body
  const INSURANCE_CONFIG = {
    "GOPENG GLAMPING PARK": {
      promoCode: "GP01",
      eventName: "GopengGP",
      partner: "GGP",
    },
    "PUTRAJAYA LAKE RECREATION CENTER": {
      promoCode: "LRC01",
      eventName: "PutrajayaLRC",
      partner: "PLRC",
    },
    BOTANI: {
      promoCode: "LRC01",
      eventName: "PutrajayaLRC",
      partner: "PLRC",
    },
    "GLAMPING @ WETLAND PUTRAJAYA": {
      promoCode: "GWP01",
      eventName: "GlowGWP",
      partner: "GGWP",
    },
    "PUTRAJAYA WETLAND ADVENTURE PARK": {
      promoCode: "WAP01",
      eventName: "PutrajayaWAP",
      partner: "PWAP",
    },
  };

  const createPolicyBody = {
    mobileCountryCode: insuranceData.phone.countryCode,
    mobileNo: insuranceData.phone.number,
    promoCode: yasConfig.promoCode,
    effectiveStartDates: insuranceData.coverageStart,
    productPlanType: "ACTIVITIES_1",
    email: insuranceData.email,
    itemId: "",
    dealer: "",
    partner: yasConfig.partner,
    eventName: yasConfig.eventName,
    themeCode: "",
    applicant: {
      documentType: "ICPP",
      documentNo: insuranceData.nric,
      fullName: insuranceData.fullname,
      nationality: insuranceData.nationality,
      address: insuranceData.address,
      dob: insuranceData.dateOfBirth,
    },
    declaration: {
      allowPrivacyPromote3P: true,
      allowPrivacyPromote: true,
    }
  };

  // Generate current timestamp (must be current for the API to accept)
  const requestTimestamp = Date.now().toString();
  const generatedRequestSignature = generateRequestSignature(
    MY_SECRET,
    createPolicyPath,
    'post',
    requestTimestamp,
    JSON.stringify(createPolicyBody)
  );

  // Log request details for debugging
  console.log('\n--- Request Details ---');
  console.log('Method:', 'POST');
  console.log('URL:', fullUrl);
  console.log('X-Timestamp header value:', requestTimestamp);
  console.log('Request Body:', JSON.stringify(createPolicyBody, null, 2));
  console.log('Generated X-Request-Signature:', generatedRequestSignature);

  const headers = {
    'X-Request-Signature': generatedRequestSignature,
    'X-Timestamp': requestTimestamp,
    'Content-Type': 'application/json;charset=UTF-8'
  };

  try {
    const response = await axios.post(fullUrl, createPolicyBody, { headers });
    console.log('\n--- API Response ---');
    console.log('Status:', response.status);
    console.log('Response Body:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.log('\n--- API Error ---');
    if (error.response) {
      // Server responded with error
      console.log('Status:', error.response.status);
      console.log('Error Body:', JSON.stringify(error.response.data, null, 2));
    } else {
      // Other errors (e.g., network)
      console.log('Error Message:', error.message);
    }
  }
}

main().catch(console.error);