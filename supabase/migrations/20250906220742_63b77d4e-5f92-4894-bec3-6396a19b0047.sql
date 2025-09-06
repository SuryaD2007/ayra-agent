-- Create performance indexes for items table
CREATE INDEX idx_items_user_deleted_created ON items (user_id, deleted_at, created_at DESC);
CREATE INDEX idx_items_user_type ON items (user_id, type);
CREATE INDEX idx_items_user_space ON items (user_id, space_id);

-- Create performance index for tags table
CREATE INDEX idx_tags_user_name ON tags (user_id, name);