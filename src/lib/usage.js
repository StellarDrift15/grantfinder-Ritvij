import { base44 } from "@/api/base44Client";

export async function trackGrantClick(value) {
  try {
    const payload = { action: "track", event: "grant_click" };
    const v = Number(value);
    if (Number.isFinite(v) && v > 0) payload.value = v;
    await base44.functions.invoke("usage", payload);
  } catch (_e) {
    /* usage tracking is best-effort — never block the click */
  }
}

export async function trackRewrite() {
  try {
    await base44.functions.invoke("usage", { action: "track", event: "rewrite" });
  } catch (_e) {
    /* usage tracking is best-effort — never block the generation */
  }
}

export async function getUsage() {
  try {
    const res = await base44.functions.invoke("usage", { action: "read" });
    return {
      grants_clicked: res?.grants_clicked || 0,
      grants_value_opened: res?.grants_value_opened || 0,
      rewrites_generated: res?.rewrites_generated || 0,
    };
  } catch (_e) {
    return { grants_clicked: 0, grants_value_opened: 0, rewrites_generated: 0 };
  }
}