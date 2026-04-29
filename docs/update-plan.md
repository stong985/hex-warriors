# Hex Warriors 诺曼底重制更新计划

## 目标
- 将游戏从偏抽象的中世纪占城视觉，重制为“诺曼底登陆 + 二次元女性小队”的轻战棋风格。
- 保留当前 7x7 六边形核心玩法，但重构代码结构，让 UI、数据、渲染、输入、AI 更清晰。
- 先确认美术方向，再批量产出并接入素材，避免返工。

## 阶段 1：确认美术方向（当前先做）
1. 生成一张角色/场景设定拆解图：
   - 步兵：突击步枪/登陆装备，近战定位。
   - 弓手：远程狙击/侦察定位，用“弓手”玩法但视觉可转译为神射手。
   - 骑兵：机械化/摩托侦察兵，保留高速突击感。
   - 盾兵：重装防爆盾/工兵，保留高防定位。
   - 城池：海岸碉堡、临时指挥所、港口据点三类可读形态。
   - 背景：奥马哈海滩/诺曼底登陆，沙滩、海浪、登陆艇、烟雾、铁丝网。
2. 把设定图放到桌面给用户确认。

## 阶段 2：代码重构
1. 拆分单文件：
   - `src/config.js`：兵种、地图、资源、主题配置。
   - `src/state.js`：游戏状态、存档、胜负判断。
   - `src/rules.js`：移动、攻击、克制、资源。
   - `src/ai.js`：AI 招募与行动。
   - `src/renderer.js`：Canvas 渲染与素材加载。
   - `src/ui.js`：菜单、教程、HUD、按钮。
   - `src/main.js`：启动与事件协调。
2. 布局优化：
   - 顶部 HUD 信息分组，减少拥挤。
   - 底部兵种栏改成可读卡片，展示图标、费用、定位。
   - 选中单位/城池时显示上下文面板。
3. 渲染优化：
   - 统一 asset manifest。
   - 支持图片素材加载失败时回退 emoji/矢量图形。
   - 背景层、地块层、单位层、UI 标记层分层绘制。

## 阶段 3：批量重绘素材
建议素材清单：
- `assets/backgrounds/normandy-beach.png`：主背景。
- `assets/units/infantry.png`：女性步兵，透明 PNG。
- `assets/units/archer.png`：女性神射手/弓手，透明 PNG。
- `assets/units/cavalry.png`：女性骑兵/摩托侦察兵，透明 PNG。
- `assets/units/shield.png`：女性盾兵/重装工兵，透明 PNG。
- `assets/buildings/city-player.png`：己方据点。
- `assets/buildings/city-enemy.png`：敌方据点。
- `assets/buildings/village.png`：资源点/补给站。
- `assets/ui/logo.png`：新版标题图。

## 阶段 4：接入与验证
1. 接入素材并调整 Canvas 中的尺寸、描边和阵营色。
2. 本地打开游戏做基本回归：开始、移动、攻击、招募、结束回合、存档。
3. 如需发布：提交 Git 分支和 PR/直接推送由用户确认。
