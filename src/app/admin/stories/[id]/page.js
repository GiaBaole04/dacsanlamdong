"use client";

import { useParams } from "next/navigation";
import StoryForm from "@/components/admin/StoryForm";

export default function EditStoryPage() {
  const params = useParams();
  return <StoryForm storyId={params?.id} />;
}