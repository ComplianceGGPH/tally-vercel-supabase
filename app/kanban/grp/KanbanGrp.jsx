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
                            phone_number
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

    
    const grouped = activities.reduce((acc, item) => {
        const key = item.activity_date || "No Date";
        if (!acc[key]) acc[key] = [];
        acc[key].push(item);
        return acc;
    }, {});

    const count = activities.filter(item => item.submission.group === groupDropdown)
                            .length;

    // update URL when filters change
    useEffect(() => {
        const params = new URLSearchParams();
        if (branchDropdown) params.set("branch", branchDropdown);
        if (actDate) params.set("date", actDate);
        if (groupDropdown) params.set("group", groupDropdown);

        // CURRENT ROUTE PLEASE
        router.push(`/kanban/grp?${params.toString()}`, { scroll: false });
    }, [branchDropdown, actDate, groupDropdown, router]);

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
                        onChange={(e) => setActDate(e.target.value)}
                    />
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
                    branchDropdown && actDate && groupDropdown && (
                        <p>No activities found for the selected filters.</p>
                    )
                ) : (
                    Object.entries(grouped)
                        .sort(([timeA], [timeB]) => {
                            if (timeA === "No Time") return 1;
                            if (timeB === "No Time") return -1;
                            return timeA.localeCompare(timeB);
                        })
                        .map(([activityTime, items]) => (
                            <div className="kanbanCol" key={activityTime}>
                                <h2>Date : {activityTime}</h2>
                                <div className="actBoxContainer">
                                    {[...new Set(items.map((i) => i.activity_name))].map(
                                        (actName) => (
                                            <div className="actBox" key={actName}>
                                                {actName}
                                            </div>
                                        )
                                    )}
                                </div>
                            </div>
                        ))
                )}
            </div><br />

            {/* Display Unique Pax Count */}
            <div className="Pax Count">
                <span style={{ color: 'green' }}>
                    {
                        new Set(
                            activities
                            .filter(item => item.submission.group === groupDropdown)
                            .map(item => item.submission.participant.id)
                        ).size
                    } pax <br />
                    With a health condition - 
                    {
                        new Set(
                            activities
                            .filter(item => item.submission.participant.health_declaration)
                            .map(item => item.submission.group)
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
                    branchDropdown && actDate && groupDropdown && (
                        <p>No participants found for the selected filters.</p>
                    )
                )}
            </div>
        </div>
    );
}