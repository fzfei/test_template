# 功能

测试页面模板生成

# 目录结构

```
    ./
    │  .gitignore
    │  app.js   // 入口文件
    │  config.js
    │  handler.js   // 处理文件, 生成页面 ,主要编辑这个文件
    │  package-lock.json
    │  package.json
    │  README.md
    │  yarn.lock
    │
    ├─.vscode
    │      launch.json
    │
    ├─lib
    │      template.js
    │      treeUtils.js
    │
    ├─mock
    │      data.json    // 模拟数据
    │      template.json // 模板数据
```

# 初始化

- 提取工程

```bash
git clone https://github.com/fzfei/testTemp.git
```

- 初始化

```bash
cd testTemp
npm install
```

- 运行

```bash
node  app.js
```

- 调试

运行 `launch.json` 配置中`启动程序`
