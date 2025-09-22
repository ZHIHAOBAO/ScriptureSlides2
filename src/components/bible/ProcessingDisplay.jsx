
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Search, FileText, Download } from "lucide-react";
import { motion } from "framer-motion";

const steps = [
    { id: "search", label: "搜索圣经章节", icon: Search },
    { id: "slides", label: "创建幻灯片", icon: FileText },
    { id: "generate", label: "生成演示文稿文件", icon: Download }
];

export default function ProcessingDisplay({ currentStep }) {
    const getCurrentStepIndex = () => {
        if (currentStep.includes("搜索")) return 0;
        if (currentStep.includes("创建")) return 1;
        if (currentStep.includes("生成")) return 2;
        return 0;
    };

    const currentStepIndex = getCurrentStepIndex();

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex justify-center"
        >
            <Card className="w-full max-w-md border-0 shadow-xl bg-white/90 backdrop-blur-sm">
                <CardContent className="p-8 text-center">
                    <div className="mb-8">
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                            className="w-16 h-16 bg-gradient-to-r from-green-600 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4"
                        >
                            <Loader2 className="w-8 h-8 text-white" />
                        </motion.div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                            正在创建您的演示文稿
                        </h3>
                        <p className="text-gray-600">{currentStep}</p>
                    </div>

                    <div className="space-y-4">
                        {steps.map((step, index) => {
                            const Icon = step.icon;
                            const isCompleted = index < currentStepIndex;
                            const isCurrent = index === currentStepIndex;
                            
                            return (
                                <motion.div
                                    key={step.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.2 }}
                                    className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                                        isCurrent 
                                            ? "bg-blue-50 text-blue-700" 
                                            : isCompleted 
                                                ? "bg-green-50 text-green-700"
                                                : "bg-gray-50 text-gray-400"
                                    }`}
                                >
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                        isCurrent 
                                            ? "bg-blue-200" 
                                            : isCompleted 
                                                ? "bg-green-200"
                                                : "bg-gray-200"
                                    }`}>
                                        <Icon className="w-4 h-4" />
                                    </div>
                                    <span className="font-medium">{step.label}</span>
                                </motion.div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}

