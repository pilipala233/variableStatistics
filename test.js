const add = (a1, b1) => a1 + b1;

const subtract = (a2, b2) => a2 - b2;   // 这个函数没有被调用，在shaking后，会剔除这个函数

const num1 = 9;
const num2 = 100;

const result = add(num1, num2);     //没有匹配的话，内部的指向没处理

function yoo(){

    console.log('zzz');
    function yy1 (){

    }

    
}
yoo()   //没处理


var test123 = function(){

}

cap1.zzz=function(){

}

gg

baba = function(){
    //console.log('zzz');
    function mm1 (){

    }



}

qq = '2';

Fn()

console.log('zzzz')

