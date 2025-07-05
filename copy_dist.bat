@echo off
setlocal enabledelayedexpansion

rem 设置源目录和目标目录
set "source_dir=dist"
set "target_dir=D:\note\.obsidian\plugins\obsidian-advanced-canvas-main"

rem 检查源目录是否存在
if not exist "%source_dir%" (
    echo 错误：源目录 "%source_dir%" 不存在！
    goto :end
)

rem 检查目标目录是否存在，如果不存在则创建
if not exist "%target_dir%" (
    echo 目标目录不存在，正在创建...
    mkdir "%target_dir%"
)

rem 复制所有文件和子目录
echo 正在将文件从 "%source_dir%" 复制到 "%target_dir%"...
xcopy "%source_dir%" "%target_dir%" /E /I /Y

echo 复制完成！

:end
endlocal 