# Content Agent API Documentation

API untuk Content Creator Assistant yang dapat membantu UMKM membuat copywriting dan konten marketing.

## Base URL
```
http://localhost:8000/api/v1/content-agent
```

## Authentication
Semua endpoint memerlukan Bearer Token yang didapat dari login.

Header format:
```
Authorization: Bearer <your_access_token>
```

---

## Endpoints

### 1. Chat with Agent
**POST** `/chat`

Kirim pesan ke content agent untuk generate copywriting atau script konten.

**Request Body:**
```json
{
  "message": "Buatkan caption Instagram untuk promosi produk kopi baru"
}
```

**Response:**
```json
{
  "response": "Hai [User Name]! Berikut beberapa variasi caption untuk produk kopi baru di [Business Name]:\n\n**Variasi 1 (Casual):**\n☕ Pagi yang sempurna dimulai dengan secangkir kopi istimewa! ✨\nKenalan yuk sama menu baru kita yang bikin hari-harimu makin semangat!\n#KopiSegar #MorningCoffee #KopiLokal\n\n**Variasi 2 (Storytelling):**\n...",
  "thread_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Status Codes:**
- `200` - Success
- `400` - User belum memiliki data UMKM
- `401` - Unauthorized (token invalid)
- `500` - Internal server error

---

### 2. Get Conversation History
**GET** `/history`

Ambil riwayat percakapan user dengan agent.

**Query Parameters:**
- `limit` (optional, default: 10) - Jumlah percakapan yang diambil

**Example:**
```
GET /api/v1/content-agent/history?limit=20
```

**Response:**
```json
{
  "conversations": [
    {
      "user_input": "Buatkan caption Instagram",
      "assistant_output": "Berikut beberapa variasi caption...",
      "created_at": "2025-12-07 10:30:00"
    },
    {
      "user_input": "Buatkan script TikTok",
      "assistant_output": "Berikut script untuk TikTok...",
      "created_at": "2025-12-07 10:35:00"
    }
  ],
  "total": 2
}
```

**Status Codes:**
- `200` - Success
- `401` - Unauthorized
- `500` - Internal server error

---

### 3. Reset Conversation History
**DELETE** `/history`

Hapus semua riwayat percakapan. Thread ID tetap sama.

**Response:**
```json
{
  "success": true,
  "message": "Berhasil menghapus 15 percakapan",
  "deleted_count": 15
}
```

**Status Codes:**
- `200` - Success
- `401` - Unauthorized
- `500` - Internal server error

---

### 4. Delete User Thread
**DELETE** `/thread`

Hapus thread user secara total (history + thread mapping). User akan dapat thread ID baru saat chat berikutnya.

**Response:**
```json
{
  "success": true,
  "message": "Thread berhasil dihapus. Anda akan mendapat thread baru saat chat berikutnya."
}
```

atau jika thread tidak ditemukan:
```json
{
  "success": false,
  "message": "Thread tidak ditemukan"
}
```

**Status Codes:**
- `200` - Success
- `401` - Unauthorized
- `500` - Internal server error

---

## Contoh Penggunaan (cURL)

### 1. Chat
```bash
curl -X POST "http://localhost:8000/api/v1/content-agent/chat" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Buatkan deskripsi produk untuk tas kulit handmade"
  }'
```

### 2. Get History
```bash
curl -X GET "http://localhost:8000/api/v1/content-agent/history?limit=10" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### 3. Reset History
```bash
curl -X DELETE "http://localhost:8000/api/v1/content-agent/history" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### 4. Delete Thread
```bash
curl -X DELETE "http://localhost:8000/api/v1/content-agent/thread" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## Contoh Penggunaan (Python requests)

```python
import requests

BASE_URL = "http://localhost:8000/api/v1/content-agent"
TOKEN = "your_access_token_here"

headers = {
    "Authorization": f"Bearer {TOKEN}",
    "Content-Type": "application/json"
}

# 1. Chat with agent
response = requests.post(
    f"{BASE_URL}/chat",
    headers=headers,
    json={"message": "Buatkan caption Instagram untuk produk baru"}
)
print(response.json())

# 2. Get history
response = requests.get(
    f"{BASE_URL}/history?limit=5",
    headers=headers
)
print(response.json())

# 3. Reset history
response = requests.delete(
    f"{BASE_URL}/history",
    headers=headers
)
print(response.json())

# 4. Delete thread
response = requests.delete(
    f"{BASE_URL}/thread",
    headers=headers
)
print(response.json())
```

---

## Contoh Penggunaan (JavaScript fetch)

```javascript
const BASE_URL = "http://localhost:8000/api/v1/content-agent";
const TOKEN = "your_access_token_here";

const headers = {
  "Authorization": `Bearer ${TOKEN}`,
  "Content-Type": "application/json"
};

// 1. Chat with agent
async function chat(message) {
  const response = await fetch(`${BASE_URL}/chat`, {
    method: "POST",
    headers: headers,
    body: JSON.stringify({ message })
  });
  return await response.json();
}

// 2. Get history
async function getHistory(limit = 10) {
  const response = await fetch(`${BASE_URL}/history?limit=${limit}`, {
    method: "GET",
    headers: headers
  });
  return await response.json();
}

// 3. Reset history
async function resetHistory() {
  const response = await fetch(`${BASE_URL}/history`, {
    method: "DELETE",
    headers: headers
  });
  return await response.json();
}

// 4. Delete thread
async function deleteThread() {
  const response = await fetch(`${BASE_URL}/thread`, {
    method: "DELETE",
    headers: headers
  });
  return await response.json();
}

// Usage
chat("Buatkan caption untuk Instagram").then(console.log);
```

---

## Error Handling

### Common Error Responses

**401 Unauthorized:**
```json
{
  "detail": "Could not validate credentials"
}
```

**400 Bad Request:**
```json
{
  "detail": "User belum memiliki data UMKM. Silakan lengkapi profil bisnis terlebih dahulu."
}
```

**500 Internal Server Error:**
```json
{
  "detail": "Error saat berkomunikasi dengan agent: <error_message>"
}
```

---

## Notes

1. **Thread Management**:
   - Setiap user memiliki thread_id unik
   - Thread menyimpan conversation history
   - Reset history hanya hapus percakapan, thread_id tetap
   - Delete thread hapus semua, user dapat thread baru

2. **Business Data Required**:
   - User harus memiliki data UMKM (business_name, business_category)
   - Jika belum ada, endpoint akan return error 400

3. **Agent Capabilities**:
   - Generate copywriting deskripsi produk
   - Generate script konten (Instagram, TikTok, YouTube, Facebook)
   - Memberikan saran strategi konten
   - Ingat konteks bisnis user (nama, jenis, dll)

4. **Rate Limiting**:
   - Belum ada rate limiting (TODO: implement di production)
