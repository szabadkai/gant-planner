# Jira Integration Plan

## Overview

This document outlines the implementation plan for integrating Jira with the Gantt Chart Queue Planner. The integration will allow users to sync tasks between Jira and the planning tool, maintaining the app's unique sequential scheduling workflow while adding enterprise-grade project management capabilities.

## Implementation Phases

### Phase 1: Foundation & Authentication (2-3 weeks)

#### 1.1 Library Setup
- **Install Dependencies**
  ```bash
  npm install jira.js
  npm install @types/node-cron node-cron  # For scheduled syncs
  ```

#### 1.2 Environment Configuration
- Add Jira-related environment variables:
  ```bash
  JIRA_WEBHOOK_SECRET=your-webhook-secret
  ENABLE_JIRA_INTEGRATION=true
  ```

#### 1.3 Database Schema Changes
```sql
-- Add Jira integration configuration per user
CREATE TABLE JiraIntegration (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL REFERENCES User(id) ON DELETE CASCADE,
  jiraDomain TEXT NOT NULL,  -- e.g., "company.atlassian.net"
  jiraEmail TEXT NOT NULL,
  jiraApiToken TEXT NOT NULL,  -- Encrypted
  defaultProjectKey TEXT,  -- Default Jira project for new tasks
  isActive BOOLEAN DEFAULT true,
  lastSyncAt DATETIME,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(userId)
);

-- Add Jira-specific fields to Task table
ALTER TABLE Task ADD COLUMN jiraIssueKey TEXT;  -- e.g., "PROJ-123"
ALTER TABLE Task ADD COLUMN jiraIssueId TEXT;   -- Jira's internal ID
ALTER TABLE Task ADD COLUMN lastSyncedAt DATETIME;
ALTER TABLE Task ADD COLUMN syncDirection TEXT CHECK (syncDirection IN ('import', 'export', 'bidirectional')) DEFAULT 'bidirectional';

-- Track sync operations and errors
CREATE TABLE SyncLog (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL REFERENCES User(id) ON DELETE CASCADE,
  projectId TEXT REFERENCES Project(id) ON DELETE CASCADE,
  operation TEXT NOT NULL,  -- 'import', 'export', 'webhook'
  status TEXT NOT NULL CHECK (status IN ('success', 'error', 'partial')),
  itemsProcessed INTEGER DEFAULT 0,
  errorMessage TEXT,
  metadata TEXT,  -- JSON for additional details
  startedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  completedAt DATETIME
);

-- Index for performance
CREATE INDEX idx_task_jira_issue_key ON Task(jiraIssueKey);
CREATE INDEX idx_task_jira_issue_id ON Task(jiraIssueId);
CREATE INDEX idx_sync_log_user_date ON SyncLog(userId, startedAt);
```

#### 1.4 Jira Service Module
Create `apps/api/src/services/jira.ts`:
```typescript
import { Version3Client } from 'jira.js';
import { PrismaClient } from '@prisma/client';

interface JiraConfig {
  domain: string;
  email: string;
  apiToken: string;
}

export class JiraService {
  private client: Version3Client;
  private prisma: PrismaClient;

  constructor(config: JiraConfig, prisma: PrismaClient) {
    this.client = new Version3Client({
      host: `https://${config.domain}`,
      authentication: {
        basic: {
          email: config.email,
          apiToken: config.apiToken,
        },
      },
    });
    this.prisma = prisma;
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.client.myself.getCurrentUser();
      return true;
    } catch {
      return false;
    }
  }

  async getProjects() {
    return await this.client.projects.getAllProjects();
  }

  async getIssue(issueKey: string) {
    return await this.client.issues.getIssue({
      issueIdOrKey: issueKey,
      fields: ['summary', 'description', 'status', 'assignee', 'customfield_10016'], // Story points
    });
  }

  async createIssue(projectKey: string, taskData: any) {
    return await this.client.issues.createIssue({
      fields: {
        project: { key: projectKey },
        summary: taskData.name,
        description: taskData.description || '',
        issuetype: { name: 'Task' },
        // Add custom field mapping as needed
      },
    });
  }

  async updateIssue(issueKey: string, updates: any) {
    return await this.client.issues.editIssue({
      issueIdOrKey: issueKey,
      fields: updates,
    });
  }
}
```

### Phase 2: Core Sync Functionality (3-4 weeks)

#### 2.1 API Endpoints

```typescript
// Jira Configuration Management
app.post("/api/jira/configure", { preHandler: requireAuth }, async (req: any, reply) => {
  const body = z.object({
    jiraDomain: z.string().min(1),
    jiraEmail: z.string().email(),
    jiraApiToken: z.string().min(1),
    defaultProjectKey: z.string().optional(),
  }).parse(req.body);

  // Test connection before saving
  const jiraService = new JiraService(body, prisma);
  const isValid = await jiraService.testConnection();
  
  if (!isValid) {
    return reply.badRequest("Invalid Jira credentials");
  }

  // Encrypt API token before storing
  const encryptedToken = encrypt(body.jiraApiToken);
  
  await prisma.jiraIntegration.upsert({
    where: { userId: req.userId },
    create: {
      userId: req.userId,
      jiraDomain: body.jiraDomain,
      jiraEmail: body.jiraEmail,
      jiraApiToken: encryptedToken,
      defaultProjectKey: body.defaultProjectKey,
    },
    update: {
      jiraDomain: body.jiraDomain,
      jiraEmail: body.jiraEmail,
      jiraApiToken: encryptedToken,
      defaultProjectKey: body.defaultProjectKey,
      updatedAt: new Date(),
    },
  });

  return { success: true };
});

// Get Jira Projects
app.get("/api/jira/projects", { preHandler: requireAuth }, async (req: any, reply) => {
  const integration = await getJiraIntegration(req.userId);
  if (!integration) {
    return reply.badRequest("Jira not configured");
  }

  const jiraService = await createJiraService(integration);
  const projects = await jiraService.getProjects();
  
  return projects.map(p => ({
    key: p.key,
    name: p.name,
    projectTypeKey: p.projectTypeKey,
  }));
});

// Manual Sync Operations
app.post("/api/jira/sync", { preHandler: requireAuth }, async (req: any, reply) => {
  const body = z.object({
    operation: z.enum(['import', 'export']),
    projectKey: z.string().optional(),
    taskIds: z.array(z.string()).optional(),
  }).parse(req.body);

  const syncLog = await prisma.syncLog.create({
    data: {
      userId: req.userId,
      operation: body.operation,
      status: 'processing',
    },
  });

  // Queue background sync operation
  await queueSyncOperation(req.userId, body, syncLog.id);

  return { syncId: syncLog.id, status: 'started' };
});

// Sync Status
app.get("/api/jira/sync/:syncId", { preHandler: requireAuth }, async (req: any, reply) => {
  const { syncId } = req.params;
  
  const syncLog = await prisma.syncLog.findFirst({
    where: { id: syncId, userId: req.userId },
  });

  if (!syncLog) {
    return reply.notFound("Sync operation not found");
  }

  return syncLog;
});
```

#### 2.2 Sync Implementation

```typescript
export async function importFromJira(userId: string, projectKey?: string) {
  const integration = await getJiraIntegration(userId);
  const currentProject = await getCurrentProject(userId);
  
  if (!integration || !currentProject) {
    throw new Error("Integration or project not found");
  }

  const jiraService = await createJiraService(integration);
  
  // Get issues from Jira project
  const jql = projectKey ? `project = ${projectKey}` : `project = ${integration.defaultProjectKey}`;
  const issues = await jiraService.searchIssues(jql);

  let processed = 0;
  
  for (const issue of issues.issues) {
    // Check if task already exists
    const existingTask = await prisma.task.findFirst({
      where: { 
        jiraIssueKey: issue.key,
        userId,
        projectId: currentProject.id,
      },
    });

    if (existingTask) {
      // Update existing task
      await prisma.task.update({
        where: { id: existingTask.id },
        data: {
          name: issue.fields.summary,
          mandays: extractStoryPoints(issue) || 1,
          lastSyncedAt: new Date(),
        },
      });
    } else {
      // Create new task
      await createTaskFromJiraIssue(issue, userId, currentProject.id);
    }
    
    processed++;
  }

  return { processed, total: issues.total };
}

async function createTaskFromJiraIssue(issue: any, userId: string, projectId: string) {
  const storyPoints = extractStoryPoints(issue);
  
  return await prisma.$transaction(async (tx) => {
    const task = await tx.task.create({
      data: {
        name: issue.fields.summary,
        mandays: storyPoints || 1,
        jiraIssueKey: issue.key,
        jiraIssueId: issue.id,
        jiraUrl: `https://${integration.jiraDomain}/browse/${issue.key}`,
        lastSyncedAt: new Date(),
        userId,
        projectId,
      },
    });

    // Add to backlog
    const pos = nextPosition(await maxPosition(null));
    await tx.assignment.create({
      data: {
        taskId: task.id,
        staffId: null,
        position: new Prisma.Decimal(pos),
      },
    });

    return task;
  });
}

function extractStoryPoints(issue: any): number | null {
  // Jira story points are often in customfield_10016 or similar
  return issue.fields.customfield_10016 || null;
}
```

### Phase 3: Real-time Sync & Webhooks (2-3 weeks)

#### 3.1 Webhook Handler
```typescript
app.post("/api/jira/webhook", async (req, reply) => {
  // Verify webhook signature
  const signature = req.headers['x-atlassian-webhook-identifier'];
  if (!verifyWebhookSignature(req.body, signature)) {
    return reply.status(401).send({ error: "Invalid signature" });
  }

  const webhook = req.body;
  
  // Handle different webhook events
  switch (webhook.webhookEvent) {
    case 'jira:issue_created':
    case 'jira:issue_updated':
      await handleIssueChange(webhook);
      break;
    case 'jira:issue_deleted':
      await handleIssueDeleted(webhook);
      break;
  }

  return { received: true };
});

async function handleIssueChange(webhook: any) {
  const issueKey = webhook.issue.key;
  
  // Find tasks linked to this Jira issue
  const tasks = await prisma.task.findMany({
    where: { jiraIssueKey: issueKey },
    include: { user: { include: { jiraIntegration: true } } },
  });

  for (const task of tasks) {
    if (!task.user.jiraIntegration?.isActive) continue;

    // Update task with latest Jira data
    await prisma.task.update({
      where: { id: task.id },
      data: {
        name: webhook.issue.fields.summary,
        mandays: extractStoryPoints(webhook.issue) || task.mandays,
        lastSyncedAt: new Date(),
      },
    });
  }
}
```

#### 3.2 Bidirectional Sync
```typescript
// Hook into existing task update endpoint
app.patch("/api/tasks/:id", { preHandler: requireAuth }, async (req: any, reply) => {
  // ... existing validation ...

  const updated = await prisma.task.update({ where: { id }, data: body });

  // Sync to Jira if task has Jira link
  if (updated.jiraIssueKey) {
    await syncTaskToJira(updated, req.userId);
  }

  return updated;
});

async function syncTaskToJira(task: any, userId: string) {
  const integration = await getJiraIntegration(userId);
  if (!integration?.isActive) return;

  const jiraService = await createJiraService(integration);
  
  try {
    await jiraService.updateIssue(task.jiraIssueKey, {
      summary: task.name,
      // Map other fields as needed
    });

    await prisma.task.update({
      where: { id: task.id },
      data: { lastSyncedAt: new Date() },
    });
  } catch (error) {
    // Log sync error
    await prisma.syncLog.create({
      data: {
        userId,
        operation: 'export',
        status: 'error',
        errorMessage: error.message,
        metadata: JSON.stringify({ taskId: task.id, jiraIssueKey: task.jiraIssueKey }),
      },
    });
  }
}
```

### Phase 4: User Interface Integration (2-3 weeks)

#### 4.1 Jira Configuration Component
```typescript
// apps/web/src/components/JiraSettings.tsx
export function JiraSettings() {
  const [config, setConfig] = useState({
    jiraDomain: '',
    jiraEmail: '',
    jiraApiToken: '',
    defaultProjectKey: '',
  });

  const handleSave = async () => {
    const response = await fetch('/api/jira/configure', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-ID': getCurrentUserId(),
      },
      body: JSON.stringify(config),
    });

    if (response.ok) {
      toast.success('Jira integration configured successfully');
    } else {
      toast.error('Failed to configure Jira integration');
    }
  };

  return (
    <div className="jira-settings">
      <h3>Jira Integration</h3>
      <form onSubmit={handleSave}>
        <input
          placeholder="company.atlassian.net"
          value={config.jiraDomain}
          onChange={(e) => setConfig(prev => ({ ...prev, jiraDomain: e.target.value }))}
        />
        <input
          type="email"
          placeholder="your@email.com"
          value={config.jiraEmail}
          onChange={(e) => setConfig(prev => ({ ...prev, jiraEmail: e.target.value }))}
        />
        <input
          type="password"
          placeholder="Jira API Token"
          value={config.jiraApiToken}
          onChange={(e) => setConfig(prev => ({ ...prev, jiraApiToken: e.target.value }))}
        />
        <button type="submit">Save Configuration</button>
      </form>
    </div>
  );
}
```

#### 4.2 Enhanced Task Card with Jira Link
```typescript
// Update TaskCard.tsx to show Jira integration
export function TaskCard({ task, onEdit, onDelete }: TaskCardProps) {
  return (
    <div className="task-card">
      <div className="task-header">
        <span className="task-name">{task.name}</span>
        {task.jiraIssueKey && (
          <a 
            href={task.jiraUrl} 
            target="_blank" 
            className="jira-link"
            title="View in Jira"
          >
            {task.jiraIssueKey}
          </a>
        )}
      </div>
      <div className="task-details">
        <span>{task.mandays} days</span>
        {task.lastSyncedAt && (
          <span className="sync-indicator" title="Synced with Jira">
            🔄 {formatDate(task.lastSyncedAt)}
          </span>
        )}
      </div>
      {/* ... existing buttons ... */}
    </div>
  );
}
```

#### 4.3 Sync Controls
```typescript
// Add sync controls to main interface
export function SyncControls() {
  const [syncing, setSyncing] = useState(false);
  
  const handleSync = async (operation: 'import' | 'export') => {
    setSyncing(true);
    try {
      const response = await fetch('/api/jira/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-ID': getCurrentUserId(),
        },
        body: JSON.stringify({ operation }),
      });
      
      if (response.ok) {
        toast.success(`${operation} operation started`);
      }
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="sync-controls">
      <button 
        onClick={() => handleSync('import')} 
        disabled={syncing}
      >
        Import from Jira
      </button>
      <button 
        onClick={() => handleSync('export')} 
        disabled={syncing}
      >
        Export to Jira
      </button>
    </div>
  );
}
```

## Technical Considerations

### Security
- **API Token Encryption**: Store Jira API tokens encrypted in database
- **Webhook Verification**: Verify webhook signatures to prevent unauthorized access
- **Rate Limiting**: Implement rate limiting for Jira API calls
- **User Permissions**: Ensure users can only sync their own projects

### Performance
- **Background Processing**: Use job queues for large sync operations
- **Incremental Sync**: Only sync changed items using Jira's updated date filters
- **Caching**: Cache Jira project metadata to reduce API calls
- **Batching**: Process multiple issues in batches to optimize API usage

### Error Handling
- **Retry Logic**: Implement exponential backoff for failed API calls
- **Partial Sync Recovery**: Handle cases where sync partially fails
- **User Notifications**: Inform users of sync errors with actionable messages
- **Logging**: Comprehensive logging for debugging sync issues

### Data Consistency
- **Conflict Resolution**: Handle cases where both systems have updates
- **Timestamp Tracking**: Use lastSyncedAt to determine which system has newer data
- **Backup Strategy**: Maintain sync logs for debugging and recovery

## Integration Benefits

### For Users
- **Seamless Workflow**: Continue using Jira for issue tracking while leveraging specialized scheduling
- **Reduced Duplication**: Eliminate manual copying of tasks between systems
- **Real-time Updates**: Stay synchronized with team changes in Jira
- **Enhanced Planning**: Use your app's unique sequential scheduling with Jira's project management

### For Your App
- **Enterprise Appeal**: Jira integration makes the app suitable for larger organizations
- **Competitive Advantage**: Unique combination of Jira integration + sequential scheduling
- **User Retention**: Reduces friction for teams already using Jira
- **Market Expansion**: Opens doors to Jira-using organizations

## Migration Strategy

### Existing Users
- **Optional Feature**: Make Jira integration completely optional
- **Gradual Rollout**: Beta test with select users first
- **Data Preservation**: Ensure existing tasks and workflows remain unchanged
- **Training Materials**: Provide documentation and tutorials

### New Users
- **Onboarding Flow**: Include Jira setup in new user onboarding
- **Demo Data**: Provide sample Jira integration for evaluation
- **Quick Start**: Pre-configured templates for common Jira workflows

## Future Enhancements

### Advanced Features
- **Multi-Project Sync**: Sync across multiple Jira projects
- **Custom Field Mapping**: Allow users to map custom Jira fields
- **Conditional Sync**: Rules for what gets synced based on criteria
- **Bulk Operations**: Bulk import/export with filtering options

### Other Integrations
- **GitHub Issues**: Similar integration pattern for development teams
- **Azure DevOps**: Enterprise development workflow integration
- **Linear**: Modern product development team integration
- **Slack/Teams**: Notification integration for sync events

## Success Metrics

### Technical Metrics
- **Sync Success Rate**: >95% successful sync operations
- **API Response Time**: <2s average for Jira API calls
- **Error Recovery**: <1% unrecoverable sync failures
- **Uptime**: >99.5% availability for webhook endpoints

### User Metrics
- **Adoption Rate**: % of users who enable Jira integration
- **Usage Frequency**: Average syncs per user per week
- **User Satisfaction**: Net Promoter Score for integration feature
- **Support Tickets**: <2% of users reporting integration issues

## Timeline Summary

| Phase | Duration | Key Deliverables |
|-------|----------|------------------|
| Phase 1 | 2-3 weeks | Authentication, basic API setup |
| Phase 2 | 3-4 weeks | Core sync functionality |
| Phase 3 | 2-3 weeks | Real-time webhooks |
| Phase 4 | 2-3 weeks | User interface integration |
| **Total** | **9-13 weeks** | **Complete Jira Integration** |

## Conclusion

This Jira integration will significantly enhance your app's value proposition by combining Jira's robust issue tracking with your unique sequential scheduling capabilities. The phased approach ensures steady progress while maintaining system stability and user experience quality.

The integration positions your app as a specialized bridge between project planning (Jira) and execution scheduling (your sequential workflow), creating a unique market position that larger competitors would find difficult to replicate.