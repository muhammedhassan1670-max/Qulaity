// QMS Enterprise 4.0 - Workflow & Approval System Utilities
import { toast } from 'sonner';

// Workflow Status Types
export type WorkflowStatus = 
  | 'draft' 
  | 'submitted' 
  | 'under-review' 
  | 'approved' 
  | 'rejected' 
  | 'implemented' 
  | 'closed' 
  | 'expired';

export type ApprovalAction = 'approve' | 'reject' | 'return' | 'delegate';

// Approval Level Definition
export interface ApprovalLevel {
  level: number;
  name: string;
  role: string;
  required: boolean;
  canDelegate: boolean;
  autoApproveAfter?: number; // hours
  reminderInterval?: number; // hours
}

// Approval History Entry
export interface ApprovalHistoryEntry {
  id: string;
  level: number;
  approver: string;
  role: string;
  action: ApprovalAction;
  comment: string;
  timestamp: string;
  attachments?: string[];
}

// Workflow Template
export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  applicableModules: string[];
  steps: WorkflowStep[];
  approvers: ApprovalLevel[];
  notifications: NotificationRule[];
}

// Workflow Step
export interface WorkflowStep {
  id: string;
  name: string;
  status: WorkflowStatus;
  order: number;
  requiredFields?: string[];
  validations?: ValidationRule[];
  actions: WorkflowAction[];
  nextSteps?: string[];
}

// Workflow Action
export interface WorkflowAction {
  id: string;
  name: string;
  type: 'submit' | 'approve' | 'reject' | 'return' | 'close' | 'reopen';
  label: string;
  icon?: string;
  color?: string;
  requiresComment: boolean;
  requiresAttachment?: boolean;
  availableStatuses: WorkflowStatus[];
  requiredRoles?: string[];
}

// Validation Rule
export interface ValidationRule {
  field: string;
  rule: 'required' | 'min' | 'max' | 'pattern' | 'custom';
  value?: any;
  message: string;
}

// Notification Rule
export interface NotificationRule {
  id: string;
  event: 'status-change' | 'approval-required' | 'overdue' | 'reminder' | 'escalation';
  recipients: ('creator' | 'assigned' | 'approver' | 'manager' | 'admin')[];
  template: string;
  channels: ('email' | 'in-app' | 'sms')[];
  delay?: number; // minutes
}

// Current User Context
export interface UserContext {
  id: string;
  name: string;
  role: string;
  department: string;
  permissions: string[];
  isAdmin: boolean;
}

// Workflow State Manager
export class WorkflowManager {
  private template: WorkflowTemplate;
  private currentStatus: WorkflowStatus;
  private approvalHistory: ApprovalHistoryEntry[];
  private currentLevel: number;

  constructor(
    template: WorkflowTemplate,
    initialStatus: WorkflowStatus = 'draft',
    approvalHistory: ApprovalHistoryEntry[] = []
  ) {
    this.template = template;
    this.currentStatus = initialStatus;
    this.approvalHistory = approvalHistory;
    this.currentLevel = 0;
  }

  // Get current status
  getCurrentStatus(): WorkflowStatus {
    return this.currentStatus;
  }

  // Get current approval level
  getCurrentLevel(): number {
    return this.currentLevel;
  }

  // Get approval history
  getApprovalHistory(): ApprovalHistoryEntry[] {
    return [...this.approvalHistory].sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  // Get next required approver
  getNextApprover(): ApprovalLevel | null {
    if (this.currentLevel >= this.template.approvers.length) {
      return null;
    }
    return this.template.approvers[this.currentLevel];
  }

  // Check if user can perform action
  canPerformAction(user: UserContext, action: WorkflowAction): boolean {
    // Check if current status allows this action
    if (!action.availableStatuses.includes(this.currentStatus)) {
      return false;
    }

    // Check if user has required role
    if (action.requiredRoles && action.requiredRoles.length > 0) {
      if (!action.requiredRoles.includes(user.role) && !user.isAdmin) {
        return false;
      }
    }

    // For approval actions, check if user is the current approver
    if (action.type === 'approve' || action.type === 'reject') {
      const nextApprover = this.getNextApprover();
      if (nextApprover && nextApprover.role !== user.role && !user.isAdmin) {
        return false;
      }
    }

    return true;
  }

  // Get available actions for user
  getAvailableActions(user: UserContext): WorkflowAction[] {
    const allActions = this.template.steps.flatMap(step => step.actions);
    return allActions.filter(action => this.canPerformAction(user, action));
  }

  // Perform workflow action
  async performAction(
    action: WorkflowAction,
    user: UserContext,
    _data?: Record<string, any>,
    comment?: string
  ): Promise<{ success: boolean; newStatus: WorkflowStatus; message: string }> {
    // Validate user can perform action
    if (!this.canPerformAction(user, action)) {
      toast.error('You do not have permission to perform this action');
      return { success: false, newStatus: this.currentStatus, message: 'Permission denied' };
    }

    // Check if comment is required
    if (action.requiresComment && (!comment || comment.trim() === '')) {
      toast.error('Comment is required for this action');
      return { success: false, newStatus: this.currentStatus, message: 'Comment required' };
    }

    // Execute action
    switch (action.type) {
      case 'submit':
        return this.handleSubmit(user, comment);
      case 'approve':
        return this.handleApprove(user, comment);
      case 'reject':
        return this.handleReject(user, comment);
      case 'return':
        return this.handleReturn(user, comment);
      case 'close':
        return this.handleClose(user, comment);
      case 'reopen':
        return this.handleReopen(user, comment);
      default:
        return { success: false, newStatus: this.currentStatus, message: 'Unknown action' };
    }
  }

  private handleSubmit(user: UserContext, comment?: string): { success: boolean; newStatus: WorkflowStatus; message: string } {
    if (this.currentStatus !== 'draft') {
      return { success: false, newStatus: this.currentStatus, message: 'Can only submit from draft status' };
    }

    this.currentStatus = 'submitted';
    this.addToHistory('approve', user, comment || 'Submitted for approval');
    
    toast.success('Form submitted successfully');
    return { success: true, newStatus: this.currentStatus, message: 'Submitted' };
  }

  private handleApprove(user: UserContext, comment?: string): { success: boolean; newStatus: WorkflowStatus; message: string } {
    if (!['submitted', 'under-review'].includes(this.currentStatus)) {
      return { success: false, newStatus: this.currentStatus, message: 'Cannot approve from current status' };
    }

    const nextApprover = this.getNextApprover();
    
    // Add approval entry
    this.addToHistory('approve', user, comment || 'Approved');

    // Check if there are more approval levels
    if (nextApprover && this.currentLevel < this.template.approvers.length - 1) {
      this.currentLevel++;
      this.currentStatus = 'under-review';
      toast.success(`Approved and forwarded to next level: ${this.getNextApprover()?.name}`);
      return { success: true, newStatus: this.currentStatus, message: 'Forwarded to next approver' };
    }

    // Final approval
    this.currentStatus = 'approved';
    toast.success('Final approval completed');
    return { success: true, newStatus: this.currentStatus, message: 'Final approval completed' };
  }

  private handleReject(user: UserContext, comment?: string): { success: boolean; newStatus: WorkflowStatus; message: string } {
    if (!['submitted', 'under-review', 'approved'].includes(this.currentStatus)) {
      return { success: false, newStatus: this.currentStatus, message: 'Cannot reject from current status' };
    }

    this.addToHistory('reject', user, comment || 'Rejected');
    this.currentStatus = 'rejected';
    
    toast.error('Form rejected');
    return { success: true, newStatus: this.currentStatus, message: 'Rejected' };
  }

  private handleReturn(user: UserContext, comment?: string): { success: boolean; newStatus: WorkflowStatus; message: string } {
    if (!['submitted', 'under-review'].includes(this.currentStatus)) {
      return { success: false, newStatus: this.currentStatus, message: 'Cannot return from current status' };
    }

    this.addToHistory('return', user, comment || 'Returned for correction');
    this.currentStatus = 'draft';
    this.currentLevel = 0;
    
    toast.warning('Form returned to draft status');
    return { success: true, newStatus: this.currentStatus, message: 'Returned to draft' };
  }

  private handleClose(user: UserContext, comment?: string): { success: boolean; newStatus: WorkflowStatus; message: string } {
    if (!['approved', 'implemented'].includes(this.currentStatus)) {
      return { success: false, newStatus: this.currentStatus, message: 'Cannot close from current status' };
    }

    this.addToHistory('approve', user, comment || 'Closed');
    this.currentStatus = 'closed';
    
    toast.success('Form closed successfully');
    return { success: true, newStatus: this.currentStatus, message: 'Closed' };
  }

  private handleReopen(user: UserContext, comment?: string): { success: boolean; newStatus: WorkflowStatus; message: string } {
    if (!['closed', 'rejected', 'expired'].includes(this.currentStatus)) {
      return { success: false, newStatus: this.currentStatus, message: 'Cannot reopen from current status' };
    }

    this.addToHistory('approve', user, comment || 'Reopened');
    this.currentStatus = 'draft';
    this.currentLevel = 0;
    
    toast.success('Form reopened');
    return { success: true, newStatus: this.currentStatus, message: 'Reopened' };
  }

  private addToHistory(action: ApprovalAction, user: UserContext, comment: string) {
    const entry: ApprovalHistoryEntry = {
      id: `hist-${Date.now()}`,
      level: this.currentLevel,
      approver: user.name,
      role: user.role,
      action,
      comment,
      timestamp: new Date().toISOString()
    };
    this.approvalHistory.push(entry);
  }

  // Get workflow progress percentage
  getProgress(): number {
    const totalSteps = this.template.approvers.length + 1; // +1 for draft to submitted
    const currentStep = this.currentLevel + (this.currentStatus === 'submitted' ? 1 : 0);
    return Math.round((currentStep / totalSteps) * 100);
  }

  // Check if workflow is complete
  isComplete(): boolean {
    return ['closed', 'rejected', 'expired'].includes(this.currentStatus);
  }

  // Check if waiting for approval
  isWaitingForApproval(): boolean {
    return ['submitted', 'under-review'].includes(this.currentStatus);
  }

  // Get current step info
  getCurrentStepInfo(): { name: string; description: string } | null {
    const currentStep = this.template.steps.find(s => s.status === this.currentStatus);
    if (!currentStep) return null;
    return {
      name: currentStep.name,
      description: this.template.description
    };
  }
}

// Predefined workflow templates
export const defaultWorkflowTemplates: WorkflowTemplate[] = [
  {
    id: 'ncr-workflow',
    name: 'NCR Approval Workflow',
    description: 'Standard workflow for Non-Conformance Reports',
    applicableModules: ['ncr'],
    steps: [
      {
        id: 'draft',
        name: 'Draft',
        status: 'draft',
        order: 1,
        actions: [
          { id: 'submit', name: 'Submit', type: 'submit', label: 'Submit NCR', color: 'blue', requiresComment: false, availableStatuses: ['draft'] }
        ]
      },
      {
        id: 'review',
        name: 'Under Review',
        status: 'under-review',
        order: 2,
        actions: [
          { id: 'approve', name: 'Approve', type: 'approve', label: 'Approve', color: 'green', requiresComment: true, availableStatuses: ['under-review', 'submitted'] },
          { id: 'reject', name: 'Reject', type: 'reject', label: 'Reject', color: 'red', requiresComment: true, availableStatuses: ['under-review', 'submitted'] },
          { id: 'return', name: 'Return', type: 'return', label: 'Return to Draft', color: 'yellow', requiresComment: true, availableStatuses: ['under-review', 'submitted'] }
        ]
      },
      {
        id: 'closed',
        name: 'Closed',
        status: 'closed',
        order: 3,
        actions: [
          { id: 'reopen', name: 'Reopen', type: 'reopen', label: 'Reopen NCR', color: 'gray', requiresComment: true, availableStatuses: ['closed'] }
        ]
      }
    ],
    approvers: [
      { level: 1, name: 'Quality Manager Review', role: 'quality-manager', required: true, canDelegate: true },
      { level: 2, name: 'Department Manager Approval', role: 'department-manager', required: true, canDelegate: false }
    ],
    notifications: [
      { id: 'submit', event: 'status-change', recipients: ['assigned', 'manager'], template: 'ncr-submitted', channels: ['email', 'in-app'] },
      { id: 'approve', event: 'status-change', recipients: ['creator', 'assigned'], template: 'ncr-approved', channels: ['email', 'in-app'] },
      { id: 'reminder', event: 'reminder', recipients: ['approver'], template: 'approval-reminder', channels: ['email'], delay: 1440 }
    ]
  },
  {
    id: 'change-control-workflow',
    name: 'Change Control Workflow',
    description: 'Multi-level approval for change requests',
    applicableModules: ['change-control'],
    steps: [
      {
        id: 'draft',
        name: 'Draft',
        status: 'draft',
        order: 1,
        actions: [
          { id: 'submit', name: 'Submit', type: 'submit', label: 'Submit Change Request', color: 'blue', requiresComment: false, availableStatuses: ['draft'] }
        ]
      },
      {
        id: 'review',
        name: 'Under Review',
        status: 'under-review',
        order: 2,
        actions: [
          { id: 'approve', name: 'Approve', type: 'approve', label: 'Approve', color: 'green', requiresComment: true, availableStatuses: ['under-review', 'submitted'] },
          { id: 'reject', name: 'Reject', type: 'reject', label: 'Reject', color: 'red', requiresComment: true, availableStatuses: ['under-review', 'submitted'] },
          { id: 'return', name: 'Return', type: 'return', label: 'Return', color: 'yellow', requiresComment: true, availableStatuses: ['under-review', 'submitted'] }
        ]
      },
      {
        id: 'approved',
        name: 'Approved',
        status: 'approved',
        order: 3,
        actions: [
          { id: 'implement', name: 'Implement', type: 'submit', label: 'Mark Implemented', color: 'blue', requiresComment: false, availableStatuses: ['approved'] },
          { id: 'reopen', name: 'Reopen', type: 'reopen', label: 'Reopen', color: 'gray', requiresComment: true, availableStatuses: ['approved'] }
        ]
      },
      {
        id: 'closed',
        name: 'Closed',
        status: 'closed',
        order: 4,
        actions: [
          { id: 'reopen', name: 'Reopen', type: 'reopen', label: 'Reopen Change', color: 'gray', requiresComment: true, availableStatuses: ['closed'] }
        ]
      }
    ],
    approvers: [
      { level: 1, name: 'Quality Manager Review', role: 'quality-manager', required: true, canDelegate: true },
      { level: 2, name: 'Department Manager Approval', role: 'department-manager', required: true, canDelegate: true },
      { level: 3, name: 'Plant Manager Final Approval', role: 'plant-manager', required: true, canDelegate: false }
    ],
    notifications: [
      { id: 'submit', event: 'status-change', recipients: ['assigned', 'manager'], template: 'change-submitted', channels: ['email', 'in-app'] },
      { id: 'approval-required', event: 'approval-required', recipients: ['approver'], template: 'approval-required', channels: ['email', 'in-app'] },
      { id: 'escalation', event: 'escalation', recipients: ['manager', 'admin'], template: 'escalation', channels: ['email'], delay: 2880 }
    ]
  }
];

// Hook for using workflow
export function useWorkflow(
  templateId: string,
  initialStatus: WorkflowStatus = 'draft',
  initialHistory: ApprovalHistoryEntry[] = []
): {
  manager: WorkflowManager | null;
  loading: boolean;
  error: string | null;
} {
  const template = defaultWorkflowTemplates.find(t => t.id === templateId);
  
  if (!template) {
    return { manager: null, loading: false, error: `Workflow template '${templateId}' not found` };
  }

  const manager = new WorkflowManager(template, initialStatus, initialHistory);
  return { manager, loading: false, error: null };
}

// Utility functions
export function getStatusColor(status: WorkflowStatus): string {
  const colors: Record<WorkflowStatus, string> = {
    'draft': '#6B7280',
    'submitted': '#3B82F6',
    'under-review': '#F59E0B',
    'approved': '#8B5CF6',
    'rejected': '#DC2626',
    'implemented': '#10B981',
    'closed': '#14B8A6',
    'expired': '#EF4444'
  };
  return colors[status] || '#6B7280';
}

export function getStatusLabel(status: WorkflowStatus): string {
  const labels: Record<WorkflowStatus, string> = {
    'draft': 'Draft',
    'submitted': 'Submitted',
    'under-review': 'Under Review',
    'approved': 'Approved',
    'rejected': 'Rejected',
    'implemented': 'Implemented',
    'closed': 'Closed',
    'expired': 'Expired'
  };
  return labels[status] || status;
}

export function formatApprovalHistory(history: ApprovalHistoryEntry[]): string {
  return history.map(entry => 
    `${entry.timestamp}: ${entry.approver} (${entry.role}) - ${entry.action.toUpperCase()} - ${entry.comment}`
  ).join('\n');
}

export default WorkflowManager;
