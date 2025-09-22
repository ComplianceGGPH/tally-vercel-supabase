// app/api/tally-to-supabase/route.js
import { createClient } from "@supabase/supabase-js";
import { createInsurancePolicy } from "@/lib/insurance";
import { parsePhoneNumber } from "libphonenumber-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function splitPhoneNumber(fullNumber) {
  try {
    const phoneNumber = parsePhoneNumber(fullNumber);
    return {
      countryCode: phoneNumber.countryCallingCode, // "1684"
      number: phoneNumber.nationalNumber           // rest of the digits
    };
  } catch (err) {
    return { countryCode: null, number: fullNumber };
  }
}

function getReadableValue(field) {
  if (!field) return null;

  if (Array.isArray(field.value)) {
    return field.value
      .map((val) => {
        if (typeof val === "string") {
          const match = field.options?.find((opt) => opt.id === val);
          return match ? match.text : val;
        }
        if (typeof val === "object") {
          if (val.url) return val.url;
          if (val.text) return val.text;
          return JSON.stringify(val);
        }
        return val;
      })
      .join(", ");
  }

  if (typeof field.value === "string") {
    const match = field.options?.find((opt) => opt.id === field.value);
    return match ? match.text : field.value;
  }

  if (typeof field.value === "object" && field.value !== null) {
    if (field.value.url) return field.value.url;
    if (field.value.text) return field.value.text;
    if (field.value.id) {
      const match = field.options?.find((opt) => opt.id === field.value.id);
      return match ? match.text : field.value.id;
    }
  }

  return field.value ?? null;
}

function parseAnswers(fieldsArray = []) {
  const result = {};
  for (const field of fieldsArray) {
    const key = field.label || field.id;
    result[key] = getReadableValue(field);
  }
  return result;
}

// App Router style
export async function POST(request) {
  try {
    const payload = await request.json();
    if (!payload?.data?.fields) {
      console.error("Invalid payload: no fields found", payload);
      return Response.json({ error: "Invalid payload, no fields" }, { status: 400 });
    }

    const answers = parseAnswers(payload.data.fields);
    console.log("Mapped answers:", answers);

    // --- 1. Participant ---
    const { data: participant, error: pErr } = await supabase
      .from("participants")
      .insert([
        {
          fullname: answers["fullname"] || null,
          dob: answers["dob"] || null,
          age: answers["age"] || null,
          nric: answers["nric"] || null,
          nationality: answers["nationality"] || null,
          phone_number: answers["phonenumber"] || null,
          email: answers["email"] || null,
          address: answers["address"] || null,
          gender: answers["gender"] || null,
          race: answers["race"] || null,
          health_declaration: answers["healthdeclaration"] || null,
          participant_signature: answers["participantsignature"] || null,
        },
      ])
      .select("id, fullname, dob, nric, nationality, phone_number, email")
      .single();

    if (pErr) throw pErr;

    // --- 2. Guardian ---
    let guardian = null;
    if (
      answers["guardianname"] &&
      answers["guardiannric"] &&
      answers["guardianemail"] &&
      answers["guardianphone"] &&
      answers["guardiansignature"]
    ) {
      const { data, error: gErr } = await supabase
        .from("guardians")
        .insert([
          {
            guardian_name: answers["guardianname"] || null,
            guardian_nric: answers["guardiannric"] || null,
            guardian_email: answers["guardianemail"] || null,
            guardian_phone: answers["guardianphone"] || null,
            guardian_signature: answers["guardiansignature"] || null,
          },
        ])
        .select("id")
        .single();
      if (gErr) throw gErr;
      guardian = data;
    }

    // --- 3. Emergency ---
    let emergency = null;
    if (
      answers["emergencyfullname"] &&
      answers["emergencyphone"] &&
      answers["emergencyrelationship"]
    ) {
      const { data, error: eErr } = await supabase
        .from("emergency_contacts")
        .insert([
          {
            emergency_fullname: answers["emergencyfullname"] || null,
            emergency_phone: answers["emergencyphone"] || null,
            emergency_relationship: answers["emergencyrelationship"] || null,
          },
        ])
        .select("id")
        .single();
      if (eErr) throw eErr;
      emergency = data;
    }

    // --- 4. Submission ---
    const tally_submission_id = payload.data.submissionId;
    const tally_respondent_id = payload.data.respondentId;

    const submissionPayload = {
      tally_submission_id,
      tally_respondent_id,
      branch: answers["BRANCH"] || null,
      group: answers["groupname"] || null,
      booking_status: answers["bookingstatus"] || null,
      activity_amount: answers["activityamount"] || null,
      participant_id: participant.id,
    };

    if (guardian) submissionPayload.guardian_id = guardian.id;
    if (emergency) submissionPayload.emergency_id = emergency.id;

    const { data: submission, error: sErr } = await supabase
      .from("submissions")
      .insert([submissionPayload])
      .select("id")
      .single();

    if (sErr) throw sErr;

    // --- 5. Activities ---
    const activities = [];
    for (let i = 1; i <= 7; i++) {
      const activityName = answers[`activity${i}`] || null;
      const activityDate = answers[`activitydate${i}`] || null;
      const activityTime = answers[`actime${i}`] || null;

      if (activityName || activityDate || activityTime) {
        activities.push({
          participant_id: participant.id,
          submission_id: submission.id,
          activity_name: activityName,
          activity_date: activityDate,
          activity_time: activityTime,
        });
      }
    }

    if (activities.length > 0) {
      const { error: aErr } = await supabase.from("activities").insert(activities);
      if (aErr) throw aErr;
    }

    // --- 6. Insurance Policy ---

    console.log("Creating insurance");

    let InsuranceData;
    let insuranceRes;

    const nationalityRaw = answers["nationality"]; // e.g. "Malaysian (MY)"
    const nationalityCode = nationalityRaw.match(/\((.*?)\)/)?.[1] || "MY";

    const isMinor = answers["age"] >= 6 && answers["age"] <= 16;

    // pick which phone/email to use
    const { countryCode, number } = splitPhoneNumber(
      isMinor ? answers["guardianphone"] : answers["phonenumber"]
    );

    InsuranceData = {
      fullname: answers["fullname"],
      dateOfBirth: answers["dob"],
      age: answers["age"],
      gender: answers["gender"],
      phone: {
        countryCode,
        number,
      },
      email: answers["guardianemail"] || answers["email"],
      address: answers["address"],
      nric: answers["nric"],
      nationality: nationalityCode || "MY",

      branch: answers["BRANCH"],         // needed for promo config
      coverageStart: answers["activitydate1"],
    };

    insuranceRes = await createInsurancePolicy(participant, InsuranceData);

    console.log("Prepared insurance data");
    console.log("Insurance response:", insuranceRes);

    return Response.json({ success: true });
  } catch (err) {
    console.error("Webhook error:", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}