# Valentine page

这是一个轻量页面示例：

- 鼠标靠近 `Yes` 会放大按钮；
- 鼠标靠近 `No` 会让 `No` 按钮躲避；
- 点击 `Yes` 会显示庆祝画面并伴随彩带动画（confetti）。

本项目包含：

- `index.html` - 页面骨架
- `styles.css` - 样式
- `script.js` - 交互逻辑（放大、躲避、点 Yes 后的动画）

快速本地预览：

```bash
# 在项目目录启动一个简单服务器（Python）
python3 -m http.server 8000
# 然后在浏览器打开 http://localhost:8000
```

部署到 GitHub Pages (免费)：

1. 在 GitHub 上创建一个仓库，仓库名为 `USERNAME.github.io`，其中 `USERNAME` 替换成你的 GitHub 用户名。
2. 将本地文件推送到该仓库（示例命令）：

```bash
cd path/to/valentine
git init
git add .
git commit -m "Initial valentine page"
git branch -M main
git remote add origin https://github.com/USERNAME/USERNAME.github.io.git
git push -u origin main
```

3. 等待几分钟，访问 `https://USERNAME.github.io/` 即可看到页面。

如果你想把页面发布到仓库的 `gh-pages` 分支或其他仓库，请参考 GitHub Pages 文档。
# valentine
