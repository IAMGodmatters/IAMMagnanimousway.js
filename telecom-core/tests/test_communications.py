import pytest

from communications.domain import ConversationKind
from communications.memory_adapter import InMemoryConversationStore, InMemoryRealtimePublisher
from communications.service import CommunicationsService


@pytest.mark.asyncio
async def test_direct_message_and_read_receipt():
    store = InMemoryConversationStore()
    realtime = InMemoryRealtimePublisher()
    service = CommunicationsService(store, realtime)
    conversation = await service.create_conversation("alice", ["bob"], ConversationKind.DIRECT)
    message = await service.send_message("alice", conversation.id, "hello")
    await service.mark_read("bob", conversation.id, message.id)
    assert (await store.list_messages(conversation.id))[0].body == "hello"
    assert store.receipts[0].state == "read"
    assert realtime.events[0][1]["type"] == "message.created"


@pytest.mark.asyncio
async def test_non_member_cannot_send():
    store = InMemoryConversationStore()
    realtime = InMemoryRealtimePublisher()
    service = CommunicationsService(store, realtime)
    conversation = await service.create_conversation("alice", ["bob"], ConversationKind.DIRECT)
    with pytest.raises(PermissionError):
        await service.send_message("mallory", conversation.id, "nope")
