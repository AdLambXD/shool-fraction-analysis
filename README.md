# 分数分析APP

## 简介

用于分数分析的APP

## 功能

- [x] 分析每次考试成绩
- [x] 绘制饼图 柱状图
- [x] 对比历史数据
- [ ] 简单添加成绩数据
## 计划
- [x] apk 打包 （感谢steve3184）
- [ ] 考虑自动同步安卓和web文件
- [ ] 自动识别表格文件转换json

## 结构目录
```
main/
 ├── Android/ //Android项目
 │    ├── app/
 │    |  └── src/Android/app/src/main/assets
 │    |                               └──“web文件”同根目录相同
 |    └── gradlew.bat //自动构建脚本
 ├── index.html
 ├── exams.json //数据索引
 ├── style.css //主样式
 ├── script.js //主脚本
 └── data/
     ├── 日期1.json //考试数据文件1
     ├── 日期2.json //考试数据文件2
     └── 日期3.json //考试数据文件3
```
## 运行
运行`index.html`即可

## 数据
请先fork本项目，然后修改`exams.json`文件，将数据添加到`data/`目录下。
数据存放在`data/`目录下，数据格式为JSON。
如果不懂其中有模板文件可以参考`data/模板.json`

## 构建apk
运行安卓目录下的`gradlew.bat`即可
运行前请将根目录下的除安卓文件夹的文件移动到安卓目录下的app/src/main/assets下
自动下载文件结束后在gradle文件夹中查看构建

## 版权声明

本项目采用 Apache License 2.0 开源协议发布，这意味着您可以自由地使用、复制、修改和分发本软件，包括用于商业用途。

您可以将本项目 fork 到您的个人或组织仓库中进行二次开发和定制化修改，以满足您的特定需求。

根据协议要求，您在分发或修改后的版本中必须保留原有的版权声明和许可声明。您也可以在保留原有声明的基础上，添加您自己的署名信息。

有关 Apache License 2.0 的完整条款，请参阅项目根目录下的 [LICENSE](LICENSE) 文件或访问 [Apache License 2.0 官方页面](https://www.apache.org/licenses/LICENSE-2.0)。