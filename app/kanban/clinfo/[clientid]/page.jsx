"use client";
import { use, useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

export default function ClientBoard({ params }) {
  const { clientid: rawId } = use(params);
  const clientid = decodeURIComponent(rawId);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  const router = useRouter();

  const handleBack = () => {
    if (window.history.length > 2) {
      router.back();
    } else {
      router.push("/kanban"); // fallback if history is too short
    }
  };

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

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="text-muted-foreground">Loading participant details...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        {/* Header */}
        <Button
          variant="outline"
          onClick={handleBack}
        >
          ← Back to Previous Page
        </Button>

      {activities.length === 0 ? (
        <Card className="shadow-md">
          <CardContent className="py-12">
            <p className="text-center text-muted-foreground">No activities found.</p>
          </CardContent>
        </Card>
      ) : (
        activities.map((submission) => (
          <div key={submission.id} className="space-y-6">
            <Card className="shadow-md">
              <CardHeader className="bg-primary/5">
                <CardTitle className="text-center text-2xl">Indemnity Form for {submission.participant.fullname}</CardTitle>
              </CardHeader>
            </Card>

            <div className="grid gap-6 md:grid-cols-2">
              <Card className="shadow-md">
              <CardHeader>
                <CardTitle>Participant Details</CardTitle>
              </CardHeader>
              <CardContent>
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
                  <p className="text-center">No participant details available.</p>
                )}
              </CardContent>
            </Card>
            </div>
            
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="shadow-md">
                <CardHeader>
                  <CardTitle>Submission Details</CardTitle>
                </CardHeader>
                <CardContent>
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
                </CardContent>
              </Card>

              <Card className="shadow-md">
                <CardHeader>
                  <CardTitle>Guardian Details</CardTitle>
                </CardHeader>
                <CardContent>
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
                    <p className="text-center">No guardian details available.</p>
                  )}
                </CardContent>
              </Card>

              <Card className="mb-4">
                <CardHeader>
                  <CardTitle>Emergency Contact</CardTitle>
                </CardHeader>
                <CardContent>
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
                    <p className="text-center">No emergency contact details available.</p>
                  )}
                </CardContent>
              </Card>

              <Card className="mb-4">
                <CardHeader>
                  <CardTitle>Activities</CardTitle>
                </CardHeader>
                <CardContent>
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
                    <p className="text-center">No activities available.</p>
                  )}
                </CardContent>
              </Card>
            </div>
            
            <div className="flex justify-center print:hidden">
              <Button onClick={printPDF} size="lg" className="gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
                Print/Download PDF
              </Button>
            </div>
          </div>
        ))
      )}
      </div>
    </div>
  );
}