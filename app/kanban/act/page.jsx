// app/kanban/act/page.jsx
"use client";

import { Suspense } from "react";
import KanbanActClient from "./KanbanClient";

export default function KanbanActPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <KanbanActClient />
    </Suspense>
  );
}