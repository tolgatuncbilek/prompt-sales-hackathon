import * as crm from './crm.ts';

export async function initCrmFromApi() {
  console.log("Loading CRM data from API...");
  // Login first to set cookie
  try {
    const authRes = await fetch('/api/auth/users');
    const apiUsers = await authRes.json();
    if (apiUsers.length > 0) {
      await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: apiUsers[0].id })
      });
    }

    // Now fetch everything
    const res = await fetch('/api/sync');
    if (!res.ok) throw new Error("Sync failed");
    const data = await res.json();
    
    // Assign to crm module
    crm.users = data.users;
    crm.accounts = data.accounts;
    crm.contacts = data.contacts;
    crm.products = data.products;
    crm.services = data.services;
    crm.deals = data.deals;
    crm.serviceContracts = data.serviceContracts;
    crm.cases = data.cases;
    crm.offers = data.offers;
    crm.aiInsights = data.aiInsights;
    crm.activities = data.activities;
    crm.notifications = data.notifications;
    
    return true;
  } catch (e) {
    console.error("Failed to load from API", e);
    return false;
  }
}
