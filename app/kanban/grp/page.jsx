// app/kanban/grp/page.jsx
"use client";

import { Suspense } from "react";
import KanbanGrpClient from "./KanbanGrp";

export default function KanbanGrpPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <KanbanGrpClient />
    </Suspense>
  );
}