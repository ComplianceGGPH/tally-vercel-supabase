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

  // print as PDF
  const printPDF = () => {
    window.print();
  };

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
      {activities.length === 0 ? (
        <p>No activities found.</p>
      ) : (
        activities.map((submission) => (
          <div key={submission.id} className="big-box">
            <div className="box text-center text-2xl font-bold">
              <h1>Indemnity Form for {submission.participant.fullname} </h1>
            </div>
            <div className="box">
              <h3 className="text-2xl font-bold">Participant Details</h3>
              {submission.participant ? (
                <div>
                  <div className="info-row">
                    <span className="info-label">ID</span>
                    <span className="info-value">: {submission.participant.id || "N/A"}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Name</span>
                    <span className="info-value">: {submission.participant.fullname || "N/A"}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Email</span>
                    <span className="info-value">: {submission.participant.email || "N/A"}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Phone</span>
                    <span className="info-value">: {submission.participant.phone_number || "N/A"}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">NRIC</span>
                    <span className="info-value">: {submission.participant.nric || "N/A"}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Date of Birth</span>
                    <span className="info-value">: {submission.participant.dob || "N/A"}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Address</span>
                    <span className="info-value">: {submission.participant.address || "N/A"}</span>
                  </div>
                </div>
              ) : (
                <p>No participant details available.</p>
              )}
            </div>
            
            <div className="submission-container">
              <div className="box">
                <h3 className="text-2xl font-bold">Submission Details</h3>
                <div>
                  <div className="info-row">
                    <span className="info-label">Group</span>
                    <span className="info-value">: {submission.group || "N/A"}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Branch</span>
                    <span className="info-value">: {submission.branch || "N/A"}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Booking Status</span>
                    <span className="info-value">: {submission.booking_status || "N/A"}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Activity Amount</span>
                    <span className="info-value">: {submission.activity_amount || "N/A"}</span>
                  </div>
                </div>
              </div>

              <div className="box">
                <h3 className="text-2xl font-bold">Guardian Details</h3>
                {submission.guardian ? (
                  <div>
                    <div className="info-row">
                      <span className="info-label">Name</span>
                      <span className="info-value">: {submission.guardian.guardian_name || "N/A"}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Phone</span>
                      <span className="info-value">: {submission.guardian.guardian_phone || "N/A"}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Email</span>
                      <span className="info-value">: {submission.guardian.guardian_email || "N/A"}</span>
                    </div>
                  </div>
                ) : (
                  <p>No guardian details available.</p>
                )}
              </div>

              <div className="box">
                <h3 className="text-2xl font-bold">Emergency Contact</h3>
                {submission.emergency_contact ? (
                  <div>
                    <div className="info-row">
                      <span className="info-label">Name</span>
                      <span className="info-value">: {submission.emergency_contact.emergency_fullname || "N/A"}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Phone</span>
                      <span className="info-value">: {submission.emergency_contact.emergency_phone || "N/A"}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Relationship</span>
                      <span className="info-value">: {submission.emergency_contact.emergency_relationship || "N/A"}</span>
                    </div>
                  </div>
                ) : (
                  <p>No emergency contact details available.</p>
                )}
              </div>

              <div className="box">
                <h3 className="text-2xl font-bold">Activities</h3>
                {submission.activities && submission.activities.length > 0 ? (
                  <div>
                    {submission.activities.map((activity) => (
                      <div key={activity.id} className="info-row">
                        <span className="info-label">Activity</span>
                        <span className="info-value">
                          : {activity.activity_name || "N/A"} - {activity.activity_date || "N/A"} - {activity.activity_time || "N/A"}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p>No activities available.</p>
                )}
              </div>
            </div>
            <button onClick={printPDF} className="box print:hidden">
              Print/Download PDF test
            </button>
          </div>
        ))
      )}
    </div>
  );
}