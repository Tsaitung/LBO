#!/bin/bash

# LBO 財務模型管理系統啟動腳本
# 啟動 React 前端應用程式並自動開啟瀏覽器

echo "🚀 LBO 財務模型管理系統啟動中..."
echo "====================================="

# 進入專案目錄（相對於此腳本）
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/lbo-model"

# 檢查是否有進程在運行
echo "📋 檢查現有進程..."
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  Port 3000 已被佔用，正在終止現有進程..."
    lsof -ti:3000 | xargs kill -9 2>/dev/null
    sleep 2
fi

if lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  Port 3001 已被佔用，正在終止現有進程..."
    lsof -ti:3001 | xargs kill -9 2>/dev/null
    sleep 2
fi

# 安裝依賴（如果需要）
if [ ! -d "node_modules" ]; then
    echo "📦 安裝專案依賴..."
    npm install
fi

echo "🎯 啟動 React 應用程式..."

# 啟動應用程式並在背景運行
npm start &
REACT_PID=$!

echo "⏳ 等待應用程式啟動..."
sleep 10

# 檢查應用程式是否成功啟動
if kill -0 $REACT_PID 2>/dev/null; then
    echo "✅ React 應用程式已成功啟動！"
    echo "🌐 正在開啟瀏覽器..."

    # 根據操作系統開啟瀏覽器
    case "$(uname -s)" in
        Darwin)
            # macOS
            open "http://localhost:3000"
            ;;
        Linux)
            # Linux
            if command -v xdg-open > /dev/null; then
                xdg-open "http://localhost:3000"
            elif command -v google-chrome > /dev/null; then
                google-chrome "http://localhost:3000"
            else
                echo "❌ 無法自動開啟瀏覽器，請手動訪問: http://localhost:3000"
            fi
            ;;
        CYGWIN*|MINGW32*|MSYS*|MINGW*)
            # Windows
            start "http://localhost:3000"
            ;;
        *)
            echo "❌ 無法自動開啟瀏覽器，請手動訪問: http://localhost:3000"
            ;;
    esac

    echo ""
    echo "🎉 LBO 財務模型管理系統已啟動！"
    echo "📱 訪問地址: http://localhost:3000"
    echo ""
    echo "💡 使用說明："
    echo "   • Parameters - 輸入 Year 0 財報數據"
    echo "   • Scenario Manager - 選擇情境並應用參數"
    echo "   • 點擊「重算 Year1~N」生成完整財務預測"
    echo "   • 查看各財務報表和投資回報分析"
    echo ""
    echo "🔄 按 Ctrl+C 停止應用程式"
    echo ""

    # 等待用戶中斷
    wait $REACT_PID

else
    echo "❌ 應用程式啟動失敗，請檢查錯誤訊息"
    exit 1
fi
