-- =============================================
-- FIX CHAT RLS POLICIES (Infinite Recursion)
-- =============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view conversations they participate in" ON conversations;
DROP POLICY IF EXISTS "Users can create conversations in their organization" ON conversations;
DROP POLICY IF EXISTS "Users can view participants of their conversations" ON conversation_participants;
DROP POLICY IF EXISTS "Users can add participants to conversations" ON conversation_participants;
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON messages;
DROP POLICY IF EXISTS "Users can send messages to their conversations" ON messages;

-- =============================================
-- SIMPLE RLS POLICIES (No recursion)
-- =============================================

-- Conversation Participants: Users can view their own participation records
CREATE POLICY "Users can view own participation"
    ON conversation_participants FOR SELECT
    USING (user_id = auth.uid());

-- Conversation Participants: Authenticated users can insert
CREATE POLICY "Authenticated users can add participants"
    ON conversation_participants FOR INSERT
    WITH CHECK (true);

-- Conversations: Users can view conversations where they are participants
-- Using a simpler approach without subquery on same table
CREATE POLICY "Users can view their conversations"
    ON conversations FOR SELECT
    USING (
        id IN (
            SELECT conversation_id
            FROM conversation_participants
            WHERE user_id = auth.uid()
        )
    );

-- Conversations: Authenticated users can create
CREATE POLICY "Authenticated users can create conversations"
    ON conversations FOR INSERT
    WITH CHECK (true);

-- Conversations: Allow update for last_message_at
CREATE POLICY "Participants can update conversations"
    ON conversations FOR UPDATE
    USING (
        id IN (
            SELECT conversation_id
            FROM conversation_participants
            WHERE user_id = auth.uid()
        )
    );

-- Messages: Users can view messages in conversations they participate in
CREATE POLICY "Users can view conversation messages"
    ON messages FOR SELECT
    USING (
        conversation_id IN (
            SELECT conversation_id
            FROM conversation_participants
            WHERE user_id = auth.uid()
        )
    );

-- Messages: Users can send messages to their conversations
CREATE POLICY "Users can send messages"
    ON messages FOR INSERT
    WITH CHECK (
        user_id = auth.uid() AND
        conversation_id IN (
            SELECT conversation_id
            FROM conversation_participants
            WHERE user_id = auth.uid()
        )
    );
