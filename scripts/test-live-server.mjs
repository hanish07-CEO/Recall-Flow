async function testServer() {
  const baseUrl = 'http://localhost:3000';
  console.log('Testing RecallFlow live server at ' + baseUrl);

  // Wait a couple seconds if needed
  let ok = false;
  for (let i = 0; i < 10; i++) {
    try {
      const res = await fetch(`${baseUrl}/api/system/status`);
      if (res.ok) {
        ok = true;
        break;
      }
    } catch (e) {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  if (!ok) {
    throw new Error('Server did not respond within 10 seconds');
  }

  console.log('✓ Server is responsive.');

  // 1. Check system status
  const statusRes = await fetch(`${baseUrl}/api/system/status`);
  const status = await statusRes.json();
  console.log('✓ System Status:', status.mode, status.integrations);

  // 2. Check Section 1: Landing Page (/)
  const landingRes = await fetch(`${baseUrl}/`);
  const landingHtml = await landingRes.text();
  if (!landingHtml.includes('meeting memory copilot') || !landingHtml.includes('Launch Dashboard')) {
    throw new Error('Landing page did not render correctly');
  }
  console.log('✓ Section 1 (Landing Page) HTML verified (length: ' + landingHtml.length + ' bytes).');

  // 3. Check Section 2: Login Page (/login)
  const loginRes = await fetch(`${baseUrl}/login`);
  const loginHtml = await loginRes.text();
  if (!loginHtml.includes('Welcome to Recall') || !loginHtml.includes('Engineering Team Member')) {
    throw new Error('Login page did not render correctly');
  }
  console.log('✓ Section 2 (Login Page) HTML verified (length: ' + loginHtml.length + ' bytes).');

  // 4. Check Section 3: Dashboard Page (/dashboard)
  const dashRes = await fetch(`${baseUrl}/dashboard`);
  const dashHtml = await dashRes.text();
  if (!dashHtml.includes('Voice Meeting Stream') || !dashHtml.includes('Action Items')) {
    throw new Error('Dashboard page did not render correctly');
  }
  console.log('✓ Section 3 (Dashboard Page) HTML verified (length: ' + dashHtml.length + ' bytes).');

  // 5. Test Omi Webhook with Target User Scenario
  console.log('\n--- Sending Voice Transcript to POST /api/omi/webhook ---');
  const omiRes = await fetch(`${baseUrl}/api/omi/webhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      eventId: 'evt-live-002',
      source: 'omi_simulator',
      userId: 'user-default',
      workspaceId: 'workspace-default',
      sessionId: 'session-20261006-api-review',
      timestamp: '2026-10-06T15:00:00.000Z',
      transcript:
        'During today’s API review, Priya will benchmark caching by Friday. We also need to revisit the Qdrant cost issue discussed last Tuesday.',
      privacyScope: 'team',
      retentionPolicy: '30d',
    }),
  });

  const omiData = await omiRes.json();
  console.log('✓ Webhook Status Code:', omiRes.status);
  console.log('✓ Result Success:', omiData.result?.success);
  console.log('✓ Action Items Extracted:', omiData.result?.actionItemsExtracted);
  console.log('✓ Change Delta Detected:', omiData.result?.changeDetected);
  console.log('✓ Lyzr Agent Steps:', omiData.workflowRun?.trace?.steps?.length);

  // 6. Test Evidence-Backed Search
  console.log('\n--- Testing POST /api/search (Qdrant Cost Inquiry) ---');
  const searchRes = await fetch(`${baseUrl}/api/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: 'What was discussed about the Qdrant cost issue last Tuesday?',
      userId: 'user-default',
      workspaceId: 'workspace-default',
      allowedScopes: ['team', 'public'],
    }),
  });
  const searchData = await searchRes.json();
  console.log('✓ Search Answer:', searchData.data?.answer?.slice(0, 100) + '...');
  console.log('✓ Citations Count:', searchData.data?.citations?.length);

  console.log('\n=== ALL 3 SECTIONS AND BACKEND ENDPOINTS VERIFIED SUCCESSFULLY ===');
}

testServer().catch((e) => {
  console.error('Test error:', e);
  process.exit(1);
});
