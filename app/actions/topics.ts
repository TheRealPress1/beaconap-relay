"use server";

import { addTopic, archiveTopic, renameTopic } from "@/lib/topics/taxonomy";

export async function addTopicAction(input: { label: string; description?: string }) {
  const label = input.label?.trim();
  if (!label) throw new Error("Topic label is required.");
  await addTopic({ label, description: input.description?.trim() || undefined });
}

export async function archiveTopicAction(id: string, archive: boolean) {
  await archiveTopic(id, archive);
}

export async function renameTopicAction(input: {
  id: string;
  label: string;
  description?: string;
}) {
  const label = input.label?.trim();
  if (!label) throw new Error("Topic label is required.");
  await renameTopic(input.id, label, input.description?.trim() || undefined);
}
