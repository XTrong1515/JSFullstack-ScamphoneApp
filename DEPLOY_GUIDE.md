# 🚀 Hướng dẫn Deploy ScamPhone App

## 📌 Tổng quan
- **Database**: MongoDB Atlas (cloud database miễn phí)
- **Backend**: Render.com (hosting Node.js miễn phí)
- **Frontend**: Vercel (hosting React miễn phí)

---

## 1️⃣ DEPLOY DATABASE - MongoDB Atlas

### Bước 1: Tạo tài khoản MongoDB Atlas
1. Truy cập: https://www.mongodb.com/cloud/atlas/register
2. Đăng ký tài khoản miễn phí (có thể dùng Google)
3. Chọn plan **FREE (M0 Sandbox)** - 512MB storage

### Bước 2: Tạo Cluster
1. Sau khi đăng nhập, click **"Create a New Cluster"**
2. Chọn:
   - **Cloud Provider**: AWS
   - **Region**: Singapore (hoặc gần Việt Nam nhất)
   - **Cluster Tier**: M0 Sandbox (FREE)
3. Click **"Create Cluster"** (chờ 3-5 phút)

### Bước 3: Tạo Database User
1. Bên trái click **"Database Access"**
2. Click **"Add New Database User"**
3. Điền:
   - **Username**: `scamphone_admin`
   - **Password**: (tạo password mạnh, LƯU LẠI!)
   - **Database User Privileges**: chọn **"Read and write to any database"**
4. Click **"Add User"**

### Bước 4: Whitelist IP Address
1. Bên trái click **"Network Access"**
2. Click **"Add IP Address"**
3. Chọn **"Allow Access from Anywhere"** (0.0.0.0/0)
4. Click **"Confirm"**

### Bước 5: Lấy Connection String
1. Quay lại **"Database"** (bên trái)
2. Click nút **"Connect"** ở cluster vừa tạo
3. Chọn **"Connect your application"**
4. Copy **Connection String**, dạng:
```
mongodb+srv://scamphone_admin:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
```
5. Thay `<password>` bằng password của user vừa tạo
6. **LƯU LẠI CONNECTION STRING NÀY!**

### Bước 6: Import dữ liệu hiện tại (nếu có)
```bash
# Xuất data từ local MongoDB
mongodump --db scamphone_db --out ./backup

# Import lên Atlas (thay <connection-string> bằng string vừa lấy)
mongorestore --uri="<connection-string>" --db scamphone_db ./backup/scamphone_db
```

---

## 2️⃣ DEPLOY BACKEND - Render.com

### Bước 1: Chuẩn bị Backend
1. Tạo file `.env.production` trong folder `Scamphone-BE`:
```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://scamphone_admin:<password>@cluster0.xxxxx.mongodb.net/scamphone_db?retryWrites=true&w=majority
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
CLIENT_URL=https://scamphone.vercel.app
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

2. Kiểm tra `package.json` có scripts:
```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  }
}
```

3. Tạo file `render.yaml` trong `Scamphone-BE`:
```yaml
services:
  - type: web
    name: scamphone-backend
    env: node
    buildCommand: npm install
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: MONGODB_URI
        sync: false
      - key: JWT_SECRET
        sync: false
      - key: CLIENT_URL
        sync: false
```

### Bước 2: Push code lên GitHub
```bash
# Trong thư mục Scamphone-BE
git init
git add .
git commit -m "Prepare for deployment"
git branch -M main
git remote add origin https://github.com/XTrong1515/Scamphone_App.git
git push -u origin main
```

### Bước 3: Deploy trên Render
1. Truy cập: https://render.com (đăng ký bằng GitHub)
2. Click **"New +"** → **"Web Service"**
3. Connect repository: **XTrong1515/Scamphone_App**
4. Cấu hình:
   - **Name**: `scamphone-backend`
   - **Root Directory**: `Scamphone-BE`
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: Free
5. Thêm **Environment Variables**:
   - `MONGODB_URI`: (paste connection string từ Atlas)
   - `JWT_SECRET`: (tạo key bất kỳ)
   - `CLIENT_URL`: `https://scamphone.vercel.app`
   - `NODE_ENV`: `production`
6. Click **"Create Web Service"**
7. Chờ deploy (5-10 phút)
8. **LƯU LẠI URL**: `https://scamphone-backend.onrender.com`

---

## 3️⃣ DEPLOY FRONTEND - Vercel

### Bước 1: Chuẩn bị Frontend
1. Tạo file `.env.production` trong `Scamphone-FE`:
```env
VITE_API_URL=https://scamphone-backend.onrender.com/api/v1
```

2. Cập nhật `vite.config.ts`:
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    }
  }
})
```

3. Tạo file `vercel.json` trong `Scamphone-FE`:
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ],
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "Access-Control-Allow-Credentials", "value": "true" },
        { "key": "Access-Control-Allow-Origin", "value": "*" },
        { "key": "Access-Control-Allow-Methods", "value": "GET,OPTIONS,PATCH,DELETE,POST,PUT" }
      ]
    }
  ]
}
```

### Bước 2: Deploy trên Vercel
1. Cài Vercel CLI:
```bash
npm install -g vercel
```

2. Deploy:
```bash
cd Scamphone-FE
vercel login
vercel --prod
```

3. Hoặc deploy qua Web UI:
   - Truy cập: https://vercel.com
   - Click **"Import Project"**
   - Connect GitHub → chọn repository
   - **Root Directory**: `Scamphone-FE`
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - Add Environment Variable:
     - `VITE_API_URL`: `https://scamphone-backend.onrender.com/api/v1`
   - Click **"Deploy"**

4. **URL cuối cùng**: `https://scamphone.vercel.app`

---

## 4️⃣ CẬP NHẬT CORS &環境變數

### Trong Backend (`server.js`):
```javascript
const corsOptions = {
  origin: [
    'http://localhost:5173',
    'https://scamphone.vercel.app',
    'https://scamphone-*.vercel.app' // Preview deployments
  ],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
```

### Cập nhật lại trên Render:
1. Vào Render Dashboard
2. Chọn service `scamphone-backend`
3. Tab **Environment** → Edit `CLIENT_URL`:
```
https://scamphone.vercel.app
```
4. Save → Auto redeploy

---

## 5️⃣ KIỂM TRA VÀ TEST

### Kiểm tra Backend:
```bash
curl https://scamphone-backend.onrender.com/api/v1/products
```

### Kiểm tra Frontend:
- Truy cập: https://scamphone.vercel.app
- Test đăng nhập, đăng ký, thêm sản phẩm

### Debug nếu có lỗi:
- **Render Logs**: Dashboard → Logs tab
- **Vercel Logs**: Dashboard → Deployments → View Logs
- **MongoDB Logs**: Atlas → Metrics tab

---

## 6️⃣ TỐI ỨU VÀ BẢO MẬT

### Backend (Render):
```javascript
// Thêm rate limiting
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Helmet cho security headers
const helmet = require('helmet');
app.use(helmet());
```

### Environment Variables cần bảo mật:
- ❌ KHÔNG commit `.env` files
- ✅ Dùng Environment Variables trên Render/Vercel
- ✅ Đổi JWT_SECRET thành random string mạnh
- ✅ MongoDB password phức tạp

### Custom Domain (tùy chọn):
- Mua domain từ Namecheap/GoDaddy
- Add DNS records:
  - Frontend: CNAME → Vercel
  - Backend: CNAME → Render

---

## 📝 CHECKLIST TRƯỚC KHI DEPLOY

- [ ] MongoDB Atlas cluster đã tạo và lấy connection string
- [ ] Database user đã tạo với quyền đầy đủ
- [ ] IP whitelist đã thêm 0.0.0.0/0
- [ ] Backend `.env.production` đã cấu hình đầy đủ
- [ ] Frontend `VITE_API_URL` trỏ đúng backend URL
- [ ] CORS đã cấu hình cho domain production
- [ ] Git repository đã push code mới nhất
- [ ] Render service đã deploy thành công
- [ ] Vercel deployment đã complete
- [ ] Test đăng nhập/đăng ký trên production
- [ ] Test API endpoints hoạt động

---

## 🆘 TROUBLESHOOTING

### Lỗi CORS:
```javascript
// Backend: kiểm tra origin trong corsOptions
origin: process.env.CLIENT_URL || 'http://localhost:5173'
```

### Lỗi 502 Bad Gateway (Render):
- Kiểm tra logs: có thể thiếu dependencies
- Check MongoDB connection string đúng chưa
- Port phải dùng `process.env.PORT`

### Frontend không connect được Backend:
- Check `VITE_API_URL` trong Vercel
- Rebuild frontend sau khi đổi env vars
- Kiểm tra Network tab trong DevTools

### MongoDB connection timeout:
- Kiểm tra IP whitelist có 0.0.0.0/0 chưa
- Connection string có thay `<password>` chưa
- Database name có đúng không

---

## 💰 CHI PHÍ

- **MongoDB Atlas M0**: FREE (512MB)
- **Render Free Tier**: FREE (512MB RAM, tắt sau 15 phút không dùng)
- **Vercel Hobby**: FREE (100GB bandwidth/tháng)

**Tổng: $0/tháng** 🎉

---

## 🔄 UPDATE SAU NÀY

### Update Backend:
```bash
git add .
git commit -m "Update backend"
git push origin main
# Render tự động redeploy
```

### Update Frontend:
```bash
git add .
git commit -m "Update frontend"
git push origin main
# Vercel tự động redeploy
```

---

**Chúc bạn deploy thành công! 🚀**
