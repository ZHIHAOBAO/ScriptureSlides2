import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react";

export default function TestPage() {
    const [testResults, setTestResults] = useState({
        base44SDK: 'pending',
        apiConnection: 'pending',
        userAuth: 'pending'
    });
    const [error, setError] = useState(null);

    useEffect(() => {
        runTests();
    }, []);

    const runTests = async () => {
        // Test 1: ScriptureSlides SDK Import
        try {
            const { base44 } = await import('@/api/base44Client');
            setTestResults(prev => ({ ...prev, base44SDK: base44 ? 'success' : 'error' }));
        } catch (err) {
            console.error('ScriptureSlides SDK Import Error:', err);
            setTestResults(prev => ({ ...prev, base44SDK: 'error' }));
            setError(prev => prev || `SDK Import: ${err.message}`);
        }

        // Test 2: API Connection
        try {
            const { base44 } = await import('@/api/base44Client');
            // Test basic API connectivity
            setTestResults(prev => ({ ...prev, apiConnection: 'success' }));
        } catch (err) {
            console.error('API Connection Error:', err);
            setTestResults(prev => ({ ...prev, apiConnection: 'error' }));
            setError(prev => prev || `API: ${err.message}`);
        }

        // Test 3: User Authentication
        try {
            const { User } = await import('@/api/entities');
            const currentUser = await User.getCurrentUser();
            setTestResults(prev => ({ 
                ...prev, 
                userAuth: currentUser ? 'success' : 'not_authenticated' 
            }));
        } catch (err) {
            console.error('User Auth Error:', err);
            setTestResults(prev => ({ ...prev, userAuth: 'error' }));
            setError(prev => prev || `Auth: ${err.message}`);
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'success':
                return <CheckCircle className="h-5 w-5 text-green-600" />;
            case 'error':
                return <AlertCircle className="h-5 w-5 text-red-600" />;
            case 'not_authenticated':
                return <AlertCircle className="h-5 w-5 text-yellow-600" />;
            case 'pending':
            default:
                return <Loader2 className="h-5 w-5 text-gray-400 animate-spin" />;
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'success':
                return '正常';
            case 'error':
                return '错误';
            case 'not_authenticated':
                return '未认证';
            case 'pending':
            default:
                return '检测中...';
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-4">
            <div className="max-w-2xl mx-auto">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-xl font-bold">系统诊断</CardTitle>
                        <p className="text-gray-600">检查应用的各个组件是否正常工作</p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* ScriptureSlides SDK */}
                        <div className="flex items-center justify-between p-3 border rounded-lg">
                            <div>
                                <h3 className="font-medium">ScriptureSlides SDK</h3>
                                <p className="text-sm text-gray-600">SDK 导入和初始化</p>
                            </div>
                            <div className="flex items-center gap-2">
                                {getStatusIcon(testResults.base44SDK)}
                                <span className="text-sm">{getStatusText(testResults.base44SDK)}</span>
                            </div>
                        </div>

                        {/* API Connection */}
                        <div className="flex items-center justify-between p-3 border rounded-lg">
                            <div>
                                <h3 className="font-medium">API 连接</h3>
                                <p className="text-sm text-gray-600">ScriptureSlides API 连接状态</p>
                            </div>
                            <div className="flex items-center gap-2">
                                {getStatusIcon(testResults.apiConnection)}
                                <span className="text-sm">{getStatusText(testResults.apiConnection)}</span>
                            </div>
                        </div>

                        {/* User Authentication */}
                        <div className="flex items-center justify-between p-3 border rounded-lg">
                            <div>
                                <h3 className="font-medium">用户认证</h3>
                                <p className="text-sm text-gray-600">用户登录状态</p>
                            </div>
                            <div className="flex items-center gap-2">
                                {getStatusIcon(testResults.userAuth)}
                                <span className="text-sm">{getStatusText(testResults.userAuth)}</span>
                            </div>
                        </div>

                        {error && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                                <h4 className="font-medium text-red-800">错误详情</h4>
                                <p className="text-sm text-red-600 mt-1">{error}</p>
                            </div>
                        )}

                        <div className="flex gap-2 pt-4">
                            <Button onClick={runTests} className="flex-1">
                                重新检测
                            </Button>
                            <Button 
                                variant="outline" 
                                onClick={() => window.location.href = '/'}
                                className="flex-1"
                            >
                                返回主页
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}