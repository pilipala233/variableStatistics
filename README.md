# variableStatistics[停止研究]
用于实现单JS文件编译到浏览器后的变量统计

目前仍在完善，不定时更新，主要是为了统计文件中的js变量以为后面进行实现简单的树摇功能
# 统计实现原理说明（浏览器环境）
1. 文件是编译后统计、只支持单文件、无法判断是否为相同引用（非ES6 模块化没办法）；
2. 针对AST树进行整理，构建成每层紧密相连的树结构，此过程中会开始标识部分垃圾节点（按层处理）；
3. 针对整理后的AST树再次优化，每个节点添加作用域等补充信息，此过程中也会标识部分垃圾节点（按深度）；
4. 最后按深度遍历，完成最后的垃圾节点标记。


# 文件说明
## 核心文件
- index.html  -----浏览器运行html入口
- test.json   -----acorn解析test.js的数据                 
- test.js     -----test.json未解析AST树源文件
## 目前可忽略文件
- index.js    -----【忽略】Node环境下的入口文件js，目前暂时只是用来解析生成AST文件
- test2.js    -----【忽略】我们项目中常见的js文件，用来进一步测试代码使用(在提交历史中查看)                       

# 不足与展望
1. 虽然编译后进行垃圾节点的统计时间以及空间复杂度都高，但是我们项目代码质量维护还是有类似需求的；
2. 我在尽可能的降低时间复杂度以及实现思路的改变；
3. 因为我们的项目是在内网运行，希望完成核心代码优化后，使其包装为浏览器插件运行。

