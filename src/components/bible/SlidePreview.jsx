
import React from "react";
import { motion } from "framer-motion";

const SlidePreview = ({ slide, backgroundImage, isTitleSlide }) => {
    // 分离中英文内容
    const [chinese, english] = (slide.content || "|||").split("|||");
    
    // 背景图片样式
    const backgroundStyle = {
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
    };

    // 分离标题的中英文
    const [titleChinese, titleEnglish] = (slide.title || "|||").split("|||");

    return (
        <div
            className="w-full aspect-video rounded-lg shadow-lg overflow-hidden relative flex flex-col items-center justify-center text-white font-sans"
            style={backgroundStyle}
        >
            {/* 深色遮罩，与PPT生成时的透明度保持一致 (80% 透明，即20%不透明) */}
            <div className="absolute inset-0 bg-black/20 z-0"></div>

            {/* 内容容器 */}
            <div className="relative z-10 w-full h-full p-[5%] flex flex-col items-center justify-center text-center">
                {isTitleSlide ? (
                    // 标题页布局
                    <>
                        <h1 className="text-[5vmin] font-bold" style={{ textShadow: '1px 1px 4px rgba(0,0,0,0.5)' }}>
                            {titleChinese.trim()}
                        </h1>
                        {titleEnglish && titleEnglish.trim() && (
                            <h2 className="text-[3vmin] font-normal mt-4" style={{ textShadow: '1px 1px 4px rgba(0,0,0,0.5)' }}>
                                {titleEnglish.trim()}
                            </h2>
                        )}
                        {/* 装饰元素 */}
                        <div className="mt-8 text-[3.5vmin]" style={{ textShadow: '1px 1px 4px rgba(0,0,0,0.5)' }}>
                            ✧ ✦ ✧
                        </div>
                    </>
                ) : (
                    // 内容页布局
                    <div className="w-full h-full flex flex-col justify-start text-center pt-[5%]">
                        <h2 className="text-[3.2vmin] font-bold" style={{ textShadow: '1px 1px 4px rgba(0,0,0,0.5)' }}>
                            {titleChinese}
                        </h2>
                        {titleEnglish && (
                            <h3 className="text-[2.2vmin] font-semibold" style={{ textShadow: '1px 1px 4px rgba(0,0,0,0.5)' }}>
                                {titleEnglish}
                            </h3>
                        )}
                        <div className="flex-grow flex flex-col items-center justify-center">
                             <p className="text-[3.5vmin] font-bold leading-tight" style={{ textShadow: '1px 1px 4px rgba(0,0,0,0.5)' }}>
                                {chinese.trim()}
                            </p>
                            {english && english.trim() && (
                                <>
                                    <div className="w-1/2 h-px bg-white/40 my-4"></div>
                                    <p className="text-[2.2vmin] italic font-serif leading-tight" style={{ textShadow: '1px 1px 4px rgba(0,0,0,0.5)' }}>
                                        {english.trim()}
                                    </p>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SlidePreview;
