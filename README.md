# 分数分析APP

## 简介

用于分数分析的APP

## 功能

- [x] 分析每次考试成绩
- [x] 绘制饼图 柱状图
- [ ] 对比历史数据
- [ ] 简单添加成绩数据
## 计划
- [x] apk 打包 （感谢steve31）

## 结构目录
```
main/
 ├── index.html
 ├── css/
 │   ├── style.css //主样式
 │   └── chart.css //图表样式
 ├── js/
 │   ├── app.js //主逻辑
 │   ├── chart.js //图表逻辑
 │   └── data.js //数据逻辑
 └── data/
     ├── exams-index.json //数据索引
     ├── 日期1.json //考试数据文件1
     ├── 日期2.json //考试数据文件2
     └── 日期3.json //考试数据文件3
```
## 运行
运行`index.html`即可

## 版权声明

本项目采用 Apache License 2.0 开源协议发布，这意味着您可以自由地使用、复制、修改和分发本软件，包括用于商业用途。

您可以将本项目 fork 到您的个人或组织仓库中进行二次开发和定制化修改，以满足您的特定需求。

根据协议要求，您在分发或修改后的版本中必须保留原有的版权声明和许可声明。您也可以在保留原有声明的基础上，添加您自己的署名信息。

有关 Apache License 2.0 的完整条款，请参阅项目根目录下的 [LICENSE](LICENSE) 文件或访问 [Apache License 2.0 官方页面](https://www.apache.org/licenses/LICENSE-2.0)。