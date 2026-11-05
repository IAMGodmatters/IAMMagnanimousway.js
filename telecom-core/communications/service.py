"""Application services for Magnanimous-native messaging."""
from .domain import Conversation, ConversationKind, Message, MessageKind, Receipt
from .ports import ConversationStore, RealtimePublisher


class CommunicationsService:
    def __init__(self, store: ConversationStore, realtime: RealtimePublisher):
        self._store = store
        self._realtime = realtime

    async def create_conversation(self, actor_id: str, member_ids: list[str], kind: ConversationKind, title: str | None = None) -> Conversation:
        members = tuple(dict.fromkeys([actor_id, *member_ids]))
        if kind is ConversationKind.DIRECT and len(members) != 2:
            raise ValueError("direct conversations require exactly two members")
        conversation = Conversation(member_ids=members, kind=kind, title=title)
        return await self._store.create_conversation(conversation)

    async def send_message(self, actor_id: str, conversation_id: str, body: str, kind: MessageKind = MessageKind.TEXT, attachment_url: str | None = None, reply_to_id: str | None = None) -> Message:
        conversation = await self._store.get_conversation(conversation_id)
        if conversation is None:
            raise LookupError("conversation not found")
        if actor_id not in conversation.member_ids:
            raise PermissionError("not a conversation member")
        if kind is MessageKind.TEXT and not body.strip():
            raise ValueError("text message cannot be empty")
        message = Message(conversation_id=conversation_id, sender_id=actor_id, body=body, kind=kind, attachment_url=attachment_url, reply_to_id=reply_to_id)
        saved = await self._store.save_message(message)
        await self._realtime.publish(conversation.member_ids, {"type": "message.created", "conversation_id": conversation_id, "message_id": saved.id})
        return saved

    async def mark_read(self, actor_id: str, conversation_id: str, message_id: str) -> None:
        conversation = await self._store.get_conversation(conversation_id)
        if conversation is None or actor_id not in conversation.member_ids:
            raise PermissionError("not a conversation member")
        await self._store.save_receipt(Receipt(message_id=message_id, user_id=actor_id, state="read"))
        await self._realtime.publish(conversation.member_ids, {"type": "message.read", "conversation_id": conversation_id, "message_id": message_id, "user_id": actor_id})
