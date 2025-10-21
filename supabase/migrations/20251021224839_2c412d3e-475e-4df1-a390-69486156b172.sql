-- Update sdr_tasks to support Kanban workflow
-- Add in_progress status and ensure all transitions work

-- First, update any existing 'todo' tasks that might need the new status
-- (this is safe to run even if no data exists yet)

-- Add check constraint to allow the new status
ALTER TABLE sdr_tasks DROP CONSTRAINT IF EXISTS sdr_tasks_status_check;

-- Recreate with new status
ALTER TABLE sdr_tasks ADD CONSTRAINT sdr_tasks_status_check 
  CHECK (status IN ('todo', 'in_progress', 'done'));

-- Create index for better performance on status queries
CREATE INDEX IF NOT EXISTS idx_sdr_tasks_status ON sdr_tasks(status);
CREATE INDEX IF NOT EXISTS idx_sdr_tasks_due_date ON sdr_tasks(due_date) WHERE status != 'done';

-- Update conversations status to support pipeline stages
ALTER TABLE conversations DROP CONSTRAINT IF EXISTS conversations_status_check;

ALTER TABLE conversations ADD CONSTRAINT conversations_status_check
  CHECK (status IN ('new', 'contacted', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost', 'open', 'pending', 'closed', 'archived'));

-- Create indexes for pipeline queries
CREATE INDEX IF NOT EXISTS idx_conversations_status ON conversations(status);
CREATE INDEX IF NOT EXISTS idx_conversations_company_status ON conversations(company_id, status);
