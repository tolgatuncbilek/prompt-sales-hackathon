import { db } from '../src/db/index.ts';
import {
  users,
  accounts,
  contacts,
  deals,
  cases,
  activities,
  productCatalog,
  serviceCatalog
} from '../src/db/schema/index.ts';
import { eq, desc, ilike, or, and } from 'drizzle-orm';
import readline from 'readline';

// Redirect console.log to console.error to prevent polluting stdout,
// which must contain ONLY JSON-RPC messages for the MCP client.
const originalLog = console.log;
console.log = (...args: any[]) => {
  console.error(...args);
};

const PROTOCOL_VERSION = "2024-11-05";

// Define the available tools
const tools = [
  {
    name: 'list_users',
    description: 'Retrieve a list of all users in the CRM with their IDs, names, emails, and roles.',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'list_accounts',
    description: 'List accounts in the CRM.',
    inputSchema: {
      type: 'object',
      properties: {
        limit: { type: 'number', description: 'Maximum number of accounts to return (default 20)' },
        offset: { type: 'number', description: 'Number of accounts to skip (default 0)' }
      }
    }
  },
  {
    name: 'get_account_details',
    description: 'Get detailed information for a specific account, including its contacts, deals, cases, and recent activity timeline.',
    inputSchema: {
      type: 'object',
      properties: {
        accountId: { type: 'string', description: 'UUID of the account' }
      },
      required: ['accountId']
    }
  },
  {
    name: 'search_crm',
    description: 'Search for accounts, contacts, cases, and deals using a search query string.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query' }
      },
      required: ['query']
    }
  },
  {
    name: 'create_account',
    description: 'Create a new account in the CRM.',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Name of the company/account' },
        domain: { type: 'string', description: 'Domain name (e.g., example.com)' },
        address: { type: 'string', description: 'Optional physical address' },
        vatId: { type: 'string', description: 'Optional VAT ID' },
        industry: { type: 'string', description: 'Optional industry sector' },
        ownerUserId: { type: 'string', description: 'UUID of the user who owns this account' }
      },
      required: ['name', 'domain', 'ownerUserId']
    }
  },
  {
    name: 'create_contact',
    description: 'Create a new contact associated with an account.',
    inputSchema: {
      type: 'object',
      properties: {
        accountId: { type: 'string', description: 'UUID of the account' },
        name: { type: 'string', description: 'Contact person\'s full name' },
        email: { type: 'string', description: 'Email address' },
        phone: { type: 'string', description: 'Optional phone number' },
        roleType: {
          type: 'string',
          enum: ['financial_decision_maker', 'budget_holder', 'tech_decision_maker', 'influencer'],
          description: 'Role of the contact in the target account'
        }
      },
      required: ['accountId', 'name', 'email', 'roleType']
    }
  },
  {
    name: 'list_deals',
    description: 'List deals, optionally filtered by accountId or owner.',
    inputSchema: {
      type: 'object',
      properties: {
        accountId: { type: 'string', description: 'Optional UUID of the account to filter by' },
        ownerUserId: { type: 'string', description: 'Optional owner user ID filter' }
      }
    }
  },
  {
    name: 'create_deal',
    description: 'Create a new sales deal for an account.',
    inputSchema: {
      type: 'object',
      properties: {
        accountId: { type: 'string', description: 'UUID of the account' },
        title: { type: 'string', description: 'Title of the deal' },
        stage: {
          type: 'string',
          enum: ['interest_shown', 'rfi_answered', 'rfp_given', 'customer_test', 'contract_negotiation', 'won', 'lost'],
          description: 'Current sales stage of the deal'
        },
        channel: {
          type: 'string',
          enum: ['direct', 'reseller'],
          description: 'Sales channel'
        },
        isPilot: { type: 'boolean', description: 'Is this a pilot deal? (default false)' },
        expectedClose: { type: 'string', description: 'Expected close date in YYYY-MM-DD format (optional)' },
        ownerUserId: { type: 'string', description: 'UUID of the user who owns this deal' }
      },
      required: ['accountId', 'title', 'stage', 'channel', 'ownerUserId']
    }
  },
  {
    name: 'update_deal_stage',
    description: 'Update the sales stage of an existing deal.',
    inputSchema: {
      type: 'object',
      properties: {
        dealId: { type: 'string', description: 'UUID of the deal' },
        stage: {
          type: 'string',
          enum: ['interest_shown', 'rfi_answered', 'rfp_given', 'customer_test', 'contract_negotiation', 'won', 'lost'],
          description: 'New sales stage'
        }
      },
      required: ['dealId', 'stage']
    }
  },
  {
    name: 'list_cases',
    description: 'List support/service cases, optionally filtered by accountId, status, or priority.',
    inputSchema: {
      type: 'object',
      properties: {
        accountId: { type: 'string', description: 'Optional UUID of the account' },
        status: { type: 'string', description: 'Optional status filter' }
      }
    }
  },
  {
    name: 'create_case',
    description: 'Create a new support/service case for an account.',
    inputSchema: {
      type: 'object',
      properties: {
        accountId: { type: 'string', description: 'UUID of the account' },
        serviceId: { type: 'string', description: 'Optional UUID of the service from the service catalog' },
        ownerUserId: { type: 'string', description: 'UUID of the assignee user' },
        contactId: { type: 'string', description: 'Optional UUID of the customer contact raising the case' },
        priority: {
          type: 'string',
          enum: ['low', 'medium', 'high', 'critical'],
          description: 'Priority of the case'
        },
        title: { type: 'string', description: 'Title/short description of the case' },
        description: { type: 'string', description: 'Detailed description of the issue' }
      },
      required: ['accountId', 'ownerUserId', 'priority', 'title']
    }
  },
  {
    name: 'update_case_status',
    description: 'Update the status of a case.',
    inputSchema: {
      type: 'object',
      properties: {
        caseId: { type: 'string', description: 'UUID of the case' },
        status: {
          type: 'string',
          enum: ['open', 'in_progress', 'escalated', 'resolved', 'closed'],
          description: 'New status'
        }
      },
      required: ['caseId', 'status']
    }
  },
  {
    name: 'add_activity',
    description: 'Log a manual timeline activity (note, meeting, call) for an account.',
    inputSchema: {
      type: 'object',
      properties: {
        accountId: { type: 'string', description: 'UUID of the account' },
        actorUserId: { type: 'string', description: 'UUID of the user logging this activity' },
        entityType: { type: 'string', description: 'Type of the entity the activity is about (e.g., \'deal\', \'case\', \'account\')' },
        entityId: { type: 'string', description: 'UUID of the entity' },
        eventType: { type: 'string', description: 'Type of event, e.g. \'note_added\', \'meeting_held\', \'call_made\'' },
        notes: { type: 'string', description: 'Content or details of the activity' }
      },
      required: ['accountId', 'actorUserId', 'entityType', 'entityId', 'eventType', 'notes']
    }
  },
  {
    name: 'get_pipeline_summary',
    description: 'Get a high-level summary of the sales pipeline, including counts by stage and list of deals flagged as at risk.',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  }
];

// JSON-RPC implementation
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

rl.on('line', async (line) => {
  if (!line.trim()) return;
  try {
    const request = JSON.parse(line);
    console.error(`Received request: ${request.method}, id: ${request.id}`);

    if (request.jsonrpc !== '2.0') {
      sendError(request.id, -32600, 'Invalid request: Not JSON-RPC 2.0');
      return;
    }

    switch (request.method) {
      case 'initialize':
        sendResponse(request.id, {
          protocolVersion: PROTOCOL_VERSION,
          capabilities: {
            tools: {}
          },
          serverInfo: {
            name: 'hmd-secure-crm-mcp',
            version: '1.0.0'
          }
        });
        break;

      case 'notifications/initialized':
        console.error('Client initialized connection');
        break;

      case 'ping':
        sendResponse(request.id, {});
        break;

      case 'tools/list':
        sendResponse(request.id, { tools });
        break;

      case 'tools/call':
        await handleToolCall(request.id, request.params.name, request.params.arguments || {});
        break;

      default:
        sendError(request.id, -32601, `Method not found: ${request.method}`);
    }
  } catch (error: any) {
    console.error('Error handling line:', error);
    try {
      const parsed = JSON.parse(line);
      sendError(parsed.id, -32603, `Internal error: ${error.message}`);
    } catch {
      sendError(null, -32700, `Parse error: ${error.message}`);
    }
  }
});

function sendResponse(id: any, result: any) {
  const message = JSON.stringify({
    jsonrpc: '2.0',
    id,
    result
  });
  originalLog(message);
}

function sendError(id: any, code: number, message: string) {
  const response = JSON.stringify({
    jsonrpc: '2.0',
    id,
    error: { code, message }
  });
  originalLog(response);
}

async function handleToolCall(id: any, name: string, args: any) {
  try {
    let result: any = null;

    switch (name) {
      case 'list_users': {
        const results = await db.select({
          id: users.id,
          name: users.name,
          email: users.email,
          role: users.role
        }).from(users);
        result = results;
        break;
      }

      case 'list_accounts': {
        const limit = args.limit || 20;
        const offset = args.offset || 0;
        const results = await db.select({
          id: accounts.id,
          name: accounts.name,
          domain: accounts.domain,
          vatId: accounts.vatId,
          industry: accounts.industry,
          ownerName: users.name
        })
        .from(accounts)
        .leftJoin(users, eq(accounts.ownerUserId, users.id))
        .orderBy(desc(accounts.createdAt))
        .limit(limit)
        .offset(offset);
        result = results;
        break;
      }

      case 'get_account_details': {
        const { accountId } = args;
        const [account] = await db.select().from(accounts).where(eq(accounts.id, accountId)).limit(1);
        if (!account) {
          result = { error: `Account with ID ${accountId} not found` };
          break;
        }

        const owner = account.ownerUserId ? 
          await db.select({ name: users.name, email: users.email }).from(users).where(eq(users.id, account.ownerUserId)).limit(1).then(r => r[0]) : null;

        const accountContacts = await db.select().from(contacts).where(eq(contacts.accountId, accountId));
        const accountDeals = await db.select().from(deals).where(eq(deals.accountId, accountId));
        const accountCases = await db.select().from(cases).where(eq(cases.accountId, accountId));
        const recentActivities = await db.select()
          .from(activities)
          .where(eq(activities.accountId, accountId))
          .orderBy(desc(activities.createdAt))
          .limit(10);

        result = {
          account: {
            ...account,
            owner
          },
          contacts: accountContacts,
          deals: accountDeals,
          cases: accountCases,
          activities: recentActivities
        };
        break;
      }

      case 'search_crm': {
        const { query } = args;
        const wildcard = `%${query}%`;

        const matchedAccounts = await db.select().from(accounts)
          .where(or(
            ilike(accounts.name, wildcard),
            ilike(accounts.domain, wildcard)
          ))
          .limit(5);

        const matchedContacts = await db.select().from(contacts)
          .where(or(
            ilike(contacts.name, wildcard),
            ilike(contacts.email, wildcard)
          ))
          .limit(5);

        const matchedDeals = await db.select().from(deals)
          .where(ilike(deals.title, wildcard))
          .limit(5);

        const matchedCases = await db.select().from(cases)
          .where(or(
            ilike(cases.title, wildcard),
            ilike(cases.description, wildcard)
          ))
          .limit(5);

        result = {
          accounts: matchedAccounts,
          contacts: matchedContacts,
          deals: matchedDeals,
          cases: matchedCases
        };
        break;
      }

      case 'create_account': {
        const [newAcc] = await db.insert(accounts).values({
          name: args.name,
          domain: args.domain,
          address: args.address || null,
          vatId: args.vatId || null,
          industry: args.industry || null,
          ownerUserId: args.ownerUserId,
          updatedAt: new Date()
        }).returning();
        result = { success: true, account: newAcc };
        break;
      }

      case 'create_contact': {
        const [newCont] = await db.insert(contacts).values({
          accountId: args.accountId,
          name: args.name,
          email: args.email,
          phone: args.phone || null,
          roleType: args.roleType
        }).returning();
        result = { success: true, contact: newCont };
        break;
      }

      case 'list_deals': {
        const filters = [];
        if (args.accountId) {
          filters.push(eq(deals.accountId, args.accountId));
        }
        if (args.ownerUserId) {
          filters.push(eq(deals.ownerUserId, args.ownerUserId));
        }

        const queryBuilder = db.select({
          id: deals.id,
          title: deals.title,
          stage: deals.stage,
          channel: deals.channel,
          expectedClose: deals.expectedClose,
          isPilot: deals.isPilot,
          accountName: accounts.name
        })
        .from(deals)
        .leftJoin(accounts, eq(deals.accountId, accounts.id));

        const results = filters.length > 0
          ? await queryBuilder.where(and(...filters))
          : await queryBuilder;

        result = results;
        break;
      }

      case 'create_deal': {
        const [newDeal] = await db.insert(deals).values({
          accountId: args.accountId,
          title: args.title,
          stage: args.stage,
          channel: args.channel,
          isPilot: args.isPilot || false,
          expectedClose: args.expectedClose || null,
          ownerUserId: args.ownerUserId,
          updatedAt: new Date()
        }).returning();
        result = { success: true, deal: newDeal };
        break;
      }

      case 'update_deal_stage': {
        const [updatedDeal] = await db.update(deals)
          .set({
            stage: args.stage,
            updatedAt: new Date()
          })
          .where(eq(deals.id, args.dealId))
          .returning();

        if (updatedDeal) {
          // Log activity for stage change
          await db.insert(activities).values({
            accountId: updatedDeal.accountId,
            entityType: 'deal',
            entityId: updatedDeal.id,
            eventType: 'stage_changed',
            payload: { stage: args.stage },
            isAiGenerated: false
          });
        }

        result = { success: !!updatedDeal, deal: updatedDeal };
        break;
      }

      case 'list_cases': {
        const filters = [];
        if (args.accountId) {
          filters.push(eq(cases.accountId, args.accountId));
        }
        if (args.status) {
          filters.push(eq(cases.status, args.status));
        }

        const queryBuilder = db.select({
          id: cases.id,
          title: cases.title,
          status: cases.status,
          priority: cases.priority,
          slaDeadline: cases.slaDeadline,
          accountName: accounts.name
        })
        .from(cases)
        .leftJoin(accounts, eq(cases.accountId, accounts.id));

        const results = filters.length > 0
          ? await queryBuilder.where(and(...filters))
          : await queryBuilder;

        result = results;
        break;
      }

      case 'create_case': {
        const [newCase] = await db.insert(cases).values({
          accountId: args.accountId,
          serviceId: args.serviceId || null,
          ownerUserId: args.ownerUserId,
          contactId: args.contactId || null,
          priority: args.priority,
          status: 'open',
          title: args.title,
          description: args.description || null,
          updatedAt: new Date()
        }).returning();
        result = { success: true, case: newCase };
        break;
      }

      case 'update_case_status': {
        const [updatedCase] = await db.update(cases)
          .set({
            status: args.status,
            updatedAt: new Date()
          })
          .where(eq(cases.id, args.caseId))
          .returning();

        if (updatedCase) {
          // Log activity for status change
          await db.insert(activities).values({
            accountId: updatedCase.accountId,
            entityType: 'case',
            entityId: updatedCase.id,
            eventType: 'status_changed',
            payload: { status: args.status },
            isAiGenerated: false
          });
        }

        result = { success: !!updatedCase, case: updatedCase };
        break;
      }

      case 'add_activity': {
        const [newAct] = await db.insert(activities).values({
          accountId: args.accountId,
          actorUserId: args.actorUserId || null,
          entityType: args.entityType,
          entityId: args.entityId,
          eventType: args.eventType,
          payload: { notes: args.notes },
          isAiGenerated: false
        }).returning();
        result = { success: true, activity: newAct };
        break;
      }

      case 'get_pipeline_summary': {
        const allDeals = await db.select({
          id: deals.id,
          title: deals.title,
          stage: deals.stage,
          expectedClose: deals.expectedClose,
          staleFlaggedAt: deals.staleFlaggedAt,
          accountName: accounts.name
        })
        .from(deals)
        .leftJoin(accounts, eq(deals.accountId, accounts.id));

        const countsByStage: Record<string, number> = {
          interest_shown: 0,
          rfi_answered: 0,
          rfp_given: 0,
          customer_test: 0,
          contract_negotiation: 0,
          won: 0,
          lost: 0
        };

        const staleDeals = [];

        for (const deal of allDeals) {
          if (countsByStage[deal.stage] !== undefined) {
            countsByStage[deal.stage]++;
          }
          if (deal.staleFlaggedAt) {
            staleDeals.push(deal);
          }
        }

        result = {
          countsByStage,
          staleDeals
        };
        break;
      }

      default:
        sendError(id, -32601, `Tool method not implemented: ${name}`);
        return;
    }

    sendResponse(id, {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }
      ],
      isError: false
    });
  } catch (error: any) {
    console.error(`Error in tool call ${name}:`, error);
    sendResponse(id, {
      content: [
        {
          type: 'text',
          text: `Error executing tool ${name}: ${error.message}`
        }
      ],
      isError: true
    });
  }
}
