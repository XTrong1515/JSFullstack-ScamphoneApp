# 🚀 QUICK START: Deploy trong 30 phút

## TÓM TẮT NHANH

1. **MongoDB Atlas** (5 phút): Database cloud miễn phí
2. **Render.com** (10 phút): Deploy Backend
3. **Vercel** (5 phút): Deploy Frontend
4. **Kết nối** (10 phút): Cập nhật URLs và test

---

## BƯỚC 1: MongoDB Atlas (5 phút)

```bash
1. https://www.mongodb.com/cloud/atlas/register
2. Tạo account → Chọn FREE M0 Sandbox
3. Database Access → Add User:
   - Username: scamphone_admin
   - Password: (LƯU LẠI!)
4. Network Access → Add IP: 0.0.0.0/0
5. Database → Connect → Copy connection string:
   mongodb+srv://scamphone_admin:<password>@...
```

✅ **Hoàn thành**: Có connection string

---

## BƯỚC 2: Deploy Backend lên Render (10 phút)

### 2.1 Chuẩn bị code:
```bash
cd Scamphone-BE

# Tạo file .env.production (copy từ .env.production.example)
cp .env.production.example .env.production

# Sửa các giá trị:
# - MONGODB_URI: paste connection string từ Atlas
# - JWT_SECRET: random string dài
# - CLIENT_URL: https://scamphone.vercel.app (tạm thời)
```

### 2.2 Push lên GitHub:
```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

### 2.3 Deploy trên Render:
```bash
1. https://render.com → Sign up with GitHub
2. New + → Web Service
3. Connect repository: Scamphone_App
4. Settings:
   - Name: scamphone-backend
   - Root Directory: Scamphone-BE
   - Build: npm install
   - Start: npm start
   - Plan: Free
5. Environment Variables (Add):
   MONGODB_URI=mongodb+srv://scamphone_admin:PASSWORD@cluster0...
   JWT_SECRET=your-random-secret-at-least-32-chars
   CLIENT_URL=https://scamphone.vercel.app
   NODE_ENV=production
6. Create Web Service
```

⏳ Chờ 5-10 phút deploy...

✅ **Hoàn thành**: Backend URL: `https://scamphone-backend.onrender.com`

---

## BƯỚC 3: Deploy Frontend lên Vercel (5 phút)

### 3.1 Cập nhật API URL:
```bash
cd Scamphone-FE

# Sửa file .env.production
echo "VITE_API_URL=https://scamphone-backend.onrender.com/api/v1" > .env.production
```

### 3.2 Deploy:

**Cách 1: Vercel CLI (nhanh hơn)**
```bash
npm install -g vercel
vercel login
vercel --prod
# Làm theo hướng dẫn
```

**Cách 2: Vercel Web UI**
```bash
1. https://vercel.com → Sign up with GitHub
2. Import Project → Scamphone_App
3. Settings:
   - Root Directory: Scamphone-FE
   - Framework: Vite
   - Build: npm run build
   - Output: dist
4. Environment Variables:
   VITE_API_URL=https://scamphone-backend.onrender.com/api/v1
5. Deploy
```

⏳ Chờ 2-3 phút...

✅ **Hoàn thành**: Frontend URL: `https://scamphone.vercel.app`

---

## BƯỚC 4: Kết nối và Test (10 phút)

### 4.1 Cập nhật Backend CORS:
```bash
# Vào Render Dashboard → scamphone-backend
# Environment → Edit CLIENT_URL:
CLIENT_URL=https://scamphone.vercel.app

# Save → Auto redeploy (chờ 2-3 phút)
```

### 4.2 Test:

**Test Backend API:**
```bash
curl https://scamphone-backend.onrender.com/api/v1/health

# Expect: {"status":"OK",...}
```

**Test Frontend:**
```bash
# Mở browser:
https://scamphone.vercel.app

# Thử:
✓ Đăng ký tài khoản mới
✓ Đăng nhập
✓ Xem sản phẩm
✓ Thêm vào giỏ hàng
```

---

## 🎉 XONG RỒI!

**URLs của bạn:**
- 🌐 Website: https://scamphone.vercel.app
- 🔧 Backend: https://scamphone-backend.onrender.com
- 💾 Database: MongoDB Atlas

---

## ⚠️ LƯU Ý QUAN TRỌNG

### Render Free Tier:
- ❗ **Sleep sau 15 phút không dùng**
- ❗ **Lần đầu mở web sẽ mất 30-60s** (backend đang khởi động)
- ✅ Giải pháp: Nâng cấp lên plan $7/tháng hoặc dùng cron job ping backend

### Để backend không sleep:
```bash
# Cài cron-job.org (miễn phí)
1. https://cron-job.org/en/
2. Tạo job ping:
   URL: https://scamphone-backend.onrender.com/api/v1/health
   Interval: Every 10 minutes
```

---

## 📞 HỖ TRỢ

**Lỗi thường gặp:**
- CORS error → Check CLIENT_URL
- 502 Bad Gateway → Backend đang khởi động, đợi 1-2 phút
- Cannot connect to MongoDB → Check connection string, IP whitelist

**Logs:**
- Backend: Render Dashboard → Logs
- Frontend: Vercel Dashboard → Deployments → View Logs
- Database: MongoDB Atlas → Metrics

---

## 🔄 UPDATE SAU NÀY

```bash
# Chỉ cần push code
git add .
git commit -m "Update feature"
git push origin main

# Render và Vercel tự động redeploy!
```

---

**Chúc deploy thành công! 🚀**

Need help? Check DEPLOY_GUIDE.md để biết chi tiết đầy đủ.
 