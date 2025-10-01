import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Settings } from 'lucide-react';
import { isCloudinaryConfigured } from '@/config/cloudinary';

const ConfigChecker = () => {
  const isConfigured = isCloudinaryConfigured();
  
  const envVars = [
    {
      name: 'VITE_CLOUDINARY_CLOUD_NAME',
      value: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME,
      required: true
    },
    {
      name: 'VITE_CLOUDINARY_UPLOAD_PRESET', 
      value: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET,
      required: true
    },
    {
      name: 'VITE_CLOUDINARY_API_KEY',
      value: import.meta.env.VITE_CLOUDINARY_API_KEY,
      required: false
    }
  ];

  return (
    <div className="p-4 border rounded-lg bg-gray-50">
      <div className="flex items-center gap-2 mb-3">
        <Settings className="w-5 h-5" />
        <h3 className="font-semibold">Cloudinary 配置状态</h3>
        <Badge variant={isConfigured ? "default" : "destructive"}>
          {isConfigured ? "已配置" : "未配置"}
        </Badge>
      </div>

      {!isConfigured && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div>
              <p className="font-medium mb-2">Cloudinary 云端上传功能未正确配置</p>
              <p className="text-sm mb-2">请在 Vercel 项目设置中添加以下环境变量：</p>
              <ul className="text-sm space-y-1">
                <li>• VITE_CLOUDINARY_CLOUD_NAME = dtdxht2hz</li>
                <li>• VITE_CLOUDINARY_UPLOAD_PRESET = scripture_slides</li>
                <li>• VITE_CLOUDINARY_API_KEY = 729466735735548</li>
              </ul>
              <p className="text-sm mt-2 text-gray-600">
                设置完成后，重新部署应用即可使用云端上传功能。
              </p>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <p className="text-sm font-medium text-gray-700">环境变量检查：</p>
        {envVars.map((envVar) => (
          <div key={envVar.name} className="flex items-center justify-between text-sm">
            <span className="font-mono text-gray-600">{envVar.name}</span>
            <div className="flex items-center gap-2">
              {envVar.value ? (
                <>
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-green-600">已设置</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4 text-red-500" />
                  <span className="text-red-600">
                    {envVar.required ? "缺失 (必需)" : "缺失 (可选)"}
                  </span>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 text-xs text-gray-500">
        <p>当前环境：{import.meta.env.MODE}</p>
        <p>构建时间：{import.meta.env.VITE_BUILD_TIME || new Date().toISOString()}</p>
      </div>
    </div>
  );
};

export default ConfigChecker;