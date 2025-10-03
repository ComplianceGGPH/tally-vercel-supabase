"use client";
import { use, useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

export default function ClientBoard({ params }) {
  const { clientid: rawId } = use(params);
  const clientid = decodeURIComponent(rawId);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const { data, error } = await supabase
        .from("submissions")
        .select(`
          id,
          branch,
          group,
          booking_status,
          activity_amount,
          participant:participant_id(*),
          guardian:guardian_id(*),
          emergency_contact:emergency_id(*),
          activities(*)
        `)
        .eq("participant_id", clientid);

        console.log(clientid)

        if (error) {
          console.error("Error fetching data:", error);
        } else {
          setActivities(data || []);
        }
      } catch (err) {
        console.error("Unexpected error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [clientid]); // Added dependency

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1>Client Board for {clientid}</h1>
      {activities.length === 0 ? (
        <p>No activities found.</p>
      ) : (
        activities.map((submission) => (
          <div key={submission.id} className="box">
            <h2>Group: {submission.group || "N/A"}</h2>
            <p>Branch: {submission.branch || "N/A"}</p>
            <p>Booking Status: {submission.booking_status || "N/A"}</p>
            <p>Activity Amount: {submission.activity_amount || "N/A"}</p>

            <br /><h3>Participant Details</h3>
            {submission.participant ? (
              <div>
                <p>Name: {submission.participant.fullname || "N/A"}</p>
                <p>Email: {submission.participant.email || "N/A"}</p>
                <p>Phone: {submission.participant.phone_number || "N/A"}</p>
                <p>NRIC: {submission.participant.nric || "N/A"}</p>
                <p>Date of Birth: {submission.participant.dob || "N/A"}</p>
                <p>Address: {submission.participant.address || "N/A"}</p>
              </div>
            ) : (
              <p>No participant details available.</p>
            )}

            <br /><h3>Guardian Details</h3>
            {submission.guardian ? (
              <div>
                <p>Name: {submission.guardian.guardian_fullname || "N/A"}</p>
                <p>Phone: {submission.guardian.guardian_phone || "N/A"}</p>
                <p>Relationship: {submission.guardian.guardian_relationship || "N/A"}</p>
              </div>
            ) : (
              <p>No guardian details available.</p>
            )}

            <br /><h3>Emergency Contact</h3>
            {submission.emergency_contact ? (
              <div>
                <p>Name: {submission.emergency_contact.emergency_fullname || "N/A"}</p>
                <p>Phone: {submission.emergency_contact.emergency_phone || "N/A"}</p>
                <p>Relationship: {submission.emergency_contact.emergency_relationship || "N/A"}</p>
              </div>
            ) : (
              <p>No emergency contact details available.</p>
            )}

            <br /><h3>Activities</h3>
            {submission.activities && submission.activities.length > 0 ? (
              <ul>
                {submission.activities.map((activity) => (
                  <li key={activity.id}>
                    {activity.activity_name || "N/A"} - {activity.activity_date || "N/A"} - {activity.activity_time || "N/A"}
                  </li>
                ))}
              </ul>
            ) : (
              <p>No activities available.</p>
            )}
          </div>
        ))
      )}
    </div>
  );
}