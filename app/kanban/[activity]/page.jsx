"use client";
import { use, useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function ActivityBoard({ params }) {
  const { activity: rawActivity } = use(params);
  const activity = decodeURIComponent(rawActivity);

  const [activities, setActivities] = useState([]);

  useEffect(() => {
    async function fetchData() {
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
              fullname,
              health_declaration,
              phone_number
            )
          )
        `)
        .eq("submission.branch", "GOPENG GLAMPING PARK")
        .eq("activity_name", activity);

      if (error) console.error(error);
      else setActivities(data || []);
    }
    fetchData();
  }, []);

  // Group participants by submission.group
  const grouped = activities.reduce((acc, act) => {
    const group = act.submission?.group || "Ungrouped";
    if (!acc[group]) acc[group] = [];
    acc[group].push(act.submission.participant);
    return acc;
  }, {});

  // Sort participants in each group so health_declaration != null is first
  Object.keys(grouped).forEach((g) => {
    grouped[g].sort((a, b) => {
      if (a.health_declaration && !b.health_declaration) return -1;
      if (!a.health_declaration && b.health_declaration) return 1;
      return 0;
    });
  });

  return (
    <div>
      <h1>Kanban for {activity}</h1>
      <pre>{JSON.stringify(activities, null, 2)}</pre>
    </div>
  );
}
