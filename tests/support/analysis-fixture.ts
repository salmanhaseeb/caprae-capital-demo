export const analysisFixture = {
  summary: "Elena is exploring a long-term partnership and requested examples.",
  relationshipStatus: "WARM",
  sellerReadiness: "MEDIUM",
  sentiment: "POSITIVE",
  successionSignal: false,
  recommendedAction: "Send two partnership examples.",
  followUpMonths: 6,
  keyContext: "Exploring a long-term partnership; requested examples.",
};
export function responseFixture(value: unknown = analysisFixture) {
  return {
    id: "resp_test", object: "response", created_at: 1789600000,
    status: "completed", model: "gpt-4.1-mini",
    output: [{ type: "message", id: "msg_test", status: "completed", role: "assistant", content: [{ type: "output_text", text: JSON.stringify(value), annotations: [] }] }],
  };
}
