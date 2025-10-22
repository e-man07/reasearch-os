# 🔧 Weaviate Connection Troubleshooting

**Error:** `Connect Timeout Error` or `fetch failed`

---

## 🚨 Problem

Your Weaviate Cloud instance is unreachable. The connection is timing out after 10 seconds.

**Error Details:**
```
ConnectTimeoutError: Connect Timeout Error 
(attempted address: a5kluxtqngjakii2tp0iw.c0.asia-southeast1.gcp.weaviate.cloud:443, 
timeout: 10000ms)
```

---

## ✅ Solutions

### **1. Check Weaviate Cloud Console** (Most Likely)

Your Weaviate Cloud instance might be:
- ⏸️ **Paused** (free tier auto-pauses after inactivity)
- 🔴 **Stopped**
- 🗑️ **Deleted**

**Fix:**
1. Go to https://console.weaviate.cloud
2. Log in to your account
3. Check your cluster status
4. If paused/stopped: **Click "Resume" or "Start"**
5. Wait 2-3 minutes for it to start
6. Try your query again

---

### **2. Verify Credentials**

Check your `.env` file has correct values:

```bash
cd apps/web
cat .env | grep WEAVIATE
```

Should show:
```
WEAVIATE_URL=https://a5kluxtqngjakii2tp0iw.c0.asia-southeast1.gcp.weaviate.cloud
WEAVIATE_API_KEY=b3B3ckQyN2RhY25aeHArZF9XQUlwNXdOWHJnajJ0Y09kR05SSzJ4Qmd5azc2ZHBYNFk1bUoveHN3SHVnPV92MjAw
```

---

### **3. Test Connection**

```bash
# Test if Weaviate is reachable
curl -I https://a5kluxtqngjakii2tp0iw.c0.asia-southeast1.gcp.weaviate.cloud

# Should return: HTTP/2 200
# If timeout or error: Instance is down
```

---

### **4. Check Network**

```bash
# Test DNS resolution
nslookup a5kluxtqngjakii2tp0iw.c0.asia-southeast1.gcp.weaviate.cloud

# Test connectivity
ping a5kluxtqngjakii2tp0iw.c0.asia-southeast1.gcp.weaviate.cloud
```

---

### **5. Restart Weaviate Instance**

If the instance is running but still not responding:

1. Go to Weaviate Cloud Console
2. Stop the cluster
3. Wait 30 seconds
4. Start the cluster
5. Wait 2-3 minutes
6. Try again

---

### **6. Create New Instance** (Last Resort)

If the instance is permanently broken:

1. Go to https://console.weaviate.cloud
2. Create a new cluster (free tier)
3. Copy the new URL and API key
4. Update `.env`:
   ```bash
   WEAVIATE_URL=https://your-new-cluster.weaviate.cloud
   WEAVIATE_API_KEY=your-new-api-key
   ```
5. Re-index your papers:
   ```bash
   # Clear old data
   npx tsx apps/web/scripts/clear-chunks.ts
   
   # Re-index papers from UI
   # Go to /search → Index papers again
   ```

---

## 🎯 Quick Fix (Most Common)

**90% of the time, this is the issue:**

Your Weaviate Cloud free tier instance **auto-paused** after 7 days of inactivity.

**Solution:**
1. Go to https://console.weaviate.cloud
2. Find your cluster
3. Click **"Resume"**
4. Wait 2-3 minutes
5. ✅ Try your query again

---

## 📊 Check Instance Status

### **Via Weaviate Console:**
```
https://console.weaviate.cloud
→ Your Cluster
→ Status: Should be "Running" (green)
```

### **Via API:**
```bash
curl https://a5kluxtqngjakii2tp0iw.c0.asia-southeast1.gcp.weaviate.cloud/v1/.well-known/ready
```

Should return: `{"status": "ok"}`

---

## 🔄 After Fixing

Once Weaviate is back online:

1. **Verify connection:**
   ```bash
   curl https://your-cluster.weaviate.cloud/v1/.well-known/ready
   ```

2. **Check if data exists:**
   - Go to http://localhost:3000/api/v1/rag/debug
   - Should show `totalChunks > 0`

3. **If no data:**
   - Re-index papers from `/search` page
   - Click "Index with RAG" on papers

4. **Test Q&A:**
   - Go to http://localhost:3000/rag
   - Ask a question
   - Should work! ✅

---

## 💡 Prevention

### **Keep Instance Active:**
- Use it at least once every 7 days
- Or upgrade to paid tier (no auto-pause)

### **Monitor Status:**
- Bookmark Weaviate Console
- Check before demos/presentations

### **Backup Strategy:**
- Keep list of indexed paper IDs
- Can quickly re-index if needed

---

## 🆘 Still Not Working?

### **Check Logs:**
```bash
# In your Next.js terminal
# Look for Weaviate connection errors
```

### **Try Different Network:**
- Switch from WiFi to mobile hotspot
- VPN might be blocking connection
- Firewall/proxy issues

### **Contact Support:**
- Weaviate Discord: https://discord.gg/weaviate
- Check status: https://status.weaviate.io

---

## ✅ Expected Behavior

When working correctly:

```
[INFO] [WeaviateVectorStore] Searching vector store
[INFO] [WeaviateVectorStore] Search completed { totalResults: 5, filteredResults: 3 }
✅ Found 3 relevant chunks
🤖 Generating answer...
✅ Answer generated
```

---

**TL;DR: Go to Weaviate Cloud Console and click "Resume" on your cluster. Wait 2-3 minutes. Try again.** 🚀
