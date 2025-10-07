"use client";
import { use, useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function clientBoard({ params }) {

  const {
    activity: rawActivity,
    branch: rawBranch,
    date: rawDate,
    session: rawSession
  } = use(params);

  const activity = decodeURIComponent(rawActivity);
  const branch = decodeURIComponent(rawBranch);
  const date = decodeURIComponent(rawDate);
  const session = decodeURIComponent(rawSession);

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
              id,
              fullname,
              age,
              health_declaration,
              phone_number
            )
          )
        `)
        .eq("submission.branch", branch)
        .eq("activity_name", activity)
        .eq("activity_date", date);
        // .eq("activity_time", session);

      if (error) console.error(error);
      else setActivities(data || []);
    }
    fetchData();
  }, []);

  // // Group participants by submission.group
  // const grouped = activities.reduce((acc, act) => {
  //   const group = act.submission?.group || "Ungrouped";
  //   if (!acc[group]) acc[group] = [];
  //   acc[group].push(act.submission.participant);
  //   return acc;
  // }, {});

  // // Sort participants in each group so health_declaration != null is first
  // Object.keys(grouped).forEach((g) => {
  //   grouped[g].sort((a, b) => {
  //     if (a.health_declaration && !b.health_declaration) return -1;
  //     if (!a.health_declaration && b.health_declaration) return 1;
  //     return 0;
  //   });
  // });

  const grouped = activities.reduce((acc, item) => {
    const key = item.submission?.group || "Ungrouped";
    if (!acc[key]) {
      acc[key] = {
        items: [],
        ids: []
      };
    }

    acc[key].items.push(item);
    acc[key].ids.push(item.submission.participant.id);

    return acc;
  }, {});

  return (
    <div>
      <Link href="/kanban/act" passHref>
        <div className="box text-center" style={{ cursor: 'pointer' }}>
          Back to Kanban / Board Selection
        </div>
      </Link>
      
      <h2 className="groupName"> {activity}, {branch} </h2>
      <div className="board">
        {Object.entries(grouped).map(([groupName, {items, ids}]) => (
          <div className="column" key={groupName}>
            <br />
            <h2>{groupName} - {ids.length} pax </h2>
            {items.map(item => (
              <Link href={`/kanban/clinfo/${item.submission.participant.id}`} key={item.submission.participant.id}>
                <div className="box" >
                  {item.submission.participant.fullname} <br />
                  {item.submission.participant.phone_number} <br />
                  {item.submission.participant.age} years old <br />
                  {item.submission.participant.health_declaration ? (
                      <span style={{ color: 'red' }}>{item.submission.participant.health_declaration}</span>
                  ) : (
                    <span style={{ color: 'blue' }}>No Health Condition</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
