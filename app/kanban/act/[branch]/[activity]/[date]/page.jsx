"use client";
import { use, useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

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
            yas_insurance,
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
    acc[key].ids.push(item.submission?.participant?.id || "Unknown");

    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">{activity}</h1>
            <p className="text-muted-foreground">{branch} - {date}</p>
          </div>
          <Link href="/kanban/act">
            <Button variant="outline">
              ← Back to Activities
            </Button>
          </Link>
        </div>
      
      {/* Horizontal scrollable container for groups */}
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-6 min-w-max">
          {Object.entries(grouped).map(([groupName, {items, ids}]) => {
            // Sort items: health declarations and no insurance first
            const sortedItems = [...items].sort((a, b) => {
              const aHasHealth = a.submission?.participant?.health_declaration;
              const bHasHealth = b.submission?.participant?.health_declaration;
              const aNoInsurance = a.submission?.yas_insurance?.toLowerCase() === 'no insurance';
              const bNoInsurance = b.submission?.yas_insurance?.toLowerCase() === 'no insurance';
              
              // Priority: health declaration or no insurance
              const aPriority = aHasHealth || aNoInsurance;
              const bPriority = bHasHealth || bNoInsurance;
              
              if (aPriority && !bPriority) return -1;
              if (!aPriority && bPriority) return 1;
              return 0;
            });

            return (
              <Card key={groupName} className="w-80 flex-shrink-0 shadow-md">
                <CardContent className="p-4 space-y-4">
                  <div className="flex items-center justify-between border-b pb-3">
                    <h2 className="text-xl font-semibold">{groupName}</h2>
                    <Badge variant="secondary">{ids.length} pax</Badge>
                  </div>
                  
                  {/* Scrollable participant list */}
                  <div className="h-[calc(100vh-18rem)] overflow-y-auto pr-2 space-y-2">
                    {sortedItems.map((item, i) => {
                      const participant = item.submission?.participant;
                      if (!participant) return null; // skip if missing submission/participant

                      return (
                        <Link
                          href={`/kanban/clinfo/${participant.id}`}
                          key={item.submission?.id || `${participant.id}-${i}`}
                        >
                          <Card className="hover:shadow-lg transition-all hover:border-primary border-2">
                            <CardContent className="p-4">
                              <div className="font-medium">{participant.fullname}</div>
                              <div className="text-sm text-muted-foreground">{participant.phone_number}</div>
                              <div className="text-sm">{participant.age} years old</div>
                              {participant.health_declaration ? (
                                <Badge variant="destructive" className="mt-2 whitespace-normal text-left break-words">
                                  {participant.health_declaration}
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="mt-2">No Health Condition</Badge>
                              )}
                              {item.submission?.yas_insurance && (
                                <div className="text-sm mt-2">
                                  <em>Insurance:</em> {item.submission.yas_insurance}
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        </Link>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
      </div>
    </div>
  );
}
