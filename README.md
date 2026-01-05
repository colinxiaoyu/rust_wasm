# Rust + React + WebAssembly 项目

一个展示 Rust WebAssembly 与 React 前端集成的示例项目，使用 Vite 构建工具。

## 项目结构

```
my-project/
├─ package.json          # 根目录脚本（统一管理开发流程）
├─ react-wasm/           # React 前端应用
│  ├─ src/
│  │  ├─ App.jsx         # 主 React 组件
│  │  ├─ main.jsx        # React 入口文件
│  │  └─ wasm_pkg/       # 生成的 WASM 模块（由 wasm-pack 创建）
│  ├─ index.html         # HTML 模板
│  ├─ package.json       # Node.js 依赖
│  └─ vite.config.js     # Vite 配置
└─ wasm_lib/             # Rust WebAssembly 库
   ├─ src/
   │  └─ lib.rs          # Rust 源代码
   └─ Cargo.toml         # Rust 依赖
```

## 环境要求

确保已安装以下工具：

1. **Rust**（最新稳定版）
   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   ```

2. **wasm-pack**（用于将 Rust 编译为 WebAssembly）
   ```bash
   cargo install wasm-pack
   ```

3. **Node.js**（v16 或更高版本）
   - 从 [nodejs.org](https://nodejs.org/) 下载安装

## 快速开始

### 方式一：使用根目录脚本（推荐）

在项目根目录执行：

```bash
# 首次使用：安装依赖并构建
npm run setup

# 启动开发环境（自动构建 WASM 并启动前端）
npm run dev
```

### 方式二：手动执行步骤

#### 步骤 1：构建 Rust WebAssembly 模块

进入 `wasm_lib` 目录并构建 WASM 模块：

```bash
cd wasm_lib
wasm-pack build --target web
```

这将生成一个包含编译后的 WebAssembly 模块的 `pkg` 目录。

#### 步骤 2：复制 WASM 模块到 React 应用

将生成的 `pkg` 目录复制到 React 应用的 `src/wasm_pkg` 文件夹：

```bash
cp -r pkg ../react-wasm/src/wasm_pkg
```

Windows 系统：
```cmd
xcopy /E /I pkg ..\react-wasm\src\wasm_pkg
```

#### 步骤 3：安装 Node.js 依赖

进入 `react-wasm` 目录并安装依赖：

```bash
cd ../react-wasm
npm install
```

#### 步骤 4：启动开发服务器

启动 Vite 开发服务器：

```bash
npm run dev
```

应用将在浏览器中打开，地址为 `http://localhost:5173`。

## 功能特性

演示包含三个交互式示例：

1. **问候函数**：输入你的名字，从 Rust 获取个性化问候语
2. **两数相加**：使用 Rust 执行加法运算
3. **斐波那契计算器**：使用 Rust 算法计算斐波那契数列

所有 Rust 函数都会在浏览器控制台输出日志，打开开发者工具即可查看！

## 可用脚本

### 根目录脚本（推荐使用）

在项目根目录执行：

| 命令 | 说明 |
|------|------|
| `npm run dev` | 一键启动开发环境（构建 WASM + 启动前端） |
| `npm run build` | 构建生产版本（WASM + 前端打包） |
| `npm run preview` | 预览生产构建 |
| `npm run setup` | 首次安装（安装依赖 + 构建 WASM） |
| `npm run watch:wasm` | 重新构建 WASM（修改 Rust 代码后使用） |
| `npm run clean` | 清理所有构建产物和依赖 |

### 前端目录脚本

在 `react-wasm` 目录中：

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动开发服务器 |
| `npm run build` | 构建生产版本 |
| `npm run preview` | 预览生产构建 |

## 工作原理

1. **Rust 代码**：`wasm_lib/src/lib.rs` 文件包含用 `#[wasm_bindgen]` 装饰的 Rust 函数，用于暴露给 JavaScript
2. **WASM 编译**：`wasm-pack` 将 Rust 编译为 WebAssembly 并生成 JavaScript 绑定
3. **React 集成**：React 应用动态导入 WASM 模块并直接调用 Rust 函数
4. **Vite 配置**：Vite 插件处理 WASM 加载和顶层 await 支持

## 开发流程

当你修改 Rust 代码时：

**使用根目录脚本（推荐）：**
```bash
npm run watch:wasm
```

**手动执行：**
1. 重新构建 WASM 模块：`cd wasm_lib && wasm-pack build --target web`
2. 复制新构建：`cp -r pkg ../react-wasm/src/wasm_pkg`
3. Vite 开发服务器将自动重新加载

## 故障排查

### 错误："Cannot find module './wasm_pkg/wasm_lib.js'"

确保已构建 WASM 模块并复制到正确位置：
```bash
# 在项目根目录执行
npm run setup:wasm

# 或手动执行
cd wasm_lib
wasm-pack build --target web
cp -r pkg ../react-wasm/src/wasm_pkg
```

### WASM 加载错误

检查浏览器控制台获取详细错误信息。确保浏览器支持 WebAssembly（所有现代浏览器都支持）。

### 首次运行项目

如果是第一次运行项目，请确保：
1. 已安装所有环境要求（Rust、wasm-pack、Node.js）
2. 执行 `npm run setup` 安装依赖并构建

## 学习资源

- [wasm-bindgen 文档](https://rustwasm.github.io/wasm-bindgen/)
- [Rust 和 WebAssembly 书籍](https://rustwasm.github.io/docs/book/)
- [Vite 文档](https://vitejs.dev/)
- [React 文档](https://react.dev/)

## 许可证

MIT
