// MOCK. TODO: POST multipart to your API, e.g.
// const form = new FormData(); form.append('video', file); ...
// return apiRequest('/analyses', { method: 'POST', body: form });
const wait = (ms = 800) => new Promise((r) => setTimeout(r, ms));

export async function createAnalysis({ file, bowlingArm, calibration }) {
  await wait();
  return { id: crypto.randomUUID(), fileName: file.name, bowlingArm, calibration };
}
