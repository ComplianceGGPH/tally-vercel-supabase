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

function KanbanGrpClientForm() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [groups, setGroups] = useState([]); // Store all groups
    const [groupDropdown, setGroupDropdown] = 
        useState(searchParams.get("group") || "");
    const [branchDropdown, setBranchDropdown] = 
        useState(searchParams.get("branch") || "GOPENG GLAMPING PARK");
    const [actDate, setActDate] = 
        useState(searchParams.get("date") || "");
    const [activities, setActivities] = useState([]);
    const [dayName, setDayName] = useState('');

    // Fetch groups when branch or date changes
    useEffect(() => {
        async function fetchGroups() {
            if (!branchDropdown || !actDate) return;
            
            const { data, error } = await supabase
                .from("activities")
                .select(`
                    submission:submission_id(
                        group
                    ),
                    participant:participant_id(id)
                `)
                .eq("submission.branch", branchDropdown)
                .eq("activity_date", actDate);

            if (error) {
                console.error("Error fetching groups:", error);
            } else {
                // Get unique groups and sort them
                const uniqueGroups = [...new Set(
                    data
                        .map((item) => item.submission?.group)
                        .filter(Boolean)
                )].sort();
                
                console.log("Available groups:", uniqueGroups);
                
                // Update groups first
                setGroups(uniqueGroups);
                
                // Use functional update to get the current groupDropdown value
                setGroupDropdown(currentGroup => {
                    if (uniqueGroups.length === 0) {
                        console.log("No groups available, clearing selection");
                        setActivities([]);
                        return "";
                    }
                    
                    // If current selection is valid, keep it
                    if (currentGroup && uniqueGroups.includes(currentGroup)) {
                        console.log("Keeping current selection:", currentGroup);
                        return currentGroup;
                    }
                    
                    // Otherwise, auto-select first group
                    console.log("Auto-selecting first group:", uniqueGroups[0]);
                    return uniqueGroups[0];
                });
            }
        }
        fetchGroups();
    }, [branchDropdown, actDate]);

    // Fetch activities when all filters are set
    useEffect(() => {
        async function fetchData() {
            console.log("🔄 fetchData triggered with:", { 
            branchDropdown, 
            actDate, 
            groupDropdown 
            });
            
            if (!branchDropdown || !actDate || !groupDropdown) {
            console.log("⏭️ Skipping fetch - missing filters");
            setActivities([]);
            return;
            }
            
            console.log("📡 Fetching activities...");
            
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
                yas_insurance,
                participant:participant_id(
                    id,
                    fullname,
                    health_declaration,
                    phone_number,
                    age
                )
                )
            `)
            // .eq("submission.branch", branchDropdown)
            .eq("submission.group", groupDropdown)
            // .eq("activity_date", actDate);

            if (error) {
            console.error("❌ Error fetching activities:", error);
            } else {
            console.log("✅ Found", data.length, "activities for filters:", { branchDropdown, actDate, groupDropdown });
            setActivities(data || []);
            }
        }

        fetchData();
        }, [branchDropdown, actDate, groupDropdown]);

    // update URL when filters change
    useEffect(() => {
        const params = new URLSearchParams();
        if (branchDropdown) params.set("branch", branchDropdown);
        if (actDate) params.set("date", actDate);
        if (groupDropdown) params.set("group", groupDropdown);

        // CURRENT ROUTE PLEASE
        router.push(`/kanban/grp?${params.toString()}`, { scroll: false });
    }, [branchDropdown, actDate, groupDropdown, router]);

    const handleDateChange = (e) => {
        const selectedDate = e.target.value;
        setActDate(selectedDate);
        localStorage.setItem('actDate', selectedDate); // ✅ Save to localStorage

        const day = new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long' });
        setDayName(day);
    };

    useEffect(() => {
        const savedDate = localStorage.getItem('actDate');
        if (savedDate) {
            setActDate(savedDate);
            const day = new Date(savedDate).toLocaleDateString('en-US', { weekday: 'long' });
            setDayName(day);
        }
    }, []);

    const grouped = activities.reduce((acc, item) => {
        const key = item.activity_date || "No Date";
        if (!acc[key]) acc[key] = [];
        acc[key].push(item);
        return acc;
    }, {});

    const count = activities.filter(item => item.submission.group === groupDropdown)
                            .length;

    return (
        <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
            <div className="max-w-7xl mx-auto p-6 space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <h1 className="text-3xl font-bold tracking-tight">Group Board</h1>
                        <p className="text-muted-foreground">View participants organized by groups</p>
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
                            onValueChange={setBranchDropdown}
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
                        {dayName && <span className="text-sm text-muted-foreground">( {dayName} )</span>}
                    </div>

                    <div className="flex flex-col gap-2">
                        <label htmlFor="groupDropdown" className="text-sm font-medium">Choose Group</label>
                        <Select
                            value={groupDropdown}
                            onValueChange={setGroupDropdown}
                            disabled={groups.length === 0}
                        >
                            <SelectTrigger id="groupDropdown">
                                <SelectValue placeholder={groups.length === 0 ? "No groups available" : "Select a group"} />
                            </SelectTrigger>
                            <SelectContent>
                                {groups.map((group) => (
                                    <SelectItem key={group} value={group}>
                                        {group}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Display activities */}
            <div className="activities-container space-y-6">
                {activities.length === 0 ? (
                    branchDropdown && actDate && (
                        <Card className="shadow-md">
                            <CardContent className="py-12">
                                <div className="text-center space-y-2">
                                    <p className="text-lg text-muted-foreground">No activities found for the selected filters.</p>
                                    <p className="text-sm text-muted-foreground">Try selecting a different date, branch, or group.</p>
                                </div>
                            </CardContent>
                        </Card>
                    )
                ) : (
                    Object.entries(grouped)
                        .sort(([timeA], [timeB]) => {
                            if (timeA === "No Time") return 1;
                            if (timeB === "No Time") return -1;
                            return timeA.localeCompare(timeB);
                        }).map(([activityDate, items]) => {
                            // Get day name for the activityDate
                            let dayLabel = "";
                            if (activityDate && activityDate !== "No Date") {
                                const dateObj = new Date(activityDate);
                                if (!isNaN(dateObj)) {
                                    dayLabel = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
                                }
                            }
                            return (
                                <Card key={activityDate} className="shadow-md">
                                    <CardHeader>
                                        <CardTitle className="text-xl">
                                            Date: {activityDate}
                                            {dayLabel && (
                                                <span className="text-muted-foreground ml-2">
                                                    ({dayLabel})
                                                </span>
                                            )}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex gap-3 overflow-x-auto pb-2">
                                            {items
                                                .slice()
                                                .sort((a, b) => {
                                                    // Handle missing or invalid times
                                                    if (!a.activity_time) return 1;
                                                    if (!b.activity_time) return -1;
                                                    return a.activity_time.localeCompare(b.activity_time);
                                                })
                                                // Only show unique activity_name per time slot
                                                .filter(
                                                    (item, idx, arr) =>
                                                        arr.findIndex(
                                                            i =>
                                                                i.activity_name === item.activity_name &&
                                                                i.activity_time === item.activity_time
                                                        ) === idx
                                                )
                                                .map((item) => {
                                                    // Convert 24h time to 12h format
                                                    let time12h = "";
                                                    if (item.activity_time) {
                                                        const [hour, minute] = item.activity_time.split(":");
                                                        const h = parseInt(hour, 10);
                                                        const ampm = h >= 12 ? "PM" : "AM";
                                                        const hour12 = ((h + 11) % 12 + 1);
                                                        time12h = `${hour12}:${minute} ${ampm}`;
                                                    }
                                                    return (
                                                        <Card 
                                                            key={item.activity_name + item.activity_time}
                                                            className="hover:shadow-lg transition-all hover:border-primary border-2 w-72 flex-shrink-0"
                                                        >
                                                            <CardContent className="p-4">
                                                                <div className="text-center">
                                                                    <div className="font-bold text-primary mb-1">
                                                                        {item.activity_time ? time12h : ""}
                                                                    </div>
                                                                    <div className="font-semibold">
                                                                        {item.activity_name}
                                                                    </div>
                                                                </div>
                                                            </CardContent>
                                                        </Card>
                                                    );
                                                })}
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })
                )}
            </div>

            {/* Display Unique Pax Count */}
            <div className="PaxCount flex gap-2 mb-4">
                <Badge variant="default" className="text-base">
                    {
                        new Set(
                            activities
                            .map(item => item.submission.participant.id)
                        ).size
                    } pax
                </Badge>
                <Badge variant="destructive" className="text-base">
                    With health condition: {
                        new Set(
                            activities
                            .filter(item => item.submission.participant.health_declaration)
                            .map(item => item.submission.participant.id)
                        ).size
                    } pax
                </Badge>
            </div>
                        
            {/* Display Participant */}
            <Card className="shadow-md">
                <CardHeader>
                    <CardTitle className="text-2xl">Participants</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                        {activities.length > 0 ? (
                            // Get unique participants by ID, then sort with health condition and no insurance at the top
                            [...new Map(
                                activities.map(activity => [
                                    activity.submission.participant.id,
                                    {
                                        participant: activity.submission.participant,
                                        insurance: activity.submission.yas_insurance
                                    }
                                ])
                            ).values()]
                    .sort((a, b) => {
                        const aHasHealth = a.participant.health_declaration;
                        const bHasHealth = b.participant.health_declaration;
                        const aNoInsurance = a.insurance?.toLowerCase() === 'no insurance';
                        const bNoInsurance = b.insurance?.toLowerCase() === 'no insurance';
                        
                        // Priority: health declaration or no insurance
                        const aPriority = aHasHealth || aNoInsurance;
                        const bPriority = bHasHealth || bNoInsurance;
                        
                        if (aPriority && !bPriority) return -1;
                        if (!aPriority && bPriority) return 1;
                        return 0;
                    })
                    .map(({participant, insurance}) => (
                        <Link 
                            key={participant.id}
                            href={`/kanban/clinfo/${participant.id}`}
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
                                    {insurance && (
                                        <div className="text-sm mt-2">
                                            <em>Insurance:</em> {insurance}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </Link>
                    ))
                        ) : (
                            branchDropdown && actDate && (
                                <div className="col-span-full text-center py-8">
                                    <p className="text-muted-foreground">No participants found for the selected filters.</p>
                                </div>
                            )
                        )}
                    </div>
                </CardContent>
            </Card>
            </div>
        </div>
    );   
}

export default function KanbanGrpPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <KanbanGrpClientForm />
    </Suspense>
  );
}