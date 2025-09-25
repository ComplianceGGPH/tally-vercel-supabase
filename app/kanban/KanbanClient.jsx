"use client";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function KanbanClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // initialize state from URL if available
  const [branchDropdown, setBranchDropdown] = useState(
    searchParams.get("branch") || "GOPENG GLAMPING PARK"
  );
  const [actDate, setActDate] = useState(searchParams.get("date") || "");
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    async function fetchData() {
      if (!branchDropdown || !actDate) return;
      const { data, error } = await supabase
        .from("activities")
        .select(`
          activity_name,
          activity_time,
          activity_date,
          submission:submission_id(
            id,
            branch,
            group,
            participant:participant_id(
              id,
              fullname,
              health_declaration,
              phone_number
            )
          )
        `)
        .eq("submission.branch", branchDropdown)
        .eq("activity_date", actDate);

      if (error) console.error(error);
      else setActivities(data || []);
    }
    fetchData();
  }, [branchDropdown, actDate]);

  // update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (branchDropdown) params.set("branch", branchDropdown);
    if (actDate) params.set("date", actDate);

    router.push(`/kanban?${params.toString()}`, { scroll: false });
  }, [branchDropdown, actDate, router]);

  const grouped = activities.reduce((acc, item) => {
    const key = item.activity_time || "No Time";
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  return (
    <div className="container">
      <h2>Activity Board Page</h2>
      <div className="branchDateInput">
        <div>
          <label htmlFor="branchDropdown">Choose Branch : </label>
          <select
            id="branchDropdown"
            className="branchDropdown"
            value={branchDropdown}
            onChange={(e) => setBranchDropdown(e.target.value)}
          >
            <option value="GOPENG GLAMPING PARK">GGP</option>
            <option value="GLAMPING @ WETLAND PUTRAJAYA">GLOW</option>
            <option value="PUTRAJAYA LAKE RECREATION CENTER">PLRC</option>
            <option value="PUTRAJAYA WETLAND ADVENTURE PARK">PWAP</option>
            <option value="BOTANI">BOTANI</option>
            <option value="GCT EVENTS">GCT EVENTS</option>
          </select>
        </div>
        <div>
          <label htmlFor="actDate">Date : </label>
          <input
            type="date"
            id="actDate"
            name="actDate"
            value={actDate}
            onChange={(e) => setActDate(e.target.value)}
          />
        </div>
      </div>

      <div className="activityBoard">
        {activities.length === 0 ? (
          <p>No activities found for the selected branch and date.</p>
        ) : (
          Object.entries(grouped)
            .sort(([timeA], [timeB]) => {
              if (timeA === "No Time") return 1;
              if (timeB === "No Time") return -1;
              return timeA.localeCompare(timeB);
            })
            .map(([activityTime, items]) => (
              <div className="kanbanCol" key={activityTime}>
                <h2>Session : {activityTime}</h2>
                <div className="actBoxContainer">
                  {[...new Set(items.map((i) => i.activity_name))].map(
                    (actName) => (
                      <div className="actBox" key={actName}>
                        <Link
                          href={`/kanban/${branchDropdown}/${actName}/${actDate}`}
                        >
                          {actName}
                        </Link>
                      </div>
                    )
                  )}
                </div>
              </div>
            ))
        )}
      </div>
    </div>
  );
}
