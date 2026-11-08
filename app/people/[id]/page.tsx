"use client";

import { useParams } from "next/navigation";
import { PeopleView } from "@/components/people-view";

export default function PersonPage() {
  const { id } = useParams<{ id: string }>();
  return <PeopleView id={id} />;
}
