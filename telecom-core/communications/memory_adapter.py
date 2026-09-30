"""Development adapter. Production composition should inject durable storage and realtime infrastructure."""
from .domain import Conversation, Message, Receipt


class InMemoryConversationStore:
    def __init__(self):
        self.conversations: dict[str, Conversation] = {}
        self.messages: dict[str, list[Message]] = {}
        self.receipts: list[Receipt] = []

    async def create_conversation(self, conversation: Conversation) -> Conversation:
        self.conversations[conversation.id] = conversation
        self.messages[conversation.id] = []
        return conversation

    async def get_conversation(self, conversation_id: str) -> Conversation | None:
        return self.conversations.get(conversation_id)

    async def save_message(self, message: Message) -> Message:
        self.messages.setdefault(message.conversation_id, []).append(message)
        return message

    async def list_messages(self, conversation_id: str, limit: int = 50) -> list[Message]:
        return self.messages.get(conversation_id, [])[-limit:]

    async def save_receipt(self, receipt: Receipt) -> None:
        self.receipts.append(receipt)


class InMemoryRealtimePublisher:
    def __init__(self):
        self.events: list[tuple[tuple[str, ...], dict]] = []

    async def publish(self, user_ids: tuple[str, ...], event: dict) -> None:
        self.events.append((user_ids, event))
