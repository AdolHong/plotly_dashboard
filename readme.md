# SQL + Python 数据可视化平台

这是一个基于React和FastAPI的全栈应用，允许用户通过SQL查询和Python代码处理数据，并使用Plotly生成可视化图表。

## 功能特点

- 使用SQL查询DuckDB数据库
- 使用Python代码进一步处理数据
- 支持多种图表类型：柱状图、折线图、散点图、饼图等
- 实时数据预览和可视化

## 技术栈

### 前端
- React.js
- Ant Design UI库
- Plotly.js 可视化库
- Axios 网络请求
- Ace Editor 代码编辑器

### 后端
- Python 3.12
- FastAPI 框架
- DuckDB 数据库
- Plotly 图表生成

## 项目结构

```
project-root/
├── api/               # Python后端代码
│   ├── src/           # 业务逻辑代码
│   │   ├── database/  # 数据库相关代码
│   │   ├── models/    # 数据模型
│   │   └── services/  # 业务服务
│   ├── data/          # 数据库文件
│   ├── tests/         # 单元测试
│   └── main.py        # 主入口文件
├── web/               # React前端代码
│   ├── public/        # 静态资源
│   └── src/           # React组件和逻辑
│       ├── components/# React组件
│       ├── App.js     # 主应用组件
│       └── index.js   # 入口文件
└── devbox.json        # Devbox配置
```

## 使用方法

### 使用Devbox启动项目

1. 确保已安装Devbox
2. 克隆项目并进入项目目录
3. 启动后端服务：
   ```
   devbox run start-backend
   ```
4. 启动前端服务：
   ```
   devbox run start-frontend
   ```
5. 在浏览器中访问 http://localhost:3000

### 使用示例

1. 从下拉菜单中选择一个表
2. 编写SQL查询，例如：`SELECT * FROM sales WHERE region = '华东'`
3. (可选) 编写Python代码处理数据，例如：
   ```python
   # 按类别分组并计算总销售额
   result = df.groupby('category').agg({'price': 'sum', 'quantity': 'sum'}).reset_index()
   ```
4. 配置可视化选项（图表类型、X轴、Y轴等）
5. 点击"生成可视化"按钮

## 开发说明

### 添加新的图表类型

在 `api/src/services/visualization.py` 文件中的 `create_plotly_figure` 函数中添加新的图表类型支持。

### 添加新的数据源

在 `api/src/database/db.py` 文件中的 `init_db` 函数中添加新的表和数据。
