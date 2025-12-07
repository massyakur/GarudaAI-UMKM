# Content Agent - GarudaAI UMKM

Content Creator Assistant untuk membantu UMKM membuat copywriting dan konten marketing.

## Features

- 🤖 AI-powered content generation
- 💬 Conversation memory dengan SQLite
- 🔄 Thread management per user
- 📝 Generate copywriting deskripsi produk
- 🎬 Generate script konten untuk social media (Instagram, TikTok, YouTube, Facebook)
- 💡 Saran strategi konten
- 🎯 Context-aware (ingat nama bisnis, jenis bisnis, dan nama user)

## File Structure

```
agent/
├── content_agent.py        # Main agent logic
├── prompt.py              # Jinja2 prompt templates
├── threads.db            # SQLite database (auto-created)
├── API_DOCUMENTATION.md  # API endpoint documentation
└── README.md            # This file
```

## Quick Start

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

Required packages:
- langchain
- langchain-openai
- jinja2
- sqlite3 (built-in)

### 2. Configure Environment

Set up your `.env` file:
```env
LLM_MODEL=gpt-4
LLM_BASE_URL=https://api.openai.com/v1
LLM_API_KEY=your-api-key-here
```

### 3. Direct Usage (Python)

```python
from agent.content_agent import chat_with_agent, get_user_conversation_history

# Chat with agent
response = chat_with_agent(
    user_id="user123",
    user_name="Budi",
    business_name="Warung Kopi Budi",
    business_type="Cafe & Coffee Shop",
    message="Buatkan caption Instagram untuk menu kopi baru"
)
print(response)

# Get conversation history
history = get_user_conversation_history("user123", limit=10)
for conv in history:
    print(f"User: {conv['user_input']}")
    print(f"AI: {conv['assistant_output']}\n")
```

### 4. API Usage

Lihat [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) untuk detail lengkap.

**Endpoints:**
- `POST /api/v1/content-agent/chat` - Chat dengan agent
- `GET /api/v1/content-agent/history` - Ambil riwayat percakapan
- `DELETE /api/v1/content-agent/history` - Reset riwayat
- `DELETE /api/v1/content-agent/thread` - Hapus thread

## Available Functions

### Main Functions

#### `chat_with_agent(user_id, user_name, business_name, business_type, message)`
Chat dengan agent dan dapatkan response.

**Parameters:**
- `user_id` (str): Unique identifier untuk user
- `user_name` (str): Nama user
- `business_name` (str): Nama bisnis
- `business_type` (str): Jenis/kategori bisnis
- `message` (str): Pesan dari user

**Returns:** `str` - Response dari agent

**Example:**
```python
response = chat_with_agent(
    user_id="123",
    user_name="Siti",
    business_name="Siti Bakery",
    business_type="Bakery & Pastry",
    message="Buatkan deskripsi untuk roti cokelat"
)
```

### History Functions

#### `get_user_conversation_history(user_id, limit=10)`
Ambil riwayat percakapan user.

**Returns:** `List[dict]` dengan keys: `user_input`, `assistant_output`, `created_at`

#### `get_conversation_history(thread_id, limit=10)`
Ambil riwayat berdasarkan thread_id.

### Management Functions

#### `reset_user_conversation(user_id)`
Reset riwayat percakapan user (thread_id tetap sama).

**Returns:** `int` - Jumlah percakapan yang dihapus

#### `reset_conversation(thread_id)`
Reset riwayat berdasarkan thread_id.

#### `delete_user_thread(user_id)`
Hapus total: riwayat + thread mapping. User akan dapat thread_id baru.

**Returns:** `bool` - True jika berhasil, False jika tidak ditemukan

### Utility Functions

#### `get_or_create_thread(user_id)`
Ambil atau buat thread_id baru untuk user.

**Returns:** `str` - thread_id

## Database Schema

### Table: `user_threads`
Mapping user_id ke thread_id.

| Column | Type | Description |
|--------|------|-------------|
| user_id | TEXT (PK) | Unique user identifier |
| thread_id | TEXT | UUID thread identifier |
| created_at | TIMESTAMP | Waktu pembuatan |
| updated_at | TIMESTAMP | Waktu update terakhir |

### Table: `conversation_history`
Menyimpan riwayat percakapan.

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER (PK) | Auto increment ID |
| thread_id | TEXT (FK) | Reference ke user_threads |
| user_input | TEXT | Input dari user |
| assistant_output | TEXT | Response dari agent |
| created_at | TIMESTAMP | Waktu percakapan |

## Prompt Customization

Edit file `prompt.py` untuk mengubah system prompt agent:

```python
CONTENT_CREATOR_PROMPT = """Kamu adalah Content Creator Assistant...

Gunakan {{ user_name }}, {{ business_name }}, {{ business_type }}
untuk dynamic values.
"""
```

Prompt menggunakan Jinja2 template engine.

## Agent Capabilities

Agent dapat membantu dengan:

1. **Copywriting Deskripsi Produk**
   - Variasi formal, casual, storytelling
   - Fokus pada value proposition
   - Sesuai target market

2. **Script Konten Social Media**
   - Hook, body, call-to-action
   - Platform-specific (IG, TikTok, YouTube, FB)
   - Hashtag recommendations

3. **Strategi Konten**
   - Saran konten sesuai jenis bisnis
   - Tips engagement
   - Content calendar ideas

## Configuration

### Model Settings
Edit di `content_agent.py`:
```python
llm = ChatOpenAI(
    model=settings.LLM_MODEL,
    base_url=settings.LLM_BASE_URL,
    api_key=settings.LLM_API_KEY,
    max_completion_tokens=512,  # Adjust as needed
    temperature=0.5,            # Creativity level
    top_p=0.5                   # Sampling parameter
)
```

### Message Trimming
Agent otomatis trim messages untuk menghemat token:
```python
# Keeps last 3-4 messages
@before_model
def trim_messages(state: AgentState, runtime: Runtime):
    # ... implementation
```

## Examples

### Example 1: Generate Caption Instagram
```python
response = chat_with_agent(
    user_id="user1",
    user_name="Ahmad",
    business_name="Ahmad Clothing",
    business_type="Fashion Retail",
    message="Buatkan caption untuk posting baju lebaran"
)
```

### Example 2: Generate Script TikTok
```python
response = chat_with_agent(
    user_id="user2",
    user_name="Rina",
    business_name="Rina Cake & Bakery",
    business_type="Bakery",
    message="Buatkan script TikTok untuk promosi kue ulang tahun custom"
)
```

### Example 3: Get History and Reset
```python
# Get history
history = get_user_conversation_history("user1", limit=20)
print(f"Total conversations: {len(history)}")

# Reset if needed
deleted = reset_user_conversation("user1")
print(f"Deleted {deleted} conversations")
```

## Troubleshooting

### Import Error: `from prompt import CONTENT_CREATOR_PROMPT`
Pastikan file `prompt.py` ada di folder `agent/`.

### Database Error: `no such table`
Database akan otomatis dibuat saat pertama kali import. Cek file `threads.db` ada di folder `agent/`.

### Context Error: `'Context' object is not subscriptable`
Pastikan mengakses context dengan `.attribute` bukan `['key']`.

## Production Considerations

- [ ] Implement rate limiting
- [ ] Add caching layer (Redis)
- [ ] Monitor token usage
- [ ] Add error retry logic
- [ ] Implement conversation export
- [ ] Add analytics/metrics
- [ ] Secure API keys dengan proper secret management
- [ ] Add conversation moderation
- [ ] Implement conversation archiving

## Support

Untuk pertanyaan atau issue, silakan buat issue di repository.
