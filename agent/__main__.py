"""Run PianoQuest Live server."""
import uvicorn
uvicorn.run("agent.server:app", host="0.0.0.0", port=8080, reload=True)
