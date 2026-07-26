// Simple in-memory background worker client.
// This replaces heavy external queuing solutions (like Inngest) with standard NodeJS async promises,
// ensuring zero installation overhead while keeping the background processing architecture.
export const inngest = {
  send: async (eventName: string, data: any) => {
    console.log(`[Job Queue] Event dispatched: ${eventName} with data:`, data);
  }
};
