# Cloudinary 配置指南

Cloudinary 是一个强大的云端图片存储和处理服务，为圣经PPT生成器提供以下功能：

## 🌟 功能特点

- **云端存储**: 图片安全存储在云端，不占用本地空间
- **自动优化**: 智能压缩和格式转换，提升加载速度
- **CDN 加速**: 全球内容分发网络，确保快速访问
- **多格式支持**: 支持 JPEG、PNG、WebP 等多种格式
- **智能裁剪**: 自动生成不同尺寸的缩略图

## 📋 配置步骤

### 1. 注册 Cloudinary 账户

1. 访问 [Cloudinary 官网](https://cloudinary.com)
2. 点击 "Sign Up Free" 注册免费账户
3. 验证邮箱并登录到控制台

### 2. 获取配置信息

在 Cloudinary 控制台首页，您可以找到：

```
Cloud name: **********
API Key: *******
API Secret: ********
```

### 3. 创建上传预设

1. 在 Cloudinary 控制台，前往 "Settings" > "Upload"
2. 滚动到 "Upload presets" 部分
3. 点击 "Add upload preset"
4. 配置如下：
   - **Preset name**: `scripture_slides`
   - **Signing Mode**: `Unsigned`
   - **Folder**: `scripture-slides/backgrounds`
   - **Access Control**: `Public read`
   - **Auto-generate public ID**: 启用
   - **Tags**: `scripture_slides,background_image`

### 4. 配置环境变量

复制 `.env.example` 为 `.env` 并填入您的配置：

```env
# Cloudinary 配置
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
VITE_CLOUDINARY_API_KEY=your_api_key
VITE_CLOUDINARY_API_SECRET=your_api_secret
VITE_CLOUDINARY_UPLOAD_PRESET=scripture_slides
```

## 🔧 高级配置

### 自定义上传预设

您可以在 Cloudinary 控制台中自定义上传预设：

- **图片质量**: 设置为 `auto` 或特定值 (如 `80`)
- **格式转换**: 启用 `auto` 格式优化
- **尺寸限制**: 设置最大宽度/高度 (推荐 1920x1080)
- **文件大小限制**: 设置最大文件大小 (推荐 10MB)

### 安全设置

对于生产环境，建议：

1. 使用 **Signed uploads** 提高安全性
2. 设置 **Allowed formats** 仅允许图片格式
3. 配置 **Rate limiting** 防止滥用
4. 启用 **Auto-moderation** 自动内容审核

## 📊 配额和定价

Cloudinary 免费套餐包括：

- **存储空间**: 25GB
- **带宽**: 25GB/月
- **转换次数**: 25,000次/月
- **管理 API**: 500次/月

超出免费配额后会自动升级到付费计划。

## 🔍 故障排除

### 常见问题

1. **上传失败 - "Upload preset not found"**
   - 检查 `VITE_CLOUDINARY_UPLOAD_PRESET` 是否正确
   - 确保上传预设为 `Unsigned` 模式

2. **上传失败 - "Invalid cloud name"**
   - 检查 `VITE_CLOUDINARY_CLOUD_NAME` 是否正确
   - 确保没有多余的空格或特殊字符

3. **图片无法显示**
   - 检查 Cloudinary 控制台中图片是否成功上传
   - 确保上传预设的访问权限为 `Public read`

4. **上传速度慢**
   - 可能是网络问题，Cloudinary 会自动选择最近的服务器
   - 检查图片大小，建议压缩后再上传

### 调试模式

如需调试，可以在浏览器控制台查看详细错误信息。上传失败时会显示具体的错误原因。

## 🔄 迁移和备份

### 从本地存储迁移到 Cloudinary

1. 配置好 Cloudinary 环境变量
2. 重新上传本地图片到 Cloudinary
3. 系统会自动优先使用 Cloudinary 存储

### 数据备份

建议定期：
1. 从 Cloudinary 控制台导出媒体库
2. 备份本地 localStorage 中的图片记录
3. 保存环境配置文件

## 📞 技术支持

如遇到问题，可以：

1. 查看 [Cloudinary 官方文档](https://cloudinary.com/documentation)
2. 访问 [Cloudinary 社区论坛](https://community.cloudinary.com)
3. 联系 Cloudinary 技术支持

---

配置完成后，您的圣经PPT生成器将具备强大的云端图片存储能力！🎉