# 🌩️ Cloudinary 云端图片存储集成

圣经PPT生成器现已集成 Cloudinary 云端图片存储服务，为您提供更强大的背景图片管理功能。

## ✨ 主要功能

### 🔄 智能存储策略
- **优先云端**：配置了 Cloudinary 时优先使用云端存储
- **本地降级**：云端不可用时自动降级到本地存储
- **无缝切换**：用户无感知的存储方式切换

### 📸 图片管理功能
- **一键上传**：支持拖拽和点击上传
- **自动优化**：图片自动压缩和格式转换
- **多尺寸支持**：自动生成缩略图和优化版本
- **智能标签**：自动添加分类标签便于管理

### 🎨 用户界面
- **可视化管理**：网格布局展示所有图片
- **存储标识**：清晰显示图片存储位置（云端/本地）
- **快速预览**：悬停查看大图，点击选择背景
- **批量操作**：支持单张删除和批量清理

## 🚀 快速开始

### 1. 获取 Cloudinary 配置
1. 注册 [Cloudinary 账户](https://cloudinary.com)
2. 在控制台获取 Cloud Name、API Key 等信息
3. 创建名为 `scripture_slides` 的上传预设

### 2. 配置环境变量
```env
# .env 文件
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
VITE_CLOUDINARY_API_KEY=your_api_key  
VITE_CLOUDINARY_API_SECRET=your_api_secret
VITE_CLOUDINARY_UPLOAD_PRESET=scripture_slides
```

### 3. 开始使用
- 配置完成后自动启用云端存储
- 在背景图片库中看到"云端图片"标签页
- 上传的图片将自动保存到 Cloudinary

## 💡 使用技巧

### 📁 图片组织
- 云端图片自动保存在 `scripture-slides/backgrounds/` 文件夹
- 支持自动标签：`scripture_slides`, `background_image`
- 本地图片保存在浏览器 localStorage 中

### 🔧 性能优化
- 图片自动压缩，减少加载时间
- CDN 分发，全球访问加速
- 智能格式转换（WebP、AVIF 等）

### 💾 存储管理
- 免费套餐：25GB 存储 + 25GB 月流量
- 本地存储：最多保存 50 张图片历史
- 自动清理：超出限制时清理最早的图片

## 🔧 高级配置

### 自定义图片处理
在 `src/config/cloudinary.js` 中可以调整：
```javascript
// 自定义优化参数
const options = {
  width: 1920,      // 最大宽度
  height: 1080,     // 最大高度  
  quality: 'auto',  // 自动质量
  format: 'auto'    // 自动格式
};
```

### 安全设置
- 使用 Unsigned 上传预设简化配置
- 支持文件类型和大小限制
- 自动内容审核（可选）

## 🐛 故障排除

### 常见问题

**Q: 上传失败显示 "Upload preset not found"**
A: 检查 `VITE_CLOUDINARY_UPLOAD_PRESET` 是否正确，确保预设为 Unsigned 模式

**Q: 图片上传成功但无法显示**
A: 检查 Cloudinary 控制台中图片的访问权限是否为 Public

**Q: 上传速度很慢**
A: Cloudinary 会自动选择最近的服务器，慢速可能是网络问题

**Q: 想要使用本地存储而不是云端**
A: 删除或注释掉 `.env` 文件中的 Cloudinary 配置即可

### 调试模式
浏览器控制台会显示详细的上传和错误信息，便于问题排查。

## 📊 限制和配额

### Cloudinary 免费套餐
- **存储**: 25GB
- **带宽**: 25GB/月  
- **转换**: 25,000次/月
- **API调用**: 500次/月

### 本地存储限制
- **数量**: 最多 50 张图片
- **大小**: 受浏览器存储限制
- **持久性**: 清除浏览器数据时丢失

## 🔄 迁移指南

### 从本地迁移到云端
1. 配置 Cloudinary 环境变量
2. 重新上传本地图片到云端
3. 云端图片会自动优先显示

### 备份和导出
- Cloudinary 控制台支持批量导出
- 本地图片可通过开发者工具导出 localStorage

---

🎉 现在您的圣经PPT生成器具备了专业级的云端图片存储能力！