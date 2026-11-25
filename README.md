# 安全加固说明（纯静态站 · GitHub Pages）

本目录是「无登录/注册」的纯静态展示站，部署在 GitHub Pages，无后端、无数据库、
无表单、无上传、无 API。安全加固主要通过各页面的 CSP meta 标签实现。

## 文件清单

| 文件 / 目录 | 作用 |
|---|---|
| `index.html` | 主页：CSP meta、Referrer-Policy、主题入口、作品卡片与本页视频弹窗 |
| `about.html` | 崇虔斋简介页：引用公共样式、简介专属样式与交互脚本 |
| `404.html` | 极简错误页；样式与脚本内联，CSP 单独放行 `unsafe-inline` |
| `css/script.css` | 全站公共样式：背景光晕、玻璃材质、导航、卡片、视频弹窗、移动端菜单动画 |
| `css/about.css` | 简介页专属排版样式 |
| `js/theme-init.js` | 首帧前同步执行的主题初始化（读本地存储 / 系统偏好，写 `data-theme`，避免刷新闪白） |
| `js/style.js` | 主页交互：页脚年份、主题切换、移动端抽屉菜单、滚动出现动画、前端防护、视频弹窗 |
| `js/about.js` | 简介页交互：页脚年份、主题切换、抽屉菜单、滚动出现动画、前端防护 |
| `img/` | 站点图标（favicon 系列、apple-touch-icon）与页面图片素材 |
| `Vidoe/` | 主页三个演示视频（mp4；目录名沿用历史拼写 `Vidoe`） |
| `robots.txt` | 控制爬虫抓取（君子协定，非强防） |
| `CNAME` | 自定义域名 `www.chongqianzhai.com` |
| `.gitignore` | 防止误提交密钥 / 敏感文件 |

> `.idea/`、`.openidea/` 是本机 IDE 配置，不属于站点发布内容。

## 页面与交互

- **深浅主题**：`js/theme-init.js` 在首帧前按本地存储（无记录时按系统偏好）设定主题；
  `style.js` / `about.js` 里的按钮切换主题并写回 localStorage，跨页面同步。
- **移动端菜单**：窄屏右上角按钮展开抽屉面板；点链接、点遮罩空白处、按 Esc、
  滚动或滑动背景都会收起。
- **本页视频弹窗**：主页作品卡片上的「查看效果详情」按钮在当前页弹窗播放
  `Vidoe/` 下的 mp4，不跳转独立页面。
- **滚动出现动画**：区块进入视口时淡入上移，只执行一次。
- **前端防护**：见下文「前端防护」一节。

## 部署

```bash
git init
git add .
git commit -m "harden: CSP meta, robots.txt, .gitignore, 404"
git branch -M main
git remote add origin https://github.com/你的用户名/你的仓库.git
git push -u origin main
```

再到 **GitHub 仓库 → Settings → Pages**：
1. 发布源选 `main` 分支、`/ (root)`。
2. 自定义域名填 `www.chongqianzhai.com` 并打开 **Enforce HTTPS**。

## CSP 现状

脚本已全部抽为外部文件，`script-src 'self'` 即可，不再需要内联脚本哈希。

### 主页 / 简介页实际策略

`index.html`（含 `media-src 'self'`，放行自托管视频）：

```
default-src 'none'; base-uri 'none'; form-action 'none'; frame-src 'none'; object-src 'none'; img-src 'self' data:; media-src 'self'; style-src 'self'; script-src 'self'; font-src 'self'; connect-src 'self'; manifest-src 'self'
```

`about.html` 不加载视频，策略同上但不含 `media-src`。

### 404 页特例

`404.html` 把样式和脚本写在页面内联，策略单独放行内联：

```
default-src 'none'; base-uri 'none'; form-action 'none'; object-src 'none'; script-src 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:
```

若以后把 404 的内联样式 / 脚本也抽成外部文件，即可去掉两处 `unsafe-inline`。

### Variant B（需引入第三方脚本时）

把 `index.html` 里的 CSP 替换为下面这条，并给每个第三方资源加 `integrity` + `crossorigin`：

```
default-src 'none'; base-uri 'none'; form-action 'none'; frame-src 'none'; object-src 'none'; img-src 'self' data: https://cdn.jsdelivr.net; style-src 'self' https://cdn.jsdelivr.net; script-src 'self' https://cdn.jsdelivr.net; font-src 'self' https://fonts.gstatic.com; connect-src 'self'; manifest-src 'self'
```

第三方脚本示例（锁版本 + SRI）：

```html
<script src="https://cdn.jsdelivr.net/npm/htmx.org@1.9.12/dist/htmx.min.js"
        integrity="sha384-ujb1lZYygJmzgSwoxRggbCHcjc0rB2XoQrxeTUQyRjrOnlCoYta87iKBWq3EsdM2"
        crossorigin="anonymous"
        referrerpolicy="no-referrer"></script>
```

## 生成 SRI 哈希

```bash
curl -sL https://cdn.jsdelivr.net/npm/htmx.org@1.9.12/dist/htmx.min.js -o htmx.min.js
openssl dgst -sha384 -binary htmx.min.js | openssl base64 -A
# 输出前加 sha384- 前缀，拼进 integrity
```

## 前端防护（右键 / F12 / 另存图片）

拦截事件在 `js/style.js` 与 `js/about.js` 末尾的防护 IIFE；选中 / 拖拽相关样式在
`css/script.css`。

| 目标 | 实现 |
|---|---|
| 右键菜单（含「图片另存为」） | `contextmenu` 事件 `preventDefault()` |
| 拖拽图片到桌面 | `dragstart` 拦截 + CSS `-webkit-user-drag: none` |
| 选中复制文字 / 图片 | CSS `user-select: none` + `selectstart` 拦截 |
| F12、Ctrl+Shift+I/J/C/K | `keydown` 拦截（捕获阶段） |
| Ctrl+U 查看源码、Ctrl+S 保存网页 | `keydown` 拦截 |

**必须说明：这些都不能真正阻止别人查看源码或下载图片。**

- 页面源码和图片本来就要下载到浏览器，`view-source:`、`curl`、抓包、禁用 JS、
  开发者工具菜单、换一个浏览器都能绕过；
- GitHub Pages 是公开静态托管，`img/cqzlogo.png`（约 5.7 MB）、`img/cqsflogo.png`
  （约 5.8 MB）原图可以直接用 URL 拿到；`Vidoe/` 下的演示视频体积也偏大，
  如需减重可后续压缩转码；
- 拦截快捷键只是拦浏览器的默认行为，不是拦浏览器。

真想保护图片，只能让「拿到了也不划算」：加显水印、只发布缩小后的低分辨率版本、
或者压根不放原图。要真正挡住访问必须上服务端鉴权，GitHub Pages 做不到。

## 验证

```bash
# 看 GitHub Pages 返回的响应头（只有平台默认头，无自定义安全头，属正常）
curl -sI https://www.chongqianzhai.com/

# 确认 HTML 里带 CSP meta
curl -s https://www.chongqianzhai.com/ | grep -i "Content-Security-Policy"

# 确认 HTTP 自动跳 HTTPS
curl -sI http://www.chongqianzhai.com/ | grep -iE "HTTP/|location"
```

浏览器负向测试：临时在 `index.html` 里加一行 `<script>alert(1)</script>`，
Console 应报 `Refused to execute inline script ... violates ... Content-Security-Policy`。

## 平台限制（裸 GitHub Pages 给不了的头）

以下项**无法**通过 `<meta>` 或 GitHub Pages 配置下发，只能用 HTTP 响应头，
因此裸 GitHub Pages 做不到。要在前面挂一层 Cloudflare（见下方「人工配置」）才能补齐：

- `Strict-Transport-Security`（HSTS）
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY` / CSP `frame-ancestors`（`frame-ancestors` 在 meta 中无效）
- `Permissions-Policy`
- CSP 违规上报 `report-uri` / `report-to`

> 因此 Observatory / securityheaders.com 对裸 GitHub Pages 站得分不高（C~D），
> 这是平台限制，不是配置错误。

## 人工配置（把评分拉到 A+，需在 CDN / 服务器 / 账号侧完成）

1. **Cloudflare 前置**：自定义域名走 Cloudflare DNS 代理，加一条修改响应头规则：
   ```text
   Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
   X-Content-Type-Options: nosniff
   X-Frame-Options: DENY
   Referrer-Policy: no-referrer
   Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=()
   Content-Security-Policy: default-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'; object-src 'none'; img-src 'self' data:; media-src 'self'; style-src 'self'; script-src 'self'; font-src 'self'; connect-src 'self'; manifest-src 'self'
   ```
   （响应头版 CSP 可以加 `frame-ancestors 'none'`，补上点击劫持防护）

2. **GitHub 账号开启 2FA**（纯静态站最被低估的防线）。
3. 仓库若公开：确认历史提交无密钥；必要时用 `git filter-repo` 清历史。
4. Pages 发布分支开启 **branch protection**（要求 review）。
5. 域名注册商开 **域名锁 + 续费保护**；DNS 侧开 **DNSSEC**。
6. 定期复查第三方依赖与 CDN 脚本版本是否有已知漏洞。

## 不适用项（因无后端 / 无数据库 / 无表单 / 无上传）

CSRF、CORS、SQL/NoSQL 注入、命令/模板注入、限流、文件上传、SSRF、开放重定向、
错误处理泄露——这些依赖服务端，纯静态站不适用；将来加后端时再单独补。
