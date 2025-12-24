"use client";
import { useEffect, useState, Suspense } from "react";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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

  const handleBranchChange = (value) => {
    setBranchDropdown(value);
    localStorage.setItem("branchDropdown", value);
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
          submission:submission_id!inner(
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
    acc[key].ids.push(item.submission?.participant?.id || "Unknown");
    acc[key].groups.push(item.submission?.group || "No group");

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
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">Activity Board</h1>
            <p className="text-muted-foreground">View participants organized by activities</p>
          </div>
          <Link href="/kanban">
            <Button variant="outline">
              ← Back to Selection
            </Button>
          </Link>
        </div>

        <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Filter Options</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-2">
            <label htmlFor="branchDropdown" className="text-sm font-medium">Choose Branch</label>
            <Select
              value={branchDropdown}
              onValueChange={handleBranchChange}
            >
              <SelectTrigger id="branchDropdown">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="GOPENG GLAMPING PARK">GGP</SelectItem>
                <SelectItem value="GLAMPING @ WETLAND PUTRAJAYA">GLOW</SelectItem>
                <SelectItem value="PUTRAJAYA LAKE RECREATION CENTER">PLRC</SelectItem>
                <SelectItem value="PUTRAJAYA WETLAND ADVENTURE PARK">PWAP</SelectItem>
                <SelectItem value="BOTANI">BOTANI</SelectItem>
                <SelectItem value="GCT EVENTS">GCT EVENTS</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="actDate" className="text-sm font-medium">Date</label>
            <input
              type="date"
              id="actDate"
              name="actDate"
              value={actDate}
              onChange={handleDateChange}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors"
            />
            {dayName && (
              <span className="text-sm text-muted-foreground">( {dayName} )</span>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="activities-container">
        {activities.length === 0 ? (
          <Card className="shadow-md">
            <CardContent className="py-12">
              <div className="text-center space-y-2">
                <p className="text-lg text-muted-foreground">No activities found for the selected branch and date.</p>
                <p className="text-sm text-muted-foreground">Try selecting a different date or branch.</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          Object.entries(grouped)
            .sort(([timeA], [timeB]) => {
              if (timeA === "No Time") return 1;
              if (timeB === "No Time") return -1;
              return timeA.localeCompare(timeB);
            })
            .map(([activityTime, items]) => (
              <Card key={activityTime} className="shadow-md">
                <CardHeader>
                  <CardTitle className="text-xl">Session: {formatTo12Hour(activityTime)}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-3 overflow-x-auto pb-2">
                    {[...new Set(items.map((i) => i.activity_name))].map(
                      (actName) => (
                        <Link
                          key={actName}
                          href={`/kanban/act/${branchDropdown}/${actName}/${actDate}`}
                          className="flex-shrink-0"
                        >
                          <Card className="hover:shadow-lg transition-all hover:border-primary border-2 w-72">
                            <CardContent className="p-4">
                              <div className="font-semibold text-center mb-3">{actName}</div>
                              {CountClientInAct[actName] && (
                                <div className="flex gap-2 justify-center">
                                  <Badge variant="secondary">
                                    {CountClientInAct[actName].ids.length} pax
                                  </Badge>
                                  <Badge variant="outline">
                                    {
                                      new Set(
                                        CountClientInAct[actName].groups
                                      ).size
                                    } grp
                                  </Badge>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        </Link>
                      )
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
        )}
      </div>
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