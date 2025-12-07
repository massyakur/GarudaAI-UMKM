from langchain.agents import create_agent, AgentState
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage
from langchain.agents.middleware import before_model
from langgraph.runtime import Runtime
from langchain_core.runnables import RunnableConfig
from typing import Any
from langchain.messages import RemoveMessage
from langgraph.graph.message import REMOVE_ALL_MESSAGES
from langchain.agents.middleware import dynamic_prompt, ModelRequest
from langchain.tools import tool, ToolRuntime
from langgraph.checkpoint.memory import InMemorySaver
from dataclasses import dataclass
import sqlite3
import uuid
from pathlib import Path
from jinja2 import Template
from agent.prompt import CONTENT_CREATOR_PROMPT

@dataclass
class Context:
    user_id: str
    user_name: str
    business_name: str
    business_type: str

from agent.config.settings import settings

# Setup SQLite database
DB_PATH = Path(__file__).parent / "threads.db"

def init_db():
    """Initialize SQLite database for storing thread_id and user_id"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Table untuk mapping user_id ke thread_id
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS user_threads (
            user_id TEXT PRIMARY KEY,
            thread_id TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # Table untuk menyimpan conversation history
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS conversation_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            thread_id TEXT NOT NULL,
            user_input TEXT NOT NULL,
            assistant_output TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (thread_id) REFERENCES user_threads(thread_id)
        )
    ''')

    # Index untuk query lebih cepat berdasarkan thread_id
    cursor.execute('''
        CREATE INDEX IF NOT EXISTS idx_thread_id
        ON conversation_history(thread_id)
    ''')

    conn.commit()
    conn.close()

def get_or_create_thread(user_id: str) -> str:
    """Get existing thread_id for user or create new one"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Check if user already has a thread
    cursor.execute('SELECT thread_id FROM user_threads WHERE user_id = ?', (user_id,))
    result = cursor.fetchone()

    if result:
        thread_id = result[0]
    else:
        # Create new thread_id
        thread_id = str(uuid.uuid4())
        cursor.execute(
            'INSERT INTO user_threads (user_id, thread_id) VALUES (?, ?)',
            (user_id, thread_id)
        )
        conn.commit()

    conn.close()
    return thread_id


def save_conversation(thread_id: str, user_input: str, assistant_output: str):
    """Save conversation to database"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    cursor.execute('''
        INSERT INTO conversation_history (thread_id, user_input, assistant_output)
        VALUES (?, ?, ?)
    ''', (thread_id, user_input, assistant_output))

    conn.commit()
    conn.close()


def get_conversation_history(thread_id: str, limit: int = 10):
    """Get conversation history for a thread"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    cursor.execute('''
        SELECT user_input, assistant_output, created_at
        FROM conversation_history
        WHERE thread_id = ?
        ORDER BY created_at DESC
        LIMIT ?
    ''', (thread_id, limit))

    results = cursor.fetchall()
    conn.close()

    # Return in chronological order (oldest first)
    return [
        {
            'user_input': row[0],
            'assistant_output': row[1],
            'created_at': row[2]
        }
        for row in reversed(results)
    ]


def get_user_conversation_history(user_id: str, limit: int = 10):
    """Get conversation history for a user by user_id"""
    thread_id = get_or_create_thread(user_id)
    return get_conversation_history(thread_id, limit)


def reset_conversation(thread_id: str):
    """Delete all conversation history for a specific thread_id"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    cursor.execute('''
        DELETE FROM conversation_history
        WHERE thread_id = ?
    ''', (thread_id,))

    deleted_count = cursor.rowcount
    conn.commit()
    conn.close()

    return deleted_count


def reset_user_conversation(user_id: str):
    """Delete all conversation history for a specific user"""
    thread_id = get_or_create_thread(user_id)
    return reset_conversation(thread_id)


def delete_user_thread(user_id: str):
    """Delete user thread and all associated conversation history"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Get thread_id first
    cursor.execute('SELECT thread_id FROM user_threads WHERE user_id = ?', (user_id,))
    result = cursor.fetchone()

    if result:
        thread_id = result[0]

        # Delete all conversations
        cursor.execute('DELETE FROM conversation_history WHERE thread_id = ?', (thread_id,))

        # Delete user_thread mapping
        cursor.execute('DELETE FROM user_threads WHERE user_id = ?', (user_id,))

        conn.commit()
        conn.close()
        return True
    else:
        conn.close()
        return False

# Initialize database on module load
init_db()

llm = ChatOpenAI(
    model=settings.LLM_MODEL,
    base_url=settings.LLM_BASE_URL,
    api_key=settings.LLM_API_KEY,
    max_completion_tokens=512,
    temperature=0.5,
    top_p=0.5
)

@before_model
def trim_messages(state: AgentState, runtime: Runtime) -> dict[str, Any] | None:
    """Keep only the last few messages to fit context window."""
    messages = state["messages"]

    if len(messages) <= 3:
        return None  # No changes needed

    recent_messages = messages[-3:] if len(messages) % 2 == 0 else messages[-4:]

    return {
        "messages": [
            RemoveMessage(id=REMOVE_ALL_MESSAGES),
            *recent_messages
        ]
    }

@dynamic_prompt
def dynamic_system_prompt(request: ModelRequest) -> str:
    context = request.runtime.context
    user_name = context.user_name
    business_name = context.business_name
    business_type = context.business_type

    # Render Jinja2 template with context
    template = Template(CONTENT_CREATOR_PROMPT)
    system_prompt = template.render(
        user_name=user_name,
        business_name=business_name,
        business_type=business_type
    )
    return system_prompt

@tool
def get_user_info(
    runtime: ToolRuntime
) -> str:
    """Look up user info."""
    context = runtime.context
    user_name = context.user_name
    business_name = context.business_name
    business_type = context.business_type
    return f"User: {user_name}, Business: {business_name}, Type: {business_type}"

agent = create_agent(
    model=llm,
    tools=[get_user_info],
    checkpointer=InMemorySaver(),
    middleware=[trim_messages, dynamic_system_prompt]
)

def chat_with_agent(
    user_id: str,
    user_name: str,
    business_name: str,
    business_type: str,
    message: str,
    image_base64: str | None = None,
    image_mime_type: str | None = None
) -> str:
    """
    Main function to chat with the content agent.

    Args:
        user_id: Unique identifier for the user
        user_name: Name of the user
        business_name: Name of the business
        business_type: Type of the business
        message: User's message/question
        image_base64: Optional base64-encoded image data
        image_mime_type: Optional MIME type of the image (e.g., "image/jpeg", "image/png")

    Returns:
        str: Agent's response
    """
    # Get or create thread_id for this user
    thread_id = get_or_create_thread(user_id)

    # Configure agent with thread_id
    config: RunnableConfig = {"configurable": {"thread_id": thread_id}}

    # Create context
    context = Context(
        user_id=user_id,
        user_name=user_name,
        business_name=business_name,
        business_type=business_type
    )

    # Create input content
    content = [{"type": "text", "text": message}]

    # Add image if provided
    if image_base64 and image_mime_type:
        content.append({
            "type": "image",
            "base64": image_base64,
            "mime_type": image_mime_type
        })

    # Create input messages
    input_messages = [HumanMessage(content=content)]

    # Invoke agent
    result = agent.invoke(
        {"messages": input_messages},
        config=config,
        context=context
    )

    # Get the assistant's response
    assistant_output = result["messages"][-1].content

    # Save conversation to database
    save_conversation(thread_id, message, assistant_output)

    # Return the last message content
    return assistant_output