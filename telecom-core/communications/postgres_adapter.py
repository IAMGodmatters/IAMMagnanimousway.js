"""Durable PostgreSQL adapter for Magnanimous Communications."""
import asyncpg
from .domain import Conversation, ConversationKind, Message, MessageKind, Receipt


class PostgresConversationStore:
    def __init__(self, pool: asyncpg.Pool):
        self._pool = pool

    async def create_conversation(self, conversation: Conversation) -> Conversation:
        async with self._pool.acquire() as conn:
            async with conn.transaction():
                await conn.execute('INSERT INTO comm_conversations(id,kind,title,created_at) VALUES($1,$2,$3,$4)', conversation.id, conversation.kind.value, conversation.title, conversation.created_at)
                await conn.executemany('INSERT INTO comm_members(conversation_id,user_id) VALUES($1,$2)', [(conversation.id, uid) for uid in conversation.member_ids])
        return conversation

    async def get_conversation(self, conversation_id: str) -> Conversation | None:
        async with self._pool.acquire() as conn:
            row = await conn.fetchrow('SELECT id,kind,title,created_at FROM comm_conversations WHERE id=$1', conversation_id)
            if row is None:
                return None
            members = await conn.fetch('SELECT user_id FROM comm_members WHERE conversation_id=$1 ORDER BY joined_at,user_id', conversation_id)
        return Conversation(id=str(row['id']), kind=ConversationKind(row['kind']), title=row['title'], created_at=row['created_at'], member_ids=tuple(r['user_id'] for r in members))

    async def save_message(self, message: Message) -> Message:
        await self._pool.execute('INSERT INTO comm_messages(id,conversation_id,sender_id,kind,body,attachment_key,reply_to_id,created_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8)', message.id, message.conversation_id, message.sender_id, message.kind.value, message.body, message.attachment_url, message.reply_to_id, message.created_at)
        return message

    async def list_messages(self, conversation_id: str, limit: int = 50) -> list[Message]:
        rows = await self._pool.fetch('SELECT id,conversation_id,sender_id,kind,body,attachment_key,reply_to_id,created_at FROM comm_messages WHERE conversation_id=$1 AND deleted_at IS NULL ORDER BY created_at DESC LIMIT $2', conversation_id, max(1, min(limit, 200)))
        return [Message(id=str(r['id']), conversation_id=str(r['conversation_id']), sender_id=r['sender_id'], kind=MessageKind(r['kind']), body=r['body'], attachment_url=r['attachment_key'], reply_to_id=str(r['reply_to_id']) if r['reply_to_id'] else None, created_at=r['created_at']) for r in reversed(rows)]

    async def save_receipt(self, receipt: Receipt) -> None:
        await self._pool.execute('INSERT INTO comm_receipts(message_id,user_id,state,at) VALUES($1,$2,$3,$4) ON CONFLICT DO NOTHING', receipt.message_id, receipt.user_id, receipt.state, receipt.at)
