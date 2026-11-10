# 解方島・我的島屋（Netlify 版）

學生打開網站會看到一座 3D 小島，輸入自己的名字後，鏡頭飛到自己的島屋，只看得到自己的：

- 我的地方、四象限盤點（數字／訪談／觀察／行為）
- 老師的下一步建議、老師給你的話、全班公告
- 提出的解方、預算表與核算結果（算錯的列會標紅）
- 「接下來的任務」：空白的格子、要重算的預算，自動列出

島屋會依進度蓋起來：選定地方＝地基、盤點兩格以上＝牆壁、四格都有＝屋頂、提出解方＝插旗、預算全對＝點燈放煙火。

## 資料夾內容

```
public/index.html            網站畫面
netlify/functions/api.mjs    後端
netlify/functions/seeds.mjs  21 位同學的初始資料
netlify.toml、package.json   Netlify 設定
```

## 部署（和上次解方島一樣用 GitHub）

1. 在 GitHub 按右上角「+」→ New repository，名稱填 `jiefang-house`，按 Create repository。
2. 點 uploading an existing file，把這個資料夾**裡面**的東西（`public`、`netlify` 兩個資料夾，加上 `netlify.toml`、`package.json`、`README.md`）一起拖進去，按 Commit changes。
3. 到 Netlify：Add new project → Import an existing project → GitHub → 選 `jiefang-house` → 直接部署。
4. 到這個新網站的 Project configuration → Environment variables，新增 `ADMIN_PASSWORD`，值填老師密碼。
5. 到 Deploys → Trigger deploy → Deploy project，等狀態變成 Published。

這是一個**新的網站**，和上次的解方島分開，兩邊的資料互不影響。

## 第一次使用

1. 打開網站，按右下角「老師」，輸入密碼。
2. 在後台左下按「放上課堂的同學資料」，21 位同學就會出現在名單裡。這顆按鈕只會補上還沒有的同學，不會蓋掉你改過的內容，可以放心再按。
3. 點任一位同學就能修改所有文字，改完按「儲存」。「用他的身分預覽」可以看到該同學的畫面。
4. 「網站文字與公告」可以改登島畫面的標題、說明，以及所有同學都會看到的公告。

## 小提醒

- 同學在島上時，每分鐘會自動取得老師最新修改的內容；切回分頁時也會更新。
- 只要知道名字就能登入某位同學的島屋。名字不是密碼，同學如果輸入別人的名字，還是看得到那個人的頁面。需要更嚴格的話，可以改成每人一組通關碼。
- 名字比對會忽略空白，「臺」和「台」視為同一字。
- 老師密碼只存在瀏覽器分頁裡，關掉分頁就要重新輸入。
