from dotenv import load_dotenv

from livekit import agents
from livekit.agents import AgentSession, Agent, RoomInputOptions

# Simplified imports - only load what's available
try:
    from livekit.plugins import openai, cartesia, deepgram, silero
    from livekit.plugins.turn_detector.multilingual import MultilingualModel
    PLUGINS_AVAILABLE = True
except ImportError:
    print("Some plugins not available - running in simplified mode")
    PLUGINS_AVAILABLE = False

load_dotenv()


class Assistant(Agent):
    def __init__(self) -> None:
        super().__init__(instructions="You are a helpful voice AI assistant.")


async def entrypoint(ctx: agents.JobContext):
    if not PLUGINS_AVAILABLE:
        print("Running in simplified mode - plugins not available")
        return
        
    session = AgentSession(
        stt=deepgram.STT(model="nova-3", language="multi"),
        llm=openai.LLM(model="gpt-4o-mini"),
        tts=cartesia.TTS(model="sonic-2", voice="f786b574-daa5-4673-aa0c-cbe3e8534c02"),
        vad=silero.VAD.load(),
        turn_detection=MultilingualModel(),
    )

    await session.start(
        room=ctx.room,
        agent=Assistant(),
        room_input_options=RoomInputOptions(
            # LiveKit Cloud enhanced noise cancellation disabled
            # - noise_cancellation package not available
        ),
    )

    await session.generate_reply(
        instructions="Greet the user and offer your assistance."
    )


if __name__ == "__main__":
    agents.cli.run_app(agents.WorkerOptions(entrypoint_fnc=entrypoint))