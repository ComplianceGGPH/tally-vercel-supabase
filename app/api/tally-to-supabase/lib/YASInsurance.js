import { asyncWrapProviders } from "async_hooks";
import crypto from "crypto";

function generateRequestSignature(secret, path, method, timestamp, bodyString) {
  const hmac = crypto.createHmac("SHA256", secret);

  let signData = `${method.toUpperCase()}${path}${timestamp}`;
  if (bodyString) {
    signData += bodyString;
  }

  console.log("Sign String Used for HMAC:", signData);

  hmac.update(signData);
  const signature = hmac.digest("hex");

  console.log("Generated Signature:", signature);

  return signature;
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

  console.log("Insurance Data:", insuranceData);

  const yasConfig = INSURANCE_CONFIG[insuranceData.branch];
  if (!yasConfig) {
    throw new Error(`No insurance config found for branch: ${insuranceData.branch}`);
  }

  console.log("Using YAS config:", yasConfig);

  const body = {
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

  const bodyString = JSON.stringify(body);  // << single canonical version

  const path = `/partner/${PARTNER_ID}/policy/create`;
  const method = 'post';
  const timestamp = Date.now().toString();
  const signature = generateRequestSignature(
    SECRET_KEY,
    path,
    method,
    timestamp,
    bodyString
  );

  console.log("\n--- Request Details ---");
  console.log("Method:", method);
  console.log("Path:", path);
  console.log("X-Timestamp header value:", timestamp);
  console.log("Request Body:", bodyString);
  console.log("Generated X-Request-Signature:", signature);

  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      "X-Partner-Id": PARTNER_ID,
      "X-Timestamp": timestamp,
      "X-Request-Signature": signature,
    },
    body: bodyString,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`YAS API error ${response.status}: ${text}`);
  }

  return response.json();
}
