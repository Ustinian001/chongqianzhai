# 安全加固说明（纯静态站 · GitHub Pages）

本目录是「无登录/注册」的纯静态展示站，部署在 GitHub Pages，无后端、无数据库、
无表单、无上传、无 API。安全加固主要通过 `index.html` 的 CSP meta 标签实现。

## 文件清单

| 文件 | 作用 |
|---|---|
| `index.html` | 核心页面，含 CSP meta + Referrer-Policy |
| `robots.txt` | 控制爬虫抓取（君子协定，非强防） |
| `.gitignore` | 防止误提交密钥/敏感文件 |
| `404.html` | 极简错误页，不泄露内部结构 |

## 部署

```bash
git init
git add .
git commit -m "harden: add CSP meta, robots.txt, .gitignore, 404"
git branch -M main
git remote add origin https://github.com/你的用户名/你的仓库.git
git push -u origin main
```

再到 **GitHub 仓库 → Settings → Pages**：
1. 发布源选 `main` 分支、`/ (root)`。
2. 自定义域名时填域名并打开 **Enforce HTTPS**。

## CSP 变体

### 实际使用的 CSP（含主题内联脚本哈希）

`index.html` 里有一个**必须内联**的主题初始化脚本（避免刷新闪白），所以不能简单用
"禁内联"。实际策略是：`script-src` 用 `sha256-...` 哈希**只放行这一个内联脚本**，
其余内联脚本/样式一律拦截。

```
default-src 'none'; base-uri 'none'; form-action 'none'; frame-src 'none'; object-src 'none'; img-src 'self' data:; style-src 'self'; script-src 'self' 'sha256-Ku8IDA+xIx/PG0vE8HY2P27GpbvFMGOhN9PkhlVY9EU='; font-src 'self'; connect-src 'self'; manifest-src 'self'
```

> ⚠️ 若你改了 `index.html` 里那个主题初始化 `<script>` 的内容（哪怕加一个空格/换行），
> 哈希就会失效，主题会被 CSP 拦截。改完必须用下面命令重算并更新哈希：

```bash
# 在站点根目录执行（提取 <script> 到 </script> 之间的内容算 sha256）
{ printf '\n'; awk '/<script>/{flag=1; next} /<\/script>/{flag=0} flag' index.html | tr -d '\r'; } \
  | openssl dgst -sha256 -binary | openssl base64 -A
# 把输出拼成 'sha256-<结果>'，替换 index.html 里的哈希
```

> 更省心的替代方案：把主题初始化挪到外部文件 `js/theme.js`，用 `<script src="js/theme.js"></script>`
> 同步加载（不加 defer/async，仍会在首帧前执行、同样避免闪白），然后 CSP 就可用纯
> `script-src 'self'`，彻底摆脱"改脚本要重算哈希"的麻烦。

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

## 验证

```bash
# 看 GitHub Pages 返回的响应头（只有平台默认头，无自定义安全头，属正常）
curl -sI https://你的用户名.github.io/你的仓库/

# 确认 HTML 里带 CSP meta
curl -s https://你的用户名.github.io/你的仓库/ | grep -i "Content-Security-Policy"

# 确认 HTTP 自动跳 HTTPS
curl -sI http://你的用户名.github.io/你的仓库/ | grep -iE "HTTP/|location"
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

## 人工配置（把评分拉到 A+，需在 CDN/服务器/账号侧完成）

1. **Cloudflare 前置**：自定义域名走 Cloudflare DNS 代理，加一条修改响应头规则：
   ```text
   Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
   X-Content-Type-Options: nosniff
   X-Frame-Options: DENY
   Referrer-Policy: no-referrer
   Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=()
   Content-Security-Policy: default-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'; object-src 'none'; img-src 'self' data:; style-src 'self'; script-src 'self'; font-src 'self'; connect-src 'self'; manifest-src 'self'
   ```
   （响应头版 CSP 可以加 `frame-ancestors 'none'`，补上点击劫持防护）

2. **GitHub 账号开启 2FA**（纯静态站最被低估的防线）。
3. 仓库若公开：确认历史提交无密钥；必要时用 `git filter-repo` 清历史。
4. Pages 发布分支开启 **branch protection**（要求 review）。
5. 域名注册商开 **域名锁 + 续费保护**；DNS 侧开 **DNSSEC**。
6. 定期复查第三方依赖与 CDN 脚本版本是否有已知漏洞。

## 不适用项（因无后端/无数据库/无表单/无上传）

CSRF、CORS、SQL/NoSQL 注入、命令/模板注入、限流、文件上传、SSRF、开放重定向、
错误处理泄露——这些依赖服务端，纯静态站不适用；将来加后端时再单独补。
