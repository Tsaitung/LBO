#!/bin/bash

# LBO 財務模型管理系統 - 快速啟動腳本
echo "🚀 啟動 LBO 財務模型管理系統..."

# 檢查端口衝突
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null ; then
    echo "🔄 清理端口 3000..."
    lsof -ti:3000 | xargs kill -9 2>/dev/null
    sleep 2
fi

# 啟動應用程式
npm start &
REACT_PID=$!

# 等待啟動
sleep 8

# 開啟瀏覽器
if kill -0 $REACT_PID 2>/dev/null; then
    echo "✅ 應用程式已啟動，正在開啟瀏覽器..."
    open "http://localhost:3000" 2>/dev/null || echo "請手動訪問: http://localhost:3000"
else
    echo "❌ 啟動失敗，請檢查錯誤"
    exit 1
fi

# 保持運行直到用戶中斷
wait $REACT_PID

