"use client";
import { useEffect, useState, Suspense } from "react";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

function KanbanActClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [branchDropdown, setBranchDropdown] = useState(
    searchParams.get("branch") || "GOPENG GLAMPING PARK"
  );
  const [actDate, setActDate] = useState(searchParams.get("date") || "");
  const [activities, setActivities] = useState([]);
  const [dayName, setDayName] = useState("");

  // Load saved values from localStorage
  useEffect(() => {
    const savedDate = localStorage.getItem("actDate");
    const savedBranch = localStorage.getItem("branchDropdown");

    if (savedDate) {
      setActDate(savedDate);
      const day = new Date(savedDate).toLocaleDateString("en-US", {
        weekday: "long",
      });
      setDayName(day);
    }

    if (savedBranch) {
      setBranchDropdown(savedBranch);
    }
  }, []);

  const handleDateChange = (e) => {
    const selectedDate = e.target.value;
    setActDate(selectedDate);
    localStorage.setItem("actDate", selectedDate);

    const day = new Date(selectedDate).toLocaleDateString("en-US", {
      weekday: "long",
    });
    setDayName(day);
  };

  const handleBranchChange = (e) => {
    const selectedBranch = e.target.value;
    setBranchDropdown(selectedBranch);
    localStorage.setItem("branchDropdown", selectedBranch);
  };

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

  useEffect(() => {
    const params = new URLSearchParams();
    if (branchDropdown) params.set("branch", branchDropdown);
    if (actDate) params.set("date", actDate);

    router.push(`/kanban/act?${params.toString()}`, { scroll: false });
  }, [branchDropdown, actDate]);

  const grouped = activities.reduce((acc, item) => {
    const key = item.activity_time || "No Time";
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  const CountClientInAct = activities.reduce((acc, item) => {
    const key = item.activity_name || "No Activity";
    if (!acc[key]) {
      acc[key] = {
        items: [],
        ids: [],
        groups: [],
      };
    }

    acc[key].items.push(item);
    acc[key].ids.push(item.submission.participant.id);
    acc[key].groups.push(item.submission.group);

    return acc;
  }, {});

  function formatTo12Hour(timeStr) {
    if (!timeStr || timeStr === "No Time") return timeStr;
    const [h, m] = timeStr.split(":");
    let hour = parseInt(h, 10);
    const minute = m || "00";
    const ampm = hour >= 12 ? "PM" : "AM";
    hour = hour % 12 || 12;
    return `${hour}:${minute.padStart(2, "0")} ${ampm}`;
  }

  return (
    <div className="container">
      <h2>Activity Board Page</h2>
      <Link href="/kanban" passHref>
        <div className="box text-center" style={{ cursor: "pointer" }}>
          Back to Kanban / Board Selection
        </div>
      </Link>

      <div className="branchDateInput">
        <div>
          <label htmlFor="branchDropdown">Choose Branch : </label>
          <select
            id="branchDropdown"
            className="branchDropdown"
            value={branchDropdown}
            onChange={handleBranchChange}
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
            onChange={handleDateChange}
          />
          {dayName && (
            <span style={{ marginLeft: "10px" }}>( {dayName} )</span>
          )}
        </div>
      </div>

      <div className="activities-container">
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
                <h2>Session : {formatTo12Hour(activityTime)}</h2>
                <div className="actBoxContainer">
                  {[...new Set(items.map((i) => i.activity_name))].map(
                    (actName) => (
                      <div className="box actBox" key={actName}>
                        <Link
                          href={`/kanban/act/${branchDropdown}/${actName}/${actDate}`}
                        >
                          {actName}
                        </Link>
                        {CountClientInAct[actName] && (
                          <div className="paxgrpCount">
                            <span style={{ color: "green" }}>
                              {CountClientInAct[actName].ids.length} pax <br />
                              {
                                new Set(
                                  CountClientInAct[actName].groups
                                ).size
                              } grp
                            </span>
                          </div>
                        )}
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

export default function KanbanActPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <KanbanActClient />
    </Suspense>
  );
}