import crypto from "crypto";
import { config } from "process";

function generateRequestSignature(secret, path, method, timestamp, body) {
  const hmac = crypto.createHmac('SHA256', secret);

  let signData = `${method.toUpperCase()}${path}${timestamp}`;
  if (body !== null && typeof body !== 'undefined') {
    signData += JSON.stringify(body);
  }

  hmac.update(signData);
  return hmac.digest('hex');
}

export async function createInsurancePolicy(insuranceData) {
  const BASE_URL = process.env.YAS_BASE_URL;
  const PARTNER_ID = process.env.YAS_PARTNER_ID;
  const SECRET_KEY = process.env.YAS_SECRET_KEY;

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
    "BOTANI": {
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

  console.log("Insurance Data:", insuranceData);

  console.log("Branch", insuranceData.branch);

  const yasConfig = INSURANCE_CONFIG[insuranceData.branch];
  if (!yasConfig) {
    throw new Error(`No insurance config found for branch: ${insuranceData.branch}`);
  }

  console.log("Using YAS config:", yasConfig);

  const body = {
    mobileCountryCode: insuranceData.phone.countryCode,
    mobileNo: insuranceData.phone.number,
    promoCode: yasConfig.promoCode,
    effectiveStartDates: [insuranceData.coverageStart],
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
      ...(insuranceData.nationality !== "MY"
        ? { dob: insuranceData.dateOfBirth }
        : {}),
    },
    declaration: {
      allowPrivacyPromote3P: true,
      allowPrivacyPromote: true,
    },
  };

  // signing request...
  console.log(JSON.stringify(body));

  const path = `/partner/${PARTNER_ID}/policy/create`;
  const method = 'post';
  const timestamp = Date.now().toString();

  const generatedRequestSignature = generateRequestSignature(SECRET_KEY, path, method, timestamp, JSON.stringify(body));

  console.log('\n--- Request Details ---');
  console.log('Method:', method);
  console.log('Path:', path);
  console.log('X-Timestamp header value:', timestamp);
  console.log('Request Body:', JSON.stringify(body));
  console.log('Generated X-Request-Signature:', generatedRequestSignature);

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error?.message || "Insurance API failed");
  }

  return data;
}
