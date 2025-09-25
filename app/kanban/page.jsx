// app/kanban/page.jsx
"use client";

import { Suspense } from "react";
import KanbanClient from "./KanbanClient";

export default function KanbanPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <KanbanClient />
    </Suspense>
  );
}