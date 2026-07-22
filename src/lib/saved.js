import { base44 } from "@/api/base44Client";

export async function findSavedByOpportunity(opportunityId) {
  const rows = await base44.entities.SavedOpportunity.filter({ opportunity_id: opportunityId });
  return (rows && rows[0]) || null;
}

export async function toggleSaveOpportunity(opp, score) {
  const existing = await findSavedByOpportunity(opp.id);
  if (existing) {
    await base44.entities.SavedOpportunity.delete(existing.id);
    return false;
  }
  await base44.entities.SavedOpportunity.create({
    opportunity_id: opp.id,
    title: opp.title,
    funder: opp.provider_name,
    amount: opp.value_amount,
    deadline: opp.deadline,
    match_score: score,
    type: opp.type,
    status: "saved",
    outcome: "pending",
  });
  return true;
}

export async function fetchSavedIds() {
  const rows = await base44.entities.SavedOpportunity.list("-created_date", 500);
  return new Set((rows || []).map((r) => r.opportunity_id).filter(Boolean));
}