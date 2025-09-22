import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Book, Heart } from "lucide-react";

export default function SimplePage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 p-4">
            <div className="max-w-2xl mx-auto">
                <Card>
                    <CardHeader className="text-center">
                        <div className="mx-auto mb-4 w-16 h-16 bg-gradient-to-r from-green-600 to-blue-600 rounded-2xl flex items-center justify-center">
                            <Book className="w-8 h-8 text-white" />
                        </div>
                        <CardTitle className="text-2xl font-bold text-gray-900">
                            圣经PowerPoint生成器
                        </CardTitle>
                        <p className="text-gray-600 mt-2">
                            简化版测试页面 - 验证基础组件是否正常工作
                        </p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Card className="p-4">
                                <div className="flex items-center gap-3">
                                    <Heart className="h-6 w-6 text-red-500" />
                                    <div>
                                        <h3 className="font-semibold">UI 组件</h3>
                                        <p className="text-sm text-gray-600">正常加载</p>
                                    </div>
                                </div>
                            </Card>
                            
                            <Card className="p-4">
                                <div className="flex items-center gap-3">
                                    <Book className="h-6 w-6 text-blue-500" />
                                    <div>
                                        <h3 className="font-semibold">样式系统</h3>
                                        <p className="text-sm text-gray-600">Tailwind CSS</p>
                                    </div>
                                </div>
                            </Card>
                        </div>

                        <div className="border-t pt-4">
                            <h3 className="font-semibold mb-2">测试按钮</h3>
                            <div className="flex gap-2">
                                <Button 
                                    onClick={() => alert('按钮点击正常！')}
                                    className="flex-1"
                                >
                                    测试点击
                                </Button>
                                <Button 
                                    variant="outline"
                                    onClick={() => window.location.href = '/test'}
                                    className="flex-1"
                                >
                                    系统诊断
                                </Button>
                            </div>
                        </div>

                        <div className="border-t pt-4">
                            <h3 className="font-semibold mb-2">问题排查</h3>
                            <div className="text-sm text-gray-600 space-y-1">
                                <p>✅ React 组件渲染</p>
                                <p>✅ Tailwind CSS 样式</p>
                                <p>✅ Radix UI 组件</p>
                                <p>✅ Lucide 图标</p>
                                <p>✅ 基础交互功能</p>
                            </div>
                        </div>

                        <Button 
                            variant="outline"
                            onClick={() => window.location.href = '/'}
                            className="w-full"
                        >
                            返回主应用
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}