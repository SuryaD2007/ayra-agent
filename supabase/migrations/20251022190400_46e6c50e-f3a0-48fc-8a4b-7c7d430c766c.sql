-- Add submission_status column to canvas_items
ALTER TABLE canvas_items 
ADD COLUMN submission_status text DEFAULT 'not_submitted' CHECK (submission_status IN ('not_submitted', 'submitted', 'graded'));

-- Add submitted_at timestamp
ALTER TABLE canvas_items
ADD COLUMN submitted_at timestamp with time zone;

-- Create index for faster filtering
CREATE INDEX idx_canvas_items_submission_status ON canvas_items(submission_status);
CREATE INDEX idx_canvas_items_submitted_at ON canvas_items(submitted_at);