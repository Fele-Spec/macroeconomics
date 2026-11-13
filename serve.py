#!/usr/bin/env python3
"""宏观七日 — 本地静态服务器。

用法：
    python serve.py
    python serve.py --port 9000 --no-browser

不依赖任何第三方包。数据只保存在浏览器 localStorage，本服务器只负责发送静态文件。
"""
import argparse
import http.server
import os
import socketserver
import threading
import webbrowser


class Handler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # 开发/学习场景：避免改完内容后浏览器缓存旧文件
        self.send_header("Cache-Control", "no-store, max-age=0")
        super().end_headers()

    def log_message(self, fmt, *args):
        # 保持终端干净，只打印错误
        if args and str(args[1]).startswith(("4", "5")):
            super().log_message(fmt, *args)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--port", type=int, default=8765)
    parser.add_argument("--no-browser", action="store_true")
    args = parser.parse_args()

    root = os.path.dirname(os.path.abspath(__file__))
    os.chdir(root)

    url = f"http://127.0.0.1:{args.port}/index.html#/today"
    if not args.no_browser:
        threading.Timer(0.8, lambda: webbrowser.open(url)).start()

    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("127.0.0.1", args.port), Handler) as httpd:
        print("宏观七日已启动：", url)
        print("按 Ctrl+C 停止。学习记录只保存在浏览器本地。")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n已停止。")


if __name__ == "__main__":
    main()
