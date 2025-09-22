import crypto from "crypto";
import { config } from "process";

export async function createInsurancePolicy(insuranceData) {
  const BASE_URL = "https://application-api-development.yas.com.hk";
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

  const yasConfig = INSURANCE_CONFIG[insuranceData.branch];
  if (!yasConfig) {
    throw new Error(`No insurance config found for branch: ${insuranceData.branch}`);
  }

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
  const path = `/partner/${PARTNER_ID}/policy/create`;
  const method = "POST";
  const timestamp = Date.now().toString();
  const signData = method + path + timestamp + JSON.stringify(body);

  const signature = crypto
    .createHmac("sha256", SECRET_KEY)
    .update(signData)
    .digest("hex");

  const res = await fetch(BASE_URL + path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json;charset=UTF-8",
      "X-Timestamp": timestamp,
      "X-Request-Signature": signature,
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error?.message || "Insurance API failed");
  }

  return data;
}
