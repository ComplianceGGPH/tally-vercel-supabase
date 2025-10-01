"use client";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function KanbanGrpClient() {
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
                    )
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
                    submission:submission_id(
                        id,
                        branch,
                        group,
                        participant:participant_id(
                            id,
                            fullname,
                            health_declaration,
                            phone_number,
                            age
                        )
                    )
                `)
                .eq("submission.branch", branchDropdown)
                // .eq("submission.group", groupDropdown);

            if (error) {
                console.error("❌ Error fetching activities:", error);
            } else {
                // Filter the data by group AFTER fetching
                const filteredActivities = data.filter(
                    activity => activity.submission?.group === groupDropdown
                );
                
                console.log("✅ Filtered to", filteredActivities.length, "activities for group:", groupDropdown);
                
                // Use filteredActivities instead of data
                setActivities(filteredActivities);
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

        const day = new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long' });
        setDayName(day);
    };
    
    const grouped = activities.reduce((acc, item) => {
        const key = item.activity_date || "No Date";
        if (!acc[key]) acc[key] = [];
        acc[key].push(item);
        return acc;
    }, {});

    const count = activities.filter(item => item.submission.group === groupDropdown)
                            .length;

    return (
        <div className="container">
            <h1>Kanban Group View</h1>
            <Link href="/kanban">
                Back to Kanban / Board Selection
            </Link>

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
                        onChange={handleDateChange}
                    />
                    {dayName && <span style={{ marginLeft: '10px' }}>( {dayName} )</span>}
                </div>

                <div>
                    <label htmlFor="groupDropdown">Choose Group : </label>
                    <select
                        id="groupDropdown"
                        className="groupDropdown"
                        value={groupDropdown}
                        onChange={(e) => setGroupDropdown(e.target.value)}
                        disabled={groups.length === 0}
                    >
                        {groups.length === 0 ? (
                            <option value="">No groups available</option>
                        ) : (
                            groups.map((group) => (
                                <option key={group} value={group}>
                                    {group}
                                </option>
                            ))
                        )}
                    </select>
                </div>
            </div>

            {/* Display activities */}
            <div className="activities-container">
                {activities.length === 0 ? (
                    branchDropdown && actDate && (
                        <p>No activities found for the selected filters.</p>
                    )
                ) : (
                    Object.entries(grouped)
                        .sort(([timeA], [timeB]) => {
                            if (timeA === "No Time") return 1;
                            if (timeB === "No Time") return -1;
                            return timeA.localeCompare(timeB);
                        })
                        .map(([activityDate, items]) => {
                            // Get day name for the activityDate
                            let dayLabel = "";
                            if (activityDate && activityDate !== "No Date") {
                                const dateObj = new Date(activityDate);
                                if (!isNaN(dateObj)) {
                                    dayLabel = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
                                }
                            }
                            return (
                                <div className="kanbanCol" key={activityDate}>
                                    <h2>
                                        Date : {activityDate}
                                        {dayLabel && (
                                            <span style={{ marginLeft: '10px' }}>
                                                ( {dayLabel} )
                                            </span>
                                        )}
                                    </h2>
                                    <div className="actBoxContainer">
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
                                                    <div className="actBox" key={item.activity_name + item.activity_time}>
                                                        <span style={{ fontWeight: "bold" }}>
                                                            {item.activity_time ? time12h + '-' : ""}
                                                        </span>
                                                        {item.activity_name}
                                                    </div>
                                                );
                                            })}
                                    </div>
                                </div>
                            );
                        })
                )}
            </div>

            {/* Display Unique Pax Count */}
            <div className="PaxCount">
                <span style={{ color: 'green' }}>
                    {
                        new Set(
                            activities
                            .map(item => item.submission.participant.id)
                        ).size
                    } pax <br />
                    With a health condition - 
                    {
                        new Set(
                            activities
                            .filter(item => item.submission.participant.health_declaration)
                            .map(item => item.submission.participant.id)
                        ).size
                    } pax
                </span>
            </div>
                        
            {/* Display Participant */}
            <div className="participants-container">
                {activities.length > 0 ? (
                    // Get unique participants by ID, then sort with health condition at the top
                    [...new Map(
                        activities.map(activity => [
                            activity.submission.participant.id,
                            activity.submission.participant
                        ])
                    ).values()]
                    .sort((a, b) => {
                        // Put those with health_declaration (truthy) at the top
                        if (a.health_declaration && !b.health_declaration) return -1;
                        if (!a.health_declaration && b.health_declaration) return 1;
                        return 0;
                    })
                    .map((participant) => (
                        <div className="box" key={participant.id}>
                            {participant.fullname} <br />
                            {participant.phone_number} <br />
                            {participant.age} years old <br />
                            {participant.health_declaration ? (
                                <span style={{ color: 'red' }}>
                                    {participant.health_declaration}
                                </span>
                            ) : (
                                <span style={{ color: 'blue' }}>No Health Condition</span>
                            )}
                        </div>
                    ))
                ) : (
                    branchDropdown && actDate && (
                        <p>No participants found for the selected filters.</p>
                    )
                )}
            </div>
        </div>
    );
}