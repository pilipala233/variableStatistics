// index.js   // 入口文件
const fs = require('fs');
const acron = require('acorn');
//const Visitor = require('./visitor');
//const visitor = new Visitor();
// 获取命令行参数

const args =  process.argv[2];
const buffer = fs.readFileSync(args).toString();
let body = acron.parse(buffer).body;
var yoo={}
fs.writeFileSync(__dirname + '/test.json', JSON.stringify(body));


























// fs.writeFileSync(__dirname + '/test.json', JSON.stringify(body));
// //return;
// const decls = new Map(); // 记录所有申明过的变量
// const calledDecls = []; // 记录调用过的函数
// let code = []; // 存放源代码
// let nouse = [];
// body.forEach(node => {
//     console.log(node)
//     if (node.type === 'VariableDeclaration') {
//         const kind = node.kind;
//         for (const decl of node.declarations) {
//             // todo
//             decls.set(visitor.visitNode(decl.id), visitor.visitVariableDeclarator(decl, kind))
//             if (decl.init.type === 'CallExpression') {
//                 calledDecls.push(visitor.visitIdentifier(decl.init.callee))
//                 const args = decl.init.arguments;
//                 for (const arg of args) {
//                     if (arg.type === 'Identifier') {
//                         calledDecls.push(visitor.visitNode(arg))
//                     }else{
                        
//                     }
//                 }
//             }else{
               

//             }
//         }
//     }
//     if (node.type === 'Identifier') {
//         console.log('竟然运行了')
//         calledDecls.push(node.name);
//     }
//     code.push(visitor.run([node]));
// });
// console.log(decls,calledDecls)
// code = calledDecls.map(c => {
//     if(decls.get(c)){console.log(c);}
//     return decls.get(c);
// }).join('');

// fs.writeFileSync(__dirname + '/test.shaked.js', code)