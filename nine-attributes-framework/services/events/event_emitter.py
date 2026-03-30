"""
Event System for Nine Attributes Framework
"""

import json
import time
from typing import Dict, Any
from dataclasses import dataclass, asdict
from datetime import datetime
from uuid import uuid4
import logging

try:
    from aiokafka import AIOKafkaProducer  # type: ignore
except Exception:  # pragma: no cover
    AIOKafkaProducer = None  # type: ignore

logger = logging.getLogger(__name__)


@dataclass
class Event:
    """Base event structure"""
    event_type: str
    timestamp: float
    audit_id: str
    data: Dict[str, Any]
    metadata: Dict[str, Any]


class EventEmitter:
    """Event emitter for Nine Attributes events"""

    def __init__(self, kafka_bootstrap_servers: str = 'localhost:9092'):
        self.producer = None
        self.bootstrap_servers = kafka_bootstrap_servers

    async def start(self):  # pragma: no cover
        if AIOKafkaProducer is None:
            logger.warning("aiokafka not installed; EventEmitter disabled")
            return
        self.producer = AIOKafkaProducer(
            bootstrap_servers=self.bootstrap_servers,
            value_serializer=lambda v: json.dumps(v).encode(),
        )
        await self.producer.start()

    async def stop(self):  # pragma: no cover
        if self.producer:
            await self.producer.stop()

    async def emit(self, event_type: str, data: Dict[str, Any], audit_id: str = None):  # pragma: no cover
        if AIOKafkaProducer is None or self.producer is None:
            logger.info(f"Event (no-op) {event_type}: {data}")
            return
        event = Event(
            event_type=event_type,
            timestamp=time.time(),
            audit_id=audit_id or str(uuid4()),
            data=data,
            metadata={
                "alg_version": "nine-attrs-v1.0",
                "timestamp_iso": datetime.now().isoformat(),
            },
        )
        topic = self._get_topic(event_type)
        await self.producer.send(topic, value=asdict(event))
        logger.info(f"Event emitted: {event_type} - {audit_id}")

    def _get_topic(self, event_type: str) -> str:
        topic_map = {
            "EVT.Content.Analyzed": "content-analysis",
            "EVT.Content.GateDecision": "content-gates",
            "EVT.Rec.ScoreServed": "rec-scores",
            "EVT.Rec.ItemPromoted": "rec-promotions",
            "EVT.Rec.ItemDemoted": "rec-demotions",
            "EVT.Rec.RegretCapped": "rec-regret",
        }
        return topic_map.get(event_type, "nine-attrs-default")


EVENT_SCHEMAS = {
    "EVT.Content.Analyzed": {
        "type": "object",
        "properties": {
            "audit_id": {"type": "string"},
            "total_score": {"type": "number"},
            "attributes": {"type": "array"},
            "violations": {"type": "array"},
            "platform": {"type": "string"},
            "creator_id": {"type": "string"},
        },
        "required": ["audit_id", "total_score", "attributes"],
    },
    "EVT.Content.GateDecision": {
        "type": "object",
        "properties": {
            "audit_id": {"type": "string"},
            "pass_gate": {"type": "boolean"},
            "reasons": {"type": "array"},
            "total_score": {"type": "number"},
        },
        "required": ["audit_id", "pass_gate"],
    },
    "EVT.Rec.ScoreServed": {
        "type": "object",
        "properties": {
            "item_id": {"type": "string"},
            "score": {"type": "number"},
            "prior_watch_time": {"type": "number"},
            "prior_share_prob": {"type": "number"},
            "prior_regret_prob": {"type": "number"},
            "cohort": {"type": "string"},
        },
        "required": ["item_id", "score"],
    },
}


